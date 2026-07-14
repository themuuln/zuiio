import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

/// Морь хайх хайлтын мөр.
class HorseSearchBar extends StatelessWidget {
  const HorseSearchBar({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.isActive,
    required this.query,
    required this.onChanged,
    required this.onToggle,
    required this.onClear,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isActive;
  final String query;
  final ValueChanged<String> onChanged;
  final VoidCallback onToggle;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        0,
      ),
      child: Row(
        children: [
          Expanded(
            child: AnimatedOpacity(
              opacity: isActive ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: AnimatedSize(
                duration: const Duration(milliseconds: 200),
                child: isActive
                    ? TextField(
                        controller: controller,
                        focusNode: focusNode,
                        onChanged: onChanged,
                        decoration: InputDecoration(
                          hintText: 'Морь хайх...',
                          prefixIcon: const Icon(Icons.search, size: 20),
                          suffixIcon: query.isNotEmpty
                              ? IconButton(
                                  onPressed: onClear,
                                  icon: const Icon(Icons.clear, size: 20),
                                )
                              : null,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.sm,
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ),
          ),
          if (!isActive) const Spacer(),
          IconButton(
            onPressed: onToggle,
            icon: Icon(
              isActive ? Icons.search_off : Icons.search,
              color: isActive
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurfaceVariant,
            ),
            tooltip: isActive ? 'Хайлт цуцлах' : 'Хайх',
          ),
        ],
      ),
    );
  }
}
