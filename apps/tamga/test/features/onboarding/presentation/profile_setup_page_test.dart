import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/theme/design_tokens.dart';
import 'package:tamga/src/features/onboarding/presentation/pages/profile_setup_page.dart';

Widget buildTestWidget({
  String? initialDisplayName,
  String? initialRegion,
  String? initialPhone,
  required void Function(String displayName, String? region, String? phone)
  onContinue,
}) {
  return MaterialApp(
    theme: ThemeData(extensions: const [TamgaColors.light]),
    home: Scaffold(
      body: ProfileSetupPage(
        initialDisplayName: initialDisplayName,
        initialRegion: initialRegion,
        initialPhone: initialPhone,
        onContinue: onContinue,
      ),
    ),
  );
}

void main() {
  group('ProfileSetupPage', () {
    testWidgets('renders step label 3/5', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));

      expect(find.text('3/5'), findsOneWidget);
      expect(find.text('Хувийн мэдээлэл'), findsOneWidget);
    });

    testWidgets('renders heading text', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));

      expect(find.textContaining('Таны тухай'), findsOneWidget);
    });

    testWidgets('renders name field with label', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));

      expect(find.text('Нэр'), findsOneWidget);
      expect(find.byIcon(Icons.person_outline), findsOneWidget);
    });

    testWidgets('renders region dropdown', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));

      expect(find.text('Аймаг / Хот'), findsOneWidget);
      expect(find.byIcon(Icons.location_on_outlined), findsOneWidget);
    });

    testWidgets('renders phone field (optional)', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));

      expect(find.text('Утасны дугаар (заавал биш)'), findsOneWidget);
      expect(find.byIcon(Icons.phone_outlined), findsOneWidget);
    });

    testWidgets('renders continue button', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));

      expect(find.byType(FilledButton), findsOneWidget);
      // Verify the button label text is present
      expect(find.text('ҮРГЭЛЖЛҮҮЛЭХ'), findsOneWidget);
    });

    testWidgets('shows validation error when name is empty', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));
      await tester.pumpAndSettle();

      // Tap continue without entering name
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(find.text('Нэр оруулна уу'), findsOneWidget);
    });

    testWidgets('shows validation error for whitespace-only name', (
      tester,
    ) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, '   ');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(find.text('Нэр оруулна уу'), findsOneWidget);
    });

    testWidgets('calls onContinue with valid name', (tester) async {
      String? capturedName;

      await tester.pumpWidget(
        buildTestWidget(onContinue: (name, _, _) => capturedName = name),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Тэмүүлэн');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(capturedName, 'Тэмүүлэн');
    });

    testWidgets('trims whitespace from name', (tester) async {
      String? capturedName;

      await tester.pumpWidget(
        buildTestWidget(onContinue: (name, _, _) => capturedName = name),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, '  Тэмүүлэн  ');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(capturedName, 'Тэмүүлэн');
    });

    testWidgets('passes null region when none selected', (tester) async {
      String? capturedRegion;

      await tester.pumpWidget(
        buildTestWidget(onContinue: (_, region, _) => capturedRegion = region),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Тэмүүлэн');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(capturedRegion, isNull);
    });

    testWidgets('region dropdown can be opened', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));
      await tester.pumpAndSettle();

      // Tap the dropdown
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();

      // Dropdown items should be visible
      expect(find.text('Архангай'), findsWidgets);
      expect(find.text('Баян-Өлгий'), findsWidgets);
    });

    testWidgets('region dropdown shows multiple aimags', (tester) async {
      // Use a taller viewport so the dropdown overlay shows more items
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();

      // Check aimags across the list are present
      expect(find.text('Архангай'), findsWidgets);
      expect(find.text('Булган'), findsWidgets);
      expect(find.text('Төв'), findsWidgets);
      expect(find.text('Хөвсгөл'), findsWidgets);
    });

    testWidgets('populates initial values', (tester) async {
      await tester.pumpWidget(
        buildTestWidget(
          initialDisplayName: 'Бат',
          initialRegion: 'Дархан-Уул',
          initialPhone: '99112233',
          onContinue: (_, _, _) {},
        ),
      );
      await tester.pumpAndSettle();

      // Name and phone appear in EditableText (controller values)
      expect(find.text('Бат'), findsWidgets);
      expect(find.text('99112233'), findsWidgets);
      // The region should be pre-selected and visible as dropdown value
      expect(find.text('Дархан-Уул'), findsOneWidget);
    });

    testWidgets('passes initial values to onContinue when unchanged', (
      tester,
    ) async {
      String? capturedName;
      String? capturedRegion;
      String? capturedPhone;

      await tester.pumpWidget(
        buildTestWidget(
          initialDisplayName: 'Бат',
          initialRegion: 'Дархан-Уул',
          initialPhone: '99112233',
          onContinue: (name, region, phone) {
            capturedName = name;
            capturedRegion = region;
            capturedPhone = phone;
          },
        ),
      );
      await tester.pumpAndSettle();

      // Just press continue with the pre-filled values
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(capturedName, 'Бат');
      expect(capturedRegion, 'Дархан-Уул');
      expect(capturedPhone, '99112233');
    });

    testWidgets('empty phone is passed as null', (tester) async {
      String? capturedPhone;

      await tester.pumpWidget(
        buildTestWidget(onContinue: (_, _, phone) => capturedPhone = phone),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Тэмүүлэн');
      // Don't enter phone
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(capturedPhone, isNull);
    });

    testWidgets('short phone shows validation error', (tester) async {
      await tester.pumpWidget(buildTestWidget(onContinue: (_, _, _) {}));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Тэмүүлэн');
      await tester.enterText(find.byType(TextFormField).last, '1234');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(find.text('Утасны дугаар хэтэрхий богино'), findsOneWidget);
    });
  });
}
