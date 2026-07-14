import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/co_ownership_providers.dart';
import '../domain/co_ownership.dart';

class CoOwnershipSheet extends ConsumerWidget {
  const CoOwnershipSheet({
    required this.horseId,
    required this.horseName,
    super.key,
  });

  final String horseId;
  final String horseName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final coOwnersAsync = ref.watch(coOwnersProvider(horseId));

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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Хамтран эзэмшигчид',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        '$horseName морины зөвшөөрөл ба уяачид',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _openAddCoOwnerSheet(context, ref),
                  icon: const Icon(Icons.person_add_alt_1),
                  tooltip: 'Уяач нэмэх',
                  color: colorScheme.primary,
                ),
              ],
            ),
            const Divider(height: AppSpacing.xxxl),
            coOwnersAsync.when(
              data: (coOwners) {
                if (coOwners.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.xxl,
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.people_outline,
                            size: 48,
                            color: colorScheme.outline,
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Text(
                            'Хамтран эзэмшигч эсвэл туслах уяач бүртгэгдээгүй байна.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: colorScheme.outline,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }
                return Column(
                  children: [
                    for (final coOwner in coOwners) ...[
                      _CoOwnerTile(coOwner: coOwner, horseId: horseId),
                      const SizedBox(height: AppSpacing.md),
                    ],
                  ],
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (err, stack) => Center(child: Text('Алдаа: $err')),
            ),
            const SizedBox(height: AppSpacing.lg),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
              child: const Text('Хаах'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openAddCoOwnerSheet(BuildContext context, WidgetRef ref) async {
    final result = await showModalBottomSheet<CoOwnershipRecord>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _AddCoOwnerSheet(horseId: horseId),
    );

    if (result == null) return;

    final repository = ref.read(coOwnershipRepositoryProvider);
    await repository.saveCoOwner(result);
    ref.invalidate(coOwnersProvider(horseId));
  }
}

class _CoOwnerTile extends ConsumerWidget {
  const _CoOwnerTile({required this.coOwner, required this.horseId});

  final CoOwnershipRecord coOwner;
  final String horseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        coOwner.coOwnerName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'Утас: ${coOwner.phone} • Роль: ${coOwner.role}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: colorScheme.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _delete(context, ref),
                  icon: const Icon(Icons.delete_outline),
                  color: colorScheme.error,
                  tooltip: 'Устгах',
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.xs,
              children: [
                for (final permission in coOwner.permissions)
                  Chip(
                    label: Text(
                      _getPermissionLabel(permission),
                      style: theme.textTheme.labelSmall,
                    ),
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    backgroundColor: colorScheme.surfaceContainerHighest,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getPermissionLabel(String perm) {
    switch (perm) {
      case 'read':
        return 'Харах';
      case 'write_health':
        return 'Эрүүл мэнд засах';
      case 'write_events':
        return 'Уралдаан засах';
      case 'all':
        return 'Бүрэн эрх';
      default:
        return perm;
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Уяачийг хасах уу?'),
        content: Text(
          '"${coOwner.coOwnerName}" уяачийн хамтран ажиллах зөвшөөрлийг цуцлах уу?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Үгүй'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Тийм'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final repository = ref.read(coOwnershipRepositoryProvider);
    await repository.deleteCoOwner(coOwner.id);
    ref.invalidate(coOwnersProvider(horseId));
  }
}

class _AddCoOwnerSheet extends StatefulWidget {
  const _AddCoOwnerSheet({required this.horseId});

  final String horseId;

  @override
  State<_AddCoOwnerSheet> createState() => _AddCoOwnerSheetState();
}

class _AddCoOwnerSheetState extends State<_AddCoOwnerSheet> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String _selectedRole = 'Туслах уяач';
  final List<String> _permissions = ['read'];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final roles = ['Эзэмшигч', 'Туслах уяач', 'Холбоотон уяач'];
    final permOptions = [
      {'key': 'read', 'label': 'Харах эрх'},
      {'key': 'write_health', 'label': 'Эрүүл мэнд бүртгэх'},
      {'key': 'write_events', 'label': 'Уралдаан/Амжилт бүртгэх'},
      {'key': 'all', 'label': 'Бүх эрх'},
    ];

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
              'Уяач/Хамтран эзэмшигч нэмэх',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Хэрэглэгчийн нэр'),
            ),
            const SizedBox(height: AppSpacing.lg),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Утасны дугаар'),
            ),
            const SizedBox(height: AppSpacing.lg),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Системд эзлэх үүрэг',
              ),
              initialValue: _selectedRole,
              items: roles
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (val) =>
                  setState(() => _selectedRole = val ?? 'Туслах уяач'),
            ),
            const SizedBox(height: AppSpacing.xl),
            for (final option in permOptions)
              CheckboxListTile(
                title: Text(option['label']!),
                value: _permissions.contains(option['key']),
                onChanged: (val) {
                  setState(() {
                    if (val == true) {
                      _permissions.add(option['key']!);
                    } else {
                      _permissions.remove(option['key']);
                    }
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
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
                    child: const Text('Нэмэх'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _save() {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty || phone.isEmpty) {
      TamgaToast.show(context, 'Нэр болон утсыг заавал оруулна уу.');
      return;
    }

    final record = CoOwnershipRecord(
      id: 'coowner-${DateTime.now().millisecondsSinceEpoch}',
      horseId: widget.horseId,
      coOwnerName: name,
      phone: phone,
      role: _selectedRole,
      permissions: _permissions,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    Navigator.of(context).pop(record);
  }
}
