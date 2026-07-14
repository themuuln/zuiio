import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/theme/design_tokens.dart';
import 'package:tamga/src/features/onboarding/domain/onboarding_data.dart';
import 'package:tamga/src/features/onboarding/presentation/pages/role_selection_page.dart';

Widget buildTestWidget({
  UserRole? initialRole,
  required void Function(UserRole role) onContinue,
}) {
  return MaterialApp(
    theme: ThemeData(extensions: const [TamgaColors.light]),
    home: Scaffold(
      body: RoleSelectionPage(
        onBack: () {},
        initialRole: initialRole,
        onContinue: onContinue,
      ),
    ),
  );
}

void main() {
  group('RoleSelectionPage', () {
    testWidgets('renders 3 role cards', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_) {}));

      expect(find.text('Морь сонирхогч'), findsOneWidget);
      expect(find.text('Уяач / Малчин'), findsOneWidget);
      expect(find.text('Жүчээ / Бизнес'), findsOneWidget);
    });

    testWidgets('renders heading text', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_) {}));

      expect(find.text('Таны үүрэг'), findsOneWidget);
      expect(find.text('Та ямар хүн бэ?'), findsOneWidget);
    });

    testWidgets('continue button disabled until role is selected', (
      tester,
    ) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_) {}));

      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull);

      await tester.tap(find.text('Морь сонирхогч'));
      await tester.pumpAndSettle();

      final afterRole = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(afterRole.onPressed, isNotNull);
    });

    testWidgets('initial selection enables continue button', (tester) async {
      await tester.pumpWidget(
        buildTestWidget(initialRole: UserRole.breeder, onContinue: (_) {}),
      );

      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNotNull);
    });

    testWidgets('continue returns selected role', (tester) async {
      UserRole? selectedRole;

      await tester.pumpWidget(
        buildTestWidget(
          onContinue: (role) {
            selectedRole = role;
          },
        ),
      );

      await tester.tap(find.text('Жүчээ / Бизнес'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Үргэлжлүүлэх'));
      await tester.pumpAndSettle();

      expect(selectedRole, UserRole.stable);
    });

    testWidgets('role icons are displayed for each card', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_) {}));

      expect(find.byIcon(Icons.pets), findsOneWidget);
      expect(find.byIcon(Icons.sports_motorsports), findsOneWidget);
      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });
  });
}
