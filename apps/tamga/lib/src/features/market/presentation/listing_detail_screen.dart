import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/widgets/widgets.dart';
import '../../map/application/lost_horse_providers.dart';
import '../../map/domain/lost_horse_report.dart';
import '../../map/domain/map_enums.dart';
import '../../map/presentation/lost_horse_detail_screen.dart';
import '../../shared/application/sync_providers.dart';
import '../../horses/domain/horse_record.dart' show Horse;
import '../application/contract_providers.dart';
import '../application/market_providers.dart';
import '../application/message_providers.dart';
import '../application/offer_providers.dart';
import '../application/rating_providers.dart';
import '../domain/digital_certificate.dart';
import '../domain/market_listing.dart';
import '../domain/market_offer.dart';
import '../domain/market_price_insight.dart';
import '../domain/market_safety.dart';
import 'contract_screen.dart';
import 'listing_document_checklist.dart';
import 'listing_media_gallery.dart';
import 'listing_performance_history.dart';
import 'listing_safety_checklist.dart';
import 'trial_slots_screen.dart';
import 'widgets/offer_sheet.dart';

class ListingDetailScreen extends ConsumerWidget {
  const ListingDetailScreen({required this.listingId, super.key});

  final String listingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(marketCatalogProvider);
    final listingsMap = ref.watch(marketListingsMapProvider);
    final item = listingsMap[listingId];
    final safety = ref.watch(marketSafetySummaryProvider(listingId));
    final theme = Theme.of(context);
    // Belt-and-braces: the server flag plus a live check for an active public
    // report on the listed horse (covers stale cached flags).
    final activeReports = ref.watch(activeLostHorsesProvider);

