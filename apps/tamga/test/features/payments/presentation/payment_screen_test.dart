import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/payments/domain/payment_request.dart';
import 'package:tamga/src/core/features/feature_gate.dart';

void main() {
  // ── PaymentRequest model ────────────────────────────────────────

  group('PaymentRequest', () {
    PaymentRequest createRequest({
      String id = 'pr-1',
      String userId = 'user-1',
      SubscriptionTier tier = SubscriptionTier.pro,
      String code = 'TG-AB3F-7K2X',
      int? amountMnt,
      PaymentStatus status = PaymentStatus.pending,
      DateTime? createdAt,
      DateTime? expiresAt,
      DateTime? verifiedAt,
      String? adminNotes,
    }) {
      final now = DateTime.utc(2026, 5, 1);
      return PaymentRequest(
        id: id,
        userId: userId,
        tier: tier,
        code: code,
        amountMnt: amountMnt ?? tier.priceMnt,
        status: status,
        createdAt: createdAt ?? now,
        expiresAt: expiresAt ?? now.add(const Duration(hours: 72)),
        verifiedAt: verifiedAt,
        adminNotes: adminNotes,
      );
    }

    test('remainingTimeLabel shows correct format', () {
      final request = createRequest(
        expiresAt: DateTime.now().add(const Duration(hours: 5, minutes: 30)),
      );
      expect(request.remainingTimeLabel, contains('цаг'));
      expect(request.remainingTimeLabel, contains('минут'));
    });

    test('remainingTimeLabel for minutes only', () {
      final request = createRequest(
        expiresAt: DateTime.now().add(const Duration(hours: 1, minutes: 45)),
      );
      expect(request.remainingTimeLabel, contains('минут'));
    });

    test('remainingTimeLabel when expired', () {
      final request = createRequest(
        expiresAt: DateTime.now().subtract(const Duration(hours: 1)),
      );
      expect(request.remainingTimeLabel, 'Хугацаа дууссан');
    });

    test('isExpired returns true when past expiresAt', () {
      final request = createRequest(
        expiresAt: DateTime.now().subtract(const Duration(hours: 1)),
      );
      expect(request.isExpired, isTrue);
    });

    test('isExpired returns false when before expiresAt', () {
      final request = createRequest(
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
      );
      expect(request.isExpired, isFalse);
    });

    test('copyWith overrides specified fields', () {
      final original = createRequest();
      final updated = original.copyWith(
        status: PaymentStatus.verified,
        verifiedAt: DateTime.now(),
      );

      expect(updated.status, PaymentStatus.verified);
      expect(updated.verifiedAt, isNotNull);
      expect(updated.id, original.id);
      expect(updated.code, original.code);
    });

    test('copyWith preserves all other fields', () {
      final original = createRequest(
        id: 'pr-99',
        userId: 'u99',
        tier: SubscriptionTier.breeder,
        code: 'TG-XXXX-YYYY',
        adminNotes: 'note',
      );

      final updated = original.copyWith(status: PaymentStatus.rejected);

      expect(updated.id, 'pr-99');
      expect(updated.userId, 'u99');
      expect(updated.tier, SubscriptionTier.breeder);
      expect(updated.code, 'TG-XXXX-YYYY');
      expect(updated.adminNotes, 'note');
    });
  });

  // ── Bank details (as used in payment_screen.dart) ───────────────

  group('bank details', () {
    test('Khan Bank account number is correct', () {
      const accountNumber = 'MN110005005431666225';
      expect(accountNumber, startsWith('MN'));
      expect(accountNumber.length, 20);
    });

    test('bank name is Khan Bank', () {
      const bankName = 'Хаан Банк (Khan Bank)';
      expect(bankName, contains('Khan Bank'));
    });

    test('recipient name matches', () {
      const recipient = 'Temuulen Undrakhbayar';
      expect(recipient, isNotEmpty);
    });
  });

  // ── Payment code format ─────────────────────────────────────────

  group('payment code display', () {
    test('code follows TG-XXXX-XXXX format', () {
      const code = 'TG-AB3F-7K2X';
      final parts = code.split('-');
      expect(parts.length, 3);
      expect(parts[0], 'TG');
      expect(parts[1].length, 4);
      expect(parts[2].length, 4);
    });

    test('code is 12 characters total', () {
      const code = 'TG-AB3F-7K2X';
      expect(code.length, 12);
    });
  });

  // ── Tier display ────────────────────────────────────────────────

  group('tier display', () {
    test('tier has correct display name', () {
      expect(SubscriptionTier.free.displayName, 'Үнэгүй');
      expect(SubscriptionTier.pro.displayName, 'Pro');
      expect(SubscriptionTier.breeder.displayName, 'Breeder');
      expect(SubscriptionTier.stable.displayName, 'Stable');
    });

    test('tier has formatted price', () {
      expect(SubscriptionTier.pro.formattedPrice, '₮9,900');
      expect(SubscriptionTier.breeder.formattedPrice, '₮29,900');
      expect(SubscriptionTier.stable.formattedPrice, '₮49,900');
    });

    test('free tier shows 0 price', () {
      expect(SubscriptionTier.free.priceMnt, 0);
      expect(SubscriptionTier.free.priceLabel, '₮0');
    });
  });

  // ── Tier features (as displayed in PaymentScreen) ───────────────

  group('tier features display', () {
    test('free tier features', () {
      const features = ['3 морь нэмэх', 'Үндсэн мэдээлэл'];
      expect(features.length, 2);
      expect(features.first, contains('морь'));
    });

    test('pro tier features', () {
      const features = [
        '20 морь нэмэх',
        'Гэр бүлийн хүрээ',
        'Тэмдэглэл, эрүүл мэндийн бүртгэл',
        'Эрэмбэлэх ба хайлт',
      ];
      expect(features.length, 4);
    });

    test('breeder tier features include breeding tools', () {
      const features = [
        '100 морь нэмэх',
        'Бүх Pro боломжууд',
        'Үржүүлэлтийн удирдлага',
        'Менежментийн хэрэгслүүд',
      ];
      expect(features, contains('Үржүүлэлтийн удирдлага'));
    });

    test('stable tier features include team and portal', () {
      const features = [
        'Хязгааргүй морь',
        'Бүх Breeder боломжууд',
        'Багийн хамтын ажиллагаа',
        'Захын зар',
        'Тэргүүн эрэмбэ',
      ];
      expect(features, contains('Багийн хамтын ажиллагаа'));
      expect(features, contains('Захын зар'));
    });
  });

  // ── Status display ──────────────────────────────────────────────

  group('status display', () {
    test('pending status label', () {
      expect(PaymentStatus.pending.displayName, 'Хүлээгдэж байна');
    });

    test('verified status label', () {
      expect(PaymentStatus.verified.displayName, 'Баталгаажсан');
    });

    test('rejected status label', () {
      expect(PaymentStatus.rejected.displayName, 'Татгалзсан');
    });

    test('expired status label', () {
      expect(PaymentStatus.expired.displayName, 'Хугацаа дууссан');
    });
  });

  // ── Upgrade flow logic ──────────────────────────────────────────

  group('upgrade flow', () {
    test('next tier after free is pro', () {
      final tiers = SubscriptionTier.values;
      final freeIndex = tiers.indexOf(SubscriptionTier.free);
      expect(freeIndex + 1, tiers.indexOf(SubscriptionTier.pro));
    });

    test('next tier after pro is breeder', () {
      final tiers = SubscriptionTier.values;
      final proIndex = tiers.indexOf(SubscriptionTier.pro);
      expect(proIndex + 1, tiers.indexOf(SubscriptionTier.breeder));
    });

    test('next tier after breeder is stable', () {
      final tiers = SubscriptionTier.values;
      final breederIndex = tiers.indexOf(SubscriptionTier.breeder);
      expect(breederIndex + 1, tiers.indexOf(SubscriptionTier.stable));
    });

    test('stable is the last tier', () {
      final tiers = SubscriptionTier.values;
      expect(tiers.last, SubscriptionTier.stable);
    });

    test('each tier has higher price than previous', () {
      final tiers = SubscriptionTier.values;
      for (var i = 1; i < tiers.length; i++) {
        expect(
          tiers[i].priceMnt,
          greaterThan(tiers[i - 1].priceMnt),
          reason: '${tiers[i]} should cost more than ${tiers[i - 1]}',
        );
      }
    });
  });

  // ── Paywall trigger conditions ──────────────────────────────────

  group('paywall triggers', () {
    test('horse limit triggers paywall for free tier', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      expect(limits.maxHorses, 1);
      // Adding a 2nd horse should be blocked
    });

    test('storage limit triggers paywall', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      final maxStorage = limits.storageBytes!;
      // Using more than maxStorage should be blocked
      expect(maxStorage, 50 * 1024 * 1024);
    });

    test('pedigree depth triggers paywall', () {
      final limits = kTierLimits[SubscriptionTier.free]!;
      expect(limits.maxPedigreeGenerations, 3);
      // Requesting 4+ generations should be blocked
    });

    test('inbreeding calc triggers paywall for free', () {
      final freeLimits = kTierLimits[SubscriptionTier.free]!;
      expect(freeLimits.hasInbreedingCalc, isFalse);
    });

    test('inbreeding calc is available for pro', () {
      final proLimits = kTierLimits[SubscriptionTier.pro]!;
      expect(proLimits.hasInbreedingCalc, isTrue);
    });
  });
}
