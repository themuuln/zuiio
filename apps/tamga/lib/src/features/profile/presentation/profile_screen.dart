import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/app_config.dart';
import '../../../core/features/feature_flags.dart';
import '../../../core/features/feature_flags_providers.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../horses/presentation/horse_card.dart';
import '../../lineage/application/lineage_roots_provider.dart';
import '../../onboarding/application/onboarding_providers.dart';
import '../../session/application/session_mode_provider.dart';
import '../../events/application/events_providers.dart';
import '../../shared/application/sync_providers.dart';
import '../../shared/presentation/sync_indicator.dart';
import '../application/profile_providers.dart';
import '../../market/application/message_providers.dart';
import '../../teams/application/team_providers.dart';

/// Facebook-style профайл хуудас.
///
/// Дээр: Cover photo + profile picture + нэр + статистик.
/// Доор: TabBar (Морьд | Удам | Тохиргоо)
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final authAsync = ref.watch(authStateProvider);
    final horsesAsync = ref.watch(horsesProvider);
    final eventsAsync = ref.watch(eventsProvider);

    // Get cached data if available (use valueOrNull to gracefully handle loading/error)
    final authState = authAsync.valueOrNull;
    final horses = horsesAsync.valueOrNull ?? [];
    final events = eventsAsync.valueOrNull ?? [];
    final hasHorsesError = horsesAsync.hasError;
    final hasEventsError = eventsAsync.hasError;

    // ── Error listeners: surface errors to user instead of silent swallowing ──
    ref.listen<AsyncValue>(authStateProvider, (prev, next) {
      final err = next.error;
      if (err != null) {
        debugPrint('[ProfileScreen] authStateProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Хэрэглэгчийн мэдээлэл ачаалахад алдаа гарлаа',
          );
        }
      }
    });
    ref.listen<AsyncValue<List<HorseRecord>>>(horsesProvider, (prev, next) {
      final err = next.error;
      if (err != null) {
        debugPrint('[ProfileScreen] horsesProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Морьдын мэдээлэл ачаалахад алдаа гарлаа / Failed to load horses',
          );
        }
      }
    });
    ref.listen<AsyncValue>(eventsProvider, (prev, next) {
      final err = next.error;
      if (err != null) {
        debugPrint('[ProfileScreen] eventsProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Уралдааны мэдээлэл ачаалахад алдаа гарлаа / Failed to load events',
          );
        }
      }
    });
    ref.listen<AsyncValue>(lineageRootsProvider, (prev, next) {
      final err = next.error;
      if (err != null) {
        debugPrint('[ProfileScreen] lineageRootsProvider error: $err');
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Удмын мэдээлэл ачаалахад алдаа гарлаа / Failed to load lineage',
          );
        }
      }
    });

    // ── Header content ──
    // Show skeleton during initial loading (no cached auth data available)
    final Widget headerContent;
    if (authAsync.isLoading && authState == null) {
      headerContent = _buildSkeletonHeader(theme, colorScheme);
    } else {
      final displayName =
          authState?.displayName ?? authState?.email ?? 'Хэрэглэгч';
      final initials = displayName.isNotEmpty
          ? displayName.substring(0, 1).toUpperCase()
          : '?';

      headerContent = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Cover photo area ──
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  colorScheme.primaryContainer,
                  colorScheme.tertiaryContainer,
                ],
              ),
            ),
            child: Stack(
              children: [
                // Decorative pattern
                Positioned.fill(
                  child: CustomPaint(
                    painter: _CoverPatternPainter(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                    ),
                  ),
                ),
                // Sync indicator (top-left)
                Positioned(
                  top: MediaQuery.of(context).padding.top + AppSpacing.sm,
                  left: AppSpacing.lg,
                  child: const SyncIndicator(),
                ),
                // Settings button
                Positioned(
                  top: MediaQuery.of(context).padding.top + AppSpacing.sm,
                  right: AppSpacing.lg,
                  child: IconButton(
                    onPressed: () => _showSettings(context),
                    icon: Icon(
                      Icons.settings_outlined,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Profile picture + name ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile picture (overlapping cover)
                Transform.translate(
                  offset: const Offset(0, -AppSpacing.xxxxl),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: colorScheme.primary,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: colorScheme.surface,
                            width: AppSpacing.xs,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            initials,
                            style: theme.textTheme.headlineLarge?.copyWith(
                              color: colorScheme.onPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(bottom: AppSpacing.sm),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                displayName,
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (authState?.hasEmail == true)
                                Text(
                                  authState!.email!,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Stats chips ──
                Transform.translate(
                  offset: const Offset(0, -AppSpacing.lg),
                  child: Row(
                    children: [
                      _StatChip(
                        icon: Icons.pets,
                        label: 'Морьд',
                        value: hasHorsesError ? '—' : '${horses.length}',
                        hasError: hasHorsesError,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      _StatChip(
                        icon: Icons.emoji_events_outlined,
                        label: 'Уралдаан',
                        value: hasEventsError ? '—' : '${events.length}',
                        hasError: hasEventsError,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      _StatChip(
                        icon: Icons.family_restroom,
                        label: 'Удам',
                        value: hasHorsesError
                            ? '—'
                            : '${horses.where((h) => h.lineageRootId != null).length}',
                        hasError: hasHorsesError,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Error cards — horses/events errors ──
          if (authAsync.hasError)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              child: _InlineErrorCard(
                message:
                    'Хэрэглэгчийн мэдээлэл ачаалахад алдаа гарлаа / Failed to load profile',
                onRetry: () => ref.invalidate(authStateProvider),
              ),
            ),
          if (hasHorsesError)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              child: _InlineErrorCard(
                message:
                    'Морьдын мэдээлэл ачаалахад алдаа гарлаа / Failed to load horses',
                onRetry: () => ref.invalidate(horsesProvider),
              ),
            ),
          if (hasEventsError)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.sm,
              ),
              child: _InlineErrorCard(
                message:
                    'Уралдааны мэдээлэл ачаалахад алдаа гарлаа / Failed to load events',
                onRetry: () => ref.invalidate(eventsProvider),
              ),
            ),

          // ── Sync status ──
          const _SyncStatusSection(),

          // Divider
          const Divider(height: 1),
        ],
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) => [
              SliverToBoxAdapter(child: headerContent),

              // ── TabBar ──
              SliverPersistentHeader(
                pinned: true,
                delegate: _TabBarDelegate(
                  TabBar(
                    controller: _tabController,
                    onTap: (_) => HapticFeedback.selectionClick(),
                    tabs: const [
                      Tab(text: 'Морьд'),
                      Tab(text: 'Удам'),
                      Tab(text: 'Тохиргоо'),
                    ],
                  ),
                ),
              ),
            ],
            body: AnimatedBuilder(
              animation: _tabController,
              builder: (_, _) {
                // Respect the OS reduced-motion preference.
                final switchDuration = MediaQuery.disableAnimationsOf(context)
                    ? Duration.zero
                    : const Duration(milliseconds: 200);
                return AnimatedSwitcher(
                  duration: switchDuration,
                  transitionBuilder: (child, anim) =>
                      FadeTransition(opacity: anim, child: child),
                  child: KeyedSubtree(
                    key: ValueKey(_tabController.index),
                    child: switch (_tabController.index) {
                      0 => _HorsesTab(horsesAsync: horsesAsync),
                      1 => const _LineageTab(),
                      _ => const _SettingsTab(),
                    },
                  ),
                );
              },
            ),
          ),

          // ── Pinned leading close control (never scrolls away) ──
          Positioned(
            top: 0,
            left: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                child: IconButton(
                  tooltip: 'Буцах',
                  onPressed: () => Navigator.maybePop(context),
                  icon: const Icon(Icons.arrow_back),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Skeleton header shown during initial loading.
  ///
  /// Displays shimmer placeholders for the profile picture, name/email,
  /// and stat chips while providers are still loading.
  Widget _buildSkeletonHeader(ThemeData theme, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Leading close control ──
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
            child: Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                tooltip: 'Буцах',
                onPressed: () => Navigator.maybePop(context),
                icon: const Icon(Icons.arrow_back),
              ),
            ),
          ),
        ),
        // ── Cover photo area (same gradient as data state) ──
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                colorScheme.primaryContainer,
                colorScheme.tertiaryContainer,
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned.fill(
                child: CustomPaint(
                  painter: _CoverPatternPainter(
                    color: colorScheme.primary.withValues(alpha: 0.1),
                  ),
                ),
              ),
              Positioned(
                top: MediaQuery.of(context).padding.top + AppSpacing.sm,
                right: AppSpacing.lg,
                child: IconButton(
                  onPressed: () => _showSettings(context),
                  icon: Icon(
                    Icons.settings_outlined,
                    color: colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Skeleton profile info ──
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: ShimmerEffect(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile picture skeleton (overlapping cover)
                Transform.translate(
                  offset: const Offset(0, -AppSpacing.xxxxl),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Skeleton avatar circle
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainerHighest,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: colorScheme.surface,
                            width: AppSpacing.xs,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(bottom: AppSpacing.sm),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Name skeleton
                              Container(
                                height: 20,
                                width: 140,
                                decoration: BoxDecoration(
                                  color: colorScheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              // Email skeleton
                              Container(
                                height: 14,
                                width: 200,
                                decoration: BoxDecoration(
                                  color: colorScheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Skeleton stat chips
                Transform.translate(
                  offset: const Offset(0, -AppSpacing.lg),
                  child: Row(
                    children: [
                      _SkeletonStatChip(colorScheme: colorScheme),
                      const SizedBox(width: AppSpacing.sm),
                      _SkeletonStatChip(colorScheme: colorScheme),
                      const SizedBox(width: AppSpacing.sm),
                      _SkeletonStatChip(colorScheme: colorScheme),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        const Divider(height: 1),
      ],
    );
  }

  void _showSettings(BuildContext context) {
    _tabController.animateTo(2); // Switch to settings tab
  }
}

/// Морьд tab — хэрэглэгчийн морьдын жагсаалт.
class _HorsesTab extends StatelessWidget {
  const _HorsesTab({required this.horsesAsync});
  final AsyncValue<List<HorseRecord>> horsesAsync;

  @override
  Widget build(BuildContext context) {
    return horsesAsync.when(
      data: (horses) {
        if (horses.isEmpty) {
          return Center(
            // Scroll-safe so the state never overflows in short viewports.
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.pets_outlined,
                    size: 64,
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Морьд байхгүй байна',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Эхлэхийн тулд морь нэмнэ үү',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return ListView.builder(
          // Bottom safe area keeps the last card + its edit button fully
          // visible above the bottom navigation bar / home indicator.
          padding: EdgeInsets.only(
            top: AppSpacing.sm,
            bottom: MediaQuery.of(context).padding.bottom + AppSpacing.xxl,
          ),
          itemCount: horses.length,
          itemBuilder: (context, index) => Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.xs,
            ),
            child: HorseCard(horse: horses[index]),
          ),
        );
      },
      loading: () => SkeletonLoader(
        items: 3,
        itemBuilder: (ctx, i) => const SkeletonListTile(),
      ),
      error: (err, _) => Center(
        // Scroll-safe so the state never overflows in short viewports.
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Морьдын мэдээлэл ачаалахад алдаа гарлаа',
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Failed to load horses',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Удам tab — удмын шугам харах холбоос.
class _LineageTab extends ConsumerWidget {
  const _LineageTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rootsAsync = ref.watch(lineageRootsProvider);
    final roots = rootsAsync.valueOrNull ?? [];
    final rootsError = rootsAsync.hasError;
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Error state: lineage failed to load ──
        if (rootsError)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.lg),
            child: _InlineErrorCard(
              message:
                  'Удмын мэдээлэл ачаалахад алдаа гарлаа / Failed to load lineage',
              onRetry: () => ref.invalidate(lineageRootsProvider),
            ),
          ),

        // Удмын шугам харах холбоос
        Card(
          child: InkWell(
            onTap: () => context.go('/lineage'),
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
                    child: Icon(
                      Icons.account_tree,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Удмын шугам',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'Модон хэлбэрээр харах',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: theme.colorScheme.outline),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Удмын язгуур жагсаалт (only shown when no error)
        if (!rootsError && roots.isNotEmpty) ...[
          Text(
            'Удмын язгуур',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          ...roots.map(
            (root) => Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: theme.colorScheme.secondaryContainer,
                  child: Icon(
                    Icons.account_tree_outlined,
                    color: theme.colorScheme.onSecondaryContainer,
                    size: 20,
                  ),
                ),
                title: Text(root.name),
                subtitle: Text(
                  '${root.offspringCount} үр удам',
                  style: theme.textTheme.bodySmall,
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/lineage'),
              ),
            ),
          ),
        ] else if (!rootsError) ...[
          Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                children: [
                  Icon(
                    Icons.account_tree_outlined,
                    size: 48,
                    color: theme.colorScheme.outlineVariant,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Удмын язгуур байхгүй',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Тохиргоо tab.
class _SettingsTab extends ConsumerWidget {
  const _SettingsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final settings = ref.watch(profileSettingsProvider);
    final sessionMode = ref.watch(sessionModeProvider);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // Session info
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Мэдээлэл', style: theme.textTheme.titleMedium),
                const SizedBox(height: AppSpacing.sm),
                _InfoRow(label: 'Session', value: sessionMode.name),
                _InfoRow(
                  label: 'Sync',
                  value: AppConfig.isSupabaseConfigured
                      ? 'Supabase-ready'
                      : 'Local-only',
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Inbox
        Consumer(
          builder: (context, ref, _) {
            final unreadCountAsync = ref.watch(inboxUnreadCountProvider);
            final unreadCount = unreadCountAsync.valueOrNull ?? 0;

            return Card(
              child: ListTile(
                leading: Badge(
                  isLabelVisible: unreadCount > 0,
                  label: Text('$unreadCount'),
                  child: const Icon(Icons.chat_bubble_outline),
                ),
                title: const Text('Ирсэн'),
                subtitle: const Text('Зурвасууд / Messages'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/profile/inbox'),
              ),
            );
          },
        ),

        const SizedBox(height: AppSpacing.md),

        // Notification settings
        Card(
          child: ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Мэдэгдлийн тохиргоо'),
            subtitle: const Text('Мэдэгдлүүдийг идэвхжүүлэх/унтраах'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/notifications'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Sync Queue
        Card(
          child: ListTile(
            leading: const Icon(Icons.sync_outlined),
            title: const Text('Синк дараалал'),
            subtitle: const Text('Хүлээгдэж буй/амжилтгүй синк-ууд'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/sync-queue'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Sync Settings
        Card(
          child: ListTile(
            leading: const Icon(Icons.tune_outlined),
            title: const Text('Синк тохиргоо'),
            subtitle: const Text(
              'Авто синк, синк хийх, локал өгөгдөл цэвэрлэх',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/sync-settings'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Partner Dashboard ──
        Card(
          child: ListTile(
            leading: const Icon(Icons.dashboard_outlined),
            title: const Text('Түншийн самбар'),
            subtitle: const Text('Арга хэмжээ удирдах / Partner Dashboard'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/partner-dashboard'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Stable Profile & Team Management (multi-user gated) ──
        ..._buildMultiUserCards(context, ref),

        // ── Analytics Dashboard ──
        Card(
          child: ListTile(
            leading: const Icon(Icons.analytics_outlined),
            title: const Text('Аналитик'),
            subtitle: const Text('Сүрэг, эрүүл мэнд, санхүүгийн үзүүлэлтүүд'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/analytics'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Seller Verification ──
        Card(
          child: ListTile(
            leading: const Icon(Icons.verified_user_outlined),
            title: const Text('Худалдагчийн баталгаажуулалт'),
            subtitle: const Text('Утас, E-Mongolia ID баталгаажуулах'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/verification'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Saved Searches ──
        Card(
          child: ListTile(
            leading: const Icon(Icons.bookmark_outline),
            title: const Text('Хадгалсан хайлтууд'),
            subtitle: const Text('Шүүлтүүр хадгалах, удирдах'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/profile/saved-searches'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Үржүүлэгчийн чансаа ──
        Card(
          child: ListTile(
            leading: const Icon(Icons.leaderboard_outlined),
            title: const Text('Үржүүлэгчийн чансаа'),
            subtitle: const Text('Үржүүлэгчдийг үзүүлэлтээр эрэмбэлэх'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/market/leaderboard'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Moderation Queue (admin only, feature flagged) ──
        ref.watch(featureFlagProvider(FeatureFlag.moderationQueue))
            ? Card(
                child: ListTile(
                  leading: const Icon(Icons.shield_outlined),
                  title: const Text('Зарын модераци'),
                  subtitle: const Text(
                    'Мэдээлэгдсэн заруудыг харах, батлах/татгалзах',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/profile/moderation'),
                ),
              )
            : const SizedBox.shrink(),

        const SizedBox(height: AppSpacing.md),

        // Auto sync toggle
        settings.when(
          data: (settings) => Card(
            child: SwitchListTile(
              title: const Text('Auto sync'),
              subtitle: const Text('Supabase тохируулсан үед auto sync'),
              value: settings.autoSyncEnabled,
              onChanged: (newVal) async {
                HapticFeedback.lightImpact();
                final repo = await ref.read(
                  profileSettingsRepositoryProvider.future,
                );
                await repo.saveSettings(
                  settings.copyWith(autoSyncEnabled: newVal),
                );
                ref.invalidate(profileSettingsProvider);
              },
            ),
          ),
          loading: () => const Card(
            child: ListTile(
              leading: LoadingIndicator(size: 20),
              title: Text('Ачаалж байна...'),
            ),
          ),
          error: (err, _) => Card(
            child: ListTile(
              leading: const Icon(Icons.error_outline),
              title: const Text('Тохиргоо ачаалахад алдаа гарлаа'),
              trailing: TextButton.icon(
                onPressed: () => ref.invalidate(profileSettingsProvider),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Дахин оролдох'),
              ),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Race videos
        Card(
          child: ListTile(
            leading: const Icon(Icons.videocam_outlined),
            title: const Text('Уралдааны бичлэгүүд'),
            subtitle: const Text('Наадмын бичлэг үзэх, зарах'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/race-videos'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Restart onboarding
        Card(
          child: ListTile(
            leading: Icon(
              Icons.replay_outlined,
              color: theme.colorScheme.error,
            ),
            title: Text(
              'Onboarding дахин эхлүүлэх',
              style: TextStyle(color: theme.colorScheme.error),
            ),
            subtitle: const Text(
              'Тохиргоо, үүрэг, адууны мэдээллийг дахин оруулах',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Onboarding дахин эхлүүлэх?'),
                  content: const Text(
                    'Энэ нь одоогийн тохиргоог дахин тохируулах болно. '
                    'Хадгалагдсан өгөгдөл устахгүй.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Цуцлах'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Эхлүүлэх'),
                    ),
                  ],
                ),
              );
              if (confirmed == true && context.mounted) {
                GoRouter.of(context).go('/lineage');
                ref.invalidate(onboardingProvider);
              }
            },
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // ── Sign Out ──
        Card(
          child: ListTile(
            leading: Icon(Icons.logout, color: theme.colorScheme.error),
            title: Text(
              'Гарах',
              style: TextStyle(color: theme.colorScheme.error),
            ),
            subtitle: const Text('Sign Out'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showSignOutDialog(context, ref),
          ),
        ),
      ],
    );
  }

  /// Multi-user gated cards for Stable Profile and Team Management.
  List<Widget> _buildMultiUserCards(BuildContext context, WidgetRef ref) {
    final limits = ref.watch(tierLimitsProvider);
    final hasMultiUsers =
        limits.maxMultiUsers != null && limits.maxMultiUsers! > 1;

    if (!hasMultiUsers) {
      return [const SizedBox.shrink()];
    }

    return [
      Card(
        child: ListTile(
          leading: const Icon(Icons.home_outlined),
          title: const Text('Жүчээний профайл'),
          subtitle: const Text('Жүчээ мэдээлэл, гишүүд, морьдын тоо'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/profile/stable'),
        ),
      ),
      const SizedBox(height: AppSpacing.md),
      Card(
        child: ListTile(
          leading: const Icon(Icons.group_outlined),
          title: const Text('Багийн удирдлага'),
          subtitle: const Text('Гишүүд урих, дүр өөрчлөх, хасах'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/profile/team'),
        ),
      ),
      const SizedBox(height: AppSpacing.md),

      // ── Pending Invitations ──
      Card(
        child: ListTile(
          leading: const Icon(Icons.mail_outline),
          title: const Text('Урилгууд'),
          subtitle: const Text('Хүлээгдэж буй багийн урилгууд'),
          trailing: _PendingInvitationsBadge(),
          onTap: () => context.push('/profile/invitations'),
        ),
      ),
      const SizedBox(height: AppSpacing.md),
    ];
  }

  Future<void> _showSignOutDialog(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Гарах'),
        content: const Text('Та системээс гарахдаа итгэлтэй байна уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Болих'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Гарах'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await ref.read(authStateProvider.notifier).signOut();
        if (context.mounted) {
          context.go('/login');
        }
      } catch (e) {
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Гарахад алдаа гарлаа / Sign out failed',
          );
        }
      }
    }
  }
}

/// Skeleton stat chip shown during loading.
class _SkeletonStatChip extends StatelessWidget {
  const _SkeletonStatChip({required this.colorScheme});
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      height: 32,
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
    );
  }
}

/// Статистикийн чип.
class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.icon,
    required this.label,
    required this.value,
    this.hasError = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool hasError;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: hasError
            ? theme.colorScheme.errorContainer
            : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: hasError
                ? theme.colorScheme.onErrorContainer
                : theme.colorScheme.primary,
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(
            value,
            style: theme.textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w700,
              color: hasError ? theme.colorScheme.onErrorContainer : null,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: hasError
                  ? theme.colorScheme.onErrorContainer.withValues(alpha: 0.8)
                  : theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Мэдээллийн мөр.
class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

/// TabBar-ын delegate (pinned).
class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  const _TabBarDelegate(this.tabBar);
  final TabBar tabBar;

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate oldDelegate) => false;
}

/// Cover photo дээрх чимэглэлтэй зураглагч.
class _CoverPatternPainter extends CustomPainter {
  _CoverPatternPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    // Эллипс хэлбэрүүд
    for (var i = 0; i < 5; i++) {
      final center = Offset(size.width * (0.2 + i * 0.15), size.height * 0.5);
      final rect = Rect.fromCenter(
        center: center,
        width: 120 + i * 20.0,
        height: 80 + i * 10.0,
      );
      canvas.drawOval(rect, paint);
    }
  }

  @override
  bool shouldRepaint(_CoverPatternPainter oldDelegate) => false;
}

/// Алдааны мэдэгдэл — Inline error card (profile/map screens).
///
/// Бүтэн дэлгэцийн алдаанаас ялгаатай нь энэ нь тухайн хэсэгт багтаамжтай
/// хэлбэрээр алдааг харуулна, дэлгэцийг бүхэлд нь дардаггүй.
class _InlineErrorCard extends StatelessWidget {
  const _InlineErrorCard({required this.message, this.onRetry});

  /// Алдааны мессеж (Монгол + Англи хослуулсан).
  final String message;

  /// Retry товч дархад дуудагдах callback. [null] бол retry товч нуугдана.
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: theme.colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 32,
              color: theme.colorScheme.onErrorContainer,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onErrorContainer,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.md),
              FilledButton.tonalIcon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Дахин оролдох'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Синк төлөвийн мэдээлэл.
///
/// ProfileScreen-ийн header хэсэгт хэрэглэгчид синк төлөвийг харах,
/// гар ажиллагаатай синк эхлүүлэх боломж олгоно.
/// - Сүүлд синк хийсэн цаг (харьцангуй)
/// - Хүлээгдэж буй синк item-үүдийн тоо
/// - Зөрчилдөөний тоо
/// - "Синк хийх" товч
class _SyncStatusSection extends ConsumerWidget {
  const _SyncStatusSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncStateProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (syncState.lastSyncTime == null &&
        syncState.pendingCount == 0 &&
        syncState.conflictCount == 0) {
      // Only show the sync button when there's nothing to display
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        child: SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => ref.read(syncStateProvider.notifier).triggerSync(),
            icon: syncState.isSyncing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: LoadingIndicator(size: 16),
                  )
                : const Icon(Icons.sync, size: 18),
            label: Text(
              syncState.isSyncing ? 'Синк хийгдэж байна...' : 'Синк хийх',
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          border: Border.all(color: colorScheme.outlineVariant),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Last sync time
              if (syncState.lastSyncTime != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    children: [
                      Icon(
                        Icons.sync,
                        size: 14,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Expanded(
                        child: Text(
                          'Сүүлд синк хийсэн: ${_formatLastSyncTime(syncState.lastSyncTime!)}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Pending count
              if (syncState.pendingCount > 0)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    children: [
                      Icon(
                        Icons.hourglass_empty,
                        size: 14,
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        '${syncState.pendingCount} синк хүлээгдэж байна',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.warning,
                        ),
                      ),
                    ],
                  ),
                ),

              // Conflict count
              if (syncState.conflictCount > 0)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        size: 14,
                        color: colorScheme.error,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        '${syncState.conflictCount} зөрчилдөөн байна',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.error,
                        ),
                      ),
                    ],
                  ),
                ),

              // Sync button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () =>
                      ref.read(syncStateProvider.notifier).triggerSync(),
                  icon: syncState.isSyncing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: LoadingIndicator(size: 16),
                        )
                      : const Icon(Icons.sync, size: 18),
                  label: Text(
                    syncState.isSyncing ? 'Синк хийгдэж байна...' : 'Синк хийх',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Сүүлд синк хийсэн цагийг харьцангуйгаар харуулах.
  static String _formatLastSyncTime(DateTime lastSyncTime) {
    final diff = DateTime.now().difference(lastSyncTime);
    if (diff.inMinutes < 1) return 'саяхан';
    if (diff.inHours < 1) return '${diff.inMinutes} минутын өмнө';
    if (diff.inDays < 1) return '${diff.inHours} цагийн өмнө';
    if (diff.inDays < 30) return '${diff.inDays} хоногийн өмнө';
    return '${diff.inDays ~/ 30} сарын өмнө';
  }
}

/// Хүлээгдэж буй урилгуудын тоог харуулах badge.
class _PendingInvitationsBadge extends ConsumerWidget {
  const _PendingInvitationsBadge();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(pendingInvitationsCountProvider);

    if (count == 0) {
      return const Icon(Icons.chevron_right);
    }

    return Badge(label: Text('$count'), child: const Icon(Icons.chevron_right));
  }
}
