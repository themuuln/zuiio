import '../../../app/app_config.dart';
import '../../../core/error/result.dart';
import '../domain/lost_horse_report.dart';
import '../domain/map_enums.dart';
import '../domain/sighting_report.dart';
import 'local_lost_horse_repository.dart';
import 'lost_horse_repository.dart';
import 'supabase_lost_horse_repository.dart';

/// Local-first composition. Cached rows are immediately usable; remote data is
/// a refresh source and every local mutation remains queued until acknowledged.
class OfflineFirstLostHorseRepository implements LostHorseRepository {
  OfflineFirstLostHorseRepository({
    LocalLostHorseRepository? local,
    SupabaseLostHorseRepository? remote,
  }) : _local = local ?? LocalLostHorseRepository(),
       _remote = remote ?? SupabaseLostHorseRepository();

  final LocalLostHorseRepository _local;
  final SupabaseLostHorseRepository _remote;

  @override
  Future<Result<LostHorseReport>> createReport(
    LostHorseReport report, {
    List<String> localMediaPaths = const [],
    List<String> mediaIds = const [],
  }) => _local.createReport(
    report,
    localMediaPaths: localMediaPaths,
    mediaIds: mediaIds,
  );

  @override
  Future<Result<LostHorseReport>> getReport(String reportId) async {
    final cached = await _local.getReport(reportId);
    if (cached.isSuccess || !AppConfig.isSupabaseConfigured) return cached;
    return _remote.getReport(reportId);
  }

  @override
  Future<Result<List<LostHorseReport>>> getMyReports(String ownerId) async {
    final cached = await _local.getMyReports(ownerId);
    if (!AppConfig.isSupabaseConfigured) return cached;
    final remote = await _remote.getMyReports(ownerId);
    return remote.isSuccess ? remote : cached;
  }

  @override
  Future<Result<List<LostHorseReport>>> browseActiveReports() async {
    final cached = await _local.browseActiveReports();
    if (!AppConfig.isSupabaseConfigured) return cached;
    final remote = await _remote.browseActiveReports();
    return remote.isSuccess ? remote : cached;
  }

  @override
  Future<Result<LostHorseReport>> publishReport(
    String reportId, {
    List<String> expectedMediaIds = const [],
  }) => _local.publishReport(reportId, expectedMediaIds: expectedMediaIds);

  @override
  Future<Result<LostHorseReport>> resolveReport({
    required String reportId,
    required LostHorseResolutionType resolutionType,
    String? note,
    String? verifiedSightingId,
  }) => _local.resolveReport(
    reportId: reportId,
    resolutionType: resolutionType,
    note: note,
    verifiedSightingId: verifiedSightingId,
  );

  @override
  Future<Result<SightingReport>> createSighting(SightingReport sighting) =>
      _local.createSighting(sighting);

  @override
  Future<Result<List<SightingReport>>> getSightings(String reportId) async {
    final cached = await _local.getSightings(reportId);
    if (!AppConfig.isSupabaseConfigured) return cached;
    final remote = await _remote.getSightings(reportId);
    return remote.isSuccess ? remote : cached;
  }

  @override
  Future<Result<SightingReport>> reviewSighting({
    required String sightingId,
    required SightingStatus status,
  }) => _local.reviewSighting(sightingId: sightingId, status: status);
}
