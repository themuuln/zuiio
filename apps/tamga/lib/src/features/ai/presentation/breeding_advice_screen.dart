/// Үржүүлгийн зөвлөгөө өгөх дэлгэц.
///
/// Хэрэглэгч хоёр морио сонгоод (аав + ээж) "Анализ хийх" товч дарж,
/// цус ойртолтын эрсдэл, эрүүл мэндийн нийцэл, өнгөний таамаглал,
/// үүлдрийн зөвлөмжийг харна.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../payments/domain/payment_request.dart';
import '../../payments/presentation/widgets/paywall_widget.dart';
import '../application/ai_providers.dart';
import '../domain/breeding_advice.dart';
import '../domain/breeding_query.dart';
import 'breeding_result_card.dart';

/// Үржүүлгийн зөвлөгөө өгөх дэлгэц.
class BreedingAdviceScreen extends ConsumerStatefulWidget {
  const BreedingAdviceScreen({super.key});

  @override
  ConsumerState<BreedingAdviceScreen> createState() =>
      _BreedingAdviceScreenState();
}

class _BreedingAdviceScreenState extends ConsumerState<BreedingAdviceScreen> {
  // ── Төлөв ───────────────────────────────────────────────────────────
  String? _selectedSireId;
  String? _selectedDamId;
  BreedingAdvice? _result;
  AppException? _error;
  bool _isLoading = false;

  // ── Геттерууд ───────────────────────────────────────────────────────

  List<Horse> get _stallions =>
      ref
          .watch(horsesProvider)
          .valueOrNull
          ?.where((h) => h.gender == HorseGender.stallion)
          .toList() ??
      [];

  List<Horse> get _mares =>
      ref
          .watch(horsesProvider)
          .valueOrNull
          ?.where((h) => h.gender == HorseGender.mare)
          .toList() ??
      [];

