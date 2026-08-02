import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/features/ai/domain/breeding_advice.dart';
import 'package:tamga/src/features/ai/presentation/breeding_result_card.dart';

Widget createCard(BreedingAdvice advice) {
  return MaterialApp(
    theme: AppTheme.light(),
    home: Scaffold(
      body: SingleChildScrollView(child: BreedingResultCard(advice: advice)),
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
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 15,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
          CoatColorPrediction(color: 'Chestnut', probability: 50),
          CoatColorPrediction(color: 'Black', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Low risk pair with good genetic diversity.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Excellent match'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
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
    testWidgets('shows orange theme for medium inbreeding risk', (
      tester,
    ) async {
      final advice = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 50,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Gray', probability: 50),
          CoatColorPrediction(color: 'Bay', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Medium risk — some shared ancestors detected.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Consider alternative pairing'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
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
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.high,
        riskScore: 85,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Gray', probability: 50),
          CoatColorPrediction(color: 'Roan', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Test notes.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: [
          'Avoid this pairing',
          'Use completely unrelated bloodlines',
        ],
        mongolianBreedNotes: '',
        commonAncestors: const [],
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
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 40,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Test notes.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Consider this pairing'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      expect(find.text('Эрүүл мэндийн тэмдэглэл'), findsOneWidget);
      // The card renders advice.healthNotes verbatim inside the section card.
      expect(find.text('Test notes.'), findsOneWidget);
    });

    // ════════════════════════════════════════════════════════════════
    // Color predictions
    // ════════════════════════════════════════════════════════════════
    testWidgets('displays color predictions as chips', (tester) async {
      final advice = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 10,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
          CoatColorPrediction(color: 'Chestnut', probability: 50),
          CoatColorPrediction(color: 'Black', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Good match.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Good match'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
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
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 45,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Gray', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Consider health screening.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: [
          'Consider line-breeding with caution',
          'Use unrelated sire for better diversity',
        ],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      expect(find.text('Үүлдрийн зөвлөмж'), findsOneWidget);
      expect(find.text('Consider line-breeding with caution'), findsOneWidget);
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
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.high,
        riskScore: 78,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Gray', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'High risk.',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Avoid'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );

      await tester.pumpWidget(createCard(advice));
      await tester.pumpAndSettle();

      // The card renders two progress bars: the compatibility gauge and the
      // risk score bar. Scope the assertion to the risk section and verify
      // the displayed value (riskScore/100 = 78/100).
      final riskCard = find.ancestor(
        of: find.text('Цус ойртолтын эрсдэл'),
        matching: find.byType(Card),
      );
      final riskProgress = find.descendant(
        of: riskCard,
        matching: find.byType(LinearProgressIndicator),
      );
      expect(riskProgress, findsOneWidget);
      expect(
        tester.widget<LinearProgressIndicator>(riskProgress).value,
        closeTo(0.78, 0.0001),
      );
    });
  });
}
