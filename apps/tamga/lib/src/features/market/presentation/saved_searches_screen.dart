import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../application/saved_search_providers.dart';

/// Хадгалсан хайлтуудын дэлгэц.
///
/// Хэрэглэгч хадгалсан хайлтуудаа харах, нэр өөрчлөх, устгах боломжтой.
class SavedSearchesScreen extends ConsumerStatefulWidget {
  const SavedSearchesScreen({super.key});

  @override
  ConsumerState<SavedSearchesScreen> createState() =>
      _SavedSearchesScreenState();
}

class _SavedSearchesScreenState extends ConsumerState<SavedSearchesScreen> {
  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authStateProvider);
    final userId = authAsync.valueOrNull?.userId ?? 'local-user';

    final savedSearchesAsync = ref.watch(savedSearchesProvider(userId));

    return Scaffold(
      appBar: AppBar(title: const Text('Хадгалсан хайлтууд')),
      body: savedSearchesAsync.when(
        data: (searches) {
          if (searches.isEmpty) {
            return const EmptyState(
              icon: Icons.search_off,
              title: 'Хадгалсан хайлт алга',
              description: 'Зах дээр шүүлтүүр тохируулаад хадгална уу.',
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.lg),
            itemCount: searches.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (context, index) {
              final search = searches[index];
              return _SavedSearchTile(
                search: search,
                onRename: () => _showRenameDialog(search),
                onDelete: () => _confirmDelete(search),
              );
            },
          );
        },
        loading: () => const Center(child: LoadingIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Хайлтуудыг ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(savedSearchesProvider(userId)),
        ),
      ),
    );
  }

  /// Нэр өөрчлөх dialog харуулах.
  Future<void> _showRenameDialog(dynamic search) async {
    final controller = TextEditingController(text: search.name);
    final newName = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Хайлтын нэр өөрчлөх'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Шинэ нэр',
            hintText: 'Хайлтын нэр оруулах',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Цуцлах'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Хадгалах'),
          ),
        ],
      ),
    );

    if (newName != null && newName.isNotEmpty && newName != search.name) {
      final authAsync = ref.read(authStateProvider);
      final userId = authAsync.valueOrNull?.userId ?? 'local-user';

      await ref.read(
        renameSavedSearchProvider(
          RenameSavedSearchParams(id: search.id, newName: newName),
        ).future,
      );
      ref.invalidate(savedSearchesProvider(userId));
    }
  }

  /// Устгах dialog харуулах.
  Future<void> _confirmDelete(dynamic search) async {
    final theme = Theme.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Хайлт устгах'),
        content: Text('"${search.name}" хайлтыг устгахдаа итгэлтэй байна уу?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: theme.colorScheme.error,
            ),
            child: const Text('Устгах'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final authAsync = ref.read(authStateProvider);
      final userId = authAsync.valueOrNull?.userId ?? 'local-user';

      await ref.read(deleteSavedSearchProvider(search.id).future);
      ref.invalidate(savedSearchesProvider(userId));
    }
  }
}

/// Хадгалсан хайлтын нэгж мөр.
class _SavedSearchTile extends StatelessWidget {
  const _SavedSearchTile({
    required this.search,
    required this.onRename,
    required this.onDelete,
  });

  final dynamic search;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: colorScheme.secondaryContainer,
          child: Icon(Icons.search, color: colorScheme.onSecondaryContainer),
        ),
        title: Text(search.name, style: theme.textTheme.titleMedium),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              _filtersDescription(search.filters),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              'Үүсгэсэн: ${_formatDate(search.createdAt)}',
              style: theme.textTheme.labelSmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Нэр өөрчлөх',
              onPressed: onRename,
            ),
            IconButton(
              icon: Icon(Icons.delete_outline, color: colorScheme.error),
              tooltip: 'Устгах',
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }

  /// Шүүлтүүрийн товч тайлбар.
  String _filtersDescription(Map<String, dynamic> filters) {
    final parts = <String>[];
    if (filters.containsKey('saleType')) {
      parts.add(filters['saleType'].toString());
    }
    if (filters.containsKey('location') &&
        (filters['location'] as String?)?.isNotEmpty == true) {
      parts.add(filters['location'].toString());
    }
    if (filters.containsKey('breed') &&
        (filters['breed'] as String?)?.isNotEmpty == true) {
      parts.add(filters['breed'].toString());
    }
    if (filters.containsKey('minPrice') || filters.containsKey('maxPrice')) {
      final min = filters['minPrice']?.toString() ?? '0';
      final max = filters['maxPrice']?.toString() ?? '∞';
      parts.add('₮$min-₮$max');
    }
    if (filters.containsKey('verifiedOnly') &&
        filters['verifiedOnly'] == true) {
      parts.add('Баталгаажсан');
    }
    return parts.isEmpty ? 'Бүх зар' : parts.join(' · ');
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
