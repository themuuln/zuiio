import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';

/// Морь хайх хайлтын мөр.
class HorseSearchBar extends StatelessWidget {
  const HorseSearchBar({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.query,
    required this.onChanged,
    required this.onClear,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String query;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Морь, угсаа эсвэл зүс хайх...',
          prefixIcon: Icon(
            Icons.search_outlined,
            size: 20,
            color: colors.mutedForeground,
          ),
          suffixIcon: query.isEmpty
              ? null
              : IconButton(
                  onPressed: onClear,
                  tooltip: 'Хайлтыг цэвэрлэх',
                  icon: const Icon(Icons.clear, size: 20),
                ),
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.md,
          ),
        ),
      ),
    );
  }
}
