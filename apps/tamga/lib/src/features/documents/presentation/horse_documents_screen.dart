import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/domain/horse_record.dart';
import '../application/document_providers.dart';
import '../domain/document_record.dart';
import 'upload_document_sheet.dart';

/// Морины баримтуудын хуудас.
///
/// Нэг морийн бүх баримтуудыг төрөл бүрээр харуулна.
/// FAB-аар шинэ баримт нэмж, swipe-аар устгана.
class HorseDocumentsScreen extends ConsumerWidget {
  const HorseDocumentsScreen({required this.horse, super.key});

  /// Холбогдох морь.
  final HorseRecord horse;

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final theme = Theme.of(ctx);
    final documentsAsync = ref.watch(documentsForHorseProvider(horse.id));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          '${horse.name} — Баримтууд',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: false,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showUploadSheet(ctx, ref),
        icon: const Icon(Icons.add),
        label: const Text('Баримт нэмэх'),
      ),
      body: documentsAsync.when(
        data: (documents) {
          if (documents.isEmpty) {
            return EmptyState(
              icon: Icons.folder_open,
              title: 'Баримт байхгүй байна',
              description: 'Эмчийн гэрчилгээ, даатгал, бүртгэлийн баримт зэрэг файлуудыг энд хадгална уу.',
              actionLabel: 'Эхний баримтаа нэмэх',
              onAction: () => _showUploadSheet(ctx, ref),
            );
          }
          return _DocumentList(
            documents: documents,
            horseId: horse.id,
            ref: ref,
          );
        },
        loading: () => SkeletonLoader(
          items: 5,
          itemBuilder: (ctx, i) => const SkeletonListTile(),
        ),
        error: (err, _) => TamgaErrorWidget(
          message: 'Баримт ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(documentsForHorseProvider(horse.id)),
        ),
      ),
    );
  }

  void _showUploadSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => UploadDocumentSheet(horseId: horse.id),
    ).then((_) {
      // Upload дуусмагц жагсаалтыг шинэчлэх
      ref.invalidate(documentsForHorseProvider(horse.id));
    });
  }
}

// ── Document List ────────────────────────────────────────────────────

class _DocumentList extends StatelessWidget {
  const _DocumentList({
    required this.documents,
    required this.horseId,
    required this.ref,
  });

  final List<DocumentRecord> documents;
  final String horseId;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    // Төрөл бүрээр бүлэглэх
    final grouped = <DocumentType, List<DocumentRecord>>{};
    for (final doc in documents) {
      grouped.putIfAbsent(doc.docType, () => []).add(doc);
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.xxxxl,
      ),
      itemCount: grouped.length,
      itemBuilder: (context, index) {
        final type = grouped.keys.elementAt(index);
        final docs = grouped[type]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Section header ──
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Row(
                children: [
                  Icon(
                    type.icon,
                    size: 18,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    type.labelMn,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.primaryContainer.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadiusPill,
                      ),
                    ),
                    child: Text(
                      '${docs.length}',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // ── Document cards ──
            for (final doc in docs) ...[
              _DocumentCard(
                document: doc,
                onDelete: () => _confirmDelete(context, ref, doc),
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
            const SizedBox(height: AppSpacing.md),
          ],
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, DocumentRecord doc) {
    final tc = TamgaColors.of(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Баримт устгах'),
        content: Text('"${doc.title}" баримтыг устгах уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Цуцлах'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final repo = ref.read(deleteDocumentProvider);
              final result = await repo.deleteDocument(doc.id);
              if (context.mounted) {
                result.when(
                  onSuccess: (_) {
                    ref.invalidate(documentsForHorseProvider(horseId));
                    TamgaToast.showSuccess(
                      context,
                      'Баримт амжилттай устгагдлаа',
                    );
                  },
                  onFailure: (error) {
                    TamgaToast.showError(context, 'Алдаа: ${error.message}');
                  },
                );
              }
            },
            child: Text('Устгах', style: TextStyle(color: tc.error)),
          ),
        ],
      ),
    );
  }
}

// ── Document Card ────────────────────────────────────────────────────

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({required this.document, required this.onDelete});

  final DocumentRecord document;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final tc = TamgaColors.of(context);

    return Dismissible(
      key: ValueKey(document.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.xl),
        decoration: BoxDecoration(
          color: tc.error,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      child: Card(
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          leading: CircleAvatar(
            backgroundColor: colorScheme.primaryContainer,
            child: Icon(
              document.docType.icon,
              color: colorScheme.onPrimaryContainer,
              size: 20,
            ),
          ),
          title: Text(
            document.title,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 2),
              Text(
                _formatDate(document.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              if (document.fileSize != null)
                Text(
                  _formatFileSize(document.fileSize!),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
            ],
          ),
          trailing: Icon(
            Icons.chevron_right,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

String _formatFileSize(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
