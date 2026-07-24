import 'package:flutter/material.dart';

/// A shimmer overlay widget used for inline skeleton loading.
///
/// Renders its [child] normally, then paints a shimmer gradient animation on
/// top. When [isActive] is false, the child renders without the shimmer
/// overlay — use this to seamlessly transition from skeleton to real content.
class ShimmerWidget extends StatefulWidget {
  const ShimmerWidget({
    super.key,
    required this.child,
    this.isActive = true,
    this.baseColor,
    this.highlightColor,
  });

  /// The content to shimmer when [isActive] is true.
  final Widget child;

  /// Whether the shimmer effect is active.
  final bool isActive;

  /// Base color of the shimmer (darker).
  final Color? baseColor;

  /// Highlight color of the shimmer sweep (lighter).
  final Color? highlightColor;

  @override
  State<ShimmerWidget> createState() => _ShimmerWidgetState();
}

class _ShimmerWidgetState extends State<ShimmerWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isActive) return widget.child;

    final theme = Theme.of(context);
    final base = widget.baseColor ?? theme.colorScheme.surfaceContainerHighest;
    final highlight =
        widget.highlightColor ?? theme.colorScheme.surfaceContainerHigh;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final offset = _controller.value;
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment(-1 + offset * 2.5, 0),
              end: Alignment(1 + offset * 2.5, 0),
              colors: [base, base, highlight, base, base],
              stops: const [0.0, 0.35, 0.5, 0.65, 1.0],
            ).createShader(bounds);
          },
          child: child!,
        );
      },
      child: widget.child,
    );
  }
}

/// A rounded rectangle placeholder with shimmer, mimicking text or image size.
///
/// Use inside cards to skeletonize specific data-bound areas while keeping
/// the card shell intact.
class ShimmerPlaceholder extends StatelessWidget {
  const ShimmerPlaceholder({
    super.key,
    this.width,
    this.height = 14,
    this.borderRadius = 4,
  });

  /// Width of the placeholder. Null = fill available width.
  final double? width;

  /// Height of the placeholder block.
  final double height;

  /// Corner radius of the placeholder shape.
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ShimmerWidget(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Places a shimmer gradient directly over its child when [isLoading] is true.
///
/// Renders the child unchanged but dims it with a shimmer sweep — useful for
/// inline skeletons where the full layout should be visible but text content
/// reads as "not yet loaded."
class Skeletonize extends StatelessWidget {
  const Skeletonize({super.key, required this.isLoading, required this.child});

  final bool isLoading;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ShimmerWidget(isActive: isLoading, child: child);
  }
}
