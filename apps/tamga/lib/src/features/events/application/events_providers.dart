import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/create_list_provider.dart';
import '../../../core/services/local_notification_service.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../shared/domain/event.dart';
import '../../../shared/domain/event_registration.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/pagination/pagination_state.dart';
import '../data/event_repository.dart';
import '../data/event_registration_repository.dart';
import '../data/local_event_repository.dart';
import '../data/local_event_registration_repository.dart';

// ── Repository providers ─────────────────────────────────────────

/// LocalNotificationService-ийн provider.
///
/// Тестэнд override хийхэд хэрэглэнэ.
final localNotificationServiceProvider = Provider<LocalNotificationService>((
  ref,
) {
  return LocalNotificationService.instance;
});

final localEventRepositoryProvider = Provider<EventRepository>((ref) {
  return LocalEventRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

final eventRepositoryProvider = FutureProvider<EventRepository>((ref) async {
  return ref.read(localEventRepositoryProvider);
});

// ── Event list providers ─────────────────────────────────────────

/// Бүх үйл явдлын жагсаалт.
final eventsProvider = createListProvider<Event, EventRepository>(
  (ref) => ref.watch(eventRepositoryProvider.future),
  (repo) => repo.fetchEvents(),
);

/// Тодорхой морины үйл явдлууд.
final horseEventsProvider =
    createListFamilyProvider<Event, EventRepository, String>(
      (ref) => ref.watch(eventRepositoryProvider.future),
      (repo, horseId) => repo.fetchEventsByHorse(horseId),
    );

/// Онцлох үйл явдлууд (isFeatured = true).
final featuredEventsProvider = createListProvider<Event, EventRepository>(
  (ref) => ref.watch(eventRepositoryProvider.future),
  (repo) => repo.fetchFeaturedEvents(),
);

/// Хуудаслалттай үйл явдлуудын provider.
///
/// Page size: 20. Дараагийн хуудсыг `loadMore()`-оор ачаална.
final paginatedEventsProvider =
    StateNotifierProvider<PaginationNotifier<Event>, PaginationState<Event>>((
      ref,
    ) {
      final notifier = PaginationNotifier<Event>(
        fetchPage: (page, pageSize) async {
          final repo = ref.read(eventRepositoryProvider).value;
          if (repo == null) return <Event>[];
          final result = await repo.fetchEvents();
          final allEvents = result.getOrThrow();
          final start = page * pageSize;
          if (start >= allEvents.length) return <Event>[];
          final end = (start + pageSize).clamp(0, allEvents.length);
          return allEvents.sublist(start, end);
        },
      );
      Future.microtask(() => notifier.loadInitial());
      return notifier;
    });

// ── Event Registration providers ─────────────────────────────────

/// Арга хэмжээний бүртгэлийн repository provider.
final localEventRegistrationRepositoryProvider =
    Provider<EventRegistrationRepository>((ref) {
      return LocalEventRegistrationRepository(
        storage: IsarStorage.instance,
        syncQueue: SyncQueue(),
      );
    });

final eventRegistrationRepositoryProvider =
    FutureProvider<EventRegistrationRepository>((ref) async {
      return ref.read(localEventRegistrationRepositoryProvider);
    });

/// Тухайн арга хэмжээний бүртгэлүүд.
final eventRegistrationsProvider =
    createListFamilyProvider<
      EventRegistration,
      EventRegistrationRepository,
      String
    >(
      (ref) => ref.watch(eventRegistrationRepositoryProvider.future),
      (repo, eventId) => repo.fetchRegistrations(eventId),
    );

/// Тухайн морины арга хэмжээний бүртгэлийн төлөв.
///
/// Буцаах утга:
/// - `null` — хараахан мэдэхгүй (loading)
/// - `true` — бүртгэлтэй
/// - `false` — бүртгэлгүй
final horseRegistrationStatusProvider =
    FutureProvider.family<bool?, ({String eventId, String horseId})>((
      ref,
      params,
    ) async {
      final repository = await ref.watch(
        eventRegistrationRepositoryProvider.future,
      );
      final result = await repository.fetchRegistrations(params.eventId);
      final registrations = result.getOrThrow();
      return registrations.any(
        (r) =>
            r.horseId == params.horseId &&
            r.status != RegistrationStatus.cancelled,
      );
    });
