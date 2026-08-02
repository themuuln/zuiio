import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/widgets.dart';
import '../../../app/theme/app_spacing.dart';
import '../../map/presentation/active_reports_screen.dart';
import '../../map/presentation/map_screen.dart';
import '../../map/presentation/lost_horse_alert_preferences_screen.dart';
import '../../map/presentation/report_lost_horse_screen.dart';

/// Эрэл хайгуул — хаяж морь хайх, бүртгүүлэх хуудас.
///
/// Tier-based access:
/// - Үнэгүй: Зөвхөн хаяж морьдын жагсаалт + газар зүйл харах
/// - Premium: Морь бүртгүүлэх, идэвхтэй эрэмбэлэх, мэдэгдэл авах
class LostHorseFinderScreen extends ConsumerStatefulWidget {
  const LostHorseFinderScreen({super.key});

  @override
  ConsumerState<LostHorseFinderScreen> createState() =>
      _LostHorseFinderScreenState();
}

class _LostHorseFinderScreenState extends ConsumerState<LostHorseFinderScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

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
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          TamgaSliverHeader(
            title: 'Эрэл хайгуул',
            subtitle: 'Олж, мэдээлж, хамгаалъя',
            pinned: true,
            floating: true,
            actions: [
              IconButton(
                tooltip: 'Мэдэгдэл / Alerts',
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const LostHorseAlertPreferencesScreen(),
                  ),
                ),
                icon: const Icon(Icons.notifications_none_outlined),
              ),
              PopupMenuButton<String>(
                tooltip: 'Нэмэлт үйлдэл',
                onSelected: (value) {
                  if (value == 'premium') _showTierSheet(context);
                  if (value == 'active') _tabController.animateTo(0);
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(
                    value: 'active',
                    child: Text('Идэвхтэй тайлангууд'),
                  ),
                  PopupMenuItem(
                    value: 'premium',
                    child: Text('Premium боломжууд'),
                  ),
                ],
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              onTap: (_) => HapticFeedback.selectionClick(),
              tabs: const [
                Tab(text: 'Жагсаалт', icon: Icon(Icons.list_alt)),
                Tab(text: 'Газрын зураг', icon: Icon(Icons.map_outlined)),
              ],
            ),
          ),
          const SliverToBoxAdapter(child: _FinderLead()),
        ],
        body: TabBarView(
          controller: _tabController,
          children: const [_LostHorseListTab(), _LostHorseMapTab()],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const ReportLostHorseScreen()),
        ),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Theme.of(context).colorScheme.onPrimary,
        icon: const Icon(Icons.search_off, size: 20),
        label: const Text('Алга болсон морь бүртгэх'),
      ),
    );
  }

  void _showTierSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Зэрэглэл сонгох',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: AppSpacing.md),
            ListTile(
              leading: const Icon(Icons.free_cancellation),
              title: const Text('Үнэгүй'),
              subtitle: const Text('Хаяж морьдыг харах, газрын зураг нээх'),
              trailing: Icon(
                Icons.check_circle,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            ListTile(
              leading: Icon(
                Icons.workspace_premium,
                color: Theme.of(context).colorScheme.primary,
              ),
              title: const Text('Premium'),
              subtitle: const Text('Идэвхжүүлэлт, мэдэгдэл, хамгаалалт'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context);
                context.push('/payment');
              },
            ),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}

class _FinderLead extends StatelessWidget {
  const _FinderLead();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colors.primaryContainer.withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          border: Border.all(color: colors.primary.withValues(alpha: 0.24)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.visibility_outlined, color: colors.primary),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ойр орчмын мэдээллийг шалгаарай',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Жагсаалт, газрын зураг, сэрэмжлүүлгийг нэг дороос хянаарай.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onPrimaryContainer,
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

/// Хаяж морьдын жагсаалт харах tab.
class _LostHorseListTab extends ConsumerWidget {
  const _LostHorseListTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const ActiveReportsScreen(showAppBar: false);
  }
}

/// Хаяж морьдын газар зүйл харах tab.
class _LostHorseMapTab extends ConsumerWidget {
  const _LostHorseMapTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const MapScreen();
  }
}
