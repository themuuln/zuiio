import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/race_providers.dart';
import '../domain/race.dart';
import '../domain/race_entry.dart';

/// Уралдааны үр дүн засах дэлгэц.
///
/// Зохион байгуулагч дууссан уралдааны бүртгэлүүдэд
/// үр дүн (result/цаг), байр (placement), шагнал (prize)
/// оруулах/засах боломжтой.
class RaceResultsEditorScreen extends ConsumerStatefulWidget {
  const RaceResultsEditorScreen({
    required this.race,
    required this.entries,
    super.key,
  });

  /// Уралдаан (completed төлөвтэй байх ёстой).
  final Race race;

  /// Бүртгэгдсэн моридын жагсаалт (scratched биш).
  final List<RaceEntry> entries;

  @override
  ConsumerState<RaceResultsEditorScreen> createState() =>
      _RaceResultsEditorScreenState();
}

class _RaceResultsEditorScreenState
    extends ConsumerState<RaceResultsEditorScreen> {
  bool _isSaving = false;

  /// Бүртгэл тус бүрийн засварлагдсан утгууд.
  ///
  /// key: entry id, value: (result, placement, prize)
  final Map<String, ({String result, String placement, String prize})> _edits =
      {};

  @override
  void initState() {
    super.initState();
    // Анхны утгуудыг тохируулах
    for (final entry in widget.entries) {
      _edits[entry.id] = (
        result: entry.result ?? '',
        placement: entry.placement?.toString() ?? '',
        prize: entry.prize?.toString() ?? '',
      );
    }
  }

  Future<void> _saveAll() async {
    setState(() => _isSaving = true);

    try {
      final repository = ref.read(localRaceEntryRepositoryProvider);
      int successCount = 0;
      int failCount = 0;

      for (final entry in widget.entries) {
        final edit = _edits[entry.id]!;
        final result = edit.result.trim();
        final placementStr = edit.placement.trim();
        final prizeStr = edit.prize.trim();

        // Зөвхөн ялгаатай утгуудыг хадгалах
        if (result == (entry.result ?? '') &&
            placementStr == (entry.placement?.toString() ?? '') &&
            prizeStr == (entry.prize?.toString() ?? '')) {
          continue;
        }

        final placement = int.tryParse(placementStr);
        final prize = int.tryParse(prizeStr);

        final updateResult = await repository.updateResult(
          id: entry.id,
          result: result.isEmpty ? '-' : result,
          placement: placement ?? 0,
          prize: prize ?? 0,
        );

        if (updateResult.isSuccess) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (!mounted) return;

      if (failCount == 0) {
        ref.invalidate(raceEntriesProvider(widget.race.id));
        ref.invalidate(activeRaceEntriesProvider(widget.race.id));
        TamgaToast.showSuccess(context, 'Үр дүн амжилттай хадгалагдлаа');
        Navigator.of(context).pop(true);
      } else {
        TamgaToast.showError(
          context,
          '$successCount амжилттай, $failCount алдаатай',
        );
      }
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'Хадгалахад алдаа гарлаа: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Үр дүн засах'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveAll,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Хадгалах'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          // ── Race info header ──
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.race.name,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '${widget.race.type.displayName} · ${widget.race.status.displayName}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Instructions ──
          Text(
            'Морь тус бүрийн үр дүн, байр, шагналыг оруулна уу.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Entry result forms ──
          ...widget.entries.map((entry) {
            final edit = _edits[entry.id]!;
            return _EntryResultCard(
              entry: entry,
              result: edit.result,
              placement: edit.placement,
              prize: edit.prize,
              onResultChanged: (v) {
                setState(() {
                  _edits[entry.id] = (
                    result: v,
                    placement: _edits[entry.id]!.placement,
                    prize: _edits[entry.id]!.prize,
                  );
                });
              },
              onPlacementChanged: (v) {
                setState(() {
                  _edits[entry.id] = (
                    result: _edits[entry.id]!.result,
                    placement: v,
                    prize: _edits[entry.id]!.prize,
                  );
                });
              },
              onPrizeChanged: (v) {
                setState(() {
                  _edits[entry.id] = (
                    result: _edits[entry.id]!.result,
                    placement: _edits[entry.id]!.placement,
                    prize: v,
                  );
                });
              },
            );
          }),
        ],
      ),
    );
  }
}

// ── Entry Result Card ───────────────────────────────────────────

class _EntryResultCard extends StatelessWidget {
  const _EntryResultCard({
    required this.entry,
    required this.result,
    required this.placement,
    required this.prize,
    required this.onResultChanged,
    required this.onPlacementChanged,
    required this.onPrizeChanged,
  });

  final RaceEntry entry;
  final String result;
  final String placement;
  final String prize;
  final ValueChanged<String> onResultChanged;
  final ValueChanged<String> onPlacementChanged;
  final ValueChanged<String> onPrizeChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Horse info ──
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: colorScheme.secondaryContainer,
                  radius: 16,
                  child: Icon(
                    Icons.pets,
                    size: 16,
                    color: colorScheme.onSecondaryContainer,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Морь: ${entry.horseId}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (entry.jockeyName != null &&
                          entry.jockeyName!.isNotEmpty)
                        Text(
                          'Морьтон: ${entry.jockeyName}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusPill,
                    ),
                  ),
                  child: Text(
                    entry.status.displayName,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: AppSpacing.xl),

            // ── Result (time) ──
            TextFormField(
              initialValue: result,
              decoration: const InputDecoration(
                labelText: 'Үр дүн (цаг/амжилт)',
                hintText: 'Жишээ: 2:30.5',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: onResultChanged,
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Placement ──
            TextFormField(
              initialValue: placement,
              decoration: const InputDecoration(
                labelText: 'Байр',
                hintText: '1, 2, 3, ...',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: onPlacementChanged,
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Prize ──
            TextFormField(
              initialValue: prize,
              decoration: const InputDecoration(
                labelText: 'Шагнал (₮)',
                hintText: '500000',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: onPrizeChanged,
            ),
          ],
        ),
      ),
    );
  }
}