    return catalog.when(
      data: (data) {
        if (item == null) {
          return const Scaffold(body: Center(child: Text('Зар олдсонгүй.')));
        }

        final listing = item.listing;
        final horse = item.horse;
        final conflictReport = activeReports.when(
          data: (reports) => horse == null
              ? null
              : reports
                    .where(
                      (r) =>
                          r.horseId == horse.id &&
                          r.status == LostHorseStatus.active,
                    )
                    .firstOrNull,
          loading: () => null,
          error: (_, _) => null,
        );
        final showConflict =
            listing.lostReportConflict || conflictReport != null;
        final certificateAsync = horse != null
            ? ref.watch(digitalCertificateProvider(horse.id))
            : null;

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 240,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    listing.saleType.label,
                    style: TextStyle(
                      shadows: [
                        Shadow(
                          color: const Color.fromARGB(153, 0, 0, 0),
                          blurRadius: 8,
                          offset: const Offset(1, 1),
                        ),
                      ],
                    ),
                  ),
                  background: ListingMediaGallery(
                    mediaUrls: listing.mediaUrls,
                    heroTag: 'listing-image-${listing.id}',
                  ),
                ),
              ),
              SliverPadding(
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.lg,
                  AppSpacing.lg,
                  AppSpacing.xxl,
                ),
                sliver: SliverList.list(
                  children: [
                    // Эрэл хайгуулын зөрчил — safety banner first
                    if (showConflict)
                      _LostReportConflictBanner(report: conflictReport),
                    if (showConflict) const SizedBox(height: AppSpacing.md),

                    // Үндсэн мэдээлэл
                    Card(
                      child: Padding(
                        padding: EdgeInsets.all(AppSpacing.xl),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              listing.title,
                              style: theme.textTheme.headlineSmall,
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              '${_formatPrice(listing)} • ${listing.locationLabel}',
                              style: theme.textTheme.titleMedium,
                            ),
                            if (listing.commissionRate != null) ...[
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                'Комисс: ${(listing.commissionRate! * 100).toStringAsFixed(0)}%',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                            const SizedBox(height: AppSpacing.md),
                            Text(listing.description),
                            const SizedBox(height: AppSpacing.lg),
                            Wrap(
                              spacing: AppSpacing.sm,
                              runSpacing: AppSpacing.sm,
                              children: [
                                _Badge(label: 'Итгэл ${listing.trustScore}%'),
                                if (listing.isSellerVerified)
                                  const _Badge(label: 'Баталгаатай'),
                                _Badge(label: listing.status.label),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Морийн мэдээлэл
                    if (horse != null) ...[
                      Card(
                        child: Padding(
                          padding: EdgeInsets.all(AppSpacing.xl),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Морины нотолгоо: ${horse.name}',
                                style: theme.textTheme.titleMedium,
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                '${horse.relationLabel} • ${horse.coat} • ${horse.birthYear}\n'
                                'Шагнал ${horse.awardCount} • Үр төл ${horse.offspringCount} • ${horse.notes}',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                              if (horse.tamgaVerified ||
                                  horse.stateVerified) ...[
                                const SizedBox(height: AppSpacing.md),
                                Wrap(
                                  spacing: AppSpacing.sm,
                                  runSpacing: AppSpacing.sm,
                                  children: [
                                    if (horse.tamgaVerified)
                                      _ProvenanceBadge(
                                        label: AppLocalizations.of(
                                          context,
                                        )!.marketTamgaVerified,
                                        icon: Icons.branding_watermark,
                                      ),
                                    if (horse.stateVerified)
                                      _ProvenanceBadge(
                                        label: AppLocalizations.of(
                                          context,
                                        )!.marketStateVerified,
                                        icon: Icons.verified_user_outlined,
                                      ),
                                  ],
                                ),
                              ],
                              ..._provenanceRows(context, horse),
                            ],
                          ),
                        ),
                      ),
                      if (certificateAsync != null)
                        certificateAsync.when(
                          data: (certificate) {
                            if (certificate == null) {
                              return const SizedBox.shrink();
                            }
                            final isOwner =
                                listing.sellerId == 'seller-local' ||
                                listing.sellerId == 'local-buyer' ||
                                horse.isOwnedByHousehold;
                            return Padding(
                              padding: EdgeInsets.only(top: AppSpacing.md),
                              child: _CertificateCard(
                                certificate: certificate,
                                isOwner: isOwner,
                                onTransfer: () => _transferCertificateDialog(
                                  context,
                                  ref,
                                  certificate,
                                ),
                              ),
                            );
                          },
                          loading: () => Padding(
                            padding: EdgeInsets.only(top: AppSpacing.md),
                            child: SkeletonLoader(
                              items: 1,
                              itemBuilder: (ctx, i) => const SkeletonCardTile(),
                            ),
                          ),
                          error: (error, _) => Padding(
                            padding: EdgeInsets.only(top: AppSpacing.md),
                            child: TamgaErrorWidget(
                              message:
                                  'Дижитал гэрчилгээ ачаалахад алдаа гарлаа',
                              onRetry: () => ref.invalidate(
                                digitalCertificateProvider(horse.id),
                              ),
                            ),
                          ),
                        ),
                    ],
                    const SizedBox(height: AppSpacing.md),

                    // Худалдагчийн итгэлцэл
                    _SellerTrustCard(safety: safety, listingId: listing.id),
                    const SizedBox(height: AppSpacing.md),

                    // Бичиг баримтын жагсаалт
                    ListingDocumentChecklist(documents: listing.documentTags),
                    const SizedBox(height: AppSpacing.md),

                    // Үнийн шинжилгээ
                    _PriceInsightCard(
                      listingId: listing.id,
                      listingPrice: listing.priceAmount,
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Гүйцэтгэлийн түүх
                    ListingPerformanceHistory(events: item.events),
                    const SizedBox(height: AppSpacing.md),

                    // Аюулгүй худалдан авалтын жагсаалт
                    const ListingSafetyChecklist(),
                    const SizedBox(height: AppSpacing.lg),

                    // Лавлагааны төлөв
                    _InquiryStatusCard(safety: safety),
                    const SizedBox(height: AppSpacing.md),

                    // Үнийн саналын түүх
                    if (listing.sellerId == localMarketBuyerId)
                      // Худалдагчийн харах: ирсэн саналууд
                      _SellerOfferSection(
                        listingId: listing.id,
                        listingPrice: listing.priceAmount,
                      )
                    else
                      // Худалдан авагчийн харах: саналын түүх
                      OfferHistoryCard(
                        listingId: listing.id,
                        isSeller: false,
                        listingPrice: listing.priceAmount,
                      ),
                    const SizedBox(height: AppSpacing.md),

                    // Үнийн санал илгээх товч (худалдан авагчид)
                    if (listing.sellerId != localMarketBuyerId)
                      OutlinedButton.icon(
                        onPressed: () => _sendOffer(context, ref, listing),
                        icon: const Icon(Icons.local_offer_outlined),
                        label: const Text('Үнийн санал өгөх'),
                      ),
                    const SizedBox(height: AppSpacing.md),

                    // Туршилтын цагийн захиалга (худалдан авагчид)
                    if (listing.sellerId != localMarketBuyerId) ...[
                      TrialBookingSection(
                        listingId: listing.id,
                        sellerId: listing.sellerId,
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],

                    // Гэрээ үүсгэх товч
                    OutlinedButton.icon(
                      onPressed: () => _generateContract(context, ref, listing),
                      icon: const Icon(Icons.description_outlined),
                      label: const Text('Гэрээ үүсгэх'),
                    ),
                    const SizedBox(height: AppSpacing.sm),

                    // Үйлдлүүд
                    FilledButton.icon(
                      onPressed: () => _createInquiry(context, ref, listing),
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: Text(
                        safety.maybeWhen(
                          data: (summary) => summary.localBuyerInquiry == null
                              ? 'Худалдагчтай холбогдох'
                              : 'Асуулт: ${summary.localBuyerInquiry!.status.label}',
                          orElse: () => 'Худалдагчтай холбогдох',
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: () => _shareListing(context, listing),
                      icon: const Icon(Icons.share_outlined),
                      label: const Text('Хуваалцах'),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    OutlinedButton.icon(
                      onPressed: () => _reportListing(context, ref, listing),
                      icon: const Icon(Icons.flag_outlined),
                      label: Text(
                        safety.maybeWhen(
                          data: (summary) => summary.hasLocalReport
                              ? 'Мэдээлэгдсэн (${summary.reportCount})'
                              : 'Зар мэдээлэх',
                          orElse: () => 'Зар мэдээлэх',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
      loading: () => SkeletonLoader(
        items: 4,
        itemBuilder: (ctx, i) => const SkeletonCardTile(),
      ),
      error: (error, stackTrace) => Scaffold(
        body: TamgaErrorWidget(
          message: 'Зарын мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(marketCatalogProvider),
        ),
      ),
    );
  }

  Future<void> _sendOffer(
    BuildContext context,
    WidgetRef ref,
    MarketListing listing,
  ) async {
    final sent = await SendOfferSheet.show(
      context,
      listingId: listing.id,
      sellerId: listing.sellerId,
      listingPrice: listing.priceAmount,
    );
    if (sent && context.mounted) {
      ref.invalidate(offersForListingProvider(listing.id));
    }
  }

  Future<void> _createInquiry(
    BuildContext context,
    WidgetRef ref,
    MarketListing listing,
  ) async {
    // ── Offline guard ───────────────────────────────────────────────
    final monitor = ref.read(connectionMonitorProvider);
    if (monitor.current == ConnectionStatus.offline) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Энэ үйлдэл интернэт холболт шаарддаг')),
        );
      }
      return;
    }
    // ── End offline guard ───────────────────────────────────────────

    final repository = await ref.read(marketRepositoryProvider.future);
    final before = (await repository.fetchInquiries(listing.id)).getOrThrow();
    final inquiry = (await repository.createInquiry(
      listingId: listing.id,
      buyerId: localMarketBuyerId,
      sellerId: listing.sellerId,
    )).getOrThrow();
    final wasExisting = before.any((item) => item.id == inquiry.id);
    ref.invalidate(marketSafetySummaryProvider(listing.id));

    if (!context.mounted) return;

    // Create or open conversation for messaging
    final messageRepo = ref.read(messageRepositoryProvider);
    final existingConv = await messageRepo.findConversation(
      listingId: listing.id,
      buyerId: localMarketBuyerId,
      sellerId: listing.sellerId,
    );
    final conversation =
        existingConv.getOrThrow() ??
        (await messageRepo.createConversation(
          listingId: listing.id,
          buyerId: localMarketBuyerId,
          sellerId: listing.sellerId,
        )).getOrThrow();

    if (!context.mounted) return;
    TamgaToast.show(
      context,
      wasExisting
          ? 'Асуулт аль хэдийн үүссэн: ${inquiry.status.label}.'
          : 'Асуулт үүссэн: ${inquiry.status.label}.',
    );

    // Navigate to conversation
    await Future.delayed(const Duration(milliseconds: 500));
    if (context.mounted) {
      context.push('/inbox/${conversation.id}', extra: conversation);
    }
  }

  Future<void> _shareListing(
    BuildContext context,
    MarketListing listing,
  ) async {
    final url = 'https://tamga.mn/market/${listing.id}';
    final text = 'Check out this horse on Tamga: $url';
    final subject = 'Tamga — ${listing.title}';
    await SharePlus.instance.share(ShareParams(text: text, subject: subject));
  }

  Future<void> _generateContract(
    BuildContext context,
    WidgetRef ref,
    MarketListing listing,
  ) async {
    final actions = ref.read(contractActionsProvider);
    final contract = actions.generateContract(
      listing: listing,
      buyerName: localMarketBuyerId,
      horseName: listing.title,
      horseDescription: listing.description,
    );

    if (!context.mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ContractScreen(contract: contract)),
    );
  }

  Future<void> _reportListing(
    BuildContext context,
    WidgetRef ref,
    MarketListing listing,
  ) async {
    final reason = await _askReportReason(context);
    if (reason == null || reason.trim().isEmpty) {
      return;
    }

    final repository = await ref.read(marketRepositoryProvider.future);
    final report = (await repository.createReport(
      listingId: listing.id,
      reporterId: localMarketReporterId,
      reason: reason.trim(),
    )).getOrThrow();
    ref.invalidate(marketSafetySummaryProvider(listing.id));

    if (!context.mounted) {
      return;
    }
    TamgaToast.show(context, 'Мэдээлэгдсэн: ${report.status.label}.');
  }

  Future<String?> _askReportReason(BuildContext context) async {
    final controller = TextEditingController();
    try {
      final reason = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Зар мэдээлэх'),
          content: TextField(
            controller: controller,
            autofocus: true,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Reason',
              hintText: 'Suspicious details, missing docs, unsafe request...',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(controller.text),
              child: const Text('Submit'),
            ),
          ],
        ),
      );
      return reason;
    } finally {
      controller.dispose();
    }
  }

  Future<void> _transferCertificateDialog(
    BuildContext context,
    WidgetRef ref,
    DigitalCertificate certificate,
  ) async {
    final controller = TextEditingController();
    try {
      final recipientId = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Гэрчилгээ шилжүүлэх'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'You are transferring the digital ownership certificate for the horse (ID: ${certificate.horseId}).',
              ),
              const SizedBox(height: AppSpacing.lg),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Recipient ID',
                  hintText: 'e.g., seller-tamga, local-buyer',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(controller.text),
              child: const Text('Шилжүүлэх'),
            ),
          ],
        ),
      );

      if (recipientId == null || recipientId.trim().isEmpty) {
        return;
      }

      final repository = await ref.read(marketRepositoryProvider.future);
      await repository.transferCertificate(
        horseId: certificate.horseId,
        newOwnerId: recipientId.trim(),
      );

      ref.invalidate(digitalCertificateProvider(certificate.horseId));

      if (!context.mounted) return;
      TamgaToast.showSuccess(
        context,
        'Certificate successfully transferred to ${recipientId.trim()}.',
      );
    } finally {
      controller.dispose();
    }
  }
}

