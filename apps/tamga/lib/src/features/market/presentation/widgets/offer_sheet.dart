import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../application/offer_providers.dart';
import '../../domain/market_offer.dart';

// ══════════════════════════════════════════════════════════════════
// Үнийн санал илгээх Bottom Sheet
// ══════════════════════════════════════════════════════════════════

/// Худалдан авагч үнийн санал илгээх bottom sheet.
class SendOfferSheet extends ConsumerStatefulWidget {
  const SendOfferSheet({
    required this.listingId,
    required this.sellerId,
    required this.listingPrice,
    super.key,
  });

  final String listingId;
  final String sellerId;
  final int listingPrice;

  /// Bottom sheet-ийг нээж, амжилттай илгээгдсэн эсэхийг буцаана.
  static Future<bool> show(
    BuildContext context, {
    required String listingId,
    required String sellerId,
    required int listingPrice,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => SendOfferSheet(
        listingId: listingId,
        sellerId: sellerId,
        listingPrice: listingPrice,
      ),
    ).then((result) => result ?? false);
  }

  @override
  ConsumerState<SendOfferSheet> createState() => _SendOfferSheetState();
}

class _SendOfferSheetState extends ConsumerState<SendOfferSheet> {
  final _amountController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    // Default to 80% of listing price
    _amountController.text = (widget.listingPrice * 0.8).round().toString();
  }

  @override
  void dispose() {
    _amountController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.cornerRadius),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.lg,
          right: AppSpacing.lg,
          top: AppSpacing.lg,
          bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Drag Handle ────────────────────────────────
            Center(
              child: Container(
                width: 36,
                height: 5,
                margin: const EdgeInsets.only(bottom: AppSpacing.lg),
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(
                    AppSpacing.cornerRadiusPill,
                  ),
                ),
              ),
            ),

            // ── Header ─────────────────────────────────────
            Text(
              'Үнийн санал илгээх',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Зарын үнэ: ${_formatPrice(widget.listingPrice)}',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // ── Amount Field ────────────────────────────────
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Таны санал (MNT)',
                prefixText: '₮ ',
                border: const OutlineInputBorder(),
                suffixText: 'MNT',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Message Field ──────────────────────────────
            TextField(
              controller: _messageController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Мессеж (заавал биш)',
                hintText: 'Сайн уу? Үнэ тохиролцох боломжтой юу?',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // ── Submit Button ──────────────────────────────
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isSubmitting ? null : _submitOffer,
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Санал илгээх'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitOffer() async {
    final amountText = _amountController.text.trim();
    final amount = int.tryParse(amountText);
    if (amount == null || amount <= 0) {
      _showError('Зөв үнэ оруулна уу');
      return;
    }

    setState(() => _isSubmitting = true);

    final actions = ref.read(offerActionsProvider);
    final result = await actions.createOffer(
      listingId: widget.listingId,
      sellerId: widget.sellerId,
      amount: amount,
      message: _messageController.text.trim().isEmpty
          ? null
          : _messageController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (!context.mounted) return; // ignore: use_build_context_synchronously

    if (result.isSuccess) {
      // ignore: use_build_context_synchronously
      Navigator.of(context).pop(true);
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Үнийн санал амжилттай илгээгдлээ!')),
      );
    } else {
      _showError('Санал илгээхэд алдаа гарлаа: ${result.error.message}');
    }
  }

  void _showError(String message) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Саналын түүх - Listing Detail дээр харуулах
// ══════════════════════════════════════════════════════════════════

/// Зарын үнийн саналуудын түүх.
class OfferHistoryCard extends ConsumerWidget {
  const OfferHistoryCard({
    required this.listingId,
    required this.isSeller,
    required this.listingPrice,
    super.key,
  });

  final String listingId;
  final bool isSeller;
  final int listingPrice;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offersAsync = ref.watch(offersForListingProvider(listingId));
    final theme = Theme.of(context);

    return offersAsync.when(
      data: (offers) {
        if (offers.isEmpty) return const SizedBox.shrink();

        return Card(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.local_offer_outlined,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Үнийн саналууд', style: theme.textTheme.titleLarge),
                    const Spacer(),
                    Text(
                      '${offers.length}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                ...offers.map(
                  (offer) => _OfferHistoryItem(
                    offer: offer,
                    isSeller: isSeller,
                    listingPrice: listingPrice,
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _OfferHistoryItem extends StatelessWidget {
  const _OfferHistoryItem({
    required this.offer,
    required this.isSeller,
    required this.listingPrice,
  });

  final MarketOffer offer;
  final bool isSeller;
  final int listingPrice;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final statusColor = switch (offer.status) {
      MarketOfferStatus.pending => theme.colorScheme.primary,
      MarketOfferStatus.accepted => theme.colorScheme.tertiary,
      MarketOfferStatus.declined => theme.colorScheme.error,
      MarketOfferStatus.countered => Colors.orange,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                _formatPrice(offer.amount),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(
                    AppSpacing.cornerRadiusPill,
                  ),
                ),
                child: Text(
                  offer.statusLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (offer.counterAmount != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Хариу санал: ${_formatPrice(offer.counterAmount!)}',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.orange),
            ),
          ],
          if (offer.message != null && offer.message!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              offer.message!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.xs),
          Text(
            _formatDate(offer.createdAt),
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Хариу өгөх Dialog (Худалдагчид зориулсан)
// ══════════════════════════════════════════════════════════════════

/// Худалдагч саналд хариу өгөх dialog.
class OfferResponseDialog extends StatefulWidget {
  const OfferResponseDialog({
    required this.offer,
    required this.listingPrice,
    super.key,
  });

  final MarketOffer offer;
  final int listingPrice;

  /// Dialog-ийг нээж, хариуны мэдээллийг буцаана.
  /// Буцах утга: (MarketOfferStatus, int? counterAmount) эсвэл null (цуцалсан).
  static Future<(MarketOfferStatus, int?)?> show(
    BuildContext context, {
    required MarketOffer offer,
    required int listingPrice,
  }) {
    return showDialog<(MarketOfferStatus, int?)>(
      context: context,
      builder: (_) =>
          OfferResponseDialog(offer: offer, listingPrice: listingPrice),
    );
  }

  @override
  State<OfferResponseDialog> createState() => _OfferResponseDialogState();
}

class _OfferResponseDialogState extends State<OfferResponseDialog> {
  final _counterController = TextEditingController();
  bool _isCountering = false;

  @override
  void initState() {
    super.initState();
    _counterController.text = widget.offer.amount.toString();
  }

  @override
  void dispose() {
    _counterController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      title: Text('Саналд хариу өгөх', style: theme.textTheme.titleLarge),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Санал болгосон үнэ: ${_formatPrice(widget.offer.amount)}',
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          if (widget.offer.message != null &&
              widget.offer.message!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Мессеж: ${widget.offer.message}',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontStyle: FontStyle.italic,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          const Divider(),
          const SizedBox(height: AppSpacing.sm),

          // ── Accept Button ─────────────────────────────
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () =>
                  Navigator.of(context).pop((MarketOfferStatus.accepted, null)),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Зөвшөөрөх'),
              style: FilledButton.styleFrom(
                backgroundColor: theme.colorScheme.tertiary,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // ── Counter Offer Toggle ──────────────────────
          if (!_isCountering)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => setState(() => _isCountering = true),
                icon: const Icon(Icons.swap_horiz),
                label: const Text('Хариу санал өгөх'),
              ),
            )
          else ...[
            TextField(
              controller: _counterController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Таны хариу үнэ (MNT)',
                prefixText: '₮ ',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _submitCounter,
                icon: const Icon(Icons.send),
                label: const Text('Хариу санал илгээх'),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextButton(
              onPressed: () => setState(() => _isCountering = false),
              child: const Text('Буцах'),
            ),
          ],
          const SizedBox(height: AppSpacing.sm),

          // ── Decline Button ────────────────────────────
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () =>
                  Navigator.of(context).pop((MarketOfferStatus.declined, null)),
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Татгалзах'),
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.error,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _submitCounter() {
    final text = _counterController.text.trim();
    final amount = int.tryParse(text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Зөв үнэ оруулна уу'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    Navigator.of(context).pop((MarketOfferStatus.countered, amount));
  }
}

// ══════════════════════════════════════════════════════════════════
// Туслах функцууд
// ══════════════════════════════════════════════════════════════════

String _formatPrice(int value) {
  final formatted = value.toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (match) => ',',
  );
  return '$formatted MNT';
}

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
      '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}
