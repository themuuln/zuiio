import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/document_providers.dart';
import '../domain/document_record.dart';

/// Баримт upload хийх bottom sheet.
///
/// Баримтын төрөл сонгох, нэр оруулах, файл сонгох боломжтой.
class UploadDocumentSheet extends ConsumerStatefulWidget {
  const UploadDocumentSheet({required this.horseId, super.key});

  /// Холбогдох морийн ID.
  final String horseId;

  @override
  ConsumerState<UploadDocumentSheet> createState() =>
      _UploadDocumentSheetState();
}

class _UploadDocumentSheetState extends ConsumerState<UploadDocumentSheet> {
  DocumentType _selectedType = DocumentType.vetCert;
  final _titleController = TextEditingController();
  File? _selectedFile;
  bool _isUploading = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        MediaQuery.of(ctx).viewInsets.bottom + AppSpacing.xxl,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Handle bar ──
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Title ──
            Text(
              'Шинэ баримт нэмэх',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── Document type chips ──
            Text(
              'Баримтын төрөл',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: DocumentType.values.map((type) {
                final isSelected = _selectedType == type;
                return ChoiceChip(
                  label: Text(type.labelMn),
                  avatar: Icon(
                    type.icon,
                    size: 18,
                    color: isSelected
                        ? colorScheme.onPrimary
                        : colorScheme.onSurface,
                  ),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedType = type),
                  selectedColor: colorScheme.primary,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? colorScheme.onPrimary
                        : colorScheme.onSurface,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Title input ──
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Баримтын гарчиг',
                hintText: 'Жишээ: 2024 онд хийсэн вакцин',
              ),
              textCapitalization: TextCapitalization.sentences,
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── File picker ──
            Text(
              'Файл сонгох',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),

            if (_selectedFile != null)
              _FilePreview(
                file: _selectedFile!,
                onRemove: () => setState(() => _selectedFile = null),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _PickerButton(
                      icon: Icons.camera_alt_outlined,
                      label: 'Камер',
                      onTap: () => _pickFile(ImageSource.camera),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _PickerButton(
                      icon: Icons.photo_library_outlined,
                      label: 'Галерээ',
                      onTap: () => _pickFile(ImageSource.gallery),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: _PickerButton(
                      icon: Icons.attach_file,
                      label: 'Файл',
                      onTap: () => _pickFileFromDocuments(),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: AppSpacing.xl),

            // ── Upload button ──
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _canUpload() ? _upload : null,
                child: _isUploading
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
          ],
        ),
      ),
    );
  }

  bool _canUpload() {
    return _selectedFile != null &&
        _titleController.text.trim().isNotEmpty &&
        !_isUploading;
  }

  Future<void> _pickFile(ImageSource source) async {
    final picker = ImagePicker();
    final result = await picker.pickImage(
      source: source,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );
    if (result != null) {
      setState(() {
        _selectedFile = File(result.path);
        // Гарчиг нэрээр дүүргэх (хоосон бол)
        if (_titleController.text.isEmpty) {
          _titleController.text = p.basenameWithoutExtension(result.path);
        }
      });
    }
  }

  Future<void> _pickFileFromDocuments() async {
    final picker = ImagePicker();
    final result = await picker.pickMedia();
    if (result != null) {
      setState(() {
        _selectedFile = File(result.path);
        if (_titleController.text.isEmpty) {
          _titleController.text = p.basenameWithoutExtension(result.path);
        }
      });
    }
  }

  Future<void> _upload() async {
    if (!_canUpload()) return;

    setState(() => _isUploading = true);

    try {
      final repo = ref.read(uploadDocumentProvider);
      final result = await repo.uploadDocument(
        file: _selectedFile!,
        horseId: widget.horseId,
        docType: _selectedType,
        title: _titleController.text.trim(),
      );

      if (mounted) {
        result.when(
          onSuccess: (_) {
            Navigator.of(context).pop();
            TamgaToast.showSuccess(context, 'Баримт амжилттай хадгалагдлаа');
          },
          onFailure: (error) {
            setState(() => _isUploading = false);
            TamgaToast.showError(context, 'Алдаа: ${error.message}');
          },
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        TamgaToast.showError(context, 'Алдаа: $e');
      }
    }
  }
}

// ── Picker Button ────────────────────────────────────────────────────

class _PickerButton extends StatelessWidget {
  const _PickerButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          border: Border.all(color: colorScheme.outline),
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
        child: Column(
          children: [
            Icon(icon, color: colorScheme.primary),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── File Preview ─────────────────────────────────────────────────────

class _FilePreview extends StatelessWidget {
  const _FilePreview({required this.file, required this.onRemove});

  final File file;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final fileName = p.basename(file.path);
    final ext = p.extension(file.path).toLowerCase();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Row(
        children: [
          Icon(_fileIcon(ext), color: colorScheme.primary, size: 32),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fileName,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  ext.toUpperCase().replaceFirst('.', ''),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(Icons.close),
            iconSize: 20,
            color: colorScheme.onSurfaceVariant,
            tooltip: 'Устгах',
          ),
        ],
      ),
    );
  }

  IconData _fileIcon(String ext) {
    switch (ext) {
      case '.pdf':
        return Icons.picture_as_pdf;
      case '.jpg':
      case '.jpeg':
      case '.png':
        return Icons.image;
      case '.doc':
      case '.docx':
        return Icons.description;
      default:
        return Icons.insert_drive_file;
    }
  }
}
