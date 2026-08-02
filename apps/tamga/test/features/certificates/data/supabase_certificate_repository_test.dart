import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/certificates/data/certificate_repository.dart';
import 'package:tamga/src/features/certificates/data/supabase_certificate_repository.dart';
import 'package:tamga/src/features/certificates/domain/ownership_certificate.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// PostgrestFilterBuilder / SupabaseQueryBuilder implement Future<T>, so
// mocktail's thenReturn cannot be used on the terminal link of a chain.
// These fakes model the chain with real method bodies; the terminal await
// resolves to the configured rows via an explicit `then` override.

class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({this.rows = const [], this.singleRow})
    : capture = _FakeQueryCapture();

  /// Rows yielded when a chain built from this builder is awaited directly.
  final List<Map<String, dynamic>> rows;

  /// Row yielded by the `maybeSingle`/`single` terminal of a chain.
  final Map<String, dynamic>? singleRow;

  final _FakeQueryCapture capture;

  _FakeFilter _newFilter() {
    final filter = _FakeFilter(rows: rows, singleRow: singleRow);
    capture.lastFilter = filter;
    return filter;
  }

  @override
  _FakeFilter select([String columns = '*']) => _newFilter();

  @override
  _FakeFilter insert(Object values, {bool defaultToNull = true}) {
    capture.lastInsert = values;
    return _newFilter();
  }

  @override
  _FakeFilter upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) {
    capture.lastUpsert = values;
    return _newFilter();
  }

  @override
  _FakeFilter update(Map values) {
    capture.lastUpdate = values;
    return _newFilter();
  }

  @override
  _FakeFilter delete() {
    capture.lastDelete = true;
    return _newFilter();
  }

  Object? get lastInsert => capture.lastInsert;
  Object? get lastUpsert => capture.lastUpsert;
  Map<dynamic, dynamic>? get lastUpdate => capture.lastUpdate;
  bool get lastDelete => capture.lastDelete;
  _FakeFilter? get lastFilter => capture.lastFilter;
}

class _FakeQueryCapture {
  Object? lastInsert;
  Object? lastUpsert;
  Map<dynamic, dynamic>? lastUpdate;
  bool lastDelete = false;
  _FakeFilter? lastFilter;
}

class _FakeFilter extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  _FakeFilter({required this.rows, this.singleRow});

  final List<Map<String, dynamic>> rows;
  final Map<String, dynamic>? singleRow;

  final List<(String, Object)> eqCalls = [];

  @override
  _FakeFilter eq(String column, Object value) {
    eqCalls.add((column, value));
    return this;
  }

  @override
  _FakeFilter or(String filters, {String? referencedTable}) => this;

  @override
  _FakeFilter order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  _FakeFilter limit(int count, {String? referencedTable}) => this;

  @override
  _FakeFilter select([String columns = '*']) => this;

  @override
  _FakeMaybeSingle maybeSingle() => _FakeMaybeSingle(singleRow);

  @override
  _FakeSingle single() => _FakeSingle(singleRow ?? const <String, dynamic>{});

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) => Future<PostgrestList>.value(rows).then(onValue, onError: onError);
}

class _FakeMaybeSingle extends Fake
    implements PostgrestTransformBuilder<PostgrestMap?> {
  _FakeMaybeSingle(this.row);

  final Map<String, dynamic>? row;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestMap?) onValue, {
    Function? onError,
  }) => Future<PostgrestMap?>.value(row).then(onValue, onError: onError);
}

