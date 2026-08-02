import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/error_helpers.dart';
import '../../../core/storage/cloud/media_storage_providers.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../market/application/message_providers.dart';
import '../../market/domain/market_conversation.dart';
import '../application/lost_horse_providers.dart';
import '../application/sighting_providers.dart';
import '../domain/sighting_report.dart';
import 'sighting_form_screen.dart';
import '../application/public_lost_horse_share_service.dart';
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = TamgaColors.of(context);
    final isOwner = currentSupabaseUserId() == report.ownerId;

    return Scaffold(
      appBar: AppBar(
        title: Text(report.horseName ?? '', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (isOwner && report.publicAccessEnabled)
            FutureBuilder<String?>(
              future: PublicLostHorseShareService.tokenFor(report.id),
              builder: (context, snapshot) {
                final token = snapshot.data;
                return IconButton(
                  tooltip: 'Хуваалцах / Share',
                  onPressed: token == null
                      ? null
                      : () => SharePlus.instance.share(
                          ShareParams(
                            text: PublicLostHorseShareService.buildUrl(token),
                            subject:
                                'Tamga — ${report.horseName ?? 'Lost horse'}',
                          ),
                        ),
                  icon: const Icon(Icons.ios_share_outlined),
                );
              },
            ),
        ],
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
            _buildVideoSection(context, colors),
            const SizedBox(height: TamgaSpacing.lg),
          ],

          // ── Community sightings ────────────────────────────────
          _buildSightingsSection(context, ref, colors, isOwner),
          const SizedBox(height: TamgaSpacing.lg),

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
                  'Тайлан цуцлах',
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
            // Community members can report a sighting before opening chat.
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final submitted = await Navigator.of(context).push<bool>(
                    MaterialPageRoute(
                      builder: (_) => SightingFormScreen(reportId: report.id),
                    ),
                  );
                  if (submitted == true) {
                    ref.invalidate(sightingsStreamProvider(report.id));
                  }
                },
                icon: const Icon(Icons.visibility_outlined, size: 20),
                label: Text(
                  'Олсон мэдээлэх',
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
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () => _startOrOpenChat(context, ref),
                icon: const Icon(Icons.chat_outlined, size: 20),
                label: Text(
                  'Чатлах',
                  style: TamgaTypography.body(color: colors.primary),
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

  Widget _buildSightingsSection(
    BuildContext context,
    WidgetRef ref,
    TamgaColors colors,
    bool isOwner,
  ) {
    final sightings = ref.watch(sightingsStreamProvider(report.id));
    return sightings.when(
      loading: () => const SizedBox.shrink(),
      error: (error, _) => Padding(
        padding: const EdgeInsets.only(top: TamgaSpacing.sm),
        child: TamgaCard(
          child: Row(
            children: [
              Icon(Icons.error_outline, size: 20, color: colors.error),
              const SizedBox(width: TamgaSpacing.sm),
              Expanded(
                child: Text(
                  'Олсон мэдээлэл ачаалахад алдаа гарлаа',
                  style: TamgaTypography.body(color: colors.onSurfaceVariant),
                ),
              ),
              TextButton(
                onPressed: () =>
                    ref.invalidate(sightingsStreamProvider(report.id)),
                child: const Text('Дахин оролдох'),
              ),
            ],
          ),
        ),
      ),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Олсон мэдээлэл (${items.length})',
              style: TamgaTypography.title3(weight: FontWeight.w600),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TamgaCard(
              child: Column(
                children: [
                  for (var index = 0; index < items.length; index++) ...[
                    _buildSightingRow(
                      context,
                      ref,
                      colors,
                      items[index],
                      isOwner,
                    ),
                    if (index < items.length - 1)
                      const Divider(height: TamgaSpacing.lg),
                  ],
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSightingRow(
    BuildContext context,
    WidgetRef ref,
    TamgaColors colors,
    SightingReport sighting,
    bool isOwner,
  ) {
    final statusColor = switch (sighting.status) {
      SightingStatus.confirmed => colors.primary,
      SightingStatus.dismissed => colors.error,
      SightingStatus.pending => colors.onSurfaceVariant,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.visibility_outlined, color: statusColor, size: 22),
            const SizedBox(width: TamgaSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sighting.locationName ?? 'Байршил тэмдэглэсэн',
                    style: TamgaTypography.body(weight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_timeAgo(sighting.createdAt)} · ${sighting.status.label}',
                    style: TamgaTypography.footnote(color: statusColor),
                  ),
                  if (sighting.description != null) ...[
                    const SizedBox(height: TamgaSpacing.xs),
                    Text(
                      sighting.description!,
                      style: TamgaTypography.body(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (sighting.photoUrl != null) ...[
          const SizedBox(height: TamgaSpacing.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
            child: _buildSightingPhoto(sighting.photoUrl!),
          ),
        ],
        if (isOwner && sighting.status == SightingStatus.pending) ...[
          const SizedBox(height: TamgaSpacing.sm),
          Wrap(
            spacing: TamgaSpacing.sm,
            children: [
              TextButton(
                onPressed: () => _reviewSighting(
                  context,
                  ref,
                  sighting,
                  SightingStatus.confirmed,
                ),
                child: const Text('Батлах'),
              ),
              TextButton(
                onPressed: () => _reviewSighting(
                  context,
                  ref,
                  sighting,
                  SightingStatus.dismissed,
                ),
                child: const Text('Үгүйсгэх'),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildSightingPhoto(String path) {
    final file = File(path);
    final image = file.existsSync()
        ? Image.file(file, fit: BoxFit.cover)
        : CachedNetworkImage(imageUrl: path, fit: BoxFit.cover);
    return SizedBox(width: double.infinity, height: 160, child: image);
  }

  Future<void> _reviewSighting(
    BuildContext context,
    WidgetRef ref,
    SightingReport sighting,
    SightingStatus status,
  ) async {
    try {
      await ref.read(
        updateSightingStatusProvider({
          'id': sighting.id,
          'status': status.name,
        }).future,
      );
      ref.invalidate(sightingsStreamProvider(report.id));
      if (context.mounted) {
        TamgaToast.showSuccess(context, 'Олсон мэдээллийн статус шинэчлэгдлээ');
      }
    } catch (error) {
      if (context.mounted) {
        TamgaToast.showError(context, friendlyErrorMessage(error));
      }
    }
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
          child: _buildRecoveryPhoto(url, photoSize, colors),
        );
      }).toList(),
    );
  }

  Widget _buildRecoveryPhoto(String url, double size, TamgaColors colors) {
    final file = File(url);
    if (file.existsSync()) {
      return Image.file(file, width: size, height: size, fit: BoxFit.cover);
    }
    return CachedNetworkImage(
      imageUrl: url,
      width: size,
      height: size,
      fit: BoxFit.cover,
      placeholder: (_, _) => Container(
        width: size,
        height: size,
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
        width: size,
        height: size,
        color: colors.surfaceContainerHighest,
        child: Icon(
          Icons.broken_image_outlined,
          color: colors.onSurfaceVariant,
        ),
      ),
    );
  }

  /// Builds the video section — in-app playback is not wired up, so this
  /// renders the "coming soon" placeholder instead of fake playable tiles.
  Widget _buildVideoSection(BuildContext context, TamgaColors colors) {
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
        TamgaCard(child: _buildVideoPlaceholder(colors)),
      ],
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
      // Trigger the queued report-closed notification while the owner session
      // is still available. Delivery remains retryable if the function fails.
      try {
        await Supabase.instance.client.functions.invoke(
          'lost-horse-alert-dispatch',
          body: {'report_id': report.id},
        );
      } catch (error) {
        debugPrint('Lost-horse closure alert deferred: $error');
      }

      if (!context.mounted) return;
      TamgaToast.showSuccess(context, successMessage);
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!context.mounted) return;
      TamgaToast.showError(context, friendlyErrorMessage(e));
    }
  }
}
