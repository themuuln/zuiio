import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/health_log.dart';
import '../data/local_health_repository.dart';
import 'add_health_log_screen.dart';
import 'widgets/health_log_card.dart';

/// Full-screen list of all health logs for a specific horse.
///
/// FAB navigates to [AddHealthLogScreen].
class HealthLogsScreen extends ConsumerWidget {
  const HealthLogsScreen({required this.horseId, super.key});

  final String horseId;

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final medicalAsync = ref.watch(medicalLogsProvider(horseId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Эрүүл мэндийн бүртгэл'),
        leading: IconButton(
          onPressed: () => Navigator.of(ctx).pop(),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: medicalAsync.when(
        data: (logs) {
          if (logs.isEmpty) {
            return const EmptyState(
              icon: Icons.health_and_safety_outlined,
              title: 'Эрүүл мэндийн бүртгэл байхгүй',
              description: 'Доорх "+" товчоор шинэ бүртгэл нэмэх боломжтой.',
            );
          }

          // Sort by date descending.
          final sorted = List<HealthLog>.of(logs)
            ..sort(
              (a, b) => (b.date ?? DateTime(2000)).compareTo(
                a.date ?? DateTime(2000),
              ),
            );

          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.xxxxl,
            ),
            itemCount: sorted.length,
            itemBuilder: (ctx, i) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: HealthLogCard(log: sorted[i]),
              );
            },
          );
        },
        loading: () => SkeletonLoader(
          items: 5,
          itemBuilder: (ctx, i) => const SkeletonListTile(),
        ),
        error: (err, _) => TamgaErrorWidget(
          message: 'Эрүүл мэндийн бүртгэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(medicalLogsProvider(horseId)),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.of(ctx).push<Object>(
            MaterialPageRoute(
              builder: (_) => AddHealthLogScreen(horseId: horseId),
            ),
          );
          if (result != null && ctx.mounted) {
            TamgaToast.show(ctx, 'Бүртгэл нэмэгдлээ');
          }
        },
        tooltip: 'Шинэ бүртгэл',
        child: const Icon(Icons.add),
      ),
    );
  }
}
