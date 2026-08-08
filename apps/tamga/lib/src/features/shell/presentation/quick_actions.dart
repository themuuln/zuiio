import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../app/theme/app_spacing.dart';

/// ─────────────────────────────────────────────
///  Quick Action Cards (Post-Tour)
/// ─────────────────────────────────────────────

const _kQuickActionsDismissedKey = 'quick_actions_dismissed';

/// Quick action картуудыг харагдуулах эсэхийг шалгана.
Future<bool> isQuickActionsDismissed() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(_kQuickActionsDismissedKey) ?? false;
}

/// Quick action картуудыг устгасан тэмдэгтийг хадгална.
Future<void> markQuickActionsDismissed() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(_kQuickActionsDismissedKey, true);
}

/// Хэрэглэгчийн үүрэг (role) -ээр контекстуал үйлдлийн картууд.
///
/// Зөвхөн анхны удаагийн ашиглалтад харуулна.
/// Хэрэглэгч устгасан бол дахин харагдахгүй.
class QuickActions extends StatefulWidget {
  const QuickActions({required this.userRole, super.key});

  /// Хэрэглэгчийн үүрэг: 'casual', 'breeder', 'stable'.
  final String userRole;

  @override
  State<QuickActions> createState() => _QuickActionsState();
}

class _QuickActionsState extends State<QuickActions> {
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();
    _loadDismissed();
  }

  Future<void> _loadDismissed() async {
    final dismissed = await isQuickActionsDismissed();
    if (mounted) {
      setState(() => _dismissed = dismissed);
    }
  }

  Future<void> _dismiss() async {
    await markQuickActionsDismissed();
    if (mounted) {
      setState(() => _dismissed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final actions = _actionsForRole(widget.userRole);
    if (actions.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.flash_on, size: 18, color: theme.colorScheme.primary),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Эхлэх үйлдлүүд',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.primary,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: _dismiss,
                icon: Icon(
                  Icons.close,
                  size: 18,
                  color: theme.colorScheme.outline,
                ),
                tooltip: 'Хаах',
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            height: 90,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: actions.length,
              separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
              itemBuilder: (context, index) {
                final action = actions[index];
                return _QuickActionCard(
                  action: action,
                  onTap: () => context.push(action.route),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Хэрэглэгчийн үүрэг бүрийн үйлдлүүд.
List<_QuickAction> _actionsForRole(String role) {
  return switch (role) {
    'breeder' => [
      _QuickAction(
        label: 'Морь нэмэх',
        icon: Icons.add_circle_outline,
        route: '/profile',
        color: Colors.blue,
      ),
      _QuickAction(
        label: 'Уралдаан нэмэх',
        icon: Icons.emoji_events_outlined,
        route: '/events',
        color: Colors.amber,
      ),
      _QuickAction(
        label: 'Үржүүлэлт',
        icon: Icons.pets_outlined,
        route: '/breeding',
        color: Colors.green,
      ),
    ],
    'stable' => [
      _QuickAction(
        label: 'Морь нэмэх',
        icon: Icons.add_circle_outline,
        route: '/profile',
        color: Colors.blue,
      ),
      _QuickAction(
        label: 'Зах дээр зарах',
        icon: Icons.storefront_outlined,
        route: '/market',
        color: Colors.orange,
      ),
      _QuickAction(
        label: 'Хэрэглэгч нэмэх',
        icon: Icons.person_add_outlined,
        route: '/profile',
        color: Colors.purple,
      ),
    ],
    // casual (default) and fallback
    _ => [
      _QuickAction(
        label: 'Морь нэмэх',
        icon: Icons.add_circle_outline,
        route: '/profile',
        color: Colors.blue,
      ),
      _QuickAction(
        label: 'Удам харах',
        icon: Icons.account_tree_outlined,
        route: '/lineage',
        color: Colors.teal,
      ),
    ],
  };
}

/// Нэг үйлдлийн мэдээлэл.
class _QuickAction {
  const _QuickAction({
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

/// Нэг үйлдлийн карт.
class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({required this.action, required this.onTap});

  final _QuickAction action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: 120,
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          side: BorderSide(color: action.color.withValues(alpha: 0.3)),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(action.icon, color: action.color, size: 28),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  action.label,
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
