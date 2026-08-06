import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/lost_horse_providers.dart';
import '../domain/map_enums.dart';
import 'report_lost_horse_screen.dart';
import 'widgets/lost_horse_card.dart';

/// Lists the current user's lost-horse reports (any status) with a hint about
/// the pending-sync state of unpublished drafts.
class MyLostReportsScreen extends ConsumerWidget {
  const MyLostReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = TamgaColors.of(context);
    final reportsAsync = ref.watch(myLostReportsProvider);
    final pendingAsync = ref.watch(pendingRecoverySyncProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Миний зарууд', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: reportsAsync.when(
        data: (reports) {
          if (reports.isEmpty) {
            return Center(
              child: EmptyState(
                icon: Icons.saved_search_outlined,
                title: 'Зар байхгүй байна',
                description:
                    'Алга болсон морио бүртгүүлсний дараа энд харагдана.',
                actionLabel: 'Зар нэмэх',
                onAction: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ReportLostHorseScreen(),
                  ),
                ),
              ),
            );
          }
          final pending = pendingAsync.valueOrNull ?? const <String>{};
          final drafts = reports
              .where((report) => pending.contains(report.id))
              .toList();
          final activeCount = reports
              .where((r) => r.status == LostHorseStatus.active)
              .length;

          return ListView(
            padding: const EdgeInsets.fromLTRB(
              TamgaSpacing.lg,
              TamgaSpacing.md,
              TamgaSpacing.lg,
              TamgaSpacing.lg,
            ),
            children: [
              // ── Status summary ─────────────────────────────────
              Row(
                children: [
                  TamgaBadge(
                    label: '$activeCount идэвхтэй',
                    variant: TamgaBadgeVariant.destructive,
                    icon: Icons.radar,
                  ),
                  const SizedBox(width: TamgaSpacing.sm),
                  TamgaBadge(
                    label: '${reports.length} нийт',
                    variant: TamgaBadgeVariant.neutral,
                  ),
                ],
              ),
              const SizedBox(height: TamgaSpacing.md),

              if (drafts.isNotEmpty) ...[
                TamgaCard(
                  showTopAccent: true,
                  accentColor: colors.primary,
                  child: Row(
                    children: [
                      Icon(
                        Icons.cloud_upload_outlined,
                        size: 20,
                        color: colors.primary,
                      ),
                      const SizedBox(width: TamgaSpacing.md),
                      Expanded(
                        child: Text(
                          '${drafts.length} зар сүлжээнд гараагүй байна. '
                          'Сүлжээ орсон үед автоматаар нийтлэгдэнэ.',
                          style: TamgaTypography.footnote(
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: TamgaSpacing.lg),
              ],
              ...reports.map(
                (report) => Padding(
                  padding: const EdgeInsets.only(bottom: TamgaSpacing.md),
                  child: LostHorseCard(report: report),
                ),
              ),
            ],
          );
        },
        loading: () => SkeletonLoader(
          items: 4,
          itemBuilder: (ctx, i) => const SkeletonCardTile(),
        ),
        error: (error, _) => Center(
          child: TamgaErrorWidget(
            message: 'Зарууд ачаалахад алдаа гарлаа',
            onRetry: () => ref.invalidate(myLostReportsProvider),
          ),
        ),
      ),
    );
  }
}
