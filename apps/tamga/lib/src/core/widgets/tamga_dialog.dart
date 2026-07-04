import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Confirmation dialog for destructive actions.
///
/// Follows iOS alert dialog conventions: title, message, cancel + confirm buttons.
///
/// ## Usage
/// ```dart
/// TamgaConfirmDialog.show(
///   context,
///   title: 'Устгах уу?',
///   message: 'Энэ үйлдлыг буцаах боломжгүй.',
///   confirmLabel: 'Устгах',
///   isDestructive: true,
///   onConfirm: () => deleteHorse(),
/// )
/// ```
class TamgaConfirmDialog extends StatelessWidget {
  const TamgaConfirmDialog({
    super.key,
    required this.title,
    this.message,
    required this.confirmLabel,
    this.cancelLabel = 'Цуцлах',
    this.onConfirm,
    this.onCancel,
    this.isDestructive = false,
  });

  final String title;
  final String? message;
  final String confirmLabel;
  final String cancelLabel;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;
  final bool isDestructive;

  /// Convenience method to show the dialog as a modal.
  static Future<bool?> show(
    BuildContext context, {
    required String title,
    String? message,
    required String confirmLabel,
    String cancelLabel = 'Цуцлах',
    VoidCallback? onConfirm,
    VoidCallback? onCancel,
    bool isDestructive = false,
  }) {
    return showAdaptiveDialog<bool>(
      context: context,
      builder: (_) => TamgaConfirmDialog(
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
        onConfirm: onConfirm,
        onCancel: onCancel,
        isDestructive: isDestructive,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Semantics(
      label: title,
      child: AlertDialog.adaptive(
        title: Text(title, style: TamgaTypography.headline()),
        content: message != null
            ? Text(
                message!,
                style: TamgaTypography.body(color: colors.onSurfaceVariant),
              )
            : null,
        actions: [
          TextButton(
            onPressed: () {
              onCancel?.call();
              Navigator.of(context).pop(false);
            },
            child: Text(cancelLabel),
          ),
          TextButton(
            onPressed: () {
              onConfirm?.call();
              Navigator.of(context).pop(true);
            },
            child: Text(
              confirmLabel,
              style: TextStyle(
                color: isDestructive ? colors.error : colors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
