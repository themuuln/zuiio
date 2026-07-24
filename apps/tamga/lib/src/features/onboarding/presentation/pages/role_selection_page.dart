import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';
import '../../domain/onboarding_data.dart';

/// Screen 2: Үүрэг сонгох — Role selection with watermark background icons.
///
/// Design: centered vertical cards, each with a large background icon
/// at 20% opacity as watermark. Selected card tints icon orange.
/// Text left-aligned on top of watermark.
class RoleSelectionPage extends StatefulWidget {
  const RoleSelectionPage({
    required this.onBack,
    required this.onContinue,
    this.initialRole,
    super.key,
  });

  final VoidCallback onBack;
  final void Function(UserRole role) onContinue;
  final UserRole? initialRole;

  @override
  State<RoleSelectionPage> createState() => _RoleSelectionPageState();
}

class _RoleSelectionPageState extends State<RoleSelectionPage> {
  UserRole? _selectedRole;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole;
  }

  bool get _canContinue => _selectedRole != null;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          const SizedBox(height: AppSpacing.section),

          // ── Back button + Header ──
          GestureDetector(
            onTap: widget.onBack,
            child: SizedBox(
              width: 44,
              height: 44,
              child: Icon(Icons.chevron_left, size: 28, color: tc.primary),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // ── Header ──
          Center(
            child: Column(
              children: [
                Text(
                  'Таны үүрэг',
                  style: TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w600,
                    color: tc.onSurface,
                    letterSpacing: 0.37,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Та ямар хүн бэ?',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: tc.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxxl),

          // ── Role cards ──
          Expanded(
            child: Column(
              children: [
                _RoleWatermarkCard(
                  role: UserRole.casual,
                  isSelected: _selectedRole == UserRole.casual,
                  watermarkIcon: Icons.pets,
                  onTap: () => setState(() => _selectedRole = UserRole.casual),
                ),
                const SizedBox(height: AppSpacing.md),
                _RoleWatermarkCard(
                  role: UserRole.breeder,
                  isSelected: _selectedRole == UserRole.breeder,
                  watermarkIcon: Icons.sports_motorsports,
                  onTap: () => setState(() => _selectedRole = UserRole.breeder),
                ),
                const SizedBox(height: AppSpacing.md),
                _RoleWatermarkCard(
                  role: UserRole.stable,
                  isSelected: _selectedRole == UserRole.stable,
                  watermarkIcon: Icons.visibility,
                  onTap: () => setState(() => _selectedRole = UserRole.stable),
                ),
              ],
            ),
          ),

          // ── CTA button ──
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.only(
                bottom: AppSpacing.lg,
                top: AppSpacing.sm,
              ),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _canContinue
                      ? () => widget.onContinue(_selectedRole!)
                      : null,
                  child: const Text(
                    'Үргэлжлүүлэх',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Role card with watermark background icon.
///
/// When selected: thick orange border, icon tints to orange.
/// When unselected: thin outline border, icon stays neutral.
class _RoleWatermarkCard extends StatelessWidget {
  const _RoleWatermarkCard({
    required this.role,
    required this.isSelected,
    required this.watermarkIcon,
    required this.onTap,
  });

  final UserRole role;
  final bool isSelected;
  final IconData watermarkIcon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Material(
      color: tc.surface,
      borderRadius: BorderRadius.circular(13),
      child: InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          height: 88,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: isSelected
                  ? tc.primary
                  : tc.outline.withValues(alpha: 0.4),
              width: isSelected ? 2.0 : 0.5,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Stack(
            children: [
              // Watermark icon — large, right-aligned
              Positioned(
                right: -8,
                top: 0,
                bottom: 0,
                child: Center(
                  child: Icon(
                    watermarkIcon,
                    size: 120,
                    color: isSelected
                        ? tc.primary.withValues(alpha: 0.15)
                        : tc.onSurfaceVariant.withValues(alpha: 0.08),
                  ),
                ),
              ),

              // Text content — left-aligned, on top
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        role.displayName,
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: tc.onSurface,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        role.subtitle,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w400,
                          color: tc.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
