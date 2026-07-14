import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/certificates/domain/ownership_certificate.dart';

void main() {
  group('CertificateStatus', () {
    test('fromString returns active for unknown values', () {
      expect(CertificateStatus.fromString('active'), CertificateStatus.active);
      expect(CertificateStatus.fromString('foo'), CertificateStatus.active);
      expect(CertificateStatus.fromString(''), CertificateStatus.active);
    });

    test('fromString returns transferred', () {
      expect(
        CertificateStatus.fromString('transferred'),
        CertificateStatus.transferred,
      );
    });

    test('fromString returns revoked', () {
      expect(
        CertificateStatus.fromString('revoked'),
        CertificateStatus.revoked,
      );
    });

    test('fromString is case-insensitive', () {
      expect(
        CertificateStatus.fromString('TRANSFERRED'),
        CertificateStatus.transferred,
      );
      expect(
        CertificateStatus.fromString('Revoked'),
        CertificateStatus.revoked,
      );
    });

    test('displayName returns correct Mongolian label', () {
      expect(CertificateStatus.active.displayName, 'Идэвхтэй');
      expect(CertificateStatus.transferred.displayName, 'Шилжүүлсэн');
      expect(CertificateStatus.revoked.displayName, 'Цуцалсан');
    });
  });

  group('OwnershipCertificate', () {
    OwnershipCertificate createCertificate({
      String id = 'cert-1',
      String horseId = 'horse-1',
      String ownerId = 'owner-1',
      String ownerName = 'Тэмүүлэн',
      DateTime? issueDate,
      DateTime? expiryDate,
      CertificateStatus status = CertificateStatus.active,
      String qrCode = 'QR-CODE-123',
      String? horseName = 'Хан Хүлэг',
      String? previousOwnerId,
    }) {
      return OwnershipCertificate(
        id: id,
        horseId: horseId,
        ownerId: ownerId,
        ownerName: ownerName,
        issueDate: issueDate ?? DateTime(2026, 1, 1),
        expiryDate: expiryDate,
        status: status,
        qrCode: qrCode,
        horseName: horseName,
        previousOwnerId: previousOwnerId,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
    }

    // ── Construction ─────────────────────────────────────────

    group('construction', () {
      test('creates with all required fields', () {
        final cert = createCertificate();
        expect(cert.id, 'cert-1');
        expect(cert.horseId, 'horse-1');
        expect(cert.ownerId, 'owner-1');
        expect(cert.ownerName, 'Тэмүүлэн');
        expect(cert.status, CertificateStatus.active);
        expect(cert.qrCode, 'QR-CODE-123');
        expect(cert.horseName, 'Хан Хүлэг');
        expect(cert.previousOwnerId, isNull);
      });

      test('creates with optional fields', () {
        final cert = createCertificate(
          previousOwnerId: 'prev-owner-1',
          expiryDate: DateTime(2027, 1, 1),
        );
        expect(cert.previousOwnerId, 'prev-owner-1');
        expect(cert.expiryDate, DateTime(2027, 1, 1));
      });
    });

    // ── Computed properties ──────────────────────────────────

    group('isExpired', () {
      test('returns false when expiryDate is null', () {
        final cert = createCertificate(expiryDate: null);
        expect(cert.isExpired, isFalse);
      });

      test('returns false when expiryDate is in the future', () {
        final cert = createCertificate(
          expiryDate: DateTime.now().add(const Duration(days: 365)),
        );
        expect(cert.isExpired, isFalse);
      });

      test('returns true when expiryDate is in the past', () {
        final cert = createCertificate(
          expiryDate: DateTime.now().subtract(const Duration(days: 1)),
        );
        expect(cert.isExpired, isTrue);
      });
    });

    group('isActive', () {
      test('returns true when status is active and not expired', () {
        final cert = createCertificate(
          status: CertificateStatus.active,
          expiryDate: DateTime.now().add(const Duration(days: 365)),
        );
        expect(cert.isActive, isTrue);
      });

      test('returns false when status is active but expired', () {
        final cert = createCertificate(
          status: CertificateStatus.active,
          expiryDate: DateTime.now().subtract(const Duration(days: 1)),
        );
        expect(cert.isActive, isFalse);
      });

      test('returns false when status is not active even if not expired', () {
        final cert = createCertificate(
          status: CertificateStatus.transferred,
          expiryDate: DateTime.now().add(const Duration(days: 365)),
        );
        expect(cert.isActive, isFalse);
      });

      test('returns true when status is active and no expiry date', () {
        final cert = createCertificate(
          status: CertificateStatus.active,
          expiryDate: null,
        );
        expect(cert.isActive, isTrue);
      });
    });

    // ── Status transitions ───────────────────────────────────

    group('status transitions', () {
      test('copyWith can transition active to transferred', () {
        final cert = createCertificate(status: CertificateStatus.active);
        final transferred = cert.copyWith(
          status: CertificateStatus.transferred,
          previousOwnerId: 'owner-1',
        );
        expect(transferred.status, CertificateStatus.transferred);
        expect(transferred.previousOwnerId, 'owner-1');
        expect(transferred.isActive, isFalse);
      });

      test('copyWith can transition active to revoked', () {
        final cert = createCertificate(status: CertificateStatus.active);
        final revoked = cert.copyWith(status: CertificateStatus.revoked);
        expect(revoked.status, CertificateStatus.revoked);
        expect(revoked.isActive, isFalse);
      });

      test('copyWith preserves other fields during status change', () {
        final cert = createCertificate(status: CertificateStatus.active);
        final revoked = cert.copyWith(status: CertificateStatus.revoked);
        expect(revoked.id, cert.id);
        expect(revoked.horseId, cert.horseId);
        expect(revoked.ownerId, cert.ownerId);
        expect(revoked.qrCode, cert.qrCode);
      });
    });

    // ── Serialization (Supabase snake_case) ──────────────────

    group('serialization', () {
      test('fromSupabaseJson produces correct certificate', () {
        final json = {
          'id': 'cert-1',
          'horse_id': 'horse-1',
          'owner_id': 'owner-1',
          'owner_name': 'Тэмүүлэн',
          'issue_date': '2026-01-01T00:00:00.000',
          'expiry_date': '2027-01-01T00:00:00.000',
          'status': 'active',
          'qr_code': 'QR-123',
          'horse_name': 'Хан Хүлэг',
          'previous_owner_id': null,
        };
        final cert = OwnershipCertificate.fromSupabaseJson(json);

        expect(cert.id, 'cert-1');
        expect(cert.horseId, 'horse-1');
        expect(cert.ownerId, 'owner-1');
        expect(cert.ownerName, 'Тэмүүлэн');
        expect(cert.issueDate, DateTime(2026, 1, 1));
        expect(cert.expiryDate, DateTime(2027, 1, 1));
        expect(cert.status, CertificateStatus.active);
        expect(cert.qrCode, 'QR-123');
        expect(cert.horseName, 'Хан Хүлэг');
        expect(cert.previousOwnerId, isNull);
      });

      test('fromSupabaseJson handles null optional fields', () {
        final json = {
          'id': 'cert-2',
          'horse_id': 'horse-2',
          'owner_id': 'owner-2',
          'owner_name': 'Бат',
          'issue_date': '2026-06-01T00:00:00.000',
          'expiry_date': null,
          'status': 'transferred',
          'qr_code': 'QR-456',
          'horse_name': null,
          'previous_owner_id': 'owner-1',
        };
        final cert = OwnershipCertificate.fromSupabaseJson(json);

        expect(cert.expiryDate, isNull);
        expect(cert.horseName, isNull);
        expect(cert.previousOwnerId, 'owner-1');
        expect(cert.status, CertificateStatus.transferred);
      });

      test('toSupabaseJson produces correct map', () {
        final cert = createCertificate(
          expiryDate: DateTime(2027, 1, 1),
          previousOwnerId: 'prev-owner',
        );
        final json = cert.toSupabaseJson(userId: 'owner-1');

        expect(json['horse_id'], 'horse-1');
        expect(json['owner_id'], 'owner-1');
        expect(json['owner_name'], 'Тэмүүлэн');
        expect(json['issue_date'], DateTime(2026, 1, 1).toIso8601String());
        expect(json['expiry_date'], DateTime(2027, 1, 1).toIso8601String());
        expect(json['status'], 'active');
        expect(json['qr_code'], 'QR-CODE-123');
        expect(json['previous_owner_id'], 'prev-owner');
      });

      test('toSupabaseJson handles null expiryDate', () {
        final cert = createCertificate(expiryDate: null);
        final json = cert.toSupabaseJson(userId: 'owner-1');
        expect(json['expiry_date'], isNull);
      });

      test('round-trip through Supabase JSON preserves data', () {
        final original = createCertificate(
          expiryDate: DateTime(2027, 6, 15),
          status: CertificateStatus.active,
          horseName: 'Алтан',
          previousOwnerId: null,
        );
        final json = original.toSupabaseJson(userId: 'owner-1');
        // Add back id which toSupabaseJson omits
        json['id'] = original.id;
        final restored = OwnershipCertificate.fromSupabaseJson(json);

        expect(restored.id, original.id);
        expect(restored.horseId, original.horseId);
        expect(restored.ownerId, original.ownerId);
        expect(restored.ownerName, original.ownerName);
        expect(restored.issueDate, original.issueDate);
        expect(restored.expiryDate, original.expiryDate);
        expect(restored.status, original.status);
        expect(restored.qrCode, original.qrCode);
      });
    });

    // ── copyWith ─────────────────────────────────────────────

    group('copyWith', () {
      test('copies with overridden fields', () {
        final cert = createCertificate(ownerName: 'Old Name');
        final copied = cert.copyWith(ownerName: 'New Name');
        expect(copied.ownerName, 'New Name');
        expect(copied.id, cert.id);
      });

      test('clearExpiryDate sets expiryDate to null', () {
        final cert = createCertificate(expiryDate: DateTime(2027, 1, 1));
        final cleared = cert.copyWith(clearExpiryDate: true);
        expect(cleared.expiryDate, isNull);
      });

      test('clearHorseName sets horseName to null', () {
        final cert = createCertificate(horseName: 'Horse');
        final cleared = cert.copyWith(clearHorseName: true);
        expect(cleared.horseName, isNull);
      });

      test('clearPreviousOwnerId sets previousOwnerId to null', () {
        final cert = createCertificate(previousOwnerId: 'prev');
        final cleared = cert.copyWith(clearPreviousOwnerId: true);
        expect(cleared.previousOwnerId, isNull);
      });
    });

    // ── Equality ─────────────────────────────────────────────

    group('equality', () {
      test(
        'two certificates with same id/horseId/ownerId/status are equal',
        () {
          final a = createCertificate();
          final b = createCertificate();
          expect(a, b);
        },
      );

      test('certificates with different ids are not equal', () {
        final a = createCertificate(id: 'cert-1');
        final b = createCertificate(id: 'cert-2');
        expect(a == b, isFalse);
      });

      test('certificates with different statuses are not equal', () {
        final a = createCertificate(status: CertificateStatus.active);
        final b = createCertificate(status: CertificateStatus.revoked);
        expect(a == b, isFalse);
      });
    });

    // ── toString ─────────────────────────────────────────────

    group('toString', () {
      test('includes key fields', () {
        final cert = createCertificate();
        final str = cert.toString();
        expect(str, contains('cert-1'));
        expect(str, contains('horse-1'));
        expect(str, contains('active'));
      });
    });
  });

  group('CertificateVerification', () {
    test('stores isValid, certificate, and message', () {
      final cert = OwnershipCertificate(
        id: 'cert-1',
        horseId: 'horse-1',
        ownerId: 'owner-1',
        ownerName: 'Test',
        issueDate: DateTime(2026, 1, 1),
        status: CertificateStatus.active,
        qrCode: 'QR',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final verification = CertificateVerification(
        isValid: true,
        certificate: cert,
        message: 'Valid certificate',
      );

      expect(verification.isValid, isTrue);
      expect(verification.certificate, cert);
      expect(verification.message, 'Valid certificate');
    });
  });
}