// ── Туслах дүрсүүд ──────────────────────────────────────────────────

class _CertificateCard extends StatelessWidget {
  const _CertificateCard({
    required this.certificate,
    required this.isOwner,
    required this.onTransfer,
  });

  final DigitalCertificate certificate;
  final bool isOwner;
  final VoidCallback onTransfer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.verified, color: theme.colorScheme.primary),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Дижитал гарал үүслийн гэрчилгээ',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            _CertificateDetailRow(
              label: 'Төлөв',
              value: certificate.isVerified ? 'Баталгаажсан' : 'Баталгаажаагүй',
              valueColor: certificate.isVerified
                  ? theme.colorScheme.tertiary
                  : theme.colorScheme.primary,
            ),
            _CertificateDetailRow(label: 'Гаргагч', value: certificate.issuer),
            _CertificateDetailRow(
              label: 'Гаргасан огноо',
              value: certificate.issueDate.toLocal().toString().split(' ')[0],
            ),
            _CertificateDetailRow(
              label: 'Эзэмшигч ID',
              value: certificate.ownerId,
            ),
            _CertificateDetailRow(
              label: 'Хэш',
              value: certificate.certificateHash,
              isHash: true,
            ),
            if (isOwner) ...[
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                  ),
                  onPressed: onTransfer,
                  icon: const Icon(Icons.send),
                  label: const Text('Гэрчилгээ шилжүүлэх'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CertificateDetailRow extends StatelessWidget {
  const _CertificateDetailRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isHash = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final bool isHash;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: valueColor ?? theme.colorScheme.onSurface,
                fontFamily: isHash ? 'monospace' : null,
                fontSize: isHash ? 12 : null,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: isHash ? 2 : 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _SellerTrustCard extends ConsumerWidget {
  const _SellerTrustCard({required this.safety, required this.listingId});

  final AsyncValue<MarketSafetySummary> safety;
  final String listingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: safety.when(
          data: (summary) {
            final profile = summary.sellerProfile;
            if (profile == null) {
              return const Text('Худалдагчийн профайл байхгүй.');
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Худалдагчийн итгэлцлийн профайл',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.md),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.storefront_outlined),
                  title: Text('${profile.stableName} • ${profile.displayName}'),
                  subtitle: Text(
                    '${profile.locationLabel}\n'
                    '${profile.verificationLabel}\n'
                    '${profile.responseNote}',
                  ),
                  isThreeLine: true,
                ),
                const SizedBox(height: AppSpacing.sm),
                // Rating display
                _RatingBadge(
                  averageRating: profile.averageRating,
                  ratingCount: profile.ratingCount,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(profile.bio),
                if (profile.reviews.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Text('Сэтгэгдлүүд:', style: theme.textTheme.titleSmall),
                  const SizedBox(height: AppSpacing.xs),
                  for (final review in profile.reviews.take(3))
                    Padding(
                      padding: EdgeInsets.only(bottom: AppSpacing.xs),
                      child: Text(
                        '• $review',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                ],
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          context.push(
                            '/market/seller-profile',
                            extra: {
                              'sellerId': profile.sellerId,
                              'listingId': listingId,
                            },
                          );
                        },
                        icon: const Icon(Icons.person_outline),
                        label: const Text('Профайл харах'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showRateSellerDialog(
                          context,
                          ref,
                          profile.sellerId,
                        ),
                        icon: const Icon(Icons.star_border),
                        label: const Text('Үнэлэх'),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
          loading: () => SkeletonLoader(
            items: 1,
            itemBuilder: (ctx, i) => const SkeletonCardTile(),
          ),
          error: (error, stackTrace) => TamgaErrorWidget(
            message: 'Худалдагчийн мэдээлэл ачаалахад алдаа гарлаа',
            onRetry: () =>
                ref.invalidate(marketSafetySummaryProvider(listingId)),
          ),
        ),
      ),
    );
  }

  Future<void> _showRateSellerDialog(
    BuildContext context,
    WidgetRef ref,
    String sellerId,
  ) async {
    double selectedRating = 5.0;
    final reviewController = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Худалдагчийг үнэлэх'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Үнэлгээ сонгох:'),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      final starVal = index + 1.0;
                      return IconButton(
                        icon: Icon(
                          selectedRating >= starVal
                              ? Icons.star
                              : Icons.star_border,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        onPressed: () =>
                            setState(() => selectedRating = starVal),
                      );
                    }),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextField(
                    controller: reviewController,
                    decoration: const InputDecoration(
                      labelText: 'Сэтгэгдэл',
                      hintText: 'Та өөрийн сэтгэгдлээ үлдээнэ үү...',
                    ),
                    maxLines: 3,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Цуцлах'),
                ),
                FilledButton(
                  onPressed: () async {
                    final repository = await ref.read(
                      marketRepositoryProvider.future,
                    );
                    await repository.submitSellerRating(
                      listingId: listingId,
                      sellerId: sellerId,
                      buyerId: localMarketBuyerId,
                      rating: selectedRating.toInt(),
                      review: reviewController.text.trim().isNotEmpty
                          ? reviewController.text.trim()
                          : 'Үнэлгээ: ${selectedRating.toInt()}★',
                    );

                    ref.invalidate(marketListingsProvider);
                    ref.invalidate(marketCatalogProvider);
                    ref.invalidate(marketSafetySummaryProvider(listingId));
                    ref.invalidate(sellerRatingSummaryProvider(sellerId));

                    if (context.mounted) {
                      Navigator.of(context).pop();
                      TamgaToast.showSuccess(
                        context,
                        'Үнэлгээ амжилттай илгээгдлээ.',
                      );
                    }
                  },
                  child: const Text('Илгээх'),
                ),
              ],
            );
          },
        );
      },
    );
    reviewController.dispose();
  }
}

