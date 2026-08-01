/// Хурдан үүсгэх bottom sheet — `smooth_sheets` ашиглан.
///
/// Дриббл загвараар:
/// - FAB дээр дархад → smooth bottom sheet нээгдэнэ
/// - Дээш чирвэл → full screen болно
/// - Шууд `/quick-create` руу орвол → full page хэлбэрээр харагдана
library;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_sheets/smooth_sheets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import '../../horses/presentation/horse_editor_sheet.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';

// ── Route path ──────────────────────────────────────────────────────────

/// Quick create sheet-ийн full page route path.
///
/// Энэ route руу шууд орвол full page хэлбэрээр нээгдэнэ.
/// FAB-аас дуудвал bottom sheet хэлбэрээр нээгдэнэ.
const String quickCreateRoutePath = '/quick-create';

// ── Dual-presentation helpers ───────────────────────────────────────────

/// Quick create content-ийг bottom sheet хэлбэрээр нээх.
///
/// Usage: `Navigator.push(context, QuickCreateSheet.route())`
extension QuickCreateSheetRoute on QuickCreateSheet {
  static ModalSheetRoute<void> route() {
    return ModalSheetRoute(
      swipeDismissible: true,
      swipeDismissSensitivity: const SwipeDismissSensitivity(
        minFlingVelocityRatio: 2.0,
        dismissalOffset: SheetOffset.proportionalToViewport(0.25),
      ),
      builder: (_) => const QuickCreateSheet(),
    );
  }
}

/// Quick create content-ийг full page хэлбэрээр нээх GoRoute.
///
/// Usage: `GoRoute(path: quickCreateRoutePath, builder: ...)`
///
/// Энэ нь `/quick-create` руу шууд орвол full page хэлбэрээр,
/// FAB-аас `Navigator.push(context, QuickCreateSheet.route())` дуудвал
/// bottom sheet хэлбэрээр нээгдэнэ — Дриббл загвар.
GoRoute quickCreateFullPageRoute() {
  return GoRoute(
    path: quickCreateRoutePath,
    builder: (context, state) => const _QuickCreateFullPage(),
  );
}

/// Full page wrapper — `Scaffold` өгч, sheet-ийн content-ийг харуулна.
class _QuickCreateFullPage extends StatelessWidget {
  const _QuickCreateFullPage();

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Шинэ зүйл үүсгэх', style: TextStyle(color: tc.foreground)),
        backgroundColor: tc.surface,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: Icon(PhosphorIconsRegular.xCircle, color: tc.foreground),
          onPressed: () => context.pop(),
        ),
      ),
      body: _QuickCreateContent(insideSheet: false),
    );
  }
}

// ── Shared content ──────────────────────────────────────────────────────

/// Quick create content.
///
/// `insideSheet: false` үед бүх action-уудыг (дуудалтгүйгээр) харуулна.
class QuickCreateSheet extends StatelessWidget {
  const QuickCreateSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Sheet(
        initialOffset: const SheetOffset(0.35),
        decoration: MaterialSheetDecoration(
          size: SheetSize.stretch,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          color: TamgaColors.of(context).surface,
        ),
        physics: const BouncingSheetPhysics(),
        snapGrid: const SheetSnapGrid(
          snaps: [
            SheetOffset(0.35), // compact
            SheetOffset(0.65), // expanded
            SheetOffset(1.0), // full screen
          ],
        ),
        child: SafeArea(child: _QuickCreateContent(insideSheet: true)),
      ),
    );
  }
}

// ── Content ─────────────────────────────────────────────────────────────

class _QuickCreateContent extends StatelessWidget {
  const _QuickCreateContent({required this.insideSheet});

  /// `true` бол sheet дотор байна — safeArea-г sheet-ийн хариуцлага.
  final bool insideSheet;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    final actions = _allCreateActions(context);

    final content = ListView(
      padding: EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.md,
        bottom: MediaQuery.of(context).padding.bottom + AppSpacing.md,
      ),
      children: [
        // ── Drag handle (зөвхөн sheet дотор) ──
        if (insideSheet) const Center(child: _DragHandle()),

        if (insideSheet) const SizedBox(height: AppSpacing.lg),

        // ── Header ──
        Row(
          children: [
            Expanded(
              child: Text(
                'Шинэ зүйл үүсгэх',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: tc.foreground,
                ),
              ),
            ),
            // Close button (sheet-д байхгүй — swipe dismiss хангалттай)
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Хурдан үүсгэх зүйлээ сонгоно уу',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: tc.mutedForeground),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Action items ──
        ...actions.map(
          (action) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: _CreateActionTile(
              action: action,
              onTap: insideSheet
                  ? () {
                      Navigator.pop(context);
                      action.onTap();
                    }
                  : action.onTap,
            ),
          ),
        ),

        // ── Full screen дээр нэмэлт content ──
        const SizedBox(height: AppSpacing.xl),
        _ExpandedSection(tc: tc),
      ],
    );

    if (insideSheet) return content;
    return content;
  }
}

