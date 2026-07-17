/// Морины мэдээлэл tab.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../documents/presentation/horse_documents_screen.dart';
import '../../market/application/market_providers.dart';
import '../domain/horse_record.dart';
import 'co_ownership_sheet.dart';

/// Морины мэдээлэл tab.
class HorseInfoTab extends ConsumerWidget {
  const HorseInfoTab({required this.horse, super.key});

  /// Морийн мэдээлэл.
  final HorseRecord horse;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final certificateAsync = ref.watch(digitalCertificateProvider(horse.id));

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.xxxxl,
      ),
      children: [
        // ownership badge
        _OwnershipBadge(horse: horse, colorScheme: colorScheme),
        const SizedBox(height: AppSpacing.lg),

        // quick stats row
        _QuickStatsRow(horse: horse, colorScheme: colorScheme),
        const SizedBox(height: AppSpacing.xl),

        // details card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Дэлгэрэнгүй',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                _DetailRow(label: 'Нэр:', value: horse.name),
                _DetailRow(label: 'Хүйс:', value: horse.gender.displayName),
                _DetailRow(
                  label: 'Зүс:',
                  value: horse.coat.isEmpty ? '-' : horse.coat,
                ),
                _DetailRow(
                  label: 'Төрсөн он:',
                  value: '${horse.birthYear} (${horse.age} настай)',
                ),
                _DetailRow(
                  label: 'Харилцаа:',
                  value: horse.relationLabel.isEmpty
                      ? '-'
                      : horse.relationLabel,
                ),
                _DetailRow(label: 'Шагнал:', value: '${horse.awardCount}'),
                _DetailRow(label: 'Үр төл:', value: '${horse.offspringCount}'),
                if (horse.lineageRootId != null)
                  _DetailRow(label: 'Угшил:', value: horse.lineageRootId!),
                if (horse.microchipId != null && horse.microchipId!.isNotEmpty)
                  _DetailRow(label: 'Микрочип:', value: horse.microchipId!),
                if (horse.registrationNo != null &&
                    horse.registrationNo!.isNotEmpty)
                  _DetailRow(label: 'Бүртгэл:', value: horse.registrationNo!),
                if (horse.breedLineage != null)
                  _DetailRow(
                    label: 'Үүлдэр:',
                    value: horse.breedLineage!.displayName,
                  ),
                if (horse.coatColor != null)
                  _DetailRow(
                    label: 'Зүс (нэршил):',
                    value: horse.coatColor!.displayName,
                  ),
                if (horse.region != null && horse.region!.isNotEmpty)
                  _DetailRow(label: 'Нутаг:', value: horse.region!),
                if (horse.sum != null && horse.sum!.isNotEmpty)
                  _DetailRow(label: 'Сум:', value: horse.sum!),
                if (horse.tamgaBrandClan != null &&
                    horse.tamgaBrandClan!.isNotEmpty)
                  _DetailRow(
                    label: 'Тамганы овог:',
                    value: horse.tamgaBrandClan!,
                  ),
                if (horse.tamgaBrandGeneration != null)
                  _DetailRow(
                    label: 'Тамганы үе:',
                    value: '${horse.tamgaBrandGeneration}',
                  ),
              ],
            ),
          ),
        ),

        // owner stamp
        if (horse.ownerStampSvg != null && horse.ownerStampSvg!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.lg),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.verified,
                        size: 20,
                        color: colorScheme.primary,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        'Тамга (Ownership Stamp)',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHighest.withValues(
                          alpha: 0.3,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: SvgPicture.string(
                        horse.ownerStampSvg!,
                        width: 120,
                        height: 120,
                        placeholderBuilder: (_) => const SizedBox(
                          width: 120,
                          height: 120,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],

        // certificate status
        certificateAsync.when(
          data: (cert) {
            if (cert == null) return const SizedBox.shrink();
            return Padding(
              padding: const EdgeInsets.only(top: AppSpacing.lg),
              child: Card(
                child: ListTile(
                  leading: Icon(
                    Icons.verified,
                    color: TamgaColors.of(context).tertiary,
                  ),
                  title: const Text('Дижитал гэрчилгээ'),
                  subtitle: Text('Баталгаажсан: ${cert.issuer}'),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
            );
          },
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
        ),

        // notes
        if (horse.notes.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.lg),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Тэмдэглэл',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(horse.notes, style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
          ),
        ],

        // documents button
        const SizedBox(height: AppSpacing.lg),
        OutlinedButton.icon(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => HorseDocumentsScreen(horse: horse),
              ),
            );
          },
          icon: const Icon(Icons.folder_outlined),
          label: const Text('Баримтууд'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // co-ownership button
        const SizedBox(height: AppSpacing.xl),
        OutlinedButton.icon(
          onPressed: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              builder: (_) =>
                  CoOwnershipSheet(horseId: horse.id, horseName: horse.name),
            );
          },
          icon: const Icon(Icons.people_outline),
          label: const Text('Хамтран эзэмшигчид'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
          ),
        ),
      ],
    );
  }
}

// ── Туслах дүрсүүд ──────────────────────────────────────────────────

class _OwnershipBadge extends StatelessWidget {
  const _OwnershipBadge({required this.horse, required this.colorScheme});
  final HorseRecord horse;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final color = horse.isOwnedByHousehold
        ? colorScheme.tertiaryContainer
        : colorScheme.secondaryContainer;
    final textColor = horse.isOwnedByHousehold
        ? colorScheme.onTertiaryContainer
        : colorScheme.onSecondaryContainer;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        horse.isOwnedByHousehold ? 'Өрхийн морь' : 'Гаднах морь',
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _QuickStatsRow extends StatelessWidget {
  const _QuickStatsRow({required this.horse, required this.colorScheme});
  final HorseRecord horse;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _StatCard(
          label: 'Нас',
          value: '${horse.age}',
          color: colorScheme.primaryContainer,
          textColor: colorScheme.onPrimaryContainer,
        ),
        const SizedBox(width: AppSpacing.md),
        _StatCard(
          label: 'Шагнал',
          value: '${horse.awardCount}',
          color: colorScheme.secondaryContainer,
          textColor: colorScheme.onSecondaryContainer,
        ),
        const SizedBox(width: AppSpacing.md),
        _StatCard(
          label: 'Үр төл',
          value: '${horse.offspringCount}',
          color: colorScheme.tertiaryContainer,
          textColor: colorScheme.onTertiaryContainer,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.textColor,
  });
  final String label;
  final String value;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: textColor.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
