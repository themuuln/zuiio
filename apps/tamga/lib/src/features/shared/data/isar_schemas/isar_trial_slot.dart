import 'package:isar/isar.dart';

import '../../../market/domain/trial_slot.dart';

part 'isar_trial_slot.g.dart';

/// Isar collection for persistent storage of [TrialSlot].
@collection
class IsarTrialSlot {
  IsarTrialSlot();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String listingId;

  @Index()
  late String sellerId;

  late String date; // ISO 8601 string

  late String startTime;

  late String endTime;

  late String status;

  String? buyerId;

  String? notes;

  DateTime? createdAt;

  factory IsarTrialSlot.fromDomain(TrialSlot slot) {
    return IsarTrialSlot()
      ..domainId = slot.id
      ..listingId = slot.listingId
      ..sellerId = slot.sellerId
      ..date = slot.date.toIso8601String()
      ..startTime = slot.startTime
      ..endTime = slot.endTime
      ..status = slot.status.name
      ..buyerId = slot.buyerId
      ..notes = slot.notes
      ..createdAt = slot.createdAt;
  }

  TrialSlot toDomain() {
    return TrialSlot(
      id: domainId,
      listingId: listingId,
      sellerId: sellerId,
      date: DateTime.parse(date),
      startTime: startTime,
      endTime: endTime,
      status: TrialSlotStatus.fromString(status),
      buyerId: buyerId,
      notes: notes,
      createdAt: createdAt ?? DateTime.now(),
    );
  }
}
