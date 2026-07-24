import 'dart:async';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_sighting_report.dart';
import '../domain/sighting_report.dart';
import 'sighting_repository.dart';

/// Isar-backed local implementation of [SightingRepository].
class LocalSightingRepository implements SightingRepository {
  LocalSightingRepository({IsarStorage? storage})
    : _storage = storage ?? IsarStorage.instance;

  final IsarStorage _storage;

  @override
  Future<Result<SightingReport>> reportSighting(SightingReport sighting) async {
    try {
      final isar = _storage.sightingReports.isar;
      final isarSighting = IsarSightingReport.fromDomain(sighting);
      await isar.writeTxn(() async {
        await _storage.sightingReports.put(isarSighting);
      });
      return Result.ok(sighting);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SIGHTING_FAILED', 'Мэдээлэл хадгалсангүй: $e'),
      );
    }
  }

  @override
  Future<Result<List<SightingReport>>> getSightingsForReport(
    String reportId,
  ) async {
    try {
      final sightings = await _storage.sightingReports
          .filter()
          .reportIdEqualTo(reportId)
          .sortByCreatedAtDesc()
          .findAll();
      return Result.ok(sightings.map((e) => e.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'FETCH_SIGHTINGS_FAILED',
          'Мэдээллүүд авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<SightingReport>>> getMySightings(String reporterId) async {
    try {
      final sightings = await _storage.sightingReports
          .filter()
          .reporterIdEqualTo(reporterId)
          .sortByCreatedAtDesc()
          .findAll();
      return Result.ok(sightings.map((e) => e.toDomain()).toList());
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'FETCH_MY_SIGHTINGS_FAILED',
          'Таны мэдээллүүд авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> updateSightingStatus(String id, String status) async {
    try {
      final isar = _storage.sightingReports.isar;
      await isar.writeTxn(() async {
        final existing = await _storage.sightingReports
            .filter()
            .domainIdEqualTo(id)
            .findFirst();
        if (existing != null) {
          existing.status = status;
          await _storage.sightingReports.put(existing);
        }
      });
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'SIGHTING_STATUS_FAILED',
          'Төлөв шинэчилсэнгүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> deleteSighting(String id) async {
    try {
      final isar = _storage.sightingReports.isar;
      await isar.writeTxn(() async {
        final existing = await _storage.sightingReports
            .filter()
            .domainIdEqualTo(id)
            .findFirst();
        if (existing != null) {
          await _storage.sightingReports.delete(existing.id);
        }
      });
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException.withDetail(
          'DELETE_SIGHTING_FAILED',
          'Мэдээлэл устгасангүй: $e',
        ),
      );
    }
  }

  @override
  Stream<List<SightingReport>> watchSightingsForReport(String reportId) {
    final controller = StreamController<List<SightingReport>>();

    _storage.sightingReports
        .filter()
        .reportIdEqualTo(reportId)
        .sortByCreatedAtDesc()
        .watch()
        .listen(
          (sightings) {
            controller.add(sightings.map((e) => e.toDomain()).toList());
          },
          onError: (Object e) {
            controller.addError(e);
          },
        );

    return controller.stream;
  }
}
