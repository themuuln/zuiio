import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../horses/presentation/horse_detail_screen.dart';
import '../../shared/presentation/sync_indicator.dart';
import '../application/care_providers.dart';
import '../domain/care_task.dart';

/// Daily care calendar for recurring horse work and upcoming events.
class CareScreen extends ConsumerStatefulWidget {
  const CareScreen({super.key});

  @override
  ConsumerState<CareScreen> createState() => _CareScreenState();
}

class _CareScreenState extends ConsumerState<CareScreen> {
  bool _showAll = false;

  Future<void> _refresh() async {
    ref.invalidate(careOverviewProvider);
    ref.invalidate(horsesProvider);
    await Future.wait([
      ref.read(careOverviewProvider.future),
      ref.read(horsesProvider.future),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final overviewAsync = ref.watch(careOverviewProvider);
    final horsesAsync = ref.watch(horsesProvider);

    return Scaffold(
      backgroundColor: colors.surface,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: colors.primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              TamgaSliverHeader(
                title: 'Арчилгаа',
                subtitle: 'Өнөөдөр хийх ажлаа нэг дороос харна.',
                actions: [
                  Padding(
                    padding: const EdgeInsets.only(right: TamgaSpacing.xs),
                    child: SyncIndicator(size: 11),
                  ),
                  IconButton(
                    onPressed: () => context.push('/profile'),
                    tooltip: 'Профайл',
                    icon: const Icon(Icons.person_outline),
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: overviewAsync.when(
                  loading: () => const _CareSummarySkeleton(),
                  error: (error, _) => _InlineError(
                    onRetry: () => ref.invalidate(careOverviewProvider),
                  ),
                  data: (overview) => _CareSummary(overview: overview),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    TamgaSpacing.lg,
                    TamgaSpacing.xxl,
                    TamgaSpacing.lg,
                    TamgaSpacing.md,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Арчилгааны жагсаалт',
                          style: TamgaTypography.headline(
                            fontSize: 15,
                            color: colors.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      TamgaChoicePill(
                        label: 'Анхаарах',
                        selected: !_showAll,
                        onTap: () => setState(() => _showAll = false),
                      ),
                      const SizedBox(width: TamgaSpacing.xs),
                      TamgaChoicePill(
                        label: 'Бүгд',
                        selected: _showAll,
                        onTap: () => setState(() => _showAll = true),
                      ),
                    ],
                  ),
                ),
              ),
              overviewAsync.when(
                loading: () => SliverToBoxAdapter(
                  child: SkeletonLoader(
                    items: 3,
                    itemBuilder: (_, _) => const SkeletonCard(height: 72),
                  ),
                ),
                error: (_, _) =>
                    const SliverToBoxAdapter(child: SizedBox.shrink()),
                data: (overview) {
                  final tasks = _showAll
                      ? overview.tasks
                      : overview.tasks
                            .where((task) => task.isOverdueAt(DateTime.now()))
                            .toList();
                  if (tasks.isEmpty) {
                    return SliverToBoxAdapter(
                      child: EmptyState(
                        compact: true,
                        icon: Icons.event_available_outlined,
                        title: overview.healthLogCount == 0
                            ? 'Арчилгааны бүртгэл эхлүүлээрэй'
                            : 'Ойрын хугацаанд хийх ажил алга',
                        description: overview.healthLogCount == 0
                            ? 'Морь сонгож вакцин, туулгалт эсвэл үзлэгээ бүртгэнэ.'
                            : 'Шинэ ажил нэмэгдэхэд энд харагдана.',
                        actionLabel: overview.healthLogCount == 0
                            ? 'Морьд руу очих'
                            : null,
                        onAction: overview.healthLogCount == 0
                            ? () => context.go('/horses')
                            : null,
                      ),
                    );
                  }
                  return SliverList(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final task = tasks[index];
                      final horses =
                          horsesAsync.valueOrNull ?? const <HorseRecord>[];
                      return _CareTaskTile(
                        task: task,
                        onTap: () => _openTask(task, horses),
                      );
                    }, childCount: tasks.length),
                  );
                },
              ),
              SliverToBoxAdapter(
                child: overviewAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, _) => const SizedBox.shrink(),
                  data: (overview) => _UpcomingEvents(
                    events: overview.upcomingEvents,
                    onOpenAll: () => context.push('/events'),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    TamgaSpacing.lg,
                    TamgaSpacing.xxl,
                    TamgaSpacing.lg,
                    TamgaSpacing.xxxl,
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => context.go('/horses'),
                      icon: const Icon(Icons.add_task_outlined),
                      label: const Text('Морь сонгоод бүртгэх'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openTask(CareTask task, List<HorseRecord> horses) {
    if (task.kind == CareTaskKind.event) {
      context.push('/events');
      return;
    }
    final horse = horses.cast<HorseRecord?>().firstWhere(
      (item) => item?.id == task.horseId,
      orElse: () => null,
    );
    if (horse == null) {
      context.go('/horses');
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => HorseDetailScreen(horse: horse)));
  }
}

class _CareSummary extends StatelessWidget {
  const _CareSummary({required this.overview});

  final CareOverview overview;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: TamgaCard(
        color: colors.surfaceContainerLow,
        border: Border.all(color: colors.outlineVariant),
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        child: Row(
          children: [
            Expanded(
              child: _SummaryMetric(
                value: '${overview.overdueCount}',
                label: 'Хугацаа хэтэрсэн',
                color: overview.overdueCount == 0
                    ? colors.tertiary
                    : colors.error,
              ),
            ),
            Container(width: 1, height: 40, color: colors.outlineVariant),
            Expanded(
              child: _SummaryMetric(
                value: '${overview.dueSoonCount}',
                label: 'Ойртож байна',
                color: colors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric({
    required this.value,
    required this.label,
    required this.color,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Column(
      children: [
        Text(
          value,
          style: TamgaTypography.title3(weight: FontWeight.w700, color: color),
        ),
        const SizedBox(height: TamgaSpacing.xs),
        Text(
          label,
          style: TamgaTypography.footnote(
            weight: FontWeight.w500,
            color: colors.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _CareTaskTile extends StatelessWidget {
  const _CareTaskTile({required this.task, required this.onTap});

  final CareTask task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isOverdue = task.isOverdueAt(DateTime.now());
    final accent = isOverdue ? colors.error : colors.primary;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: TamgaSpacing.lg,
        vertical: 2,
      ),
      child: TamgaIconCard(
        icon: _iconFor(task.kind),
        iconColor: accent,
        title: task.title,
        subtitle:
            '${task.horseName ?? task.subtitle} · ${_formatDate(task.dueAt)}',
        onTap: onTap,
      ),
    );
  }

  IconData _iconFor(CareTaskKind kind) => switch (kind) {
    CareTaskKind.vaccination => Icons.vaccines_outlined,
    CareTaskKind.deworming => Icons.medication_outlined,
    CareTaskKind.breeding => Icons.pets_outlined,
    CareTaskKind.event => Icons.event_outlined,
  };
}

class _UpcomingEvents extends StatelessWidget {
  const _UpcomingEvents({required this.events, required this.onOpenAll});

  final List<dynamic> events;
  final VoidCallback onOpenAll;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) return const SizedBox.shrink();
    final colors = TamgaColors.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Ойрын арга хэмжээ',
                  style: TamgaTypography.headline(
                    fontSize: 15,
                    color: colors.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TextButton(
                onPressed: onOpenAll,
                child: const Text('Бүгдийг харах'),
              ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.sm),
          ...events
              .take(3)
              .map(
                (event) => TamgaListItem(
                  icon: Icons.emoji_events_outlined,
                  iconColor: colors.primary,
                  title: event.title,
                  subtitle:
                      '${_formatDate(event.date!)}${event.location == null ? '' : ' · ${event.location}'}',
                  showChevron: true,
                  onTap: onOpenAll,
                ),
              ),
        ],
      ),
    );
  }
}

class _CareSummarySkeleton extends StatelessWidget {
  const _CareSummarySkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(TamgaSpacing.lg),
      child: SkeletonCard(height: 92),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(TamgaSpacing.lg),
      child: OutlinedButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
        label: const Text('Арчилгааг дахин ачаалах'),
      ),
    );
  }
}

String _formatDate(DateTime date) =>
    '${date.year}.${date.month.toString().padLeft(2, '0')}.${date.day.toString().padLeft(2, '0')}';
