import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

/// Wraps a child widget with a subtle scale-down animation on press.
///
/// Uses [AnimatedScale] to transition between [scaleNormal] and [scalePressed]
/// on tap-down/tap-up/tap-cancel. Adds [HapticFeedback.lightImpact] on tap.
///
/// Minimal and composable — wrap any button, card, or tappable widget.
class PressScale extends StatefulWidget {
  const PressScale({
    super.key,
    required this.child,
    this.onPressed,
    this.scaleNormal = 1.0,
    this.scalePressed = 0.97,
    this.duration = const Duration(milliseconds: 100),
  });

  final Widget child;
  final VoidCallback? onPressed;
  final double scaleNormal;
  final double scalePressed;
  final Duration duration;

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = Tween<double>(
      begin: widget.scaleNormal,
      end: widget.scalePressed,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.onPressed != null) {
      HapticFeedback.lightImpact();
      _controller.forward();
    }
  }

  void _onTapUp(TapUpDetails details) {
    _controller.reverse();
  }

  void _onTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.onPressed == null) return widget.child;

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: widget.onPressed,
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) =>
            Transform.scale(scale: _animation.value, child: child),
        child: widget.child,
      ),
    );
  }
}
