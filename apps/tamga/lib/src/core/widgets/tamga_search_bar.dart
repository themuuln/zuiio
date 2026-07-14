import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// iOS-style search bar with rounded rectangle, magnifying glass icon, and clear button.
///
/// ## Usage
/// ```dart
/// TamgaSearchBar(
///   controller: _searchController,
///   onChanged: (q) => _filter(q),
/// )
/// ```
class TamgaSearchBar extends StatelessWidget {
  const TamgaSearchBar({
    super.key,
    this.controller,
    this.hintText = 'Хайх...',
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.enabled = true,
  });

  final TextEditingController? controller;
  final String hintText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Semantics(
      label: hintText,
      textField: true,
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: colors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
        ),
        child: TextField(
          controller: controller,
          onChanged: onChanged,
          onSubmitted: onSubmitted,
          autofocus: autofocus,
          enabled: enabled,
          style: TamgaTypography.body(color: colors.onSurface),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TamgaTypography.body(color: colors.onSurfaceVariant),
            prefixIcon: Icon(
              Icons.search,
              size: 20,
              color: colors.onSurfaceVariant,
            ),
            prefixIconConstraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 40,
            ),
            suffixIcon: controller != null && controller!.text.isNotEmpty
                ? GestureDetector(
                    onTap: () {
                      controller!.clear();
                      onChanged?.call('');
                    },
                    child: Icon(
                      Icons.clear,
                      size: 18,
                      color: colors.onSurfaceVariant,
                    ),
                  )
                : null,
            suffixIconConstraints: const BoxConstraints(
              minWidth: 32,
              minHeight: 32,
            ),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: TamgaSpacing.sm,
              vertical: 0,
            ),
          ),
        ),
      ),
    );
  }
}
