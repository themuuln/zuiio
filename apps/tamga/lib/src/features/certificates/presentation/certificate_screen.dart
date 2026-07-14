import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/error/result.dart';
import '../../../core/widgets/widgets.dart';
import '../application/certificate_providers.dart';
import '../domain/ownership_certificate.dart';

/// Дижитал эзэмшлийн гэрчилгээний дэлгэрэнгүй хуудас.
class CertificateScreen extends ConsumerStatefulWidget {
  const CertificateScreen({required this.certificateId, super.key});

  final String certificateId;

  @override
  ConsumerState<CertificateScreen> createState() => _CertificateScreenState();
}

class _CertificateScreenState extends ConsumerState<CertificateScreen> {
  bool _isTransferring = false;

  @override
  Widget build(BuildContext ctx) {
    final repo = ref.watch(certificateRepositoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Гэрчилгээ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Хуваалцах',
            onPressed: _shareCertificate,
          ),
        ],
      ),
      body: FutureBuilder<Result<CertificateVerification>>(
        future: repo.verifyCertificate(widget.certificateId),
        builder: (ctx, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const SkeletonLoader(
              items: 3,
              itemBuilder: _certificateSkeletonBuilder,
            );
          }

          if (!snapshot.hasData) {
            return TamgaErrorWidget(
              message: 'Мэдээлэл татаж чадсангүй',
              onRetry: () => setState(() {}),
            );
          }

          final result = snapshot.data!;
          return switch (result) {
            Ok(value: final verification) => _CertificateContent(
              verification: verification,
              onTransfer: _transferCertificate,
              isTransferring: _isTransferring,
            ),
            Fail(error: final error) => TamgaErrorWidget(
              message: error.message,
              onRetry: () => setState(() {}),
            ),
          };
        },
      ),
    );
  }

  void _shareCertificate() {
    final text =
        '''
Дижитал эзэмшлийн гэрчилгээ

Гэрчилгээний дугаар: ${widget.certificateId}
Төлөв: Шалгаж байна...

Tamga — Монгол морины удирдлагын систем
''';
    Clipboard.setData(ClipboardData(text: text));
    TamgaToast.show(context, 'Гэрчилгээний мэдээлэл хуулагдлаа');
  }

  Future<void> _transferCertificate({
    required String certificateId,
    required String newOwnerId,
    required String newOwnerName,
  }) async {
    setState(() => _isTransferring = true);

    final repo = ref.read(certificateRepositoryProvider);
    final result = await repo.transferCertificate(
      certificateId: certificateId,
      newOwnerId: newOwnerId,
      newOwnerName: newOwnerName,
    );

    setState(() => _isTransferring = false);

    result.when(
      onSuccess: (_) {
        if (mounted) {
          TamgaToast.showSuccess(context, 'Гэрчилгээ амжилттай шилжүүллээ');
          Navigator.of(context).pop();
        }
      },
      onFailure: (error) {
        if (mounted) {
          TamgaToast.showError(context, error.message);
        }
      },
    );
  }
}

// ── Certificate Content ─────────────────────────────────────

class _CertificateContent extends StatelessWidget {
  const _CertificateContent({
    required this.verification,
    required this.onTransfer,
    required this.isTransferring,
  });

  final CertificateVerification verification;
  final Future<void> Function({
    required String certificateId,
    required String newOwnerId,
    required String newOwnerName,
  })
  onTransfer;
  final bool isTransferring;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final cert = verification.certificate;
    final tc = TamgaColors.of(ctx);

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.xxxxl,
      ),
      children: [
        // ── Status Banner ──
        _StatusBanner(
          isValid: verification.isValid,
          message: verification.message,
        ),
        const SizedBox(height: AppSpacing.xl),

        // ── Certificate Card ──
        Card(
          child: Padding(
            padding: AppSpacing.cardPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header ──
                Row(
                  children: [
                    Icon(
                      verification.isValid
                          ? Icons.verified
                          : Icons.error_outline,
                      color: verification.isValid ? tc.tertiary : tc.error,
                      size: 28,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Дижитал эзэмшлийн гэрчилгээ',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                const Divider(),
                const SizedBox(height: AppSpacing.md),

                // ── QR Code placeholder ──
                Center(
                  child: Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadius,
                      ),
                      border: Border.all(color: tc.outline),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.qr_code_2,
                            size: 80,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            cert.qrCode,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: tc.onSurfaceVariant,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // ── Details ──
                _DetailRow(
                  label: 'Гэрчилгээний дугаар',
                  value: cert.id,
                  tc: tc,
                ),
                _DetailRow(
                  label: 'Морь',
                  value: cert.horseName ?? cert.horseId,
                  tc: tc,
                ),
                _DetailRow(label: 'Эзэмшигч', value: cert.ownerName, tc: tc),
                _DetailRow(
                  label: 'Олгосон',
                  value: _formatDate(cert.issueDate),
                  tc: tc,
                ),
                if (cert.expiryDate != null)
                  _DetailRow(
                    label: 'Хугацаа дуусах',
                    value: _formatDate(cert.expiryDate!),
                    tc: tc,
                  ),
                _DetailRow(
                  label: 'Төлөв',
                  value: cert.status.displayName,
                  tc: tc,
                ),
                if (cert.previousOwnerId != null)
                  _DetailRow(
                    label: 'Өмнөх эзэмшигч',
                    value: cert.previousOwnerId!,
                    tc: tc,
                  ),
              ],
            ),
          ),
        ),

        // ── Transfer Button ──
        if (verification.isValid) ...[
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            onPressed: isTransferring
                ? null
                : () => _showTransferDialog(ctx, cert),
            icon: isTransferring
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.swap_horiz),
            label: Text(
              isTransferring ? 'Шилжүүлж байна...' : 'Гэрчилгээ шилжүүлэх',
            ),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ],
    );
  }

  void _showTransferDialog(BuildContext ctx, OwnershipCertificate cert) {
    final newOwnerController = TextEditingController();

    showDialog(
      context: ctx,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Гэрчилгээ шилжүүлэх'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Шинэ эзэмшигчийн нэр оруулна уу',
              style: Theme.of(dialogCtx).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: newOwnerController,
              decoration: const InputDecoration(
                labelText: 'Эзэмшигчийн нэр',
                border: OutlineInputBorder(),
              ),
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () {
              if (newOwnerController.text.trim().isEmpty) return;
              Navigator.of(dialogCtx).pop();
              onTransfer(
                certificateId: cert.id,
                newOwnerId: 'pending-${DateTime.now().millisecondsSinceEpoch}',
                newOwnerName: newOwnerController.text.trim(),
              );
            },
            child: const Text('Шилжүүлэх'),
          ),
        ],
      ),
    );
  }
}

// ── Status Banner ───────────────────────────────────────────

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.isValid, required this.message});

  final bool isValid;
  final String message;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);
    final color = isValid ? tc.tertiary : tc.error;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Row(
        children: [
          Icon(isValid ? Icons.check_circle : Icons.error, color: color),
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

// ── Detail Row ──────────────────────────────────────────────

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
    required this.tc,
  });

  final String label;
  final String value;
  final TamgaColors tc;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: tc.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Skeleton builder ─────────────────────────────────────────────────

Widget _certificateSkeletonBuilder(BuildContext context, int index) =>
    const SkeletonCardTile();

String _formatDate(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
