/// Тэжээлийн хуваарийн дэлгэц.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/nutrition_providers.dart';
import '../domain/feed_schedule.dart';

// ═══════════════════════════════════════════════════════════════════════
// FeedScheduleScreen
// ═══════════════════════════════════════════════════════════════════════

/// Морины тэжээлийн хуваарийн жагсаалт.
class FeedScheduleScreen extends ConsumerWidget {
  const FeedScheduleScreen({required this.horseId, super.key});

  /// Морины ID.
  final String horseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schedulesAsync = ref.watch(feedSchedulesProvider(horseId));

    return Scaffold(
      body: schedulesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Тэжээлийн хуваарь авахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(feedSchedulesProvider(horseId)),
        ),
        data: (schedules) => _FeedScheduleList(
          horseId: horseId,
          schedules: schedules,
          onRefresh: () => ref.invalidate(feedSchedulesProvider(horseId)),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'add_feed_schedule',
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  FeedScheduleFormScreen(horseId: horseId),
            ),
          ).then((_) {
            ref.invalidate(feedSchedulesProvider(horseId));
          });
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

// ── FeedScheduleList ──────────────────────────────────────────────────

class _FeedScheduleList extends StatelessWidget {
  const _FeedScheduleList({
    required this.horseId,
    required this.schedules,
    required this.onRefresh,
  });

  final String horseId;
  final List<FeedSchedule> schedules;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    if (schedules.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: EmptyState(
            icon: Icons.schedule_outlined,
            title: 'Тэжээлийн хуваарь байхгүй',
            description: 'Шинэ хуваарь нэмэхийн тулд + товчийг дарна уу.',
            compact: true,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: schedules.length,
        itemBuilder: (context, index) {
          final schedule = schedules[index];
          return _FeedScheduleTile(
            schedule: schedule,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => FeedScheduleFormScreen(
                    horseId: horseId,
                    existingSchedule: schedule,
                  ),
                ),
              ).then((_) {
                onRefresh();
              });
            },
          );
        },
      ),
    );
  }
}

// ── FeedScheduleTile ──────────────────────────────────────────────────

class _FeedScheduleTile extends StatelessWidget {
  const _FeedScheduleTile({
    required this.schedule,
    required this.onTap,
  });

