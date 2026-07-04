import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/certificate_providers.dart';
import '../domain/ownership_certificate.dart';

/// Гэрчилгээ шалгах хуудас — QR код эсвэл ID оруулж шалгана.
class VerifyCertificateScreen extends ConsumerStatefulWidget {
  const VerifyCertificateScreen({super.key});

  @override
  ConsumerState<VerifyCertificateScreen> createState() =>
      _VerifyCertificateScreenState();
}

class _VerifyCertificateScreenState
    extends ConsumerState<VerifyCertificateScreen> {
  final _controller = TextEditingController();
  bool _isVerifying = false;
  CertificateVerification? _verification;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final tc = TamgaColors.of(ctx);

    return Scaffold(
      appBar: AppBar(title: const Text('Гэрчилгээ шалгах')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.lg,
          AppSpacing.xxxxl,
        ),
        children: [
          // ── Search field ──
          Card(
            child: Padding(
              padding: AppSpacing.cardPadding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Гэрчилгээний дугаар эсвэл QR код',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Гэрчилгээний ID эсвэл QR кодын утгыг оруулна уу.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: tc.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'TAMGA-XXXXXXXX-...',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.qr_code_scanner),
                        tooltip: 'QR код унших',
                        onPressed: _scanQrCode,
                      ),
                    ),
                    textInputAction: TextInputAction.search,
                    onSubmitted: (_) => _verify(),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  FilledButton.icon(
                    onPressed: _isVerifying ? null : _verify,
                    icon: _isVerifying
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.search, size: 20),
                    label: Text(_isVerifying ? 'Шалгаж байна...' : 'Шалгах'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Error ──
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: tc.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
              ),
              child: Row(
                children: [
                  Icon(Icons.error, color: tc.error),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      _error!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: tc.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // ── Verification result ──
          if (_verification != null) ...[
            const SizedBox(height: AppSpacing.xl),
            _VerificationResult(verification: _verification!),
          ],
        ],
      ),
    );
  }

  Future<void> _verify() async {
    final query = _controller.text.trim();
    if (query.isEmpty) {
      setState(() {
        _error = 'Гэрчилгээний дугаар оруулна уу';
        _verification = null;
      });
      return;
    }

    setState(() {
      _isVerifying = true;
      _error = null;
      _verification = null;
    });

    final repo = ref.read(certificateRepositoryProvider);
    final result = await repo.verifyCertificate(query);

    setState(() => _isVerifying = false);

    result.when(
      onSuccess: (verification) {
        setState(() => _verification = verification);
      },
      onFailure: (error) {
        setState(() => _error = error.message);
      },
    );
  }

  void _scanQrCode() {
    // TODO: Implement QR code scanning with camera
    TamgaToast.show(
      context,
      'Камерын зөвшөөрөл шаардлагатай — удахгуй нэмэгдэнэ',
    );
  }
}

// ── Verification Result ─────────────────────────────────────

class _VerificationResult extends StatelessWidget {
  const _VerificationResult({required this.verification});

  final CertificateVerification verification;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final cert = verification.certificate;
    final isValid = verification.isValid;
    final tc = TamgaColors.of(ctx);

    final statusColor = isValid ? tc.tertiary : tc.error;

    return Card(
      child: Padding(
        padding: AppSpacing.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Status header ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
              ),
              child: Row(
                children: [
                  Icon(
                    isValid ? Icons.check_circle : Icons.cancel,
                    color: statusColor,
                    size: 32,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isValid ? 'Идэвхтэй' : 'Идэвхгүй',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                        Text(
                          verification.message,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: tc.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Horse info ──
            _InfoSection(
              title: 'Морийн мэдээлэл',
              items: [
                _InfoItem(label: 'Нэр', value: cert.horseName ?? 'Тодорхойгүй'),
                _InfoItem(label: 'ID', value: cert.horseId),
              ],
              tc: tc,
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Owner info ──
            _InfoSection(
              title: 'Эзэмшигчийн мэдээлэл',
              items: [
                _InfoItem(label: 'Нэр', value: cert.ownerName),
                _InfoItem(label: 'ID', value: cert.ownerId),
              ],
              tc: tc,
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Certificate info ──
            _InfoSection(
              title: 'Гэрчилгээ',
              items: [
                _InfoItem(label: 'Дугаар', value: cert.id),
                _InfoItem(label: 'QR', value: cert.qrCode),
                _InfoItem(label: 'Олгосон', value: _formatDate(cert.issueDate)),
                if (cert.expiryDate != null)
                  _InfoItem(
                    label: 'Хугацаа',
                    value: _formatDate(cert.expiryDate!),
                  ),
                _InfoItem(label: 'Төлөв', value: cert.status.displayName),
                if (cert.previousOwnerId != null)
                  _InfoItem(
                    label: 'Өмнөх эзэмшигч',
                    value: cert.previousOwnerId!,
                  ),
              ],
              tc: tc,
            ),

            // ── View full certificate button ──
            if (isValid) ...[
              const SizedBox(height: AppSpacing.lg),
              OutlinedButton.icon(
                onPressed: () {
                  ctx.push('/certificates/${cert.id}');
                },
                icon: const Icon(Icons.verified_outlined, size: 20),
                label: const Text('Бүрэн гэрчилгээ харах'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Info Section ────────────────────────────────────────────

class _InfoSection extends StatelessWidget {
  const _InfoSection({
    required this.title,
    required this.items,
    required this.tc,
  });

  final String title;
  final List<_InfoItem> items;
  final TamgaColors tc;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: tc.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 110,
                  child: Text(
                    item.label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: tc.onSurfaceVariant,
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    item.value,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _InfoItem {
  const _InfoItem({required this.label, required this.value});

  final String label;
  final String value;
}

String _formatDate(DateTime date) =>
    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
