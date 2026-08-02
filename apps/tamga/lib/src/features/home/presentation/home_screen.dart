import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../../care/application/care_providers.dart';
import '../../care/domain/care_task.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../horses/presentation/add_horse_screen.dart';
import '../../horses/presentation/horse_detail_screen.dart';
import '../../../shared/domain/event.dart';
import '../../shared/presentation/sync_indicator.dart';

/// Daily command center: the first screen users see after onboarding.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(horsesProvider);
    ref.invalidate(careOverviewProvider);
    await Future.wait([
      ref.read(horsesProvider.future),
      ref.read(careOverviewProvider.future),
    ]);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = TamgaColors.of(context);
    final horsesAsync = ref.watch(horsesProvider);
    final overviewAsync = ref.watch(careOverviewProvider);
    final displayName = ref.watch(authStateProvider).valueOrNull?.displayName;

    return Scaffold(
      backgroundColor: colors.surface,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => _refresh(ref),
          color: colors.primary,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _HomeHeader(
                  displayName: displayName,
                  onSearch: () => context.push('/search'),
                  onProfile: () => context.push('/profile'),
                ),
              ),
              SliverToBoxAdapter(
                child: overviewAsync.when(
                  loading: () => const _AttentionSkeleton(),
                  error: (error, _) => _HomeError(
                    message: 'Өнөөдрийн мэдээлэл ачаалж чадсангүй.',
                    onRetry: () => ref.invalidate(careOverviewProvider),
                  ),
                  data: (overview) => _AttentionSummary(overview: overview),
                ),
              ),
              SliverToBoxAdapter(
                child: horsesAsync.when(
                  loading: () => const _HerdSkeleton(),
                  error: (error, _) => _HomeError(
                    message: 'Морьдын мэдээлэл ачаалж чадсангүй.',
                    onRetry: () => ref.invalidate(horsesProvider),
                  ),
                  data: (horses) => _HerdHealthStrip(
                    horses: horses,
                    overview: overviewAsync.valueOrNull,
                    onOpenRegistry: () => context.go('/horses'),
                    onAddHorse: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AddHorseScreen()),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: overviewAsync.when(
                  loading: () => const _TaskSkeleton(),
                  error: (_, _) => _SectionError(
                    onRetry: () => ref.invalidate(careOverviewProvider),
                  ),
                  data: (overview) => _AttentionTasks(
                    overview: overview,
                    horses: horsesAsync.valueOrNull ?? const <HorseRecord>[],
                    onOpenTask: (task) =>
                        _openTask(context, task, horsesAsync.valueOrNull),
                    onOpenCare: () => context.go('/care'),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: overviewAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, _) => _SectionError(
                    onRetry: () => ref.invalidate(careOverviewProvider),
                  ),
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
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => context.push('/lost-horse/report'),
                        icon: const Icon(Icons.search_off_outlined),
                        label: const Text('Алдсан морь мэдээлэх'),
                      ),
                      const SizedBox(height: TamgaSpacing.sm),
                      TextButton.icon(
                        onPressed: () => context.push('/lost-horse'),
                        icon: const Icon(Icons.map_outlined),
                        label: const Text('Алдсан морийг хайх'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openTask(
    BuildContext context,
    CareTask task,
    List<HorseRecord>? horses,
  ) {
    if (task.kind == CareTaskKind.event) {
      context.push('/events');
      return;
    }
    final horse = horses
        ?.where((item) => item.id == task.horseId)
        .cast<HorseRecord?>()
        .firstOrNull;
    if (horse == null) {
      context.go('/horses');
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => HorseDetailScreen(horse: horse)));
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({
    required this.displayName,
    required this.onSearch,
    required this.onProfile,
  });

  final String? displayName;
  final VoidCallback onSearch;
  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final firstName = displayName?.trim().split(' ').first;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.md,
        TamgaSpacing.sm,
        0,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  firstName == null || firstName.isEmpty
                      ? 'Өнөөдөр'
                      : 'Сайн байна уу, $firstName',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: TamgaSpacing.xs),
                Text(
                  'Мориныхоо өнөөдрийн байдлыг шалгаарай.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: TamgaSpacing.xs),
            child: SyncIndicator(size: 14),
          ),
          IconButton(
            onPressed: onSearch,
            tooltip: 'Хайх',
            icon: const Icon(Icons.search),
          ),
          IconButton(
            onPressed: onProfile,
            tooltip: 'Профайл',
            icon: TamgaAvatar(
              name: displayName ?? 'Tamga',
              size: 30,
              placeholder: Icons.person_outline,
            ),
          ),
        ],
      ),
    );
  }
}

