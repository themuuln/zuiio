import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';
import '../../domain/onboarding_data.dart';
import '../widgets/onboarding_bottom_actions.dart';

/// Screen 4: Алдар цол сонгох — Rank selection.
///
/// Displays the Mongolian uyach rank hierarchy from district to state level.
/// Optional step — user can skip to keep 'Адуучин' (no rank).
class RankSelectionPage extends StatefulWidget {
  const RankSelectionPage({
    required this.onBack,
    required this.onContinue,
    this.initialRank,
    super.key,
  });

  final VoidCallback onBack;
  final void Function(String rank) onContinue;
  final String? initialRank;

  @override
  State<RankSelectionPage> createState() => _RankSelectionPageState();
}

class _RankSelectionPageState extends State<RankSelectionPage> {
  String? _selectedRank;

  @override
  void initState() {
    super.initState();
    _selectedRank = widget.initialRank;
  }

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Column(
      children: [
        // ── Header ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.page,
            AppSpacing.lg,
            0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Title
              Text(
                'Алдар цол',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w600,
                  color: tc.onSurface,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Таны уяачийн цолыг сонгоно уу',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w400,
                  color: tc.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // ── Rank list ──
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              0,
              AppSpacing.lg,
              AppSpacing.xxl * 4 + AppSpacing.xs,
            ),
            itemCount: UserRank.values.length,
            separatorBuilder: (_, _) => Divider(
              height: AppSpacing.hairline,
              thickness: AppSpacing.hairline,
              color: tc.outline,
            ),
            itemBuilder: (context, index) {
              final rank = UserRank.values[index];
              final isSelected = rank.key == _selectedRank;

              return InkWell(
                onTap: () => setState(() => _selectedRank = rank.key),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppSpacing.md + AppSpacing.xs,
                    horizontal: AppSpacing.xs,
                  ),
                  color: isSelected ? tc.primary.withValues(alpha: 0.08) : null,
                  child: Row(
                    children: [
                      // Emoji badge
                      Text(rank.emoji, style: const TextStyle(fontSize: 28)),
                      const SizedBox(width: AppSpacing.md + AppSpacing.xs),

                      // Text content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              rank.displayName,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: isSelected ? tc.primary : tc.onSurface,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            Text(
                              rank.subtitle,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w400,
                                color: tc.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Check icon
                      if (isSelected)
                        Icon(Icons.check, size: 20, color: tc.primary)
                      else
                        Icon(
                          Icons.chevron_right,
                          size: 20,
                          color: tc.onSurfaceVariant,
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // ── Bottom actions — back + continue ──
        OnboardingBottomActions(
          onBack: widget.onBack,
          primaryLabel: 'Үргэлжлүүлэх',
          onPrimary: () => widget.onContinue(_selectedRank ?? 'no_rank'),
          secondaryLabel: 'Алгасах',
          onSecondary: () => widget.onContinue('no_rank'),
        ),
      ],
    );
  }
}
