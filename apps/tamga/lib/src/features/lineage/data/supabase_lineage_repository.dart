import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../shared/domain/horse.dart';
import '../domain/lineage_root.dart';
import '../domain/lineage_snapshot.dart';
import '../domain/lineage_timeline_entry.dart';
import '../domain/lineage_tree_edge.dart';
import '../domain/lineage_tree_node.dart';
import 'lineage_repository.dart';

/// Supabase cloud implementation of [LineageRepository].
///
/// Fetches lineage roots from the `horses` table where [lineage_root_id] is
/// set, and builds complete [LineageSnapshot]s by traversing ancestor and
/// descendant chains via the `pedigree_links` table.
class SupabaseLineageRepository with SupabaseRepositoryMixin implements LineageRepository {
  SupabaseLineageRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;

  @override
  SupabaseClient? get client => _client;

  // ── Constants ──────────────────────────────────────────────────────

  static const _maxGenerations = 5;

  /// Fetches a single horse row by [id] from the `horses` table.
  Future<Map<String, dynamic>?> _fetchHorseRow(String id) async {
    final client = _client;
    if (client == null) return null;

    final response = await client.from('horses').select().eq('id', id);

    final rows = response as List<dynamic>;
    if (rows.isEmpty) return null;
    return rows.first as Map<String, dynamic>;
  }

  /// Converts a raw `horses` row map to a [LineageRoot].
  LineageRoot _rowToLineageRoot(Map<String, dynamic> row) {
    return LineageRoot(
      id: row['id'] as String,
      name: row['name'] as String,
      coat: row['coat'] as String? ?? '',
      birthYear: row['birth_year'] as int? ?? 0,
      offspringCount: row['offspring_count'] as int? ?? 0,
      awardCount: row['award_count'] as int? ?? 0,
      notes: row['notes'] as String? ?? '',
    );
  }

  /// Converts a raw `horses` row map to a [Horse] domain model.
  Horse _rowToHorse(Map<String, dynamic> row) {
    return Horse.fromSupabaseJson(row);
  }

  /// Converts a raw `horses` row map to a [LineageTreeNode].
  LineageTreeNode _rowToTreeNode({
    required Map<String, dynamic> row,
    required String relationLabel,
    required int generation,
    required int branchOrder,
    bool isRoot = false,
  }) {
    final gender = row['gender'] as String?;
    return LineageTreeNode(
      id: row['id'] as String,
      name: row['name'] as String,
      relationLabel: relationLabel,
      coat: row['coat'] as String? ?? '',
      birthYear: row['birth_year'] as int? ?? 0,
      awardCount: row['award_count'] as int? ?? 0,
      offspringCount: row['offspring_count'] as int? ?? 0,
      isOwnedByHousehold: row['is_owned_by_household'] as bool? ?? true,
      generation: generation,
      branchOrder: branchOrder,
      sortOrder: 0,
      isRoot: isRoot,
      sex: gender,
      region: row['region'] as String?,
    );
  }

  /// Generates a tree summary string based on the snapshot data.
  String _buildTreeSummary({
    required LineageRoot root,
    required int ancestorsCount,
    required int descendantsCount,
    required int generationsBack,
    required int generationsForward,
  }) {
    if (ancestorsCount == 0 && descendantsCount == 0) {
      return '${root.name} морь удам угсаагүй байна. / ${root.name} has no recorded lineage.';
    }

    final parts = <String>[];
    if (ancestorsCount > 0) {
      parts.add('$generationsBack үеийн $ancestorsCount өвөг дээдэс');
    }
    if (descendantsCount > 0) {
      parts.add('$generationsForward үеийн $descendantsCount үр удам');
    }

    return '${root.name} шугамд ${parts.join(', ')} бүртгэгдсэн байна. / '
        'Lineage of ${root.name} includes ${parts.join(', ')}.';
  }

