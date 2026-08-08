import 'package:flutter/material.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/design_tokens.dart';

/// Branded splash screen for Tamga.
///
/// Displays the app name "Тамга" with a vibrant orange background
/// while SharedPreferences and other async initialization loads.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Scaffold(
      backgroundColor: tc.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: tc.onPrimary,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0x33000000),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  'T',
                  style: TextStyle(
                    fontSize: 64,
                    fontWeight: FontWeight.w800,
                    color: tc.primary,
                    height: 1,
                  ),
                ),
              ),
            ),
            Text(
              AppLocalizations.of(context)!.splashTitle,
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.w700,
                color: tc.onPrimary,
                letterSpacing: 1.2,
              ),
            ),
            Text(
              AppLocalizations.of(context)!.splashSubtitle,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: tc.onPrimary.withValues(alpha: 0.7),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Colors.white,
              ),
            ),
          ],
        ).animate().fadeIn(duration: 600.ms).scale(delay: 200.ms),
      ),
    );
  }
}
