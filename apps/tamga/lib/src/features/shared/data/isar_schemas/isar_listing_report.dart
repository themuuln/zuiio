import 'package:isar/isar.dart';

import '../../../market/domain/market_safety.dart';

part 'isar_listing_report.g.dart';

@collection
class IsarListingReport {
  IsarListingReport();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String listingId;
  late String reporterId;
  late String reason;
  @enumerated
  late ListingReportStatus status;
  late DateTime createdAt;

  factory IsarListingReport.fromDomain(ListingReport report) {
    return IsarListingReport()
      ..domainId = report.id
      ..listingId = report.listingId
      ..reporterId = report.reporterId
      ..reason = report.reason
      ..status = report.status
      ..createdAt = report.createdAt;
  }

  ListingReport toDomain() {
    return ListingReport(
      id: domainId,
      listingId: listingId,
      reporterId: reporterId,
      reason: reason,
      status: status,
      createdAt: createdAt,
    );
  }
}
