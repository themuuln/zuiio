import 'lineage_root.dart';
import 'lineage_tree_node.dart';

// ── Supabase Serialization Extensions ──

/// Extension adding Supabase-specific (snake_case) deserialization to
/// [LineageRoot].
extension LineageRootSupabase on LineageRoot {
  /// Deserializes a [LineageRoot] from a Supabase JSON row (snake_case keys).
  static LineageRoot fromSupabaseJson(Map<String, dynamic> json) {
    return LineageRoot(
      id: json['id'] as String,
      name: json['name'] as String,
      coat: json['coat'] as String? ?? '',
      birthYear: json['birth_year'] as int? ?? 0,
      offspringCount: json['offspring_count'] as int? ?? 0,
      awardCount: json['award_count'] as int? ?? 0,
      notes: json['notes'] as String? ?? '',
    );
  }
}

/// Extension adding Supabase-specific (snake_case) deserialization to
/// [LineageTreeNode].
extension LineageTreeNodeSupabase on LineageTreeNode {
  /// Deserializes a [LineageTreeNode] from a Supabase JSON row (snake_case
  /// keys), with additional layout parameters.
  static LineageTreeNode fromSupabaseJson({
    required Map<String, dynamic> row,
    required String relationLabel,
    required int generation,
    required int branchOrder,
    bool isRoot = false,
  }) {
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
      sex: row['gender'] as String?,
      region: row['region'] as String?,
    );
  }
}
