import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/leaderboard_providers.dart';
import '../domain/leaderboard_entry.dart';

/// Үржүүлэгчийн чансаа (leaderboard) хуудас.
///
/// Үржүүлэгчдийг нийт оноогоор эрэмбэлж харуулна.
/// Аймаг болон хугацаагаар шүүх боломжтой.
class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final regionsAsync = ref.watch(leaderboardAvailableRegionsProvider);
    final selectedRegion = ref.watch(leaderboardRegionProvider);
    final selectedTimePeriod = ref.watch(leaderboardTimePeriodProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Үржүүлэгчийн чансаа'),
      ),
      body: Column(
        children: [
          // ── Шүүлтүүрүүд ──
          _FilterSection(
            regionsAsync: regionsAsync,
            selectedRegion: selectedRegion,
            selectedTimePeriod: selectedTimePeriod,
            onRegionChanged: (region) {
              ref.read(leaderboardRegionProvider.notifier).state = region;
            },
            onTimePeriodChanged: (period) {
              ref.read(leaderboardTimePeriodProvider.notifier).state = period;
            },
          ),

          // ── Чансааны жагсаалт ──
          Expanded(
            child: leaderboardAsync.when(
              data: (entries) {
                if (entries.isEmpty) {
                  return const Center(
                    child: Text(
                      'Шүүлтүүрт тохирох үржүүлэгч олдсонгүй.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.sm,
                  ),
                  itemCount: entries.length,
                  itemBuilder: (context, index) {
                    return _LeaderboardRow(entry: entries[index]);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => TamgaErrorWidget(
                message: 'Чансаа ачаалахад алдаа гарлаа',
                onRetry: () => ref.invalidate(leaderboardProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// ── Шүүлтүүрийн хэсэг ────────────────────────────────────────────

class _FilterSection extends StatelessWidget {
  const _FilterSection({
    required this.regionsAsync,
    required this.selectedRegion,
    required this.selectedTimePeriod,
    required this.onRegionChanged,
    required this.onTimePeriodChanged,
  });

  final AsyncValue<List<String>> regionsAsync;
  final String selectedRegion;
  final LeaderboardTimePeriod selectedTimePeriod;
  final ValueChanged<String> onRegionChanged;
  final ValueChanged<LeaderboardTimePeriod> onTimePeriodChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Аймгийн шүүлтүүр ──
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 18,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Аймаг:',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: regionsAsync.when(
                  data: (regions) {
                    return Container(
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: theme.colorScheme.outline,
                        ),
                        borderRadius: BorderRadius.circular(
                          AppSpacing.cornerRadiusSmall,
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedRegion.isEmpty ? null : selectedRegion,
                          isExpanded: true,
                          isDense: true,
                          hint: const Text('Бүгд'),
                          items: regions
                              .map(
                                (r) =>
                                    DropdownMenuItem(value: r, child: Text(r)),
                              )
                              .toList(),
                          onChanged: (value) {
                            onRegionChanged(value ?? '');
                          },
                        ),
                      ),
                    );
                  },
                  loading: () => const SizedBox(
                    height: 40,
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                  error: (_, _) => const SizedBox(
                    height: 40,
                    child: Center(child: Text('Алдаа')),
                  ),
                ),
              ),
              if (selectedRegion.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () => onRegionChanged(''),
                  tooltip: 'Арилгах',
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // ── Хугацааны шүүлтүүр ──
          Row(
            children: [
              Icon(
                Icons.schedule_outlined,
                size: 18,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Хугацаа:',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              ...LeaderboardTimePeriod.values.map((period) {
                final isSelected = period == selectedTimePeriod;
                return Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.xs),
                  child: FilterChip(
                    label: Text(period.label),
                    selected: isSelected,
                    onSelected: (_) => onTimePeriodChanged(period),
                  ),
                );
              }),
            ],
          ),
        ],
      ),
    );
  }
}

/// ── Чансааны мөр (нэг үржүүлэгч) ─────────────────────────────────

class _LeaderboardRow extends StatelessWidget {
  const _LeaderboardRow({required this.entry});

  final LeaderboardEntry entry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Чансааны дугаар ──
            SizedBox(
              width: 36,
              child: _buildRankBadge(theme),
            ),
            const SizedBox(width: AppSpacing.md),

            // ── Үржүүлэгчийн мэдээлэл ──
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Нэр
                  Text(
                    entry.breederName,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),

                  // Байршил (байвал)
                  if (entry.locationLabel.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      entry.locationLabel,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  const SizedBox(height: AppSpacing.sm),

                  // ── Үзүүлэлтүүд ──
                  _MetricsRow(entry: entry, theme: theme),
                ],
              ),
            ),

            const SizedBox(width: AppSpacing.sm),

            // ── Нийт оноо ──
            Column(
              children: [
                Text(
                  '${entry.totalScore}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.primary,
                  ),
                ),
                Text(
                  'оноо',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRankBadge(ThemeData theme) {
    // Эхний 3 байранд өнгөт тэмдэг
    final Color bgColor;
    final Color textColor;
    if (entry.rank == 1) {
      bgColor = const Color(0xFFFFD700); // Алт
      textColor = Colors.black;
    } else if (entry.rank == 2) {
      bgColor = const Color(0xFFC0C0C0); // Мөнгө
      textColor = Colors.black;
    } else if (entry.rank == 3) {
      bgColor = const Color(0xFFCD7F32); // Хүрэл
      textColor = Colors.white;
    } else {
      bgColor = theme.colorScheme.surfaceContainerHighest;
      textColor = theme.colorScheme.onSurfaceVariant;
    }

    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
      ),
      alignment: Alignment.center,
      child: Text(
        '${entry.rank}',
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 14,
          color: textColor,
        ),
      ),
    );
  }
}

/// ── Үзүүлэлтүүдийн мөр ───────────────────────────────────────────

class _MetricsRow extends StatelessWidget {
  const _MetricsRow({required this.entry, required this.theme});

  final LeaderboardEntry entry;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.md,
      runSpacing: AppSpacing.xs,
      children: [
        _MetricChip(
          icon: Icons.list_alt_outlined,
          label: '${entry.activeListingsCount}',
          tooltip: 'Идэвхтэй зарууд',
          theme: theme,
        ),
        _MetricChip(
          icon: Icons.check_circle_outline,
          label: '${entry.completedSalesCount}',
          tooltip: 'Борлуулалт',
          theme: theme,
        ),
        _MetricChip(
          icon: Icons.star_outline,
          label: entry.averageRating > 0
              ? entry.averageRating.toStringAsFixed(1)
              : '—',
          tooltip: 'Дундаж үнэлгээ',
          theme: theme,
        ),
        _MetricChip(
          icon: Icons.pets_outlined,
          label: '${entry.horseCount}',
          tooltip: 'Морь',
          theme: theme,
        ),
      ],
    );
  }
}

/// ── Метрикийн чип ─────────────────────────────────────────────────

class _MetricChip extends StatelessWidget {
  const _MetricChip({
    required this.icon,
    required this.label,
    required this.tooltip,
    required this.theme,
  });

  final IconData icon;
  final String label;
  final String tooltip;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 2),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
