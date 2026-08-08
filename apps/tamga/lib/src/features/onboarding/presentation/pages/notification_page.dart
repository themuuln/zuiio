import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';

/// Screen 5: Мэдэгдэл — Notification permission priming.
///
/// Design: bell icon in orange circle, bold headline, muted description,
/// 3 green checkmark benefits, orange CTA + skip link.
class NotificationPage extends StatefulWidget {
  const NotificationPage({
    required this.onBack,
    required this.onStart,
    required this.onSkip,
    super.key,
  });

  final VoidCallback onBack;
  final VoidCallback onStart;
  final VoidCallback onSkip;

  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  bool _permissionRequested = false;

  Future<void> _requestPermission() async {
    if (_permissionRequested) return;

    final plugin = FlutterLocalNotificationsPlugin();
    final android = plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await android?.requestNotificationsPermission();

    final ios = plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >();
    await ios?.requestPermissions(alert: true, badge: true, sound: true);

    setState(() => _permissionRequested = true);
  }

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
                'Мэдэгдэл',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w600,
                  color: tc.onSurface,
                  letterSpacing: 0.37,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Хэрэгтэй мэдээгээ цаг тухайд нь аваарай',
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
                // Bell icon in orange circle
                Container(
                  width: 128,
                  height: 128,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: tc.primary.withValues(alpha: 0.1),
                  ),
                  child: Icon(
                    Icons.notifications_active,
                    size: 64,
                    color: tc.primary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxxl),

                // Headline
                Text(
                  'Хэрэгтэй мэдээгээ цаг тухайд нь аваарай',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: tc.onSurface,
                    letterSpacing: 0.35,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // Description
                Text(
                  'Вакцины сануулга, зах зээлийн шинэчлэл, уралдааны мэдээ',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w400,
                    color: tc.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxxl),

                // Benefits — green checkmarks
                _BenefitRow(text: 'Вакцин болон эмчилгээний сануулга'),
                const SizedBox(height: AppSpacing.lg),
                _BenefitRow(text: 'Зах зээлийн шинэ мэдээ'),
                const SizedBox(height: AppSpacing.lg),
                _BenefitRow(text: 'Уралдааны цагийн хуваарь'),
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
                        onPressed: widget.onBack,
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
                          onPressed: () async {
                            await _requestPermission();
                            widget.onStart();
                          },
                          child: Text(
                            _permissionRequested ? 'Үргэлжлүүлэх' : 'Зөвшөөрөх',
                            style: const TextStyle(
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
                    onPressed: widget.onSkip,
                    child: Text(
                      'Одоохондоо үгүй',
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
          decoration: BoxDecoration(shape: BoxShape.circle, color: tc.tertiary),
          child: const Icon(Icons.check, size: 16, color: Colors.white),
        ),
        const SizedBox(width: AppSpacing.lg),

        // Text
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              color: tc.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}
