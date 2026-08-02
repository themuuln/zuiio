import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/ai/domain/breeding_advice.dart';

void main() {
  group('InbreedingRisk', () {
    test('fromString returns correct enum', () {
      expect(InbreedingRisk.fromString('low'), InbreedingRisk.low);
      expect(InbreedingRisk.fromString('medium'), InbreedingRisk.medium);
      expect(InbreedingRisk.fromString('high'), InbreedingRisk.high);
    });

    test('fromString defaults to medium for unknown', () {
      expect(InbreedingRisk.fromString('unknown'), InbreedingRisk.medium);
    });

    test('each value has a displayName', () {
      expect(InbreedingRisk.low.displayName, 'Бага');
      expect(InbreedingRisk.medium.displayName, 'Дунд');
      expect(InbreedingRisk.high.displayName, 'Өндөр');
    });
  });

  group('BreedingAdvice', () {
    final sampleAdvice = BreedingAdvice(
      compatibilityScore: 50,
      inbreedingRisk: InbreedingRisk.medium,
      riskScore: 45,
      coatColorPredictions: [
        CoatColorPrediction(color: 'Bay', probability: 50),
        CoatColorPrediction(color: 'Black', probability: 50),
        CoatColorPrediction(color: 'Chestnut', probability: 50),
      ],
      healthRisks: const [],
      healthNotes: 'Health check notes for this pair.',
      breedingWindow: '',
      overallRecommendation: OverallRecommendation.consultVet,
      breedSuggestions: ['Consider line-breeding', 'Use unrelated sire'],
      mongolianBreedNotes: '',
      commonAncestors: const [],
    );

    test('constructs with all required fields', () {
      expect(sampleAdvice.inbreedingRisk, InbreedingRisk.medium);
      expect(sampleAdvice.riskScore, 45);
      expect(sampleAdvice.healthNotes, 'Health check notes for this pair.');
      expect(sampleAdvice.coatColorPredictions, [
        CoatColorPrediction(color: 'Bay', probability: 50),
        CoatColorPrediction(color: 'Black', probability: 50),
        CoatColorPrediction(color: 'Chestnut', probability: 50),
      ]);
      expect(sampleAdvice.breedSuggestions, [
        'Consider line-breeding',
        'Use unrelated sire',
      ]);
    });

    test('fromJson parses all fields (VAL-AI-002)', () {
      final json = {
        'inbreedingRisk': 'low',
        'riskScore': 25,
        'healthNotes': 'Low risk, good genetic diversity.',
        'coatColorPredictions': [
          {'color': 'Bay', 'probability': 40},
          {'color': 'Chestnut', 'probability': 60},
        ],
        'breedSuggestions': ['Good match'],
      };

      final advice = BreedingAdvice.fromJson(json);
      expect(advice.inbreedingRisk, InbreedingRisk.low);
      expect(advice.riskScore, 25);
      expect(advice.healthNotes, 'Low risk, good genetic diversity.');
      expect(advice.coatColorPredictions, [
        CoatColorPrediction(color: 'Bay', probability: 40),
        CoatColorPrediction(color: 'Chestnut', probability: 60),
      ]);
      expect(advice.breedSuggestions, ['Good match']);
    });

    test('fromJson with quota parses correctly', () {
      final json = {
        'inbreedingRisk': 'high',
        'riskScore': 85,
        'healthNotes': 'High inbreeding risk detected.',
        'coatColorPredictions': [
          {'color': 'Gray', 'probability': 70},
        ],
        'breedSuggestions': ['Use different dam'],
        'quota': {'tier': 'free', 'limit': 5, 'remaining': 2},
      };

      final advice = BreedingAdvice.fromJson(json);
      expect(advice.inbreedingRisk, InbreedingRisk.high);
      expect(advice.riskScore, 85);
      expect(advice.quota, isNotNull);
      expect(advice.quota!.tier, 'free');
      expect(advice.quota!.limit, 5);
      expect(advice.quota!.remaining, 2);
    });

    test('fromJson defaults for missing fields', () {
      final json = <String, dynamic>{};
      final advice = BreedingAdvice.fromJson(json);
      expect(advice.inbreedingRisk, InbreedingRisk.medium);
      expect(advice.riskScore, 50);
      expect(advice.healthNotes, '');
      expect(advice.coatColorPredictions, isEmpty);
      expect(advice.breedSuggestions, isEmpty);
    });

    test('toJson serializes correctly', () {
      final json = sampleAdvice.toJson();
      expect(json['inbreedingRisk'], 'medium');
      expect(json['riskScore'], 45);
      expect(json['healthNotes'], 'Health check notes for this pair.');
      expect(json['coatColorPredictions'], [
        {'color': 'Bay', 'probability': 50},
        {'color': 'Black', 'probability': 50},
        {'color': 'Chestnut', 'probability': 50},
      ]);
      expect(json['breedSuggestions'], [
        'Consider line-breeding',
        'Use unrelated sire',
      ]);
    });

    test('riskColorLabel returns correct color (VAL-AI-002)', () {
      expect(
        BreedingAdvice(
          compatibilityScore: 50,

          inbreedingRisk: InbreedingRisk.low,

          riskScore: 10,

          coatColorPredictions: [],

          healthRisks: const [],

          healthNotes: '',

          breedingWindow: '',

          overallRecommendation: OverallRecommendation.consultVet,

          breedSuggestions: [],

          mongolianBreedNotes: '',

          commonAncestors: const [],
        ).riskColorLabel,
        'green',
      );
      expect(
        BreedingAdvice(
          compatibilityScore: 50,

          inbreedingRisk: InbreedingRisk.medium,

          riskScore: 50,

          coatColorPredictions: [],

          healthRisks: const [],

          healthNotes: '',

          breedingWindow: '',

          overallRecommendation: OverallRecommendation.consultVet,

          breedSuggestions: [],

          mongolianBreedNotes: '',

          commonAncestors: const [],
        ).riskColorLabel,
        'yellow',
      );
      expect(
        BreedingAdvice(
          compatibilityScore: 50,

          inbreedingRisk: InbreedingRisk.high,

          riskScore: 90,

          coatColorPredictions: [],

          healthRisks: const [],

          healthNotes: '',

          breedingWindow: '',

          overallRecommendation: OverallRecommendation.consultVet,

          breedSuggestions: [],

          mongolianBreedNotes: '',

          commonAncestors: const [],
        ).riskColorLabel,
        'red',
      );
    });

    test('riskScoreLabel returns meaningful text', () {
      final low = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 15,
        coatColorPredictions: [],
        healthRisks: const [],
        healthNotes: '',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: [],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );
      expect(low.riskScoreLabel, 'Бага эрсдэлтэй');

      final mid = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.medium,
        riskScore: 50,
        coatColorPredictions: [],
        healthRisks: const [],
        healthNotes: '',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: [],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );
      expect(mid.riskScoreLabel, 'Дунд зэргийн эрсдэлтэй');

      final high = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.high,
        riskScore: 85,
        coatColorPredictions: [],
        healthRisks: const [],
        healthNotes: '',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: [],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );
      expect(high.riskScoreLabel, 'Өндөр эрсдэлтэй');
    });

    test('equality works', () {
      final a = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 10,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Notes',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Good'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );
      final b = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.low,
        riskScore: 10,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Notes',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Good'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );
      final c = BreedingAdvice(
        compatibilityScore: 50,
        inbreedingRisk: InbreedingRisk.high,
        riskScore: 10,
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
        ],
        healthRisks: const [],
        healthNotes: 'Notes',
        breedingWindow: '',
        overallRecommendation: OverallRecommendation.consultVet,
        breedSuggestions: ['Good'],
        mongolianBreedNotes: '',
        commonAncestors: const [],
      );
      // Use == directly for accurate comparison
      expect(a == b, isTrue);
      expect(a == c, isFalse);
    });
  });

  group('BreedingQuota', () {
    test('fromJson parses correctly', () {
      final json = {'tier': 'free', 'limit': 5, 'remaining': 3};
      final quota = BreedingQuota.fromJson(json);
      expect(quota.tier, 'free');
      expect(quota.limit, 5);
      expect(quota.remaining, 3);
    });

    test('fromJson handles null limit and remaining', () {
      final json = {'tier': 'breeder'};
      final quota = BreedingQuota.fromJson(json);
      expect(quota.tier, 'breeder');
      expect(quota.limit, isNull);
      expect(quota.remaining, isNull);
    });
  });
}
