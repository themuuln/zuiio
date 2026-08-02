import 'package:flutter/material.dart';
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

  static const String defaultMessageMn = 'Алдаа гарлаа';
  static const String defaultMessageEn = 'Something went wrong';

  String get _displayMessage {
    final msg = message;
    if (msg != null) return msg;
    return '$defaultMessageMn / $defaultMessageEn';
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: colors.surface,
        child: SingleChildScrollView(
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
                  const SizedBox(height: TamgaSpacing.lg),
                  Text(
                    _displayMessage,
                    style: TamgaTypography.title2(color: colors.onSurface),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: TamgaSpacing.sm),
                  Text(
                    'Уучлаарай, гэнэтийн алдаа гарлаа. '
                    'Холбоо тасарсан эсвэл түр зуурын доголол байж болно.\n'
                    'Sorry, an unexpected error occurred. This may be due to '
                    'a network issue or a temporary glitch.',
                    style: TamgaTypography.body(color: colors.onSurfaceVariant),
                    textAlign: TextAlign.center,
                  ),
                  if (onRetry != null) ...[
                    const SizedBox(height: TamgaSpacing.xxl),
                    FilledButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Дахин оролдох / Retry'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
