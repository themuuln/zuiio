/// Худалдагчийн баталгаажуулалтын дэлгэц.
///
/// Утасны дугаар болон E-Mongolia ID баталгаажуулалтын сонголтуудыг харуулна.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/presentation/phone_login_screen.dart';
import '../application/verification_providers.dart';

/// Худалдагчийн баталгаажуулалтын дэлгэц.
class SellerVerificationScreen extends ConsumerWidget {
  const SellerVerificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(sellerVerificationSummaryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Баталгаажуулалт')),
      body: summaryAsync.when(
        data: (summary) {
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              // ── Header ──
              Icon(
                Icons.verified_user_outlined,
                size: 64,
                color: summary.isVerified
                    ? const Color(0xFF2E7D32)
                    : theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                summary.isVerified
                    ? 'Таны худалдагчийн профайл баталгаажсан'
                    : 'Худалдагчийн баталгаажуулалт',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                summary.isVerified
                    ? 'Баталгаажсан худалдагчдын зарууд итгэл төгс байдаг.'
                    : 'Баталгаажуулахын тулд утасны дугаараа баталгаажуулна уу.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xxl),

              // ── Phone Verification Card ──
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            summary.phoneVerified
                                ? Icons.check_circle
                                : Icons.phone_android_outlined,
                            color: summary.phoneVerified
                                ? const Color(0xFF2E7D32)
                                : theme.colorScheme.primary,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            'Утасны дугаар баталгаажуулах',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        summary.phoneVerified
                            ? 'Утасны дугаар (${summary.phone}) баталгаажсан.'
                            : 'Утасны дугаараа баталгаажуулснаар таны зарууд "Баталгаажсан" тэмдэгтэй харагдах болно.',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      SizedBox(
                        width: double.infinity,
                        child: summary.phoneVerified
                            ? OutlinedButton.icon(
                                onPressed: null,
                                icon: const Icon(Icons.check),
                                label: const Text('Баталгаажсан'),
                              )
                            : FilledButton.icon(
                                onPressed: () =>
                                    _startPhoneVerification(context, ref),
                                icon: const Icon(Icons.send),
                                label: const Text('Утас баталгаажуулах'),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // ── E-Mongolia Verification Card ──
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            summary.eMongoliaVerified
                                ? Icons.check_circle
                                : Icons.credit_card_outlined,
                            color: summary.eMongoliaVerified
                                ? const Color(0xFF2E7D32)
                                : theme.colorScheme.primary,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            'E-Mongolia ID баталгаажуулах (Тун удахгүй)',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        summary.eMongoliaVerified
                            ? 'E-Mongolia ID баталгаажсан.'
                            : 'E-Mongolia иргэний үнэмлэхээр баталгаажуулснаар таны зарууд нэмэлт итгэл төгс болно. Энэ функц удахгүй нэмэгдэх болно.',
                        style: theme.textTheme.bodyMedium,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      SizedBox(
                        width: double.infinity,
                        child: summary.eMongoliaVerified
                            ? OutlinedButton.icon(
                                onPressed: null,
                                icon: const Icon(Icons.check),
                                label: const Text('Баталгаажсан'),
                              )
                            : OutlinedButton.icon(
                                onPressed: summary.eMongoliaVerified
                                    ? null
                                    : () => _showEMongoliaDialog(context, ref),
                                icon: const Icon(Icons.hourglass_empty),
                                label: const Text('Бэлтгэгдэж байна'),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // ── Benefits Section ──
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Баталгаажуулалтын ашиг тус',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _BenefitRow(
                        icon: Icons.verified,
                        text: 'Таны зарууд "Баталгаажсан" тэмдэгтэй харагдана',
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      _BenefitRow(
                        icon: Icons.trending_up,
                        text: 'Баталгаажсан зарууд илүү их харагддаг',
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      _BenefitRow(
                        icon: Icons.verified_user_outlined,
                        text: 'Худалдан авагчдын итгэлийг нэмэгдүүлнэ',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => TamgaErrorWidget(
          message: 'Төлөв ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(sellerVerificationSummaryProvider),
        ),
      ),
    );
  }

  Future<void> _startPhoneVerification(
    BuildContext context,
    WidgetRef ref,
  ) async {
    // Navigate to the existing phone login screen to start OTP flow.
    // After successful verification, the user completes the OTP flow.
    // We catch the navigation back and check the verification status.
    final phone = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (ctx) => const _PhoneVerificationWrapper()),
    );

    if (phone != null && context.mounted) {
      // Complete the phone verification
      await ref
          .read(phoneVerificationNotifierProvider)
          .completePhoneVerification(phone: phone);

      if (context.mounted) {
        TamgaToast.showSuccess(
          context,
          'Утасны дугаар амжилттай баталгаажлаа!',
        );
        ref.invalidate(sellerVerificationSummaryProvider);
      }
    }
  }

  Future<void> _showEMongoliaDialog(BuildContext context, WidgetRef ref) async {
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('E-Mongolia баталгаажуулалт'),
        content: const Text(
          'E-Mongolia ID баталгаажуулалтын функц бэлтгэгдэж байна. '
          'Тун удахгүй та E-Mongolia иргэний үнэмлэхээр '
          'худалдагчийн профайлаа баталгаажуулах боломжтой болно.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Ойлголоо'),
          ),
        ],
      ),
    );
  }
}

/// Wrapper that navigates to the phone login flow and returns the verified phone number.
class _PhoneVerificationWrapper extends ConsumerStatefulWidget {
  const _PhoneVerificationWrapper();

  @override
  ConsumerState<_PhoneVerificationWrapper> createState() =>
      _PhoneVerificationWrapperState();
}

class _PhoneVerificationWrapperState
    extends ConsumerState<_PhoneVerificationWrapper> {
  @override
  void initState() {
    super.initState();
    // Navigate to phone login after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (ctx) => const PhoneLoginScreen()));
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

/// Ашиг тусын мөр.
class _BenefitRow extends StatelessWidget {
  const _BenefitRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.primary),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: Text(text, style: theme.textTheme.bodyMedium)),
      ],
    );
  }
}
