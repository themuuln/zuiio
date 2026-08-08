/// Морины нийтлэг профайл дэлгэц.
///
/// Зах зээл дээрх морины тэмцээний үр дүн, эзэмшлийн түүхийг харуулна.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../app/theme/app_spacing.dart';
import '../../events/application/tournament_providers.dart';
import '../../events/domain/tournament_profile.dart';
import '../domain/horse_record.dart';

/// Морины нийтлэг профайл дэлгэц.
class PublicHorseProfileScreen extends ConsumerWidget {
  const PublicHorseProfileScreen({required this.horse, super.key});

  /// Морийн мэдээлэл.
  final HorseRecord horse;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(tournamentProfileProvider(horse.id));
    final profile = profileAsync.valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: Text(horse.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              final url = 'https://tamga.mn/horse/${horse.id}';
              final text = 'Check out this horse on Tamga: $url';
              final subject = 'Tamga — ${horse.name}';
              Share.share(text, subject: subject);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Морины зураг болон үндсэн мэдээлэл
            _HorseHeader(horse: horse),
            const SizedBox(height: AppSpacing.xxl),

            // Тэмцээний амжилт
            if (profile != null) ...[
              _TournamentStats(profile: profile),
              const SizedBox(height: AppSpacing.xxl),
            ],

            // Сүүлийн үр дүнгүүд
            if (profile != null && profile.recentResults.isNotEmpty) ...[
              _RecentResults(results: profile.recentResults),
              const SizedBox(height: AppSpacing.xxl),
            ],

            // Морины тухай
            _HorseInfo(horse: horse),
          ],
        ),
      ),
    );
  }
}

/// Морины толгой хэсэг (зураг + нэр).
class _HorseHeader extends StatelessWidget {
  const _HorseHeader({required this.horse});

  final HorseRecord horse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Row(
          children: [
            // Зураг
            CircleAvatar(
              radius: 40,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Text(
                horse.name.substring(0, 1).toUpperCase(),
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.lg),
            // Мэдээлэл
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    horse.name,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    horse.coat.isNotEmpty
                        ? horse.coat
                        : 'Үүлдэр мэдээлэл байхгүй',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Нас: ${horse.age}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Тэмцээний тоо баримт.
class _TournamentStats extends StatelessWidget {
  const _TournamentStats({required this.profile});

  final TournamentProfile profile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Тэмцээний амжилт',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: 'Уралдаан',
                  value: '${profile.totalRaces}',
                  icon: Icons.flag_outlined,
                ),
                _StatItem(
                  label: 'Ялалт',
                  value: '${profile.firstPlace}',
                  icon: Icons.emoji_events_outlined,
                  color: theme.colorScheme.primary,
                ),
                _StatItem(
                  label: 'Ялалтын хувь',
                  value: '${profile.winRate.toStringAsFixed(0)}%',
                  icon: Icons.percent_outlined,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: '2-р байр',
                  value: '${profile.secondPlace}',
                  icon: Icons.workspace_premium_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                _StatItem(
                  label: '3-р байр',
                  value: '${profile.thirdPlace}',
                  icon: Icons.workspace_premium_outlined,
                  color: Color(0xFFCD7F32),
                ),
                _StatItem(
                  label: 'Шагнал',
                  value: profile.prizeMoneyText,
                  icon: Icons.payments_outlined,
                ),
              ],
            ),
            if (profile.bestAchievement != null) ...[
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.star_outline,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Хамгийн сайн амжилт: ${profile.bestAchievement}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Тоо баримтын нэг нүх.
class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
    this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final itemColor = color ?? theme.colorScheme.primary;

    return Column(
      children: [
        Icon(icon, color: itemColor, size: 28),
        const SizedBox(height: AppSpacing.xs),
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: itemColor,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

/// Сүүлийн үр дүнгүүд.
class _RecentResults extends StatelessWidget {
  const _RecentResults({required this.results});

  final List<TournamentResult> results;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Сүүлийн үр дүнгүүд',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ...results.map(
              (result) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Row(
                  children: [
                    // Байрын тэмдэг
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: result.isPodium
                            ? (result.place == 1
                                  ? theme.colorScheme.primary
                                  : result.place == 2
                                  ? theme.colorScheme.onSurfaceVariant
                                  : Color(0xFFCD7F32))
                            : theme.colorScheme.surfaceContainerHighest,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${result.place}',
                          style: TextStyle(
                            color: result.isPodium ? Colors.white : null,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    // Арга хэмжээний нэр
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            result.eventName,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            '${result.placeText} • ${result.participants} оролцогч',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Шагналын мөнгө
                    if (result.prizeText.isNotEmpty)
                      Text(
                        result.prizeText,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Морины нэмэлт мэдээлэл.
class _HorseInfo extends StatelessWidget {
  const _HorseInfo({required this.horse});

  final HorseRecord horse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Морины тухай',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            _InfoRow(label: 'Нэр', value: horse.name),
            _InfoRow(
              label: 'Үүлдэр',
              value: horse.coat.isNotEmpty ? horse.coat : 'Мэдээлэл байхгүй',
            ),
            _InfoRow(label: 'Нас', value: '${horse.age}'),
            _InfoRow(
              label: 'Өмчлөл',
              value: horse.isOwnedByHousehold ? 'Өөрийн' : 'Хамтран',
            ),
            if (horse.notes.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                'Нэмэлт тэмдэглэл',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                horse.notes,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Мэдээллийн нэг мөр.
class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
