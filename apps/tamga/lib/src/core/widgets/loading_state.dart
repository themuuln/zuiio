import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Skeleton loader for list items.
class SkeletonLoader extends StatelessWidget {
  const SkeletonLoader({
    super.key,
    this.items = 3,
    required this.itemBuilder,
    this.padding,
    this.spacing = 16,
  });

  final int items;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final EdgeInsetsGeometry? padding;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return ShimmerEffect(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final listPadding = padding ?? TamgaSpacing.screenPadding;
          if (constraints.hasBoundedHeight) {
            return ListView.separated(
              padding: listPadding,
              itemCount: items,
              separatorBuilder: (_, _) => SizedBox(height: spacing),
              itemBuilder: itemBuilder,
            );
          }

          return Padding(
            padding: listPadding,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var index = 0; index < items; index++) ...[
                  itemBuilder(context, index),
                  if (index < items - 1) SizedBox(height: spacing),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Skeleton card placeholder.
class SkeletonCard extends StatelessWidget {
  const SkeletonCard({
    super.key,
    this.width,
    this.height = 80,
    this.borderRadius,
    this.margin,
  });

  final double? width;
  final double height;
  final double? borderRadius;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: colors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(
          borderRadius ?? TamgaSpacing.cornerRadius,
        ),
      ),
    );
  }
}

/// Skeleton list tile placeholder — circular avatar + two lines of text.
class SkeletonListTile extends StatelessWidget {
  const SkeletonListTile({
    super.key,
    this.avatarSize = 48,
    this.showTrailing = true,
  });

  final double avatarSize;
  final bool showTrailing;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Padding(
      padding: TamgaSpacing.listCellPadding,
      child: Row(
        children: [
          Container(
            width: avatarSize,
            height: avatarSize,
            decoration: BoxDecoration(
              color: colors.surfaceContainerHigh,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: TamgaSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 16,
                  width: 120,
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: TamgaSpacing.sm),
                Container(
                  height: 14,
                  width: 80,
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
          if (showTrailing) ...[
            const SizedBox(width: TamgaSpacing.md),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: colors.surfaceContainerHigh,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Skeleton card with image area + text lines.
class SkeletonCardTile extends StatelessWidget {
  const SkeletonCardTile({
    super.key,
    this.imageHeight = 120,
    this.showSubtitle = true,
  });

  final double imageHeight;
  final bool showSubtitle;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: imageHeight,
            width: double.infinity,
            color: colors.surfaceContainerHighest,
          ),
          Padding(
            padding: TamgaSpacing.cardPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 16,
                  width: 140,
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                if (showSubtitle) ...[
                  const SizedBox(height: TamgaSpacing.sm),
                  Container(
                    height: 14,
                    width: 100,
                    decoration: BoxDecoration(
                      color: colors.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shimmer effect wrapper — animates a gradient shimmer across its child.
class ShimmerEffect extends StatefulWidget {
  const ShimmerEffect({
    super.key,
    required this.child,
    this.enabled = true,
    this.duration = const Duration(milliseconds: 1500),
  });

  final Widget child;
  final bool enabled;
  final Duration duration;

  @override
  State<ShimmerEffect> createState() => _ShimmerEffectState();
}

class _ShimmerEffectState extends State<ShimmerEffect>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    if (widget.enabled) _controller.repeat();
  }

  @override
  void didUpdateWidget(ShimmerEffect oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.enabled && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.enabled && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: const [
                Color(0xFFE0E0E0),
                Color(0xFFF5F5F5),
                Color(0xFFE0E0E0),
              ],
              stops: [
                (_controller.value - 0.3).clamp(0.0, 1.0),
                _controller.value,
                (_controller.value + 0.3).clamp(0.0, 1.0),
              ],
            ).createShader(bounds);
          },
          blendMode: BlendMode.srcATop,
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Full-screen loading overlay with optional message.
class LoadingOverlay extends StatelessWidget {
  const LoadingOverlay({
    super.key,
    this.message,
    this.indicator,
    this.backgroundColor,
  });

  final String? message;
  final Widget? indicator;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Container(
      color: backgroundColor ?? colors.surface.withValues(alpha: 0.8),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            indicator ?? CircularProgressIndicator(color: colors.primary),
            if (message != null) ...[
              const SizedBox(height: TamgaSpacing.lg),
              Text(
                message!,
                style: TamgaTypography.body(color: colors.onSurfaceVariant),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Inline loading indicator.
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({
    super.key,
    this.size = 24,
    this.strokeWidth = 2,
    this.color,
  });

  final double size;
  final double strokeWidth;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        color: color ?? colors.primary,
      ),
    );
  }
}

/// Button that shows a loading spinner while an async operation is in progress.
class LoadingButton extends StatelessWidget {
  const LoadingButton({
    super.key,
    required this.isLoading,
    required this.onPressed,
    required this.child,
    this.loadingIndicator,
    this.style,
  });

  final bool isLoading;
  final VoidCallback? onPressed;
  final Widget child;
  final Widget? loadingIndicator;
  final ButtonStyle? style;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: isLoading ? null : onPressed,
      style: style,
      child: isLoading
          ? loadingIndicator ??
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
          : child,
    );
  }
}
