import 'package:isar/isar.dart';

import '../../domain/service_booking.dart';
import '../../domain/service_booking_status.dart';
import '../../domain/service_provider_type.dart';

part 'isar_service_booking.g.dart';

@collection
class IsarServiceBooking {
  IsarServiceBooking();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String userId;

  String? providerId;

  @enumerated
  late ServiceProviderType providerType;

  late String serviceType;

  late List<String> horseIds;

  String? locationAimag;
  String? locationSum;
  String? address;

  late DateTime bookingDate;

  @enumerated
  late ServiceBookingStatus status;

  int? totalAmount;
  String? notes;

  @Index()
  late DateTime createdAt;
  late DateTime updatedAt;

  factory IsarServiceBooking.fromDomain(ServiceBooking booking) {
    return IsarServiceBooking()
      ..domainId = booking.id
      ..userId = booking.userId
      ..providerId = booking.providerId
      ..providerType = booking.providerType
      ..serviceType = booking.serviceType
      ..horseIds = List<String>.from(booking.horseIds)
      ..locationAimag = booking.locationAimag
      ..locationSum = booking.locationSum
      ..address = booking.address
      ..bookingDate = booking.bookingDate
      ..status = booking.status
      ..totalAmount = booking.totalAmount
      ..notes = booking.notes
      ..createdAt = booking.createdAt
      ..updatedAt = booking.updatedAt;
  }

  ServiceBooking toDomain() {
    return ServiceBooking(
      id: domainId,
      userId: userId,
      providerId: providerId,
      providerType: providerType,
      serviceType: serviceType,
      horseIds: List<String>.from(horseIds),
      locationAimag: locationAimag,
      locationSum: locationSum,
      address: address,
      bookingDate: bookingDate,
      status: status,
      totalAmount: totalAmount,
      notes: notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
