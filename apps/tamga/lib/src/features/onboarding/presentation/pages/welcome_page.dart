import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';

/// Screen 1: Тавтай морил — Full-bleed steppe photo welcome.
///
/// Design: cinematic steppe landscape hero with dark scrim,
/// centered Tamga logo + serif title, 3 green feature icons,
/// step dots, and bottom-anchored orange CTA.
class WelcomePage extends StatelessWidget {
  const WelcomePage({required this.onContinue, super.key});

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    final size = MediaQuery.sizeOf(context);

    return Stack(
      children: [
        // ── Full-bleed steppe photo ──
        Positioned.fill(
          child: CachedNetworkImage(
            imageUrl:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAMdai4zpOT5PQh3Ni4IdsukHc2KHgfWb_NobAqjbttd6tM0mW3vlkz9hGmlgW7TgG-G7Uogn-Yw1BU0vNIhe3SZzYGbz7Y-ftmgj4yNzGtUTHsK73b01uEtlHS9Msm3NjfTAoBdUlcC9lBDzso05n-W073g_etOiaVyCUN24_f3yLAoQEs1_kT_mzOMADRHa-Oo30fu0B8Y8omHNsKobDN2loQCU21LnVEo3FbU-5C1i1ZACrx0kfFBPpqRuB5a57_yOsw1JlYNg',
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => Container(
              color: tc.surfaceContainerLow,
              child: const Center(
                child: Icon(Icons.landscape, size: 80, color: Colors.white24),
              ),
            ),
          ),
        ),

        // ── Dark gradient scrim ──
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.1),
                  Colors.black.withValues(alpha: 0.5),
                ],
                stops: const [0.3, 0.85],
              ),
            ),
          ),
        ),

        // ── Content ──
        Positioned.fill(
          child: SafeArea(
            top: false,
            child: Column(
              children: [
                // Spacer top
                SizedBox(height: size.height * 0.12),

                // Logo
                // Tamga stamp logo (circle + vertical line + dots)
                const _TamgaStampLogo(size: 88),
                const SizedBox(height: AppSpacing.xl),

                // Brand title — serif
                const Text(
                  'Тамга',
                  style: TextStyle(
                    fontFamily: 'Playfair Display',
                    fontSize: 44,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: 1,
                    shadows: [Shadow(blurRadius: 8, color: Colors.black26)],
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // Tagline
                Text(
                  'Морины тань цорын ганц үнэн эх сурвалж',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                    color: Colors.white.withValues(alpha: 0.9),
                    height: 1.4,
                  ),
                ),

                const Spacer(),

                // ── 3 Feature icons ──
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xxxl,
                  ),
                  child: Column(
                    children: [
                      _FeatureRow(
                        icon: Icons.account_tree,
                        title: 'Удам угшил',
                        subtitle: 'Баталгаатай удмын сан',
                        color: tc.tertiary,
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      _FeatureRow(
                        icon: Icons.monitor_heart_outlined,
                        title: 'Эрүүл мэнд',
                        subtitle: 'Вакцин болон эмчилгээний түүх',
                        color: tc.tertiary,
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      _FeatureRow(
                        icon: Icons.storefront_outlined,
                        title: 'Зах зээл',
                        subtitle: 'Найдвартай худалдаа наймаа',
                        color: tc.tertiary,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xxxxl),

                // ── CTA area ──
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xxl,
                  ),
                  child: Column(
                    children: [
                      // Primary button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: FilledButton(
                          onPressed: onContinue,
                          child: const Text(
                            'Эхлэх',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // Social proof
                      Text(
                        '50,000+ монгол адуучин итгэж байна',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w400,
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                    ],
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

/// Feature row with green icon + white text.
class _FeatureRow extends StatelessWidget {
  const _FeatureRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Icon
        SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 28, color: color),
        ),
        const SizedBox(width: AppSpacing.lg),

        // Text
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Tamga stamp logo — circle border with vertical line + dots.
/// Matches the Stitch design's brand mark.
class _TamgaStampLogo extends StatelessWidget {
  const _TamgaStampLogo({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(size: Size(size, size), painter: _StampPainter());
  }
}

class _StampPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Outer circle
    final circlePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawCircle(center, radius - 2, circlePaint);

    // Vertical line (center)
    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(center.dx, center.dy - radius * 0.45),
      Offset(center.dx, center.dy + radius * 0.45),
      linePaint,
    );

    // Top dot
    final dotPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(center.dx, center.dy - radius * 0.45),
      4,
      dotPaint,
    );

    // Bottom dot
    canvas.drawCircle(
      Offset(center.dx, center.dy + radius * 0.45),
      4,
      dotPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
