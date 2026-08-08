import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/map_providers.dart';
import '../data/herd_tracking_service.dart';
import '../domain/herd_tracking_status.dart';
import '../domain/pasture_zone.dart';

/// Мал сүргийн GPS мөрдөх дэлгэц — бүх морьдын байршлыг харуулна.
class HerdTrackingScreen extends ConsumerStatefulWidget {
  const HerdTrackingScreen({super.key});

  @override
  ConsumerState<HerdTrackingScreen> createState() => _HerdTrackingScreenState();
}

class _HerdTrackingScreenState extends ConsumerState<HerdTrackingScreen> {
  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final statusAsync = ref.watch(herdTrackingStatusProvider);
    final zonesAsync = ref.watch(pastureZonesProvider);
    final alerts = ref.watch(zoneAlertsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Мал Сүрэг', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (statusAsync.hasValue) _TrackingToggle(status: statusAsync.value!),
        ],
      ),
      body: Column(
        children: [
          // Анхааруулгууд
          if (alerts.isNotEmpty) _AlertBanner(alerts: alerts),

          // Мөрдөх төлөвийн мэдээлэл
          statusAsync.when(
            data: (status) => _StatusCard(status: status),
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),

          // Газрын зурагтай морьдын жагсаалт
          Expanded(child: _HorseList(zonesAsync: zonesAsync)),
        ],
      ),
    );
  }
}

/// Мөрдөх / зогсоох товч.
class _TrackingToggle extends StatelessWidget {
  const _TrackingToggle({required this.status});

  final HerdTrackingStatus status;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return IconButton(
      icon: Icon(
        status.isTracking ? Icons.stop_circle : Icons.play_circle,
        color: status.isTracking ? colors.destructive : colors.primary,
      ),
      onPressed: () {
        final service = ProviderScope.containerOf(
          context,
        ).read(herdTrackingServiceProvider);
        if (status.isTracking) {
          service.stopHerdTracking();
        } else {
          service.startHerdTracking(status.trackedHorseIds);
        }
      },
    );
  }
}

/// Анхааруулгын зүүдэг цонх.
class _AlertBanner extends StatelessWidget {
  const _AlertBanner({required this.alerts});

  final List<ZoneAlert> alerts;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Container(
      width: double.infinity,
      padding: TamgaSpacing.cardPadding,
      color: colors.error,
      child: Row(
        children: [
          Icon(Icons.warning_amber, color: colors.onError),
          const SizedBox(width: TamgaSpacing.sm),
          Expanded(
            child: Text(
              '${alerts.length} анхааруулга',
              style: TextStyle(color: colors.onError),
            ),
          ),
        ],
      ),
    );
  }
}

/// Мөрдөх төлөвийн нэгж — горим, батарей, queue.
class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.status});

  final HerdTrackingStatus status;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: TamgaSpacing.horizontalInset,
      child: Padding(
        padding: TamgaSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Мөрдөх төлөв', style: TamgaTypography.headline()),
            const SizedBox(height: TamgaSpacing.sm),
            Row(
              children: [
                _StatusChip(
                  label: status.mode.label,
                  isActive: status.isTracking,
                ),
                const SizedBox(width: TamgaSpacing.sm),
                _StatusChip(
                  label: 'Батарей ${status.batteryLevel}%',
                  isActive: status.batteryLevel > 20,
                ),
                if (status.queuedLocations > 0) ...[
                  const SizedBox(width: TamgaSpacing.sm),
                  _StatusChip(
                    label: 'Queue: ${status.queuedLocations}',
                    isActive: false,
                  ),
                ],
              ],
            ),
            const SizedBox(height: TamgaSpacing.sm),
            Text(
              '${status.trackedHorseCount} морь мөрдөж байна',
              style: TamgaTypography.footnote(),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.isActive});

  final String label;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: TamgaSpacing.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: isActive ? colors.primaryContainer : colors.surfaceContainer,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: isActive ? colors.onPrimaryContainer : colors.onSurface,
        ),
      ),
    );
  }
}

/// Морьдын жагсаалт — бэлчээрээр хуваарилсан.
class _HorseList extends StatelessWidget {
  const _HorseList({required this.zonesAsync});

  final AsyncValue<List<PastureZone>> zonesAsync;

  @override
  Widget build(BuildContext context) {
    return zonesAsync.when(
      data: (zones) {
        if (zones.isEmpty) {
          return Center(
            child: EmptyState(
              icon: Icons.pets,
              title: 'Бэлчээр байхгүй',
              description: 'Эхлэхийн тулд бэлчээр үүсгэнэ үү',
            ),
          );
        }

        return ListView.builder(
          padding: TamgaSpacing.horizontalInset,
          itemCount: zones.length,
          itemBuilder: (context, index) {
            final zone = zones[index];
            return _ZoneCard(zone: zone);
          },
        );
      },
      loading: () => SkeletonLoader(
        items: 3,
        itemBuilder: (ctx, i) => const SkeletonListTile(),
      ),
      error: (e, _) => Center(
        child: TamgaErrorWidget(message: 'Бэлчээр ачаалахад алдаа гарлаа'),
      ),
    );
  }
}

/// Нэг бэлчээрийн нэгж.
class _ZoneCard extends StatelessWidget {
  const _ZoneCard({required this.zone});

  final PastureZone zone;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: zone.isOverdue
              ? colors.error
              : colors.primaryContainer,
          child: Icon(
            Icons.park,
            color: zone.isOverdue ? colors.onError : colors.onPrimaryContainer,
          ),
        ),
        title: Text(zone.name),
        subtitle: Text(
          zone.isOverdue
              ? 'Хугацаа дууссан!'
              : '${zone.remainingDays} өдөр үлдсэн',
          style: TextStyle(
            color: zone.isOverdue
                ? colors.destructive
                : colors.onSurfaceVariant,
          ),
        ),
        trailing: Text(
          '${zone.assignedHorseIds.length} морь',
          style: TamgaTypography.footnote(),
        ),
      ),
    );
  }
}
