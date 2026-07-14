import 'package:isar/isar.dart';

import '../../../nutrition/domain/feed_schedule.dart';

part 'isar_feed_schedule.g.dart';

/// Isar collection for [FeedSchedule].
@collection
class IsarFeedSchedule {
  IsarFeedSchedule();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  @enumerated
  late FeedType feedType;
  late double quantityKg;
  late String frequency;
  late DateTime startDate;
  DateTime? endDate;
  late String notes;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarFeedSchedule.fromDomain(FeedSchedule schedule) {
    return IsarFeedSchedule()
      ..domainId = schedule.id
      ..horseId = schedule.horseId
      ..feedType = schedule.feedType
      ..quantityKg = schedule.quantityKg
      ..frequency = schedule.frequency
      ..startDate = schedule.startDate
      ..endDate = schedule.endDate
      ..notes = schedule.notes
      ..createdAt = schedule.createdAt
      ..updatedAt = schedule.updatedAt;
  }

  FeedSchedule toDomain() {
    return FeedSchedule(
      id: domainId,
      horseId: horseId,
      feedType: feedType,
      quantityKg: quantityKg,
      frequency: frequency,
      startDate: startDate,
      endDate: endDate,
      notes: notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
