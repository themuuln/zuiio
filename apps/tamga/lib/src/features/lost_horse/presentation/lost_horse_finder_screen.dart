import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../map/application/lost_horse_providers.dart';
import '../../map/presentation/active_reports_screen.dart';
import '../../map/presentation/lost_horse_alert_preferences_screen.dart';
import '../../map/presentation/map_screen.dart';
import '../../map/presentation/my_lost_reports_screen.dart';
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
                  if (value == 'mine') _openMyReports(context);
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(
                    value: 'active',
                    child: Text('Идэвхтэй тайлангууд'),
                  ),
                  PopupMenuItem(value: 'mine', child: Text('Миний зарууд')),
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
          SliverToBoxAdapter(child: const _UrgencyHero()),
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
        backgroundColor: TamgaColors.of(context).error,
        foregroundColor: TamgaColors.of(context).onError,
        icon: const Icon(Icons.search_off, size: 20),
        label: const Text('Алга болсон морь бүртгэх'),
      ),
    );
  }

  void _openMyReports(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const MyLostReportsScreen()));
  }

  void _showTierSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Зэрэглэл сонгох',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: TamgaSpacing.md),
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
            const SizedBox(height: TamgaSpacing.md),
          ],
        ),
      ),
    );
  }
}

/// Urgent hero — live active-report count with a call to help.
class _UrgencyHero extends ConsumerWidget {
  const _UrgencyHero();

  @override
  Widget build(BuildContext context, WidgetRef widgetRef) {
    final colors = TamgaColors.of(context);
    final reportsAsync = widgetRef.watch(activeLostHorsesStreamProvider);
    final count = reportsAsync.valueOrNull?.length ?? 0;
    final isLoading = reportsAsync.isLoading;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.md,
        TamgaSpacing.lg,
        TamgaSpacing.sm,
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colors.error.withValues(alpha: 0.14),
              Theme.of(
                context,
              ).colorScheme.errorContainer.withValues(alpha: 0.35),
            ],
          ),
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
          border: Border.all(color: colors.error.withValues(alpha: 0.28)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(TamgaSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colors.error.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.radar_outlined, color: colors.error),
                  ),
                  const SizedBox(width: TamgaSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Идэвхтэй зар',
                          style: TamgaTypography.caption1(
                            color: colors.onSurfaceVariant,
                            weight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        AnimatedSwitcher(
                          duration: TamgaMotion.durationNormal,
                          child: isLoading
                              ? const SizedBox(
                                  width: 120,
                                  height: 24,
                                  child: LinearProgressIndicator(minHeight: 4),
                                )
                              : Text(
                                  '$count зар',
                                  key: ValueKey(count),
                                  style: TamgaTypography.headline(
                                    color: colors.error,
                                    weight: FontWeight.w800,
                                  ),
                                ),
                        ),
                        const SizedBox(height: TamgaSpacing.xs),
                        Text(
                          'Ойр орчмын хаяж малаа шалгаж, харсан зүйлээ мэдээлээрэй.',
                          style: TamgaTypography.footnote(
                            color: colors.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: TamgaSpacing.md),
              Wrap(
                spacing: TamgaSpacing.sm,
                runSpacing: TamgaSpacing.sm,
                children: [
                  _HeroAction(
                    icon: Icons.inbox_outlined,
                    label: 'Миний зарууд',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const MyLostReportsScreen(),
                      ),
                    ),
                  ),
                  _HeroAction(
                    icon: Icons.notifications_active_outlined,
                    label: 'Мэдэгдэл тохируулах',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const LostHorseAlertPreferencesScreen(),
                      ),
                    ),
                  ),
                  _HeroAction(
                    icon: Icons.support_agent_outlined,
                    label: '109 дуудах',
                    onTap: () => _call109(context),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _call109(BuildContext context) async {
    final uri = Uri.parse('tel:109');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      TamgaToast.showError(context, 'Утас нээхэд алдаа гарлаа');
    }
  }
}

class _HeroAction extends StatelessWidget {
  const _HeroAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Material(
      color: colors.surfaceContainerLowest.withValues(alpha: 0.8),
      shape: StadiumBorder(side: BorderSide(color: colors.outlineVariant)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: TamgaSpacing.md,
            vertical: TamgaSpacing.sm,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: colors.primary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TamgaTypography.caption1(
                  color: colors.onSurface,
                  weight: FontWeight.w600,
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
