import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/map_providers.dart';
import '../domain/pasture_zone.dart';

/// Бэлчээрийн удирдлагын дэлгэц — бүсийг үүсгэх, засварлах, морь хамааруулах.
class PastureManagementScreen extends ConsumerStatefulWidget {
  const PastureManagementScreen({super.key});

  @override
  ConsumerState<PastureManagementScreen> createState() =>
      _PastureManagementScreenState();
}

class _PastureManagementScreenState
    extends ConsumerState<PastureManagementScreen> {
  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final zonesAsync = ref.watch(pastureZonesProvider);
    final alerts = ref.watch(zoneAlertsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Бэлчээрийн Удирдлага', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateZoneDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Бэлчээр нэмэх'),
      ),
      body: zonesAsync.when(
        data: (zones) {
          if (zones.isEmpty) {
            return Center(
              child: EmptyState(
                icon: Icons.park_outlined,
                title: 'Бэлчээр байхгүй',
                description: 'Эхний бэлчээрээ үүсгэнэ үү',
              ),
            );
          }

          return CustomScrollView(
            slivers: [
              // Анхааруулгууд
              if (alerts.isNotEmpty)
                SliverToBoxAdapter(child: _AlertSection(alerts: alerts)),

              // Бэлчээрийн жагсаалт
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _ZoneTile(
                    zone: zones[index],
                    onEdit: () => _showEditZoneDialog(context, zones[index]),
                    onDelete: () => _confirmDelete(context, zones[index]),
                  ),
                  childCount: zones.length,
                ),
              ),
            ],
          );
        },
        loading: () => SkeletonLoader(
          items: 3,
          itemBuilder: (ctx, i) => const SkeletonListTile(),
        ),
        error: (e, _) => Center(
          child: TamgaErrorWidget(
            message: 'Бэлчээр ачаалахад алдаа гарлаа',
            onRetry: () => ref.invalidate(pastureZonesProvider),
          ),
        ),
      ),
    );
  }

  void _showCreateZoneDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _ZoneFormSheet(
        onSave: (zone) async {
          final repo = ref.read(mapRepositoryProvider);
          await repo.savePastureZone(zone);
          ref.invalidate(pastureZonesProvider);
        },
      ),
    );
  }

  void _showEditZoneDialog(BuildContext context, PastureZone zone) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _ZoneFormSheet(
        zone: zone,
        onSave: (updated) async {
          final repo = ref.read(mapRepositoryProvider);
          await repo.savePastureZone(updated);
          ref.invalidate(pastureZonesProvider);
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context, PastureZone zone) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Бэлчээр устгах'),
        content: Text('"${zone.name}" устгах уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Цуцлах'),
          ),
          TextButton(
            onPressed: () async {
              final repo = ref.read(mapRepositoryProvider);
              await repo.deletePastureZone(zone.id);
              ref.invalidate(pastureZonesProvider);
              if (ctx.mounted) Navigator.of(ctx).pop();
            },
            child: const Text('Устгах'),
          ),
        ],
      ),
    );
  }
}

/// Анхааруулгын хэсэг.
class _AlertSection extends StatelessWidget {
  const _AlertSection({required this.alerts});

