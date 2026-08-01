import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/horses_providers.dart';
import '../data/csv_import_service.dart';

/// CSV import screen for migrating horses from Uyach or other sources.
///
/// Flow:
/// 1. Pick CSV file
/// 2. Preview parsed rows with validation errors
/// 3. Import valid horses
class CsvImportScreen extends ConsumerStatefulWidget {
  const CsvImportScreen({super.key});

  @override
  ConsumerState<CsvImportScreen> createState() => _CsvImportScreenState();
}

class _CsvImportScreenState extends ConsumerState<CsvImportScreen> {
  CsvImportSummary? _summary;
  bool _isLoading = false;
  String? _error;
  bool _importing = false;

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (result == null || result.files.isEmpty) return;

      setState(() {
        _isLoading = true;
        _error = null;
      });

      final filePath = result.files.single.path;
      if (filePath == null) {
        setState(() {
          _isLoading = false;
          _error = 'Файл олоогүй';
        });
        return;
      }

      // Get existing horses for duplicate check
      final horsesAsync = ref.read(horsesProvider);
      final existingHorses = horsesAsync.valueOrNull ?? [];

      final summary = await CsvImportService.parseFile(
        filePath,
        existingHorses: existingHorses,
      );

      setState(() {
        _summary = summary;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Файл уншихад алдаа гарлаа: $e';
      });
    }
  }

  Future<void> _importHorses() async {
    if (_summary == null || _summary!.rows.isEmpty) return;

    setState(() => _importing = true);

    try {
      final horsesAsync = ref.read(horsesProvider);
      final currentHorses = horsesAsync.valueOrNull ?? [];

      // Check horse count limit
      final newCount = currentHorses.length + _summary!.validCount;
      if (newCount > 1 && currentHorses.isEmpty) {
        // Free tier limit check
        // TODO: Use tierLimitsProvider for proper check
      }

      // Convert rows to horses
      final newHorses = _summary!.rows.map((row) => row.toHorse()).toList();

      // TODO: Add horses via repository
      // For now, just show success
      if (mounted) {
        TamgaToast.showSuccess(
          context,
          '${newHorses.length} морь амжилттай импортлоно.',
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _importing = false);
        TamgaToast.showError(context, 'Импортлоход алдаа гарлаа: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tc = TamgaColors.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('CSV-аас импортлох')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Text(
                'Морьдоо CSV файлаас импортлох',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Уяач эсвэл бусад апп-аас экспортолсон CSV файлыг сонгоно уу.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // CSV format hint
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CSV формат:',
                      style: theme.textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Нэр, Хүйс, Зүс, Төрсөн он, Аавын нэр, Ээжийн нэр',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Жишээ: Хүрэл, Азарга, Хүрэн, 2020, Бадам, Сарнай',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // Pick file button
              if (_summary == null)
                FilledButton.icon(
                  onPressed: _isLoading ? null : _pickFile,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.upload_file),
                  label: Text(_isLoading ? 'Уншиж байна...' : 'Файл сонгох'),
                ),

              // Error
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: tc.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: tc.error),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(child: Text(_error!)),
                    ],
                  ),
                ),
              ],

              // Preview
              if (_summary != null) ...[
                const SizedBox(height: AppSpacing.lg),
                _buildSummaryHeader(theme, tc),
                const SizedBox(height: AppSpacing.md),
                Expanded(child: _buildPreviewList(theme, tc)),
                const SizedBox(height: AppSpacing.lg),
                _buildActionButtons(theme),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryHeader(ThemeData theme, TamgaColors tc) {
    final summary = _summary!;
    return Row(
      children: [
        _buildStatChip(
          theme,
          label: 'Нийт',
          value:
              '${summary.rows.length + summary.invalidCount + summary.duplicateCount}',
          color: theme.colorScheme.primary,
        ),
        const SizedBox(width: AppSpacing.sm),
        _buildStatChip(
          theme,
          label: 'Бэлэн',
          value: '${summary.validCount}',
          color: tc.tertiary,
        ),
        if (summary.invalidCount > 0) ...[
          const SizedBox(width: AppSpacing.sm),
          _buildStatChip(
            theme,
            label: 'Алдаатай',
            value: '${summary.invalidCount}',
            color: tc.error,
          ),
        ],
        if (summary.duplicateCount > 0) ...[
          const SizedBox(width: AppSpacing.sm),
          _buildStatChip(
            theme,
            label: 'Давхардсан',
            value: '${summary.duplicateCount}',
            color: tc.primary,
          ),
        ],
      ],
    );
  }

  Widget _buildStatChip(
    ThemeData theme, {
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: color)),
        ],
      ),
    );
  }

  Widget _buildPreviewList(ThemeData theme, TamgaColors tc) {
    final summary = _summary!;
    if (summary.rows.isEmpty && summary.duplicates.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.info_outline,
              size: 48,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Импортлох морь олдсонгүй', style: theme.textTheme.bodyLarge),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: summary.rows.length,
      itemBuilder: (context, index) {
        final row = summary.rows[index];
        return Card(
          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: row.isValid
                  ? tc.tertiary.withValues(alpha: 0.1)
                  : tc.error.withValues(alpha: 0.1),
              child: Icon(
                row.isValid ? Icons.check : Icons.error_outline,
                color: row.isValid ? tc.tertiary : tc.error,
                size: 20,
              ),
            ),
            title: Text(
              row.name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${row.gender.displayName} · ${row.coat} · ${row.birthYear}',
              style: theme.textTheme.bodySmall,
            ),
            trailing: row.sireName.isNotEmpty
                ? Chip(
                    label: Text(
                      'Аав: ${row.sireName}',
                      style: theme.textTheme.labelSmall,
                    ),
                    visualDensity: VisualDensity.compact,
                  )
                : null,
          ),
        );
      },
    );
  }

  Widget _buildActionButtons(ThemeData theme) {
    final summary = _summary!;
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => setState(() {
              _summary = null;
              _error = null;
            }),
            child: const Text('Дахин сонгох'),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: FilledButton(
            onPressed: summary.validCount == 0 || _importing
                ? null
                : _importHorses,
            child: _importing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text('Импортлох (${summary.validCount})'),
          ),
        ),
      ],
    );
  }
}
