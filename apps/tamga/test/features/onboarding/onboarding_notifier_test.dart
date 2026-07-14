import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tamga/src/features/onboarding/domain/onboarding_data.dart';
import 'package:tamga/src/features/onboarding/data/onboarding_repository.dart';
import 'package:tamga/src/features/shared/data/local_json_store.dart';
import 'package:tamga/src/shared/domain/horse.dart';

/// Tests the OnboardingRepository (the persistence layer behind the notifier)
/// since the notifier internally creates SharedPreferences and is tightly
/// coupled to Supabase/Isar for complete() and skipAll().
///
/// We test the state machine logic by exercising the repo directly
/// and verifying the data transformations that the notifier delegates to.
void main() {
  late LocalJsonStore store;
  late OnboardingRepository repo;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    store = LocalJsonStore(prefs);
    repo = OnboardingRepository(store);
  });

  group('OnboardingNotifier state transitions (via repo)', () {
    test('initial state is empty (not completed)', () {
      final data = repo.load();
      expect(data.isCompleted, isFalse);
      expect(data.userRole, isNull);
    });

    test('step 1→2: setting userRole preserves completion state', () {
      var data = repo.load();
      data = data.copyWith(userRole: 'casual');
      expect(data.userRole, 'casual');
      expect(data.isCompleted, isFalse);
    });

    test('step 2→3: adding auth preserves role', () {
      var data = repo.load();
      data = data.copyWith(userRole: 'breeder');
      // In v2 flow, step 3 is auth (no data collected here)
      expect(data.userRole, 'breeder');
      expect(data.isCompleted, isFalse);
    });

    test('step 3→4: adding horse data preserves profile', () {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'casual',
        displayName: 'Бат',
        region: 'Улаанбаатар',
      );
      data = data.copyWith(
        horseName: 'Хан Хүлэг',
        horseGender: HorseGender.stallion,
        horseCoat: 'хээр',
        horseBirthYear: 2020,
      );
      expect(data.userRole, 'casual');
      expect(data.displayName, 'Бат');
      expect(data.region, 'Улаанбаатар');
      expect(data.horseName, 'Хан Хүлэг');
      expect(data.horseGender, HorseGender.stallion);
      expect(data.isCompleted, isFalse);
    });

    test('step 4→5: horse entry skipped sets flag', () {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'stable',
        displayName: 'Наран',
        horseEntrySkipped: true,
      );
      expect(data.horseEntrySkipped, isTrue);
      expect(data.horseName, isNull);
      expect(data.isCompleted, isFalse);
    });

    test('step 5: completing onboarding with notifications', () async {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'breeder',
        displayName: 'Тэмүүлэн',
        region: 'Дархан',
        phone: '99112233',
        horseName: 'Хан Хүлэг',
        horseGender: HorseGender.stallion,
        notificationsEnabled: true,
      );
      data = data.copyWith(isCompleted: true, pendingSync: true);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.isCompleted, isTrue);
      expect(loaded.pendingSync, isTrue);
      expect(loaded.notificationsEnabled, isTrue);
      expect(loaded.userRole, 'breeder');
      expect(loaded.displayName, 'Тэмүүлэн');
    });

    test('step 5: completing without notifications', () async {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'casual',
        horseEntrySkipped: true,
        notificationsEnabled: false,
      );
      data = data.copyWith(isCompleted: true, pendingSync: true);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.isCompleted, isTrue);
      expect(loaded.notificationsEnabled, isFalse);
      expect(loaded.horseEntrySkipped, isTrue);
    });
  });

  group('skipAll (marks complete without user data)', () {
    test('skipAll saves completed state with no user data', () async {
      await repo.save(const OnboardingData(isCompleted: true));
      final data = repo.load();
      expect(data.isCompleted, isTrue);
      expect(data.userRole, isNull);
      expect(data.displayName, isNull);
      expect(data.horseName, isNull);
    });

    test('skipAll on partially filled data still marks complete', () async {
      var data = repo.load();
      data = data.copyWith(userRole: 'casual', displayName: 'Test');
      await repo.save(data);
      await repo.save(const OnboardingData(isCompleted: true));
      final loaded = repo.load();
      expect(loaded.isCompleted, isTrue);
      expect(loaded.userRole, isNull);
    });
  });

  group('complete with/without horse', () {
    test('complete without horse data', () async {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'casual',
        displayName: 'Бат',
        region: 'Улаанбаатар',
      );
      data = data.copyWith(
        isCompleted: true,
        horseEntrySkipped: true,
        pendingSync: true,
      );
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.isCompleted, isTrue);
      expect(loaded.horseName, isNull);
      expect(loaded.horseEntrySkipped, isTrue);
      expect(loaded.pendingSync, isTrue);
    });

    test('complete with horse data', () async {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'breeder',
        displayName: 'Тэмүүлэн',
        region: 'Дархан',
        horseName: 'Хан Хүлэг',
        horseGender: HorseGender.stallion,
        horseCoat: 'хээр',
        horseBirthYear: 2020,
        sireName: 'Алтан',
        damName: 'Наран',
      );
      data = data.copyWith(isCompleted: true, pendingSync: false);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.isCompleted, isTrue);
      expect(loaded.horseName, 'Хан Хүлэг');
      expect(loaded.horseGender, HorseGender.stallion);
      expect(loaded.horseCoat, 'хээр');
      expect(loaded.horseBirthYear, 2020);
      expect(loaded.sireName, 'Алтан');
      expect(loaded.damName, 'Наран');
      expect(loaded.horseEntrySkipped, isFalse);
    });

    test('complete with pedigree data', () async {
      var data = repo.load();
      data = data.copyWith(
        horseName: 'Мөнххүслэг',
        sireName: 'Хан Хүлэг',
        damName: 'Наран',
      );
      data = data.copyWith(isCompleted: true);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.sireName, 'Хан Хүлэг');
      expect(loaded.damName, 'Наран');
    });
  });

  group('onboardingCompletedProvider logic', () {
    test('returns false when onboarding not completed', () {
      final data = repo.load();
      final isCompleted = data.isCompleted;
      expect(isCompleted, isFalse);
    });

    test('returns true when onboarding is completed', () async {
      await repo.save(const OnboardingData(isCompleted: true));
      final data = repo.load();
      expect(data.isCompleted, isTrue);
    });
  });

  group('onboardingPendingSyncProvider logic', () {
    test('returns false when pendingSync is false', () {
      final data = repo.load();
      expect(data.pendingSync, isFalse);
    });

    test('returns true when pendingSync is true', () async {
      var data = repo.load();
      data = data.copyWith(pendingSync: true);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.pendingSync, isTrue);
    });

    test('pendingSync cleared after sync', () async {
      var data = repo.load();
      data = data.copyWith(pendingSync: true);
      await repo.save(data);

      data = repo.load();
      data = data.copyWith(pendingSync: false);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.pendingSync, isFalse);
    });
  });

  group('markCompleted preserves existing data', () {
    test('markCompleted through repository', () async {
      var data = repo.load();
      data = data.copyWith(
        userRole: 'breeder',
        displayName: 'Тэмүүлэн',
        region: 'Улаанбаатар',
        phone: '99112233',
      );
      await repo.save(data);
      await repo.markCompleted();

      final loaded = repo.load();
      expect(loaded.isCompleted, isTrue);
      expect(loaded.userRole, 'breeder');
      expect(loaded.displayName, 'Тэмүүлэн');
      expect(loaded.region, 'Улаанбаатар');
      expect(loaded.phone, '99112233');
    });
  });

  group('backward compatibility', () {
    test('v1 data (no onboardingVersion) loads with version 1', () async {
      // Simulate old data without onboardingVersion field
      final oldMap = {
        'isCompleted': true,
        'userRole': 'casual',
        'horseEntrySkipped': false,
        'pendingSync': false,
      };
      final data = OnboardingData.fromMap(oldMap);
      expect(data.onboardingVersion, 1);
      expect(data.isCompleted, isTrue);
      expect(data.userRole, 'casual');
      expect(data.notificationsEnabled, isFalse);
    });

    test('v2 data loads with version 2', () async {
      var data = repo.load();
      data = data.copyWith(onboardingVersion: 2, notificationsEnabled: true);
      await repo.save(data);

      final loaded = repo.load();
      expect(loaded.onboardingVersion, 2);
      expect(loaded.notificationsEnabled, isTrue);
    });
  });
}
