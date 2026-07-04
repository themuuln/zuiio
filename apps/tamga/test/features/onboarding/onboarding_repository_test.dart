import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/core/storage/local_storage.dart';
import 'package:tamga/src/features/onboarding/data/onboarding_repository.dart';
import 'package:tamga/src/features/onboarding/domain/onboarding_data.dart';
import 'package:tamga/src/shared/domain/horse.dart';

class MockLocalStorage extends Mock implements LocalStorage {}

void main() {
  late MockLocalStorage mockStore;
  late OnboardingRepository repo;

  setUp(() {
    mockStore = MockLocalStorage();
    repo = OnboardingRepository(mockStore);
  });

  group('OnboardingRepository', () {
    group('load', () {
      test('returns empty when no data stored', () {
        when(() => mockStore.readObject('onboarding.data')).thenReturn(null);

        final data = repo.load();

        expect(data.isCompleted, isFalse);
        expect(data.userRole, isNull);
        expect(data.displayName, isNull);
        verify(() => mockStore.readObject('onboarding.data')).called(1);
      });

      test('returns deserialized data when stored', () {
        when(() => mockStore.readObject('onboarding.data')).thenReturn({
          'isCompleted': true,
          'userRole': 'breeder',
          'displayName': 'Тэмүүлэн',
          'region': 'Улаанбаатар',
          'phone': '99112233',
          'horseName': 'Хан Хүлэг',
          'horseGender': 'stallion',
          'horseCoat': 'хээр',
          'horseBirthYear': 2020,
          'horseEntrySkipped': false,
          'pendingSync': true,
        });

        final data = repo.load();

        expect(data.isCompleted, isTrue);
        expect(data.userRole, 'breeder');
        expect(data.displayName, 'Тэмүүлэн');
        expect(data.region, 'Улаанбаатар');
        expect(data.phone, '99112233');
        expect(data.horseName, 'Хан Хүлэг');
        expect(data.horseGender, HorseGender.stallion);
        expect(data.horseCoat, 'хээр');
        expect(data.horseBirthYear, 2020);
        expect(data.pendingSync, isTrue);
      });

      test('returns empty when stored map is missing fields', () {
        when(
          () => mockStore.readObject('onboarding.data'),
        ).thenReturn({'isCompleted': false});

        final data = repo.load();

        expect(data.isCompleted, isFalse);
        expect(data.userRole, isNull);
        expect(data.horseName, isNull);
      });
    });

    group('save', () {
      test('writes serialized data to store', () async {
        when(
          () => mockStore.writeObject(any(), any()),
        ).thenAnswer((_) async {});

        const data = OnboardingData(
          isCompleted: true,
          userRole: 'casual',
          displayName: 'Test User',
          region: 'Улаанбаатар',
        );

        await repo.save(data);

        final captured = verify(
          () => mockStore.writeObject('onboarding.data', captureAny()),
        ).captured;

        final savedMap = captured.first as Map<String, dynamic>;
        expect(savedMap['isCompleted'], true);
        expect(savedMap['userRole'], 'casual');
        expect(savedMap['displayName'], 'Test User');
        expect(savedMap['region'], 'Улаанбаатар');
      });

      test('save then load returns same data', () async {
        when(
          () => mockStore.writeObject(any(), any()),
        ).thenAnswer((_) async {});
        when(() => mockStore.readObject('onboarding.data')).thenReturn({
          'isCompleted': false,
          'userRole': 'stable',
          'displayName': 'Бат',
        });

        const data = OnboardingData(
          isCompleted: false,
          userRole: 'stable',
          displayName: 'Бат',
        );
        await repo.save(data);
        final loaded = repo.load();

        expect(loaded.userRole, 'stable');
        expect(loaded.displayName, 'Бат');
      });
    });

    group('markCompleted', () {
      test('sets isCompleted to true on existing data', () async {
        when(() => mockStore.readObject('onboarding.data')).thenReturn({
          'isCompleted': false,
          'userRole': 'casual',
          'displayName': 'Test',
        });
        when(
          () => mockStore.writeObject(any(), any()),
        ).thenAnswer((_) async {});

        await repo.markCompleted();

        final captured = verify(
          () => mockStore.writeObject('onboarding.data', captureAny()),
        ).captured;

        final savedMap = captured.first as Map<String, dynamic>;
        expect(savedMap['isCompleted'], true);
        expect(savedMap['userRole'], 'casual');
        expect(savedMap['displayName'], 'Test');
      });

      test('marks completed on empty data', () async {
        when(() => mockStore.readObject('onboarding.data')).thenReturn(null);
        when(
          () => mockStore.writeObject(any(), any()),
        ).thenAnswer((_) async {});

        await repo.markCompleted();

        final captured = verify(
          () => mockStore.writeObject('onboarding.data', captureAny()),
        ).captured;

        final savedMap = captured.first as Map<String, dynamic>;
        expect(savedMap['isCompleted'], true);
      });

      test('preserves all existing fields', () async {
        when(() => mockStore.readObject('onboarding.data')).thenReturn({
          'isCompleted': false,
          'userRole': 'breeder',
          'displayName': 'Тэмүүлэн',
          'region': 'Дархан',
          'phone': '88112233',
          'horseName': 'Хан Хүлэг',
          'horseGender': 'stallion',
          'horseEntrySkipped': false,
          'pendingSync': false,
        });
        when(
          () => mockStore.writeObject(any(), any()),
        ).thenAnswer((_) async {});

        await repo.markCompleted();

        final captured = verify(
          () => mockStore.writeObject('onboarding.data', captureAny()),
        ).captured;

        final savedMap = captured.first as Map<String, dynamic>;
        expect(savedMap['isCompleted'], true);
        expect(savedMap['userRole'], 'breeder');
        expect(savedMap['displayName'], 'Тэмүүлэн');
        expect(savedMap['region'], 'Дархан');
        expect(savedMap['phone'], '88112233');
        expect(savedMap['horseName'], 'Хан Хүлэг');
      });
    });

    group('reset', () {
      test('removes onboarding data from store', () async {
        when(
          () => mockStore.remove('onboarding.data'),
        ).thenAnswer((_) async {});

        await repo.reset();

        verify(() => mockStore.remove('onboarding.data')).called(1);
      });

      test('load returns empty after reset', () async {
        when(
          () => mockStore.writeObject(any(), any()),
        ).thenAnswer((_) async {});
        when(
          () => mockStore.remove('onboarding.data'),
        ).thenAnswer((_) async {});
        when(() => mockStore.readObject('onboarding.data')).thenReturn(null);

        const data = OnboardingData(
          isCompleted: true,
          userRole: 'casual',
          displayName: 'Test',
        );
        await repo.save(data);
        await repo.reset();
        final loaded = repo.load();

        expect(loaded.isCompleted, isFalse);
        expect(loaded.userRole, isNull);
      });
    });
  });
}
