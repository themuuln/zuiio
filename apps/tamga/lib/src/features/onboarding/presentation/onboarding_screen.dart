import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../shared/domain/horse.dart';
import '../application/onboarding_providers.dart';
import '../domain/onboarding_data.dart';
import 'pages/horse_entry_page.dart';
import 'pages/notification_page.dart';
import 'pages/rank_selection_page.dart';
import 'pages/region_selection_page.dart';
import 'pages/role_selection_page.dart';
import 'pages/sync_setup_page.dart';
import 'pages/welcome_page.dart';

/// 7 алхамт onboarding дэлгэц (v4 — Stitch design refresh).
///
/// Шинэ урсгал:
/// 1. Welcome — full-bleed steppe photo + value prop
/// 2. Role — watermark background icon cards
/// 3. Region — аймаг сонгох
/// 4. Rank — алдар цол сонгох
/// 5. Horse entry — clean form with toggle pills
/// 6. Notifications — permission priming with green checkmarks
/// 7. Sync — cloud sync setup (replaces auth)
///
/// Step dots replace progress bar (matches approved Stitch design).
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  late final PageController _pageController;
  int _currentPage = 0;

  // Collected data
  UserRole? _selectedRole;
  String? _selectedRegion;
  String? _selectedRank;
  bool _horseEntrySkipped = false;
  bool _celebrating = false;

  // Horse entry data
  String? _horseName;
  HorseGender? _horseGender;
  String? _horseCoat;
  int? _horseBirthYear;

  static const _pageCount = 7;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToNextPage() {
    if (_currentPage < _pageCount - 1) {
      _pageController.animateToPage(
        _currentPage + 1,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToPreviousPage() {
    if (_currentPage > 0) {
      _pageController.animateToPage(
        _currentPage - 1,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    }
  }

  void _onHorseEntrySuccess() {
    setState(() => _celebrating = true);
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() => _celebrating = false);
        _goToNextPage();
      }
    });
  }

  Future<void> _finishOnboarding({bool notificationsEnabled = false}) async {
    final data = OnboardingData(
      isCompleted: false,
      userRole: _selectedRole?.name,
      region: _selectedRegion,
      rank: _selectedRank,
      horseName: _horseName,
      horseGender: _horseGender,
      horseCoat: _horseCoat,
      horseBirthYear: _horseBirthYear,
      horseEntrySkipped: _horseEntrySkipped,
      notificationsEnabled: notificationsEnabled,
    );
    await ref.read(onboardingProvider.notifier).complete(data);
  }

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    // Welcome screen is full-bleed (no scaffold padding)
    final isWelcomePage = _currentPage == 0;

    return Scaffold(
      backgroundColor: isWelcomePage ? Colors.black : tc.surface,
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // Pages
            Expanded(
              child: Stack(
                children: [
                  PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    onPageChanged: (page) {
                      setState(() => _currentPage = page);
                    },
                    children: [
                      // Screen 1: Welcome — full-bleed hero
                      WelcomePage(onContinue: _goToNextPage),

                      // Screen 2: Role — watermark cards
                      RoleSelectionPage(
                        initialRole: _selectedRole,
                        onBack: _goToPreviousPage,
                        onContinue: (role) {
                          _selectedRole = role;
                          _goToNextPage();
                        },
                      ),

                      // Screen 3: Region — search + province list
                      RegionSelectionPage(
                        initialRegion: _selectedRegion,
                        onBack: _goToPreviousPage,
                        onContinue: (region) {
                          _selectedRegion = region;
                          _goToNextPage();
                        },
                      ),

                      // Screen 4: Rank — алдар цол сонгох
                      RankSelectionPage(
                        initialRank: _selectedRank,
                        onBack: _goToPreviousPage,
                        onContinue: (rank) {
                          _selectedRank = rank;
                          _goToNextPage();
                        },
                      ),

                      // Screen 5: Horse entry — form
                      HorseEntryPage(
                        onBack: _goToPreviousPage,
                        onContinue: (name, gender, coat, birthYear) {
                          _horseEntrySkipped = false;
                          _horseName = name;
                          _horseGender = HorseGender.fromString(gender);
                          _horseCoat = coat;
                          _horseBirthYear = birthYear;
                          _onHorseEntrySuccess();
                        },
                        onSkip: () {
                          _horseEntrySkipped = true;
                          _goToNextPage();
                        },
                      ),

                      // Screen 6: Notifications — permission priming
                      NotificationPage(
                        onBack: _goToPreviousPage,
                        onStart: () =>
                            _finishOnboarding(notificationsEnabled: true),
                        onSkip: () => _finishOnboarding(),
                      ),

                      // Screen 7: Sync — cloud sync setup
                      SyncSetupPage(
                        onBack: _goToPreviousPage,
                        onStart: () =>
                            _finishOnboarding(notificationsEnabled: true),
                        onLater: () => _finishOnboarding(),
                      ),
                    ],
                  ),

                  // Celebration overlay
                  if (_celebrating) const _CelebrationOverlay(),
                ],
              ),
            ),

            // Step dots (not on welcome page — it has its own layout)
            if (!isWelcomePage)
              Padding(
                padding: const EdgeInsets.only(
                  bottom: AppSpacing.lg,
                  top: AppSpacing.sm,
                ),
                child: _StepDots(
                  currentPage: _currentPage,
                  pageCount: _pageCount,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────
///  Step Dots (replaces progress bar — matches Stitch design)
/// ─────────────────────────────────────────────

class _StepDots extends StatelessWidget {
  const _StepDots({required this.currentPage, required this.pageCount});

  final int currentPage;
  final int pageCount;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(pageCount, (index) {
        final isActive = index == currentPage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
          width: AppSpacing.sm,
          height: AppSpacing.sm,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? tc.primary : tc.outline,
          ),
        );
      }),
    );
  }
}

/// ─────────────────────────────────────────────
///  Celebration Overlay (Peak-End Rule)
/// ─────────────────────────────────────────────

class _CelebrationOverlay extends StatefulWidget {
  const _CelebrationOverlay();

  @override
  State<_CelebrationOverlay> createState() => _CelebrationOverlayState();
}

class _CelebrationOverlayState extends State<_CelebrationOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return FadeTransition(
      opacity: _fade,
      child: Container(
        color: tc.primary.withValues(alpha: 0.1),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success check with scale animation
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 500),
                curve: Curves.elasticOut,
                builder: (context, scale, child) {
                  return Transform.scale(scale: scale, child: child);
                },
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: tc.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, size: 48, color: Colors.white),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Text(
                'Баяр хүргэе! 🎉',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: tc.onSurface,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Таны адууны профайл бэлэн боллоо',
                style: TextStyle(fontSize: 17, color: tc.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
