import 'package:isar/isar.dart';

import '../../../nutrition/domain/feed_log.dart';

part 'isar_feed_log.g.dart';

/// Isar collection for [FeedLog].
@collection
class IsarFeedLog {
  IsarFeedLog();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String scheduleId;
  @Index()
  late String horseId;
  @Index()
  late DateTime date;
  late double amountGiven;
  late bool skipped;
  late String notes;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarFeedLog.fromDomain(FeedLog log) {
    return IsarFeedLog()
      ..domainId = log.id
      ..scheduleId = log.scheduleId
      ..horseId = log.horseId
      ..date = log.date
      ..amountGiven = log.amountGiven
      ..skipped = log.skipped
      ..notes = log.notes
      ..createdAt = log.createdAt
      ..updatedAt = log.updatedAt;
  }

  FeedLog toDomain() {
    return FeedLog(
      id: domainId,
      scheduleId: scheduleId,
      horseId: horseId,
      date: date,
      amountGiven: amountGiven,
      skipped: skipped,
      notes: notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
