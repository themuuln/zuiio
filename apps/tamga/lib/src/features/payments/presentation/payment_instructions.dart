/// Төлбөрийн заавар харуулах карт.
library;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/payment_request.dart';

/// Төлбөрийн заавар харуулах карт.
class PaymentInstructionsCard extends StatelessWidget {
  const PaymentInstructionsCard({
    required this.payment,
    required this.onStatusChecked,
    super.key,
  });

  /// Төлбөрийн хүсэлт.
  final PaymentRequest payment;

  /// Төлөв шалгах үйлдэл.
  final VoidCallback onStatusChecked;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Padding(
        padding: AppSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // header
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

            // банкны мэдээлэл
            _InfoRow(label: 'Банк', value: 'Хаан Банк (Khan Bank)'),
            const SizedBox(height: AppSpacing.sm),
            _InfoRow(
              label: 'Дансны дугаар',
              value: 'MN110005005431666225',
              onCopy: () => _copyToClipboard(context, 'MN110005005431666225'),
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

            // төлбөрийн код
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
                        onPressed: () =>
                            _copyToClipboard(context, payment.code),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // анхааруулга
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: theme.colorScheme.onErrorContainer,
                    size: 20,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'Гүйлгээний утга: ${payment.code}\nЗөвхөн энэ кодтой гүйлгээ хүлээн авна.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onErrorContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // зааварчилгаа
            _InstructionStep(number: 1, text: 'Хаан Банкны апп-аар нэвтрэх'),
            const SizedBox(height: AppSpacing.sm),
            _InstructionStep(
              number: 2,
              text: 'Гүйлгээ хийх → Дансны дугаар: MN110005005431666225',
            ),
            const SizedBox(height: AppSpacing.sm),
            _InstructionStep(
              number: 3,
              text: 'Гүйлгээний утга: ${payment.code}',
            ),
            const SizedBox(height: AppSpacing.sm),
            _InstructionStep(number: 4, text: 'Төлбөрийн зүйлийг сонгох'),
            const SizedBox(height: AppSpacing.lg),

            // төлөв шалгах
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onStatusChecked,
                icon: const Icon(Icons.refresh),
                label: const Text('Төлөв шалгах'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _copyToClipboard(BuildContext context, String text) {
    Clipboard.setData(ClipboardData(text: text));
    TamgaToast.show(context, 'Хуулагдлаа');
  }
}

/// Төлөвийн чип.
class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (label, color) = switch (status) {
      PaymentStatus.pending => ('Хүлээгдэж байна', Colors.orange),
      PaymentStatus.verified => ('Баталгаажсан', Colors.green),
      PaymentStatus.rejected => ('Татгалзсан', Colors.red),
      PaymentStatus.expired => ('Хугацаа дууссан', Colors.grey),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(color: color),
      ),
    );
  }
}

/// Мэдээллийн мөр.
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
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Row(
          children: [
            Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
                color: highlight ? theme.colorScheme.primary : null,
              ),
            ),
            if (onCopy != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: onCopy,
                child: Icon(
                  Icons.copy,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

/// Зааварчилгааны алхам.
class _InstructionStep extends StatelessWidget {
  const _InstructionStep({required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$number',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onPrimaryContainer,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: Text(text, style: theme.textTheme.bodyMedium)),
      ],
    );
  }
}
