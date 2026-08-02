import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';

/// Эхлэх туршилтын турийн түлхүүр нэр.
const _kTourCompletedKey = 'feature_tour_completed';

/// Feature tour-ийг дуусгасан эсэхийг шалгана.
Future<bool> isFeatureTourCompleted() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(_kTourCompletedKey) ?? false;
}

/// Feature tour-ийг дуусгасан тэмдэгтийг хадгална.
Future<void> markFeatureTourCompleted() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(_kTourCompletedKey, true);
}

/// ─────────────────────────────────────────────
///  Feature Tour Overlay
/// ─────────────────────────────────────────────

/// Навигацийн мөр бүрийг харуулдаг тур.
///
/// Эхлэх туршилт дуусмагц SharedPreferences-д хадгалагдана.
/// Дараагийн удаа харагдахгүй.
class FeatureTour extends StatefulWidget {
  const FeatureTour({required this.onCompleted, super.key});

  /// Тур дуусмагц дуудагдана.
  final VoidCallback onCompleted;

  @override
  State<FeatureTour> createState() => _FeatureTourState();
}

class _FeatureTourState extends State<FeatureTour>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;
  int _currentStep = 0;

  static const _steps = _TourStep.values;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeIn = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_currentStep < _steps.length - 1) {
      _controller.reverse().then((_) {
        setState(() => _currentStep++);
        _controller.forward();
      });
    } else {
      _complete();
    }
  }

  void _skip() {
    _controller.reverse().then((_) => _complete());
  }

  void _complete() {
    markFeatureTourCompleted();
    widget.onCompleted();
  }

  @override
  Widget build(BuildContext context) {
    final step = _steps[_currentStep];
    final isLast = _currentStep == _steps.length - 1;

    return FadeTransition(
      opacity: _fadeIn,
      child: Stack(
        children: [
          // Semi-transparent overlay
          Positioned.fill(
            child: GestureDetector(
              onTap: _skip,
              child: ColoredBox(color: Colors.black54),
            ),
          ),
          // Tooltip positioned above the nav bar
          Positioned(
            left: AppSpacing.lg,
            right: AppSpacing.lg,
            bottom: 100, // Above the NavigationBar
            child: _TourTooltip(
              step: step,
              current: _currentStep,
              total: _steps.length,
              isLast: isLast,
              onNext: _next,
              onSkip: _skip,
            ),
          ),
          // Highlight indicator for current tab
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _TabHighlight(step: step),
          ),
        ],
      ),
    );
  }
}

/// Тур үе бүрийн мэдээлэл.
///
/// Enum values MUST mirror the five [TamgaNavItem] destinations in
/// [AppShell._buildDestinations] — the highlight overlays them by index.
enum _TourStep {
  home(
    label: 'Нүүр',
    icon: Icons.home,
    title: 'Нүүр',
    description: 'Өнөөдрийн байдал, анхаарах зүйлс, хурдан үйлдлүүд.',
  ),
  horses(
    label: 'Морьд',
    icon: Icons.pets,
    title: 'Морьд',
    description: 'Мориныхоо бүртгэл, мэдээлэл, эрүүл мэнд, дасгалжуулалт.',
  ),
  care(
    label: 'Арчилгаа',
    icon: Icons.event_note,
    title: 'Арчилгаа',
    description: 'Вакцин, туулгалт, үзлэг зэрэг арчилгааны ажлууд.',
  ),
  lineage(
    label: 'Угшил',
    icon: Icons.account_tree,
    title: 'Угшил',
    description: 'Удам угсаа, удмын мод, холбоо.',
  ),
  market(
    label: 'Зах',
    icon: Icons.storefront,
    title: 'Зах',
    description: 'Морь худалдах, худалдан авах зах зээл.',
  );

  const _TourStep({
    required this.label,
    required this.icon,
    required this.title,
    required this.description,
  });

  final String label;
  final IconData icon;
  final String title;
  final String description;
}

/// Тур tooltip-ийг харуулна.
class _TourTooltip extends StatelessWidget {
  const _TourTooltip({
    required this.step,
    required this.current,
    required this.total,
    required this.isLast,
    required this.onNext,
    required this.onSkip,
  });

  final _TourStep step;
  final int current;
  final int total;
  final bool isLast;
  final VoidCallback onNext;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);

    return Container(
      decoration: BoxDecoration(
        color: tc.surfaceContainerLow,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
        border: Border.all(color: tc.outline, width: 0.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(TamgaSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(step.icon, color: tc.primary, size: 28),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    step.title,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: tc.onSurface,
                      letterSpacing: -0.41,
                    ),
                  ),
                ),
                Text(
                  '${current + 1}/$total',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: tc.onSurfaceVariant,
                    letterSpacing: -0.08,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              step.description,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w400,
                color: tc.onSurfaceVariant,
                letterSpacing: -0.24,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: onSkip, child: const Text('Өнгөрүүлэх')),
                const SizedBox(width: AppSpacing.sm),
                FilledButton(
                  onPressed: onNext,
                  child: Text(isLast ? 'Эхлэх' : 'Дараагийх'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Тодорхой нав таб-ийг онцлон харуулна.
class _TabHighlight extends StatelessWidget {
  const _TabHighlight({required this.step});

  final _TourStep step;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);

    // NavigationBar-ийн өндөр ~80dp
    return SizedBox(
      height: 80,
      child: Row(
        children: List.generate(_TourStep.values.length, (index) {
          final isHighlighted = index == step.index;
          return Expanded(
            child: Container(
              decoration: isHighlighted
                  ? BoxDecoration(
                      border: Border(
                        top: BorderSide(color: tc.primary, width: 3),
                      ),
                      color: tc.primaryContainer.withValues(alpha: 0.3),
                    )
                  : null,
              child: isHighlighted
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(step.icon, color: tc.primary),
                        const SizedBox(height: 4),
                        Text(
                          step.label,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: tc.primary,
                            letterSpacing: 0.07,
                          ),
                        ),
                      ],
                    )
                  : null,
            ),
          );
        }),
      ),
    );
  }
}
