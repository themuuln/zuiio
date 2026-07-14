import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/health_log.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../data/local_health_repository.dart';

/// Full-screen form for adding a new medical health log.
class AddHealthLogScreen extends ConsumerStatefulWidget {
  const AddHealthLogScreen({
    required this.horseId,
    this.initialLogType,
    super.key,
  });

  final String horseId;

  /// If provided, pre-select this log type.
  final String? initialLogType;

  @override
  ConsumerState<AddHealthLogScreen> createState() => _AddHealthLogScreenState();
}

class _AddHealthLogScreenState extends ConsumerState<AddHealthLogScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _medicamentController = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  LogType _medicalType = LogType.vaccination;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialLogType;
    if (initial != null) {
      final match = LogType.values.where((e) => e.name == initial);
      if (match.isNotEmpty) {
        _medicalType = match.first;
      }
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    _medicamentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Эрүүл мэндийн бүртгэл нэмэх'),
        leading: IconButton(
          onPressed: () => Navigator.of(ctx).pop(),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Header ──
            Text(
              'Шинэ бүртгэл',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Эмчилгээ, вакцин зэрэг бүртгэлийг нэмнэ үү.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── Log type dropdown ──
            DropdownButtonFormField<LogType>(
              initialValue: _medicalType,
              decoration: const InputDecoration(
                labelText: 'Бүртгэлийн төрөл *',
              ),
              items: [
                for (final type in LogType.values)
                  DropdownMenuItem(value: type, child: Text(type.displayName)),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _medicalType = val;
                  });
                }
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Date picker (required) ──
            _DatePickerField(
              selectedDate: _selectedDate,
              onDateSelected: (date) {
                setState(() {
                  _selectedDate = date;
                });
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Notes ──
            TextFormField(
              controller: _notesController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Тэмдэглэл',
                alignLabelWithHint: true,
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Тэмдэглэл оруулна уу';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Medicament ──
            TextFormField(
              controller: _medicamentController,
              decoration: const InputDecoration(
                labelText: 'Эм / Вакцин (заавал биш)',
                hintText: 'Жишээ: Томуу-Вак',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            const SizedBox(height: AppSpacing.xxl),

            // ── Save button ──
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Хадгалах'),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final notes = _notesController.text.trim();
    final medicament = _medicamentController.text.trim();
    final now = DateTime.now();

    final log = HealthLog(
      id: 'medical-${now.millisecondsSinceEpoch}',
      horseId: widget.horseId,
      logType: _medicalType,
      date: _selectedDate,
      notes: notes,
      medicament: medicament.isEmpty ? null : medicament,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    final repo = await ref.read(healthRepositoryProvider.future);
    final result = await repo.saveMedicalLog(log);

    if (!mounted) return;
    setState(() => _isSaving = false);

    result.when(
      onSuccess: (_) {
        ref.invalidate(medicalLogsProvider(widget.horseId));
        if (context.mounted) {
          showOfflineAwareSaveFeedback(
            context,
            ConnectionMonitor.instance.current,
          );
        }
        Navigator.of(context).pop(log);
      },
      onFailure: (err) {
        TamgaToast.showError(context, 'Алдаа: ${err.message}');
      },
    );
  }
}

// ── Date Picker Field ─────────────────────────────────────────────────

class _DatePickerField extends StatelessWidget {
  const _DatePickerField({
    required this.selectedDate,
    required this.onDateSelected,
  });

  final DateTime selectedDate;
  final ValueChanged<DateTime> onDateSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final formattedDate =
        '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}';

    return FormField<DateTime>(
      initialValue: selectedDate,
      validator: (_) {
        return null;
      },
      builder: (field) {
        return InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: selectedDate,
              firstDate: DateTime(2000),
              lastDate: DateTime.now(),
              locale: const Locale('mn'),
            );
            if (picked != null) {
              onDateSelected(picked);
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Огноо *',
              errorText: field.errorText,
              suffixIcon: Icon(
                Icons.calendar_today_outlined,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            child: Text(formattedDate, style: theme.textTheme.bodyMedium),
          ),
        );
      },
    );
  }
}
