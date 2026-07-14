import 'package:isar/isar.dart';

import '../../../events/domain/event_record.dart';

part 'isar_event_record.g.dart';

@collection
class IsarEventRecord {
  IsarEventRecord();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String title;
  @Index()
  late String horseId;
  late String horseName;
  late String eventType;
  late String dateLabel;
  late String placeLabel;
  late String awardLabel;
  late String notes;
  @Index()
  late bool isUpcoming;

  factory IsarEventRecord.fromDomain(EventRecord event) {
    return IsarEventRecord()
      ..domainId = event.id
      ..title = event.title
      ..horseId = event.horseId
      ..horseName = event.horseName
      ..eventType = event.eventType
      ..dateLabel = event.dateLabel
      ..placeLabel = event.placeLabel
      ..awardLabel = event.awardLabel
      ..notes = event.notes
      ..isUpcoming = event.isUpcoming;
  }

  EventRecord toDomain() {
    return EventRecord(
      id: domainId,
      title: title,
      horseId: horseId,
      horseName: horseName,
      eventType: eventType,
      dateLabel: dateLabel,
      placeLabel: placeLabel,
      awardLabel: awardLabel,
      notes: notes,
      isUpcoming: isUpcoming,
    );
  }
}