class _AttentionSummary extends StatelessWidget {
  const _AttentionSummary({required this.overview});

  final CareOverview overview;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final attentionTasks = overview.tasks
        .where((task) => task.kind != CareTaskKind.event)
        .toList();
    final hasAttention = attentionTasks.isNotEmpty;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: hasAttention
              ? colors.primaryContainer.withValues(alpha: 0.55)
              : colors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
          border: Border.all(
            color: hasAttention
                ? colors.primary.withValues(alpha: 0.35)
                : colors.outlineVariant,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(TamgaSpacing.lg),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: hasAttention
                      ? colors.primary.withValues(alpha: 0.14)
                      : colors.tertiary.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  hasAttention
                      ? Icons.priority_high_rounded
                      : Icons.check_rounded,
                  color: hasAttention ? colors.primary : colors.tertiary,
                ),
              ),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      hasAttention
                          ? '${attentionTasks.length} ажил анхаарна'
                          : 'Өнөөдөр тайван байна',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: TamgaSpacing.xs),
                    Text(
                      hasAttention
                          ? 'Хугацаа хэтэрсэн эсвэл ойртсон бүртгэлүүд байна.'
                          : 'Ойрын арчилгааны бүртгэлээс хийх ажил алга.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HerdHealthStrip extends StatelessWidget {
  const _HerdHealthStrip({
    required this.horses,
    required this.overview,
    required this.onOpenRegistry,
    required this.onAddHorse,
  });

  final List<HorseRecord> horses;
  final CareOverview? overview;
  final VoidCallback onOpenRegistry;
  final VoidCallback onAddHorse;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        0,
        0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(right: TamgaSpacing.lg),
            child: Row(
              children: [
                Text(
                  'Морьдын байдал',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                TextButton(
                  onPressed: onOpenRegistry,
                  child: const Text('Бүгдийг харах'),
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          if (horses.isEmpty)
            Padding(
              padding: const EdgeInsets.only(right: TamgaSpacing.lg),
              child: EmptyState(
                compact: true,
                icon: Icons.pets_outlined,
                title: 'Анхны морио бүртгүүлээрэй',
                description:
                    'Морь нэмэхэд бүртгэл, эрүүл мэндийн мэдээлэл нэг дор хадгалагдана.',
                actionLabel: 'Морь нэмэх',
                onAction: onAddHorse,
              ),
            )
          else
            SizedBox(
              height: 104,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(right: TamgaSpacing.lg),
                itemCount: horses.length.clamp(0, 8),
                separatorBuilder: (_, _) =>
                    const SizedBox(width: TamgaSpacing.md),
                itemBuilder: (context, index) {
                  final horse = horses[index];
                  final hasAttention =
                      overview?.attentionHorseIds.contains(horse.id) ?? false;
                  final isMonitored =
                      overview?.monitoredHorseIds.contains(horse.id) ?? false;
                  final ringColor = hasAttention
                      ? colors.error
                      : isMonitored
                      ? colors.tertiary
                      : colors.outlineVariant;
                  return Semantics(
                    button: true,
                    label:
                        '${horse.name}, ${hasAttention ? 'анхаарах' : 'бүртгэлтэй'}',
                    child: InkWell(
                      onTap: onOpenRegistry,
                      borderRadius: BorderRadius.circular(44),
                      child: SizedBox(
                        width: 88,
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: ringColor, width: 2),
                              ),
                              child: TamgaAvatar(
                                name: horse.name,
                                imageUrl: horse.photoUrls.firstOrNull,
                                size: 48,
                                placeholder: Icons.pets_outlined,
                              ),
                            ),
                            const SizedBox(height: TamgaSpacing.xs),
                            Text(
                              horse.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.labelSmall,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _AttentionTasks extends StatelessWidget {
  const _AttentionTasks({
    required this.overview,
    required this.horses,
    required this.onOpenTask,
    required this.onOpenCare,
  });

  final CareOverview overview;
  final List<HorseRecord> horses;
  final ValueChanged<CareTask> onOpenTask;
  final VoidCallback onOpenCare;

  @override
  Widget build(BuildContext context) {
    final tasks = overview.tasks.take(3).toList();
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
              Text(
                'Анхаарах зүйлс',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const Spacer(),
              if (overview.tasks.length > 3)
                TextButton(
                  onPressed: onOpenCare,
                  child: const Text('Бүгдийг харах'),
                ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.sm),
          if (tasks.isEmpty)
            EmptyState(
              compact: true,
              icon: Icons.notifications_none_outlined,
              title: 'Сануулга алга',
              description: horses.isEmpty
                  ? 'Морь нэмэхэд таны өдөр тутмын арчилгаа энд харагдана.'
                  : 'Шинэ сануулга үүсэхэд энд харагдана.',
            )
          else
            ...tasks.map(
              (task) => _HomeTaskRow(task: task, onTap: () => onOpenTask(task)),
            ),
        ],
      ),
    );
  }
}

class _HomeTaskRow extends StatelessWidget {
  const _HomeTaskRow({required this.task, required this.onTap});

  final CareTask task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final overdue = task.isOverdueAt(DateTime.now());
    final color = overdue ? colors.error : colors.primary;
    return Semantics(
      button: true,
      label: '${task.title}, ${task.horseName ?? task.subtitle}',
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: TamgaSpacing.md),
          child: Row(
            children: [
              Icon(_iconFor(task.kind), color: color, size: 22),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: TamgaSpacing.xs),
                    Text(
                      '${task.horseName ?? task.subtitle} · ${_formatDate(task.dueAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: colors.onSurfaceVariant),
            ],
          ),
        ),
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

  final List<Event> events;
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
              Text(
                'Ойрын арга хэмжээ',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const Spacer(),
              TextButton(
                onPressed: onOpenAll,
                child: const Text('Бүгдийг харах'),
              ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.sm),
          ...events
              .take(2)
              .map(
                (event) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(
                    Icons.emoji_events_outlined,
                    color: colors.primary,
                  ),
                  title: Text(event.title),
                  subtitle: Text(
                    '${_formatDate(event.date!)}${event.location == null ? '' : ' · ${event.location}'}',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: onOpenAll,
                ),
              ),
        ],
      ),
    );
  }
}

class _AttentionSkeleton extends StatelessWidget {
  const _AttentionSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: SkeletonCard(height: 92),
    );
  }
}

