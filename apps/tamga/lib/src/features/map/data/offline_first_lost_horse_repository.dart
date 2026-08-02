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
///
/// The remote is optional on purpose: constructing [SupabaseLostHorseRepository]
/// touches `Supabase.instance` and throws when the SDK was never initialized
/// (offline launch without `.env`). Providers pass a remote only when Supabase
/// is configured, so the offline-first path never dies in the constructor.
class OfflineFirstLostHorseRepository implements LostHorseRepository {
  OfflineFirstLostHorseRepository({
    LocalLostHorseRepository? local,
    SupabaseLostHorseRepository? remote,
  }) : _local = local ?? LocalLostHorseRepository(),
       _remote = remote;

  final LocalLostHorseRepository _local;
  final SupabaseLostHorseRepository? _remote;

  /// Returns the remote when present and Supabase is configured, else null.
  SupabaseLostHorseRepository? get _enabledRemote =>
      AppConfig.isSupabaseConfigured ? _remote : null;

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
    final remote = _enabledRemote;
    if (cached.isSuccess || remote == null) return cached;
    // The Supabase client throws on network failure / unconfigured client;
    // fall back to the cached result exactly like a Result.fail would.
    try {
      return await remote.getReport(reportId);
    } catch (_) {
      return cached;
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getMyReports(String ownerId) async {
    final cached = await _local.getMyReports(ownerId);
    final remote = _enabledRemote;
    if (remote == null) return cached;
    try {
      final result = await remote.getMyReports(ownerId);
      return result.isSuccess ? result : cached;
    } catch (_) {
      return cached;
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> browseActiveReports() async {
    final cached = await _local.browseActiveReports();
    final remote = _enabledRemote;
    if (remote == null) return cached;
    try {
      final result = await remote.browseActiveReports();
      return result.isSuccess ? result : cached;
    } catch (_) {
      return cached;
    }
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
    final remote = _enabledRemote;
    if (remote == null) return cached;
    try {
      final result = await remote.getSightings(reportId);
      return result.isSuccess ? result : cached;
    } catch (_) {
      return cached;
    }
  }

  @override
  Future<Result<SightingReport>> reviewSighting({
    required String sightingId,
    required SightingStatus status,
  }) => _local.reviewSighting(sightingId: sightingId, status: status);
}
