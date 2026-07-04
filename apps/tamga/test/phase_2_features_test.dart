import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';

import 'helpers/test_helpers.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import 'package:tamga/src/features/breeding/data/local_breeding_repository.dart';
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';
import 'package:tamga/src/features/lineage/application/inbreeding_calculator.dart';

void main() {
  group('Inbreeding Calculator Tests', () {
    final nameMap = {
      'khan-khuleg': 'Хан Хүлэг',
      'altan-shuurga': 'Алтан Шуурга',
      'uulen-bor': 'Үүлэн Бор',
      'shandas-gal': 'Шандас Гал',
      'khukh-suld': 'Хөх Сүлд',
      'saaral-tenkhee': 'Саарал Тэнхээ',
      'tsagaan-salkhi': 'Цагаан Салхи',
      'munguun-khiimor': 'Мөнгөн Хийморь',
      'saran-tuyaa': 'Саран Туяа',
      'tenger-khuleg': 'Тэнгэр Хүлэг',
      'khuren-guu': 'Хүрэн Гүү',
    };

    test(
      'Half-siblings sharing father (khan-khuleg) should have COI of 12.5%',
      () {
        // altan-shuurga and uulen-bor share father 'khan-khuleg'
        final result = InbreedingCalculator.calculate(
          'altan-shuurga',
          'uulen-bor',
          nameMap,
        );
        expect(result.coi, closeTo(0.125, 0.0001));
        expect(result.paths.any((p) => p.ancestorId == 'khan-khuleg'), isTrue);
        expect(result.riskLevel, 'Өндөр эрсдэлтэй');
      },
    );

    test('Unrelated horses should have COI of 0%', () {
      // altan-shuurga (khan-khuleg line) and munguun-khiimor (tsagaan-salkhi line)
      final result = InbreedingCalculator.calculate(
        'altan-shuurga',
        'munguun-khiimor',
        nameMap,
      );
      expect(result.coi, 0.0);
      expect(result.paths.isEmpty, isTrue);
      expect(result.riskLevel, 'Эрсдэлгүй');
    });

    test(
      'Nephew and aunt (khukh-suld and uulen-bor) should have COI of 6.25%',
      () {
        // khukh-suld (sire: altan-shuurga, grandsire: khan-khuleg)
        // uulen-bor (sire: khan-khuleg)
        final result = InbreedingCalculator.calculate(
          'khukh-suld',
          'uulen-bor',
          nameMap,
        );
        expect(result.coi, closeTo(0.0625, 0.0001));
      },
    );
  });

  group('LocalBreedingRepository Tests', () {
    test(
      'saveBreedingRecord and fetchBreedingRecords persist and load successfully',
      () async {
        await setupTestEnvironment();
        await IsarDatabase.initialize();
        final repository = LocalBreedingRepository(
          storage: IsarStorage.instance,
          syncQueue: SyncQueue(),
        );
        addTearDown(() async {
          await IsarDatabase.close();
        });

        final records = await repository.fetchBreedingRecords();
        expect(records.getOrThrow(), isNotEmpty); // Seeds should be present

        final now = DateTime.now();
        final newRecord = BreedingRecord(
          id: 'test-breeding',
          sireId: 'khan-khuleg',
          sireName: 'Хан Хүлэг',
          damId: 'uulen-bor',
          damName: 'Үүлэн Бор',
          breedingDate: now,
          expectedFoalingDate: now.add(const Duration(days: 340)),
          status: 'Хээлтсэн',
          herdLabel: 'Зүүн сүрэг',
          notes: 'Тест тэмдэглэл',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        final updated = await repository.saveBreedingRecord(newRecord);
        expect(
          updated.getOrThrow().any((r) => r.id == 'test-breeding'),
          isTrue,
        );

        final reFetched = await repository.fetchBreedingRecords();
        expect(
          reFetched.getOrThrow().any((r) => r.id == 'test-breeding'),
          isTrue,
        );
      },
    );
  });
}
