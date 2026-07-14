import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/payment_providers.dart';
import '../domain/payment_request.dart';
import 'widgets/payment_status.dart';

/// Төлбөрийн хуудас — subscription түвшин сонгох, төлбөрийн заавар харуулах.
class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  SubscriptionTier? _selectedTier;
  PaymentRequest? _createdRequest;
  bool _isCreating = false;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final userId = currentSupabaseUserId();

    return Scaffold(
      appBar: AppBar(title: const Text('Захиалга')),
      body: userId == null
          ? _NotAuthenticated(theme: theme)
          : CustomScrollView(
              slivers: [
                // ── Subscription Status ──────────────────────────
                const SliverPadding(
                  padding: EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.md,
                    AppSpacing.lg,
                    0,
                  ),
                  sliver: SliverToBoxAdapter(child: PaymentStatusWidget()),
                ),
                const SliverPadding(
                  padding: EdgeInsets.only(top: AppSpacing.md),
                  sliver: SliverToBoxAdapter(child: Divider(height: 1)),
                ),

                // ── Created Payment — show instructions ──────────
                if (_createdRequest != null)
                  SliverPadding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    sliver: SliverToBoxAdapter(
                      child: _PaymentInstructions(
                        payment: _createdRequest!,
                        onStatusChecked: _refreshStatus,
                      ),
                    ),
                  ),

                // ── Tier Selection ───────────────────────────────
                if (_createdRequest == null) ...[
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.sm,
                    ),
                    sliver: SliverToBoxAdapter(
                      child: Text(
                        'Түвшин сонгох',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      0,
                      AppSpacing.lg,
                      AppSpacing.lg,
                    ),
                    sliver: SliverList.separated(
                      itemCount: SubscriptionTier.values.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: AppSpacing.md),
                      itemBuilder: (ctx, index) {
                        final tier = SubscriptionTier.values[index];
                        return _TierCard(
                          tier: tier,
                          isSelected: _selectedTier == tier,
                          isFree: tier == SubscriptionTier.free,
                          onTap: () => setState(() => _selectedTier = tier),
                        );
                      },
                    ),
                  ),

                  // ── Create Button ──────────────────────────────
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      0,
                      AppSpacing.lg,
                      AppSpacing.xxxl,
                    ),
                    sliver: SliverToBoxAdapter(
                      child: FilledButton(
                        onPressed:
                            (_selectedTier != null &&
                                _selectedTier != SubscriptionTier.free &&
                                !_isCreating)
                            ? _createPaymentRequest
                            : null,
                        child: _isCreating
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Төлбөрийн хүсэлт үүсгэх'),
                      ),
                    ),
                  ),
                ],
              ],
            ),
    );
  }

  Future<void> _createPaymentRequest() async {
    if (_selectedTier == null) return;
    setState(() => _isCreating = true);

    try {
      final userId = currentSupabaseUserId();
      if (userId == null) {
        if (mounted) {
          TamgaToast.show(context, 'Нэвтрэх шаардлагатай');
        }
        return;
      }

      final service = ref.read(paymentServiceProvider);
      final result = await service.createPaymentRequest(
        userId: userId,
        tier: _selectedTier!,
      );

      result.when(
        onSuccess: (payment) {
          setState(() {
            _createdRequest = payment;
            _isCreating = false;
          });
        },
        onFailure: (error) {
          setState(() => _isCreating = false);
          if (mounted) {
            TamgaToast.showError(context, error.message);
          }
        },
      );
    } catch (e) {
      setState(() => _isCreating = false);
      if (mounted) {
        TamgaToast.showError(context, 'Алдаа: $e');
      }
    }
  }

  Future<void> _refreshStatus() async {
    if (_createdRequest == null) return;
    final service = ref.read(paymentServiceProvider);
    final result = await service.getPaymentStatus(_createdRequest!.id);
    result.when(
      onSuccess: (updated) {
        setState(() => _createdRequest = updated);
        ref.invalidate(subscriptionTierProvider);
        ref.invalidate(activePaymentProvider);
      },
      onFailure: (_) {},
    );
  }
}

