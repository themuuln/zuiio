import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/widgets/widgets.dart';
import 'package:tamga/src/features/ai/application/ai_providers.dart';
import 'package:tamga/src/features/ai/data/ai_repository.dart';
import 'package:tamga/src/features/ai/domain/breeding_advice.dart';
import 'package:tamga/src/features/ai/domain/breeding_query.dart';
import 'package:tamga/src/features/ai/presentation/breeding_advice_screen.dart';
import 'package:tamga/src/features/horses/application/horses_providers.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';
import 'package:tamga/src/shared/domain/horse.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockAiRepository extends Mock implements AiRepository {}

// ── Test Helpers ────────────────────────────────────────────────────────

Horse createStallion({
  String id = 'stallion-1',
  String name = 'Sire Horse',
  String coat = 'Хээр',
  int birthYear = 2019,
}) {
  return Horse(
    id: id,
    ownerId: 'owner-1',
    name: name,
    relationLabel: 'Test',
    coat: coat,
    birthYear: birthYear,
    awardCount: 0,
    offspringCount: 0,
    isOwnedByHousehold: true,
    notes: '',
    gender: HorseGender.stallion,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

Horse createMare({
  String id = 'mare-1',
  String name = 'Dam Horse',
  String coat = 'Халиун',
  int birthYear = 2020,
}) {
  return Horse(
    id: id,
    ownerId: 'owner-1',
    name: name,
    relationLabel: 'Test',
    coat: coat,
    birthYear: birthYear,
    awardCount: 0,
    offspringCount: 0,
    isOwnedByHousehold: true,
    notes: '',
    gender: HorseGender.mare,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

BreedingAdvice createMockAdvice({
  InbreedingRisk risk = InbreedingRisk.medium,
  int riskScore = 45,
  String healthNotes = 'Test health notes.',
  List<CoatColorPrediction> coatColorPredictions = const [
    CoatColorPrediction(color: 'Bay', probability: 50),
    CoatColorPrediction(color: 'Black', probability: 50),
  ],
  List<String> breedSuggestions = const ['Good match'],
}) {
  return BreedingAdvice(
    compatibilityScore: 50,
    inbreedingRisk: risk,
    riskScore: riskScore,
    coatColorPredictions: coatColorPredictions,
    healthRisks: const [],
    healthNotes: healthNotes,
    breedingWindow: '',
    overallRecommendation: OverallRecommendation.consultVet,
    breedSuggestions: breedSuggestions,
    mongolianBreedNotes: '',
    commonAncestors: const [],
  );
}

// ── Helper: select dropdown item ───────────────────────────────────────

Future<void> selectDropdownItem(
  WidgetTester tester, {
  required int dropdownIndex,
  required String itemText,
}) async {
  await tester.tap(
    find.byType(DropdownButtonFormField<String>).at(dropdownIndex),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.text(itemText).last);
  await tester.pumpAndSettle();
}

// ── Widget Builder ──────────────────────────────────────────────────────

Widget createBreedingAdviceScreen({
  required List<Horse> horses,
  required AiRepository repository,
  BreedingQuotaInfo? quotaOverride,
  bool simulateHorseError = false,
}) {
  return ProviderScope(
    overrides: [
      horsesProvider.overrideWith((ref) async {
        if (simulateHorseError) {
          throw Exception('Failed to load horses');
        }
        return horses;
      }),
      aiRepositoryProvider.overrideWith((ref) => repository),
      if (quotaOverride != null)
        breedingQuotaProvider.overrideWith((ref) async => quotaOverride),
    ],
    child: MaterialApp(
      theme: AppTheme.light(),
      home: const BreedingAdviceScreen(),
    ),
  );
}

void main() {
  late MockAiRepository mockRepository;

  setUpAll(() {
    registerFallbackValue(BreedingQuery(sireId: '', damId: ''));
  });

  setUp(() {
    mockRepository = MockAiRepository();
  });

  group('BreedingAdviceScreen — VAL-AI-004', () {
    testWidgets('shows loading indicator while fetching horses', (
      tester,
    ) async {
      final completer = Completer<List<Horse>>();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            horsesProvider.overrideWith((ref) => completer.future),
            aiRepositoryProvider.overrideWith((ref) => mockRepository),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const BreedingAdviceScreen(),
          ),
        ),
      );

      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete([]);
      await tester.pumpAndSettle();
    });

    testWidgets('shows empty state when no horses registered', (tester) async {
      await tester.pumpWidget(
        createBreedingAdviceScreen(horses: [], repository: mockRepository),
      );
      await tester.pumpAndSettle();

      expect(find.text('Азарга болон гүү бүртгээгүй байна.'), findsOneWidget);
      expect(find.byType(EmptyState), findsOneWidget);
    });

    testWidgets('shows empty state when no stallions', (tester) async {
      final mares = [createMare()];

      await tester.pumpWidget(
        createBreedingAdviceScreen(horses: mares, repository: mockRepository),
      );
      await tester.pumpAndSettle();

      expect(find.text('Азарга бүртгээгүй байна.'), findsOneWidget);
      expect(find.byType(EmptyState), findsOneWidget);
    });

    testWidgets('shows empty state when no mares', (tester) async {
      final stallions = [createStallion()];

      await tester.pumpWidget(
        createBreedingAdviceScreen(
          horses: stallions,
          repository: mockRepository,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Гүү бүртгээгүй байна.'), findsOneWidget);
      expect(find.byType(EmptyState), findsOneWidget);
    });

    testWidgets('shows error widget when horse loading fails', (tester) async {
      await tester.pumpWidget(
        createBreedingAdviceScreen(
          horses: [],
          repository: mockRepository,
          simulateHorseError: true,
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump();

      expect(find.byType(TamgaErrorWidget), findsOneWidget);
    });

    testWidgets('shows header card and pair selector with horses', (
      tester,
    ) async {
      final horses = [createStallion(), createMare()];

      await tester.pumpWidget(
        createBreedingAdviceScreen(horses: horses, repository: mockRepository),
      );
      await tester.pumpAndSettle();

      expect(find.text('AI Үржүүлгийн зөвлөгөө'), findsOneWidget);
      expect(find.text('Хос сонгох'), findsOneWidget);
      expect(find.text('Аав морь (Sire)'), findsOneWidget);
      expect(find.text('Ээж морь (Dam)'), findsOneWidget);
      expect(find.text('Анализ хийх'), findsOneWidget);
    });

    testWidgets('analyze button is disabled when no horses selected', (
      tester,
    ) async {
      final horses = [createStallion(), createMare()];

      await tester.pumpWidget(
        createBreedingAdviceScreen(horses: horses, repository: mockRepository),
      );
      await tester.pumpAndSettle();

      final button = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Анализ хийх'),
      );
      expect(button.onPressed, isNull);
    });
  });

  group('BreedingAdviceScreen — full analysis flow', () {
    testWidgets('select horses and perform analysis successfully', (
      tester,
    ) async {
      final stallion = createStallion(id: 's1', name: 'Sire Horse');
      final mare = createMare(id: 'm1', name: 'Dam Horse');
      final horses = [stallion, mare];

      final advice = createMockAdvice(
        risk: InbreedingRisk.low,
        riskScore: 15,
        healthNotes: 'Low risk pair with good genetic diversity.',
        coatColorPredictions: [
          CoatColorPrediction(color: 'Bay', probability: 50),
          CoatColorPrediction(color: 'Chestnut', probability: 50),
        ],
        breedSuggestions: ['Excellent match'],
      );

      when(
        () => mockRepository.getBreedingAdvice(
          BreedingQuery(sireId: stallion.id, damId: mare.id),
        ),
      ).thenAnswer((_) async => Result.ok(advice));

      await tester.pumpWidget(
        createBreedingAdviceScreen(
          horses: horses,
          repository: mockRepository,
          quotaOverride: const BreedingQuotaInfo(
            tier: SubscriptionTier.free,
            limit: 5,
            used: 0,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Select sire from first dropdown
      await selectDropdownItem(
        tester,
        dropdownIndex: 0,
        itemText: 'Sire Horse (Хээр, 2019)',
      );

      // Select dam from second dropdown
      await selectDropdownItem(
        tester,
        dropdownIndex: 1,
        itemText: 'Dam Horse (Халиун, 2020)',
      );

      // Button should now be enabled
      final button = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Анализ хийх'),
      );
      expect(button.onPressed, isNotNull);

      // Tap analyze
      await tester.tap(find.text('Анализ хийх'));
      await tester.pumpAndSettle();

      // Verify results are displayed
      verify(
        () => mockRepository.getBreedingAdvice(
          BreedingQuery(sireId: stallion.id, damId: mare.id),
        ),
      ).called(1);

      // Check results
      expect(find.text('Цус ойртолтын эрсдэл'), findsOneWidget);
      expect(find.text('Бага'), findsOneWidget);
      expect(find.text('15/100'), findsOneWidget);
      expect(find.text('Эрүүл мэндийн тэмдэглэл'), findsOneWidget);
      expect(
        find.text('Low risk pair with good genetic diversity.'),
        findsOneWidget,
      );
      expect(find.text('Өнгөний таамаглал'), findsOneWidget);
      expect(find.text('Bay'), findsOneWidget);
      expect(find.text('Chestnut'), findsOneWidget);
      expect(find.text('Үүлдрийн зөвлөмж'), findsOneWidget);
      expect(find.text('Excellent match'), findsOneWidget);
    });

    testWidgets('shows error state on analysis failure', (tester) async {
      final stallion = createStallion(id: 's1', name: 'Sire Horse');
      final mare = createMare(id: 'm1', name: 'Dam Horse');
      final horses = [stallion, mare];

      when(() => mockRepository.getBreedingAdvice(any())).thenAnswer(
        (_) async => Result.fail(
          AppException(
            message: 'AI шинжилгээ авахад алдаа гарлаа',
            code: 'NETWORK_ERROR',
          ),
        ),
      );

      await tester.pumpWidget(
        createBreedingAdviceScreen(
          horses: horses,
          repository: mockRepository,
          quotaOverride: const BreedingQuotaInfo(
            tier: SubscriptionTier.free,
            limit: 5,
            used: 0,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await selectDropdownItem(
        tester,
        dropdownIndex: 0,
        itemText: 'Sire Horse (Хээр, 2019)',
      );

      await selectDropdownItem(
        tester,
        dropdownIndex: 1,
        itemText: 'Dam Horse (Халиун, 2020)',
      );

      await tester.tap(find.text('Анализ хийх'));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('AI шинжилгээ авахад алдаа гарлаа'),
        findsOneWidget,
      );
    });
  });

  group('BreedingAdviceScreen — quota and upgrade prompt', () {
    testWidgets('shows upgrade prompt when quota is exhausted', (tester) async {
      final stallion = createStallion(id: 's1', name: 'Sire Horse');
      final mare = createMare(id: 'm1', name: 'Dam Horse');
      final horses = [stallion, mare];

      final exhaustedQuota = BreedingQuotaInfo(
        tier: SubscriptionTier.free,
        limit: 5,
        used: 5,
      );

      await tester.pumpWidget(
        createBreedingAdviceScreen(
          horses: horses,
          repository: mockRepository,
          quotaOverride: exhaustedQuota,
        ),
      );
      await tester.pumpAndSettle();

      await selectDropdownItem(
        tester,
        dropdownIndex: 0,
        itemText: 'Sire Horse (Хээр, 2019)',
      );

      await selectDropdownItem(
        tester,
        dropdownIndex: 1,
        itemText: 'Dam Horse (Халиун, 2020)',
      );

      await tester.tap(find.text('Анализ хийх'));
      await tester.pumpAndSettle();

      expect(find.text('Боломжоо алдахгүй байгаарай!'), findsOneWidget);
    });
  });
}
