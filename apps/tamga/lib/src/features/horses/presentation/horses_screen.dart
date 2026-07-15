import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/widgets.dart';
import '../../breeding/presentation/breeding_screen.dart';
import '../../search/application/search_providers.dart';
import '../../shared/presentation/sync_indicator.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import 'add_horse_screen.dart';
import 'csv_import_screen.dart';
import 'horses_registry_tab.dart';

class HorsesScreen extends ConsumerWidget {
  const HorsesScreen({super.key});

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (ctx, innerBoxIsScrolled) => [
            SliverAppBar(
              title: const Text('Морьд'),
              pinned: true,
              floating: true,
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: SyncIndicator(size: 12),
                ),
                PopupMenuButton<String>(
                  onSelected: (v) {
                    if (v == 'import') {
                      Navigator.of(ctx).push(
                        MaterialPageRoute(
                          builder: (_) => const CsvImportScreen(),
                        ),
                      );
                    }
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'import',
                      child: Text('Уяач апп-аас оруулах'),
                    ),
                  ],
                ),
                IconButton(
                  tooltip: 'Морь нэмэх',
                  onPressed: () => _addHorse(ctx, ref),
                  icon: const Icon(Icons.add),
                ),
              ],
              bottom: TabBar(
                onTap: (_) => HapticFeedback.selectionClick(),
                tabs: [
                  const Tab(text: 'Бүртгэл'),
                  const Tab(text: 'Хээлтүүлэг'),
                ],
              ),
            ),
          ],
          body: Builder(
            builder: (ctx) {
              final tabController = DefaultTabController.of(ctx);
              return AnimatedBuilder(
                animation: tabController,
                builder: (_, _) {
                  return AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    transitionBuilder: (child, anim) =>
                        FadeTransition(opacity: anim, child: child),
                    child: KeyedSubtree(
                      key: ValueKey(tabController.index),
                      child: tabController.index == 0
                          ? const HorsesRegistryTab()
                          : const BreedingScreen(),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Future<void> _addHorse(BuildContext ctx, WidgetRef ref) async {
    final result = await Navigator.of(ctx).push<HorseRecord>(
      MaterialPageRoute(builder: (_) => const AddHorseScreen()),
    );
    if (result != null) {
      final repo = await ref.read(horsesRepositoryProvider.future);
      final saveResult = await repo.saveHorse(result);
      saveResult.when(
        onSuccess: (_) {
          ref.invalidate(horsesProvider);
          ref.invalidate(searchCatalogProvider);
        },
        onFailure: (error) {
          if (ctx.mounted) {
            TamgaToast.showError(
              ctx,
              'Морь хадгалахад алдаа гарлаа: ${error.message}',
            );
          }
        },
      );
    }
  }
}
