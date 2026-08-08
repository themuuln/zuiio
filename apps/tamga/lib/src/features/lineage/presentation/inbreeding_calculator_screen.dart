import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../application/inbreeding_calculator.dart';

class InbreedingCalculatorScreen extends ConsumerStatefulWidget {
  const InbreedingCalculatorScreen({super.key});

  @override
  ConsumerState<InbreedingCalculatorScreen> createState() =>
      _InbreedingCalculatorScreenState();
}

class _InbreedingCalculatorScreenState
    extends ConsumerState<InbreedingCalculatorScreen> {
  String? _selectedSireId;
  String? _selectedDamId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // ── Tier gate: Breeder+ required ─────────────────────────────
    final gate = ref.watch(inbreedingCalcGateProvider);
    if (gate is GateDenied) {
      return Scaffold(
        appBar: AppBar(title: const Text('Цус ойртолтын тооцоолуур')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.lock_outline_rounded,
                  size: 64,
                  color: colorScheme.outline,
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Breeder захиалгын боломж',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  gate.reason,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.xxl),
                FilledButton(
                  onPressed: () => context.go('/payments'),
                  child: const Text('Шинэчлэх'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final horsesAsync = ref.watch(horsesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Цус ойртолтын тооцоолуур')),
      body: horsesAsync.when(
        data: (horses) {
          // Prepare name map
          final nameMap = {for (final h in horses) h.id: h.name};
          // Add default mock parents names in case they aren't in the registry
          nameMap['tenger-khuleg'] = 'Тэнгэр Хүлэг';
          nameMap['khuren-guu'] = 'Хүрэн Гүү';
          nameMap['erdeniin-khiimor'] = 'Эрдэнийн Хийморь';

          // Filter Sires (Stallions) and Dams (Mares)
          final sires = horses
              .where(
                (h) =>
                    h.relationLabel.toLowerCase().contains('азарга') ||
                    h.relationLabel.toLowerCase().contains('хүү') ||
                    h.relationLabel.toLowerCase().contains('эцэг'),
              )
              .toList();

          final dams = horses
              .where(
                (h) =>
                    h.relationLabel.toLowerCase().contains('гүү') ||
                    h.relationLabel.toLowerCase().contains('охин') ||
                    h.relationLabel.toLowerCase().contains('эх'),
              )
              .toList();

          // Fallbacks if empty
          final finalSires = sires.isEmpty ? horses : sires;
          final finalDams = dams.isEmpty ? horses : dams;

          // Perform calculation if both are selected
          InbreedingResult? result;
          if (_selectedSireId != null && _selectedDamId != null) {
            result = InbreedingCalculator.calculate(
              _selectedSireId!,
              _selectedDamId!,
              nameMap,
              horses,
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  elevation: 0,
                  color: colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.3,
                  ),
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: colorScheme.outlineVariant),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Цус ойртолтын эрсдэлийг тооцоолох',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Сонгосон азарга болон гүүний удам сударт байгаа нийтлэг өвөг дээдсийг тулган, үр төлд үүсэх цус ойртолтын коэффициентыг Wright-ийн алгоритмаар тооцоолно.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Эцэг азарга сонгох',
                    border: OutlineInputBorder(),
                  ),
                  initialValue: _selectedSireId,
                  items: finalSires
                      .map(
                        (h) => DropdownMenuItem(
                          value: h.id,
                          child: Text('${h.name} (${h.relationLabel})'),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedSireId = val;
                    });
                  },
                ),
                const SizedBox(height: AppSpacing.lg),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Эх гүү сонгох',
                    border: OutlineInputBorder(),
                  ),
                  initialValue: _selectedDamId,
                  items: finalDams
                      .map(
                        (h) => DropdownMenuItem(
                          value: h.id,
                          child: Text('${h.name} (${h.relationLabel})'),
                        ),
                      )
                      .toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedDamId = val;
                    });
                  },
                ),
                const SizedBox(height: AppSpacing.xxl),
                if (result != null) ...[
                  _CalculatorResultView(result: result, nameMap: nameMap),
                ] else ...[
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.xxxxl,
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.calculate_outlined,
                            size: 64,
                            color: colorScheme.outline,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'Азарга болон гүүг сонгож тооцооллыг идэвхжүүлнэ үү.',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: colorScheme.outline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
        loading: () => const SkeletonLoader(
          items: 3,
          itemBuilder: _inbreedingSkeletonBuilder,
        ),
        error: (err, stack) => TamgaErrorWidget(
          message: 'Ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(horsesProvider),
        ),
      ),
    );
  }
}

class _CalculatorResultView extends StatelessWidget {
  const _CalculatorResultView({required this.result, required this.nameMap});

  final InbreedingResult result;
  final Map<String, String> nameMap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Color riskColor = Colors.green;
    if (result.riskLevel == 'Бага эрсдэлтэй') {
      riskColor = Colors.yellow.shade800;
    } else if (result.riskLevel == 'Дунд зэргийн эрсдэлтэй') {
      riskColor = Colors.orange;
    } else if (result.riskLevel == 'Өндөр эрсдэлтэй') {
      riskColor = Colors.red;
    }

    final coiPercentage = (result.coi * 100).toStringAsFixed(3);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              children: [
                Text(
                  'Цус ойртолтын коэффициент (COI)',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.outline,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  '$coiPercentage%',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: riskColor,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: riskColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.fromBorderSide(
                      BorderSide(color: riskColor, width: 1.5),
                    ),
                  ),
                  child: Text(
                    result.riskLevel,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: riskColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xxl),
        Text(
          'Нийтлэг өвөг дээдэс (${result.paths.length})',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        if (result.paths.isEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      'Энэ хоёр адуунд нийтлэг өвөг дээдэс байхгүй тул цус ойртолтын эрсдэлгүй байна.',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          for (final path in result.paths) ...[
            _AncestorPathCard(path: path, nameMap: nameMap),
            const SizedBox(height: AppSpacing.md),
          ],
        ],
      ],
    );
  }
}

class _AncestorPathCard extends StatelessWidget {
  const _AncestorPathCard({required this.path, required this.nameMap});

  final AncestorPath path;
  final Map<String, String> nameMap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final contributionText = (path.contribution * 100).toStringAsFixed(3);

    // Format path steps
    final sirePathNames = path.sirePath
        .map((id) => nameMap[id] ?? id)
        .join(' → ');
    final damPathNames = path.damPath
        .map((id) => nameMap[id] ?? id)
        .join(' → ');

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),
      child: ExpansionTile(
        title: Text(
          path.ancestorName,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '+$contributionText%',
            style: theme.textTheme.labelMedium?.copyWith(
              color: colorScheme.onPrimaryContainer,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Эцэг талын удам (Sire Path):',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.outline,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  sirePathNames,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Эх талын удам (Dam Path):',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.outline,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  damPathNames,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Widget _inbreedingSkeletonBuilder(BuildContext context, int index) =>
    const SkeletonCard(height: 80);
