import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/certificates/application/certificate_providers.dart';
import 'package:tamga/src/features/certificates/data/certificate_repository.dart';
import 'package:tamga/src/features/certificates/data/local_certificate_repository.dart';
import 'package:tamga/src/features/certificates/domain/ownership_certificate.dart';

class MockCertificateRepository extends Mock implements CertificateRepository {}

/// Helper to create a minimal OwnershipCertificate with defaults.
OwnershipCertificate _createCertificate({
  String id = 'cert-1',
  String horseId = 'horse-1',
  String ownerId = 'owner-1',
  String ownerName = 'Тэмүүлэн',
  CertificateStatus status = CertificateStatus.active,
}) {
  final now = DateTime(2026, 6, 1);
  return OwnershipCertificate(
    id: id,
    horseId: horseId,
    ownerId: ownerId,
    ownerName: ownerName,
    issueDate: now,
    expiryDate: now.add(const Duration(days: 365)),
    status: status,
    qrCode: 'TAMGA-QR-$id',
    horseName: 'Хан Хүлэг',
    trustLevel: TrustLevel.tamgaVerified,
    createdAt: now,
    updatedAt: now,
  );
}

void main() {
  late MockCertificateRepository mockRepository;

  setUp(() {
    mockRepository = MockCertificateRepository();
  });

  ProviderContainer containerWith() {
    return ProviderContainer(
      overrides: [
        certificateRepositoryProvider.overrideWithValue(mockRepository),
      ],
    );
  }

  group('certificateRepositoryProvider', () {
    test('provides a LocalCertificateRepository by default', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container.read(certificateRepositoryProvider),
        isA<LocalCertificateRepository>(),
      );
    });

    test('is cached and returns the same repository instance', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final first = container.read(certificateRepositoryProvider);
      final second = container.read(certificateRepositoryProvider);

      expect(identical(first, second), isTrue);
    });
  });

  group('certificateByHorseProvider', () {
    test('returns the certificate for the horse', () async {
      final cert = _createCertificate();
      when(
        () => mockRepository.getCertificateByHorse('horse-1'),
      ).thenAnswer((_) async => Result.ok(cert));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        certificateByHorseProvider('horse-1').future,
      );

      expect(result, isNotNull);
      expect(result!.id, 'cert-1');
    });

    test('returns null when the horse has no certificate', () async {
      when(
        () => mockRepository.getCertificateByHorse('horse-1'),
      ).thenAnswer((_) async => Result.ok(null));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        certificateByHorseProvider('horse-1').future,
      );

      expect(result, isNull);
    });

    test('swallows repository failures and returns null', () async {
      when(() => mockRepository.getCertificateByHorse('horse-1')).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'FETCH_FAILED', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        certificateByHorseProvider('horse-1').future,
      );

      expect(result, isNull);
    });

    test('keeps lookups for different horses isolated', () async {
      when(
        () => mockRepository.getCertificateByHorse('horse-1'),
      ).thenAnswer((_) async => Result.ok(_createCertificate(id: 'cert-1')));
      when(
        () => mockRepository.getCertificateByHorse('horse-2'),
      ).thenAnswer((_) async => Result.ok(_createCertificate(id: 'cert-2')));

      final container = containerWith();
      addTearDown(container.dispose);

      final horse1 = await container.read(
        certificateByHorseProvider('horse-1').future,
      );
      final horse2 = await container.read(
        certificateByHorseProvider('horse-2').future,
      );

      expect(horse1!.id, 'cert-1');
      expect(horse2!.id, 'cert-2');
      verify(() => mockRepository.getCertificateByHorse('horse-1')).called(1);
      verify(() => mockRepository.getCertificateByHorse('horse-2')).called(1);
    });

    test('caches the result across repeated reads', () async {
      var calls = 0;
      when(() => mockRepository.getCertificateByHorse('horse-1')).thenAnswer((
        _,
      ) async {
        calls++;
        return Result.ok(_createCertificate());
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(certificateByHorseProvider('horse-1').future);
      await container.read(certificateByHorseProvider('horse-1').future);

      expect(calls, 1);
    });

    test('re-fetches after invalidation and returns the new value', () async {
      var calls = 0;
      when(() => mockRepository.getCertificateByHorse('horse-1')).thenAnswer((
        _,
      ) async {
        calls++;
        return Result.ok(_createCertificate(id: 'cert-$calls'));
      });

      final container = containerWith();
      addTearDown(container.dispose);

      final first = await container.read(
        certificateByHorseProvider('horse-1').future,
      );
      expect(first!.id, 'cert-1');

      container.invalidate(certificateByHorseProvider('horse-1'));

      final second = await container.read(
        certificateByHorseProvider('horse-1').future,
      );
      expect(second!.id, 'cert-2');
      expect(calls, 2);
    });

    test(
      'invalidation is scoped to the invalidated horse family instance',
      () async {
        var horse2Calls = 0;
        when(
          () => mockRepository.getCertificateByHorse('horse-1'),
        ).thenAnswer((_) async => Result.ok(_createCertificate(id: 'cert-1')));
        when(() => mockRepository.getCertificateByHorse('horse-2')).thenAnswer((
          _,
        ) async {
          horse2Calls++;
          return Result.ok(_createCertificate(id: 'cert-2'));
        });

        final container = containerWith();
        addTearDown(container.dispose);

        await container.read(certificateByHorseProvider('horse-1').future);
        await container.read(certificateByHorseProvider('horse-2').future);

        container.invalidate(certificateByHorseProvider('horse-1'));

        await container.read(certificateByHorseProvider('horse-1').future);
        await container.read(certificateByHorseProvider('horse-2').future);

        expect(horse2Calls, 1);
      },
    );

    test('re-fetches when the repository provider is invalidated', () async {
      var calls = 0;
      when(() => mockRepository.getCertificateByHorse('horse-1')).thenAnswer((
        _,
      ) async {
        calls++;
        return Result.ok(_createCertificate(id: 'cert-$calls'));
      });

      final container = containerWith();
      addTearDown(container.dispose);

      final first = await container.read(
        certificateByHorseProvider('horse-1').future,
      );
      expect(first!.id, 'cert-1');

      container.invalidate(certificateRepositoryProvider);

      final second = await container.read(
        certificateByHorseProvider('horse-1').future,
      );
      expect(second!.id, 'cert-2');
      expect(calls, 2);
    });
  });

  group('certificatesByOwnerProvider', () {
    test('returns an empty list when no Supabase session exists', () async {
      final container = containerWith();
      addTearDown(container.dispose);

      // currentSupabaseUserId() is null in tests (Supabase not configured),
      // so the provider must short-circuit without touching the repository.
      final result = await container.read(certificatesByOwnerProvider.future);

      expect(result, isEmpty);
      verifyNever(() => mockRepository.getCertificatesByOwner(any()));
    });
  });
}
