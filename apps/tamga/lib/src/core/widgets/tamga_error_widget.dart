import 'package:flutter/material.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';
import '../theme/design_tokens.dart';

/// Хэрэглэгчдэд ээлтэй алдааны widget — ErrorWidget.builder-д ашиглагдана.
///
/// Stack trace харуулахгүй, зөвхөн хэрэглэгчид ойлгомжтой мессеж харуулна.
/// "Дахин оролдох / Retry" товч нь алдааг сэргээх боломж олгоно.
///
/// ## Usage
/// Бүтэн дэлгэцээр харуулах:
/// ```dart
/// TamgaErrorWidget(
///   message: 'Алдаа гарлаа / Something went wrong',
///   onRetry: () => runApp(...),
/// )
/// ```
class TamgaErrorWidget extends StatelessWidget {
  const TamgaErrorWidget({super.key, this.message, this.onRetry});

  /// Алдааны мессеж. [null] бол стандарт "Алдаа гарлаа / Something went wrong"
  final String? message;

  /// Retry товч дархад дуудагдах callback. [null] бол retry товч нуугдана.
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final loc = _AppLocalizationsSafe(context);

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: colors.surface,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(TamgaSpacing.xxxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  size: 64,
                  color: colors.error.withValues(alpha: 0.6),
                ),
                Text(
                  message ?? loc.generalError,
                  style: TamgaTypography.title2(color: colors.onSurface),
                  textAlign: TextAlign.center,
                ),
                Text(
                  loc.errorDefaultMessage,
                  style: TamgaTypography.body(color: colors.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
                if (onRetry != null) ...[
                  const SizedBox(height: TamgaSpacing.xxl),
                  FilledButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(loc.errorRetryButton),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Null-safe accessor for AppLocalizations that falls back to hardcoded
/// Mongolian/English strings when [AppLocalizations.of(context)] is null.
class _AppLocalizationsSafe {
  _AppLocalizationsSafe(this._context);

  final BuildContext _context;

  String get generalError {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.generalError;
    return 'Алдаа гарлаа / Something went wrong';
  }

  String get errorDefaultMessage {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.errorDefaultMessage;
    return 'Уучлаарай, ямар нэгэн алдаа гарлаа. Дахин оролдоно уу.\nSorry, something went wrong. Please try again.';
  }

  String get errorRetryButton {
    final loc = AppLocalizations.of(_context);
    if (loc != null) return loc.errorRetryButton;
    return 'Дахин оролдох / Retry';
  }
}