// ── Not Authenticated View ──────────────────────────────────

class _NotAuthenticated extends StatelessWidget {
  const _NotAuthenticated({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext ctx) {
    final tc = TamgaColors.of(ctx);
    return Center(
      child: Padding(
        padding: AppSpacing.screenPadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline, size: 48, color: tc.onSurfaceVariant),
            const SizedBox(height: AppSpacing.md),
            Text('Нэвтрэх шаардлагатай', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Төлбөрийн хуудсыг ашиглахын тулд нэвтэрнэ үү.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: tc.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Tier Selection Card ─────────────────────────────────────

class _TierCard extends StatelessWidget {
  const _TierCard({
    required this.tier,
    required this.isSelected,
    required this.isFree,
    required this.onTap,
  });

  final SubscriptionTier tier;
  final bool isSelected;
  final bool isFree;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);
    final features = _tierFeatures(tier);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(
          color: isSelected ? theme.colorScheme.primary : tc.outline,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        onTap: isFree ? null : onTap,
        child: Padding(
          padding: AppSpacing.cardPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tier.displayName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (!isFree) ...[
                          const SizedBox(height: 2),
                          Text(
                            tier.formattedPrice,
                            style: theme.textTheme.titleLarge?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle, color: theme.colorScheme.primary)
                  else if (isFree)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: tc.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.cornerRadiusPill,
                        ),
                      ),
                      child: Text(
                        'Одоогийн',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: tc.onSurfaceVariant,
                        ),
                      ),
                    ),
                ],
              ),
              if (features.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                ...features.map(
                  (f) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check,
                          size: 16,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            f,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: tc.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  List<String> _tierFeatures(SubscriptionTier tier) {
    switch (tier) {
      case SubscriptionTier.free:
        return ['3 морь нэмэх', 'Үндсэн мэдээлэл'];
      case SubscriptionTier.pro:
        return [
          '20 морь нэмэх',
          'Гэр бүлийн хүрээ',
          'Тэмдэглэл, эрүүл мэндийн бүртгэл',
          'Эрэмбэлэх ба хайлт',
        ];
      case SubscriptionTier.breeder:
        return [
          '100 морь нэмэх',
          'Бүх Pro боломжууд',
          'Үржүүлэлтийн удирдлага',
          'Менежментийн хэрэгслүүд',
        ];
      case SubscriptionTier.stable:
        return [
          'Хязгааргүй морь',
          'Бүх Breeder боломжууд',
          'Багийн хамтын ажиллагаа',
          'Захын зар',
          'Тэргүүн эрэмбэ',
        ];
    }
  }
}

// ── Payment Instructions ────────────────────────────────────

class _PaymentInstructions extends StatelessWidget {
  const _PaymentInstructions({
    required this.payment,
    required this.onStatusChecked,
  });

  final PaymentRequest payment;
  final VoidCallback onStatusChecked;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Padding(
        padding: AppSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ────────────────────────────────────────
            Row(
              children: [
                Icon(Icons.account_balance, color: theme.colorScheme.primary),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Төлбөрийн заавар',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                _StatusChip(status: payment.status),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Bank Details ──────────────────────────────────
            _InfoRow(label: 'Банк', value: 'Хаан Банк (Khan Bank)'),
            const SizedBox(height: AppSpacing.sm),
            _InfoRow(
              label: 'Дансны дугаар',
              value: 'MN110005005431666225',
              onCopy: () => _copyToClipboard(ctx, 'MN110005005431666225'),
            ),
            const SizedBox(height: AppSpacing.sm),
            _InfoRow(label: 'Хүлээн авагч', value: 'Temuulen Undrakhbayar'),
            const SizedBox(height: AppSpacing.sm),
            _InfoRow(
              label: 'Дүн',
              value: payment.tier.formattedPrice,
              highlight: true,
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Payment Code ──────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
              ),
              child: Column(
                children: [
                  Text(
                    'Таны код',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        payment.code,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 20),
                        tooltip: 'Код хуулах',
                        onPressed: () => _copyToClipboard(ctx, payment.code),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Important Note ────────────────────────────────
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: tc.error.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
                border: Border.all(color: tc.error.withValues(alpha: 0.15)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.warning_amber, size: 20, color: tc.error),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'Тухайн кодыг заавал шилжүүлгийн тэмдэглэлд бичнэ үү',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: tc.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Status-dependent content ───────────────────────
            if (payment.status == PaymentStatus.pending) ...[
              FilledButton.icon(
                onPressed: onStatusChecked,
                icon: const Icon(Icons.refresh, size: 20),
                label: const Text('Баталгаажуулсан'),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Төлбөрөө шилжүүлсний дараа "Баталгаажуулсан" дээр дарна уу.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: tc.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.md),
              OutlinedButton.icon(
                onPressed: () => _sharePaymentDetails(ctx),
                icon: const Icon(Icons.share, size: 20),
                label: const Text('Мэдээлэл хуваалцах'),
              ),
            ],

            if (payment.status == PaymentStatus.verified)
              _StatusBanner(
                icon: Icons.check_circle,
                color: tc.tertiary,
                message: 'Төлбөр баталгаажлаа! Захиалга идэвхжлээ.',
              ),

            if (payment.status == PaymentStatus.rejected)
              _RejectionBanner(payment: payment),

            if (payment.status == PaymentStatus.expired)
              _StatusBanner(
                icon: Icons.access_time,
                color: tc.primary,
                message: 'Хугацаа дууссан. Шинэ хүсэлт үүсгэнэ үү.',
              ),
          ],
        ),
      ),
    );
  }

  void _copyToClipboard(BuildContext ctx, String text) {
    Clipboard.setData(ClipboardData(text: text));
    TamgaToast.show(ctx, 'Хуулагдлаа: $text');
  }

  void _sharePaymentDetails(BuildContext ctx) {
    final text =
        '''
Төлбөрийн мэдээлэл — Tamga

Банк: Хаан Банк (Khan Bank)
Данс: MN110005005431666225
Хүлээн авагч: Temuulen Undrakhbayar
Дүн: ${payment.tier.formattedPrice}

Таны код: ${payment.code}

Кодоо заавал шилжүүлгийн тэмдэглэлд бичнэ үү!
''';
    Clipboard.setData(ClipboardData(text: text));
    TamgaToast.show(ctx, 'Мэдээлэл хуулагдлаа');
  }
}

// ── Status Banner ───────────────────────────────────────────

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.color,
    required this.message,
  });

