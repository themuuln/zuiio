import 'package:flutter/material.dart';

/// A widget that fades in its child with a staggered delay based on [index].
///
/// Used for staggered list entry animations on the lineage home screen.
/// Each item waits `index * staggerDelay` before beginning its
/// [fadeDuration] fade-in animation. Subtle — fade only, no bounce or slide.
///
/// Animation plays once on initial build; the widget is stateless with
/// respect to rebuilds (it's a StatefulWidget that only animates in
/// [initState]).
class StaggeredFadeIn extends StatefulWidget {
  const StaggeredFadeIn({
    super.key,
    required this.child,
    required this.index,
    this.fadeDuration = const Duration(milliseconds: 300),
    this.staggerDelay = const Duration(milliseconds: 50),
  });

  /// The child widget to fade in.
  final Widget child;

  /// Zero-based stagger index. Total delay before animation starts is
  /// `index * staggerDelay`.
  final int index;

  /// Duration of the fade-in animation for this item.
  final Duration fadeDuration;

  /// Delay between successive items' animation start times.
  final Duration staggerDelay;

  @override
  State<StaggeredFadeIn> createState() => _StaggeredFadeInState();
}

class _StaggeredFadeInState extends State<StaggeredFadeIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.fadeDuration,
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);

    final delay = Duration(
      milliseconds: widget.index * widget.staggerDelay.inMilliseconds,
    );
    Future.delayed(delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(opacity: _animation, child: widget.child);
  }
}
