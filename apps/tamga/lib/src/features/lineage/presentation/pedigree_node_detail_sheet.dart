/// Овгийн модны зангилаа дээр дарахад гарч ирэх дэлгэрэнгүй sheet.
library;

import 'package:flutter/material.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';

import '../../../core/widgets/tamga_bottom_sheet.dart';
import '../../../app/theme/app_spacing.dart';
import '../application/pedigree_layout.dart';
import 'pedigree_tree_content.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';

/// Удам модны зангилааны мэдээллийг smooth sheet хэлбэрээр харуулна.
class PedigreeNodeDetailSheet extends StatelessWidget {
  const PedigreeNodeDetailSheet({required this.node, super.key});

  final PedigreeNodeVm node;

  bool get _isStallion => node.sex == 'stallion';
  bool get _isMare => node.sex == 'mare';

  String? get _sexEmoji {
    if (_isStallion) return '🐎';
    if (_isMare) return '🐴';
    return null;
  }

  Color _avatarBg(ColorScheme colorScheme) {
    if (node.photoUrl != null) return Colors.transparent;
    if (_isStallion) return colorScheme.primaryContainer;
    if (_isMare) return colorScheme.tertiaryContainer;
    return colorScheme.surfaceContainerHighest;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return TamgaBottomSheet(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header ──
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAvatar(theme, colorScheme),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            node.name,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        NodeBadge(
                          label: node.isOwnedByHousehold ? 'Өрхийн' : 'Гаднах',
                          color: node.isOwnedByHousehold
                              ? colorScheme.tertiaryContainer
                              : colorScheme.secondaryContainer,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      '${node.relationLabel} • ${node.coat} • ${node.birthYear}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (node.region != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Row(
                        children: [
                          Icon(
                            PhosphorIconsRegular.mapPin,
                            size: 14,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            node.region!,
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // ── Stats grid ──
          _buildStatsGrid(context, theme, colorScheme),
          const SizedBox(height: AppSpacing.lg),

          // ── Additional info chips ──
          if (node.isRoot || node.hiddenBranchCount > 0)
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                if (node.isRoot)
                  _InfoChip(
                    icon: PhosphorIconsRegular.sparkle,
                    label: 'Root',
                    color: colorScheme.primaryContainer,
                    textColor: colorScheme.onPrimaryContainer,
                  ),
                if (node.hiddenBranchCount > 0)
                  _InfoChip(
                    icon: PhosphorIconsRegular.treeStructure,
                    label: '${node.hiddenBranchCount} далд салбар',
                    color: colorScheme.secondaryContainer,
                    textColor: colorScheme.onSecondaryContainer,
                  ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildAvatar(ThemeData theme, ColorScheme colorScheme) {
    const radius = 32.0;

    if (node.photoUrl != null && node.photoUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: colorScheme.surfaceContainerHighest,
        backgroundImage: NetworkImage(node.photoUrl!),
      );
    }

    final emoji = _sexEmoji;
    return CircleAvatar(
      radius: radius,
      backgroundColor: _avatarBg(colorScheme),
      child: emoji != null
          ? Text(emoji, style: const TextStyle(fontSize: 28))
          : Text(
              node.name.characters.first,
              style: theme.textTheme.titleMedium?.copyWith(
                color: colorScheme.onPrimaryContainer,
                fontWeight: FontWeight.w800,
              ),
            ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, ThemeData theme, ColorScheme colorScheme) {
    final hasSpeed = node.speedIndex != null;
    final hasTamga = node.tamgaNo != null && node.tamgaNo!.isNotEmpty;

    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: PhosphorIconsRegular.trophy,
            value: '${node.awardCount}',
            label: AppLocalizations.of(context)!.horseInfoAwards,
            colorScheme: colorScheme,
            theme: theme,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _StatCard(
            icon: PhosphorIconsRegular.heart,
            value: '${node.offspringCount}',
            label: AppLocalizations.of(context)!.horseInfoOffspring,
            colorScheme: colorScheme,
            theme: theme,
          ),
        ),
        if (hasSpeed) ...[
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _StatCard(
              icon: PhosphorIconsRegular.gauge,
              value: node.speedIndex!.toStringAsFixed(1),
              label: 'км/мин',
              colorScheme: colorScheme,
              theme: theme,
            ),
          ),
        ],
        if (hasTamga) ...[
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _StatCard(
              icon: PhosphorIconsRegular.tag,
              value: node.tamgaNo!,
              label: AppLocalizations.of(context)!.stampScreenTitle,
              colorScheme: colorScheme,
              theme: theme,
            ),
          ),
        ],
      ],
    );
  }
}

/// Стат кард — icon + value + label босоо байрлалтай.
class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.colorScheme,
    required this.theme,
  });

  final IconData icon;
  final String value;
  final String label;
  final ColorScheme colorScheme;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.md,
        horizontal: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
          const SizedBox(height: AppSpacing.xs),
          Text(
            value,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Жижиг мэдээллийг чип хэлбэрээр харуулах.
class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.textColor,
  });

  final IconData icon;
  final String label;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: AppSpacing.xs),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
