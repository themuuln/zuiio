/// Дасгалжуулалт нэмэх/засах форм.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/training_providers.dart';
import '../domain/training_log.dart';

/// Дасгалжуулалтын бүртгэл нэмэх эсвэл засах форм.
class TrainingFormScreen extends ConsumerStatefulWidget {
  const TrainingFormScreen({
    super.key,
    required this.horseId,
    this.existingLog,
  });

  /// Морины ID.
  final String horseId;

  /// Засах бүртгэл (шинэ бүртгэл бол [null]).
  final TrainingLog? existingLog;

  bool get isEditing => existingLog != null;

  @override
  ConsumerState<TrainingFormScreen> createState() => _TrainingFormScreenState();
}

class _TrainingFormScreenState extends ConsumerState<TrainingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TrainingLogType _selectedType;
  late TextEditingController _durationController;
  late TextEditingController _distanceController;
  late TextEditingController _notesController;
  late TextEditingController _handlerNameController;
  late TextEditingController _weatherController;
  late DateTime _selectedDate;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final existing = widget.existingLog;
    _selectedType = existing?.type ?? TrainingLogType.gallop;
    _selectedDate = existing?.date ?? DateTime.now();
    _durationController = TextEditingController(
      text: existing?.durationMinutes.toString() ?? '',
    );
    _distanceController = TextEditingController(
      text: existing?.distanceKm?.toString() ?? '',
    );
    _notesController = TextEditingController(text: existing?.notes ?? '');
    _handlerNameController = TextEditingController(
      text: existing?.handlerName ?? '',
    );
    _weatherController = TextEditingController(text: existing?.weather ?? '');
  }

  @override
  void dispose() {
    _durationController.dispose();
    _distanceController.dispose();
    _notesController.dispose();
    _handlerNameController.dispose();
    _weatherController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Огноо сонгох',
      cancelText: 'Болих',
      confirmText: 'Сонгох',
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final duration = int.tryParse(_durationController.text) ?? 0;
    final distance = double.tryParse(_distanceController.text);
    final log = TrainingLog(
      id:
          widget.existingLog?.id ??
          DateTime.now().microsecondsSinceEpoch.toString(),
      horseId: widget.horseId,
      type: _selectedType,
      date: _selectedDate,
      durationMinutes: duration,
      distanceKm: distance,
      notes: _notesController.text.trim(),
      handlerName: _handlerNameController.text.trim().isEmpty
          ? null
          : _handlerNameController.text.trim(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      weather: _weatherController.text.trim().isEmpty
          ? null
          : _weatherController.text.trim(),
    );

    final repo = ref.read(trainingRepositoryProvider);
    final result = await repo.save(log);

    if (!mounted) return;

    setState(() => _isSaving = false);

    result.when(
      onSuccess: (_) {
        ref.invalidate(trainingLogsProvider(widget.horseId));
        TamgaToast.showSuccess(context, 'Дасгалжуулалт амжилттай хадгалагдлаа');
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
          widget.isEditing ? 'Дасгалжуулалт засах' : 'Дасгалжуулалт нэмэх',
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Type picker ──
            Text(
              'Дасгалжуулалтын төрөл',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.onSurface,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<TrainingLogType>(
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
              items: TrainingLogType.values.map((type) {
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

            // ── Date picker ──
            Text(
              'Огноо',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: colors.onSurface,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            InkWell(
              onTap: _pickDate,
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
                  '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Duration ──
            TextFormField(
              controller: _durationController,
              decoration: InputDecoration(
                labelText: 'Үргэлжлэх хугацаа (минут)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Заавал бөглөнө үү';
                }
                final v = int.tryParse(value);
                if (v == null || v <= 0) {
                  return 'Эерэг тоо оруулна уу';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Distance (optional) ──
            TextFormField(
              controller: _distanceController,
              decoration: InputDecoration(
                labelText: 'Зай (км, нэмэлт)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: AppSpacing.lg),

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
            const SizedBox(height: AppSpacing.lg),

            // ── Handler name (optional) ──
            TextFormField(
              controller: _handlerNameController,
              decoration: InputDecoration(
                labelText: 'Дааганч (нэмэлт)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Weather (optional) ──
            TextFormField(
              controller: _weatherController,
              decoration: InputDecoration(
                labelText: 'Цаг агаар (нэмэлт)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                ),
              ),
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
