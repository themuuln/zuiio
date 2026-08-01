import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';
import '../widgets/onboarding_bottom_actions.dart';

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
    final filteredRegions = _filteredRegions;

    return Column(
      children: [
        // ── Header ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.page,
            AppSpacing.lg,
            0,
          ),
          child: Column(
            children: [
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
                style: TextStyle(fontSize: 17, color: tc.onSurfaceVariant),
              ),
            ],
          ),
        ),

        // ── Search ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            0,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: tc.surfaceContainerLow,
              border: Border.all(color: tc.outlineVariant),
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
            ),
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: AppSpacing.md),
                  child: Icon(
                    Icons.search_rounded,
                    size: 21,
                    color: tc.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _searchQuery = value),
                    textInputAction: TextInputAction.search,
                    style: TextStyle(fontSize: 16, color: tc.onSurface),
                    decoration: InputDecoration(
                      hintText: 'Аймаг хайх...',
                      hintStyle: TextStyle(
                        color: tc.onSurfaceVariant,
                        fontSize: 16,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.md,
                      ),
                    ),
                  ),
                ),
                if (_searchQuery.isNotEmpty)
                  IconButton(
                    tooltip: 'Хайлтыг цэвэрлэх',
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                    icon: Icon(
                      Icons.close_rounded,
                      size: 19,
                      color: tc.onSurfaceVariant,
                    ),
                  )
                else
                  const SizedBox(width: AppSpacing.sm),
              ],
            ),
          ),
        ),

        // ── Section label ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.xl,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: Row(
            children: [
              Text(
                'АЙМГУУД · PROVINCES',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: tc.onSurfaceVariant,
                  letterSpacing: 0.8,
                ),
              ),
              const Spacer(),
              Text(
                '${filteredRegions.length}/${_regions.length}',
                style: TextStyle(fontSize: 12, color: tc.onSurfaceVariant),
              ),
            ],
          ),
        ),

        // ── Province list ──
        Expanded(
          child: filteredRegions.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.section),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.search_off_rounded,
                          size: 34,
                          color: tc.onSurfaceVariant,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          'Илэрц олдсонгүй',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            color: tc.onSurface,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Өөр нэрээр хайж үзнэ үү',
                          style: TextStyle(
                            fontSize: 15,
                            color: tc.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    0,
                    AppSpacing.lg,
                    AppSpacing.xxl * 4 + AppSpacing.xs,
                  ),
                  itemCount: filteredRegions.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final region = filteredRegions[index];
                    final isSelected = region == _selectedRegion;

                    return Semantics(
                      button: true,
                      selected: isSelected,
                      label: isSelected
                          ? '$region, сонгогдсон'
                          : '$region, сонгох',
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(
                            AppSpacing.cornerRadius,
                          ),
                          onTap: () => setState(() => _selectedRegion = region),
                          child: AnimatedContainer(
                            duration: TamgaMotion.durationNormal,
                            curve: TamgaMotion.easingStandard,
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md,
                              vertical: AppSpacing.md,
                            ),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? tc.primary.withValues(alpha: 0.1)
                                  : tc.surfaceContainerLowest,
                              border: Border.all(
                                color: isSelected
                                    ? tc.primary.withValues(alpha: 0.35)
                                    : tc.outlineVariant,
                              ),
                              borderRadius: BorderRadius.circular(
                                AppSpacing.cornerRadius,
                              ),
                            ),
                            child: Row(
                              children: [
                                AnimatedContainer(
                                  duration: TamgaMotion.durationNormal,
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? tc.primary
                                        : tc.surfaceContainerHigh,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    isSelected
                                        ? Icons.check_rounded
                                        : Icons.location_on_outlined,
                                    size: 18,
                                    color: isSelected
                                        ? tc.onPrimary
                                        : tc.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Text(
                                    region,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: isSelected
                                          ? FontWeight.w600
                                          : FontWeight.w500,
                                      color: isSelected
                                          ? tc.primary
                                          : tc.onSurface,
                                    ),
                                  ),
                                ),
                                Icon(
                                  isSelected
                                      ? Icons.check_circle_rounded
                                      : Icons.chevron_right_rounded,
                                  size: 20,
                                  color: isSelected
                                      ? tc.primary
                                      : tc.onSurfaceVariant,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),

        // ── Bottom actions — back + continue ──
        OnboardingBottomActions(
          onBack: widget.onBack,
          primaryLabel: 'Үргэлжлүүлэх',
          onPrimary: _canContinue
              ? () => widget.onContinue(_selectedRegion!)
              : null,
        ),
      ],
    );
  }
}
