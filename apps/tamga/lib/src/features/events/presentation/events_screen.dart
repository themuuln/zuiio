import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/event.dart';
import '../../horses/application/horses_providers.dart';
import '../../search/application/search_providers.dart';
import '../../shared/data/pagination/pagination_state.dart';
import '../../../core/sync/connection_status.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../../shared/presentation/sync_indicator.dart';
import '../application/auto_achievement_provider.dart';
import '../application/events_providers.dart';
import 'add_event_screen.dart';
import 'event_detail_screen.dart';
import 'widgets/event_card.dart';

/// Full-screen list of events for a specific horse.
///
/// Shows upcoming/past toggle, event type filter chips, and an add button.
class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({this.horseId, super.key});

  /// If null, shows all events. If set, filters to that horse.
  final String? horseId;

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _scrollController = ScrollController();

  /// Active event type filter. Null = show all.
  EventType? _activeFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  /// Scroll-ийн бүсийг шалгаж, дараагийн хуудсыг ачаалах.
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final state = ref.read(paginatedEventsProvider);
      if (!state.isLoading && state.hasMore) {
        ref.read(paginatedEventsProvider.notifier).loadMore();
      }
    }
  }

  @override
  Widget build(BuildContext ctx) {
    final eventsState = ref.watch(paginatedEventsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Уралдаан'),
        leading: IconButton(
          onPressed: () => Navigator.of(ctx).pop(),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: SyncIndicator(size: 12),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          onTap: (_) => HapticFeedback.selectionClick(),
          isScrollable: false,
          tabs: const [
            Tab(text: 'Удахгүй'),
            Tab(text: 'Дууссан'),
          ],
        ),
      ),
      body: eventsState.hasError
          ? TamgaErrorWidget(
              message: 'Ачаалахад алдаа гарлаа',
              onRetry: () =>
                  ref.read(paginatedEventsProvider.notifier).refresh(),
            )
          : eventsState.isEmpty
          ? const EmptyState(
              icon: Icons.event_busy_outlined,
              title: 'Үйл явдал байхгүй байна',
              description: 'Доорх + товчийг дарж үйл явдал нэмнэ үү.',
            )
          : eventsState.isLoading && eventsState.items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _EventList(
                  events: eventsState.items.where((e) => e.isUpcoming).toList(),
                  activeFilter: _activeFilter,
                  onFilterChanged: (f) => setState(() => _activeFilter = f),
                  onEventTap: (e) => _viewEvent(ctx, e),
                  onDeleteEvent: (e) => _deleteEvent(ctx, e),
                  emptyMessage: 'Удахгүй үйл явдал байхгүй байна',
                  state: eventsState,
                  onRetryPage: () =>
                      ref.read(paginatedEventsProvider.notifier).loadMore(),
                ),
                _EventList(
                  events: eventsState.items
                      .where((e) => !e.isUpcoming)
                      .toList(),
                  activeFilter: _activeFilter,
                  onFilterChanged: (f) => setState(() => _activeFilter = f),
                  onEventTap: (e) => _viewEvent(ctx, e),
                  onDeleteEvent: (e) => _deleteEvent(ctx, e),
                  emptyMessage: 'Дууссан үйл явдал байхгүй байна',
                  state: eventsState,
                  onRetryPage: () =>
                      ref.read(paginatedEventsProvider.notifier).loadMore(),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Үйл явдал нэмэх',
        onPressed: () => _addEvent(ctx),
        child: const Icon(Icons.add),
      ),
    );
  }

  // ── Actions ──────────────────────────────────────────────────────

  Future<void> _addEvent(BuildContext ctx) async {
    final horseId = widget.horseId;
    if (horseId == null) return;

    final horses = await ref.read(horsesProvider.future);
    if (!ctx.mounted) return;

    final horse = horses.firstWhere(
      (h) => h.id == horseId,
      orElse: () => horses.first,
    );

    final result = await Navigator.of(ctx).push<Event>(
      MaterialPageRoute(
        builder: (_) =>
            AddEventScreen(horseId: horse.id, horseName: horse.name),
      ),
    );

    if (result != null) {
      final repo = ref.read(localEventRepositoryProvider);
      final saveResult = await repo.saveEvent(result);
      saveResult.when(
        onSuccess: (_) {
          // Auto-achievement: detect completion and update tournament profiles
          processEventCompletionFromRef(ref, result);
          if (ctx.mounted) {
            showOfflineAwareSaveFeedback(
              ctx,
              ConnectionMonitor.instance.current,
            );
          }
          ref.invalidate(horseEventsProvider(horseId));
          ref.invalidate(eventsProvider);
          ref.invalidate(paginatedEventsProvider);
          ref.invalidate(searchCatalogProvider);
        },
        onFailure: (error) {
          if (ctx.mounted) {
            TamgaToast.showError(
              ctx,
              'Үйл явдал хадгалахад алдаа гарлаа: ${error.message}',
            );
          }
        },
      );
    }
  }

  /// Арга хэмжээний дэлгэрэнгүй мэдээлэл рүү шилжих.
  ///
  /// Буцаж ирэхэд events, paginatedEvents болон холбогдох provider-үүдийг
  /// шинэчилж, EventDetailScreen дээр хийсэн өөрчлөлтүүдийг тусгана.
  Future<void> _viewEvent(BuildContext ctx, Event event) async {
    if (!ctx.mounted) return;
    await Navigator.of(
      ctx,
    ).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: event)));
    // EventDetailScreen дээр засвар хийсэн бол өгөгдлийг шинэчлэх
    ref.invalidate(eventsProvider);
    ref.invalidate(paginatedEventsProvider);
    if (widget.horseId != null) {
      ref.invalidate(horseEventsProvider(widget.horseId!));
    }
  }

  Future<void> _deleteEvent(BuildContext ctx, Event event) async {
    final confirmed = await TamgaConfirmDialog.show(
      ctx,
      title: 'Үйл явдал устгах',
      message: '«${event.title}» үйл явдлыг устгахдаа итгэлтэй байна уу?',
      confirmLabel: 'Устгах',
      isDestructive: true,
    );

    if (confirmed != true) return;
    if (!ctx.mounted) return;

    final repo = ref.read(localEventRepositoryProvider);
    final deleteResult = await repo.deleteEvent(event.id);
    deleteResult.when(
      onSuccess: (_) {
        if (ctx.mounted) {
          TamgaToast.show(ctx, 'Үйл явдал устгагдлаа');
        }
        ref.invalidate(eventsProvider);
        ref.invalidate(paginatedEventsProvider);
        ref.invalidate(searchCatalogProvider);
        if (widget.horseId != null) {
          ref.invalidate(horseEventsProvider(widget.horseId!));
        }
      },
      onFailure: (error) {
        if (ctx.mounted) {
          TamgaToast.showError(
            ctx,
            'Үйл явдал устгахад алдаа гарлаа: ${error.message}',
          );
        }
      },
    );
  }
}

