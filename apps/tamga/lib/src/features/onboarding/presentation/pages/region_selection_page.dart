import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';

/// Screen 3: Аймаг сонгох — Region selection with search.
///
/// New screen replacing GoalSelectionPage. Search input with bottom-border,
/// scrollable Mongolian province list with hairline dividers.
class RegionSelectionPage extends StatefulWidget {
  const RegionSelectionPage({
    required this.onBack,
    required this.onContinue,
    this.initialRegion,
    super.key,
  });

  final VoidCallback onBack;
  final void Function(String region) onContinue;
  final String? initialRegion;

  @override
  State<RegionSelectionPage> createState() => _RegionSelectionPageState();
}

class _RegionSelectionPageState extends State<RegionSelectionPage> {
  String? _selectedRegion;
  String _searchQuery = '';
  late final TextEditingController _searchController;

  // Mongolian 21 аймаг + нийслэл
  static const _regions = [
    'Улаанбаатар',
    'Төв',
    'Хэнтий',
    'Булган',
    'Сэлэнгэ',
    'Дархан-Уул',
    'Орхон',
    'Архангай',
    'Өвөрхангай',
    'Баянхонгор',
    'Баян-Өлгий',
    'Говь-Алтай',
    'Ховд',
    'Увс',
    'Завхан',
    'Дундговь',
    'Говьсүмбэр',
    'Дорнод',
    'Хөвсгөл',
    'Сүхбаатар',
    'Дорноговь',
    'Өмнөговь',
  ];

  @override
  void initState() {
    super.initState();
    _selectedRegion = widget.initialRegion;
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<String> get _filteredRegions {
    if (_searchQuery.isEmpty) return _regions;
    return _regions
        .where((r) => r.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  bool get _canContinue => _selectedRegion != null;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Column(
      children: [
        // ── Header with search ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.page,
            AppSpacing.lg,
            0,
          ),
          child: Center(
            child: Column(
            children: [
              // Title
              Text(
                'Аймаг сонгох',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w600,
                  color: tc.onSurface,
                  letterSpacing: 0.36,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Хаана морьтой вэ?',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w400,
                  color: tc.onSurfaceVariant,
                ),
              ),
            ],
            ),
          ),
        ),

        // ── Search input ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            0,
          ),
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: tc.outline,
                  width: AppSpacing.hairline,
                ),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.search, size: 20, color: tc.onSurfaceVariant),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    style: TextStyle(fontSize: 17, color: tc.onSurface),
                    decoration: InputDecoration(
                      hintText: 'Аймаг хайх...',
                      hintStyle: TextStyle(
                        color: tc.onSurfaceVariant,
                        fontSize: 15,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.md,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── Province list ──
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.lg,
              AppSpacing.xxl * 4 + AppSpacing.xs,
            ),
            itemCount: _filteredRegions.length,
            separatorBuilder: (_, _) => Divider(
              height: AppSpacing.hairline,
              thickness: AppSpacing.hairline,
              color: tc.outline,
            ),
            itemBuilder: (context, index) {
              final region = _filteredRegions[index];
              final isSelected = region == _selectedRegion;

              return InkWell(
                onTap: () => setState(() => _selectedRegion = region),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppSpacing.md + AppSpacing.xs,
                  ),
                  color: isSelected ? tc.primary.withValues(alpha: 0.08) : null,
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          region,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                            color: isSelected ? tc.primary : tc.onSurface,
                          ),
                        ),
                      ),
                      if (isSelected)
                        Icon(Icons.check, size: 20, color: tc.primary)
                      else
                        Icon(
                          Icons.chevron_right,
                          size: 20,
                          color: tc.onSurfaceVariant,
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: AppSpacing.md),


        // ── Bottom actions — back + continue ──
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.sm,
              AppSpacing.lg,
              AppSpacing.lg,
            ),
            child: SizedBox(
              height: 48,
              child: Row(
                children: [
                  IconButton(
                    onPressed: widget.onBack,
                    icon: Icon(Icons.chevron_left, color: tc.primary),
                    style: IconButton.styleFrom(
                      backgroundColor: tc.surfaceContainerLow,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: FilledButton(
                      onPressed: _canContinue
                          ? () => widget.onContinue(_selectedRegion!)
                          : null,
                      child: const Text(
                        'Үргэлжлүүлэх',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
