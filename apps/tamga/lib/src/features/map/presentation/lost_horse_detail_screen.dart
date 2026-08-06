import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

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
///
/// Layout: hero header (photo-first when media exists), identity sections,
/// then a sticky bottom action bar so the primary CTA (report sighting /
/// mark found / chat) is always one tap away, never buried at the end of
/// the scroll.
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
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: Text(report.horseName ?? '', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (isOwner &&
              report.status == LostHorseStatus.active &&
              report.publicTokenHash != null)
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
        padding: EdgeInsets.zero,
        children: [
          // ── Hero: photo-first header ──────────────────────────
          _HeroHeader(report: report, timeAgo: _timeAgo(report.lastSeenAt)),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              TamgaSpacing.lg,
              TamgaSpacing.lg,
              TamgaSpacing.lg,
              TamgaSpacing.xxxl,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Description ──────────────────────────────────
                if (report.description != null) ...[
                  _SectionTitle('Тайлбар', colors),
                  const SizedBox(height: TamgaSpacing.sm),
                  TamgaCard(
                    child: Text(
                      report.description!,
                      style: TamgaTypography.body(),
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Location hierarchy ───────────────────────────
                if (_hasLocationData) ...[
                  _SectionTitle('Байршил', colors),
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
                          _locationRow(
                            'Газрын нэр',
                            report.locationName!,
                            colors,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Animal info (Малын мэдээлэл) ────────────────
                if (_hasAnimalInfoData) ...[
                  _SectionTitle('Малын мэдээлэл', colors),
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
                          _animalInfoRow(
                            'Хүйс',
                            report.gender!.displayName,
                            colors,
                          ),
                        if (report.gender != null)
                          const SizedBox(height: TamgaSpacing.sm),
                        if (report.breed != null)
                          _animalInfoRow(
                            'Үүлдэр',
                            report.breed!.displayName,
                            colors,
                          ),
                        if (report.breed != null)
                          const SizedBox(height: TamgaSpacing.sm),
                        if (report.coatColor != null)
                          _animalInfoRow('Зүс', report.coatColor!, colors),
                        if (report.coatColor != null)
                          const SizedBox(height: TamgaSpacing.sm),
                        if (report.travelDirection != null)
                          _animalInfoRow(
                            'Хөдөлсөн зүг',
                            report.travelDirection!.displayName,
                            colors,
                          ),
                        if (report.travelDirection != null)
                          const SizedBox(height: TamgaSpacing.sm),
                        _animalInfoRow(
                          'Тоо',
                          report.lostCount.toString(),
                          colors,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Photo Gallery ────────────────────────────────
                if (report.photoUrls.isNotEmpty) ...[
                  _SectionTitle('Зураг', colors),
                  const SizedBox(height: TamgaSpacing.sm),
                  _buildPhotoGrid(context, colors),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Tamga / Identification Section ───────────────
                if (report.tamgaImageUrl != null ||
                    report.earMarkDescription != null) ...[
                  _SectionTitle('Тамга ба Им', colors),
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
                            child: _buildTamgaImage(colors),
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
                            style: TamgaTypography.body(
                              weight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Contact Section ─────────────────────────────
                if (report.contactPhone != null) ...[
                  _SectionTitle('Холбоо барих', colors),
                  const SizedBox(height: TamgaSpacing.sm),
                  TamgaCard(
                    child: Row(
                      children: [
                        Icon(
                          Icons.phone_outlined,
                          size: 20,
                          color: colors.primary,
                        ),
                        const SizedBox(width: TamgaSpacing.md),
                        Expanded(
                          child: Text(
                            report.contactPhone!,
                            style: TamgaTypography.body(
                              weight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Private verification detail (owner only) ─────
                if (isOwner &&
                    report.privateVerificationDetail != null &&
                    report.privateVerificationDetail!.trim().isNotEmpty) ...[
                  _SectionTitle('Нууц баталгаажуулах тэмдэг', colors),
                  const SizedBox(height: TamgaSpacing.sm),
                  TamgaCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.shield_outlined,
                          size: 20,
                          color: colors.primary,
                        ),
                        const SizedBox(width: TamgaSpacing.md),
                        Expanded(
                          child: Text(
                            report.privateVerificationDetail!,
                            style: TamgaTypography.body(
                              weight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Зөвхөн танд харагдана. Олсон гэж мэдээлсэн хүнээс энэ тэмдгийг асууж, амьдаар нь таарч байгаа эсэхийг баталгаажуулна уу.',
                    style: TamgaTypography.footnote(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Official 109 channel link-out ────────────────
                TamgaCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.support_agent,
                            size: 20,
                            color: colors.primary,
                          ),
                          const SizedBox(width: TamgaSpacing.md),
                          Expanded(
                            child: Text(
                              '109 — Албан ёсны суваг',
                              style: TamgaTypography.body(
                                weight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: TamgaSpacing.xs),
                      Text(
                        'ХХЯ-ны 109 дугаарт хаяж малаа мэдэгдэж, албан ёсны зарыг гаргуулах боломжтой.',
                        style: TamgaTypography.footnote(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: TamgaSpacing.sm),
                      Wrap(
                        spacing: TamgaSpacing.sm,
                        children: [
                          FilledButton.tonalIcon(
                            onPressed: () => _call109(context),
                            icon: const Icon(Icons.call_outlined, size: 18),
                            label: const Text('109 залгах'),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => _open109Portal(context),
                            icon: const Icon(Icons.open_in_new, size: 18),
                            label: const Text('109.mofa.gov.mn'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: TamgaSpacing.lg),

                // ── Anti-scam notice ─────────────────────────────
                TamgaCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.gpp_maybe_outlined,
                        size: 20,
                        color: colors.error,
                      ),
                      const SizedBox(width: TamgaSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Хуурамч залилгаас болгоомжил',
                              style: TamgaTypography.body(
                                weight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Олсон хүн танаас мөнгө шилжүүлэх, урьдчилгаа төлөх, баталгаажуулах код асуух ёсгүй. Төлбөр шаардсан хүнийг мэдээлээрэй.',
                              style: TamgaTypography.footnote(
                                color: colors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: TamgaSpacing.lg),

                // ── Video Section ────────────────────────────────
                if (report.videoUrls.isNotEmpty ||
                    _isR2Available(ref) == false) ...[
                  _buildVideoSection(context, colors),
                  const SizedBox(height: TamgaSpacing.lg),
                ],

                // ── Community sightings ──────────────────────────
                _buildSightingsSection(context, ref, colors, isOwner),
                const SizedBox(height: TamgaSpacing.lg),

                // ── Info rows ────────────────────────────────────
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
              ],
            ),
          ),
        ],
      ),
      // ── Sticky bottom action bar ───────────────────────────────
      bottomNavigationBar: _buildBottomActions(context, ref, isOwner),
    );
  }

  // ── Sticky actions ──────────────────────────────────────────────

  /// Primary actions pinned to the bottom — never lost at the end of the
  /// scroll. Owner resolves the report; community reports sightings/chat.
  Widget _buildBottomActions(
    BuildContext context,
    WidgetRef ref,
    bool isOwner,
  ) {
    final colors = TamgaColors.of(context);

    if (report.status == LostHorseStatus.active && isOwner) {
      return SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(
            TamgaSpacing.lg,
            TamgaSpacing.sm,
            TamgaSpacing.lg,
            TamgaSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: colors.surfaceContainerLowest,
            border: Border(
              top: BorderSide(color: colors.outlineVariant.withAlpha(80)),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () => _confirmCancel(context, ref),
                    icon: Icon(
                      Icons.cancel_outlined,
                      size: 20,
                      color: colors.error,
                    ),
                    label: Text(
                      'Цуцлах',
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
              ),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () => _confirmFound(context, ref),
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
              ),
            ],
          ),
        ),
      );
    }

    if (report.status == LostHorseStatus.active) {
      // Community members: report a sighting, or chat with the owner.
      return SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(
            TamgaSpacing.lg,
            TamgaSpacing.sm,
            TamgaSpacing.lg,
            TamgaSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: colors.surfaceContainerLowest,
            border: Border(
              top: BorderSide(color: colors.outlineVariant.withAlpha(80)),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () => _startOrOpenChat(context, ref),
                    icon: const Icon(Icons.chat_outlined, size: 20),
                    label: Text(
                      'Чатлах',
                      style: TamgaTypography.body(color: colors.primary),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: colors.primary),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          TamgaSpacing.cornerRadius,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final submitted = await Navigator.of(context).push<bool>(
                        MaterialPageRoute(
                          builder: (_) =>
                              SightingFormScreen(reportId: report.id),
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
              ),
            ],
          ),
        ),
      );
    }

    // Resolved reports: status banner instead of actions.
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
          TamgaSpacing.lg,
          TamgaSpacing.sm,
          TamgaSpacing.lg,
          TamgaSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: colors.surfaceContainerLowest,
          border: Border(
            top: BorderSide(color: colors.outlineVariant.withAlpha(80)),
          ),
        ),
        child: SizedBox(
          height: 50,
          child: TamgaCard(
            padding: EdgeInsets.zero,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  report.status == LostHorseStatus.found
                      ? Icons.check_circle
                      : Icons.cancel,
                  size: 20,
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
        ),
      ),
    );
  }

  Future<void> _confirmFound(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => TamgaConfirmDialog(
        title: 'Морийг олсон уу?',
        message: '${report.horseName ?? 'Морь'} олсон гэж тэмдэглэх үү?',
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
  }

  Future<void> _confirmCancel(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => TamgaConfirmDialog(
        title: 'Зар цуцлах уу?',
        message: '${report.horseName ?? 'Морины'} хаяж морийн зарыг цуцлах уу?',
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
  }

  // ── Sightings ───────────────────────────────────────────────────

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
        child: TamgaErrorWidget(
          message: 'Олсон мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(sightingsStreamProvider(report.id)),
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

  // ── Official 109 channel helpers ────────────────────────────────

  /// Dials the 109 herder hotline (free official lost-livestock channel).
  Future<void> _call109(BuildContext context) async {
    final uri = Uri.parse('tel:109');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      TamgaToast.showError(context, 'Утас нээхэд алдаа гарлаа');
    }
  }

  /// Opens the official 109 lost-livestock portal.
  Future<void> _open109Portal(BuildContext context) async {
    final uri = Uri.parse('https://109.mofa.gov.mn');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      TamgaToast.showError(context, 'Холбоос нээхэд алдаа гарлаа');
    }
  }

  /// Renders the tamga photo, falling back to the local file when the URL is
  /// still an on-device path (pre-sync) rather than a storage/signed URL.
  Widget _buildTamgaImage(TamgaColors colors) {
    final url = report.tamgaImageUrl!;
    final file = File(url);
    if (file.existsSync()) {
      return Image.file(file, width: 120, height: 120, fit: BoxFit.cover);
    }
    return CachedNetworkImage(
      imageUrl: url,
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

// ── Section title ─────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title, this.colors);

  final String title;
  final TamgaColors colors;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TamgaTypography.footnote(
        weight: FontWeight.w600,
        color: colors.onSurfaceVariant,
      ),
    );
  }
}

// ── Hero header ───────────────────────────────────────────────────────

/// Photo-first hero: leading report photo when available, otherwise a
/// compact identity header with avatar + urgency time.
class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.report, required this.timeAgo});

  final LostHorseReport report;
  final String timeAgo;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isUrgent = DateTime.now().difference(report.lastSeenAt).inHours < 24;
    final photo = report.photoUrls.isNotEmpty ? report.photoUrls.first : null;
    final isActive = report.status == LostHorseStatus.active;

    // ── With photo: full-width hero ─────────────────────────────
    if (photo != null && photo.isNotEmpty) {
      final file = File(photo);
      final image = file.existsSync()
          ? Image.file(file, fit: BoxFit.cover)
          : CachedNetworkImage(
              imageUrl: photo,
              fit: BoxFit.cover,
              placeholder: (_, _) => Container(
                color: colors.surfaceContainerHighest,
                child: const Center(child: CircularProgressIndicator()),
              ),
              errorWidget: (_, _, _) => Container(
                color: colors.surfaceContainerHighest,
                child: Icon(
                  Icons.broken_image_outlined,
                  size: 48,
                  color: colors.onSurfaceVariant,
                ),
              ),
            );

      return SizedBox(
        height: 240,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: [
            image,
            // Scrim for text legibility
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.65),
                  ],
                ),
              ),
            ),
            Positioned(
              left: TamgaSpacing.lg,
              right: TamgaSpacing.lg,
              bottom: TamgaSpacing.md,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          report.horseName ?? report.animalType.displayName,
                          style: TamgaTypography.title2(
                            color: Colors.white,
                            weight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              isUrgent ? Icons.schedule : Icons.history,
                              size: 14,
                              color: Colors.white70,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Сүүлд үзсэн: $timeAgo',
                              style: TamgaTypography.caption1(
                                color: Colors.white70,
                                weight: isUrgent
                                    ? FontWeight.w700
                                    : FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: colors.error,
                        borderRadius: BorderRadius.circular(
                          TamgaSpacing.cornerRadiusPill,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.radar,
                            size: 14,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            report.status.label,
                            style: TamgaTypography.caption1(
                              color: Colors.white,
                              weight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    TamgaBadge(
                      label: report.status.label,
                      variant: report.status == LostHorseStatus.found
                          ? TamgaBadgeVariant.success
                          : TamgaBadgeVariant.neutral,
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // ── Without photo: compact identity card ───────────────────
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.lg,
        TamgaSpacing.sm,
        TamgaSpacing.lg,
        TamgaSpacing.sm,
      ),
      child: TamgaCard(
        showTopAccent: isActive,
        accentColor: isUrgent ? colors.error : colors.primary,
        accentHeight: 3,
        child: Row(
          children: [
            TamgaAvatar(
              name: report.horseName ?? '',
              size: 56,
              placeholder: Icons.pets_outlined,
            ),
            const SizedBox(width: TamgaSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    report.horseName ?? report.animalType.displayName,
                    style: TamgaTypography.title3(weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        isUrgent ? Icons.schedule : Icons.history_outlined,
                        size: 14,
                        color: isUrgent
                            ? colors.error
                            : colors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Сүүлд үзсэн: $timeAgo',
                        style: TamgaTypography.caption1(
                          color: isUrgent
                              ? colors.error
                              : colors.onSurfaceVariant,
                          weight: isUrgent ? FontWeight.w700 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            TamgaBadge(
              label: report.status.label,
              variant: report.status == LostHorseStatus.active
                  ? TamgaBadgeVariant.destructive
                  : report.status == LostHorseStatus.found
                  ? TamgaBadgeVariant.success
                  : TamgaBadgeVariant.neutral,
            ),
          ],
        ),
      ),
    );
  }
}