  /// Builds a timeline from the root, ancestors, and descendant horse data.
  List<LineageTimelineEntry> _buildTimeline({
    required Map<String, dynamic> rootRow,
    required List<Map<String, dynamic>> ancestorRows,
    required List<Map<String, dynamic>> descendantRows,
  }) {
    final entries = <LineageTimelineEntry>[];

    // Root horse birth
    final rootBirthYear = rootRow['birth_year'] as int?;
    if (rootBirthYear != null && rootBirthYear > 0) {
      entries.add(
        LineageTimelineEntry(
          year: rootBirthYear,
          title: 'Төрсөн / Born',
          description:
              '${rootRow['name']} төрсөн. / ${rootRow['name']} was born.',
        ),
      );
    }

    // Ancestor milestones
    for (final ancestor in ancestorRows) {
      final year = ancestor['birth_year'] as int?;
      if (year != null && year > 0) {
        entries.add(
          LineageTimelineEntry(
            year: year,
            title: 'Өвөг төрсөн / Ancestor born',
            description:
                '${ancestor['name']} (${ancestor['coat'] ?? ''}) төрсөн. / '
                '${ancestor['name']} (${ancestor['coat'] ?? ''}) was born.',
          ),
        );
      }
    }

    // Descendant milestones
    for (final descendant in descendantRows) {
      final year = descendant['birth_year'] as int?;
      if (year != null && year > 0) {
        entries.add(
          LineageTimelineEntry(
            year: year,
            title: 'Үр удам төрсөн / Descendant born',
            description:
                '${descendant['name']} (${descendant['coat'] ?? ''}) төрсөн. / '
                '${descendant['name']} (${descendant['coat'] ?? ''}) was born.',
          ),
        );
      }
    }

    // Sort by year ascending
    entries.sort((a, b) => a.year.compareTo(b.year));
    return entries;
  }

  // ── LineageRepository ──────────────────────────────────────────────

