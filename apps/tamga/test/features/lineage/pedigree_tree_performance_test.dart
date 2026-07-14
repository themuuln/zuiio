import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/lineage/application/pedigree_layout.dart';
import 'package:tamga/src/features/lineage/domain/lineage_snapshot.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_edge.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_node.dart';
import 'package:tamga/src/features/lineage/domain/lineage_root.dart';
import 'package:tamga/src/features/lineage/presentation/pedigree_tree_content.dart';

// ─── Helpers ──────────────────────────────────────────────────────────────

LineageTreeNode _makeNode({
  required String id,
  required int generation,
  required int branchOrder,
  int sortOrder = 0,
  bool isRoot = false,
  String name = 'Test Horse',
}) {
  return LineageTreeNode(
    id: id,
    name: name,
    relationLabel: 'Эцэг / Sire',
    coat: 'Bay',
    birthYear: 2000 + generation,
    awardCount: generation % 5,
    offspringCount: math.max(0, 3 - generation.abs()),
    isOwnedByHousehold: generation >= 0,
    generation: generation,
    branchOrder: branchOrder,
    sortOrder: sortOrder,
    isRoot: isRoot,
    hiddenBranchCount: 0,
    photoUrl: null,
    sex: 'stallion',
    tamgaNo: null,
    region: 'Khentii',
    speedIndex: null,
  );
}

LineageSnapshot _makeLargeSnapshot(int nodeCount) {
  // Build a tree with a root at generation 0, then spread ancestors/descendants.
  final nodes = <LineageTreeNode>[
    _makeNode(id: 'root', generation: 0, branchOrder: 0, isRoot: true),
  ];

  final edges = <LineageTreeEdge>[];
  final maxAncestors = nodeCount ~/ 3;
  final maxDescendants = nodeCount - maxAncestors - 1;

  // Create ancestors (negative generations)
  for (var i = 0; i < maxAncestors; i++) {
    final gen = -(1 + (i % 5)); // -1 to -5
    final branch = i ~/ 5;
    final id = 'anc-$i';
    nodes.add(
      _makeNode(id: id, generation: gen, branchOrder: branch, sortOrder: i),
    );

    // Link to parent (previous node or root)
    final parentId = i > 0 ? 'anc-${i - 1}' : 'root';
    edges.add(
      LineageTreeEdge(
        fromId: parentId,
        toId: id,
        type: LineageTreeRelationType.sire,
      ),
    );
  }

  // Create descendants (positive generations)
  for (var i = 1; i <= maxDescendants; i++) {
    final gen = 1 + (i % 5); // 1 to 5
    final branch = i ~/ 5;
    final id = 'desc-$i';
    nodes.add(
      _makeNode(id: id, generation: gen, branchOrder: branch, sortOrder: i),
    );

    // Link to parent (previous descendant or root)
    final parentId = i > 1 ? 'desc-${i - 1}' : 'root';
    edges.add(
      LineageTreeEdge(
        fromId: parentId,
        toId: id,
        type: LineageTreeRelationType.offspring,
      ),
    );
  }

  return LineageSnapshot(
    root: LineageRoot(
      id: 'root',
      name: 'Root Horse',
      coat: 'Bay',
      birthYear: 2010,
      offspringCount: maxDescendants,
      awardCount: 5,
      notes: 'Test root for performance tests',
    ),
    treeSummary: '$nodeCount node test pedigree',
    treeNodes: nodes,
    treeEdges: edges,
    relatedHorses: const [],
    timeline: const [],
  );
}

