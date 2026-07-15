/// Түншийн самбар — хамтрагчийн арга хэмжээнүүдийг удирдах дэлгэц.
///
/// - Одоогийн хэрэглэгчийн арга хэмжээнүүдийг харуулна.
/// - Арга хэмжээ тус бүрийн бүртгэлийн тоог харуулна.
/// - Шинэ арга хэмжээ нэмэх товч.
/// - Арга хэмжээний мэдээллийг засах боломж.
/// - `isFeatured` товчийг асаах/унтраах.
/// - Арга хэмжээг дуусгах (үр дүн оруулах).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/event.dart';
import '../../auth/application/auth_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../application/auto_achievement_provider.dart';
import '../application/events_providers.dart';
import '../application/partner_dashboard_provider.dart';
import 'add_event_screen.dart';
import 'event_detail_screen.dart';

/// Түншийн самбарын дэлгэц.
///
/// Зөвхөн одоогийн хэрэглэгчийн эзэмшдэг арга хэмжээнүүдийг харуулна.
/// Хамтрагч нь арга хэмжээг үүсгэх, засах, featured төлөвийг өөрчлөх,
/// арга хэмжээг дуусгах боломжтой.
class PartnerDashboardScreen extends ConsumerStatefulWidget {
  const PartnerDashboardScreen({super.key});

  @override
  ConsumerState<PartnerDashboardScreen> createState() =>
      _PartnerDashboardScreenState();
}