/// Full screen төлөвт харагдах нэмэлт section.
class _ExpandedSection extends StatelessWidget {
  const _ExpandedSection({required this.tc});
  final TamgaColors tc;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(color: tc.border.withValues(alpha: 0.5)),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Саяхан нэмсэн',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: tc.foreground,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        // Placeholder — сүүлд хэрэглэгчийн сүүлийн үйлдлүүдээр дүүргэнэ
        _RecentActivityChip(
          icon: PhosphorIconsRegular.horse,
          label: AppLocalizations.of(context)!.horseAddButton,
          subtitle: '0 морь бүртгэгдсэн',
          color: Colors.blue,
          tc: tc,
        ),
        const SizedBox(height: AppSpacing.sm),
        _RecentActivityChip(
          icon: PhosphorIconsRegular.storefront,
          label: 'Зарын түүх',
          subtitle: '0 идэвхтэй зар',
          color: Colors.orange,
          tc: tc,
        ),
        const SizedBox(height: AppSpacing.sm),
        _RecentActivityChip(
          icon: PhosphorIconsRegular.trophy,
          label: AppLocalizations.of(context)!.eventsFilterRace,
          subtitle: '0 удаа оролцсон',
          color: Colors.amber,
          tc: tc,
        ),
      ],
    );
  }
}

class _RecentActivityChip extends StatelessWidget {
  const _RecentActivityChip({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.tc,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final TamgaColors tc;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: tc.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: tc.foreground,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            subtitle,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: tc.mutedForeground),
          ),
        ],
      ),
    );
  }
}

// ── Drag handle ─────────────────────────────────────────────────────────

class _DragHandle extends StatelessWidget {
  const _DragHandle();

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Container(
      width: 36,
      height: 4,
      decoration: BoxDecoration(
        color: tc.mutedForeground.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }
}

// ── Action model & data ─────────────────────────────────────────────────

/// Нэг create action-ийн мэдээлэл.
class _CreateAction {
  const _CreateAction({
    required this.label,
    required this.labelMn,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final String labelMn;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
}

/// Create action-уудын жагсаалт.
List<_CreateAction> _allCreateActions(BuildContext context) {
  final l10n = AppLocalizations.of(context)!;
  return [
    _CreateAction(
      label: l10n.horseNavTitle,
      labelMn: 'Add Horse',
      icon: PhosphorIconsRegular.horse,
      color: Colors.blue,
      onTap: () {
        Navigator.push(
          context,
          ModalSheetRoute(
            swipeDismissible: true,
            swipeDismissSensitivity: const SwipeDismissSensitivity(
              minFlingVelocityRatio: 2.0,
              dismissalOffset: SheetOffset.proportionalToViewport(0.3),
            ),
            builder: (_) => const _HorseEditorSheetWrapper(),
          ),
        );
      },
    ),
    _CreateAction(
      label: 'Зар',
      labelMn: 'Market Listing',
      icon: PhosphorIconsRegular.storefront,
      color: Colors.orange,
      onTap: () => context.push('/market/create'),
    ),
    _CreateAction(
      label: l10n.lostHorseFinderTitle,
      labelMn: 'Report Lost Horse',
      icon: PhosphorIconsRegular.magnifyingGlassMinus,
      color: Colors.red,
      onTap: () => context.push('/lost-horse/report'),
    ),
    _CreateAction(
      label: l10n.eventsFilterRace,
      labelMn: 'Add Event',
      icon: PhosphorIconsRegular.trophy,
      color: Colors.amber,
      onTap: () => context.push('/events'),
    ),
    _CreateAction(
      label: l10n.paymentSubscriptionTitle,
      labelMn: 'Payment',
      icon: PhosphorIconsRegular.creditCard,
      color: Colors.green,
      onTap: () => context.push('/payment'),
    ),
  ];
}

/// HorseEditorSheet-ийг smooth_sheets дотор харуулах wrapper.
class _HorseEditorSheetWrapper extends ConsumerWidget {
  const _HorseEditorSheetWrapper();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tc = TamgaColors.of(context);
    return PopScope(
      canPop: true,
      child: Sheet(
        initialOffset: const SheetOffset(0.5),
        decoration: MaterialSheetDecoration(
          size: SheetSize.stretch,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          color: tc.surface,
        ),
        snapGrid: const SheetSnapGrid(
          snaps: [SheetOffset(0.5), SheetOffset(1.0)],
        ),
        child: SafeArea(child: const HorseEditorSheet()),
      ),
    );
  }
}
// ── Action tile widget ──────────────────────────────────────────────────

/// Нэг үйлдлийг харуулах tile.
class _CreateActionTile extends StatelessWidget {
  const _CreateActionTile({required this.action, required this.onTap});

  final _CreateAction action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            vertical: AppSpacing.md,
            horizontal: AppSpacing.sm,
          ),
          child: Row(
            children: [
              // ── Icon container ──
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: action.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(action.icon, color: action.color, size: 22),
              ),
              const SizedBox(width: AppSpacing.md),

              // ── Labels ──
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      action.label,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: tc.foreground,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      action.labelMn,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: tc.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),

              // ── Arrow ──
              Icon(
                PhosphorIconsRegular.caretRight,
                color: tc.mutedForeground,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