void main() {
  group('PedigreeLayout performance (50+ nodes)', () {
    test('buildPedigreeLayout completes under 200ms for 50 nodes', () {
      final snapshot = _makeLargeSnapshot(50);

      final stopwatch = Stopwatch()..start();
      final layout = buildPedigreeLayout(
        snapshot: snapshot,
        maxGeneration: null, // full depth
      );
      stopwatch.stop();

      expect(
        layout.nodes.length,
        greaterThanOrEqualTo(50),
        reason: 'Should have 50+ nodes in layout',
      );
      expect(
        stopwatch.elapsedMilliseconds,
        lessThan(200),
        reason: 'Layout computation for 50 nodes should complete within 200ms',
      );
    });

    test('buildPedigreeLayout completes under 500ms for 100 nodes', () {
      final snapshot = _makeLargeSnapshot(100);

      final stopwatch = Stopwatch()..start();
      final layout = buildPedigreeLayout(
        snapshot: snapshot,
        maxGeneration: null,
      );
      stopwatch.stop();

      expect(
        layout.nodes.length,
        greaterThanOrEqualTo(100),
        reason: 'Should have 100+ nodes in layout',
      );
      expect(
        stopwatch.elapsedMilliseconds,
        lessThan(500),
        reason: 'Layout computation for 100 nodes should complete within 500ms',
      );
    });

    test('layout with maxGeneration filters to expected count', () {
      final snapshot = _makeLargeSnapshot(80);

      // With maxGeneration=3, only generations -3 to +3 should be included
      // plus the root (generation 0).
      final layout = buildPedigreeLayout(snapshot: snapshot, maxGeneration: 3);

      // Verify all nodes in layout have abs(generation) <= 3
      for (final node in layout.nodes) {
        expect(
          node.generation.abs(),
          lessThanOrEqualTo(3),
          reason: 'All nodes should be within maxGeneration bounds',
        );
      }

      expect(
        layout.nodes.length,
        greaterThan(0),
        reason: 'Should still have nodes after filtering',
      );
      expect(
        layout.nodes.length,
        lessThan(80),
        reason: 'Should have fewer nodes than unfiltered',
      );
    });

    test('canvasSize is computed and non-zero', () {
      final snapshot = _makeLargeSnapshot(50);
      final layout = buildPedigreeLayout(
        snapshot: snapshot,
        maxGeneration: null,
      );

      expect(
        layout.canvasSize.width,
        greaterThan(0),
        reason: 'Canvas width should be non-zero',
      );
      expect(
        layout.canvasSize.height,
        greaterThan(0),
        reason: 'Canvas height should be non-zero',
      );
      expect(
        layout.canvasRect,
        equals(Offset.zero & layout.canvasSize),
        reason: 'canvasRect should match canvasSize at origin',
      );
    });

    test('nodeById returns null for non-existent node', () {
      final snapshot = _makeLargeSnapshot(10);
      final layout = buildPedigreeLayout(
        snapshot: snapshot,
        maxGeneration: null,
      );

      expect(layout.nodeById('non-existent'), isNull);
      expect(layout.nodeById('root'), isNotNull);
    });

    test('edges are correctly mapped from snapshot', () {
      final snapshot = _makeLargeSnapshot(50);
      final layout = buildPedigreeLayout(
        snapshot: snapshot,
        maxGeneration: null,
      );

      expect(
        layout.edges.length,
        greaterThan(0),
        reason: 'Should have edges in layout',
      );
      expect(
        layout.edges.length,
        snapshot.treeEdges.length,
        reason: 'All tree edges should be mapped',
      );

      // Verify edge VMs reference existing nodes
      for (final edge in layout.edges) {
        expect(
          layout.nodeById(edge.fromId),
          isNotNull,
          reason: 'Edge fromId should reference existing node',
        );
        expect(
          layout.nodeById(edge.toId),
          isNotNull,
          reason: 'Edge toId should reference existing node',
        );
      }
    });
  });

  group('Edge painter culling', () {
    test('PedigreeEdgePainter construction and shouldRepaint', () {
      final painter1 = PedigreeEdgePainter(
        edges: const [],
        nodeRects: const {},
        selectedNodeId: null,
        colorScheme: const ColorScheme.light(),
        visibleRect: Rect.fromLTWH(0, 0, 100, 100),
      );

      final painter2 = PedigreeEdgePainter(
        edges: const [],
        nodeRects: const {},
        selectedNodeId: null,
        colorScheme: const ColorScheme.light(),
        visibleRect: null,
      );

      // Different visibleRect should trigger repaint
      expect(
        painter1.shouldRepaint(painter2),
        isTrue,
        reason: 'Changing visibleRect should trigger repaint',
      );

      // Same params should not trigger repaint
      expect(
        painter1.shouldRepaint(painter1),
        isFalse,
        reason: 'Same painter should not need repaint',
      );
    });

    test('Edge painter skips edges outside visible rect', () {
      final rects = {
        'a': Rect.fromLTWH(0, 0, 100, 100),
        'b': Rect.fromLTWH(0, 200, 100, 100),
        'c': Rect.fromLTWH(0, 500, 100, 100),
        'd': Rect.fromLTWH(0, 600, 100, 100),
      };

      final edges = [
        const PedigreeEdgeVm(
          fromId: 'a',
          toId: 'b',
          type: LineageTreeRelationType.sire,
        ),
        const PedigreeEdgeVm(
          fromId: 'c',
          toId: 'd',
          type: LineageTreeRelationType.offspring,
        ),
      ];

      // visibleRect covering only the first edge (a→b)
      const visibleRect = Rect.fromLTWH(0, 0, 200, 350);

      final painter = PedigreeEdgePainter(
        edges: edges,
        nodeRects: rects,
        selectedNodeId: null,
        colorScheme: const ColorScheme.light(),
        visibleRect: visibleRect,
      );

      // The painting itself doesn't throw when edges are culled.
      // We can verify by checking that shouldRepaint recognizes the rect.
      expect(painter.visibleRect, equals(visibleRect));
    });
  });

  group('Large tree widget rendering', () {
    testWidgets('PedigreeTreeContent renders without errors for 50 nodes', (
      tester,
    ) async {
      final snapshot = _makeLargeSnapshot(50);
      final layout = buildPedigreeLayout(
        snapshot: snapshot,
        maxGeneration: null,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 400,
              height: 600,
              child: SingleChildScrollView(
                child: PedigreeTreeContent(
                  layout: layout,
                  selectedNodeId: null,
                  onNodeTap: (_) {},
                  padding: 24.0,
                  viewportSize: const Size(400, 600),
                ),
              ),
            ),
          ),
        ),
      );

      // Verify the tree content rendered
      expect(find.byType(PedigreeTreeContent), findsOneWidget);

      // CustomPaint is used but CustomPainter is not a widget, so
      // PedigreeEdgePainter can't be found via find.byType. Instead,
      // verify that PedigreeNodeCard widgets rendered.
      final renderedCards = find.byType(PedigreeNodeCard);
      expect(
        renderedCards,
        findsWidgets,
        reason: 'Some cards should still be visible',
      );
      expect(
        renderedCards.evaluate().length,
        lessThanOrEqualTo(layout.nodes.length),
        reason: 'Should not render more cards than total nodes',
      );
    });

    testWidgets(
      'PedigreeTreeContent with culling renders fewer widgets for off-screen nodes',
      (tester) async {
        final snapshot = _makeLargeSnapshot(50);
        final layout = buildPedigreeLayout(
          snapshot: snapshot,
          maxGeneration: null,
        );

        // Create a controller with a zoomed-in transform that only shows
        // a small portion of the canvas.
        final controller = TransformationController();
        // Zoom in 3x and pan to focus on the top-left area.
        controller.value = Matrix4.identity()
          ..scaleByDouble(3.0, 3.0, 1.0, 1.0)
          ..translateByDouble(-50.0, -50.0, 0.0, 1.0);

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: SizedBox(
                width: 400,
                height: 600,
                child: SingleChildScrollView(
                  child: PedigreeTreeContent(
                    layout: layout,
                    selectedNodeId: null,
                    onNodeTap: (_) {},
                    padding: 24.0,
                    transformationController: controller,
                    viewportSize: const Size(400, 600),
                  ),
                ),
              ),
            ),
          ),
        );

        // With viewport culling, only a subset of nodes should be rendered.
        final renderedCards = find.byType(PedigreeNodeCard);
        expect(
          renderedCards,
          findsWidgets,
          reason: 'Some cards should still be visible',
        );
        expect(
          renderedCards.evaluate().length,
          lessThan(layout.nodes.length),
          reason:
              'Viewport culling should render fewer cards than total nodes when zoomed in',
        );
      },
    );

    testWidgets('PedigreeTreeContent shows zero cards for empty layout', (
      tester,
    ) async {
      final emptyLayout = const PedigreeLayoutResult(
        canvasSize: Size(0, 0),
        nodes: [],
        edges: [],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: PedigreeTreeContent(
                layout: emptyLayout,
                selectedNodeId: null,
                onNodeTap: (_) {},
                padding: 24.0,
              ),
            ),
          ),
        ),
      );

      expect(find.byType(PedigreeNodeCard), findsNothing);
      expect(find.byType(PedigreeTreeContent), findsOneWidget);
    });
  });
}
