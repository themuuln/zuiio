/// Хээлтүүлэг шинээр бүртгэх дэлгэц.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/domain/horse_record.dart';
import '../data/gestation_calculator.dart';
import '../domain/breeding_record.dart';

/// Хээлтүүлэг шинээр бүртгэх дэлгэц.
class BreedingCreatorSheet extends StatefulWidget {
  const BreedingCreatorSheet({required this.horses, super.key});

  /// Адуунуудын жагсаалт.
  final List<HorseRecord> horses;

  @override
  State<BreedingCreatorSheet> createState() => _BreedingCreatorSheetState();
}

class _BreedingCreatorSheetState extends State<BreedingCreatorSheet> {
  String? _selectedSireId;
  String? _selectedDamId;
  DateTime _selectedDate = DateTime.now();
  final _herdController = TextEditingController(text: 'Баруун сүрэг');
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _herdController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Азарга болон гүүг шүүх
    final sires = widget.horses
        .where(
          (h) =>
              h.relationLabel.toLowerCase().contains('азарга') ||
              h.relationLabel.toLowerCase().contains('хүү') ||
              h.relationLabel.toLowerCase().contains('эцэг'),
        )
        .toList();
    final dams = widget.horses
        .where(
          (h) =>
              h.relationLabel.toLowerCase().contains('гүү') ||
              h.relationLabel.toLowerCase().contains('охин') ||
              h.relationLabel.toLowerCase().contains('эх'),
        )
        .toList();

    // Хоосон жагсаалтын нөхцөл
    final finalSires = sires.isEmpty ? widget.horses : sires;
    final finalDams = dams.isEmpty ? widget.horses : dams;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.xl,
        AppSpacing.xl,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.xl,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Хээлтүүлэг шинээр бүртгэх',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Азарга (Sire)'),
              initialValue: _selectedSireId,
              items: finalSires
                  .map(
                    (h) => DropdownMenuItem(
                      value: h.id,
                      child: Text('${h.name} (${h.relationLabel})'),
                    ),
                  )
                  .toList(),
              onChanged: (val) => setState(() => _selectedSireId = val),
            ),
            const SizedBox(height: AppSpacing.lg),

            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Гүү (Dam)'),
              initialValue: _selectedDamId,
              items: finalDams
                  .map(
                    (h) => DropdownMenuItem(
                      value: h.id,
                      child: Text('${h.name} (${h.relationLabel})'),
                    ),
                  )
                  .toList(),
              onChanged: (val) => setState(() => _selectedDamId = val),
            ),
            const SizedBox(height: AppSpacing.lg),

            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Хээлтсэн огноо'),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(GestationCalculator.formatDate(_selectedDate)),
                    const Icon(Icons.calendar_today),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            TextField(
              controller: _herdController,
              decoration: const InputDecoration(labelText: 'Сүрэг хуваарилалт'),
            ),
            const SizedBox(height: AppSpacing.lg),

            TextField(
              controller: _notesController,
              decoration: const InputDecoration(labelText: 'Тэмдэглэл'),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.xxl),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Болих'),
                  ),
                ),
                const SizedBox(width: AppSpacing.lg),
                Expanded(
                  child: FilledButton(
                    onPressed: _save,
                    child: const Text('Бүртгэх'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 3)),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  void _save() {
    if (_selectedSireId == null || _selectedDamId == null) {
      TamgaToast.show(context, 'Азарга болон Гүүг заавал сонгоно уу.');
      return;
    }

    final sire = widget.horses.firstWhere((h) => h.id == _selectedSireId);
    final dam = widget.horses.firstWhere((h) => h.id == _selectedDamId);
    final expectedFoaling = GestationCalculator.expectedDueDate(_selectedDate);

    final record = BreedingRecord(
      id: 'breeding-${DateTime.now().millisecondsSinceEpoch}',
      sireId: sire.id,
      sireName: sire.name,
      damId: dam.id,
      damName: dam.name,
      breedingDate: _selectedDate,
      expectedFoalingDate: expectedFoaling,
      status: 'Хээлтсэн',
      herdLabel: _herdController.text.trim(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      notes: _notesController.text.trim(),
    );

    Navigator.of(context).pop(record);
  }
}
