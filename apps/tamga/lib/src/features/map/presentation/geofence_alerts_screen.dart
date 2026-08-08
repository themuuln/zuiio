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

          return ListView.separated(
            padding: const EdgeInsets.all(TamgaSpacing.lg),
            itemCount: alerts.length,
            separatorBuilder: (_, _) => const SizedBox(height: TamgaSpacing.sm),
            itemBuilder: (context, index) {
              return _AlertTile(alert: alerts[index]);
            },
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

    return TamgaCard(
      border: alert.acknowledged
          ? null
          : Border.all(color: colors.primary.withValues(alpha: 0.3)),
      child: Row(
        children: [
          // Icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: (isEntered ? colors.primary : colors.error).withValues(
                alpha: 0.12,
              ),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isEntered ? Icons.login : Icons.logout,
              size: 18,
              color: isEntered ? colors.primary : colors.error,
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
                Text(
                  '${alert.geofenceName} — ${isEntered ? 'орлоо' : 'гарлаа'}',
                  style: TamgaTypography.caption1(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          // Time
          Text(
            _timeAgo(alert.triggeredAt),
            style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
