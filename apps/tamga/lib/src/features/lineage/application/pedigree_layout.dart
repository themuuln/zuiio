import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../domain/lineage_snapshot.dart';
import '../domain/lineage_tree_edge.dart';
import '../domain/lineage_tree_node.dart';

class PedigreeNodeVm {
  const PedigreeNodeVm({
    required this.id,
    required this.name,
    required this.relationLabel,
    required this.coat,
    required this.birthYear,
    required this.awardCount,
    required this.offspringCount,
    required this.isOwnedByHousehold,
    required this.generation,
    required this.isRoot,
    required this.hiddenBranchCount,
    required this.rect,
    this.photoUrl,
    this.sex,
    this.tamgaNo,
    this.region,
    this.speedIndex,
  });

  final String id;
  final String name;
  final String relationLabel;
  final String coat;
  final int birthYear;
  final int awardCount;
  final int offspringCount;
  final bool isOwnedByHousehold;
  final int generation;
  final bool isRoot;
  final int hiddenBranchCount;
  final Rect rect;

  /// Зургийн URL.
  final String? photoUrl;

  /// Хүйс: 'stallion' | 'mare' | 'gelding' | 'foal'.
  final String? sex;

  /// Тамгын дугаар.
  final String? tamgaNo;

  /// Нутаг / аймаг.
  final String? region;

  /// Хурдын индекс (км/мин).
  final double? speedIndex;
}

class PedigreeEdgeVm {
  const PedigreeEdgeVm({
    required this.fromId,
    required this.toId,
    required this.type,
  });

  final String fromId;
  final String toId;
  final LineageTreeRelationType type;
}

class PedigreeLayoutResult {
  const PedigreeLayoutResult({
    required this.canvasSize,
    required this.nodes,
    required this.edges,
  });

  final Size canvasSize;
  final List<PedigreeNodeVm> nodes;
  final List<PedigreeEdgeVm> edges;

  /// The full bounding rect of the canvas.
  Rect get canvasRect => Offset.zero & canvasSize;

  PedigreeNodeVm? nodeById(String id) {
    for (final node in nodes) {
      if (node.id == id) {
        return node;
      }
    }

    return null;
  }
}

class _LayoutNode {
  _LayoutNode({required this.id, required this.generation});

  final String id;
  final int generation;

  List<_LayoutNode> children = [];
  _LayoutNode? parent;

  double prelim = 0;
  double mod = 0;
  double x = 0;

  _LayoutNode? thread;
  _LayoutNode? ancestor;
  double change = 0;
  double shift = 0;
  int number = 0;

  _LayoutNode? getLeftSibling() {
    if (parent == null) return null;
    final index = parent!.children.indexOf(this);
    if (index > 0) {
      return parent!.children[index - 1];
    }
    return null;
  }

  _LayoutNode? nextLeft() {
    if (children.isNotEmpty) {
      return children.first;
    }
    return thread;
  }

  _LayoutNode? nextRight() {
    if (children.isNotEmpty) {
      return children.last;
    }
    return thread;
  }
}

void _initializeNodes(_LayoutNode node) {
  node.ancestor = node;
  node.prelim = 0;
  node.mod = 0;
  node.x = 0;
  node.change = 0;
  node.shift = 0;
  node.thread = null;
  for (var i = 0; i < node.children.length; i++) {
    final child = node.children[i];
    child.number = i;
    _initializeNodes(child);
  }
}

void _firstWalk(_LayoutNode v, double distance) {
  if (v.children.isEmpty) {
    final leftSibling = v.getLeftSibling();
    if (leftSibling != null) {
      v.prelim = leftSibling.prelim + distance;
    } else {
      v.prelim = 0;
    }
  } else {
    var defaultAncestor = v.children.first;
    for (final child in v.children) {
      _firstWalk(child, distance);
      defaultAncestor = _apportion(child, defaultAncestor, distance);
    }

    _executeShifts(v);

    final midpoint = (v.children.first.prelim + v.children.last.prelim) / 2.0;
    final leftSibling = v.getLeftSibling();
    if (leftSibling != null) {
      v.prelim = leftSibling.prelim + distance;
      v.mod = v.prelim - midpoint;
    } else {
      v.prelim = midpoint;
    }
  }
}

