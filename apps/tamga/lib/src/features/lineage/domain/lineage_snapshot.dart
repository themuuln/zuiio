import '../../../shared/domain/horse.dart';
import 'lineage_root.dart';
import 'lineage_tree_edge.dart';
import 'lineage_tree_node.dart';
import 'lineage_timeline_entry.dart';

class LineageSnapshot {
  const LineageSnapshot({
    required this.root,
    required this.treeSummary,
    required this.treeNodes,
    required this.treeEdges,
    required this.relatedHorses,
    required this.timeline,
  });

  final LineageRoot root;
  final String treeSummary;
  final List<LineageTreeNode> treeNodes;
  final List<LineageTreeEdge> treeEdges;
  final List<Horse> relatedHorses;
  final List<LineageTimelineEntry> timeline;
}
