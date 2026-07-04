import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/ai/domain/breeding_advice.dart';
import 'package:tamga/src/features/ai/presentation/breeding_result_card.dart';

Widget createCard(BreedingAdvice advice) {
  return MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(
      body: SingleChildScrollView(
        child: BreedingResultCard(advice: advice),
      ),
    ),
  );
}

void main() {
  group('BreedingResultCard — VAL-AI-005', () {
    // ════════════════════════════════════════════════════════════════
    // Low risk (green)
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows green theme for low inbreeding risk', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 15,
        healthNotes: 'Low risk pair with good genetic diversity.',
        colorPredictions: ['Bay', 'Chestnut', 'Black'],
        breedSuggestions: ['Excellent match'],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      // Check risk label is displayed
      expect(find.text('Цус ойртолтын эрсдэл'), findsOneWidget);
      expect(find.text('Бага'), findsOneWidget);

      // Check risk score
      expect(find.text('15/100'), findsOneWidget);
      expect(find.text('Бага эрсдэлтэй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Medium risk (yellow/orange)
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows orange theme for medium inbreeding risk', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 50,
        healthNotes: 'Medium risk — some shared ancestors detected.',
        colorPredictions: ['Gray', 'Bay'],
        breedSuggestions: ['Consider alternative pairing'],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      // Check risk label
      expect(find.text('Дунд'), findsOneWidget);
      expect(find.text('50/100'), findsOneWidget);
      expect(find.text('Дунд зэргийн эрсдэлтэй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // High risk (red)
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows red theme for high inbreeding risk', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.high,
        riskScore: 85,
        healthNotes: 'High inbreeding risk detected. Strongly recommend '
            'alternative pairing.',
        colorPredictions: ['Gray', 'Roan'],
        breedSuggestions: [
          'Avoid this pairing',
          'Use completely unrelated bloodlines',
        ],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      // Check risk label
      expect(find.text('Өндөр'), findsOneWidget);
      expect(find.text('85/100'), findsOneWidget);
      expect(find.text('Өндөр эрсдэлтэй'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Health notes
    // ════════════════════════════════════════════════════════════════
    testWidgets('displays health notes section', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 40,
        healthNotes: 'Both horses show good overall health. '
            'No hereditary diseases detected.',
        colorPredictions: ['Bay'],
        breedSuggestions: ['Consider this pairing'],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      expect(find.text('Эрүүл мэндийн тэмдэглэл'), findsOneWidget);
      expect(
        find.textContaining('Both horses show good overall health'),
        findsOneWidget,
      );
    });

    // ════════════════════════════════════════════════════════════════
    // Color predictions
    // ════════════════════════════════════════════════════════════════
    testWidgets('displays color predictions as chips', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 10,
        healthNotes: 'Good match.',
        colorPredictions: ['Bay', 'Chestnut', 'Black'],
        breedSuggestions: ['Good match'],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      expect(find.text('Өнгөний таамаглал'), findsOneWidget);
      expect(find.text('Bay'), findsOneWidget);
      expect(find.text('Chestnut'), findsOneWidget);
      expect(find.text('Black'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Breed suggestions
    // ════════════════════════════════════════════════════════════════
    testWidgets('displays breed suggestions list', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 45,
        healthNotes: 'Consider health screening.',
        colorPredictions: ['Gray'],
        breedSuggestions: [
          'Consider line-breeding with caution',
          'Use unrelated sire for better diversity',
        ],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      expect(find.text('Үүлдрийн зөвлөмж'), findsOneWidget);
      expect(
        find.text('Consider line-breeding with caution'),
        findsOneWidget,
      );
      expect(
        find.text('Use unrelated sire for better diversity'),
        findsOneWidget,
      );
    });

    // ════════════════════════════════════════════════════════════════
    // Progress bar visibility
    // ════════════════════════════════════════════════════════════════
    testWidgets('shows risk score progress bar', (tester) async {
      final advice = BreedingAdvice(
        inbreedingRisk: InbreedingRisk.high,
        riskScore: 78,
        healthNotes: 'High risk.',
        colorPredictions: ['Gray'],
        breedSuggestions: ['Avoid'],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      // LinearProgressIndicator should be present
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
    });
  });
}