_LayoutNode _apportion(
  _LayoutNode v,
  _LayoutNode defaultAncestor,
  double distance,
) {
  final w = v.getLeftSibling();
  if (w != null) {
    var vip = v;
    var vop = v;
    var vim = w;
    var vom = v.parent!.children.first;

    var sip = vip.mod;
    var sop = vop.mod;
    var sim = vim.mod;
    var som = vom.mod;

    while (vim.nextRight() != null && vip.nextLeft() != null) {
      vim = vim.nextRight()!;
      vip = vip.nextLeft()!;
      vom = vom.nextLeft()!;
      vop = vop.nextRight()!;

      vop.ancestor = v;
      final shift = (vim.prelim + sim) - (vip.prelim + sip) + distance;
      if (shift > 0) {
        _moveSubtree(_ancestorMember(vim, v, defaultAncestor), v, shift);
        sip += shift;
        sop += shift;
      }
      sim += vim.mod;
      sip += vip.mod;
      som += vom.mod;
      sop += vop.mod;
    }

    if (vim.nextRight() != null && vop.nextRight() == null) {
      vop.thread = vim.nextRight();
      vop.mod += sim - sop;
    }
    if (vip.nextLeft() != null && vom.nextLeft() == null) {
      vom.thread = vip.nextLeft();
      vom.mod += sip - som;
      defaultAncestor = v;
    }
  }
  return defaultAncestor;
}

void _moveSubtree(_LayoutNode wm, _LayoutNode wp, double shift) {
  final subtrees = wp.number - wm.number;
  if (subtrees > 0) {
    wp.change -= shift / subtrees;
    wp.shift += shift;
    wm.change += shift / subtrees;
  }
  wp.prelim += shift;
  wp.mod += shift;
}

void _executeShifts(_LayoutNode v) {
  var shift = 0.0;
  var change = 0.0;
  for (var i = v.children.length - 1; i >= 0; i--) {
    final child = v.children[i];
    child.prelim += shift;
    child.mod += shift;
    change += child.change;
    shift += child.shift + change;
  }
}

_LayoutNode _ancestorMember(
  _LayoutNode vim,
  _LayoutNode v,
  _LayoutNode defaultAncestor,
) {
  if (vim.ancestor != null &&
      v.parent != null &&
      v.parent!.children.contains(vim.ancestor)) {
    return vim.ancestor!;
  }
  return defaultAncestor;
}

void _secondWalk(_LayoutNode v, double m, Map<String, double> xCoords) {
  v.x = v.prelim + m;
  xCoords[v.id] = v.x;
  for (final child in v.children) {
    _secondWalk(child, m + v.mod, xCoords);
  }
}

_LayoutNode _buildAncestorTree(
  LineageTreeNode current,
  Set<String> visited,
  Map<String, List<String>> adj,
  Map<String, LineageTreeNode> nodeMap,
) {
  visited.add(current.id);
  final layoutNode = _LayoutNode(
    id: current.id,
    generation: current.generation,
  );

  final neighbors = adj[current.id] ?? [];
  final ancestors = <LineageTreeNode>[];
  for (final neighborId in neighbors) {
    final neighborNode = nodeMap[neighborId];
    if (neighborNode != null &&
        neighborNode.generation < current.generation &&
        !visited.contains(neighborId)) {
      ancestors.add(neighborNode);
    }
  }

  ancestors.sort((left, right) {
    final byBranch = left.branchOrder.compareTo(right.branchOrder);
    if (byBranch != 0) return byBranch;
    final bySort = left.sortOrder.compareTo(right.sortOrder);
    if (bySort != 0) return bySort;
    return left.name.compareTo(right.name);
  });

  for (final ancestor in ancestors) {
    final childLayoutNode = _buildAncestorTree(ancestor, visited, adj, nodeMap);
    childLayoutNode.parent = layoutNode;
    layoutNode.children.add(childLayoutNode);
  }

  return layoutNode;
}

_LayoutNode _buildDescendantTree(
  LineageTreeNode current,
  Set<String> visited,
  Map<String, List<String>> adj,
  Map<String, LineageTreeNode> nodeMap,
) {
  visited.add(current.id);
  final layoutNode = _LayoutNode(
    id: current.id,
    generation: current.generation,
  );

  final neighbors = adj[current.id] ?? [];
  final descendants = <LineageTreeNode>[];
  for (final neighborId in neighbors) {
    final neighborNode = nodeMap[neighborId];
    if (neighborNode != null &&
        neighborNode.generation > current.generation &&
        !visited.contains(neighborId)) {
      descendants.add(neighborNode);
    }
  }

  descendants.sort((left, right) {
    final byBranch = left.branchOrder.compareTo(right.branchOrder);
    if (byBranch != 0) return byBranch;
    final bySort = left.sortOrder.compareTo(right.sortOrder);
    if (bySort != 0) return bySort;
    return left.name.compareTo(right.name);
  });

  for (final descendant in descendants) {
    final childLayoutNode = _buildDescendantTree(
      descendant,
      visited,
      adj,
      nodeMap,
    );
    childLayoutNode.parent = layoutNode;
    layoutNode.children.add(childLayoutNode);
  }

  return layoutNode;
}

