import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

/// Minimal top-anchored toast — replaces Material [SnackBar].
///
/// Slides down from the top with a subtle spring animation and auto-dismisses.
/// Looks clean on both iOS and Android without Material-specific styling.
///
/// ## Usage
/// ```dart
/// // Success toast
/// TamgaToast.show(context, 'Амжилттай хадгаллаа');
///
/// // Error toast
/// TamgaToast.show(context, 'Алдаа гарлаа', isError: true);
///
/// // With icon
/// TamgaToast.show(context, 'Синхрончлогдсон', icon: Icons.cloud_done);
/// ```
abstract final class TamgaToast {
  /// Show a toast notification at the top of the screen.
  static void show(
    BuildContext context,
    String message, {
    bool isError = false,
    IconData? icon,
    Duration duration = const Duration(seconds: 3),
  }) {
    final overlay = Overlay.of(context);
    final colors = TamgaColors.of(context);
    final topPadding = MediaQuery.of(context).padding.top;
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (_) => _TamgaToastWidget(
        message: message,
        isError: isError,
        icon: icon,
        topPadding: topPadding,
        colors: colors,
        duration: duration,
        onDismiss: () {
          if (entry.mounted) entry.remove();
        },
      ),
    );

    overlay.insert(entry);
  }

  /// Convenience: show an error toast with error icon.
  static void showError(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 4),
  }) {
    show(
      context,
      message,
      isError: true,
      icon: Icons.error_outline,
      duration: duration,
    );
  }

  /// Convenience: show a success toast with check icon.
  static void showSuccess(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    show(
      context,
      message,
      icon: Icons.check_circle_outline,
      duration: duration,
    );
  }
}

class _TamgaToastWidget extends StatefulWidget {
  const _TamgaToastWidget({
    required this.message,
    required this.isError,
    this.icon,
    required this.topPadding,
    required this.colors,
    required this.duration,
    required this.onDismiss,
  });

  final String message;
  final bool isError;
  final IconData? icon;
  final double topPadding;
  final TamgaColors colors;
  final Duration duration;
  final VoidCallback onDismiss;

  @override
  State<_TamgaToastWidget> createState() => _TamgaToastWidgetState();
}

class _TamgaToastWidgetState extends State<_TamgaToastWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _slideAnimation;
  late final Animation<double> _fadeAnimation;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 400),
      reverseDuration: const Duration(milliseconds: 250),
      vsync: this,
    );

    _slideAnimation = Tween<double>(begin: -1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeIn,
      ),
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _controller.forward();
    _dismissTimer = Timer(widget.duration, _dismiss);
  }

  Future<void> _dismiss() async {
    if (!mounted) return;
    await _controller.reverse();
    widget.onDismiss();
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.isError
        ? widget.colors.destructive
        : widget.colors.surfaceContainerHighest;
    final fgColor = widget.isError
        ? widget.colors.onError
        : widget.colors.onSurface;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Positioned(
          top: widget.topPadding + 8 + (_slideAnimation.value * 60),
          left: TamgaSpacing.lg,
          right: TamgaSpacing.lg,
          child: Opacity(opacity: _fadeAnimation.value, child: child),
        );
      },
      child: GestureDetector(
        onVerticalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity! < 0) {
            _dismiss();
          }
        },
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
            boxShadow: [
              BoxShadow(
                color: widget.colors.shadow,
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                if (widget.icon != null) ...[
                  Icon(widget.icon, size: 20, color: fgColor),
                  const SizedBox(width: TamgaSpacing.sm),
                ],
                Expanded(
                  child: Text(
                    widget.message,
                    style: TamgaTypography.subheadline(
                      weight: FontWeight.w500,
                      color: fgColor,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
