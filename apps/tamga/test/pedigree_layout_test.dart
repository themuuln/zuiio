import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/lineage/application/pedigree_layout.dart';
import 'package:tamga/src/features/lineage/domain/lineage_snapshot.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_node.dart';
import 'package:tamga/src/features/lineage/domain/lineage_tree_edge.dart';
import 'package:tamga/src/features/lineage/domain/lineage_root.dart';

void main() {
  group('Pedigree Layout Algorithm (Buchheim/Walker)', () {
    test(
      'renders a simple pedigree with parent-child centering and no overlaps',
      () {
        const snapshot = LineageSnapshot(
          root: LineageRoot(
            id: 'root-horse',
            name: 'Root',
            coat: 'Хээр',
            birthYear: 2020,
            offspringCount: 2,
            awardCount: 0,
            notes: 'Test notes',
          ),
          treeSummary: 'Test Summary',
          treeNodes: [
            LineageTreeNode(
              id: 'sire',
              name: 'Sire',
              relationLabel: 'Эцэг',
              coat: 'Хонгор',
              birthYear: 2005,
              awardCount: 0,
              offspringCount: 1,
              isOwnedByHousehold: false,
              generation: -1,
              branchOrder: 0,
              sortOrder: 0,
            ),
            LineageTreeNode(
              id: 'dam',
              name: 'Dam',
              relationLabel: 'Эх',
              coat: 'Хар',
              birthYear: 2007,
              awardCount: 0,
              offspringCount: 1,
              isOwnedByHousehold: false,
              generation: -1,
              branchOrder: 1,
              sortOrder: 0,
            ),
            LineageTreeNode(
              id: 'root-horse',
              name: 'Root',
              relationLabel: 'Root азарга',
              coat: 'Хээр',
              birthYear: 2020,
              awardCount: 0,
              offspringCount: 2,
              isOwnedByHousehold: true,
              generation: 0,
              branchOrder: 0,
              sortOrder: 0,
              isRoot: true,
            ),
            LineageTreeNode(
              id: 'offspring1',
              name: 'Offspring 1',
              relationLabel: 'Хүү',
              coat: 'Хээр',
              birthYear: 2023,
              awardCount: 0,
              offspringCount: 0,
              isOwnedByHousehold: true,
              generation: 1,
              branchOrder: 0,
              sortOrder: 0,
            ),
            LineageTreeNode(
              id: 'offspring2',
              name: 'Offspring 2',
              relationLabel: 'Охин',
              coat: 'Бор',
              birthYear: 2024,
              awardCount: 0,
              offspringCount: 0,
              isOwnedByHousehold: true,
              generation: 1,
              branchOrder: 1,
              sortOrder: 0,
            ),
          ],
          treeEdges: [
            LineageTreeEdge(
              fromId: 'sire',
              toId: 'root-horse',
              type: LineageTreeRelationType.sire,
            ),
            LineageTreeEdge(
              fromId: 'dam',
              toId: 'root-horse',
              type: LineageTreeRelationType.dam,
            ),
            LineageTreeEdge(
              fromId: 'root-horse',
              toId: 'offspring1',
              type: LineageTreeRelationType.offspring,
            ),
            LineageTreeEdge(
              fromId: 'root-horse',
              toId: 'offspring2',
              type: LineageTreeRelationType.offspring,
            ),
          ],
          relatedHorses: [],
          timeline: [],
        );

        final result = buildPedigreeLayout(
          snapshot: snapshot,
          maxGeneration: null,
        );

        expect(result.nodes, hasLength(5));

        final rootNode = result.nodeById('root-horse')!;
        final sireNode = result.nodeById('sire')!;
        final damNode = result.nodeById('dam')!;
        final offspring1 = result.nodeById('offspring1')!;
        final offspring2 = result.nodeById('offspring2')!;

        // Spacing constraints:
        // Node dimensions: 188.0 x 152.0
        // horizontalGap: 24.0
        // verticalGap: 64.0
        const nodeHeight = 152.0;
        const horizontalGap = 24.0;
        const verticalGap = 64.0;

        // Vertical (top) coordinate checks:
        // minGeneration is -1.
        // -1 -> top = 0.0
        //  0 -> top = 152.0 + 64.0 = 216.0
        //  1 -> top = 2.0 * (152.0 + 64.0) = 432.0
        expect(sireNode.rect.top, 0.0);
        expect(damNode.rect.top, 0.0);
        expect(rootNode.rect.top, nodeHeight + verticalGap);
        expect(offspring1.rect.top, 2 * (nodeHeight + verticalGap));
        expect(offspring2.rect.top, 2 * (nodeHeight + verticalGap));

        // Sibling separation checks:
        // sire vs dam: gap must be at least horizontalGap
        expect(
          damNode.rect.left - sireNode.rect.right,
          greaterThanOrEqualTo(horizontalGap - 0.01),
        );
        // offspring1 vs offspring2: gap must be at least horizontalGap
        expect(
          offspring2.rect.left - offspring1.rect.right,
          greaterThanOrEqualTo(horizontalGap - 0.01),
        );

        // Root node centering checks:
        // Root node's horizontal center must be centered between its parents' horizontal centers
        final parentsCenter =
            (sireNode.rect.center.dx + damNode.rect.center.dx) / 2.0;
        expect(rootNode.rect.center.dx, closeTo(parentsCenter, 0.01));

        // Root node's horizontal center must also be centered between its children's horizontal centers
        final childrenCenter =
            (offspring1.rect.center.dx + offspring2.rect.center.dx) / 2.0;
        expect(rootNode.rect.center.dx, closeTo(childrenCenter, 0.01));
      },
    );
  });
}
