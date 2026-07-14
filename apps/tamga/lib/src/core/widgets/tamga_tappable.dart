import 'package:flutter/material.dart';

/// iOS-style tap feedback — dims opacity on press instead of Material ripple.
///
/// Drop-in replacement for [InkWell]. Provides a subtle press-down effect
/// that feels native on both iOS and Android without any Material ancestry.
///
/// ## Usage
/// ```dart
/// TamgaTappable(
///   onTap: () => print('tapped'),
///   child: Text('Hello'),
/// )
/// ```
///
/// For long-press support:
/// ```dart
/// TamgaTappable(
///   onTap: () => print('tap'),
///   onLongPress: () => print('long press'),
///   child: MyWidget(),
/// )
/// ```
class TamgaTappable extends StatefulWidget {
  const TamgaTappable({
    required this.child,
    this.onTap,
    this.onLongPress,
    this.enabled = true,
    this.pressedOpacity = 0.6,
    this.scaleOnPress = false,
    this.pressedScale = 0.97,
    this.behavior = HitTestBehavior.opaque,
    super.key,
  });

  /// The widget below this in the tree.
  final Widget child;

  /// Called when tapped.
  final VoidCallback? onTap;

  /// Called on long press.
  final VoidCallback? onLongPress;

  /// Whether the tappable responds to gestures.
  final bool enabled;

  /// Opacity while pressed (0.0–1.0). Default 0.6 matches iOS button dimming.
  final double pressedOpacity;

  /// If true, also scales down slightly on press (like iOS SpringBoard icons).
  final bool scaleOnPress;

  /// Scale factor when pressed. Only used if [scaleOnPress] is true.
  final double pressedScale;

  /// How the gesture detector hits should be resolved.
  final HitTestBehavior behavior;

  @override
  State<TamgaTappable> createState() => _TamgaTappableState();
}

class _TamgaTappableState extends State<TamgaTappable> {
  bool _pressed = false;

  bool get _active =>
      widget.enabled && (widget.onTap != null || widget.onLongPress != null);

  void _handleTapDown(TapDownDetails _) {
    if (_active) setState(() => _pressed = true);
  }

  void _handleTapUp(TapUpDetails _) {
    if (_pressed) setState(() => _pressed = false);
  }

  void _handleTapCancel() {
    if (_pressed) setState(() => _pressed = false);
  }

  @override
  Widget build(BuildContext context) {
    Widget child = AnimatedOpacity(
      opacity: _pressed ? widget.pressedOpacity : 1.0,
      duration: const Duration(milliseconds: 100),
      curve: Curves.easeOut,
      child: widget.child,
    );

    if (widget.scaleOnPress) {
      child = AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: child,
      );
    }

    return Semantics(
      button: widget.onTap != null,
      enabled: _active,
      child: GestureDetector(
        behavior: widget.behavior,
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        onTap: _active ? widget.onTap : null,
        onLongPress: _active ? widget.onLongPress : null,
        child: child,
      ),
    );
  }
}