  @override
  Future<Result<List<LineageRoot>>> fetchRoots() async {
    try {
      final client = _client;
      if (client == null) {
        return const Result.ok([]);
      }

      // Fetch horses where lineage_root_id is NOT NULL
      final response = await client
          .from('horses')
          .select()
          .not('lineage_root_id', 'is', null)
          .order('name');

      final rows = (response as List<dynamic>).cast<Map<String, dynamic>>();

      // Deduplicate by lineage_root_id to get unique roots
      final seenIds = <String>{};
      final roots = <LineageRoot>[];
      for (final row in rows) {
        final id = row['id'] as String;
        if (seenIds.add(id)) {
          roots.add(_rowToLineageRoot(row));
        }
      }

      return Result.ok(roots);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<LineageSnapshot>> fetchSnapshot(String rootId) async {
    try {
      final client = _client;
      if (client == null) {
        return Result.fail(noClientError());
      }

      // 1. Fetch the root horse
      final rootRow = await _fetchHorseRow(rootId);
      if (rootRow == null) {
        return Result.fail(
          const AppException(
            message: 'Морь олдсонгүй / Horse not found',
            code: 'HORSE_NOT_FOUND',
          ),
        );
      }

      final root = _rowToLineageRoot(rootRow);

      // 2. Traverse ancestors via pedigree_links
      final ancestorResult = await _traverseAncestors(rootId);
      final ancestorNodes = ancestorResult.nodes;
      final ancestorEdges = ancestorResult.edges;
      final ancestorHorseRows = ancestorResult.horseRows;

      // 3. Traverse descendants via pedigree_links
      final descendantResult = await _traverseDescendants(rootId);
      final descendantNodes = descendantResult.nodes;
      final descendantEdges = descendantResult.edges;
      final descendantHorseRows = descendantResult.horseRows;

      // 4. Build the root node
      final rootNode = _rowToTreeNode(
        row: rootRow,
        relationLabel: 'Root азарга / Root sire',
        generation: 0,
        branchOrder: 0,
        isRoot: true,
      );

      // 5. Collect all nodes and edges
      final allNodes = [rootNode, ...ancestorNodes, ...descendantNodes];

      final allEdges = [...ancestorEdges, ...descendantEdges];

      // 6. Build relatedHorses (all unique horses, deduplicated by id)
      final seenIds = <String>{};
      final combinedHorseRows = <Map<String, dynamic>>[];
      for (final row in [...ancestorHorseRows, ...descendantHorseRows]) {
        final id = row['id'] as String;
        if (seenIds.add(id)) {
          combinedHorseRows.add(row);
        }
      }

      final relatedHorses = combinedHorseRows.map(_rowToHorse).toList();

      // 7. Build timeline
      final timeline = _buildTimeline(
        rootRow: rootRow,
        ancestorRows: ancestorHorseRows,
        descendantRows: descendantHorseRows,
      );

      // 8. Build treeSummary
      final treeSummary = _buildTreeSummary(
        root: root,
        ancestorsCount: ancestorNodes.length,
        descendantsCount: descendantNodes.length,
        generationsBack: _maxGenerations,
        generationsForward: _maxGenerations,
      );

      return Result.ok(
        LineageSnapshot(
          root: root,
          treeSummary: treeSummary,
          treeNodes: allNodes,
          treeEdges: allEdges,
          relatedHorses: relatedHorses,
          timeline: timeline,
        ),
      );
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  // ── Ancestor Traversal ─────────────────────────────────────────────

  /// Traverses ancestors of the given [horseId] via `pedigree_links`,
  /// going up to [_maxGenerations] generations.
  Future<_TraversalResult> _traverseAncestors(String horseId) async {
    final nodes = <LineageTreeNode>[];
    final edges = <LineageTreeEdge>[];
    final allHorseRows = <String, Map<String, dynamic>>{};
    final seenHorseIds = <String>{};

    // BFS ancestor traversal
    var currentIds = [horseId];
    var currentGeneration = -1;
    var visited = <String>{};

    while (currentIds.isNotEmpty &&
        currentGeneration.abs() <= _maxGenerations) {
      final nextIds = <String>[];
      var branchIndex = 0;

      final linkRows = await _fetchPedigreeLinks(currentIds);

      for (final link in linkRows) {
        final horseIdFromLink = link['horse_id'] as String;
        final parentId = link['parent_id'] as String;
        final relation = link['relation'] as String;

        if (visited.contains(parentId)) continue;
        visited.add(parentId);

        // Fetch parent horse data if not already fetched
        if (seenHorseIds.add(parentId)) {
          final parentRow = await _fetchHorseRow(parentId);
          if (parentRow != null) {
            allHorseRows[parentId] = parentRow;

            final relationLabel = relation == 'sire'
                ? 'Эцэг / Sire'
                : 'Эх / Dam';

            nodes.add(
              _rowToTreeNode(
                row: parentRow,
                relationLabel: currentGeneration == -1
                    ? relationLabel
                    : (currentGeneration == -2
                          ? (relation == 'sire'
                                ? 'Өвөг / Grandsire'
                                : 'Эмэг эх / Granddam')
                          : '$currentGeneration үеийн өвөг'),
                generation: currentGeneration,
                branchOrder: branchIndex++,
              ),
            );

            edges.add(
              LineageTreeEdge(
                fromId: parentId,
                toId: horseIdFromLink,
                type: relation == 'sire'
                    ? LineageTreeRelationType.sire
                    : LineageTreeRelationType.dam,
              ),
            );

            nextIds.add(parentId);
          }
        }
      }

      currentIds = nextIds;
      currentGeneration--;
    }

    return _TraversalResult(
      nodes: nodes,
      edges: edges,
      horseRows: allHorseRows.values.toList(),
    );
  }

  /// Traverses descendants of the given [horseId] via `pedigree_links`,
  /// going down up to [_maxGenerations] generations.
  Future<_TraversalResult> _traverseDescendants(String horseId) async {
    final nodes = <LineageTreeNode>[];
    final edges = <LineageTreeEdge>[];
    final allHorseRows = <String, Map<String, dynamic>>{};
    final seenHorseIds = <String>{};

    // BFS descendant traversal: look for pedigree_links where parent_id = horseId
    var currentIds = [horseId];
    var currentGeneration = 1;
    var visited = <String>{};

    while (currentIds.isNotEmpty && currentGeneration <= _maxGenerations) {
      final nextIds = <String>[];
      var branchIndex = 0;

      final offspringLinkRows = await _fetchOffspringLinks(currentIds);
      // offspringLinkRows: rows where parent_id is in currentIds
      // Each row has horse_id = the offspring, relation = 'sire' or 'dam'

      for (final link in offspringLinkRows) {
        final offspringId = link['horse_id'] as String;
        final parentId = link['parent_id'] as String;

        if (visited.contains(offspringId)) continue;
        visited.add(offspringId);

        // Fetch offspring horse data
        if (seenHorseIds.add(offspringId)) {
          final offspringRow = await _fetchHorseRow(offspringId);
          if (offspringRow != null) {
            allHorseRows[offspringId] = offspringRow;

            final relationLabel = currentGeneration == 1
                ? 'Үр / Offspring'
                : (currentGeneration == 2
                      ? 'Ач / Grand-offspring'
                      : '$currentGeneration үеийн үр удам');

            nodes.add(
              _rowToTreeNode(
                row: offspringRow,
                relationLabel: relationLabel,
                generation: currentGeneration,
                branchOrder: branchIndex++,
              ),
            );

            edges.add(
              LineageTreeEdge(
                fromId: parentId,
                toId: offspringId,
                type: LineageTreeRelationType.offspring,
              ),
            );

            nextIds.add(offspringId);
          }
        }
      }

      currentIds = nextIds;
      currentGeneration++;
    }

    return _TraversalResult(
      nodes: nodes,
      edges: edges,
      horseRows: allHorseRows.values.toList(),
    );
  }

  /// Fetches pedigree_link rows where [horseIds] match `horse_id` (i.e. get parents).
  Future<List<Map<String, dynamic>>> _fetchPedigreeLinks(
    List<String> horseIds,
  ) async {
    final client = _client;
    if (client == null || horseIds.isEmpty) return [];

    final response = await client
        .from('pedigree_links')
        .select()
        .inFilter('horse_id', horseIds);

    return (response as List<dynamic>).cast<Map<String, dynamic>>();
  }

  /// Fetches pedigree_link rows where [parentIds] match `parent_id` (i.e. get offspring).
  Future<List<Map<String, dynamic>>> _fetchOffspringLinks(
    List<String> parentIds,
  ) async {
    final client = _client;
    if (client == null || parentIds.isEmpty) return [];

    final response = await client
        .from('pedigree_links')
        .select()
        .inFilter('parent_id', parentIds);

    return (response as List<dynamic>).cast<Map<String, dynamic>>();
  }

  // ── CRUD operations ────────────────────────────────────────────────

  @override
  Future<Result<void>> addParentLink({
    required String horseId,
    required String parentId,
    required String relation,
  }) async {
    try {
      final client = _client;
      if (client == null) return Result.fail(noClientError());

      // Insert a pedigree_link record
      await client.from('pedigree_links').insert({
        'horse_id': horseId,
        'parent_id': parentId,
        'relation': relation,
      });

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> removeParentLink({
    required String horseId,
    required String parentId,
  }) async {
    try {
      final client = _client;
      if (client == null) return Result.fail(noClientError());

      // Delete the pedigree_link record
      await client
          .from('pedigree_links')
          .delete()
          .eq('horse_id', horseId)
          .eq('parent_id', parentId);

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }

  @override
  Future<Result<void>> updateHorseLineageInfo({
    required String horseId,
    String? name,
    String? coat,
    int? birthYear,
    String? notes,
  }) async {
    try {
      final client = _client;
      if (client == null) return Result.fail(noClientError());

      final updateData = <String, dynamic>{};
      if (name != null) updateData['name'] = name;
      if (coat != null) updateData['coat'] = coat;
      if (birthYear != null) updateData['birth_year'] = birthYear;
      if (notes != null) updateData['notes'] = notes;

      if (updateData.isNotEmpty) {
        await client.from('horses').update(updateData).eq('id', horseId);
      }

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(wrapError(e));
    }
  }
}

/// Internal result type for traversal operations.
class _TraversalResult {
  const _TraversalResult({
    required this.nodes,
    required this.edges,
    required this.horseRows,
  });

  final List<LineageTreeNode> nodes;
  final List<LineageTreeEdge> edges;
  final List<Map<String, dynamic>> horseRows;
}