  final List<ZoneAlert> alerts;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return TamgaCard(
      margin: TamgaSpacing.horizontalInset,
      color: scheme.errorContainer,
      padding: TamgaSpacing.cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber, color: scheme.onErrorContainer),
              const SizedBox(width: TamgaSpacing.sm),
              Text(
                'Анхааруулгууд (${alerts.length})',
                style: TamgaTypography.subheadline(
                  color: scheme.onErrorContainer,
                  weight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.sm),
          ...alerts.map(
            (alert) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  Icon(
                    Icons.circle,
                    size: 6,
                    color: scheme.onErrorContainer.withValues(alpha: 0.6),
                  ),
                  const SizedBox(width: TamgaSpacing.sm),
                  Expanded(
                    child: Text(
                      '${alert.zoneName}: '
                      '${alert.alertType == ZoneAlertType.overdue ? "Хугацаа дууссан" : "${alert.remainingDays} өдөр үлдсэн"}',
                      style: TamgaTypography.footnote(
                        color: scheme.onErrorContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Нэг бэлчээрийн нэгж.
class _ZoneTile extends StatelessWidget {
  const _ZoneTile({
    required this.zone,
    required this.onEdit,
    required this.onDelete,
  });

  final PastureZone zone;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final accent = zone.isOverdue ? colors.error : colors.primary;

    // Usage ratio: how much of the occupancy window has passed.
    final totalDays = zone.maxOccupancyDuration.inDays;
    final usedRatio = totalDays > 0
        ? ((totalDays - zone.remainingDays) / totalDays).clamp(0.0, 1.0)
        : 0.0;

    return TamgaCard(
      margin: TamgaSpacing.horizontalInset,
      showTopAccent: zone.isOverdue,
      accentColor: colors.error,
      padding: TamgaSpacing.listCellPadding,
      child: Row(
        children: [
          // Icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
            child: Icon(Icons.park_outlined, color: accent, size: 22),
          ),
          const SizedBox(width: TamgaSpacing.md),

          // Info + occupancy progress
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        zone.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TamgaTypography.body(weight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(width: TamgaSpacing.sm),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: TamgaSpacing.sm,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: zone.isOverdue
                            ? colors.error.withValues(alpha: 0.12)
                            : colors.primaryContainer,
                        borderRadius: BorderRadius.circular(
                          TamgaSpacing.cornerRadiusSmall,
                        ),
                      ),
                      child: Text(
                        zone.isOverdue
                            ? 'Хугацаа дууссан!'
                            : '${zone.remainingDays} өдөр үлдсэн',
                        style: TamgaTypography.caption1(
                          color: zone.isOverdue
                              ? colors.destructive
                              : colors.onPrimaryContainer,
                          weight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: TamgaSpacing.sm),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: usedRatio,
                    minHeight: 4,
                    backgroundColor: colors.surfaceContainer,
                    color: accent,
                  ),
                ),
                const SizedBox(height: TamgaSpacing.xs),
                Row(
                  children: [
                    Icon(
                      Icons.pets_outlined,
                      size: 14,
                      color: colors.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${zone.assignedHorseIds.length} морь',
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: TamgaSpacing.md),
                    Icon(
                      Icons.radar_outlined,
                      size: 14,
                      color: colors.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${zone.radiusKm.toStringAsFixed(0)} км',
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          PopupMenuButton<String>(
            tooltip: 'Нэмэлт үйлдэл',
            onSelected: (value) {
              if (value == 'edit') onEdit();
              if (value == 'delete') onDelete();
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'edit', child: Text('Засварлах')),
              const PopupMenuItem(value: 'delete', child: Text('Устгах')),
            ],
          ),
        ],
      ),
    );
  }
}

/// Бэлчээр үүсгэх / засварлах форм.
class _ZoneFormSheet extends StatefulWidget {
  const _ZoneFormSheet({this.zone, required this.onSave});

  final PastureZone? zone;
  final Future<void> Function(PastureZone zone) onSave;

  @override
  State<_ZoneFormSheet> createState() => _ZoneFormSheetState();
}

class _ZoneFormSheetState extends State<_ZoneFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _radiusController;
  late final TextEditingController _occupancyController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.zone?.name ?? '');
    _radiusController = TextEditingController(
      text: widget.zone?.radiusKm.toString() ?? '5',
    );
    _occupancyController = TextEditingController(
      text: widget.zone?.maxOccupancyDuration.inDays.toString() ?? '14',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _radiusController.dispose();
    _occupancyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: TamgaSpacing.lg,
        right: TamgaSpacing.lg,
        top: TamgaSpacing.lg,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.zone == null ? 'Бэлчээр үүсгэх' : 'Бэлчээр засварлах',
              style: TamgaTypography.headline(),
            ),
            const SizedBox(height: TamgaSpacing.lg),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Нэр',
                hintText: 'Жишээ: Баруун бэлчээр',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Нэр оруулна уу' : null,
            ),
            const SizedBox(height: TamgaSpacing.md),
            TextFormField(
              controller: _radiusController,
              decoration: InputDecoration(
                labelText: 'Радиус (км)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
              ),
              keyboardType: TextInputType.number,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Радиус оруулна уу';
                final n = double.tryParse(v);
                if (n == null || n <= 0) return 'Эерэг тоо оруулна уу';
                return null;
              },
            ),
            const SizedBox(height: TamgaSpacing.md),
            TextFormField(
              controller: _occupancyController,
              decoration: InputDecoration(
                labelText: 'Хугацаа (өдөр)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
              ),
              keyboardType: TextInputType.number,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Хугацаа оруулна уу';
                final n = int.tryParse(v);
                if (n == null || n <= 0) return 'Эерэг тоо оруулна уу';
                return null;
              },
            ),
            const SizedBox(height: TamgaSpacing.lg),
            FilledButton(
              onPressed: _submit,
              child: Text(widget.zone == null ? 'Үүсгэх' : 'Хадгалах'),
            ),
            const SizedBox(height: TamgaSpacing.md),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final zone = PastureZone(
      id: widget.zone?.id ?? '',
      name: _nameController.text,
      ownerId: widget.zone?.ownerId ?? '',
      centerLat: widget.zone?.centerLat ?? 47.9,
      centerLng: widget.zone?.centerLng ?? 106.9,
      radiusKm: double.parse(_radiusController.text),
      assignedHorseIds: widget.zone?.assignedHorseIds ?? [],
      lastRotationDate: widget.zone?.lastRotationDate,
      maxOccupancyDuration: Duration(
        days: int.parse(_occupancyController.text),
      ),
      isActive: widget.zone?.isActive ?? true,
    );

    await widget.onSave(zone);
    if (mounted) Navigator.of(context).pop();
  }
}