class _PartnerDashboardScreenState
    extends ConsumerState<PartnerDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final eventsAsync = ref.watch(partnerEventsProvider);
    final authAsync = ref.watch(authStateProvider);
    final horsesAsync = ref.watch(horsesProvider);

    final events = eventsAsync.valueOrNull ?? [];
    final horses = horsesAsync.valueOrNull ?? [];
    final authState = authAsync.valueOrNull;
    final userId = authState?.userId ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Түншийн самбар'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: eventsAsync.when(
        data: (events) {
          if (events.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.event_outlined,
                    size: 64,
                    color: colorScheme.outlineVariant,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Арга хэмжээ байхгүй байна',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Шинэ арга хэмжээ үүсгэх',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  FilledButton.icon(
                    onPressed: () => _createEvent(context, horses, userId),
                    icon: const Icon(Icons.add),
                    label: const Text('Арга хэмжээ нэмэх'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(partnerEventsProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.lg),
              itemCount: events.length + 1, // +1 for header
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _buildHeader(events, theme, colorScheme);
                }

                final event = events[index - 1];
                return _PartnerEventCard(
                  event: event,
                  userId: userId,
                  onToggleFeatured: () =>
                      _toggleFeatured(context, event, userId),
                  onEdit: () => _editEvent(context, event, horses),
                  onComplete: () => _completeEvent(context, event, userId),
                  onView: () => _viewEvent(context, event),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: LoadingIndicator(size: 32)),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 64, color: colorScheme.error),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Арга хэмжээг ачаалахад алдаа гарлаа',
                style: theme.textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                '$err',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton.tonalIcon(
                onPressed: () => ref.invalidate(partnerEventsProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Дахин оролдох'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: events.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => _createEvent(context, horses, userId),
              icon: const Icon(Icons.add),
              label: const Text('Арга хэмжээ нэмэх'),
            )
          : null,
    );
  }

  Widget _buildHeader(
    List<Event> events,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Таны арга хэмжээнүүд',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Нийт ${events.length} арга хэмжээ',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }

  Future<void> _createEvent(
    BuildContext context,
    List<dynamic> horses,
    String userId,
  ) async {
    // Хэрэглэгчийн моридын жагсаалтаас сонгох
    if (horses.isEmpty) {
      if (context.mounted) {
        TamgaToast.show(context, 'Эхлээд морь нэмнэ үү');
      }
      return;
    }

    Future<Event?> navigateToAddEvent(dynamic horse) async {
      return Navigator.of(context).push<Event>(
        MaterialPageRoute(
          builder: (_) =>
              AddEventScreen(horseId: horse.id, horseName: horse.name),
        ),
      );
    }

    // Хэрэв нэг л морь байвал шууд нээх
    if (horses.length == 1) {
      final result = await navigateToAddEvent(horses.first);
      if (result != null && context.mounted) {
        await _saveEvent(context, result.copyWith(ownerId: userId));
      }
      return;
    }

    // Олон морь байвал сонгох bottom sheet харуулах
    if (!context.mounted) return;
    final horse = await showModalBottomSheet<dynamic>(
      context: context,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => _HorseSelectionSheet(horses: horses),
    );

    if (horse == null) return;
    if (!context.mounted) return;

    final result = await navigateToAddEvent(horse);
    if (result != null && context.mounted) {
      await _saveEvent(context, result.copyWith(ownerId: userId));
    }
  }

  Future<void> _saveEvent(BuildContext context, Event event) async {
    final repo = ref.read(localEventRepositoryProvider);
    final saveResult = await repo.saveEvent(event);

    saveResult.when(
      onSuccess: (_) {
        // Auto-achievement: detect completion and update tournament profiles
        processEventCompletionFromRef(ref, event);
        ref.invalidate(partnerEventsProvider);
        ref.invalidate(eventsProvider);
        ref.invalidate(featuredEventsProvider);
        if (context.mounted) {
          showOfflineAwareSaveFeedback(
            context,
            ConnectionMonitor.instance.current,
          );
        }
      },
      onFailure: (error) {
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Хадгалахад алдаа гарлаа: ${error.message}',
          );
        }
      },
    );
  }

  Future<void> _editEvent(
    BuildContext context,
    Event event,
    List<dynamic> horses,
  ) async {
    final horse = horses.where((h) => h.id == event.horseId).firstOrNull;
    if (horse == null) {
      if (context.mounted) {
        TamgaToast.showError(context, 'Морь олдсонгүй');
      }
      return;
    }

    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: event)));

    if (context.mounted) {
      ref.invalidate(partnerEventsProvider);
      ref.invalidate(eventsProvider);
      ref.invalidate(featuredEventsProvider);
    }
  }

  Future<void> _toggleFeatured(
    BuildContext context,
    Event event,
    String userId,
  ) async {
    final updated = event.copyWith(isFeatured: !event.isFeatured);
    await _saveEvent(context, updated);
  }

  Future<void> _completeEvent(
    BuildContext context,
    Event event,
    String userId,
  ) async {
    if (event.result != null && event.result!.isNotEmpty) {
      // Үр дүн байгаа бол шууд дуусгах
      final updated = event.copyWith(isFeatured: event.isFeatured);
      // isUpcoming нь автоматаар false болно (огноо өнгөрсөн бол)
      await _saveEvent(
        context,
        updated.copyWith(isFeatured: updated.isFeatured),
      );
      return;
    }

    // Үр дүн оруулах цонх
    final resultController = TextEditingController();

    final resultText = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Арга хэмжээ дуусгах'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Үр дүнг оруулна уу:'),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: resultController,
              decoration: const InputDecoration(
                hintText: 'Жишээ: 1-р байр, Алтан медаль',
                labelText: 'Үр дүн',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, resultController.text.trim()),
            child: const Text('Дуусгах'),
          ),
        ],
      ),
    );

    if (resultText == null || resultText.isEmpty) return;
    if (!context.mounted) return;

    final updated = event.copyWith(
      result: resultText,
      // Огноог өчигдөр болгох (isUpcoming автоматаар false)
      date: DateTime.now().subtract(const Duration(days: 1)),
    );
    await _saveEvent(context, updated);
  }

  Future<void> _viewEvent(BuildContext context, Event event) async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: event)));

    if (context.mounted) {
      ref.invalidate(partnerEventsProvider);
      ref.invalidate(eventsProvider);
      ref.invalidate(featuredEventsProvider);
    }
  }
}

