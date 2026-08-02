import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Branded sliver app bar used by Tamga's primary command screens.
///
/// The optional subtitle gives users a short orientation cue without adding a
/// separate card or consuming the first content section's vertical rhythm.
/// Actions remain standard Material controls so platform semantics, focus, and
/// hit targets stay intact.
class TamgaSliverHeader extends StatelessWidget {
  /// Creates a reusable Tamga sliver header.
  const TamgaSliverHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actions = const <Widget>[],
    this.leading,
    this.bottom,
    this.pinned = false,
    this.floating = false,
    this.snap = false,
  });

  /// Primary Mongolian screen title.
  final String title;

  /// Optional short orientation cue shown below [title].
  final String? subtitle;

  /// Trailing actions for the command surface.
  final List<Widget> actions;

  /// Optional leading navigation control.
  final Widget? leading;

  /// Optional bottom navigation such as a [TabBar].
  final PreferredSizeWidget? bottom;

  /// Whether the header remains visible while content scrolls.
  final bool pinned;

  /// Whether the header enters as soon as the user scrolls toward the top.
  final bool floating;

  /// Whether a floating header should snap into place.
  final bool snap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final titleStyle =
        theme.appBarTheme.titleTextStyle ?? theme.textTheme.titleLarge;

    final titleContent = subtitle == null
        ? Text(title, maxLines: 1, overflow: TextOverflow.ellipsis)
        : Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: titleStyle,
              ),
              Text(
                subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          );

    return SliverAppBar(
      centerTitle: false,
      titleSpacing: TamgaSpacing.lg,
      title: titleContent,
      leading: leading,
      actions: actions,
      bottom: bottom,
      pinned: pinned,
      floating: floating,
      snap: snap,
      toolbarHeight: subtitle == null ? kToolbarHeight : 64,
    );
  }
}
