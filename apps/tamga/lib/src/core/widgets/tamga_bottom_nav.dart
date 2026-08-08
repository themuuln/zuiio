import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import 'tamga_tappable.dart';

/// Minimal bottom navigation bar — replaces Material [NavigationBar].
///
/// Clean, flat design with no indicator pill, no ripple, no elevation.
/// Hairline top border, smooth color transitions on selection,
/// and proper safe-area handling.
///
/// Supports up to 6 items with icon + label pairs. Active state uses
/// the primary color with a semibold label, inactive uses muted foreground.
///
/// ## Usage
/// ```dart
/// TamgaBottomNav(
///   currentIndex: _selectedIndex,
///   onTap: (i) => setState(() => _selectedIndex = i),
///   items: [
///     TamgaNavItem(
///       icon: Icons.home_outlined,
///       activeIcon: Icons.home,
///       label: 'Home',
///     ),
///     TamgaNavItem(
///       icon: Icons.search_outlined,
///       activeIcon: Icons.search,
///       label: 'Search',
///     ),
///   ],
/// )
/// ```
class TamgaBottomNav extends StatelessWidget {
  const TamgaBottomNav({
    required this.currentIndex,
    required this.onTap,
    required this.items,
    super.key,
  });

  /// Currently selected tab index.
  final int currentIndex;

  /// Called when a tab is tapped.
  final ValueChanged<int> onTap;

  /// Navigation items — typically 3 to 6.
  final List<TamgaNavItem> items;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border(
          top: BorderSide(color: colors.outline, width: TamgaSpacing.hairline),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 56,
          child: Row(
            children: List.generate(items.length, (i) {
              return Expanded(
                child: _TamgaNavTab(
                  item: items[i],
                  isSelected: i == currentIndex,
                  onTap: () => onTap(i),
                  colors: colors,
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

/// A single navigation tab item within [TamgaBottomNav].
class _TamgaNavTab extends StatelessWidget {
  const _TamgaNavTab({
    required this.item,
    required this.isSelected,
    required this.onTap,
    required this.colors,
  });

  final TamgaNavItem item;
  final bool isSelected;
  final VoidCallback onTap;
  final TamgaColors colors;

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? colors.primary : colors.onSurfaceVariant;

    return TamgaTappable(
      onTap: onTap,
      pressedOpacity: 0.5,
      child: Semantics(
        label: item.label,
        selected: isSelected,
        child: SizedBox.expand(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // ── Icon with animated color transition ──
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: item.iconWidget != null
                    ? IconTheme(
                        key: ValueKey(isSelected),
                        data: IconThemeData(size: 24, color: color),
                        child: item.iconWidget!,
                      )
                    : Icon(
                        isSelected ? (item.activeIcon ?? item.icon) : item.icon,
                        key: ValueKey(isSelected),
                        size: 24,
                        color: color,
                      ),
              ),
              const SizedBox(height: 2),
              // ── Label ──
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: color,
                  letterSpacing: 0.07,
                ),
                child: Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Data for a single navigation tab.
///
/// Supply either [icon]/[activeIcon] for standard Material/Cupertino icons,
/// or [iconWidget]/[activeIconWidget] for custom widgets (e.g., FontAwesome).
class TamgaNavItem {
  const TamgaNavItem({
    this.icon,
    this.activeIcon,
    required this.label,
    this.iconWidget,
    this.activeIconWidget,
  }) : assert(
         icon != null || iconWidget != null,
         'Either icon or iconWidget must be provided',
       );

  /// Default icon (when not selected).
  final IconData? icon;

  /// Icon shown when selected. Falls back to [icon] if null.
  final IconData? activeIcon;

  /// Label text below the icon.
  final String label;

  /// Custom icon widget (e.g., [FaIcon]). Overrides [icon] if provided.
  final Widget? iconWidget;

  /// Custom icon widget for selected state. Falls back to [iconWidget].
  final Widget? activeIconWidget;
}
