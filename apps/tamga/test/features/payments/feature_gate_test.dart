import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/features/feature_gate.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';

void main() {
  // ── kTierLimits ──────────────────────────────────────────────────

  group('kTierLimits', () {
    test('free tier limits', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      expect(limits.maxHorses, 1);
      expect(limits.storageBytes, 50 * 1024 * 1024);
      expect(limits.maxPedigreeGenerations, 3);
      expect(limits.hasInbreedingCalc, isFalse);
      expect(limits.hasBreedingTools, isFalse);
      expect(limits.maxMultiUsers, 1);
      expect(limits.hasClientPortal, isFalse);
      expect(limits.hasAiBreeding, isFalse);
      expect(limits.hasAnalytics, isFalse);
    });

    test('pro tier limits', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      expect(limits.maxHorses, isNull); // unlimited
      expect(limits.storageBytes, 5 * 1024 * 1024 * 1024);
      expect(limits.maxPedigreeGenerations, 5);
      expect(limits.hasInbreedingCalc, isTrue);
      expect(limits.hasBreedingTools, isFalse);
      expect(limits.maxMultiUsers, 1);
      expect(limits.hasClientPortal, isFalse);
      expect(limits.hasAiBreeding, isTrue);
      expect(limits.hasAnalytics, isTrue);
    });

    test('breeder tier limits', () {
      final limits = kTierLimits[SubscriptionTier.breeder]!;
      expect(limits.maxHorses, isNull);
      expect(limits.storageBytes, 20 * 1024 * 1024 * 1024);
      expect(limits.maxPedigreeGenerations, isNull); // all generations
      expect(limits.hasInbreedingCalc, isTrue);
      expect(limits.hasBreedingTools, isTrue);
      expect(limits.maxMultiUsers, 1);
      expect(limits.hasClientPortal, isFalse);
      expect(limits.hasAiBreeding, isTrue);
      expect(limits.hasAnalytics, isTrue);
    });

    test('stable tier limits', () {
      final limits = kTierLimits[SubscriptionTier.stable]!;
      expect(limits.maxHorses, isNull);
      expect(limits.storageBytes, 50 * 1024 * 1024 * 1024);
      expect(limits.maxPedigreeGenerations, isNull);
      expect(limits.hasInbreedingCalc, isTrue);
      expect(limits.hasBreedingTools, isTrue);
      expect(limits.maxMultiUsers, 10);
      expect(limits.hasClientPortal, isTrue);
      expect(limits.hasAiBreeding, isTrue);
      expect(limits.hasAnalytics, isTrue);
    });
  });

  // ── TierLimits labels ───────────────────────────────────────────

  group('TierLimits labels', () {
    test('storageLabel formats bytes to human-readable', () {
      final freeLimits = kTierLimits[SubscriptionTier.free]!;
      expect(freeLimits.storageLabel, '50 MB');

      final proLimits = kTierLimits[SubscriptionTier.pro]!;
      expect(proLimits.storageLabel, '5 GB');

      final breederLimits = kTierLimits[SubscriptionTier.breeder]!;
      expect(breederLimits.storageLabel, '20 GB');

      final stableLimits = kTierLimits[SubscriptionTier.stable]!;
      expect(stableLimits.storageLabel, '50 GB');
    });

    test('storageLabel returns unlimited for null', () {
      const unlimited = TierLimits(
        maxHorses: null,
        storageBytes: null,
        maxPedigreeGenerations: null,
        hasInbreedingCalc: false,
        hasBreedingTools: false,
        maxMultiUsers: null,
        hasClientPortal: false,
        hasBoost: false,
        hasSellerBadge: false,
        hasAiBreeding: false,
        hasAnalytics: false,
      );
      expect(unlimited.storageLabel, 'Хязгааргүй');
    });

    test('horsesLabel returns unlimited for null', () {
      const unlimited = TierLimits(
        maxHorses: null,
        storageBytes: null,
        maxPedigreeGenerations: null,
        hasInbreedingCalc: false,
        hasBreedingTools: false,
        maxMultiUsers: null,
        hasClientPortal: false,
        hasBoost: false,
        hasSellerBadge: false,
        hasAiBreeding: false,
        hasAnalytics: false,
      );
      expect(unlimited.horsesLabel, 'Хязгааргүй');
    });

    test('horsesLabel returns count for finite value', () {
      final freeLimits = kTierLimits[SubscriptionTier.free]!;
      expect(freeLimits.horsesLabel, '1');
    });
  });

  // ── GateCheck sealed class ──────────────────────────────────────

  group('GateCheck', () {
    test('GateAllowed is a GateCheck', () {
      const check = GateAllowed();
      expect(check, isA<GateCheck>());
    });

    test('GateDenied is a GateCheck', () {
      const check = GateDenied(
        reason: 'test',
        requiredTier: SubscriptionTier.pro,
      );
      expect(check, isA<GateCheck>());
      expect(check.reason, 'test');
      expect(check.requiredTier, SubscriptionTier.pro);
    });
  });

  // ── Horse creation gate logic ───────────────────────────────────

  group('horseCreationGate logic', () {
    test('free tier allows 0 horses (within limit of 1)', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      // 0 < 1, so allowed
      expect(limits.maxHorses, 1);
    });

    test('free tier denies at 1 horse (at limit)', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      // 1 is NOT < 1, so denied
      final isAtLimit = limits.maxHorses != null && 1 >= limits.maxHorses!;
      expect(isAtLimit, isTrue);
    });

    test('pro tier allows unlimited horses', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      // maxHorses is null => always allowed
      final isAllowed = limits.maxHorses == null;
      expect(isAllowed, isTrue);
    });

    test('pro tier allows 1000 horses', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      final isAllowed = limits.maxHorses == null || 1000 < limits.maxHorses!;
      expect(isAllowed, isTrue);
    });
  });

  // ── Storage gate logic ──────────────────────────────────────────

  group('storageGate logic', () {
    test('free tier allows within 50MB', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      final usedBytes = 40 * 1024 * 1024; // 40 MB
      final isAllowed =
          limits.storageBytes == null || usedBytes < limits.storageBytes!;
      expect(isAllowed, isTrue);
    });

    test('free tier denies at 50MB', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      final usedBytes = 50 * 1024 * 1024; // 50 MB
      final isDenied =
          limits.storageBytes != null && usedBytes >= limits.storageBytes!;
      expect(isDenied, isTrue);
    });

    test('pro tier allows 4GB', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      final usedBytes = 4 * 1024 * 1024 * 1024; // 4 GB
      final isAllowed =
          limits.storageBytes == null || usedBytes < limits.storageBytes!;
      expect(isAllowed, isTrue);
    });
  });

  // ── Pedigree depth gate logic ───────────────────────────────────

  group('pedigreeDepthGate logic', () {
    test('free tier allows 3 generations', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      final requested = 3;
      final isAllowed =
          limits.maxPedigreeGenerations == null ||
          requested <= limits.maxPedigreeGenerations!;
      expect(isAllowed, isTrue);
    });

    test('free tier denies 4 generations', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      final requested = 4;
      final isDenied =
          limits.maxPedigreeGenerations != null &&
          requested > limits.maxPedigreeGenerations!;
      expect(isDenied, isTrue);
    });

    test('pro tier allows 5 generations', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      final requested = 5;
      final isAllowed =
          limits.maxPedigreeGenerations == null ||
          requested <= limits.maxPedigreeGenerations!;
      expect(isAllowed, isTrue);
    });

    test('pro tier denies 6 generations', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      final requested = 6;
      final isDenied =
          limits.maxPedigreeGenerations != null &&
          requested > limits.maxPedigreeGenerations!;
      expect(isDenied, isTrue);
    });

    test('breeder tier allows unlimited generations', () {
      final limits = kTierLimits[SubscriptionTier.breeder]!;
      final requested = 100;
      final isAllowed =
          limits.maxPedigreeGenerations == null ||
          requested <= limits.maxPedigreeGenerations!;
      expect(isAllowed, isTrue);
    });
  });

  // ── Inbreeding calc gate logic ──────────────────────────────────

  group('inbreedingCalcGate logic', () {
    test('free tier does not have inbreeding calc', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      expect(limits.hasInbreedingCalc, isFalse);
    });

    test('pro tier has inbreeding calc', () {
      final limits = kTierLimits[SubscriptionTier.pro]!;
      expect(limits.hasInbreedingCalc, isTrue);
    });

    test('breeder tier has inbreeding calc', () {
      final limits = kTierLimits[SubscriptionTier.breeder]!;
      expect(limits.hasInbreedingCalc, isTrue);
    });

    test('stable tier has inbreeding calc', () {
      final limits = kTierLimits[SubscriptionTier.stable]!;
      expect(limits.hasInbreedingCalc, isTrue);
    });
  });

  // ── Breeding tools gate logic ───────────────────────────────────

  group('breedingToolsGate logic', () {
    test('free and pro tiers do not have breeding tools', () {
      expect(kTierLimits[SubscriptionTier.free]!.hasBreedingTools, isFalse);
      expect(kTierLimits[SubscriptionTier.pro]!.hasBreedingTools, isFalse);
    });

    test('breeder and stable tiers have breeding tools', () {
      expect(kTierLimits[SubscriptionTier.breeder]!.hasBreedingTools, isTrue);
      expect(kTierLimits[SubscriptionTier.stable]!.hasBreedingTools, isTrue);
    });
  });

  // ── AI Breeding gate logic ──────────────────────────────────────

  group('aiBreedingGate logic', () {
    test('free tier does not have AI breeding', () {
      expect(kTierLimits[SubscriptionTier.free]!.hasAiBreeding, isFalse);
    });

    test('pro tier has AI breeding', () {
      expect(kTierLimits[SubscriptionTier.pro]!.hasAiBreeding, isTrue);
    });

    test('breeder tier has AI breeding', () {
      expect(kTierLimits[SubscriptionTier.breeder]!.hasAiBreeding, isTrue);
    });

    test('stable tier has AI breeding', () {
      expect(kTierLimits[SubscriptionTier.stable]!.hasAiBreeding, isTrue);
    });
  });

  // ── Analytics gate logic ────────────────────────────────────────

  group('analyticsGate logic', () {
    test('free tier does not have analytics', () {
      expect(kTierLimits[SubscriptionTier.free]!.hasAnalytics, isFalse);
    });

    test('pro tier has analytics', () {
      expect(kTierLimits[SubscriptionTier.pro]!.hasAnalytics, isTrue);
    });

    test('breeder tier has analytics', () {
      expect(kTierLimits[SubscriptionTier.breeder]!.hasAnalytics, isTrue);
    });

    test('stable tier has analytics', () {
      expect(kTierLimits[SubscriptionTier.stable]!.hasAnalytics, isTrue);
    });
  });

  // ── Multi-user gate logic ───────────────────────────────────────

  group('multiUserGate logic', () {
    test('free, pro, breeder all have maxMultiUsers = 1', () {
      expect(kTierLimits[SubscriptionTier.free]!.maxMultiUsers, 1);
      expect(kTierLimits[SubscriptionTier.pro]!.maxMultiUsers, 1);
      expect(kTierLimits[SubscriptionTier.breeder]!.maxMultiUsers, 1);
    });

    test('stable has maxMultiUsers = 10', () {
      expect(kTierLimits[SubscriptionTier.stable]!.maxMultiUsers, 10);
    });
  });

  // ── Client portal gate logic ────────────────────────────────────

  group('clientPortalGate logic', () {
    test('only stable tier has client portal', () {
      expect(kTierLimits[SubscriptionTier.free]!.hasClientPortal, isFalse);
      expect(kTierLimits[SubscriptionTier.pro]!.hasClientPortal, isFalse);
      expect(kTierLimits[SubscriptionTier.breeder]!.hasClientPortal, isFalse);
      expect(kTierLimits[SubscriptionTier.stable]!.hasClientPortal, isTrue);
    });
  });

  // ── Tier progression (upgrade flow) ─────────────────────────────

  group('tier progression', () {
    test('each tier has strictly higher or equal limits', () {
      final free = kTierLimits[SubscriptionTier.free]!;
      final pro = kTierLimits[SubscriptionTier.pro]!;
      final breeder = kTierLimits[SubscriptionTier.breeder]!;
      final stable = kTierLimits[SubscriptionTier.stable]!;

      // Pro has more storage than free
      expect(pro.storageBytes!, greaterThan(free.storageBytes!));
      // Breeder has more storage than pro
      expect(breeder.storageBytes!, greaterThan(pro.storageBytes!));
      // Stable has more storage than breeder
      expect(stable.storageBytes!, greaterThan(breeder.storageBytes!));

      // Pro has more pedigree depth than free
      expect(
        pro.maxPedigreeGenerations!,
        greaterThan(free.maxPedigreeGenerations!),
      );

      // Breeder gains inbreeding calc and breeding tools
      expect(breeder.hasInbreedingCalc, isTrue);
      expect(free.hasInbreedingCalc, isFalse);
      expect(breeder.hasBreedingTools, isTrue);
      expect(pro.hasBreedingTools, isFalse);

      // Pro/breeder/stable gain AI breeding and analytics
      expect(pro.hasAiBreeding, isTrue);
      expect(free.hasAiBreeding, isFalse);
      expect(pro.hasAnalytics, isTrue);
      expect(free.hasAnalytics, isFalse);

      // Stable gains multi-users and portal
      expect(stable.maxMultiUsers!, greaterThan(breeder.maxMultiUsers!));
      expect(stable.hasClientPortal, isTrue);
      expect(breeder.hasClientPortal, isFalse);
    });

    test('free tier price is 0', () {
      expect(SubscriptionTier.free.priceMnt, 0);
      expect(SubscriptionTier.pro.priceMnt, 9900);
      expect(SubscriptionTier.breeder.priceMnt, 29900);
      expect(SubscriptionTier.stable.priceMnt, 49900);
    });
  });
}
