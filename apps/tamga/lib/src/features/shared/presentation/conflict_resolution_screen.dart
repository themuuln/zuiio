import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/sync_conflict.dart';
import '../../profile/application/cloud_sync_coordinator.dart';
import '../application/sync_providers.dart';

/// Синк зөрчилдөөнийг шийдвэрлэх дэлгэц.
///
/// Sync хийх үед local болон remote хувилбар зөрчилдвөл энэ дэлгэцээр
/// хэрэглэгч аль хувилбарыг хадгалахаа шийднэ.
///
/// Онцлогууд:
/// - Local болон remote хувилбаруудыг зэрэгцүүлэн харуулах
/// - Талбарын түвшинд ялгаатай утгуудыг тодруулах
/// - "Keep local" / "Keep remote" товчнууд
/// - Зөрчилдөөн шийдвэрлэгдсэний дараа conflictCount буурна
class ConflictResolutionScreen extends ConsumerWidget {
  const ConflictResolutionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coordinatorAsync = ref.watch(cloudSyncCoordinatorProvider);

    return coordinatorAsync.when(
      data: (coordinator) {
        final conflicts = coordinator.pendingConflicts;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Зөрчилдөөн шийдвэрлэх'),
            actions: [
              if (conflicts.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${conflicts.length}',
                        style: const TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          body: conflicts.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 64,
                        color: Colors.green,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Зөрчилдөөн байхгүй',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Бүх өгөгдөл синк хийгдсэн',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  itemCount: conflicts.length,
                  itemBuilder: (context, index) {
                    return _ConflictCard(
                      conflict: conflicts[index],
                      coordinator: coordinator,
                    );
                  },
                ),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => Scaffold(
        body: Center(child: Text('Алдаа: $err')),
      ),
    );
  }
}

/// Нэг зөрчилдөөний кард — local/remote хувилбаруудыг харуулна.
class _ConflictCard extends StatefulWidget {
  const _ConflictCard({
    required this.conflict,
    required this.coordinator,
  });

  final SyncConflict conflict;
  final CloudSyncCoordinator coordinator;

  @override
  State<_ConflictCard> createState() => _ConflictCardState();
}

class _ConflictCardState extends State<_ConflictCard> {
  late final List<(String, dynamic, dynamic)> _diffFields;

  @override
  void initState() {
    super.initState();
    _diffFields = widget.conflict.diffFields;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final conflict = widget.conflict;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header: Entity type + ID ──
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusSmall,
                    ),
                  ),
                  child: Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.red.shade400,
                    size: 22,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _entityTypeLabel(conflict.entityType),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ID: ${conflict.entityId}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.md),

            // ── Timestamps ──
            if (conflict.localUpdatedAt != null ||
                conflict.remoteUpdatedAt != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    if (conflict.localUpdatedAt != null)
                      Expanded(
                        child: _TimestampChip(
                          label: 'Local',
                          timestamp: conflict.localUpdatedAt!,
                        ),
                      ),
                    if (conflict.remoteUpdatedAt != null)
                      Expanded(
                        child: _TimestampChip(
                          label: 'Remote',
                          timestamp: conflict.remoteUpdatedAt!,
                        ),
                      ),
                  ],
                ),
              ),

            // ── Diff fields ──
            if (_diffFields.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                child: Text(
                  'Талбарууд ижил байна',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              )
            else ...[
              // Header row
              Padding(
                padding: const EdgeInsets.only(
                  bottom: AppSpacing.sm,
                  left: 4,
                  right: 4,
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 80),
                    const Expanded(
                      child: Text(
                        'Local',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                          color: Colors.blue,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Remote',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                          color: Colors.orange,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Field rows
              ...List.generate(_diffFields.length, (i) {
                final (fieldName, localVal, remoteVal) = _diffFields[i];
                return _DiffFieldRow(
                  fieldName: fieldName,
                  localValue: localVal,
                  remoteValue: remoteVal,
                  isLast: i == _diffFields.length - 1,
                );
              }),
            ],

            const SizedBox(height: AppSpacing.md),

            // ── Action buttons ──
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _keepLocal(context),
                    icon: const Icon(Icons.phone_android_outlined, size: 18),
                    label: const Text('Keep Local'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.blue,
                      side: const BorderSide(color: Colors.blue),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => _keepRemote(context),
                    icon: const Icon(Icons.cloud_outlined, size: 18),
                    label: const Text('Keep Remote'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.orange,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _keepLocal(BuildContext context) async {
    await widget.coordinator.resolveWithData(
      conflictKey: widget.conflict.conflictKey,
      resolvedData: widget.conflict.localData,
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Local хувилбар хадгалагдлаа'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _keepRemote(BuildContext context) async {
    await widget.coordinator.resolveWithData(
      conflictKey: widget.conflict.conflictKey,
      resolvedData: widget.conflict.remoteData,
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Remote хувилбар хадгалагдлаа'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _entityTypeLabel(String type) {
    return switch (type) {
      'horse' => 'Морь',
      'health' => 'Эрүүл мэнд',
      'event' => 'Уралдаан',
      'market' => 'Зар',
      'breeding' => 'Үржүүлэг',
      'co_ownership' => 'Хамтран эзэмших',
      'document' => 'Баримт',
      'certificate' => 'Гэрчилгээ',
      'payment' => 'Төлбөр',
      'lost_horse_report' => 'Морь төөрсөн',
      'search_area' => 'Хайлтын бүс',
      'horse_location' => 'Морьны байршил',
      'geofence_alert' => 'Гео хашаа',
      'lineage' => 'Удам',
      _ => type,
    };
  }
}

/// Цагийн тэмдэг харуулах чип.
class _TimestampChip extends StatelessWidget {
  const _TimestampChip({
    required this.label,
    required this.timestamp,
  });

  final String label;
  final DateTime timestamp;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '$label: ',
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              _formatTimestamp(timestamp),
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'саяхан';
    if (diff.inHours < 1) return '${diff.inMinutes} мин өмнө';
    if (diff.inDays < 1) return '${diff.inHours} цаг өмнө';
    return '${diff.inDays} өдөр өмнө';
  }
}

/// Ялгаатай талбарыг харуулах мөр.
class _DiffFieldRow extends StatelessWidget {
  const _DiffFieldRow({
    required this.fieldName,
    required this.localValue,
    required this.remoteValue,
    this.isLast = false,
  });

  final String fieldName;
  final dynamic localValue;
  final dynamic remoteValue;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isLast
                ? Colors.transparent
                : theme.dividerColor.withValues(alpha: 0.3),
          ),
        ),
      ),
      child: Row(
        children: [
          // Field name
          SizedBox(
            width: 80,
            child: Text(
              _formatFieldName(fieldName),
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 4),
          // Local value
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _formatValue(localValue),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.blue.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),
          // Remote value
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _formatValue(remoteValue),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.orange.shade800,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatValue(dynamic value) {
    if (value == null) return '—';
    if (value is bool) return value ? 'True' : 'False';
    if (value is DateTime) return value.toIso8601String().substring(0, 19);
    if (value is List) return '[${value.length} items]';
    if (value is Map) return '{${value.length} keys}';
    return value.toString();
  }

  String _formatFieldName(String name) {
    // Convert camelCase to readable: "updatedAt" → "Updated At"
    return name[0].toUpperCase() +
        name.substring(1).replaceAllMapped(
          RegExp(r'([a-z])([A-Z])'),
          (m) => '${m[1]} ${m[2]}',
        );
  }
}
