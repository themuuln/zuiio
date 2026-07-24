import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/race_providers.dart';
import '../domain/race.dart';
import 'race_detail_screen.dart';

/// Уралдааны жагсаалтын дэлгэц.
///
/// Удахгүй болох / Дууссан гэсэн 2 табтай.
/// Төрлөөр шүүх FilterChip-үүдтэй (Бүгд / Наадам / Бүс / Орон нутгийн).
/// Уралдаан дээр дарахад дэлгэрэнгүй мэдээлэл рүү шилжинэ.
class RaceListScreen extends ConsumerStatefulWidget {
  const RaceListScreen({super.key});

  @override
  ConsumerState<RaceListScreen> createState() => _RaceListScreenState();
}

class _RaceListScreenState extends ConsumerState<RaceListScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  /// Идэвхтэй төрлийн шүүлтүүр. null бол бүгдийг харуулна.
  RaceType? _activeFilter;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Уралдаан'),
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
      body: _RaceListBody(
        tabController: _tabController,
        activeFilter: _activeFilter,
        onFilterChanged: (f) => setState(() => _activeFilter = f),
        onRaceTap: (race) => _navigateToDetail(context, race),
      ),
    );
  }

  Future<void> _navigateToDetail(BuildContext context, Race race) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => RaceDetailScreen(raceId: race.id),
      ),
    );
    if (context.mounted) {
      ref.invalidate(racesProvider);
    }
  }
}

// ── Constants ─────────────────────────────────────────────────────

const _filterOptions = <RaceType?>[
  null,
  RaceType.naadam,
  RaceType.regional,
  RaceType.local,
];

// ── Race List Body ───────────────────────────────────────────────

class _RaceListBody extends ConsumerWidget {
  const _RaceListBody({
    required this.tabController,
    required this.activeFilter,
    required this.onFilterChanged,
    required this.onRaceTap,
  });

  final TabController tabController;
  final RaceType? activeFilter;
  final ValueChanged<RaceType?> onFilterChanged;
  final ValueChanged<Race> onRaceTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final racesAsync = ref.watch(racesProvider);

    return racesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => TamgaErrorWidget(
        message: 'Уралдаан ачаалахад алдаа гарлаа',
        onRetry: () => ref.invalidate(racesProvider),
      ),
      data: (races) {
        if (races.isEmpty) {
          return const Center(
            child: EmptyState(
              icon: Icons.event_busy_outlined,
              title: 'Уралдаан байхгүй байна',
              description: 'Шинэ уралдаан нэмэгдээгүй байна.',
            ),
          );
        }

        final now = DateTime.now();

        // Удахгүй болох уралдаанууд
        final upcomingRaces = races
            .where(
              (r) =>
                  r.status == RaceStatus.upcoming ||
                  r.status == RaceStatus.ongoing ||
                  (r.date != null && r.date!.isAfter(now)),
            )
            .toList();

        // Дууссан уралдаанууд
        final pastRaces = races
            .where(
              (r) =>
                  r.status == RaceStatus.completed ||
                  r.status == RaceStatus.cancelled ||
                  (r.date != null && r.date!.isBefore(now) &&
                      r.status != RaceStatus.upcoming),
            )
            .toList();

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
                separatorBuilder: (_, _) =>
                    const SizedBox(width: AppSpacing.sm),
                itemBuilder: (ctx, i) {
                  final option = _filterOptions[i];
                  final isSelected = option == activeFilter;
                  final label = option?.displayName ?? 'Бүгд';

                  return FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (_) =>
                        onFilterChanged(isSelected ? null : option),
                  );
                },
              ),
            ),

            // ── Tab content ──
            Expanded(
              child: TabBarView(
                controller: tabController,
                children: [
                  _RaceTabList(
                    races: upcomingRaces,
                    activeFilter: activeFilter,
                    onRaceTap: onRaceTap,
                    emptyMessage: 'Удахгүй уралдаан байхгүй байна',
                  ),
                  _RaceTabList(
                    races: pastRaces,
                    activeFilter: activeFilter,
                    onRaceTap: onRaceTap,
                    emptyMessage: 'Дууссан уралдаан байхгүй байна',
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

// ── Race Tab List ───────────────────────────────────────────────

class _RaceTabList extends StatelessWidget {
  const _RaceTabList({
    required this.races,
    required this.activeFilter,
    required this.onRaceTap,
    required this.emptyMessage,
  });

  final List<Race> races;
  final RaceType? activeFilter;
  final ValueChanged<Race> onRaceTap;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    final filtered = activeFilter != null
        ? races.where((r) => r.type == activeFilter).toList()
        : races;

    if (filtered.isEmpty) {
      return Center(
        child: EmptyState(
          icon: Icons.event_busy_outlined,
          title: emptyMessage,
          description: 'Шинэ уралдаан нэмэгдээгүй байна.',
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.xxl * 2,
      ),
      itemCount: filtered.length,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (ctx, i) {
        final race = filtered[i];
        return _RaceCard(
          race: race,
          onTap: () => onRaceTap(race),
        );
      },
    );
  }
}

// ── Race Card ────────────────────────────────────────────────────

class _RaceCard extends StatelessWidget {
  const _RaceCard({required this.race, required this.onTap});

  final Race race;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final dateStr = race.date != null
        ? '${race.date!.year}-${race.date!.month.toString().padLeft(2, '0')}-${race.date!.day.toString().padLeft(2, '0')}'
        : 'Огноо тодорхойгүй';

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              // ── Left icon ──
              CircleAvatar(
                backgroundColor: colorScheme.secondaryContainer,
                child: Icon(
                  Icons.emoji_events_outlined,
                  color: colorScheme.onSecondaryContainer,
                ),
              ),
              const SizedBox(width: AppSpacing.md),

              // ── Race info ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      race.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          dateStr,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        if (race.location != null) ...[
                          const SizedBox(width: AppSpacing.md),
                          Icon(
                            Icons.place_outlined,
                            size: 14,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              race.location!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // ── Status chip ──
              _StatusChip(status: race.status),
              const SizedBox(width: AppSpacing.sm),
              Icon(
                Icons.chevron_right,
                color: colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Status Chip ───────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final RaceStatus status;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final (Color bg, Color fg) = switch (status) {
      RaceStatus.upcoming => (colorScheme.primaryContainer, colorScheme.onPrimaryContainer),
      RaceStatus.ongoing => (colorScheme.tertiaryContainer, colorScheme.onTertiaryContainer),
      RaceStatus.completed => (colorScheme.secondaryContainer, colorScheme.onSecondaryContainer),
      RaceStatus.cancelled => (colorScheme.errorContainer, colorScheme.onErrorContainer),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}
