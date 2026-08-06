import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/geofence_providers.dart';
import '../domain/geofence_alert.dart';
import '../domain/map_enums.dart';

/// Geofence alert history screen.
class GeofenceAlertsScreen extends ConsumerWidget {
  const GeofenceAlertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = TamgaColors.of(context);
    final alertsAsync = ref.watch(geofenceAlertsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Анхааруулгууд', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: alertsAsync.when(
        data: (alerts) {
          if (alerts.isEmpty) {
            return Center(
              child: EmptyState(
                icon: Icons.notifications_none,
                title: 'Анхааруулга байхгүй',
                description: 'Геохязгаарын анхааруулга ирээгүй байна',
              ),
            );
          }

          final unread = alerts.where((a) => !a.acknowledged).length;

          return ListView(
            padding: const EdgeInsets.all(TamgaSpacing.lg),
            children: [
              // ── Summary header ─────────────────────────────────
              Row(
                children: [
                  Text('Түүх', style: TamgaTypography.title3()),
                  const Spacer(),
                  if (unread > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: TamgaSpacing.sm,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: colors.primaryContainer,
                        borderRadius: BorderRadius.circular(
                          TamgaSpacing.cornerRadiusPill,
                        ),
                      ),
                      child: Text(
                        '$unread шинэ',
                        style: TamgaTypography.footnote(
                          color: colors.onPrimaryContainer,
                          weight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: TamgaSpacing.md),
              ...alerts.map(
                (alert) => Padding(
                  padding: const EdgeInsets.only(bottom: TamgaSpacing.sm),
                  child: _AlertTile(alert: alert),
                ),
              ),
            ],
          );
        },
        loading: () => SkeletonLoader(
          items: 4,
          itemBuilder: (ctx, i) => const SkeletonListTile(),
        ),
        error: (e, _) => Center(
          child: TamgaErrorWidget(
            message: 'Анхааруулга ачаалахад алдаа гарлаа',
            onRetry: () => ref.invalidate(geofenceAlertsProvider),
          ),
        ),
      ),
    );
  }
}

class _AlertTile extends StatelessWidget {
  const _AlertTile({required this.alert});

  final GeofenceAlert alert;

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 60) return '${diff.inMinutes}м';
    if (diff.inHours < 24) return '${diff.inHours}ц';
    return '${diff.inDays}х';
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isEntered = alert.alertType == GeofenceAlertType.entered;
    final accent = isEntered ? colors.primary : colors.error;

    return TamgaCard(
      border: alert.acknowledged
          ? null
          : Border.all(color: accent.withValues(alpha: 0.4)),
      padding: TamgaSpacing.listCellPadding,
      child: Row(
        children: [
          // Icon — colored circle with direction glyph
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isEntered ? Icons.login : Icons.logout,
              size: 18,
              color: accent,
            ),
          ),
          const SizedBox(width: TamgaSpacing.md),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert.horseName,
                  style: TamgaTypography.body(weight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  '${alert.geofenceName} — ${isEntered ? 'орлоо' : 'гарлаа'}',
                  style: TamgaTypography.caption1(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          // Status badge + time
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: TamgaSpacing.sm,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: alert.acknowledged
                      ? colors.surfaceContainer
                      : accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
                child: Text(
                  alert.acknowledged ? 'Уншсан' : 'Шинэ',
                  style: TamgaTypography.caption1(
                    color: alert.acknowledged
                        ? colors.onSurfaceVariant
                        : accent,
                    weight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _timeAgo(alert.triggeredAt),
                style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
