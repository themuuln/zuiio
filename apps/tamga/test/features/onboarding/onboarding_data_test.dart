import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/onboarding/domain/onboarding_data.dart';
import 'package:tamga/src/shared/domain/horse.dart';

void main() {
  group('UserRole', () {
    test('has exactly 3 values: casual, breeder, stable', () {
      expect(UserRole.values.length, 3);
      expect(UserRole.values, contains(UserRole.casual));
      expect(UserRole.values, contains(UserRole.breeder));
      expect(UserRole.values, contains(UserRole.stable));
    });

    group('displayName', () {
      test('casual returns correct Mongolian label', () {
        expect(UserRole.casual.displayName, 'Морь сонирхогч');
      });

      test('breeder returns correct Mongolian label', () {
        expect(UserRole.breeder.displayName, 'Уяач / Малчин');
      });

      test('stable returns correct Mongolian label', () {
        expect(UserRole.stable.displayName, 'Жүчээ / Бизнес');
      });
    });

    group('subtitle', () {
      test('casual returns descriptive subtitle', () {
        expect(
          UserRole.casual.subtitle,
          'Цөөн адуутай, хувийн хэрэглээ болон хобби чиглэлээр',
        );
      });

      test('breeder returns descriptive subtitle', () {
        expect(
          UserRole.breeder.subtitle,
          'Олон адуутай, удам угсаа хянах, хурдан морины чиглэлээр',
        );
      });

      test('stable returns descriptive subtitle', () {
        expect(UserRole.stable.subtitle, 'Жүчээ бизнес, олон хэрэглэгч');
      });
    });

    group('iconName', () {
      test('casual returns person', () {
        expect(UserRole.casual.iconName, 'person');
      });

      test('breeder returns pets', () {
        expect(UserRole.breeder.iconName, 'pets');
      });

      test('stable returns business', () {
        expect(UserRole.stable.iconName, 'business');
      });
    });

    group('iconAssetPath', () {
      test('casual returns horse emoji', () {
        expect(UserRole.casual.iconAssetPath, '🐎');
      });

      test('breeder returns grass emoji', () {
        expect(UserRole.breeder.iconAssetPath, '🌿');
      });

      test('stable returns store emoji', () {
        expect(UserRole.stable.iconAssetPath, '🏪');
      });
    });
  });

  group('OnboardingGoal', () {
    test('has expected goal values', () {
      expect(OnboardingGoal.values.length, 5);
      expect(OnboardingGoal.values, contains(OnboardingGoal.trackOneHorse));
      expect(OnboardingGoal.values, contains(OnboardingGoal.manageHerd));
      expect(OnboardingGoal.values, contains(OnboardingGoal.improveBreeding));
      expect(OnboardingGoal.values, contains(OnboardingGoal.trackHealth));
      expect(OnboardingGoal.values, contains(OnboardingGoal.prepareEvents));
    });

    test('displayName and subtitle are non-empty', () {
      for (final goal in OnboardingGoal.values) {
        expect(goal.displayName, isNotEmpty);
        expect(goal.subtitle, isNotEmpty);
        expect(goal.emoji, isNotEmpty);
      }
    });
  });

  group('OnboardingData', () {
    group('constructor', () {
      test('empty creates default with isCompleted false', () {
        const data = OnboardingData.empty;
        expect(data.isCompleted, isFalse);
        expect(data.userRole, isNull);
        expect(data.firstGoal, isNull);
        expect(data.displayName, isNull);
        expect(data.region, isNull);
        expect(data.phone, isNull);
        expect(data.horseName, isNull);
        expect(data.horseEntrySkipped, isFalse);
        expect(data.notificationsEnabled, isFalse);
        expect(data.pendingSync, isFalse);
      });

      test('empty defaults to onboardingVersion 3', () {
        const data = OnboardingData.empty;
        expect(data.onboardingVersion, 3);
      });

      test('completed creates data with isCompleted true', () {
        const data = OnboardingData.completed;
        expect(data.isCompleted, isTrue);
      });

      test('full constructor sets all fields', () {
        const data = OnboardingData(
          isCompleted: true,
          onboardingVersion: 3,
          userRole: 'breeder',
          firstGoal: 'trackHealth',
          displayName: 'Тэмүүлэн',
          region: 'Улаанбаатар',
          phone: '99112233',
          horseName: 'Хан Хүлэг',
          horseGender: HorseGender.stallion,
          horseCoat: 'бүрэндэй',
          horseBirthYear: 2020,
          sireName: 'Алтан',
          damName: 'Наран',
          horseEntrySkipped: false,
          notificationsEnabled: true,
          pendingSync: true,
        );
        expect(data.isCompleted, isTrue);
        expect(data.onboardingVersion, 3);
        expect(data.userRole, 'breeder');
        expect(data.firstGoal, 'trackHealth');
        expect(data.displayName, 'Тэмүүлэн');
        expect(data.region, 'Улаанбаатар');
        expect(data.phone, '99112233');
        expect(data.horseName, 'Хан Хүлэг');
        expect(data.horseGender, HorseGender.stallion);
        expect(data.horseCoat, 'бүрэндэй');
        expect(data.horseBirthYear, 2020);
        expect(data.sireName, 'Алтан');
        expect(data.damName, 'Наран');
        expect(data.horseEntrySkipped, isFalse);
        expect(data.notificationsEnabled, isTrue);
        expect(data.pendingSync, isTrue);
      });
    });

    group('copyWith', () {
      test('preserves existing fields when none specified', () {
        const orig = OnboardingData(
          isCompleted: false,
          userRole: 'casual',
          firstGoal: 'trackOneHorse',
          displayName: 'Test',
        );
        final copied = orig.copyWith();
        expect(copied.isCompleted, isFalse);
        expect(copied.userRole, 'casual');
        expect(copied.firstGoal, 'trackOneHorse');
        expect(copied.displayName, 'Test');
      });

      test('overrides firstGoal', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(firstGoal: 'prepareEvents');
        expect(copied.firstGoal, 'prepareEvents');
      });

      test('overrides displayName', () {
        const orig = OnboardingData(
          isCompleted: false,
          displayName: 'Old Name',
        );
        final copied = orig.copyWith(displayName: 'New Name');
        expect(copied.displayName, 'New Name');
        expect(copied.isCompleted, isFalse);
      });

      test('overrides region', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(region: 'Дархан');
        expect(copied.region, 'Дархан');
      });

      test('overrides phone', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(phone: '88112233');
        expect(copied.phone, '88112233');
      });

      test('overrides isCompleted', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(isCompleted: true);
        expect(copied.isCompleted, isTrue);
      });

      test('overrides userRole', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(userRole: 'stable');
        expect(copied.userRole, 'stable');
      });

      test('overrides horseEntrySkipped', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(horseEntrySkipped: true);
        expect(copied.horseEntrySkipped, isTrue);
      });

      test('overrides notificationsEnabled', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(notificationsEnabled: true);
        expect(copied.notificationsEnabled, isTrue);
      });

      test('overrides pendingSync', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(pendingSync: true);
        expect(copied.pendingSync, isTrue);
      });

      test('overrides onboardingVersion', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(onboardingVersion: 4);
        expect(copied.onboardingVersion, 4);
      });

      test('overrides horse fields', () {
        const orig = OnboardingData(isCompleted: false);
        final copied = orig.copyWith(
          horseName: 'Мөнххүслэг',
          horseGender: HorseGender.mare,
          horseCoat: 'хээр',
          horseBirthYear: 2019,
          sireName: 'Алтан',
          damName: 'Наран',
        );
        expect(copied.horseName, 'Мөнххүслэг');
        expect(copied.horseGender, HorseGender.mare);
        expect(copied.horseCoat, 'хээр');
        expect(copied.horseBirthYear, 2019);
        expect(copied.sireName, 'Алтан');
        expect(copied.damName, 'Наран');
      });
    });

    group('serialization - toMap', () {
      test('serializes empty data', () {
        const data = OnboardingData.empty;
        final map = data.toMap();
        expect(map['isCompleted'], isFalse);
        expect(map['onboardingVersion'], 3);
        expect(map.containsKey('userRole'), isFalse);
        expect(map.containsKey('firstGoal'), isFalse);
        expect(map.containsKey('displayName'), isFalse);
        expect(map.containsKey('region'), isFalse);
        expect(map.containsKey('phone'), isFalse);
        expect(map.containsKey('horseName'), isFalse);
        expect(map['horseEntrySkipped'], isFalse);
        expect(map['notificationsEnabled'], isFalse);
        expect(map['pendingSync'], isFalse);
      });

      test('serializes all non-null fields', () {
        const data = OnboardingData(
          isCompleted: true,
          onboardingVersion: 3,
          userRole: 'breeder',
          firstGoal: 'improveBreeding',
          displayName: 'Тэмүүлэн',
          region: 'Улаанбаатар',
          phone: '99112233',
          horseName: 'Хан Хүлэг',
          horseGender: HorseGender.stallion,
          horseCoat: 'бүрэндэй',
          horseBirthYear: 2020,
          sireName: 'Алтан',
          damName: 'Наран',
          horseEntrySkipped: true,
          notificationsEnabled: true,
          pendingSync: true,
        );
        final map = data.toMap();
        expect(map['isCompleted'], true);
        expect(map['onboardingVersion'], 3);
        expect(map['userRole'], 'breeder');
        expect(map['firstGoal'], 'improveBreeding');
        expect(map['displayName'], 'Тэмүүлэн');
        expect(map['region'], 'Улаанбаатар');
        expect(map['phone'], '99112233');
        expect(map['horseName'], 'Хан Хүлэг');
        expect(map['horseGender'], 'stallion');
        expect(map['horseCoat'], 'бүрэндэй');
        expect(map['horseBirthYear'], 2020);
        expect(map['sireName'], 'Алтан');
        expect(map['damName'], 'Наран');
        expect(map['horseEntrySkipped'], true);
        expect(map['notificationsEnabled'], true);
        expect(map['pendingSync'], true);
      });
    });

    group('serialization - fromMap', () {
      test('deserializes full map', () {
        final map = {
          'isCompleted': true,
          'onboardingVersion': 3,
          'userRole': 'casual',
          'firstGoal': 'trackOneHorse',
          'displayName': 'Тэмүүлэн',
          'region': 'Улаанбаатар',
          'phone': '99112233',
          'horseName': 'Хан Хүлэг',
          'horseGender': 'stallion',
          'horseCoat': 'бүрэндэй',
          'horseBirthYear': 2020,
          'sireName': 'Алтан',
          'damName': 'Наран',
          'horseEntrySkipped': true,
          'notificationsEnabled': true,
          'pendingSync': true,
        };
        final data = OnboardingData.fromMap(map);
        expect(data.isCompleted, isTrue);
        expect(data.onboardingVersion, 3);
        expect(data.userRole, 'casual');
        expect(data.firstGoal, 'trackOneHorse');
        expect(data.displayName, 'Тэмүүлэн');
        expect(data.region, 'Улаанбаатар');
        expect(data.phone, '99112233');
        expect(data.horseName, 'Хан Хүлэг');
        expect(data.horseGender, HorseGender.stallion);
        expect(data.horseCoat, 'бүрэндэй');
        expect(data.horseBirthYear, 2020);
        expect(data.sireName, 'Алтан');
        expect(data.damName, 'Наран');
        expect(data.horseEntrySkipped, isTrue);
        expect(data.notificationsEnabled, isTrue);
        expect(data.pendingSync, isTrue);
      });

      test('deserializes empty map with defaults', () {
        final map = <String, dynamic>{};
        final data = OnboardingData.fromMap(map);
        expect(data.isCompleted, isFalse);
        expect(data.onboardingVersion, 1);
        expect(data.userRole, isNull);
        expect(data.firstGoal, isNull);
        expect(data.displayName, isNull);
        expect(data.region, isNull);
        expect(data.phone, isNull);
        expect(data.horseName, isNull);
        expect(data.horseEntrySkipped, isFalse);
        expect(data.notificationsEnabled, isFalse);
        expect(data.pendingSync, isFalse);
      });

      test('backward compat: v1 data without new fields', () {
        final map = {
          'isCompleted': true,
          'userRole': 'breeder',
          'displayName': 'Тэмүүлэн',
          'horseEntrySkipped': false,
          'pendingSync': false,
        };
        final data = OnboardingData.fromMap(map);
        expect(data.isCompleted, isTrue);
        expect(data.onboardingVersion, 1);
        expect(data.userRole, 'breeder');
        expect(data.firstGoal, isNull);
        expect(data.notificationsEnabled, isFalse);
      });
    });

    group('roundtrip serialization', () {
      test('toMap then fromMap preserves all data', () {
        const orig = OnboardingData(
          isCompleted: true,
          onboardingVersion: 3,
          userRole: 'breeder',
          firstGoal: 'manageHerd',
          displayName: 'Тэмүүлэн',
          region: 'Дархан',
          phone: '88112233',
          horseName: 'Хан Хүлэг',
          horseGender: HorseGender.stallion,
          horseCoat: 'хээр',
          horseBirthYear: 2019,
          sireName: 'Алтан',
          damName: 'Наран',
          horseEntrySkipped: false,
          notificationsEnabled: true,
          pendingSync: true,
        );
        final restored = OnboardingData.fromMap(orig.toMap());
        expect(restored.isCompleted, orig.isCompleted);
        expect(restored.onboardingVersion, orig.onboardingVersion);
        expect(restored.userRole, orig.userRole);
        expect(restored.firstGoal, orig.firstGoal);
        expect(restored.displayName, orig.displayName);
        expect(restored.region, orig.region);
        expect(restored.phone, orig.phone);
        expect(restored.horseName, orig.horseName);
        expect(restored.horseGender, orig.horseGender);
        expect(restored.horseCoat, orig.horseCoat);
        expect(restored.horseBirthYear, orig.horseBirthYear);
        expect(restored.sireName, orig.sireName);
        expect(restored.damName, orig.damName);
        expect(restored.horseEntrySkipped, orig.horseEntrySkipped);
        expect(restored.notificationsEnabled, orig.notificationsEnabled);
        expect(restored.pendingSync, orig.pendingSync);
      });
    });
  });
}
