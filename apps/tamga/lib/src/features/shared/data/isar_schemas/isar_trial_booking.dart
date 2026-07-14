import 'package:isar/isar.dart';

import '../../../market/domain/trial_booking.dart';

part 'isar_trial_booking.g.dart';

/// Isar collection for persistent storage of [TrialBooking].
@collection
class IsarTrialBooking {
  IsarTrialBooking();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String listingId;

  @Index()
  late String slotId;

  @Index()
  late String buyerId;

  @Index()
  late String sellerId;

  late String status;

  String? notes;

  DateTime? requestedAt;

  DateTime? respondedAt;

  factory IsarTrialBooking.fromDomain(TrialBooking booking) {
    return IsarTrialBooking()
      ..domainId = booking.id
      ..listingId = booking.listingId
      ..slotId = booking.slotId
      ..buyerId = booking.buyerId
      ..sellerId = booking.sellerId
      ..status = booking.status.name
      ..notes = booking.notes
      ..requestedAt = booking.requestedAt
      ..respondedAt = booking.respondedAt;
  }

  TrialBooking toDomain() {
    return TrialBooking(
      id: domainId,
      listingId: listingId,
      slotId: slotId,
      buyerId: buyerId,
      sellerId: sellerId,
      status: TrialBookingStatus.fromString(status),
      notes: notes,
      requestedAt: requestedAt ?? DateTime.now(),
      respondedAt: respondedAt,
    );
  }
}