/// Арга хэмжээний карт (түншийн самбарт харагдах).
class _PartnerEventCard extends ConsumerWidget {
  const _PartnerEventCard({
    required this.event,
    required this.userId,
    required this.onToggleFeatured,
    required this.onEdit,
    required this.onComplete,
    required this.onView,
  });

  final Event event;
  final String userId;
  final VoidCallback onToggleFeatured;
  final VoidCallback onEdit;
  final VoidCallback onComplete;
  final VoidCallback onView;

  IconData get _typeIcon {
    switch (event.eventType) {
      case EventType.race:
        return Icons.speed;
      case EventType.auction:
        return Icons.gavel;
      case EventType.expo:
        return Icons.storefront;
      case EventType.training:
        return Icons.school;
    }
  }

  Color _typeColor(ThemeData theme) {
    switch (event.eventType) {
      case EventType.race:
        return theme.colorScheme.primary;
      case EventType.auction:
        return theme.colorScheme.tertiary;
      case EventType.expo:
        return theme.colorScheme.secondary;
      case EventType.training:
        return Colors.purple;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final typeColor = _typeColor(theme);
    final regCountAsync = ref.watch(registrationCountProvider(event.id));
    final regCount = regCountAsync.valueOrNull ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: InkWell(
        onTap: onView,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header: type badge + title
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: typeColor,
                    radius: 18,
                    child: Icon(_typeIcon, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          event.eventType.displayName,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Featured toggle
                  GestureDetector(
                    onTap: onToggleFeatured,
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.xs),
                      decoration: BoxDecoration(
                        color: event.isFeatured
                            ? colorScheme.primaryContainer
                            : colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.cornerRadiusSmall,
                        ),
                      ),
                      child: Icon(
                        event.isFeatured ? Icons.star : Icons.star_border,
                        size: 20,
                        color: event.isFeatured
                            ? colorScheme.primary
                            : colorScheme.outline,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),

              // ── Info row: date + registration count
              Row(
                children: [
                  // Date
                  if (event.date != null) ...[
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      '${event.date!.year}-${event.date!.month.toString().padLeft(2, '0')}-${event.date!.day.toString().padLeft(2, '0')}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                  ],
                  // Registration count
                  Icon(
                    Icons.pets_outlined,
                    size: 14,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    'Бүртгэл: $regCount',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const Spacer(),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: event.isUpcoming
                          ? colorScheme.primaryContainer
                          : colorScheme.tertiaryContainer,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadiusPill,
                      ),
                    ),
                    child: Text(
                      event.isUpcoming ? 'Удахгүй' : 'Дууссан',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: event.isUpcoming
                            ? colorScheme.onPrimaryContainer
                            : colorScheme.onTertiaryContainer,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppSpacing.sm),

              // ── Actions row
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Edit button
                  TextButton.icon(
                    onPressed: onEdit,
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Засах'),
                    style: TextButton.styleFrom(
                      foregroundColor: colorScheme.primary,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  // Complete button (only for upcoming events)
                  if (event.isUpcoming)
                    TextButton.icon(
                      onPressed: onComplete,
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Дуусгах'),
                      style: TextButton.styleFrom(
                        foregroundColor: colorScheme.tertiary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Морь сонгох bottom sheet.
class _HorseSelectionSheet extends StatelessWidget {
  const _HorseSelectionSheet({required this.horses});

  final List<dynamic> horses;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              'Морь сонгох',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: horses.length,
                itemBuilder: (ctx, i) {
                  final horse = horses[i];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: theme.colorScheme.primaryContainer,
                      child: Text(
                        horse.name.isNotEmpty
                            ? horse.name[0].toUpperCase()
                            : '?',
                        style: TextStyle(
                          color: theme.colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    title: Text(horse.name),
                    subtitle: Text(
                      '${horse.birthYear} · ${horse.coat}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    trailing: const Icon(Icons.add_circle_outline),
                    onTap: () => Navigator.pop(context, horse),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
