/// API тохиргооны дэлгэц — API түлхүүрүүдийг удирдах.
///
/// - Түлхүүрүүдийн жагсаалт
/// - Шинэ түлхүүр үүсгэх
/// - Түлхүүрийг идэвхигүй болгох
/// - Хэрэглээний статистик
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../application/api_key_providers.dart';
import '../domain/api_key.dart';

/// API тохиргооны дэлгэц.
class ApiSettingsScreen extends ConsumerStatefulWidget {
  const ApiSettingsScreen({super.key});

  @override
  ConsumerState<ApiSettingsScreen> createState() => _ApiSettingsScreenState();
}

class _ApiSettingsScreenState extends ConsumerState<ApiSettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final l10n = AppLocalizations.of(context)!;
    final keysAsync = ref.watch(userApiKeysProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.apiSettingsTitle),
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(PhosphorIconsRegular.caretLeft),
        ),
      ),
      body: keysAsync.when(
        data: (keys) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(userApiKeysProvider),
          child: ListView(
            padding: AppSpacing.screenPadding,
            children: [
              // ── Tier info ──────────────────────────────────────
              _TierInfoCard(colorScheme: colorScheme),
              const SizedBox(height: AppSpacing.lg),

              // ── Quickstart hint ────────────────────────────────
              _QuickstartHint(colorScheme: colorScheme),
              const SizedBox(height: AppSpacing.xxl),

              // ── Keys list header ───────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'API Түлхүүрүүд (${keys.length})',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () => _showCreateKeyDialog(context, ref),
                    icon: const Icon(PhosphorIconsRegular.plus, size: 18),
                    label: const Text('Шинэ түлхүүр'),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),

              if (keys.isEmpty)
                _EmptyKeysState(colorScheme: colorScheme)
              else
                ...keys.map(
                  (key) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _ApiKeyCard(
                      apiKey: key,
                      onRevoke: () => _revokeKey(context, ref, key),
                    ),
                  ),
                ),

              // ── cURL examples ──────────────────────────────────
              const SizedBox(height: AppSpacing.xxl),
              _CurlExamples(colorScheme: colorScheme),
            ],
          ),
        ),
        loading: () => const Center(child: TamgaSpinner()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                PhosphorIconsRegular.warningCircle,
                size: 48,
                color: colorScheme.error,
              ),
              const SizedBox(height: AppSpacing.md),
              Text('Алдаа: $err'),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showCreateKeyDialog(BuildContext context, WidgetRef ref) async {
    final result = await showDialog<CreateApiKeyRequest>(
      context: context,
      builder: (_) => const _CreateKeyDialog(),
    );

    if (result == null || !context.mounted) return;

    final repo = ref.read(apiKeyRepositoryProvider);
    final userId = ref.read(authStateProvider).valueOrNull?.userId ?? '';
    if (userId.isEmpty) return;

    final created = await repo.createApiKey(userId, result);
    if (!context.mounted) return;

    created.when(
      onSuccess: (data) {
        ref.invalidate(userApiKeysProvider);
        _showKeyRevealDialog(context, data);
      },
      onFailure: (err) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Алдаа: ${err.message}')));
      },
    );
  }

  void _showKeyRevealDialog(BuildContext context, ApiKeyCreated created) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _KeyRevealDialog(created: created),
    );
  }

  Future<void> _revokeKey(
    BuildContext context,
    WidgetRef ref,
    ApiKey key,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Түлхүүрийг цуцлах?'),
        content: Text(
          '"${key.name}" түлхүүрийг идэвхигүй болгох уу? '
          'Энэ үйлдлийг буцаах боломжгүй.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Цуцалгүй'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(AppLocalizations.of(ctx)!.generalCancel),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final repo = ref.read(apiKeyRepositoryProvider);
    final result = await repo.revokeApiKey(key.id);

    if (!context.mounted) return;
    result.when(
      onSuccess: (_) {
        ref.invalidate(userApiKeysProvider);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Түлхүүр цуцлагдлаа')));
      },
      onFailure: (err) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Алдаа: ${err.message}')));
      },
    );
  }
}

// ── Sub-widgets ────────────────────────────────────────────────────

