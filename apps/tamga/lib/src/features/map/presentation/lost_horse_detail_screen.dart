import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/error_helpers.dart';
import '../../../core/storage/cloud/media_storage_providers.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../market/application/message_providers.dart';
import '../../market/domain/market_conversation.dart';
import '../application/expiry_service.dart';
import '../application/lost_horse_providers.dart';
import '../domain/animal_enums.dart';
import '../domain/lost_horse_report.dart';
import '../domain/map_enums.dart';

/// Detail screen for a lost horse report — with real Found/Cancel actions.
class LostHorseDetailScreen extends ConsumerWidget {
  const LostHorseDetailScreen({super.key, required this.report});

  final LostHorseReport report;

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    final minutes = diff.inMinutes.clamp(0, double.maxFinite.toInt());
    final hours = diff.inHours.clamp(0, double.maxFinite.toInt());
    final days = diff.inDays.clamp(0, double.maxFinite.toInt());
    if (minutes < 60) return '$minutes минутын өмнө';
    if (hours < 24) return '$hours цагийн өмнө';
    return '$days хоногийн өмнө';
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = TamgaColors.of(context);
    final isOwner = currentSupabaseUserId() == report.ownerId;

    return Scaffold(
      appBar: AppBar(
        title: Text(report.horseName ?? '', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        children: [
          // ── Horse info ─────────────────────────────────────────
          TamgaCard(
            child: Row(
              children: [
                TamgaAvatar(name: report.horseName ?? '', size: 48),
                const SizedBox(width: TamgaSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        report.horseName ?? '',
                        style: TamgaTypography.headline(),
                      ),
                      Text(
                        _timeAgo(report.lastSeenAt),
                        style: TamgaTypography.caption1(
                          color: colors.error,
                          weight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                TamgaBadge(
                  label: report.status.label,
                  variant: report.status == LostHorseStatus.active
                      ? TamgaBadgeVariant.destructive
                      : TamgaBadgeVariant.success,
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),

          // ── Description ────────────────────────────────────────
          if (report.description != null) ...[
            Text(
              'Тайлбар',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TamgaCard(
              child: Text(report.description!, style: TamgaTypography.body()),
            ),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Location hierarchy ─────────────────────────────────
          if (_hasLocationData) ...[
            Text(
              'Байршил',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TamgaCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (report.locationAimag != null)
                    _locationRow('Аймаг', report.locationAimag!, colors),
                  if (report.locationSum != null) ...[
                    const SizedBox(height: TamgaSpacing.sm),
                    _locationRow('Сум', report.locationSum!, colors),
                  ],
                  if (report.locationBag != null) ...[
                    const SizedBox(height: TamgaSpacing.sm),
                    _locationRow('Баг', report.locationBag!, colors),
                  ],
                  if (report.locationName != null) ...[
                    const SizedBox(height: TamgaSpacing.sm),
                    _locationRow('Газрын нэр', report.locationName!, colors),
                  ],
                ],
              ),
            ),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Animal info (Малын мэдээлэл) ────────────────────────
          if (_hasAnimalInfoData) ...[
            Text(
              'Малын мэдээлэл',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TamgaCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _animalInfoRow(
                    'Малын төрөл',
                    report.animalType.displayName,
                    colors,
                  ),
                  const SizedBox(height: TamgaSpacing.sm),
                  if (report.ages.isNotEmpty)
                    _animalInfoRow(
                      'Нас',
                      report.ages.map((a) => a.displayName).join(', '),
                      colors,
                    ),
                  if (report.ages.isNotEmpty)
                    const SizedBox(height: TamgaSpacing.sm),
                  if (report.gender != null)
                    _animalInfoRow('Хүйс', report.gender!.displayName, colors),
                  if (report.gender != null)
                    const SizedBox(height: TamgaSpacing.sm),
                  if (report.breed != null)
                    _animalInfoRow('Үүлдэр', report.breed!.displayName, colors),
                  if (report.breed != null)
                    const SizedBox(height: TamgaSpacing.sm),
                  if (report.coatColor != null)
                    _animalInfoRow('Зүс', report.coatColor!, colors),
                  if (report.coatColor != null)
                    const SizedBox(height: TamgaSpacing.sm),
                  _animalInfoRow('Тоо', report.lostCount.toString(), colors),
                ],
              ),
            ),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Үнийн түвшин (Pricing) ───────────────────────────────
          Text(
            'Үнийн түвшин',
            style: TamgaTypography.footnote(
              weight: FontWeight.w600,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          TamgaCard(
            child: Row(
              children: [
                // ── Tier badge ──
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: TamgaSpacing.sm,
                    vertical: TamgaSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadiusSmall,
                    ),
                    color: report.pricingTier == LostHorsePricingTier.vip
                        ? colors.primary
                        : report.pricingTier == LostHorsePricingTier.featured
                        ? colors.secondary
                        : colors.surfaceContainerHighest,
                  ),
                  child: Text(
                    report.pricingTier.displayName,
                    style: TamgaTypography.caption1(
                      weight: FontWeight.w700,
                      color: report.pricingTier.isPaid
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(width: TamgaSpacing.md),

                // ── Expiry info ──
                Expanded(
                  child: Text(
                    report.expiresAt != null
                        ? 'Дуусах: ${_formatDate(report.expiresAt!)}'
                        : 'Хугацаагүй',
                    style: TamgaTypography.body(color: colors.onSurfaceVariant),
                  ),
                ),

                // ── Price label ──
                Text(
                  report.pricingTier.priceLabel,
                  style: TamgaTypography.body(
                    weight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),

          // ── Renewal (Сунгах) ─────────────────────────────────────
          if (report.pricingTier.isPaid && isOwner) ...[
            if (report.status == LostHorseStatus.expired)
              _buildRenewalBanner(context, ref, colors, isExpired: true)
            else if (ExpiryService.isNearingExpiry(report))
              _buildRenewalBanner(context, ref, colors, isExpired: false),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Photo Gallery ──────────────────────────────────────
          if (report.photoUrls.isNotEmpty) ...[
            Text(
              'Зураг',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            _buildPhotoGrid(context, colors),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Tamga / Identification Section ─────────────────────
          if (report.tamgaImageUrl != null ||
              report.earMarkDescription != null) ...[
            Text(
              'Тамга ба Им',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TamgaCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (report.tamgaImageUrl != null) ...[
                    Text(
                      'Тамганы зураг',
                      style: TamgaTypography.footnote(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: TamgaSpacing.sm),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadiusSmall,
                      ),
                      child: CachedNetworkImage(
                        imageUrl: report.tamgaImageUrl!,
                        width: 120,
                        height: 120,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(
                          width: 120,
                          height: 120,
                          color: colors.surfaceContainerHighest,
                          child: const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                        ),
                        errorWidget: (_, _, _) => Container(
                          width: 120,
                          height: 120,
                          color: colors.surfaceContainerHighest,
                          child: Icon(
                            Icons.broken_image_outlined,
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (report.tamgaImageUrl != null &&
                      report.earMarkDescription != null)
                    const SizedBox(height: TamgaSpacing.md),
                  if (report.earMarkDescription != null) ...[
                    Text(
                      'Им / Чихний им',
                      style: TamgaTypography.footnote(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: TamgaSpacing.sm),
                    Text(
                      report.earMarkDescription!,
                      style: TamgaTypography.body(weight: FontWeight.w500),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Contact Section ───────────────────────────────────
          if (report.contactPhone != null) ...[
            Text(
              'Холбоо барих',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TamgaCard(
              child: Row(
                children: [
                  Icon(Icons.phone_outlined, size: 20, color: colors.primary),
                  const SizedBox(width: TamgaSpacing.md),
                  Expanded(
                    child: Text(
                      report.contactPhone!,
                      style: TamgaTypography.body(weight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Video Section ─────────────────────────────────────
          if (report.videoUrls.isNotEmpty || _isR2Available(ref) == false) ...[
            _buildVideoSection(context, ref, colors),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Info rows ──────────────────────────────────────────
          TamgaInfoRow(
            label: 'Хайх радиус',
            value: '${report.searchRadiusKm.toStringAsFixed(0)} км',
          ),
          const SizedBox(height: TamgaSpacing.sm),
          TamgaInfoRow(
            label: 'Сүүлд үзсэн',
            value: _timeAgo(report.lastSeenAt),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          TamgaInfoRow(
            label: 'Байршил',
            value:
                '${report.lastSeenLat.toStringAsFixed(4)}, '
                '${report.lastSeenLng.toStringAsFixed(4)}',
            divider: false,
          ),
          const SizedBox(height: TamgaSpacing.xxxl),

          // ── Action buttons ─────────────────────────────────────
          if (report.status == LostHorseStatus.active && isOwner) ...[
            // Found button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (_) => TamgaConfirmDialog(
                      title: 'Морийг олсон уу?',
                      message:
                          '${report.horseName ?? 'Морь'} олсон гэж тэмдэглэх үү?',
                      confirmLabel: 'Тийм, олсон',
                      isDestructive: false,
                    ),
                  );
                  if (confirmed == true && context.mounted) {
                    await _updateStatus(
                      context,
                      ref,
                      status: 'found',
                      successMessage: 'Морь олдсон гэж тэмдэглэлээ',
                    );
                  }
                },
                icon: const Icon(Icons.check_circle, size: 20),
                label: Text(
                  'Олсон',
                  style: TamgaTypography.body(
                    color: colors.onPrimary,
                    weight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.primary,
                  foregroundColor: colors.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadius,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),

            // Cancel button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (_) => TamgaConfirmDialog(
                      title: 'Зар цуцлах уу?',
                      message:
                          '${report.horseName ?? 'Морины'} хаяж морийн зарыг цуцлах уу?',
                      confirmLabel: 'Тийм, цуцлах',
                      isDestructive: true,
                    ),
                  );
                  if (confirmed == true && context.mounted) {
                    await _updateStatus(
                      context,
                      ref,
                      status: 'cancelled',
                      successMessage: 'Хаяж морийн зар цуцлагдлаа',
                    );
                  }
                },
                icon: Icon(
                  Icons.cancel_outlined,
                  size: 20,
                  color: colors.error,
                ),
                label: Text(
                  'Цуцалсан',
                  style: TamgaTypography.body(color: colors.error),
                ),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: colors.error),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadius,
                    ),
                  ),
                ),
              ),
            ),
          ] else if (report.status == LostHorseStatus.active) ...[
            // Non-owner sees "Чатлах" button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () => _startOrOpenChat(context, ref),
                icon: const Icon(Icons.chat_outlined, size: 20),
                label: Text(
                  'Чатлах',
                  style: TamgaTypography.body(
                    color: colors.onPrimary,
                    weight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.primary,
                  foregroundColor: colors.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadius,
                    ),
                  ),
                ),
              ),
            ),
          ] else
            TamgaCard(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    report.status == LostHorseStatus.found
                        ? Icons.check_circle
                        : Icons.cancel,
                    color: report.status == LostHorseStatus.found
                        ? colors.primary
                        : colors.onSurfaceVariant,
                  ),
                  const SizedBox(width: TamgaSpacing.sm),
                  Text(
                    'Статус: ${report.status.label}',
                    style: TamgaTypography.body(
                      weight: FontWeight.w600,
                      color: report.status == LostHorseStatus.found
                          ? colors.primary
                          : colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  // ── Chat helpers ────────────────────────────────────────────────

  /// Opens or creates a conversation for this lost horse report and navigates to it.
  Future<void> _startOrOpenChat(BuildContext context, WidgetRef ref) async {
    final currentUserId = currentSupabaseUserId();
    if (currentUserId == null) {
      TamgaToast.showError(context, 'Нэвтрэх шаардлагатай');
      return;
    }

    final repository = ref.read(messageRepositoryProvider);

    // Try to find existing conversation for this report
    final existingResult = await repository.findConversation(
      reportId: report.id,
      buyerId: currentUserId,
      sellerId: report.ownerId,
    );

    MarketConversation conversation;
    try {
      final existing = existingResult.getOrThrow();
      if (existing != null) {
        conversation = existing;
      } else {
        // Create new conversation for the lost horse report
        final createResult = await repository.createConversation(
          reportId: report.id,
          buyerId: currentUserId,
          sellerId: report.ownerId,
        );
        conversation = createResult.getOrThrow();
      }
    } catch (e) {
      if (!context.mounted) return;
      TamgaToast.showError(context, 'Чат нээхэд алдаа гарлаа');
      debugPrint('[LostHorseDetail] _startOrOpenChat failed: $e');
      return;
    }

    if (!context.mounted) return;

    // Navigate to conversation screen with horse name as title
    context.push(
      '/inbox/${conversation.id}',
      extra: <String, dynamic>{
        'conversation': conversation,
        'title': report.horseName ?? 'Хаяж морь',
      },
    );
  }

  // ── Location helpers ────────────────────────────────────────────

  /// Whether the report has any location hierarchy data.
  bool get _hasLocationData =>
      report.locationAimag != null ||
      report.locationSum != null ||
      report.locationBag != null ||
      report.locationName != null;

  /// Builds a single location field row.
  Widget _locationRow(String label, String value, TamgaColors colors) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: TamgaTypography.footnote(color: colors.onSurfaceVariant),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TamgaTypography.body(weight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  // ── Animal info helpers ───────────────────────────────────────────

  /// Whether the report has any animal info beyond defaults.
  bool get _hasAnimalInfoData =>
      report.ages.isNotEmpty ||
      report.gender != null ||
      report.breed != null ||
      report.coatColor != null ||
      report.lostCount > 1;

  /// Builds a single animal info field row.
  Widget _animalInfoRow(String label, String value, TamgaColors colors) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: TamgaTypography.footnote(color: colors.onSurfaceVariant),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TamgaTypography.body(weight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  // ── Gallery helpers ──────────────────────────────────────────────

  /// Whether R2 storage is available for videos.
  bool _isR2Available(WidgetRef ref) {
    final r2 = ref.read(r2StorageProvider);
    return r2 != null;
  }

  /// Builds the photo gallery grid.
  Widget _buildPhotoGrid(BuildContext context, TamgaColors colors) {
    final screenWidth = MediaQuery.of(context).size.width;
    const gap = TamgaSpacing.sm;
    const padding = TamgaSpacing.lg;
    final photoSize = (screenWidth - padding * 2 - gap * 2) / 3;

    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: report.photoUrls.map((url) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
          child: CachedNetworkImage(
            imageUrl: url,
            width: photoSize,
            height: photoSize,
            fit: BoxFit.cover,
            placeholder: (_, _) => Container(
              width: photoSize,
              height: photoSize,
              color: colors.surfaceContainerHighest,
              child: const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
            errorWidget: (_, _, _) => Container(
              width: photoSize,
              height: photoSize,
              color: colors.surfaceContainerHighest,
              child: Icon(
                Icons.broken_image_outlined,
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  /// Builds the video section — shows placeholder if R2 not configured.
  Widget _buildVideoSection(
    BuildContext context,
    WidgetRef ref,
    TamgaColors colors,
  ) {
    final r2Available = _isR2Available(ref);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Бичлэг',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCard(
          child: r2Available && report.videoUrls.isNotEmpty
              ? _buildVideoList(context, colors)
              : _buildVideoPlaceholder(colors),
        ),
      ],
    );
  }

  /// Builds a list of video thumbnails (when R2 is available and videos exist).
  Widget _buildVideoList(BuildContext context, TamgaColors colors) {
    final screenWidth = MediaQuery.of(context).size.width;
    const gap = TamgaSpacing.sm;
    const padding = TamgaSpacing.lg;
    final videoSize = (screenWidth - padding * 2 - gap * 2) / 3;

    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: report.videoUrls.map((url) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: videoSize,
                height: videoSize,
                color: colors.surfaceContainerHighest,
                child: const Center(
                  child: Icon(Icons.videocam_outlined, size: 28),
                ),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  /// Shows "Тун удахгүй" placeholder when R2 videos are not yet configured.
  Widget _buildVideoPlaceholder(TamgaColors colors) {
    return Row(
      children: [
        Icon(Icons.videocam_outlined, color: colors.onSurfaceVariant, size: 24),
        const SizedBox(width: TamgaSpacing.sm),
        Expanded(
          child: Text(
            'Тун удахгүй',
            style: TamgaTypography.body(color: colors.onSurfaceVariant),
          ),
        ),
      ],
    );
  }

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref, {
    required String status,
    required String successMessage,
  }) async {
    try {
      await ref.read(
        updateLostHorseStatusProvider({
          'id': report.id,
          'status': status,
        }).future,
      );
      if (!context.mounted) return;
      TamgaToast.showSuccess(context, successMessage);
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!context.mounted) return;
      TamgaToast.showError(context, friendlyErrorMessage(e));
    }
  }

  /// Builds the renewal prompt banner for near-expiry or expired reports.
  Widget _buildRenewalBanner(
    BuildContext context,
    WidgetRef ref,
    TamgaColors colors, {
    required bool isExpired,
  }) {
    final title = isExpired ? 'Зар дууссан' : kRenewalPromptTitle;
    final message = isExpired
        ? 'Таны "${report.horseName ?? 'хаяж морины'}" зар дууссан. '
              'Дахин идэвхжүүлэхийн тулд сунгах уу?'
        : kRenewalPromptBody;
    final buttonLabel = isExpired ? 'Дахин идэвхжүүлэх' : 'Сунгах';

    return Container(
      padding: const EdgeInsets.all(TamgaSpacing.md),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
        color: isExpired
            ? colors.error.withValues(alpha: 0.1)
            : colors.secondary.withValues(alpha: 0.1),
        border: Border.all(
          color: isExpired ? colors.error : colors.secondary,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isExpired ? Icons.timer_off_outlined : Icons.timer_outlined,
            color: isExpired ? colors.error : colors.secondary,
            size: 24,
          ),
          const SizedBox(width: TamgaSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TamgaTypography.footnote(
                    weight: FontWeight.w700,
                    color: isExpired ? colors.error : colors.secondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  message,
                  style: TamgaTypography.caption1(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: TamgaSpacing.md),
          SizedBox(
            height: 36,
            child: ElevatedButton(
              onPressed: () => _renewReport(context, ref),
              style: ElevatedButton.styleFrom(
                backgroundColor: isExpired ? colors.error : colors.secondary,
                foregroundColor: colors.onPrimary,
                padding: const EdgeInsets.symmetric(
                  horizontal: TamgaSpacing.md,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
              ),
              child: Text(
                buttonLabel,
                style: TamgaTypography.caption1(weight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Renews the lost horse report, extending its expiry by the tier duration.
  Future<void> _renewReport(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => TamgaConfirmDialog(
        title: 'Зар сунгах уу?',
        message:
            '${report.horseName ?? 'Хаяж морины'} зарыг '
            '${report.pricingTier.durationDays} хоногоор сунгах уу?',
        confirmLabel: 'Тийм, сунгах',
        isDestructive: false,
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(renewLostHorseReportProvider(report).future);
      if (!context.mounted) return;
      TamgaToast.showSuccess(context, 'Зар амжилттай сунгагдлаа');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!context.mounted) return;
      TamgaToast.showError(context, friendlyErrorMessage(e));
    }
  }
}
