import 'package:flutter/material.dart';

import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';
import '../../../ui/shadcn/components/control/button/button.dart';
import '../../../ui/shadcn/components/display/badge/badge.dart';
import '../../../ui/shadcn/components/navigation/breadcrumb/breadcrumb.dart';
import '../../../ui/shadcn/components/navigation/tabs/tabs.dart';

// ── Navigation Buttons ──────────────────────────────────────

/// Shadcn-style primary action button.
class AppPrimaryButton extends StatelessWidget {
  const AppPrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.expanded = true,
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    return PrimaryButton(
      onPressed: onPressed,
      child: Row(
        mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18),
            SizedBox(width: AppSpacing.sm),
          ],
          Text(label),
        ],
      ),
    );
  }
}

/// Shadcn-style outline navigation button.
class AppOutlineButton extends StatelessWidget {
  const AppOutlineButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.expanded = true,
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    return OutlineButton(
      onPressed: onPressed,
      child: Row(
        mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18),
            SizedBox(width: AppSpacing.sm),
          ],
          Text(label),
        ],
      ),
    );
  }
}

/// Shadcn-style ghost navigation button (minimal).
class AppGhostButton extends StatelessWidget {
  const AppGhostButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return GhostButton(
      onPressed: onPressed,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16),
            SizedBox(width: AppSpacing.inlineGap),
          ],
          Text(label),
        ],
      ),
    );
  }
}

/// Destructive button (e.g. delete horse record).
class AppDestructiveButton extends StatelessWidget {
  const AppDestructiveButton({super.key, required this.label, this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return DestructiveButton(onPressed: onPressed, child: Text(label));
  }
}

// ── Navigation Components Showcase ──────────────────────────

/// Показывает все доступные навигационные компоненты.
class NavigationShowcase extends StatefulWidget {
  const NavigationShowcase({super.key});

  @override
  State<NavigationShowcase> createState() => _NavigationShowcaseState();
}

class _NavigationShowcaseState extends State<NavigationShowcase> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Breadcrumb ──
        Text('Breadcrumb', style: AppTypography.caption1()),
        const SizedBox(height: 8),
        const Breadcrumb(
          children: [Text('Horses'), Text('Health'), Text('Vaccinations')],
        ),
        const SizedBox(height: 24),

        // ── Tabs ──
        Text('Tabs', style: AppTypography.caption1()),
        const SizedBox(height: 8),
        TabList(
          index: _tabIndex,
          onChanged: (i) => setState(() => _tabIndex = i),
          children: const [
            TabItem(child: Text('Info')),
            TabItem(child: Text('Lineage')),
            TabItem(child: Text('Health')),
          ],
        ),
        const SizedBox(height: 24),

        // ── Badge examples ──
        Text('Badges', style: AppTypography.caption1()),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: const [
            PrimaryBadge(child: Text('Active')),
            SecondaryBadge(child: Text('Draft')),
            DestructiveBadge(child: Text('Critical')),
            OutlineBadge(child: Text('Archived')),
          ],
        ),
        const SizedBox(height: 24),

        // ── Button variants ──
        Text('Buttons', style: AppTypography.caption1()),
        const SizedBox(height: 8),
        const AppPrimaryButton(
          label: 'Create Horse',
          icon: Icons.add,
          onPressed: null,
        ),
        const SizedBox(height: 8),
        AppPrimaryButton(
          label: 'Create Horse',
          icon: Icons.add,
          onPressed: () {},
        ),
        const SizedBox(height: 8),
        AppOutlineButton(
          label: 'View Lineage',
          icon: Icons.account_tree,
          onPressed: () {},
        ),
        const SizedBox(height: 8),
        AppGhostButton(label: 'Cancel', icon: Icons.close, onPressed: () {}),
        const SizedBox(height: 8),
        AppDestructiveButton(label: 'Delete Record', onPressed: () {}),
      ],
    );
  }
}
