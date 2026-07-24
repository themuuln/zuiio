import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

// ── Domain model imports ─────────────────────────────────────
import 'package:tamga/src/features/breeding/domain/breeding_record.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/races/domain/race.dart';
import 'package:tamga/src/features/races/domain/race_entry.dart';
import 'package:tamga/src/shared/domain/event.dart';
import 'package:tamga/src/shared/domain/event_registration.dart';
import 'package:tamga/src/features/training/domain/training_log.dart';
import 'package:tamga/src/features/training/domain/performance_record.dart';
import 'package:tamga/src/features/nutrition/domain/feed_schedule.dart';
import 'package:tamga/src/features/nutrition/domain/feed_log.dart';
import 'package:tamga/src/shared/domain/health_log.dart';
import 'package:tamga/src/shared/domain/horse.dart';

// ── Test Environment Setup ───────────────────────────────────

/// Initializes the test binding and mocks the path_provider method channel
/// so that IsarDatabase.initialize() can run in unit/widget tests.
///
/// Call this at the very top of main() in any test file that uses Isar.
Future<void> setupTestEnvironment() async {
  TestWidgetsFlutterBinding.ensureInitialized();

  final tempDir = Directory.systemTemp.createTempSync('tamga_test_');

  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('plugins.flutter.io/path_provider'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'getApplicationDocumentsDirectory') {
            return tempDir.path;
          }
          return null;
        },
      );
}

// ── Mock Factory Functions ───────────────────────────────────
//
// These functions create domain model instances with sensible
// defaults so tests don't need to specify every field.
// Each factory accepts optional overrides for specific fields.
//
// Usage:
//   final horse = createMockHorse();
//   final customHorse = createMockHorse(name: 'Миний морь');

