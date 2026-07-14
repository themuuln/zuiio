import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/certificates/data/certificate_repository.dart';
import 'package:tamga/src/features/certificates/data/local_certificate_repository.dart';
import 'package:tamga/src/features/certificates/domain/ownership_certificate.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../helpers/test_helpers.dart';

void main() {
  group('LocalCertificateRepository sync enqueue', () {
    late SyncQueue syncQueue;
    late LocalCertificateRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = LocalCertificateRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('constructor accepts SyncQueue parameter', () {
      expect(repository, isA<CertificateRepository>());
    });

    test(
      'createCertificate enqueues SyncQueueItem with entityType certificate (create)',
      () async {
        final result = await repository.createCertificate(
          horseId: 'test-horse-1',
          ownerId: 'owner-1',
          ownerName: 'Тэмүүлэн',
          horseName: 'Тест Морь',
        );

        expect(result.isSuccess, true);
        final cert = result.value;
        expect(cert.horseId, 'test-horse-1');
        expect(cert.ownerId, 'owner-1');
        expect(cert.status, CertificateStatus.active);
        expect(cert.qrCode, contains('TAMGA-'));

        expect(syncQueue.pendingCount, greaterThanOrEqualTo(1));
        final item = syncQueue.peek();
        expect(item, isNotNull);
        expect(item!.entityType, 'certificate');
        expect(item.entityId, cert.id);
        expect(item.action, SyncAction.create);
        expect(item.data, containsPair('horse_id', 'test-horse-1'));
      },
    );

    test(
      'createCertificate revokes existing active certificate for same horse',
      () async {
        // First certificate
        final result1 = await repository.createCertificate(
          horseId: 'same-horse',
          ownerId: 'owner-1',
          ownerName: 'Owner 1',
          horseName: 'Морь',
        );
        expect(result1.isSuccess, true);
        syncQueue.clear();

        // Second certificate for same horse should revoke the first
        final result2 = await repository.createCertificate(
          horseId: 'same-horse',
          ownerId: 'owner-2',
          ownerName: 'Owner 2',
          horseName: 'Морь',
        );
        expect(result2.isSuccess, true);

        // First cert should now be revoked
        final firstCert = await repository.getCertificateByHorse('same-horse');
        expect(firstCert.isSuccess, true);
        // getCertificateByHorse returns the latest active one
        expect(firstCert.value?.ownerId, 'owner-2');
        expect(firstCert.value?.status, CertificateStatus.active);
      },
    );

    test(
      'transferCertificate enqueues SyncQueueItems with entityType certificate',
      () async {
        // First create a certificate
        final createResult = await repository.createCertificate(
          horseId: 'transfer-horse',
          ownerId: 'owner-1',
          ownerName: 'Owner 1',
          horseName: 'Шилжүүлэх Морь',
        );
        expect(createResult.isSuccess, true);
        final certId = createResult.value.id;
        syncQueue.clear();

        // Now transfer
        final result = await repository.transferCertificate(
          certificateId: certId,
          newOwnerId: 'owner-2',
          newOwnerName: 'Owner 2',
        );

        expect(result.isSuccess, true);
        expect(result.value.horseId, 'transfer-horse');
        expect(result.value.ownerId, 'owner-2');
        expect(result.value.status, CertificateStatus.active);
        expect(result.value.previousOwnerId, 'owner-1');

        // Should have at least 2 items in queue: update (old -> transferred) + create (new)
        expect(syncQueue.pendingCount, greaterThanOrEqualTo(2));

        final items = syncQueue.toList();
        // Find the update action for old certificate
        final updateItem = items.firstWhere((i) => i.entityId == certId);
        expect(updateItem.entityType, 'certificate');
        expect(updateItem.action, SyncAction.update);

        // Find the create action for new certificate
        final createItem = items.firstWhere(
          (i) => i.action == SyncAction.create,
        );
        expect(createItem.entityType, 'certificate');
        expect(createItem.entityId, result.value.id);
      },
    );

    test('getCertificateByHorse returns null for non-existent horse', () async {
      final result = await repository.getCertificateByHorse('non-existent');
      expect(result.isSuccess, true);
      expect(result.value, isNull);
    });

    test(
      'getCertificateByHorse returns latest active certificate for horse',
      () async {
        // Create two active certs for same horse (second will revoke first)
        await repository.createCertificate(
          horseId: 'horse-two-certs',
          ownerId: 'owner-1',
          ownerName: 'Owner 1',
        );

        await repository.createCertificate(
          horseId: 'horse-two-certs',
          ownerId: 'owner-2',
          ownerName: 'Owner 2',
        );

        final result = await repository.getCertificateByHorse(
          'horse-two-certs',
        );
        expect(result.isSuccess, true);
        expect(result.value, isNotNull);
        expect(result.value!.ownerId, 'owner-2');
        expect(result.value!.status, CertificateStatus.active);
      },
    );

    test('getCertificatesByOwner returns certificates for owner', () async {
      await repository.createCertificate(
        horseId: 'horse-a',
        ownerId: 'owner-test',
        ownerName: 'Test Owner',
        horseName: 'Морь А',
      );

      await repository.createCertificate(
        horseId: 'horse-b',
        ownerId: 'owner-test',
        ownerName: 'Test Owner',
        horseName: 'Морь Б',
      );

      final result = await repository.getCertificatesByOwner('owner-test');
      expect(result.isSuccess, true);
      expect(result.value.length, greaterThanOrEqualTo(2));
      expect(result.value.every((c) => c.ownerId == 'owner-test'), true);
    });

    test('verifyCertificate verifies by certificate id', () async {
      final createResult = await repository.createCertificate(
        horseId: 'verify-horse',
        ownerId: 'owner-v',
        ownerName: 'Verifier',
      );
      expect(createResult.isSuccess, true);

      final result = await repository.verifyCertificate(createResult.value.id);
      expect(result.isSuccess, true);
      expect(result.value.isValid, true);
      expect(result.value.certificate.id, createResult.value.id);
    });

    test('verifyCertificate returns fail for non-existent id', () async {
      final result = await repository.verifyCertificate('non-existent');
      expect(result.isSuccess, false);
    });

    test(
      'verifyCertificate with revoked certificate returns invalid',
      () async {
        final createResult = await repository.createCertificate(
          horseId: 'revoke-horse',
          ownerId: 'owner-r',
          ownerName: 'Revoker',
        );
        expect(createResult.isSuccess, true);

        // Revoke by creating a new cert for same horse
        await repository.createCertificate(
          horseId: 'revoke-horse',
          ownerId: 'owner-r2',
          ownerName: 'New Owner',
        );

        // First cert should now be revoked
        final result = await repository.verifyCertificate(
          createResult.value.id,
        );
        expect(result.isSuccess, true);
        expect(result.value.isValid, false);
        expect(result.value.message, contains('цуцалсан'));
      },
    );
  });
}
