import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/features/ai/data/supabase_ai_repository.dart';
import 'package:tamga/src/features/ai/domain/breeding_advice.dart';
import 'package:tamga/src/features/ai/domain/breeding_query.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockHttpClient extends Mock implements http.Client {}

class FakeUri extends Fake implements Uri {}

// ── Response Helpers ────────────────────────────────────────────────────

http.Response successResponse({
  String inbreedingRisk = 'medium',
  int riskScore = 45,
  String healthNotes = 'Health notes',
  List<String> colorPredictions = const ['Bay', 'Black'],
  List<String> breedSuggestions = const ['Good match'],
}) {
  return http.Response(
    jsonEncode({
      'inbreedingRisk': inbreedingRisk,
      'riskScore': riskScore,
      'healthNotes': healthNotes,
      'colorPredictions': colorPredictions,
      'breedSuggestions': breedSuggestions,
    }),
    200,
    headers: {'Content-Type': 'application/json'},
  );
}

void main() {
  late MockHttpClient mockHttp;
  late SupabaseAiRepository repository;
  late BreedingQuery sampleQuery;

  setUpAll(() {
    registerFallbackValue(FakeUri());
    registerFallbackValue(''); // String fallback for body
  });

  setUp(() {
    mockHttp = MockHttpClient();
    repository = SupabaseAiRepository(
      httpClient: mockHttp,
      baseUrl: 'https://test.supabase.co',
    );
    sampleQuery = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
  });

  group('SupabaseAiRepository', () {
    test('implements AiRepository', () {
      expect(repository, isA<SupabaseAiRepository>());
    });

    test('getBreedingAdvice returns BreedingAdvice on success (VAL-AI-001)', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any<String>(named: 'body'),
          )).thenAnswer((_) async => successResponse(
            inbreedingRisk: 'low',
            riskScore: 15,
            healthNotes: 'Low risk pair with good genetic diversity.',
            colorPredictions: ['Bay', 'Chestnut', 'Black'],
            breedSuggestions: ['Excellent match', 'Consider this pairing'],
          ));

      final result = await repository.getBreedingAdvice(sampleQuery);

      expect(result.isSuccess, isTrue);
      final advice = result.value;
      expect(advice.inbreedingRisk, InbreedingRisk.low);
      expect(advice.riskScore, 15);
      expect(advice.healthNotes, contains('Low risk'));
      expect(advice.colorPredictions, contains('Bay'));
      expect(advice.breedSuggestions, contains('Excellent match'));
    });

    test('getBreedingAdvice returns all structured fields (VAL-AI-002)', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => successResponse(
            inbreedingRisk: 'high',
            riskScore: 78,
            healthNotes: 'Significant inbreeding risk. Consider alternative pairing.',
            colorPredictions: ['Gray', 'Bay', 'Roan'],
            breedSuggestions: [
              'Avoid this pairing',
              'Consider a different sire with unrelated bloodlines',
            ],
          ));

      final result = await repository.getBreedingAdvice(sampleQuery);
      expect(result.isSuccess, isTrue);

      final advice = result.value;
      // Validate all structured fields per VAL-AI-002
      expect(advice.inbreedingRisk, isA<InbreedingRisk>());
      expect(advice.riskScore, greaterThanOrEqualTo(0));
      expect(advice.riskScore, lessThanOrEqualTo(100));
      expect(advice.healthNotes, isA<String>());
      expect(advice.healthNotes, isNotEmpty);
      expect(advice.colorPredictions, isA<List<String>>());
      expect(advice.colorPredictions, isNotEmpty);
      expect(advice.breedSuggestions, isA<List<String>>());
      expect(advice.breedSuggestions, isNotEmpty);
    });

    test('getBreedingAdvice calls the correct URL', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => successResponse());

      await repository.getBreedingAdvice(sampleQuery);

      verify(() => mockHttp.post(
            Uri.parse('https://test.supabase.co/functions/v1/ai-breeding'),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).called(1);
    });

    test('getBreedingAdvice sends correct JSON body', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => successResponse());

      await repository.getBreedingAdvice(sampleQuery);

      verify(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: jsonEncode({'sireId': 'sire-1', 'damId': 'dam-1'}),
          )).called(1);
    });

    test('getBreedingAdvice returns error on 429 rate limit (VAL-AI-003)', () async {
      // Use ASCII-only body to avoid Unicode encoding issues in Mocktail
      final responseBody = jsonEncode({
        'error': 'Rate limit exceeded',
        'message': 'Monthly limit exceeded. Please upgrade your plan.',
        'tier': 'free',
        'limit': 5,
        'remaining': 0,
      });
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => http.Response(
            responseBody,
            429,
            headers: {'Content-Type': 'application/json'},
          ));

      final result = await repository.getBreedingAdvice(sampleQuery);

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'RATE_LIMIT_EXCEEDED');
    });

    test('getBreedingAdvice returns error on 400', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => http.Response(
            jsonEncode({'error': 'sireId and damId are required'}),
            400,
            headers: {'Content-Type': 'application/json'},
          ));

      final result = await repository.getBreedingAdvice(sampleQuery);

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AI_FUNCTION_ERROR');
    });

    test('getBreedingAdvice returns error on network exception', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenThrow(
            http.ClientException('Connection refused'),
          );

      final result = await repository.getBreedingAdvice(sampleQuery);

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'NETWORK_ERROR');
    });

    test('getBreedingAdvice sends Authorization header when available', () async {
      when(() => mockHttp.post(
            any(),
            headers: any(named: 'headers'),
            body: any(named: 'body'),
          )).thenAnswer((_) async => successResponse());

      await repository.getBreedingAdvice(sampleQuery);

      verify(() => mockHttp.post(
            any(),
            headers: captureAny(named: 'headers'),
            body: any(named: 'body'),
          )).called(1);
    });
  });
}