class _FakeSingle extends Fake
    implements PostgrestTransformBuilder<PostgrestMap> {
  _FakeSingle(this.row);

  final Map<String, dynamic> row;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestMap) onValue, {
    Function? onError,
  }) => Future<PostgrestMap>.value(row).then(onValue, onError: onError);
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> certificateRow({
  String id = 'cert-1',
  String horseId = 'horse-1234',
  String ownerId = 'owner-1',
  String ownerName = 'Овог Эзэмшигч',
  String issueDate = '2026-01-01T00:00:00.000',
  String? expiryDate = '2099-12-31T00:00:00.000',
  String status = 'active',
  String qrCode = 'TAMGA-CERT1',
  String? horseName = 'Тест Морь',
  String? previousOwnerId,
  String createdAt = '2026-01-01T00:00:00.000',
  String updatedAt = '2026-01-01T00:00:00.000',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'owner_id': ownerId,
    'owner_name': ownerName,
    'issue_date': issueDate,
    'expiry_date': expiryDate,
    'status': status,
    'qr_code': qrCode,
    'horse_name': horseName,
    'previous_owner_id': previousOwnerId,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseCertificateRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseCertificateRepository(client: mockClient);
  });

  group('SupabaseCertificateRepository implements CertificateRepository', () {
    test('class exists and implements CertificateRepository', () {
      expect(repository, isA<CertificateRepository>());
    });
  });

  group('createCertificate', () {
    test('creates a certificate when no active one exists', () async {
      // from() is called twice: existing-check select, then insert.
      var fromCalls = 0;
      final qbExisting = _FakeQueryBuilder(singleRow: null);
      final qbInsert = _FakeQueryBuilder(
        singleRow: certificateRow(
          id: 'cert-new',
          ownerId: 'owner-9',
          ownerName: 'Шинэ Эзэмшигч',
        ),
      );
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) {
        fromCalls++;
        return fromCalls == 1 ? qbExisting : qbInsert;
      });

      final result = await repository.createCertificate(
        horseId: 'horse-1234',
        ownerId: 'owner-9',
        ownerName: 'Шинэ Эзэмшигч',
        horseName: 'Тест Морь',
      );

      expect(result.isSuccess, isTrue);
      final cert = result.value;
      expect(cert.id, 'cert-new');
      expect(cert.horseId, 'horse-1234');
      expect(cert.ownerId, 'owner-9');
      expect(cert.ownerName, 'Шинэ Эзэмшигч');
      expect(cert.horseName, 'Тест Морь');
      expect(cert.status, CertificateStatus.active);
      expect(cert.qrCode, 'TAMGA-CERT1');

      final data = qbInsert.lastInsert as Map<String, dynamic>;
      expect(data['horse_id'], 'horse-1234');
      expect(data['owner_id'], 'owner-9');
      expect(data['owner_name'], 'Шинэ Эзэмшигч');
      expect(data['horse_name'], 'Тест Морь');
      expect(data['status'], 'active');
      expect(data['qr_code'], startsWith('TAMGA-HORSE-12-'));
      expect(data['issue_date'], isA<String>());
      expect(data['expiry_date'], isA<String>());
      // No active certificate existed → no revocation update was issued.
      expect(qbExisting.lastUpdate, isNull);
    });

    test(
      'revokes the existing certificate before creating a new one',
      () async {
        var fromCalls = 0;
        final qbExisting = _FakeQueryBuilder(
          singleRow: certificateRow(id: 'cert-old', status: 'active'),
        );
        final qbUpdate = _FakeQueryBuilder(rows: const []);
        final qbInsert = _FakeQueryBuilder(
          singleRow: certificateRow(id: 'cert-new', ownerName: 'Шинэ Эзэмшигч'),
        );
        when(() => mockClient.from('digital_certificates')).thenAnswer((_) {
          fromCalls++;
          if (fromCalls == 1) return qbExisting;
          if (fromCalls == 2) return qbUpdate;
          return qbInsert;
        });

        final result = await repository.createCertificate(
          horseId: 'horse-1234',
          ownerId: 'owner-9',
          ownerName: 'Шинэ Эзэмшигч',
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'cert-new');

        expect(qbUpdate.lastUpdate, {'status': 'revoked'});
        expect(qbUpdate.lastFilter!.eqCalls, contains(('id', 'cert-old')));
      },
    );

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('digital_certificates'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.createCertificate(
        horseId: 'horse-1234',
        ownerId: 'owner-1',
        ownerName: 'Эзэмшигч',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });

    test('maps PostgrestException to its Supabase error code', () async {
      when(() => mockClient.from('digital_certificates')).thenThrow(
        const PostgrestException(
          message: 'relation "digital_certificates" does not exist',
          code: '42P01',
        ),
      );

      final result = await repository.createCertificate(
        horseId: 'horse-1234',
        ownerId: 'owner-1',
        ownerName: 'Эзэмшигч',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, '42P01');
      expect(
        result.error.message,
        'relation "digital_certificates" does not exist',
      );
    });
  });

  group('verifyCertificate', () {
    test('returns a valid verification for an active certificate', () async {
      final qb = _FakeQueryBuilder(singleRow: certificateRow());
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.verifyCertificate('cert-1');

      expect(result.isSuccess, isTrue);
      final verification = result.value;
      expect(verification.isValid, isTrue);
      expect(verification.certificate.id, 'cert-1');
      expect(verification.certificate.ownerName, 'Овог Эзэмшигч');
      expect(verification.message, contains('Овог Эзэмшигч'));
    });

    test('returns CERTIFICATE_NOT_FOUND when no row matches', () async {
      final qb = _FakeQueryBuilder(singleRow: null);
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.verifyCertificate('cert-missing');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'CERTIFICATE_NOT_FOUND');
    });

    test('marks an expired certificate as invalid', () async {
      final qb = _FakeQueryBuilder(
        singleRow: certificateRow(expiryDate: '2020-01-01T00:00:00.000'),
      );
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.verifyCertificate('cert-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.isValid, isFalse);
      expect(result.value.message, 'Гэрчилгээний хугацаа дууссан');
    });

    test('marks a revoked certificate as invalid', () async {
      final qb = _FakeQueryBuilder(
        singleRow: certificateRow(status: 'revoked'),
      );
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.verifyCertificate('cert-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.isValid, isFalse);
      expect(result.value.message, 'Гэрчилгээ цуцалсан');
    });

    test('marks a transferred certificate as invalid with guidance', () async {
      final qb = _FakeQueryBuilder(
        singleRow: certificateRow(status: 'transferred'),
      );
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.verifyCertificate('cert-1');

      expect(result.isSuccess, isTrue);
      expect(result.value.isValid, isFalse);
      expect(result.value.message, contains('шилжүүлсэн'));
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('digital_certificates'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.verifyCertificate('cert-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });

  group('transferCertificate', () {
    test(
      'returns ACTIVE_CERTIFICATE_NOT_FOUND when no active certificate exists',
      () async {
        final qb = _FakeQueryBuilder(singleRow: null);
        when(
          () => mockClient.from('digital_certificates'),
        ).thenAnswer((_) => qb);

        final result = await repository.transferCertificate(
          certificateId: 'cert-1',
          newOwnerId: 'owner-2',
          newOwnerName: 'Шинэ Эзэмшигч',
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'ACTIVE_CERTIFICATE_NOT_FOUND');
      },
    );

    test('transfers an active certificate to the new owner', () async {
      var fromCalls = 0;
      final qbCurrent = _FakeQueryBuilder(
        singleRow: certificateRow(
          id: 'cert-1',
          horseId: 'horse-1234',
          ownerId: 'owner-1',
          ownerName: 'Овог Эзэмшигч',
          horseName: 'Тест Морь',
        ),
      );
      final qbUpdate = _FakeQueryBuilder(rows: const []);
      final qbInsert = _FakeQueryBuilder(
        singleRow: certificateRow(
          id: 'cert-2',
          ownerId: 'owner-2',
          ownerName: 'Шинэ Эзэмшигч',
          previousOwnerId: 'owner-1',
        ),
      );
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) {
        fromCalls++;
        if (fromCalls == 1) return qbCurrent;
        if (fromCalls == 2) return qbUpdate;
        return qbInsert;
      });

      final result = await repository.transferCertificate(
        certificateId: 'cert-1',
        newOwnerId: 'owner-2',
        newOwnerName: 'Шинэ Эзэмшигч',
      );

      expect(result.isSuccess, isTrue);
      final cert = result.value;
      expect(cert.id, 'cert-2');
      expect(cert.horseId, 'horse-1234');
      expect(cert.ownerId, 'owner-2');
      expect(cert.ownerName, 'Шинэ Эзэмшигч');
      expect(cert.horseName, 'Тест Морь');
      expect(cert.status, CertificateStatus.active);

      expect(qbUpdate.lastUpdate, {'status': 'transferred'});
      expect(qbUpdate.lastFilter!.eqCalls, contains(('id', 'cert-1')));

      final data = qbInsert.lastInsert as Map<String, dynamic>;
      expect(data['horse_id'], 'horse-1234');
      expect(data['owner_id'], 'owner-2');
      expect(data['owner_name'], 'Шинэ Эзэмшигч');
      expect(data['horse_name'], 'Тест Морь');
      expect(data['status'], 'active');
      expect(data['previous_owner_id'], 'owner-1');
      expect(data['qr_code'], startsWith('TAMGA-HORSE-12-'));
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('digital_certificates'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.transferCertificate(
        certificateId: 'cert-1',
        newOwnerId: 'owner-2',
        newOwnerName: 'Шинэ Эзэмшигч',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });

  group('getCertificateByHorse', () {
    test('maps the latest active certificate on success', () async {
      final qb = _FakeQueryBuilder(singleRow: certificateRow());
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.getCertificateByHorse('horse-1234');

      expect(result.isSuccess, isTrue);
      final cert = result.value!;
      expect(cert.id, 'cert-1');
      expect(cert.horseId, 'horse-1234');
      expect(cert.ownerId, 'owner-1');
      expect(cert.ownerName, 'Овог Эзэмшигч');
      expect(cert.status, CertificateStatus.active);
      expect(cert.qrCode, 'TAMGA-CERT1');
      expect(cert.horseName, 'Тест Морь');
      expect(cert.issueDate, DateTime(2026, 1, 1));
      expect(cert.expiryDate, DateTime(2099, 12, 31));
      expect(cert.isExpired, isFalse);
      expect(qb.lastFilter!.eqCalls, contains(('horse_id', 'horse-1234')));
      expect(qb.lastFilter!.eqCalls, contains(('status', 'active')));
    });

    test('returns null when the horse has no certificate', () async {
      final qb = _FakeQueryBuilder(singleRow: null);
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.getCertificateByHorse('horse-1234');

      expect(result.isSuccess, isTrue);
      expect(result.value, isNull);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('digital_certificates'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.getCertificateByHorse('horse-1234');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });

  group('getCertificatesByOwner', () {
    test(
      'maps rows to OwnershipCertificate field-by-field on success',
      () async {
        final qb = _FakeQueryBuilder(
          rows: [
            certificateRow(id: 'cert-1'),
            certificateRow(id: 'cert-2', status: 'revoked'),
          ],
        );
        when(
          () => mockClient.from('digital_certificates'),
        ).thenAnswer((_) => qb);

        final result = await repository.getCertificatesByOwner('owner-1');

        expect(result.isSuccess, isTrue);
        final certificates = result.value;
        expect(certificates, hasLength(2));
        expect(certificates[0].id, 'cert-1');
        expect(certificates[0].status, CertificateStatus.active);
        expect(certificates[1].id, 'cert-2');
        expect(certificates[1].status, CertificateStatus.revoked);
        expect(qb.lastFilter!.eqCalls, contains(('owner_id', 'owner-1')));
      },
    );

    test('returns empty list for empty rows', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('digital_certificates')).thenAnswer((_) => qb);

      final result = await repository.getCertificatesByOwner('owner-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('digital_certificates'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.getCertificatesByOwner('owner-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });
}
