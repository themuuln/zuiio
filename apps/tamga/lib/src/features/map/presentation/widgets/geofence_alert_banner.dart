import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';

/// Persistent banner shown when a geofence crossing is detected.
class GeofenceAlertBanner extends StatefulWidget {
  const GeofenceAlertBanner({
    super.key,
    required this.horseName,
    required this.geofenceName,
    required this.isEntered,
    this.onView,
  });

  final String horseName;
  final String geofenceName;
  final bool isEntered;
  final VoidCallback? onView;

  @override
  State<GeofenceAlertBanner> createState() => _GeofenceAlertBannerState();
}

class _GeofenceAlertBannerState extends State<GeofenceAlertBanner>
    with SingleTickerProviderStateMixin {
  bool _visible = true;
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );
    _controller.forward();

    // Auto-dismiss after 10 seconds
    Timer(const Duration(seconds: 10), () {
      if (mounted) _dismiss();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _dismiss() {
    _controller.reverse().then((_) {
      if (mounted) setState(() => _visible = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return const SizedBox.shrink();

    final colors = TamgaColors.of(context);
    final isEntered = widget.isEntered;

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Container(
        margin: const EdgeInsets.all(TamgaSpacing.md),
        padding: const EdgeInsets.all(TamgaSpacing.md),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
          border: Border.all(
            color: (isEntered ? colors.primary : colors.error).withValues(
              alpha: 0.3,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: (isEntered ? colors.primary : colors.error).withValues(
                  alpha: 0.12,
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isEntered ? Icons.login : Icons.logout,
                size: 16,
                color: isEntered ? colors.primary : colors.error,
              ),
            ),
            const SizedBox(width: TamgaSpacing.md),

            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.horseName,
                    style: TamgaTypography.subheadline(weight: FontWeight.w600),
                  ),
                  Text(
                    '${widget.geofenceName} хязгаарт ${isEntered ? 'орлоо' : 'гарлаа'}',
                    style: TamgaTypography.caption1(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),

            // Action
            TextButton(
              onPressed: () {
                widget.onView?.call();
                _dismiss();
              },
              child: Text(
                'Үзэх',
                style: TamgaTypography.subheadline(
                  color: colors.primary,
                  weight: FontWeight.w600,
                ),
              ),
            ),

            // Dismiss
            GestureDetector(
              onTap: _dismiss,
              child: Icon(
                Icons.close,
                size: 18,
                color: colors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
