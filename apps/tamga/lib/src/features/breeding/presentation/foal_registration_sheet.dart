/// Унага бүртгэх дэлгэц.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';

/// Унага бүртгэх дэлгэц.
class FoalRegistrationSheet extends StatefulWidget {
  const FoalRegistrationSheet({
    required this.sireName,
    required this.damName,
    super.key,
  });

  /// Азаргын нэр.
  final String sireName;

  /// Гүүгийн нэр.
  final String damName;

  @override
  State<FoalRegistrationSheet> createState() => _FoalRegistrationSheetState();
}

class _FoalRegistrationSheetState extends State<FoalRegistrationSheet> {
  final _nameController = TextEditingController();
  final _colorController = TextEditingController(text: 'Хээр');
  final _birthYearController = TextEditingController(
    text: DateTime.now().year.toString(),
  );
  late final TextEditingController _notesController;
  String _selectedGender = 'Эр';

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController(
      text: '${widget.sireName} болон ${widget.damName} ухаа удмын үр төл.',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _colorController.dispose();
    _birthYearController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
              'Унага бүртгэх',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Төллөлт амжилттай болсон тул унагыг морины бүртгэлд шинээр бүртгэнэ.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Унаганы нэр'),
            ),
            const SizedBox(height: AppSpacing.lg),

            // хүйс
            Text(
              'Хүйс',
              style: theme.textTheme.labelMedium?.copyWith(
                color: theme.colorScheme.outline,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'Эр', label: Text('Эр')),
                ButtonSegment(value: 'Эм', label: Text('Эм')),
              ],
              selected: {_selectedGender},
              onSelectionChanged: (selected) {
                setState(() => _selectedGender = selected.first);
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            TextField(
              controller: _colorController,
              decoration: const InputDecoration(labelText: 'Зүс'),
            ),
            const SizedBox(height: AppSpacing.lg),

            TextField(
              controller: _birthYearController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Төрсөн он'),
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
                    onPressed: _submit,
                    child: const Text('Хадгалах'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _submit() {
    final name = _nameController.text.trim();
    final color = _colorController.text.trim();
    final birthYear =
        int.tryParse(_birthYearController.text.trim()) ?? DateTime.now().year;

    if (name.isEmpty) {
      TamgaToast.show(context, 'Унаганы нэрийг заавал оруулна уу.');
      return;
    }

    Navigator.of(context).pop({
      'name': name,
      'gender': _selectedGender,
      'color': color,
      'birthYear': birthYear,
      'notes': _notesController.text.trim(),
    });
  }
}