class _HerdSkeleton extends StatelessWidget {
  const _HerdSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: SkeletonListTile(),
    );
  }
}

class _TaskSkeleton extends StatelessWidget {
  const _TaskSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: SkeletonLoader(
        items: 2,
        itemBuilder: (_, _) => const SkeletonCard(height: 72),
      ),
    );
  }
}

class _HomeError extends StatelessWidget {
  const _HomeError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.xxl,
        TamgaSpacing.lg,
        0,
      ),
      child: TamgaErrorWidget(message: message, onRetry: onRetry),
    );
  }
}

/// Compact inline error row for a home section (tasks, events).
///
/// Used instead of silently collapsing the section on error, so the user
/// knows the data failed to load and can retry.
class _SectionError extends StatelessWidget {
  const _SectionError({required this.onRetry});

  final VoidCallback onRetry;

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
      child: Row(
        children: [
          Icon(Icons.error_outline, color: colors.error, size: 20),
          const SizedBox(width: TamgaSpacing.sm),
          Expanded(
            child: Text(
              'Хэсгийг ачаалахад алдаа гарлаа.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Дахин оролдох')),
        ],
      ),
    );
  }
}

String _formatDate(DateTime date) =>
    '${date.year}.${date.month.toString().padLeft(2, '0')}.${date.day.toString().padLeft(2, '0')}';