// ── Event List ──────────────────────────────────────────────────────

const _filterOptions = <EventType?>[
  null,
  EventType.race,
  EventType.auction,
  EventType.expo,
  EventType.training,
];

class _EventList extends StatelessWidget {
  const _EventList({
    required this.events,
    required this.activeFilter,
    required this.onFilterChanged,
    required this.onEventTap,
    required this.onDeleteEvent,
    required this.emptyMessage,
    this.state,
    this.onRetryPage,
  });

  final List<Event> events;
  final EventType? activeFilter;
  final ValueChanged<EventType?> onFilterChanged;
  final ValueChanged<Event> onEventTap;
  final ValueChanged<Event> onDeleteEvent;
  final String emptyMessage;
  final PaginationState<Event>? state;
  final VoidCallback? onRetryPage;

  @override
  Widget build(BuildContext context) {
    final filtered = activeFilter != null
        ? events.where((e) => e.eventType == activeFilter).toList()
        : events;

    if (events.isEmpty) {
      return EmptyState(
        icon: Icons.event_busy_outlined,
        title: emptyMessage,
        description: 'Доорх + товчийг дарж үйл явдал нэмнэ үү.',
      );
    }

    return Column(
      children: [
        // ── Filter chips ──
        SizedBox(
          height: 56,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.sm,
            ),
            scrollDirection: Axis.horizontal,
            itemCount: _filterOptions.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
            itemBuilder: (ctx, i) {
              final option = _filterOptions[i];
              final isSelected = option == activeFilter;
              final label = option?.displayName ?? 'Бүгд';

              return FilterChip(
                label: Text(label),
                selected: isSelected,
                onSelected: (_) => onFilterChanged(isSelected ? null : option),
              );
            },
          ),
        ),

        // ── Event list ──
        Expanded(
          child: filtered.isEmpty
              ? EmptyState(
                  icon: Icons.event_busy_outlined,
                  title:
                      '"${activeFilter?.displayName ?? ''}" төрлийн үйл явдал байхгүй байна',
                  description: 'Доорх + товчийг дарж үйл явдал нэмнэ үү.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.sm,
                    AppSpacing.lg,
                    AppSpacing.xxl * 4 + AppSpacing.xs,
                  ),
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (ctx, i) {
                    final event = filtered[i];
                    return Dismissible(
                      key: ValueKey('event-${event.id}'),
                      direction: DismissDirection.endToStart,
                      confirmDismiss: (_) async {
                        onDeleteEvent(event);
                        return false; // Do not auto-remove; _deleteEvent handles invalidation.
                      },
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: AppSpacing.lg),
                        decoration: BoxDecoration(
                          color: Theme.of(ctx).colorScheme.error,
                          borderRadius: BorderRadius.circular(
                            AppSpacing.cornerRadius,
                          ),
                        ),
                        child: Icon(
                          Icons.delete_outline,
                          color: Theme.of(ctx).colorScheme.onError,
                        ),
                      ),
                      child: EventCard(
                        event: event,
                        onTap: () => onEventTap(event),
                      ),
                    );
                  },
                ),
        ),

        // ── Pagination footer ──
        if (state != null && state!.hasError)
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: TamgaErrorWidget(
              message: 'Ачаалахад алдаа гарлаа',
              onRetry: onRetryPage,
            ),
          )
        else if (state != null && state!.isLoading)
          const Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: Center(child: LoadingIndicator(size: 20)),
          )
        else if (state != null && !state!.hasMore && state!.items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Center(
              child: Text(
                'Бүх үйл явдлууд ачаалагдлаа',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
