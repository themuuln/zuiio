import 'dart:convert';

import 'package:isar/isar.dart';

import '../../../lineage/domain/lineage_snapshot.dart';
import '../../../lineage/domain/lineage_root.dart';
import '../../../lineage/domain/lineage_tree_edge.dart';
import '../../../lineage/domain/lineage_tree_node.dart';
import '../../../lineage/domain/lineage_timeline_entry.dart';
import '../../../../shared/domain/horse.dart';

part 'isar_lineage_snapshot.g.dart';

@collection
class IsarLineageSnapshot {
  IsarLineageSnapshot();

  Id id = Isar.autoIncrement;

  /// The root horse id this snapshot belongs to.
  @Index(unique: true, replace: true)
  late String rootId;

  late String treeSummary;

  /// Serialized JSON for the tree nodes list.
  late String treeNodesJson;

  /// Serialized JSON for the tree edges list.
  late String treeEdgesJson;

  /// Serialized JSON for the related horses list.
  late String relatedHorsesJson;

  /// Serialized JSON for the timeline entries list.
  late String timelineJson;

  /// Cached at timestamp.
  late DateTime cachedAt;

  factory IsarLineageSnapshot.fromDomain(LineageSnapshot snapshot) {
    return IsarLineageSnapshot()
      ..rootId = snapshot.root.id
      ..treeSummary = snapshot.treeSummary
      ..treeNodesJson = jsonEncode(
        snapshot.treeNodes.map((n) => _treeNodeToJson(n)).toList(),
      )
      ..treeEdgesJson = jsonEncode(
        snapshot.treeEdges.map((e) => _treeEdgeToJson(e)).toList(),
      )
      ..relatedHorsesJson = jsonEncode(
        snapshot.relatedHorses.map((h) => _horseToJson(h)).toList(),
      )
      ..timelineJson = jsonEncode(
        snapshot.timeline.map((t) => _timelineEntryToJson(t)).toList(),
      )
      ..cachedAt = DateTime.now();
  }

  LineageSnapshot toDomain({required LineageRoot root}) {
    return LineageSnapshot(
      root: root,
      treeSummary: treeSummary,
      treeNodes: (jsonDecode(treeNodesJson) as List<dynamic>)
          .map((e) => _treeNodeFromJson(e as Map<String, dynamic>))
          .toList(),
      treeEdges: (jsonDecode(treeEdgesJson) as List<dynamic>)
          .map((e) => _treeEdgeFromJson(e as Map<String, dynamic>))
          .toList(),
      relatedHorses: (jsonDecode(relatedHorsesJson) as List<dynamic>)
          .map((e) => _horseFromJson(e as Map<String, dynamic>))
          .toList(),
      timeline: (jsonDecode(timelineJson) as List<dynamic>)
          .map((e) => _timelineEntryFromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  // ── JSON serialization helpers for nested types ─────────────────

  static Map<String, dynamic> _treeNodeToJson(LineageTreeNode node) {
    return {
      'id': node.id,
      'name': node.name,
      'relationLabel': node.relationLabel,
      'coat': node.coat,
      'birthYear': node.birthYear,
      'awardCount': node.awardCount,
      'offspringCount': node.offspringCount,
      'isOwnedByHousehold': node.isOwnedByHousehold,
      'generation': node.generation,
      'branchOrder': node.branchOrder,
      'sortOrder': node.sortOrder,
      'isRoot': node.isRoot,
      'hiddenBranchCount': node.hiddenBranchCount,
      'photoUrl': node.photoUrl,
      'sex': node.sex,
      'tamgaNo': node.tamgaNo,
      'region': node.region,
      'speedIndex': node.speedIndex,
    };
  }

  static LineageTreeNode _treeNodeFromJson(Map<String, dynamic> json) {
    return LineageTreeNode(
      id: json['id'] as String,
      name: json['name'] as String,
      relationLabel: json['relationLabel'] as String,
      coat: json['coat'] as String,
      birthYear: json['birthYear'] as int,
      awardCount: json['awardCount'] as int,
      offspringCount: json['offspringCount'] as int,
      isOwnedByHousehold: json['isOwnedByHousehold'] as bool,
      generation: json['generation'] as int,
      branchOrder: json['branchOrder'] as int,
      sortOrder: json['sortOrder'] as int,
      isRoot: json['isRoot'] as bool? ?? false,
      hiddenBranchCount: json['hiddenBranchCount'] as int? ?? 0,
      photoUrl: json['photoUrl'] as String?,
      sex: json['sex'] as String?,
      tamgaNo: json['tamgaNo'] as String?,
      region: json['region'] as String?,
      speedIndex: (json['speedIndex'] as num?)?.toDouble(),
    );
  }

  static Map<String, dynamic> _treeEdgeToJson(LineageTreeEdge edge) {
    return {'fromId': edge.fromId, 'toId': edge.toId, 'type': edge.type.name};
  }

  static LineageTreeEdge _treeEdgeFromJson(Map<String, dynamic> json) {
    return LineageTreeEdge(
      fromId: json['fromId'] as String,
      toId: json['toId'] as String,
      type: LineageTreeRelationType.values.byName(json['type'] as String),
    );
  }

  static Map<String, dynamic> _horseToJson(Horse horse) {
    return horse.toJson();
  }

  static Horse _horseFromJson(Map<String, dynamic> json) {
    return Horse.fromJson(json);
  }

  static Map<String, dynamic> _timelineEntryToJson(LineageTimelineEntry entry) {
    return {
      'year': entry.year,
      'title': entry.title,
      'description': entry.description,
    };
  }

  static LineageTimelineEntry _timelineEntryFromJson(
    Map<String, dynamic> json,
  ) {
    return LineageTimelineEntry(
      year: json['year'] as int,
      title: json['title'] as String,
      description: json['description'] as String,
    );
  }
}
