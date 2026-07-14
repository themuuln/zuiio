import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/data/isar_storage.dart';
import '../../../core/sync/sync_queue.dart';
import '../data/race_entry_repository.dart';
import '../data/local_race_entry_repository.dart';
import '../data/local_race_repository.dart';
import '../data/race_repository.dart';
import '../domain/race.dart';
import '../domain/race_entry.dart';

// ── Repository providers ─────────────────────────────────────────

/// Local [RaceRepository] provider.
///
/// Uses the shared IsarStorage instance and a fresh SyncQueue.
final localRaceRepositoryProvider = Provider<RaceRepository>((ref) {
  return LocalRaceRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

/// Injectable race repository provider.
///
/// Override in tests via `ProviderScope.overrides`.
final raceRepositoryProvider = Provider<RaceRepository>((ref) {
  return ref.read(localRaceRepositoryProvider);
});

/// Local [RaceEntryRepository] provider.
final localRaceEntryRepositoryProvider = Provider<RaceEntryRepository>((ref) {
  return LocalRaceEntryRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
    raceRepository: ref.read(localRaceRepositoryProvider),
  );
});

/// Injectable race entry repository provider.
///
/// Override in tests via `ProviderScope.overrides`.
final raceEntryRepositoryProvider = Provider<RaceEntryRepository>((ref) {
  return ref.read(localRaceEntryRepositoryProvider);
});

// ── Race list providers ─────────────────────────────────────────

/// Бүх уралдааны жагсаалт.
///
/// Supabase болон локал өгөгдлийн сангаас бүх уралдааныг ачаална.
final racesProvider = FutureProvider<List<Race>>((ref) async {
  final repository = ref.read(raceRepositoryProvider);
  final result = await repository.fetchAll();
  return result.getOrThrow();
});

/// Удахгүй болох уралдаанууд.
///
/// Одоогийн огнооноос хойшхи эсвэл үргэлжилж буй уралдаануудыг харуулна.
final upcomingRacesProvider = FutureProvider<List<Race>>((ref) async {
  final races = await ref.watch(racesProvider.future);
  final now = DateTime.now();
  return races
      .where(
        (r) =>
            r.status == RaceStatus.upcoming ||
            r.status == RaceStatus.ongoing ||
            (r.date != null && r.date!.isAfter(now)),
      )
      .toList();
});

/// Дууссан уралдаанууд.
///
/// Өнгөрсөн уралдаануудыг харуулна.
final pastRacesProvider = FutureProvider<List<Race>>((ref) async {
  final races = await ref.watch(racesProvider.future);
  final now = DateTime.now();
  return races
      .where(
        (r) =>
            r.status == RaceStatus.completed ||
            r.status == RaceStatus.cancelled ||
            (r.date != null && r.date!.isBefore(now) &&
                r.status != RaceStatus.upcoming),
      )
      .toList();
});

/// Төрлөөр шүүсэн уралдаанууд.
///
/// `RaceType` параметрээр шүүж, тухайн төрлийн уралдаануудыг буцаана.
final racesByTypeProvider =
    FutureProvider.family<List<Race>, RaceType>((ref, type) async {
  final races = await ref.watch(racesProvider.future);
  return races.where((r) => r.type == type).toList();
});

/// Нэг уралдааны дэлгэрэнгүй мэдээлэл.
///
/// ID-гаар тодорхой уралдааныг ачаална.
final raceDetailProvider =
    FutureProvider.family<Race, String>((ref, raceId) async {
  final repository = ref.read(raceRepositoryProvider);
  final result = await repository.fetchById(raceId);
  return result.getOrThrow();
});

// ── Race entry providers ────────────────────────────────────────

/// Уралдааны бүртгэлүүд.
///
/// Тухайн уралдаанд бүртгэгдсэн моридын жагсаалт.
final raceEntriesProvider =
    FutureProvider.family<List<RaceEntry>, String>((ref, raceId) async {
  final repository = ref.read(raceEntryRepositoryProvider);
  final result = await repository.fetchByRace(raceId);
  return result.getOrThrow();
});

/// Уралдааны идэвхтэй бүртгэлүүд.
///
/// Зөвхөн цуцлагдаагүй (scratched биш) бүртгэлүүдийг буцаана.
final activeRaceEntriesProvider =
    FutureProvider.family<List<RaceEntry>, String>((ref, raceId) async {
  final entries = await ref.watch(raceEntriesProvider(raceId).future);
  return entries.where((e) => e.status != RaceEntryStatus.scratched).toList();
});