class _InquiryStatusCard extends StatelessWidget {
  const _InquiryStatusCard({required this.safety});

  final AsyncValue<MarketSafetySummary> safety;

  @override
  Widget build(BuildContext context) {
    return safety.maybeWhen(
      data: (summary) {
        final inquiry = summary.localBuyerInquiry;
        return Card(
          child: ListTile(
            leading: const Icon(Icons.mark_chat_unread_outlined),
            title: Text(
              inquiry == null
                  ? 'Асуулт алга байна'
                  : 'Таны асуулт: ${inquiry.status.label}',
            ),
            subtitle: Text(
              'Асуултууд ${summary.inquiryCount} • Мэдээллүүд ${summary.reportCount}'
              '${summary.hasLocalReport ? ' • Мэдээлэгдсэн' : ''}',
            ),
          ),
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        child: Text(label, style: theme.textTheme.labelLarge),
      ),
    );
  }
}

class _PriceInsightCard extends ConsumerWidget {
  const _PriceInsightCard({
    required this.listingId,
    required this.listingPrice,
  });

  final String listingId;
  final int listingPrice;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightAsync = ref.watch(priceInsightProvider(listingId));
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: insightAsync.when(
          data: (insight) {
            if (!insight.hasData) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.analytics_outlined,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Text(
                        'Үнийн шинжилгээ',
                        style: theme.textTheme.titleLarge,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    insight.buyerMessage,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              );
            }

            final verdictColor = switch (insight.verdict) {
              PriceVerdict.belowMarket => theme.colorScheme.tertiary,
              PriceVerdict.fairMarket => theme.colorScheme.primary,
              PriceVerdict.aboveMarket => theme.colorScheme.error,
              PriceVerdict.unknown => theme.colorScheme.onSurfaceVariant,
            };

            final verdictIcon = switch (insight.verdict) {
              PriceVerdict.belowMarket => Icons.trending_down,
              PriceVerdict.fairMarket => Icons.trending_flat,
              PriceVerdict.aboveMarket => Icons.trending_up,
              PriceVerdict.unknown => Icons.help_outline,
            };

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(verdictIcon, color: verdictColor),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Үнийн шинжилгээ', style: theme.textTheme.titleLarge),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: verdictColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusSmall,
                    ),
                    border: Border.all(
                      color: verdictColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Text(
                    insight.verdictLabel,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: verdictColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text(insight.buyerMessage, style: theme.textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.md),
                if (insight.averagePrice != null)
                  _InsightRow(
                    label: 'Дундаж үнэ',
                    value: _formatCurrency(insight.averagePrice!),
                  ),
                if (insight.minPrice != null && insight.maxPrice != null) ...[
                  _InsightRow(
                    label: 'Хязгаар',
                    value:
                        '${_formatCurrency(insight.minPrice!)} — ${_formatCurrency(insight.maxPrice!)}',
                  ),
                ],
                _InsightRow(label: 'Түвшин', value: insight.percentileLabel),
                _InsightRow(
                  label: 'Тулгуур зарууд',
                  value: '${insight.comparableCount}',
                ),
              ],
            );
          },
          loading: () => SkeletonLoader(
            items: 1,
            itemBuilder: (ctx, i) => const SkeletonCardTile(),
          ),
          error: (error, _) => TamgaErrorWidget(
            message: 'Үнийн шинжилгээ ачаалахад алдаа гарлаа',
            onRetry: () => ref.invalidate(priceInsightProvider(listingId)),
          ),
        ),
      ),
    );
  }
}

