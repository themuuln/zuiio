import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

/// Responsive layout system for phone/tablet adaptation.
///
/// Provides:
/// - [ResponsiveLayout] — Builder widget that adapts to screen size
/// - [Breakpoints] — Screen size constants (re-exported from design_tokens)
///
/// ## Usage
/// ```dart
/// ResponsiveLayout(
///   mobile: MobileLayout(),
///   tablet: TabletLayout(),
/// )
/// ```

/// Builder widget that adapts its child based on screen width.
///
/// Automatically rebuilds when screen size changes (e.g., device rotation,
/// split view on iPad).
class ResponsiveLayout extends StatelessWidget {
  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
    this.tabletBuilder,
    this.desktopBuilder,
  });

  /// Layout for mobile screens (< 600px).
  final Widget mobile;

  /// Layout for tablet screens (600-1023px).
  ///
  /// If null, uses [mobile] layout.
  final Widget? tablet;

  /// Layout for desktop screens (>= 1024px).
  ///
  /// If null, uses [tablet] layout, or [mobile] if tablet is also null.
  final Widget? desktop;

  /// Builder for tablet layout with access to context.
  ///
  /// Takes precedence over [tablet] if both are provided.
  final Widget Function(BuildContext context, BoxConstraints constraints)?
  tabletBuilder;

  /// Builder for desktop layout with access to context.
  ///
  /// Takes precedence over [desktop] if both are provided.
  final Widget Function(BuildContext context, BoxConstraints constraints)?
  desktopBuilder;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;

        if (width >= Breakpoints.desktop) {
          if (desktopBuilder != null) {
            return desktopBuilder!(context, constraints);
          }
          return desktop ?? tablet ?? mobile;
        }

        if (width >= Breakpoints.tablet) {
          if (tabletBuilder != null) {
            return tabletBuilder!(context, constraints);
          }
          return tablet ?? mobile;
        }

        return mobile;
      },
    );
  }
}

/// Responsive padding that adapts to screen width.
///
/// - Mobile: 16px horizontal padding
/// - Tablet: 24px horizontal padding, max width 768px centered
/// - Desktop: 32px horizontal padding, max width 1200px centered
class ResponsivePadding extends StatelessWidget {
  const ResponsivePadding({
    super.key,
    required this.child,
    this.mobilePadding,
    this.tabletPadding,
    this.desktopPadding,
    this.maxWidth,
  });

  final Widget child;

  /// Padding for mobile screens. Default: 16px horizontal.
  final EdgeInsetsGeometry? mobilePadding;

  /// Padding for tablet screens. Default: 24px horizontal.
  final EdgeInsetsGeometry? tabletPadding;

  /// Padding for desktop screens. Default: 32px horizontal.
  final EdgeInsetsGeometry? desktopPadding;

  /// Maximum width for content. Default: 1200px.
  final double? maxWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final effectiveMaxWidth = maxWidth ?? 1200;

        EdgeInsetsGeometry padding;
        if (width >= Breakpoints.desktop) {
          padding =
              desktopPadding ?? const EdgeInsets.symmetric(horizontal: 32);
        } else if (width >= Breakpoints.tablet) {
          padding = tabletPadding ?? const EdgeInsets.symmetric(horizontal: 24);
        } else {
          padding = mobilePadding ?? const EdgeInsets.symmetric(horizontal: 16);
        }

        return Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: effectiveMaxWidth),
            child: Padding(padding: padding, child: child),
          ),
        );
      },
    );
  }
}

/// Responsive grid that adapts columns based on screen width.
///
/// - Mobile: 1 column
/// - Tablet: 2 columns
/// - Desktop: 3-4 columns
class ResponsiveGrid extends StatelessWidget {
  const ResponsiveGrid({
    super.key,
    required this.children,
    this.mobileColumns = 1,
    this.tabletColumns = 2,
    this.desktopColumns = 3,
    this.spacing = 16,
    this.runSpacing = 16,
    this.childAspectRatio = 1,
    this.padding,
  });

  final List<Widget> children;
  final int mobileColumns;
  final int tabletColumns;
  final int desktopColumns;
  final double spacing;
  final double runSpacing;
  final double childAspectRatio;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        int columns;

        if (width >= Breakpoints.desktop) {
          columns = desktopColumns;
        } else if (width >= Breakpoints.tablet) {
          columns = tabletColumns;
        } else {
          columns = mobileColumns;
        }

        return GridView.builder(
          padding: padding ?? TamgaSpacing.screenPadding,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            childAspectRatio: childAspectRatio,
            crossAxisSpacing: spacing,
            mainAxisSpacing: runSpacing,
          ),
          itemCount: children.length,
          itemBuilder: (context, index) => children[index],
        );
      },
    );
  }
}

/// Responsive sidebar layout for tablet/desktop.
///
/// Shows a navigation rail on tablet and a full drawer on desktop.
class ResponsiveSidebar extends StatelessWidget {
  const ResponsiveSidebar({
    super.key,
    required this.navigationRail,
    required this.navigationDrawer,
    required this.body,
    this.railWidth = 80,
    this.drawerWidth = 280,
  });

  /// Navigation rail for tablet layout.
  final Widget navigationRail;

  /// Navigation drawer for desktop layout.
  final Widget navigationDrawer;

  /// Main body content.
  final Widget body;

  /// Width of the navigation rail. Default: 80px.
  final double railWidth;

  /// Width of the navigation drawer. Default: 280px.
  final double drawerWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;

        if (width >= Breakpoints.desktop) {
          return Row(
            children: [
              SizedBox(width: drawerWidth, child: navigationDrawer),
              Expanded(child: body),
            ],
          );
        }

        if (width >= Breakpoints.tablet) {
          return Row(
            children: [
              SizedBox(width: railWidth, child: navigationRail),
              Expanded(child: body),
            ],
          );
        }

        return body;
      },
    );
  }
}

/// Responsive text that adapts font size based on screen width.
///
/// Useful for headings that should be larger on tablet/desktop.
class ResponsiveText extends StatelessWidget {
  const ResponsiveText(
    this.text, {
    super.key,
    this.style,
    this.mobileStyle,
    this.tabletStyle,
    this.desktopStyle,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  final String text;
  final TextStyle? style;
  final TextStyle? mobileStyle;
  final TextStyle? tabletStyle;
  final TextStyle? desktopStyle;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        TextStyle? effectiveStyle;

        if (width >= Breakpoints.desktop && desktopStyle != null) {
          effectiveStyle = desktopStyle;
        } else if (width >= Breakpoints.tablet && tabletStyle != null) {
          effectiveStyle = tabletStyle;
        } else if (mobileStyle != null) {
          effectiveStyle = mobileStyle;
        } else {
          effectiveStyle = style;
        }

        return Text(
          text,
          style: effectiveStyle,
          textAlign: textAlign,
          maxLines: maxLines,
          overflow: overflow,
        );
      },
    );
  }
}
