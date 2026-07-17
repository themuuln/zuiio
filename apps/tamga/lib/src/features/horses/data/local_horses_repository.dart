import 'package:isar/isar.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/data/local_repository.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_schemas/isar_horse.dart';
import '../../shared/data/local_sync_preferences.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/horse_record.dart';
import '../../../shared/domain/horse_breed_lineage.dart';
import '../../../shared/domain/horse_coat_color.dart';
import 'horses_repository.dart';

class LocalHorsesRepository extends LocalRepository<HorseRecord, IsarHorse>
    implements HorsesRepository {
  LocalHorsesRepository({required super.storage, required super.syncQueue});

  @override
  IsarCollection<IsarHorse> get collection => storage.horses;

  @override
  String get entityType => 'horse';

  @override
  HorseRecord toDomain(IsarHorse entity) => entity.toDomain();

  @override
  IsarHorse fromDomain(HorseRecord entity) => IsarHorse.fromDomain(entity);

  @override
  String domainIdOf(HorseRecord entity) => entity.id;

  @override
  Map<String, dynamic> toDataJson(HorseRecord entity) => entity.toJson();

  static final _seed = [
    HorseRecord(
      id: 'khan-khuleg',
      name: 'Хан Хүлэг',
      relationLabel: 'Root азарга',
      coat: 'Хээр',
      birthYear: 2012,
      awardCount: 7,
      offspringCount: 18,
      isOwnedByHousehold: true,
      notes: 'Lineage-ийн үндсэн root. Өрхийн хамгийн идэвхтэй азарганы шугам.',
      gender: HorseGender.stallion,
      lineageRootId: 'khan-khuleg',
      coatColor: MongolianCoatColor.kheer,
      breedLineage: MongolianBreedLineage.galshar,
      region: 'Хэнтий',
      sum: 'Галшар',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    HorseRecord(
      id: 'tsagaan-salkhi',
      name: 'Цагаан Салхи',
      relationLabel: 'Root азарга',
      coat: 'Цагаан',
      birthYear: 2016,
      awardCount: 4,
      offspringCount: 9,
      isOwnedByHousehold: false,
      notes: 'Гаднах талын root шугамыг төлөөлнө.',
      gender: HorseGender.stallion,
      lineageRootId: 'tsagaan-salkhi',
      coatColor: MongolianCoatColor.tsenker,
      breedLineage: MongolianBreedLineage.mongol,
      region: 'Улаанбаатар',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    HorseRecord(
      id: 'altan-shuurga',
      name: 'Алтан Шуурга',
      relationLabel: 'Хүү',
      coat: 'Хээр',
      birthYear: 2018,
      awardCount: 3,
      offspringCount: 5,
      isOwnedByHousehold: true,
      notes: 'Уралдааны feed дээр тогтмол орж ирдэг үр төл.',
      gender: HorseGender.gelding,
      lineageRootId: 'khan-khuleg',
      sireId: 'khan-khuleg',
      damId: 'tsagaan-salkhi',
      coatColor: MongolianCoatColor.sharga,
      breedLineage: MongolianBreedLineage.galshar,
      region: 'Хэнтий',
      sum: 'Галшар',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    HorseRecord(
      id: 'uulen-bor',
      name: 'Үүлэн Бор',
      relationLabel: 'Охин',
      coat: 'Бор',
      birthYear: 2019,
      awardCount: 2,
      offspringCount: 2,
      isOwnedByHousehold: true,
      notes: 'Өрхийн гүүний шугамын гол холбоос.',
      gender: HorseGender.mare,
      lineageRootId: 'khan-khuleg',
      sireId: 'khan-khuleg',
      coatColor: MongolianCoatColor.bor,
      breedLineage: MongolianBreedLineage.galshar,
      region: 'Хэнтий',
      sum: 'Галшар',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    HorseRecord(
      id: 'shandas-gal',
      name: 'Шандас Гал',
      relationLabel: 'Хүү',
      coat: 'Хүрэн',
      birthYear: 2020,
      awardCount: 1,
      offspringCount: 1,
      isOwnedByHousehold: false,
      notes: 'Гаднах бүртгэлтэй ч lineage болон events дээр давтагдана.',
      gender: HorseGender.gelding,
      lineageRootId: 'khan-khuleg',
      sireId: 'khan-khuleg',
      coatColor: MongolianCoatColor.khuren,
      breedLineage: MongolianBreedLineage.galshar,
      region: 'Хэнтий',
      sum: 'Галшар',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    HorseRecord(
      id: 'munguun-khiimor',
      name: 'Мөнгөн Хийморь',
      relationLabel: 'Охин',
      coat: 'Саарал',
      birthYear: 2021,
      awardCount: 1,
      offspringCount: 0,
      isOwnedByHousehold: true,
      notes: 'Цагаан Салхины шугамаас өрхөд үлдсэн адуу.',
      gender: HorseGender.mare,
      lineageRootId: 'tsagaan-salkhi',
      coatColor: MongolianCoatColor.saaral,
      breedLineage: MongolianBreedLineage.mongol,
      region: 'Улаанбаатар',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  @override
  Future<Result<List<HorseRecord>>> fetchHorses() async {
    try {
      final local = await _readLocal();
      if (!await LocalSyncPreferences.isAutoSyncEnabledFromStorage()) {
        return Result.ok(local);
      }
      return syncHorses();
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_HORSES_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<PaginatedResult<HorseRecord>>> fetchHorsesPaginated({
    required int page,
    required int limit,
  }) async {
    return Result.tryFuture(() async {
      // Ensure seeded if empty
      final count = await collection.where().count();
      if (count == 0) {
        await collection.isar.writeTxn(() async {
          await collection.putAll(_seed.map(IsarHorse.fromDomain).toList());
        });
      }
      final stored = await collection
          .where()
          .offset(page * limit)
          .limit(limit)
          .findAll();
      final totalCount = await collection.where().count();
      return PaginatedResult(
        items: stored.map(toDomain).toList(),
        totalCount: totalCount,
      );
    });
  }

  @override
  Future<Result<List<HorseRecord>>> syncHorses() async {
    try {
      final local = await _readLocal();
      final client = getConfiguredSupabaseClient();
      final userId = await ensureSupabaseUserId();
      if (client == null || userId == null) {
        return Result.ok(local);
      }

      await client
          .from('horses')
          .upsert(
            local.map((item) => item.toSupabaseJson(ownerId: userId)).toList(),
          );
      final response = await client.from('horses').select().order('birth_year');
      final remote = (response as List<dynamic>)
          .map(
            (item) =>
                HorseRecord.fromSupabaseJson(item as Map<String, dynamic>),
          )
          .toList();

      // Replace local collection with remote data
      await collection.isar.writeTxn(() async {
        await collection.where().deleteAll();
        await collection.putAll(remote.map(IsarHorse.fromDomain).toList());
      });

      return Result.ok(remote);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SYNC_HORSES_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<HorseRecord>> saveHorse(HorseRecord horse) async {
    try {
      final local = await _readLocal();
      final index = local.indexWhere((item) => item.id == horse.id);
      final next = [...local];
      if (index >= 0) {
        next[index] = horse;
      } else {
        next.add(horse);
      }

      // Replace local collection
      await collection.isar.writeTxn(() async {
        await collection.where().deleteAll();
        await collection.putAll(next.map(IsarHorse.fromDomain).toList());
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: horse.id,
          action: index >= 0 ? SyncAction.update : SyncAction.create,
          data: horse.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      if (!await LocalSyncPreferences.isAutoSyncEnabledFromStorage()) {
        return Result.ok(horse);
      }

      // Sync and return the saved horse
      await syncHorses();
      return Result.ok(horse);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_HORSE_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<void>> deleteHorse(String id) async {
    try {
      final toDelete = await collection.filter().domainIdEqualTo(id).findAll();
      if (toDelete.isEmpty) {
        return const Result.ok(null);
      }

      await collection.isar.writeTxn(() async {
        for (final item in toDelete) {
          await collection.delete(item.id);
        }
      });

      syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'horse',
          entityId: id,
          action: SyncAction.delete,
          data: {},
          timestamp: DateTime.now(),
        ),
      );

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('DELETE_HORSE_ERROR', e.toString()),
      );
    }
  }

  Future<List<HorseRecord>> _readLocal() async {
    final stored = await collection.where().findAll();
    if (stored.isEmpty) {
      // Seed on first read
      await collection.isar.writeTxn(() async {
        await collection.putAll(_seed.map(IsarHorse.fromDomain).toList());
      });
      return _seed;
    }
    return stored.map(toDomain).toList();
  }
}
