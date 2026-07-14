import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../map/presentation/active_reports_screen.dart';
import '../../map/presentation/map_screen.dart';
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
    final theme = Theme.of(context);

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            title: const Text('Эрэл хайгуул'),
            pinned: true,
            floating: true,
            actions: [
              IconButton(
                tooltip: 'Premium нэмэх',
                onPressed: () => _showTierSheet(context),
                icon: const Icon(Icons.workspace_premium_outlined),
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
        backgroundColor: theme.colorScheme.error,
        foregroundColor: theme.colorScheme.onError,
        icon: const Icon(Icons.search_off, size: 20),
        label: const Text('Хаяж морь бүртгэх'),
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
              trailing: const Icon(Icons.check_circle, color: Colors.green),
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
