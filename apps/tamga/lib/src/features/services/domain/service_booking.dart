import 'service_booking_status.dart';
import 'service_provider_type.dart';

/// Үйлчилгээний захиалгын домэйн загвар.
///
/// Хэрэглэгчийн гэрэл зурагчин эсвэл мал эмнэлгийн үйлчилгээний
/// захиалгыг төлөөлнө.
class ServiceBooking {
  const ServiceBooking({
    required this.id,
    required this.userId,
    this.providerId,
    required this.providerType,
    required this.serviceType,
    this.horseIds = const [],
    this.locationAimag,
    this.locationSum,
    this.address,
    required this.bookingDate,
    this.status = ServiceBookingStatus.pending,
    this.totalAmount,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String? providerId;
  final ServiceProviderType providerType;
  final String serviceType;
  final List<String> horseIds;
  final String? locationAimag;
  final String? locationSum;
  final String? address;
  final DateTime bookingDate;
  final ServiceBookingStatus status;
  final int? totalAmount;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Захиалгыг цуцлах.
  ServiceBooking cancel() {
    return copyWith(
      status: ServiceBookingStatus.cancelled,
      updatedAt: DateTime.now(),
    );
  }

  /// Захиалгыг баталгаажуулах.
  ServiceBooking confirm() {
    return copyWith(
      status: ServiceBookingStatus.confirmed,
      updatedAt: DateTime.now(),
    );
  }

  /// Захиалгыг дууссан болгох.
  ServiceBooking complete() {
    return copyWith(
      status: ServiceBookingStatus.completed,
      updatedAt: DateTime.now(),
    );
  }

  /// Захиалга идэвхтэй эсэх (pending эсвэл confirmed).
  bool get isActive =>
      status == ServiceBookingStatus.pending ||
      status == ServiceBookingStatus.confirmed;

  ServiceBooking copyWith({
    String? id,
    String? userId,
    Object? providerId = _sentinel,
    ServiceProviderType? providerType,
    String? serviceType,
    List<String>? horseIds,
    Object? locationAimag = _sentinel,
    Object? locationSum = _sentinel,
    Object? address = _sentinel,
    DateTime? bookingDate,
    ServiceBookingStatus? status,
    Object? totalAmount = _sentinel,
    Object? notes = _sentinel,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ServiceBooking(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      providerId: providerId == _sentinel
          ? this.providerId
          : providerId as String?,
      providerType: providerType ?? this.providerType,
      serviceType: serviceType ?? this.serviceType,
      horseIds: horseIds ?? this.horseIds,
      locationAimag: locationAimag == _sentinel
          ? this.locationAimag
          : locationAimag as String?,
      locationSum: locationSum == _sentinel
          ? this.locationSum
          : locationSum as String?,
      address: address == _sentinel ? this.address : address as String?,
      bookingDate: bookingDate ?? this.bookingDate,
      status: status ?? this.status,
      totalAmount: totalAmount == _sentinel
          ? this.totalAmount
          : totalAmount as int?,
      notes: notes == _sentinel ? this.notes : notes as String?,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // ── Serialization ──────────────────────────────────────────────────

  factory ServiceBooking.fromJson(Map<String, dynamic> json) {
    return ServiceBooking(
      id: json['id'] as String,
      userId: json['userId'] as String,
      providerId: json['providerId'] as String?,
      providerType: ServiceProviderType.values.byName(
        json['providerType'] as String,
      ),
      serviceType: json['serviceType'] as String,
      horseIds: List<String>.from(json['horseIds'] as List<dynamic>? ?? []),
      locationAimag: json['locationAimag'] as String?,
      locationSum: json['locationSum'] as String?,
      address: json['address'] as String?,
      bookingDate: DateTime.parse(json['bookingDate'] as String),
      status: ServiceBookingStatus.values.byName(
        json['status'] as String? ?? 'pending',
      ),
      totalAmount: json['totalAmount'] as int?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'providerId': providerId,
      'providerType': providerType.name,
      'serviceType': serviceType,
      'horseIds': horseIds,
      'locationAimag': locationAimag,
      'locationSum': locationSum,
      'address': address,
      'bookingDate': bookingDate.toIso8601String(),
      'status': status.name,
      'totalAmount': totalAmount,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // ── Supabase Serialization ────────────────────────────────────────

  factory ServiceBooking.fromSupabaseJson(Map<String, dynamic> row) {
    return ServiceBooking(
      id: row['id'] as String,
      userId: row['user_id'] as String,
      providerId: row['provider_id'] as String?,
      providerType: ServiceProviderType.values.byName(
        row['provider_type'] as String,
      ),
      serviceType: row['service_type'] as String,
      horseIds: (row['horse_ids'] as List<dynamic>?)?.cast<String>() ?? [],
      locationAimag: row['location_aimag'] as String?,
      locationSum: row['location_sum'] as String?,
      address: row['address'] as String?,
      bookingDate: DateTime.parse(row['booking_date'] as String),
      status: ServiceBookingStatus.values.byName(
        row['status'] as String? ?? 'pending',
      ),
      totalAmount: row['total_amount'] as int?,
      notes: row['notes'] as String?,
      createdAt: DateTime.parse(row['created_at'] as String),
      updatedAt: DateTime.parse(row['updated_at'] as String),
    );
  }

  Map<String, dynamic> toSupabaseJson() {
    return {
      'id': id,
      'user_id': userId,
      'provider_id': providerId,
      'provider_type': providerType.name,
      'service_type': serviceType,
      'horse_ids': horseIds,
      'location_aimag': locationAimag,
      'location_sum': locationSum,
      'address': address,
      'booking_date': bookingDate.toIso8601String().substring(0, 10),
      'status': status.name,
      'total_amount': totalAmount,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

const _sentinel = Object();