  final FeedSchedule schedule;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = TamgaColors.of(context);
    final isActive = schedule.endDate == null ||
        schedule.endDate!.isAfter(DateTime.now().subtract(const Duration(days: 1)));

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: 4),
      child: Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                // ── Type icon ──
                CircleAvatar(
                  backgroundColor: colors.primaryContainer,
                  radius: 20,
                  child: Icon(
                    _feedTypeIcon(schedule.feedType),
                    color: colors.onPrimaryContainer,
                    size: 20,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),

                // ── Details ──
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            schedule.feedType.displayName,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? colors.tertiary.withValues(alpha: 0.15)
                                  : colors.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(
                                AppSpacing.cornerRadiusSmall,
                              ),
                            ),
                            child: Text(
                              isActive ? 'Идэвхтэй' : 'Дууссан',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                color: isActive
                                    ? colors.tertiary
                                    : colors.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${schedule.quantityKg.toStringAsFixed(1)} кг · ${schedule.frequency}',
                        style: TextStyle(
                          color: colors.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_formatDate(schedule.startDate)}'
                        '${schedule.endDate != null ? ' — ${_formatDate(schedule.endDate!)}' : ' · Үргэлжлэх'}',
                        style: TextStyle(
                          color: colors.onSurfaceVariant,
                          fontSize: 11,
                        ),
                      ),
                      if (schedule.notes.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          schedule.notes,
                          style: TextStyle(
                            color: colors.onSurfaceVariant,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, size: 18, color: colors.outline),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

IconData _feedTypeIcon(FeedType type) => switch (type) {
  FeedType.hay => Icons.grass_outlined,
  FeedType.grain => Icons.grain_outlined,
  FeedType.supplement => Icons.medication_outlined,
};

// ═══════════════════════════════════════════════════════════════════════
// FeedScheduleFormScreen
// ═══════════════════════════════════════════════════════════════════════

/// Тэжээлийн хуваарь нэмэх/засах форм.
class FeedScheduleFormScreen extends ConsumerStatefulWidget {
  const FeedScheduleFormScreen({
    super.key,
    required this.horseId,
    this.existingSchedule,
  });

  /// Морины ID.
  final String horseId;

  /// Засах хуваарь (шинэ бол [null]).
  final FeedSchedule? existingSchedule;

  bool get isEditing => existingSchedule != null;

  @override
  ConsumerState<FeedScheduleFormScreen> createState() =>
      _FeedScheduleFormScreenState();
}

class _FeedScheduleFormScreenState
    extends ConsumerState<FeedScheduleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late FeedType _selectedType;
  late TextEditingController _quantityController;
  late TextEditingController _frequencyController;
  late TextEditingController _notesController;
  late DateTime _startDate;
  late DateTime? _endDate;
  bool _hasEndDate = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final existing = widget.existingSchedule;
    _selectedType = existing?.feedType ?? FeedType.hay;
    _startDate = existing?.startDate ?? DateTime.now();
    _endDate = existing?.endDate;
    _hasEndDate = existing?.endDate != null;
    _quantityController = TextEditingController(
      text: existing?.quantityKg.toString() ?? '',
    );
    _frequencyController = TextEditingController(
      text: existing?.frequency ?? 'Өдөр бүр',
    );
    _notesController = TextEditingController(text: existing?.notes ?? '');
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _frequencyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate : (_endDate ?? _startDate);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
      helpText: 'Огноо сонгох',
      cancelText: 'Болих',
      confirmText: 'Сонгох',
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final quantity = double.tryParse(_quantityController.text) ?? 0;
    final schedule = FeedSchedule(
      id: widget.existingSchedule?.id ??
          DateTime.now().microsecondsSinceEpoch.toString(),
      horseId: widget.horseId,
      feedType: _selectedType,
      quantityKg: quantity,
      frequency: _frequencyController.text.trim(),
      startDate: _startDate,
      endDate: _hasEndDate ? _endDate : null,
      notes: _notesController.text.trim(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    final repo = ref.read(nutritionRepositoryProvider);
    final result = await repo.saveSchedule(schedule);

    if (!mounted) return;

    setState(() => _isSaving = false);

    result.when(
      onSuccess: (_) {
        ref.invalidate(feedSchedulesProvider(widget.horseId));
        TamgaToast.showSuccess(
          context,
          'Тэжээлийн хуваарь амжилттай хадгалагдлаа',
        );
        Navigator.of(context).pop();
      },
      onFailure: (error) {
        TamgaToast.showError(context, 'Алдаа: ${error.message}');
      },
    );
  }

  Future<void> _delete() async {
    if (widget.existingSchedule == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Хуваарь устгах'),
        content: const Text('Та энэ тэжээлийн хуваарийг устгахдаа итгэлтэй байна уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Болих'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Устгах'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isSaving = true);

    final repo = ref.read(nutritionRepositoryProvider);
    final result = await repo.deleteSchedule(widget.existingSchedule!.id);

    if (!mounted) return;

    setState(() => _isSaving = false);

    result.when(
      onSuccess: (_) {
        ref.invalidate(feedSchedulesProvider(widget.horseId));
        TamgaToast.showSuccess(
          context,
          'Тэжээлийн хуваарь амжилттай устгагдлаа',
        );
        Navigator.of(context).pop();
      },
      onFailure: (error) {
        TamgaToast.showError(context, 'Алдаа: ${error.message}');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = TamgaColors.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.isEditing ? 'Тэжээлийн хуваарь засах' : 'Тэжээлийн хуваарь нэмэх',
        ),
        actions: [
          if (widget.isEditing)
            IconButton(
              icon: Icon(Icons.delete_outline, color: colors.error),
              onPressed: _delete,
              tooltip: 'Устгах',
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Type picker ──
            Text(
              'Тэжээлийн төрөл',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.onSurface,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<FeedType>(
              initialValue: _selectedType,
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
              ),
              items: FeedType.values.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type.displayName),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedType = value);
                }
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Quantity ──
            TextFormField(
              controller: _quantityController,
              decoration: InputDecoration(
                labelText: 'Тэжээлийн хэмжээ (кг)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Заавал бөглөнө үү';
                }
                final v = double.tryParse(value);
                if (v == null || v <= 0) {
                  return 'Эерэг тоо оруулна уу';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Frequency ──
            TextFormField(
              controller: _frequencyController,
              decoration: InputDecoration(
                labelText: 'Давтамж (жишээ нь: Өдөр бүр, Өдөрт 2 удаа)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Заавал бөглөнө үү';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Start date ──
            Text(
              'Эхлэх огноо',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.onSurface,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            InkWell(
              onTap: () => _pickDate(isStart: true),
              child: InputDecorator(
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                  ),
                  suffixIcon: const Icon(Icons.calendar_today),
                ),
                child: Text(
                  '${_startDate.year}-${_startDate.month.toString().padLeft(2, '0')}-${_startDate.day.toString().padLeft(2, '0')}',
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── End date toggle ──
            CheckboxListTile(
              title: const Text('Дуусах огноо тодорхойлох'),
              value: _hasEndDate,
              onChanged: (value) {
                setState(() {
                  _hasEndDate = value ?? false;
                  if (!_hasEndDate) {
                    _endDate = null;
                  }
                });
              },
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
            ),

            if (_hasEndDate) ...[
              const SizedBox(height: AppSpacing.sm),
              InkWell(
                onTap: () => _pickDate(isStart: false),
                child: InputDecorator(
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                    ),
                    suffixIcon: const Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    _endDate != null
                        ? '${_endDate!.year}-${_endDate!.month.toString().padLeft(2, '0')}-${_endDate!.day.toString().padLeft(2, '0')}'
                        : 'Огноо сонгох',
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],

            // ── Notes ──
            TextFormField(
              controller: _notesController,
              decoration: InputDecoration(
                labelText: 'Тэмдэглэл',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.xxl),

            // ── Save button ──
            LoadingButton(
              isLoading: _isSaving,
              onPressed: _save,
              child: Text(widget.isEditing ? 'Хадгалах' : 'Нэмэх'),
            ),
          ],
        ),
      ),
    );
  }
}
