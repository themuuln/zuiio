import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/market_listing.dart';
import '../domain/market_safety.dart';
import 'market_notifications.dart';
import 'market_providers.dart';

/// View model for the moderation queue combining a report with its listing.
class ModerationReportVm {
  const ModerationReportVm({required this.report, required this.listing});

  final ListingReport report;
  final MarketListing listing;

  bool get isResolved => report.status == ListingReportStatus.resolved;
}

/// Fetches all reports and pairs them with their corresponding listings.
final moderationQueueProvider = FutureProvider<List<ModerationReportVm>>((
  ref,
) async {
  final repository = await ref.watch(marketRepositoryProvider.future);
  final allListings = await ref.watch(marketListingsProvider.future);

  final reportsResult = await repository.fetchAllReports();
  final reports = reportsResult.getOrThrow();

  final listingById = {for (final l in allListings) l.id: l};

  final vms = <ModerationReportVm>[];
  for (final report in reports) {
    final listing = listingById[report.listingId];
    if (listing != null) {
      vms.add(ModerationReportVm(report: report, listing: listing));
    }
  }

  // Sort by most recent first
  vms.sort((a, b) => b.report.createdAt.compareTo(a.report.createdAt));

  return vms;
});

/// Approves a reported listing: sets listing status to active and report to resolved,
/// notifies the seller, and triggers saved search matching.
Future<void> approveReport(
  WidgetRef ref,
  String reportId,
  String listingId,
) async {
  final repository = await ref.read(marketRepositoryProvider.future);

  // Get old listing status for notification
  final oldListing = await repository.fetchListingById(listingId);
  final oldStatus = oldListing.getOrThrow()?.status;

  // First resolve the report
  await repository.resolveReport(reportId, ListingReportStatus.resolved);

  // Then set listing status to active
  // We use renewListing which sets status to active
  await repository.renewListing(listingId);

  // Notify seller about the status change
  if (oldStatus != null && oldStatus != MarketListingStatus.active) {
    final notifications = await ref.read(marketNotificationsProvider.future);
    await notifications.onListingStatusChanged(
      listingId: listingId,
      oldStatus: oldStatus,
      newStatus: MarketListingStatus.active,
    );

    // Trigger saved search matching for the newly active listing
    final approvedListing = await repository.fetchListingById(listingId);
    final listing = approvedListing.getOrThrow();
    if (listing != null) {
      await notifications.triggerMatchingForListing(listing);
    }
  }

  // Invalidate providers to refresh
  ref.invalidate(moderationQueueProvider);
  ref.invalidate(marketListingsProvider);
  ref.invalidate(marketCatalogProvider);
}

/// Rejects a reported listing: sets listing status to rejected, report to resolved,
/// and notifies the seller with the rejection reason.
Future<void> rejectReport(
  WidgetRef ref,
  String reportId,
  String listingId,
  String reason,
) async {
  final repository = await ref.read(marketRepositoryProvider.future);

  // Get old listing status for notification
  final oldListing = await repository.fetchListingById(listingId);
  final oldStatus = oldListing.getOrThrow()?.status;

  // First resolve the report
  await repository.resolveReport(reportId, ListingReportStatus.resolved);

  // Then set listing status to rejected
  await repository.saveListing(
    (await repository.fetchListingById(
      listingId,
    )).getOrThrow()!.copyWith(status: MarketListingStatus.rejected),
  );

  // Notify seller about the rejection with reason
  if (oldStatus != null && oldStatus != MarketListingStatus.rejected) {
    final notifications = await ref.read(marketNotificationsProvider.future);
    await notifications.onListingStatusChanged(
      listingId: listingId,
      oldStatus: oldStatus,
      newStatus: MarketListingStatus.rejected,
      reason: reason,
    );
  }

  // Invalidate providers to refresh
  ref.invalidate(moderationQueueProvider);
  ref.invalidate(marketListingsProvider);
  ref.invalidate(marketCatalogProvider);
}
