import 'package:isar/isar.dart';

import '../../../../shared/domain/event_registration.dart';

part 'isar_event_registration.g.dart';

@collection
class IsarEventRegistration {
  IsarEventRegistration();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  late String eventId;
  @Index()
  late String horseId;
  late String ownerId;
  late DateTime registeredAt;
  @enumerated
  late RegistrationStatus status;
  String? notes;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarEventRegistration.fromDomain(EventRegistration registration) {
    return IsarEventRegistration()
      ..domainId = registration.id
      ..eventId = registration.eventId
      ..horseId = registration.horseId
      ..ownerId = registration.ownerId
      ..registeredAt = registration.registeredAt
      ..status = registration.status
      ..notes = registration.notes
      ..createdAt = registration.createdAt
      ..updatedAt = registration.updatedAt;
  }

  EventRegistration toDomain() {
    return EventRegistration(
      id: domainId,
      eventId: eventId,
      horseId: horseId,
      ownerId: ownerId,
      registeredAt: registeredAt,
      status: status,
      notes: notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
