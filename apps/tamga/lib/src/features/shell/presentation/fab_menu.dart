import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/design_tokens.dart';

/// ─────────────────────────────────────────────
///  Floating Action Button Menu
/// ─────────────────────────────────────────────

/// Bottom-right FAB with expandable quick-action menu.
/// Shows common "add" actions for the entire app.
class FabMenu extends StatefulWidget {
  const FabMenu({super.key});

  @override
  State<FabMenu> createState() => _FabMenuState();
}

class _FabMenuState extends State<FabMenu> with SingleTickerProviderStateMixin {
  bool _isOpen = false;
  late final AnimationController _controller;
  late final Animation<double> _expandAnimation;
  late final Animation<double> _rotateAnimation;
  late final List<Animation<double>> _itemAnimations;

  static const _itemCount = 5;
  static const _staggerDuration = 0.08;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );

    _expandAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );

    _rotateAnimation = Tween<double>(
      begin: 0,
      end: 0.75,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    // Pre-create staggered item animations
    _itemAnimations = List.generate(_itemCount, (index) {
      final start = (index * _staggerDuration).clamp(0.0, 1.0);
      final end = (start + 0.5).clamp(0.0, 1.0);
      return CurvedAnimation(
        parent: _controller,
        curve: Interval(start, end, curve: Curves.easeOutCubic),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _isOpen = !_isOpen;
      if (_isOpen) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  void _close() {
    if (_isOpen) {
      setState(() => _isOpen = false);
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    final actions = _allActions(tc);

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        // ── Backdrop tap to close ──
        if (_isOpen)
          Positioned.fill(
            child: GestureDetector(
              onTap: _close,
              child: AnimatedBuilder(
                animation: _expandAnimation,
                builder: (context, _) => Container(
                  color: Colors.black.withValues(
                    alpha: 0.3 * _expandAnimation.value,
                  ),
                ),
              ),
            ),
          ),

        // ── Action items (fan out from FAB) ──
        Positioned(
          right: 16,
          bottom: 80,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(actions.length, (index) {
              return AnimatedBuilder(
                animation: _itemAnimations[index],
                builder: (context, child) {
                  final value = _itemAnimations[index].value;
                  return Transform.translate(
                    offset: Offset(0, 20 * (1 - value)),
                    child: Opacity(
                      opacity: value,
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _FabMenuItem(
                          action: actions[index],
                          onTap: () {
                            _close();
                            context.push(actions[index].route);
                          },
                        ),
                      ),
                    ),
                  );
                },
              );
            }),
          ),
        ),

        // ── Main FAB ──
        Positioned(
          right: 16,
          bottom: 16,
          child: AnimatedBuilder(
            animation: _rotateAnimation,
            builder: (context, child) {
              return Transform.rotate(
                angle: _rotateAnimation.value * 3.14159,
                child: FloatingActionButton(
                  onPressed: _toggle,
                  backgroundColor: tc.primary,
                  foregroundColor: tc.onPrimary,
                  elevation: 4,
                  shape: const CircleBorder(),
                  child: const Icon(Icons.add, size: 28),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  /// All available quick-add actions.
  List<_FabAction> _allActions(TamgaColors tc) => [
    _FabAction(
      label: 'Зар нэмэх',
      icon: Icons.storefront_outlined,
      route: '/market/create',
      color: tc.tertiary,
    ),
    _FabAction(
      label: 'Уралдаан',
      icon: Icons.emoji_events_outlined,
      route: '/events',
      color: tc.primary,
    ),
    _FabAction(
      label: 'Үржүүлэлт',
      icon: Icons.pets_outlined,
      route: '/breeding',
      color: tc.primary,
    ),
    _FabAction(
      label: 'Алдсан морь',
      icon: Icons.search_off_outlined,
      route: '/lost-horse/report',
      color: tc.tertiary,
    ),
    _FabAction(
      label: 'Төлбөр',
      icon: Icons.payment_outlined,
      route: '/payment',
      color: tc.primary,
    ),
  ];
}

/// Single menu item with label + mini FAB.
class _FabMenuItem extends StatelessWidget {
  const _FabMenuItem({required this.action, required this.onTap});

  final _FabAction action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tc = TamgaColors.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Label pill ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              action.label,
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // ── Mini FAB ──
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: action.color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: action.color.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(action.icon, color: tc.onPrimary, size: 20),
          ),
        ],
      ),
    );
  }
}

/// A single FAB menu action item.
class _FabAction {
  const _FabAction({
    required this.label,
    required this.icon,
    required this.route,
    required this.color,
  });

  final String label;
  final IconData icon;
  final String route;
  final Color color;
}