  final IconData icon;
  final Color color;
  final String message;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Rejection Banner ────────────────────────────────────────

class _RejectionBanner extends StatelessWidget {
  const _RejectionBanner({required this.payment});

  final PaymentRequest payment;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: tc.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.cancel, color: tc.error),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Төлбөр татгалзлаа',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: tc.error,
                ),
              ),
            ],
          ),
          if (payment.adminNotes != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              payment.adminNotes!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: tc.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Info Row ────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.highlight = false,
    this.onCopy,
  });

  final String label;
  final String value;
  final bool highlight;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);
    return Row(
      children: [
        Text(
          '$label:',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: tc.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
              color: highlight ? theme.colorScheme.primary : tc.onSurface,
            ),
          ),
        ),
        if (onCopy != null)
          IconButton(
            icon: const Icon(Icons.copy, size: 16),
            onPressed: onCopy,
            visualDensity: VisualDensity.compact,
          ),
      ],
    );
  }
}

// ── Status Chip ─────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final PaymentStatus status;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);
    final Color color;
    switch (status) {
      case PaymentStatus.pending:
        color = tc.primary;
      case PaymentStatus.verified:
        color = tc.tertiary;
      case PaymentStatus.rejected:
        color = tc.error;
      case PaymentStatus.expired:
        color = tc.onSurfaceVariant;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm + 2,
        vertical: AppSpacing.xs + 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        status.displayName,
        style: theme.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
