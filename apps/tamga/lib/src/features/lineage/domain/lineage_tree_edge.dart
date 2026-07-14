enum LineageTreeRelationType { sire, dam, offspring }

class LineageTreeEdge {
  const LineageTreeEdge({
    required this.fromId,
    required this.toId,
    required this.type,
  });

  final String fromId;
  final String toId;
  final LineageTreeRelationType type;
}