/// Creates a [Horse] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
Horse createMockHorse({
  String id = 'test-horse-1',
  String ownerId = 'test-owner-1',
  String name = 'Test Horse',
  String relationLabel = 'Test',
  String coat = 'Хээр',
  int birthYear = 2018,
  int awardCount = 2,
  int offspringCount = 0,
  bool isOwnedByHousehold = true,
  String notes = '',
  HorseGender gender = HorseGender.gelding,
  String? microchipId,
  String? registrationNo,
  List<String> photoUrls = const [],
  String? lineageRootId,
  String? ownerStampSvg,
  DateTime? registrationDate,
  bool tamgaVerified = false,
  bool stateVerified = false,
}) {
  return Horse(
    id: id,
    ownerId: ownerId,
    name: name,
    relationLabel: relationLabel,
    coat: coat,
    birthYear: birthYear,
    awardCount: awardCount,
    offspringCount: offspringCount,
    isOwnedByHousehold: isOwnedByHousehold,
    notes: notes,
    gender: gender,
    microchipId: microchipId,
    registrationNo: registrationNo,
    photoUrls: photoUrls,
    lineageRootId: lineageRootId,
    ownerStampSvg: ownerStampSvg,
    registrationDate: registrationDate,
    tamgaVerified: tamgaVerified,
    stateVerified: stateVerified,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates an [Event] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
Event createMockEvent({
  String id = 'test-event-1',
  String horseId = 'test-horse-1',
  String title = 'Test Event',
  EventType eventType = EventType.race,
  String ownerId = 'test-owner-1',
  DateTime? date,
  String? horseName = 'Test Horse',
  String? location = 'Test Location',
  double? latitude,
  double? longitude,
  String? result,
  int? prizeAmount,
  String? organizerName,
  String? organizerPhone,
  String? organizerEmail,
  bool isFeatured = false,
  bool registrationEnabled = false,
  String? address,
  String? notes,
  List<String> photoUrls = const [],
}) {
  return Event(
    id: id,
    horseId: horseId,
    title: title,
    eventType: eventType,
    ownerId: ownerId,
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
    isFeatured: isFeatured,
    registrationEnabled: registrationEnabled,
    address: address,
    notes: notes,
    photoUrls: photoUrls,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates an [EventRegistration] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
EventRegistration createMockEventRegistration({
  String id = 'test-reg-1',
  String eventId = 'test-event-1',
  String horseId = 'test-horse-1',
  String ownerId = 'test-owner-1',
  DateTime? registeredAt,
  RegistrationStatus status = RegistrationStatus.registered,
  String? notes,
}) {
  return EventRegistration(
    id: id,
    eventId: eventId,
    horseId: horseId,
    ownerId: ownerId,
    registeredAt: registeredAt ?? DateTime(2026, 6, 1),
    status: status,
    notes: notes,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates a [MarketListing] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
MarketListing createMockMarketListing({
  String id = 'test-listing-1',
  String horseId = 'test-horse-1',
  String sellerId = 'test-seller-1',
  String title = 'Test Listing',
  String description = 'A test market listing',
  int priceAmount = 1000000,
  String currency = 'MNT',
  MarketSaleType saleType = MarketSaleType.sale,
  MarketListingStatus status = MarketListingStatus.active,
  String locationLabel = 'Улаанбаатар',
  List<String> disciplineTags = const [],
  List<String> documentTags = const [],
  List<String> mediaUrls = const [],
  bool isSellerVerified = true,
  DateTime? createdAt,
  DateTime? updatedAt,
  int viewsCount = 0,
  bool isFavorite = false,
  bool isFeatured = false,
  BoostLevel boostLevel = BoostLevel.none,
  DateTime? boostExpiresAt,
  VipLevel vipLevel = VipLevel.none,
  DateTime? vipExpiresAt,
  SellerBadgeType sellerBadge = SellerBadgeType.none,
  DateTime? sellerBadgeExpiresAt,
}) {
  final now = DateTime(2026, 6, 1);
  return MarketListing(
    id: id,
    horseId: horseId,
    sellerId: sellerId,
    title: title,
    description: description,
    priceAmount: priceAmount,
    currency: currency,
    saleType: saleType,
    status: status,
    locationLabel: locationLabel,
    disciplineTags: disciplineTags,
    documentTags: documentTags,
    mediaUrls: mediaUrls,
    isSellerVerified: isSellerVerified,
    createdAt: createdAt ?? now,
    updatedAt: updatedAt ?? now,
    viewsCount: viewsCount,
    isFavorite: isFavorite,
    isFeatured: isFeatured,
    boostLevel: boostLevel,
    boostExpiresAt: boostExpiresAt,
    vipLevel: vipLevel,
    vipExpiresAt: vipExpiresAt,
    sellerBadge: sellerBadge,
    sellerBadgeExpiresAt: sellerBadgeExpiresAt,
  );
}

/// Creates a [BreedingRecord] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
BreedingRecord createMockBreedingRecord({
  String id = 'test-breeding-1',
  String sireId = 'test-sire-1',
  String sireName = 'Sire Horse',
  String damId = 'test-dam-1',
  String damName = 'Dam Horse',
  DateTime? breedingDate,
  DateTime? expectedFoalingDate,
  String status = 'Хээлтсэн',
  String herdLabel = 'Test Herd',
  String notes = '',
  DateTime? actualFoalingDate,
  String? foalId,
  String? foalName,
  String? foalGender,
  String? foalColor,
}) {
  final breedDate = breedingDate ?? DateTime(2026, 1, 1);
  final expectedDate =
      expectedFoalingDate ?? DateTime(2026, 12, 6); // ~340 days after breedDate
  return BreedingRecord(
    id: id,
    sireId: sireId,
    sireName: sireName,
    damId: damId,
    damName: damName,
    breedingDate: breedDate,
    expectedFoalingDate: expectedDate,
    status: status,
    herdLabel: herdLabel,
    notes: notes,
    actualFoalingDate: actualFoalingDate,
    foalId: foalId,
    foalName: foalName,
    foalGender: foalGender,
    foalColor: foalColor,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates a [HealthLog] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
HealthLog createMockHealthLog({
  String id = 'test-health-1',
  String horseId = 'test-horse-1',
  LogType logType = LogType.vaccination,
  DateTime? date,
  String notes = 'Test health log',
  String? medicament,
  double? cost,
  String? farrierName,
}) {
  return HealthLog(
    id: id,
    horseId: horseId,
    logType: logType,
    date: date ?? DateTime(2026, 1, 15),
    notes: notes,
    medicament: medicament,
    cost: cost,
    farrierName: farrierName,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates a [Race] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
Race createMockRace({
  String id = 'test-race-1',
  String name = 'Test Race',
  String? location = 'Test Location',
  DateTime? date,
  RaceType type = RaceType.local,
  RaceStatus status = RaceStatus.upcoming,
  int? maxEntries,
  int entryFee = 0,
  String organizerId = 'test-owner-1',
  String? description = 'Test Description',
  String? prizeDistribution = '1st: 500000',
}) {
  return Race(
    id: id,
    name: name,
    location: location,
    date: date ?? DateTime(2026, 7, 1),
    type: type,
    status: status,
    maxEntries: maxEntries,
    entryFee: entryFee,
    organizerId: organizerId,
    description: description,
    prizeDistribution: prizeDistribution,
  );
}

/// Creates a [TrainingLog] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
TrainingLog createMockTrainingLog({
  String id = 'test-training-1',
  String horseId = 'test-horse-1',
  TrainingLogType type = TrainingLogType.gallop,
  DateTime? date,
  int durationMinutes = 30,
  double? distanceKm = 5.0,
  String notes = 'Test training log',
  String? handlerName = 'Test Handler',
  String? weather = 'Сайн',
}) {
  return TrainingLog(
    id: id,
    horseId: horseId,
    type: type,
    date: date ?? DateTime(2026, 6, 1),
    durationMinutes: durationMinutes,
    distanceKm: distanceKm,
    notes: notes,
    handlerName: handlerName,
    weather: weather,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates a [PerformanceRecord] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
PerformanceRecord createMockPerformanceRecord({
  String id = 'test-perf-1',
  String horseId = 'test-horse-1',
  MetricType metric = MetricType.speed,
  double value = 45.0,
  DateTime? date,
  String? unit = 'км/ц',
  String notes = 'Test performance record',
}) {
  return PerformanceRecord(
    id: id,
    horseId: horseId,
    metric: metric,
    value: value,
    date: date,
    unit: unit,
    notes: notes,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates a [RaceEntry] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
RaceEntry createMockRaceEntry({
  String id = 'test-entry-1',
  String raceId = 'test-race-1',
  String horseId = 'test-horse-1',
  String ownerId = 'test-owner-1',
  String? jockeyName = 'Test Jockey',
  RaceEntryStatus status = RaceEntryStatus.registered,
  String? result,
  int? placement,
  int? prize,
}) {
  return RaceEntry(
    id: id,
    raceId: raceId,
    horseId: horseId,
    ownerId: ownerId,
    jockeyName: jockeyName,
    status: status,
    result: result,
    placement: placement,
    prize: prize,
  );
}

/// Creates a [FeedSchedule] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
FeedSchedule createMockFeedSchedule({
  String id = 'test-feed-schedule-1',
  String horseId = 'test-horse-1',
  FeedType feedType = FeedType.hay,
  double quantityKg = 5.0,
  String frequency = 'Өдөр бүр',
  DateTime? startDate,
  DateTime? endDate,
  String notes = 'Test feed schedule',
}) {
  return FeedSchedule(
    id: id,
    horseId: horseId,
    feedType: feedType,
    quantityKg: quantityKg,
    frequency: frequency,
    startDate: startDate ?? DateTime(2026, 6, 1),
    endDate: endDate,
    notes: notes,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}

/// Creates a [FeedLog] instance with default values for testing.
///
/// Override any field by passing it as a named parameter.
FeedLog createMockFeedLog({
  String id = 'test-feed-log-1',
  String scheduleId = 'test-feed-schedule-1',
  String horseId = 'test-horse-1',
  DateTime? date,
  double amountGiven = 5.0,
  bool skipped = false,
  String notes = 'Test feed log',
}) {
  return FeedLog(
    id: id,
    scheduleId: scheduleId,
    horseId: horseId,
    date: date ?? DateTime(2026, 6, 1),
    amountGiven: amountGiven,
    skipped: skipped,
    notes: notes,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
}
