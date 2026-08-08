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
          const SizedBox(height: AppSpacing.page),

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
          // ── Role cards — scrollable fallback for small screens ──
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _RoleWatermarkCard(
                            role: UserRole.casual,
                            isSelected: _selectedRole == UserRole.casual,
                            watermarkIcon: Icons.pets,
                            onTap: () =>
                                setState(() => _selectedRole = UserRole.casual),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          _RoleWatermarkCard(
                            role: UserRole.breeder,
                            isSelected: _selectedRole == UserRole.breeder,
                            watermarkIcon: Icons.sports_motorsports,
                            onTap: () => setState(
                              () => _selectedRole = UserRole.breeder,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          _RoleWatermarkCard(
                            role: UserRole.stable,
                            isSelected: _selectedRole == UserRole.stable,
                            watermarkIcon: Icons.visibility,
                            onTap: () =>
                                setState(() => _selectedRole = UserRole.stable),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          // ── Bottom actions — back + continue ──
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.only(
                bottom: AppSpacing.lg,
                top: AppSpacing.sm,
              ),
              child: SizedBox(
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
                        onPressed: _canContinue
                            ? () => widget.onContinue(_selectedRole!)
                            : null,
                        child: const Text(
                          'Үргэлжлүүлэх',
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
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      child: Material(
        color: tc.surfaceContainerLow,
        child: InkWell(
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
              border: Border.all(
                color: isSelected
                    ? tc.primary
                    : tc.outline.withValues(alpha: 0.6),
                width: 1.5,
              ),
            ),
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Stack(
              clipBehavior: Clip.hardEdge,
              children: [
                // Watermark icon — clipped to card bounds
                Positioned(
                  right: -8,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: SizedBox(
                      width: 96,
                      height: 96,
                      child: Icon(
                        watermarkIcon,
                        size: 96,
                        color: isSelected
                            ? tc.primary.withValues(alpha: 0.20)
                            : tc.onSurfaceVariant.withValues(alpha: 0.10),
                      ),
                    ),
                  ),
                ),

                // Text content — left-aligned, on top of watermark
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
