import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../shared/domain/health_log.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_health_log.dart';

class LocalHealthRepository {
  const LocalHealthRepository(this._storage);

  final IsarStorage _storage;

  static final _medicalSeed = [
    HealthLog(
      id: 'm1',
      horseId: 'khan-khuleg',
      logType: LogType.vaccination,
      date: DateTime.now().subtract(const Duration(days: 30)),
      notes: 'Адууны томуугийн эсрэг вакцин',
      medicament: 'Томуу-Вак',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    HealthLog(
      id: 'm2',
      horseId: 'khan-khuleg',
      logType: LogType.vetVisit,
      date: DateTime.now().subtract(const Duration(days: 15)),
      notes: 'Уралдааны өмнөх ерөнхий үзлэг, эрүүл мэндийн тодорхойлолт',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ];

  Future<Result<List<HealthLog>>> fetchMedicalLogs(String horseId) async {
    try {
      final stored = await _storage.healthLogs
          .filter()
          .horseIdEqualTo(horseId)
          .findAll();
      if (stored.isEmpty && horseId == 'khan-khuleg') {
        // Seed on first read for this horse
        await _storage.healthLogs.isar.writeTxn(() async {
          await _storage.healthLogs.putAll(
            _medicalSeed.map(IsarHealthLog.fromDomain).toList(),
          );
        });
        return Result.ok(_medicalSeed);
      }
      return Result.ok(stored.map((e) => e.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_MEDICAL_LOGS_ERROR', e.toString()),
      );
    }
  }

  Future<Result<void>> saveMedicalLog(HealthLog log) async {
    try {
      final existing = await _storage.healthLogs
          .filter()
          .domainIdEqualTo(log.id)
          .findFirst();
      final isarLog = IsarHealthLog.fromDomain(log);
      if (existing != null) {
        isarLog.id = existing.id;
      }
      await _storage.healthLogs.isar.writeTxn(() async {
        await _storage.healthLogs.put(isarLog);
      });
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SAVE_MEDICAL_LOG_ERROR', e.toString()),
      );
    }
  }

  Future<Result<void>> deleteMedicalLog(String horseId, String logId) async {
    try {
      final toDelete = await _storage.healthLogs
          .filter()
          .domainIdEqualTo(logId)
          .horseIdEqualTo(horseId)
          .findFirst();
      if (toDelete != null) {
        await _storage.healthLogs.isar.writeTxn(() async {
          await _storage.healthLogs.delete(toDelete.id);
        });
      }
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('DELETE_MEDICAL_LOG_ERROR', e.toString()),
      );
    }
  }
}

final healthRepositoryProvider = FutureProvider<LocalHealthRepository>((
  ref,
) async {
  return LocalHealthRepository(IsarStorage.instance);
});

final medicalLogsProvider = FutureProvider.family<List<HealthLog>, String>((
  ref,
  horseId,
) async {
  final repo = await ref.watch(healthRepositoryProvider.future);
  return (await repo.fetchMedicalLogs(horseId)).getOrThrow();
});