class _InsightRow extends StatelessWidget {
  const _InsightRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

String _formatCurrency(int value) {
  return '${value.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ',')} ₮';
}

String _formatDate(DateTime date) {
  return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
      '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
}

String _formatPrice(MarketListing listing) {
  final value = listing.priceAmount.toString().replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (match) => ',',
  );
  return '$value ${listing.currency}';
}

// ── Seller Offer Section ───────────────────────────────────────────

/// Худалдагчид ирсэн үнийн саналуудын жагсаалт.
class _SellerOfferSection extends ConsumerWidget {
  const _SellerOfferSection({
    required this.listingId,
    required this.listingPrice,
  });

  final String listingId;
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
                    Icon(Icons.local_offer, color: theme.colorScheme.primary),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Ирсэн саналууд', style: theme.textTheme.titleLarge),
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
                  (offer) => _SellerOfferItem(
                    offer: offer,
                    listingPrice: listingPrice,
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: TamgaErrorWidget(
          message: 'Ирсэн саналууд ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(offersForListingProvider(listingId)),
        ),
      ),
    );
  }
}

/// Худалдагчид ирсэн нэг саналын мөр.
class _SellerOfferItem extends ConsumerWidget {
  const _SellerOfferItem({required this.offer, required this.listingPrice});

  final MarketOffer offer;
  final int listingPrice;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    final statusColor = switch (offer.status) {
      MarketOfferStatus.pending => theme.colorScheme.primary,
      MarketOfferStatus.accepted => theme.colorScheme.tertiary,
      MarketOfferStatus.declined => theme.colorScheme.error,
      MarketOfferStatus.countered => theme.colorScheme.secondary,
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
          // Offer details
          Row(
            children: [
              Text(
                _formatCurrency(offer.amount),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (offer.counterAmount != null) ...[
                const SizedBox(width: AppSpacing.xs),
                Text(
                  '→ ${_formatCurrency(offer.counterAmount!)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.secondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
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
          if (offer.message != null && offer.message!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              offer.message!,
              style: theme.textTheme.bodySmall?.copyWith(
                fontStyle: FontStyle.italic,
                color: theme.colorScheme.onSurfaceVariant,
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
          const SizedBox(height: AppSpacing.sm),

          // Action buttons (only for active offers)
          if (offer.isActive)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _openResponseDialog(context, ref),
                icon: const Icon(Icons.reply_outlined, size: 16),
                label: const Text('Хариу өгөх'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openResponseDialog(BuildContext context, WidgetRef ref) async {
    final result = await OfferResponseDialog.show(
      context,
      offer: offer,
      listingPrice: listingPrice,
    );

    if (result == null || !context.mounted) return;

    final (status, counterAmount) = result;
    final actions = ref.read(offerActionsProvider);
    final apiResult = await actions.respondToOffer(
      offerId: offer.id,
      status: status,
      counterAmount: counterAmount,
      listingId: offer.listingId,
    );

    if (!context.mounted) return;

    if (apiResult.isSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            status == MarketOfferStatus.accepted
                ? 'Санал зөвшөөрөгдлөө!'
                : status == MarketOfferStatus.declined
                ? 'Санал татгалзлаа.'
                : 'Хариу санал илгээгдлээ.',
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Алдаа: ${apiResult.error.message}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    }
  }
}

// ── Rating Badge ────────────────────────────────────────────────────

/// Үнэлгээний од болон тоог харуулах widget.
class _RatingBadge extends StatelessWidget {
  const _RatingBadge({required this.averageRating, required this.ratingCount});

  final double averageRating;
  final int ratingCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (ratingCount == 0) {
      return Row(
        children: [
          Icon(Icons.star_border, size: 16, color: theme.colorScheme.outline),
          const SizedBox(width: AppSpacing.xs),
          Text(
            'Үнэлгээгүй',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      );
    }

    return Row(
      children: [
        ...List.generate(5, (index) {
          final star = index + 1;
          final filled = star <= averageRating.round();
          return Icon(
            filled ? Icons.star : Icons.star_border,
            size: 16,
            color: filled
                ? theme.colorScheme.primary
                : theme.colorScheme.outline,
          );
        }),
        const SizedBox(width: AppSpacing.sm),
        Text(
          '${averageRating.toStringAsFixed(1)} ($ratingCount)',
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w500,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ── Lost-report conflict banner ─────────────────────────────────────

/// Warning banner shown when the listed horse has an active recovery report.
///
/// The server flags listings via `lost_report_conflict`; this banner also
/// renders when a live active report is found for the horse (belt-and-braces).
class _LostReportConflictBanner extends ConsumerWidget {
  const _LostReportConflictBanner({required this.report});

  /// The active report, when known from the live recovery feed.
  final LostHorseReport? report;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;

    return Card(
      color: theme.colorScheme.errorContainer,
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: theme.colorScheme.onErrorContainer,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.marketLostReportConflictTitle,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onErrorContainer,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    l10n.marketLostReportConflictBody,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onErrorContainer,
                    ),
                  ),
                  if (report != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    TextButton.icon(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              LostHorseDetailScreen(report: report!),
                        ),
                      ),
                      icon: const Icon(Icons.open_in_new, size: 16),
                      label: Text(l10n.marketLostReportView),
                      style: TextButton.styleFrom(
                        foregroundColor: theme.colorScheme.onErrorContainer,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Provenance badges and rows ─────────────────────────────────────

/// Small verified badge chip (tamga / state registration).
class _ProvenanceBadge extends StatelessWidget {
  const _ProvenanceBadge({required this.label, required this.icon});

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      visualDensity: VisualDensity.compact,
      backgroundColor: theme.colorScheme.secondaryContainer,
      labelStyle: theme.textTheme.labelSmall?.copyWith(
        color: theme.colorScheme.onSecondaryContainer,
      ),
    );
  }
}

/// Identity/document rows shown on the horse card when the data exists.
List<Widget> _provenanceRows(BuildContext context, Horse horse) {
  final theme = Theme.of(context);
  final l10n = AppLocalizations.of(context)!;

  final rows = <(String, String)>[
    if (horse.tamgaBrandClan != null && horse.tamgaBrandClan!.isNotEmpty)
      (l10n.marketTamgaClan, horse.tamgaBrandClan!),
    if (horse.tamgaBrandGeneration != null)
      (l10n.marketTamgaGeneration, '${horse.tamgaBrandGeneration}'),
    if (horse.registrationNo != null && horse.registrationNo!.isNotEmpty)
      (l10n.marketRegistrationNo, horse.registrationNo!),
    if (horse.microchipId != null && horse.microchipId!.isNotEmpty)
      (l10n.marketMicrochipId, horse.microchipId!),
    if (horse.coatColor != null)
      (l10n.marketCoatColor, horse.coatColor!.displayName),
    if (horse.breedLineage != null)
      (l10n.marketBreedLineage, horse.breedLineage!.displayName),
    if (horse.region != null && horse.region!.isNotEmpty)
      (l10n.marketRegion, horse.region!),
    if (horse.sum != null && horse.sum!.isNotEmpty)
      (l10n.marketSum, horse.sum!),
  ];
  if (rows.isEmpty) return const [];

  return [
    const SizedBox(height: AppSpacing.md),
    Text(
      l10n.marketProvenanceTitle,
      style: theme.textTheme.labelLarge?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
      ),
    ),
    const SizedBox(height: AppSpacing.xs),
    ...rows.map(
      (row) => Padding(
        padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 2,
              child: Text(
                row.$1,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            Expanded(
              flex: 3,
              child: Text(
                row.$2,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  ];
}