_LayoutNode _buildDownwardTree(
  LineageTreeNode current,
  Set<String> visited,
  Map<String, List<String>> adj,
  Map<String, LineageTreeNode> nodeMap,
) {
  visited.add(current.id);
  final layoutNode = _LayoutNode(
    id: current.id,
    generation: current.generation,
  );

  final neighbors = adj[current.id] ?? [];
  final children = <LineageTreeNode>[];
  for (final neighborId in neighbors) {
    final neighborNode = nodeMap[neighborId];
    if (neighborNode != null &&
        neighborNode.generation > current.generation &&
        !visited.contains(neighborId)) {
      children.add(neighborNode);
    }
  }

  children.sort((left, right) {
    final byBranch = left.branchOrder.compareTo(right.branchOrder);
    if (byBranch != 0) return byBranch;
    final bySort = left.sortOrder.compareTo(right.sortOrder);
    if (bySort != 0) return bySort;
    return left.name.compareTo(right.name);
  });

  for (final child in children) {
    final childLayoutNode = _buildDownwardTree(child, visited, adj, nodeMap);
    childLayoutNode.parent = layoutNode;
    layoutNode.children.add(childLayoutNode);
  }

  return layoutNode;
}

PedigreeLayoutResult buildPedigreeLayout({
  required LineageSnapshot snapshot,
  required int? maxGeneration,
}) {
  final visibleNodes = snapshot.treeNodes.where((node) {
    if (maxGeneration == null) {
      return true;
    }
    return node.generation.abs() <= maxGeneration;
  }).toList();

  if (visibleNodes.isEmpty) {
    return const PedigreeLayoutResult(
      canvasSize: Size(0, 0),
      nodes: [],
      edges: [],
    );
  }

  final visibleNodeIds = visibleNodes.map((node) => node.id).toSet();
  final visibleEdges = snapshot.treeEdges
      .where(
        (edge) =>
            visibleNodeIds.contains(edge.fromId) &&
            visibleNodeIds.contains(edge.toId),
      )
      .toList();

  const nodeWidth = 188.0;
  const nodeHeight = 152.0;
  const horizontalGap = 24.0;
  const verticalGap = 64.0;
  const distance = nodeWidth + horizontalGap; // 212.0

  // 1. Find root node
  LineageTreeNode? rootNode;
  for (final node in visibleNodes) {
    if (node.isRoot) {
      rootNode = node;
      break;
    }
  }
  if (rootNode == null) {
    for (final node in visibleNodes) {
      if (node.generation == 0) {
        rootNode = node;
        break;
      }
    }
  }
  rootNode ??= visibleNodes.first;

  // 2. Build adjacency list and node map
  final nodeMap = {for (final node in visibleNodes) node.id: node};
  final adj = <String, List<String>>{};
  for (final edge in visibleEdges) {
    adj.putIfAbsent(edge.fromId, () => []).add(edge.toId);
    adj.putIfAbsent(edge.toId, () => []).add(edge.fromId);
  }

  // 3. Build trees
  final visitedAncestors = {rootNode.id};
  final ancestorTree = _buildAncestorTree(
    rootNode,
    visitedAncestors,
    adj,
    nodeMap,
  );

  final visitedDescendants = {rootNode.id};
  final descendantTree = _buildDescendantTree(
    rootNode,
    visitedDescendants,
    adj,
    nodeMap,
  );

  // 4. Find disconnected components
  final visitedAll = {...visitedAncestors, ...visitedDescendants};
  final remainingNodes = visibleNodes
      .where((n) => !visitedAll.contains(n.id))
      .toList();

  final otherTrees = <_LayoutNode>[];
  final visitedOther = <String>{};

  for (final node in remainingNodes) {
    if (visitedOther.contains(node.id)) continue;

    final component = <LineageTreeNode>[];
    final queue = [node];
    final componentVisited = {node.id};

    while (queue.isNotEmpty) {
      final curr = queue.removeLast();
      component.add(curr);
      final neighbors = adj[curr.id] ?? [];
      for (final neighborId in neighbors) {
        if (!visitedAll.contains(neighborId) &&
            !componentVisited.contains(neighborId)) {
          final neighborNode = nodeMap[neighborId];
          if (neighborNode != null) {
            componentVisited.add(neighborId);
            queue.add(neighborNode);
          }
        }
      }
    }

    component.sort(
      (left, right) => left.generation.compareTo(right.generation),
    );
    final compRoot = component.first;

    final compVisited = {compRoot.id};
    final compTree = _buildDownwardTree(compRoot, compVisited, adj, nodeMap);
    otherTrees.add(compTree);
    visitedOther.addAll(componentVisited);
  }

  // 5. Layout Ancestor Tree
  _initializeNodes(ancestorTree);
  _firstWalk(ancestorTree, distance);
  final ancestorXCoords = <String, double>{};
  _secondWalk(ancestorTree, 0.0, ancestorXCoords);

  // 6. Layout Descendant Tree
  _initializeNodes(descendantTree);
  _firstWalk(descendantTree, distance);
  final descendantXCoords = <String, double>{};
  _secondWalk(descendantTree, 0.0, descendantXCoords);

  // 7. Layout other trees
  final otherXCoordsList = <Map<String, double>>[];
  for (final tree in otherTrees) {
    _initializeNodes(tree);
    _firstWalk(tree, distance);
    final otherXCoords = <String, double>{};
    _secondWalk(tree, 0.0, otherXCoords);
    otherXCoordsList.add(otherXCoords);
  }

  // 8. Merge and align coordinates
  final mergedXCoords = <String, double>{};

  final xA = ancestorXCoords[rootNode.id] ?? 0.0;
  for (final entry in ancestorXCoords.entries) {
    mergedXCoords[entry.key] = entry.value - xA;
  }

  final xD = descendantXCoords[rootNode.id] ?? 0.0;
  for (final entry in descendantXCoords.entries) {
    mergedXCoords[entry.key] = entry.value - xD;
  }

  // Position other trees to the right
  var mainMaxX = 0.0;
  if (mergedXCoords.isNotEmpty) {
    mainMaxX = mergedXCoords.values.reduce(math.max);
  }

  var nextTreeStartX = mainMaxX + distance;
  for (var i = 0; i < otherTrees.length; i++) {
    final otherCoords = otherXCoordsList[i];
    final treeRootId = otherTrees[i].id;
    final rootX = otherCoords[treeRootId] ?? 0.0;
    final shift = nextTreeStartX - rootX;

    var treeMaxX = double.negativeInfinity;
    for (final entry in otherCoords.entries) {
      final shiftedX = entry.value + shift;
      mergedXCoords[entry.key] = shiftedX;
      treeMaxX = math.max(treeMaxX, shiftedX);
    }

    if (treeMaxX != double.negativeInfinity) {
      nextTreeStartX = treeMaxX + distance;
    }
  }

  // 9. Normalize to positive coordinates and build VM nodes
  final minX = mergedXCoords.values.reduce(math.min);
  final maxX = mergedXCoords.values.reduce(math.max);
  final canvasWidth = (maxX - minX) + nodeWidth;

  final generations = visibleNodes.map((n) => n.generation).toList()..sort();
  final minGeneration = generations.first;
  final maxGenerationSeen = generations.last;

  final canvasHeight =
      ((maxGenerationSeen - minGeneration + 1) * (nodeHeight + verticalGap)) -
      verticalGap;

  // Preserve the original sorting of visibleNodes
  visibleNodes.sort((left, right) {
    final byGeneration = left.generation.compareTo(right.generation);
    if (byGeneration != 0) {
      return byGeneration;
    }

    final byBranch = left.branchOrder.compareTo(right.branchOrder);
    if (byBranch != 0) {
      return byBranch;
    }

    final bySort = left.sortOrder.compareTo(right.sortOrder);
    if (bySort != 0) {
      return bySort;
    }

    return left.name.compareTo(right.name);
  });

  final nodes = <PedigreeNodeVm>[];
  for (final node in visibleNodes) {
    final x = mergedXCoords[node.id] ?? 0.0;
    final left = x - minX;
    final top =
        (node.generation - minGeneration).toDouble() *
        (nodeHeight + verticalGap);

    nodes.add(
      PedigreeNodeVm(
        id: node.id,
        name: node.name,
        relationLabel: node.relationLabel,
        coat: node.coat,
        birthYear: node.birthYear,
        awardCount: node.awardCount,
        offspringCount: node.offspringCount,
        isOwnedByHousehold: node.isOwnedByHousehold,
        generation: node.generation,
        isRoot: node.isRoot,
        hiddenBranchCount: node.hiddenBranchCount,
        rect: Rect.fromLTWH(left, top, nodeWidth, nodeHeight),
        photoUrl: node.photoUrl,
        sex: node.sex,
        tamgaNo: node.tamgaNo,
        region: node.region,
        speedIndex: node.speedIndex,
      ),
    );
  }

  return PedigreeLayoutResult(
    canvasSize: Size(canvasWidth, canvasHeight),
    nodes: nodes,
    edges: [
      for (final edge in visibleEdges)
        PedigreeEdgeVm(fromId: edge.fromId, toId: edge.toId, type: edge.type),
    ],
  );
}
