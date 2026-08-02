import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/lineage/application/pedigree_layout.dart';
import 'package:tamga/src/features/lineage/presentation/pedigree_tree_content.dart';

void main() {
  testWidgets('fits pedigree badges inside narrow node cards', (tester) async {
    const node = PedigreeNodeVm(
      id: 'horse-1',
      name: 'Нарийн зүсмийн морь',
      relationLabel: 'Эцэг',
      coat: 'Хээр',
      birthYear: 2020,
      awardCount: 2,
      offspringCount: 3,
      isOwnedByHousehold: true,
      generation: 0,
      isRoot: false,
      hiddenBranchCount: 4,
      tamgaNo: '123456',
      rect: Rect.fromLTWH(0, 0, 188, 152),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 162,
              height: 126,
              child: PedigreeNodeCard(
                node: node,
                isSelected: false,
                onTap: () {},
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
  });
}