class _TierInfoCard extends StatelessWidget {
  const _TierInfoCard({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return TamgaCard(
      padding: AppSpacing.cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(PhosphorIconsRegular.sealCheck, color: colorScheme.primary),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'API Эрхийн түвшин',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ...ApiKeyTier.values.map(
            (tier) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TamgaColorChip(
                    label: tier.displayName,
                    color: tier == ApiKeyTier.stable
                        ? colorScheme.primary
                        : colorScheme.secondary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      tier.description,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickstartHint extends StatelessWidget {
  const _QuickstartHint({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return TamgaCard(
      padding: AppSpacing.cardPadding,
      color: colorScheme.surfaceContainerHighest,
      child: Row(
        children: [
          Icon(
            PhosphorIconsRegular.info,
            color: colorScheme.onSurfaceVariant,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'API түлхүүр нь гадаад нэгтгэлүүдэд зориулагдсан. '
              'Түлхүүрээ нэг удаа үүсгэсний дараа буцааж харах боломжгүй.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyKeysState extends StatelessWidget {
  const _EmptyKeysState({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return TamgaCard(
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.xxxl,
        horizontal: AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIconsRegular.key,
            size: 48,
            color: colorScheme.outlineVariant,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'API түлхүүр байхгүй',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Гадаад нэгтгэлүүдэд зориулсан API түлхүүр үүсгэх',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ApiKeyCard extends StatelessWidget {
  const _ApiKeyCard({required this.apiKey, required this.onRevoke});
  final ApiKey apiKey;
  final VoidCallback onRevoke;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final l10n = AppLocalizations.of(context)!;

    final statusColor = apiKey.isActive && !apiKey.isExpired
        ? Colors.green
        : colorScheme.error;

    return TamgaCard(
      padding: AppSpacing.cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row ───────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      apiKey.name.isNotEmpty ? apiKey.name : 'Нэргүй түлхүүр',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      '${apiKey.keyPrefix}••••••••',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              TamgaColorChip(
                label: apiKey.statusText,
                color: statusColor,
                size: TamgaBadgeSize.small,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // ── Metadata row ─────────────────────────────────────
          Row(
            children: [
              _MetaChip(
                icon: PhosphorIconsRegular.stack,
                label: apiKey.tier.displayName,
              ),
              const SizedBox(width: AppSpacing.sm),
              _MetaChip(
                icon: PhosphorIconsRegular.gauge,
                label: '${apiKey.rateLimitPerMinute}/мин',
              ),
              const SizedBox(width: AppSpacing.sm),
              _MetaChip(
                icon: PhosphorIconsRegular.clock,
                label: apiKey.lastUsedText,
              ),
            ],
          ),

          // ── Permissions ──────────────────────────────────────
          if (apiKey.permissions.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: apiKey.permissions
                  .map(
                    (p) => Chip(
                      label: Text(p, style: theme.textTheme.labelSmall),
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  )
                  .toList(),
            ),
          ],

          // ── Actions ──────────────────────────────────────────
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: apiKey.isActive ? onRevoke : null,
                icon: const Icon(PhosphorIconsRegular.prohibit, size: 16),
                label: Text(l10n.generalCancel),
                style: TextButton.styleFrom(foregroundColor: colorScheme.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: AppSpacing.xs),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ── Create key dialog ──────────────────────────────────────────────

class _CreateKeyDialog extends StatefulWidget {
  const _CreateKeyDialog();

  @override
  State<_CreateKeyDialog> createState() => _CreateKeyDialogState();
}

class _CreateKeyDialogState extends State<_CreateKeyDialog> {
  final _nameController = TextEditingController();
  ApiKeyTier _selectedTier = ApiKeyTier.breeder;
  int? _expiresInDays;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return AlertDialog(
      title: const Text('Шинэ API түлхүүр'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: l10n.apiKeyNameLabel,
                hintText: 'Жишээ: CI/CD пайплайн',
              ),
              autofocus: true,
            ),
            const SizedBox(height: AppSpacing.lg),

            // Tier selection
            Text('Эрхийн түвшин', style: theme.textTheme.labelLarge),
            const SizedBox(height: AppSpacing.sm),
            ...ApiKeyTier.values.map((tier) {
              final isSelected = _selectedTier == tier;
              return ListTile(
                leading: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected
                          ? colorScheme.primary
                          : colorScheme.outline,
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? Container(
                          margin: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: colorScheme.primary,
                          ),
                        )
                      : null,
                ),
                title: Text(tier.displayName),
                subtitle: Text(
                  tier.description,
                  style: theme.textTheme.bodySmall,
                ),
                dense: true,
                contentPadding: EdgeInsets.zero,
                onTap: () => setState(() => _selectedTier = tier),
              );
            }),

            const SizedBox(height: AppSpacing.md),
            Text('Хугацаа', style: theme.textTheme.labelLarge),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<int?>(
              initialValue: _expiresInDays,
              decoration: const InputDecoration(border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: null, child: Text('Хязгааргүй')),
                DropdownMenuItem(value: 30, child: Text('30 хоног')),
                DropdownMenuItem(value: 90, child: Text('90 хоног')),
                DropdownMenuItem(value: 365, child: Text('1 жил')),
              ],
              onChanged: (v) => setState(() => _expiresInDays = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Цуцалгүй'),
        ),
        FilledButton(
          onPressed: () {
            final name = _nameController.text.trim();
            if (name.isEmpty) return;
            Navigator.pop(
              context,
              CreateApiKeyRequest(
                name: name,
                tier: _selectedTier,
                expiresInDays: _expiresInDays,
              ),
            );
          },
          child: const Text('Үүсгэх'),
        ),
      ],
    );
  }
}

// ── Key reveal dialog ──────────────────────────────────────────────

class _KeyRevealDialog extends StatelessWidget {
  const _KeyRevealDialog({required this.created});

  final ApiKeyCreated created;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return AlertDialog(
      icon: Icon(
        PhosphorIconsRegular.key,
        color: colorScheme.primary,
        size: 48,
      ),
      title: const Text('Түлхүүр үүсгэгдлээ!'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Түлхүүрийг зөвхөн энэ удаа харж болно. '
            'Нөөцөлж авна уу!',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),
          Container(
            width: double.infinity,
            padding: AppSpacing.cardPadding,
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
            ),
            child: SelectableText(
              created.fullKey,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontFamily: 'monospace',
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Түлхүүрийн эхнийх: ${created.key.keyPrefix}••••',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
      actions: [
        FilledButton.icon(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: created.fullKey));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Түлхүүр хууллагдлаа')),
            );
          },
          icon: const Icon(PhosphorIconsRegular.copySimple, size: 16),
          label: const Text('Хуулах'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(l10n.generalDone),
        ),
      ],
    );
  }
}

// ── cURL examples ──────────────────────────────────────────────────

class _CurlExamples extends StatelessWidget {
  const _CurlExamples({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return TamgaCard(
      padding: AppSpacing.cardPadding,
      color: colorScheme.surfaceContainerHighest,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIconsRegular.terminal,
                size: 20,
                color: colorScheme.primary,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Ашиглах жишээ',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _CodeBlock(
            label: 'Арга хэмжээнүүдийг жагсаах',
            code:
                'curl -H "X-API-Key: tg_xxxx..." \\\n'
                '  https://your-project.supabase.co'
                '/functions/v1/organizer-api/v1/events',
          ),
          const SizedBox(height: AppSpacing.sm),
          _CodeBlock(
            label: 'Арга хэмжээ үүсгэх',
            code:
                'curl -X POST \\\n'
                '  -H "X-API-Key: tg_xxxx..." \\\n'
                '  -H "Content-Type: application/json" \\\n'
                '  -d \'{"title":"Уралдаан","event_type":"race",'
                '"location":"Улаанбаатар"}\' \\\n'
                '  https://your-project.supabase.co'
                '/functions/v1/organizer-api/v1/events',
          ),
        ],
      ),
    );
  }
}

class _CodeBlock extends StatelessWidget {
  const _CodeBlock({required this.label, required this.code});

  final String label;
  final String code;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Container(
          width: double.infinity,
          padding: AppSpacing.cardPaddingCompact,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
          ),
          child: SelectableText(
            code,
            style: theme.textTheme.bodySmall?.copyWith(
              fontFamily: 'monospace',
              fontSize: 11,
            ),
          ),
        ),
      ],
    );
  }
}
