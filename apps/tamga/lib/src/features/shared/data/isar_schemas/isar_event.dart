import 'package:isar/isar.dart';

import '../../../../shared/domain/event.dart';

part 'isar_event.g.dart';

@collection
class IsarEvent {
  IsarEvent();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;
  @Index()
  late String horseId;
  late String title;
  String? ownerId;
  @enumerated
  @Index()
  late EventType eventType;
  @Index()
  DateTime? date;
  String? horseName;
  String? location;
  double? latitude;
  double? longitude;
  String? result;
  int? prizeAmount;
  String? organizerName;
  String? organizerPhone;
  String? organizerEmail;
  bool? isFeatured;
  bool? registrationEnabled;
  String? address;
  String? notes;
  late List<String> photoUrls;
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarEvent.fromDomain(Event event) {
    return IsarEvent()
      ..domainId = event.id
      ..horseId = event.horseId
      ..title = event.title
      ..ownerId = event.ownerId.isEmpty ? null : event.ownerId
      ..eventType = event.eventType
      ..date = event.date
      ..horseName = event.horseName
      ..location = event.location
      ..latitude = event.latitude
      ..longitude = event.longitude
      ..result = event.result
      ..prizeAmount = event.prizeAmount
      ..organizerName = event.organizerName
      ..organizerPhone = event.organizerPhone
      ..organizerEmail = event.organizerEmail
      ..isFeatured = event.isFeatured ? true : null
      ..registrationEnabled = event.registrationEnabled ? true : null
      ..address = event.address
      ..notes = event.notes
      ..photoUrls = List<String>.from(event.photoUrls)
      ..createdAt = event.createdAt
      ..updatedAt = event.updatedAt;
  }

  Event toDomain() {
    return Event(
      id: domainId,
      horseId: horseId,
      title: title,
      ownerId: ownerId ?? '',
      eventType: eventType,
      date: date,
      horseName: horseName,
      location: location,
      latitude: latitude,
      longitude: longitude,
      result: result,
      prizeAmount: prizeAmount,
      organizerName: organizerName,
      organizerPhone: organizerPhone,
      organizerEmail: organizerEmail,
      isFeatured: isFeatured ?? false,
      registrationEnabled: registrationEnabled ?? false,
      address: address,
      notes: notes,
      photoUrls: List<String>.from(photoUrls),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
