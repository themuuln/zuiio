import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tamga/src/features/onboarding/presentation/widgets/onboarding_completion_checklist.dart';

void main() {
  testWidgets('renders checklist progress and incomplete items', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'onboarding.data': jsonEncode({
        'isCompleted': true,
        'onboardingVersion': 3,
        'userRole': 'casual',
        'firstGoal': 'trackOneHorse',
        'horseName': 'Хан Хүлэг',
        'notificationsEnabled': false,
        'horseEntrySkipped': false,
        'pendingSync': false,
      }),
    });

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(child: OnboardingCompletionChecklist()),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Профайлаа гүйцээе'), findsOneWidget);
    expect(find.text('2/5 алхам дууссан'), findsOneWidget);
    expect(find.text('Профайлын нэр, бүсээ гүйцээх'), findsOneWidget);
    expect(find.text('Мэдэгдлээ асаах'), findsOneWidget);
    expect(find.text('Оруулах'), findsNWidgets(2));
    expect(find.text('Анхны морь нэмэх'), findsOneWidget);
  });

  testWidgets('hides checklist when all items are complete', (tester) async {
    SharedPreferences.setMockInitialValues({
      'onboarding.data': jsonEncode({
        'isCompleted': true,
        'onboardingVersion': 3,
        'userRole': 'stable',
        'firstGoal': 'manageHerd',
        'displayName': 'Temuulen',
        'region': 'Улаанбаатар',
        'horseName': 'Хүлэг',
        'sireName': 'Алтан',
        'notificationsEnabled': true,
        'horseEntrySkipped': false,
        'pendingSync': false,
      }),
    });

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(child: OnboardingCompletionChecklist()),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Профайлаа гүйцээе'), findsNothing);
  });
}
