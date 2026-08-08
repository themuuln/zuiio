import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';

/// Screen 6: Синк тохиргоо — Cloud sync setup.
///
/// Design: cloud/sync icon in green circle, headline, description,
/// 2 green checkmark benefits, "Онлайн" indicator,
/// "Эхлэх" final CTA + "Дараа тохируулъя" skip link.
/// All 6 step dots filled.
class SyncSetupPage extends StatelessWidget {
  const SyncSetupPage({
    required this.onBack,
    required this.onStart,
    required this.onLater,
    super.key,
  });

  final VoidCallback onBack;
  final VoidCallback onStart;
  final VoidCallback onLater;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Column(
      children: [
        // ── Header ──
        const SizedBox(height: AppSpacing.page),
        Center(
          child: Column(
            children: [
              Text(
                'Синк тохиргоо',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w600,
                  color: tc.onSurface,
                  letterSpacing: 0.37,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Өөрийнхөө мэдээллийг хянах боломжтой',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w400,
                  color: tc.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),

        // ── Content ──
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxxl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Cloud sync icon in green circle
                Container(
                  width: 128,
                  height: 128,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: tc.tertiary.withValues(alpha: 0.1),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Icon(Icons.cloud_sync, size: 64, color: tc.tertiary),
                      // Online indicator dot
                      Positioned(
                        bottom: 8,
                        right: 8,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                          ),
                          child: Center(
                            child: CircleAvatar(
                              radius: 7,
                              backgroundColor: tc.tertiary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xxxl),

                // Headline
                Text(
                  'Өөрийнхөө мэдээллийг хянах боломжтой',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: tc.onSurface,
                    letterSpacing: 0.36,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // Description
                Text(
                  'Таны морьдын мэдээлэл аюулгүй хадгалагдаж, бүх төхөөрөмж дээр шинэчлэгдэнэ.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w400,
                    color: tc.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxxl),

                // Benefits
                _BenefitRow(text: 'Нэмэлт төхөөрөмжүүдэд нэвтрэх боломж'),
                const SizedBox(height: AppSpacing.lg),
                _BenefitRow(text: 'Мэдээлэл алдах эрсдэл бага'),
              ],
            ),
          ),
        ),

        // ── Bottom actions — back + continue ──
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.sm,
              AppSpacing.lg,
              AppSpacing.lg,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 48,
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: onBack,
                        icon: Icon(Icons.chevron_left, color: tc.primary),
                        style: IconButton.styleFrom(
                          backgroundColor: tc.surfaceContainerLow,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: FilledButton(
                          onPressed: onStart,
                          child: const Text(
                            'Эхлэх',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: TextButton(
                    onPressed: onLater,
                    child: Text(
                      'Дараа тохируулъя',
                      style: TextStyle(
                        fontSize: 17,
                        color: tc.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Benefit row with green checkmark circle + text.
class _BenefitRow extends StatelessWidget {
  const _BenefitRow({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Row(
      children: [
        // Green checkmark circle
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: tc.surfaceContainerHigh,
          ),
          child: Icon(Icons.check_circle, size: 24, color: tc.tertiary),
        ),
        const SizedBox(width: AppSpacing.md),

        // Text
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w400,
              color: tc.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}