  bool get _canAnalyze =>
      _selectedSireId != null &&
      _selectedDamId != null &&
      _selectedSireId != _selectedDamId &&
      !_isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final horsesAsync = ref.watch(horsesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Үржүүлгийн зөвлөгөө')),
      body: horsesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => TamgaErrorWidget(
          message: 'Морьдын мэдээлэл ачаалахад алдаа гарлаа: $err',
          onRetry: () => ref.invalidate(horsesProvider),
        ),
        data: (_) => _buildContent(theme),
      ),
    );
  }

  Widget _buildContent(ThemeData theme) {
    final stallions = _stallions;
    final mares = _mares;

    if (stallions.isEmpty || mares.isEmpty) {
      return _buildEmptyState(
        theme,
        stallions.isEmpty && mares.isEmpty
            ? 'Азарга болон гүү бүртгээгүй байна.'
            : stallions.isEmpty
            ? 'Азарга бүртгээгүй байна.'
            : 'Гүү бүртгээгүй байна.',
        'Үржүүлгийн зөвлөгөө авахын тулд эхлээд азарга (stallion) болон гүү (mare) бүртгэнэ үү.',
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Тайлбар ──
          _buildHeaderCard(theme),
          const SizedBox(height: AppSpacing.xl),

          // ── Хос сонголт ──
          _buildPairSelector(theme, stallions, mares),
          const SizedBox(height: AppSpacing.xl),

          // ── Анализ хийх товч ──
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton.icon(
              onPressed: _canAnalyze ? _analyzePair : null,
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(
                _isLoading ? 'Шинжилж байна...' : 'Анализ хийх',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // ── Алдаа ──
          if (_error != null) _buildErrorState(theme, _error!),

          // ── Үр дүн ──
          if (_result != null) ...[
            // Квотын мэдээлэл
            _buildQuotaInfo(theme),
            const SizedBox(height: AppSpacing.lg),
            BreedingResultCard(advice: _result!),
          ],

          // ── Квот дууссан (хязгаарт хүрсэн) ──
          if (!_isLoading && _error == null && _result == null)
            _buildQuotaWarning(theme),
        ],
      ),
    );
  }

  // ── Тайлбар карт ────────────────────────────────────────────────────

  Widget _buildHeaderCard(ThemeData theme) {
    return Card(
      color: theme.colorScheme.primaryContainer.withValues(alpha: 0.2),
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: theme.colorScheme.primaryContainer, width: 1),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.auto_awesome,
                  color: theme.colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'AI Үржүүлгийн зөвлөгөө',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Аав (sire) болон ээж (dam) морио сонгоод, AI-аас '
              'цус ойртолтын эрсдэл, өнгөний таамаглал, '
              'эрүүл мэндийн зөвлөмж авах.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Хос сонголт ─────────────────────────────────────────────────────

  Widget _buildPairSelector(
    ThemeData theme,
    List<Horse> stallions,
    List<Horse> mares,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Хос сонгох',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // ── Аав морь ──
        DropdownButtonFormField<String>(
          initialValue: _selectedSireId,
          decoration: const InputDecoration(
            labelText: 'Аав морь (Sire)',
            prefixIcon: Icon(Icons.male),
            border: OutlineInputBorder(),
          ),
          items: stallions.map((horse) {
            return DropdownMenuItem<String>(
              value: horse.id,
              child: Text(
                '${horse.displayName} (${horse.coat}, ${horse.birthYear})',
                overflow: TextOverflow.ellipsis,
              ),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedSireId = value;
              _result = null;
              _error = null;
            });
          },
        ),
        const SizedBox(height: AppSpacing.md),

        // ── Ээж морь ──
        DropdownButtonFormField<String>(
          initialValue: _selectedDamId,
          decoration: const InputDecoration(
            labelText: 'Ээж морь (Dam)',
            prefixIcon: Icon(Icons.female),
            border: OutlineInputBorder(),
          ),
          items: mares.map((horse) {
            return DropdownMenuItem<String>(
              value: horse.id,
              child: Text(
                '${horse.displayName} (${horse.coat}, ${horse.birthYear})',
                overflow: TextOverflow.ellipsis,
              ),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedDamId = value;
              _result = null;
              _error = null;
            });
          },
        ),
      ],
    );
  }

  // ── Шинжилгээ ──────────────────────────────────────────────────────

  Future<void> _analyzePair() async {
    if (_selectedSireId == null || _selectedDamId == null) return;

    // Квот шалгах
    final quota = await ref.read(breedingQuotaProvider.future);
    if (quota.isExhausted) {
      _showUpgradePrompt();
      return;
    }

    setState(() {
      _isLoading = true;
      _result = null;
      _error = null;
    });

    final repository = ref.read(aiRepositoryProvider);
    final query = BreedingQuery(
      sireId: _selectedSireId!,
      damId: _selectedDamId!,
    );

    final result = await repository.getBreedingAdvice(query);

    if (!mounted) return;

    result.when(
      onSuccess: (advice) {
        // Квотыг нэмэгдүүлэх
        ref.read(breedingQueryCountProvider.notifier).state++;
        setState(() {
          _result = advice;
          _isLoading = false;
        });

        // Квот дуусвал prompt харуулах
        if (advice.quota != null && advice.quota!.remaining == 0) {
          _showUpgradePrompt();
        }
      },
      onFailure: (error) {
        setState(() {
          _error = error;
          _isLoading = false;
        });
      },
    );
  }

  // ── Квот дууссан анхааруулга ──────────────────────────────────────

  Widget _buildQuotaWarning(ThemeData theme) {
    // Only show on initial load if quota is already exhausted
    return const SizedBox.shrink();
  }

  Widget _buildQuotaInfo(ThemeData theme) {
    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          children: [
            Icon(
              Icons.bar_chart_rounded,
              size: 16,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                _buildQuotaText(),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _buildQuotaText() {
    final quota = ref.watch(breedingQuotaProvider).valueOrNull;
    if (quota == null) return '';
    if (quota.limit == null) return 'Хязгааргүй шинжилгээ';
    final remaining = quota.remaining ?? 0;
    return 'Энэ сард ${quota.used}/ ${quota.limit} шинжилгээ ашигласан'
        ' ($remaining үлдсэн)';
  }

  // ── Upgrade prompt ──────────────────────────────────────────────────

  void _showUpgradePrompt() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PaywallWidget(
        denied: const GateDenied(
          reason:
              'Үнэгүй түвшинд сард 5 удаа AI шинжилгээ хийх боломжтой. '
              'Pro захиалгаар 50 удаа, Breeder+ хязгааргүй.',
          requiredTier: SubscriptionTier.pro,
        ),
        onDismiss: () => Navigator.of(context).pop(),
      ),
    );
  }

  // ── Алдаа ───────────────────────────────────────────────────────────

  Widget _buildErrorState(ThemeData theme, AppException error) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: TamgaErrorWidget(message: error.message, onRetry: _analyzePair),
    );
  }

  // ── Хоосон төлөв ────────────────────────────────────────────────────

  Widget _buildEmptyState(ThemeData theme, String title, String description) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: EmptyState(
          icon: Icons.pets_outlined,
          title: title,
          description: description,
        ),
      ),
    );
  }
}
