import 'package:isar/isar.dart';

import '../../../core/data/local_repository.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_schemas/isar_breeding_record.dart';
import '../domain/breeding_record.dart';
import 'breeding_repository.dart';

class LocalBreedingRepository
    extends LocalRepository<BreedingRecord, IsarBreedingRecord>
    implements BreedingRepository {
  LocalBreedingRepository({
    required super.storage,
    required super.syncQueue,
  });

  @override
  IsarCollection<IsarBreedingRecord> get collection => storage.breedingRecords;

  @override
  String get entityType => 'breeding';

  @override
  BreedingRecord toDomain(IsarBreedingRecord entity) => entity.toDomain();

  @override
  IsarBreedingRecord fromDomain(BreedingRecord entity) =>
      IsarBreedingRecord.fromDomain(entity);

  @override
  String domainIdOf(BreedingRecord entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(BreedingRecord entity) => entity.toJson();

  static List<BreedingRecord> get _seed => [
    BreedingRecord(
      id: 'breeding-1',
      sireId: 'khan-khuleg',
      sireName: 'Хан Хүлэг',
      damId: 'uulen-bor',
      damName: 'Үүлэн Бор',
      breedingDate: DateTime.now().subtract(const Duration(days: 150)),
      expectedFoalingDate: DateTime.now()
          .subtract(const Duration(days: 150))
          .add(const Duration(days: 340)),
      status: 'Хээлтсэн',
      herdLabel: 'Баруун сүрэг',
      notes: 'Хээлтүүлэг амжилттай болж хэт авиан шинжилгээгээр баталгаажсан.',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    BreedingRecord(
      id: 'breeding-2',
      sireId: 'tsagaan-salkhi',
      sireName: 'Цагаан Салхи',
      damId: 'munguun-khiimor',
      damName: 'Мөнгөн Хийморь',
      breedingDate: DateTime.now().subtract(const Duration(days: 350)),
      expectedFoalingDate: DateTime.now()
          .subtract(const Duration(days: 350))
          .add(const Duration(days: 340)),
      status: 'Төллөсөн',
      herdLabel: 'Урд бэлчээр',
      notes: 'Улаан зүстэй эр унага гарсан.',
      foalId: 'foal-1',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  @override
  Future<Result<List<BreedingRecord>>> fetchBreedingRecords() async {
    try {
      final records = await _readLocal();
      return Result.ok(records);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'FETCH_BREEDING_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<List<BreedingRecord>>> saveBreedingRecord(
    BreedingRecord record,
  ) async {
    try {
      final local = await _readLocal();
      final index = local.indexWhere((item) => item.id == record.id);
      final isNew = index < 0;
      final next = [...local];
      if (index >= 0) {
        next[index] = record;
      } else {
        next.add(record);
      }

      // Replace local collection
      await storage.breedingRecords.isar.writeTxn(() async {
        await storage.breedingRecords.where().deleteAll();
        await storage.breedingRecords.putAll(
          next.map(IsarBreedingRecord.fromDomain).toList(),
        );
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'breeding',
          entityId: record.id,
          action: isNew ? SyncAction.create : SyncAction.update,
          data: record.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return Result.ok(next);
    } catch (e, stack) {
      return Result.fail(
        AppException(
          message: e.toString(),
          code: 'SAVE_BREEDING_ERROR',
          details: {'stack': stack.toString()},
        ),
      );
    }
  }

  Future<List<BreedingRecord>> _readLocal() async {
    final stored = await collection.where().findAll();
    if (stored.isEmpty) {
      // Seed on first read
      await collection.isar.writeTxn(() async {
        await collection.putAll(
          _seed.map(IsarBreedingRecord.fromDomain).toList(),
        );
      });
      return _seed;
    }
    return stored.map(toDomain).toList();
  }
}
