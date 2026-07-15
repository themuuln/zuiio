import 'package:isar/isar.dart';

import '../../../core/storage/isar_database.dart';
import '../../races/data/isar_schemas/isar_race.dart';
import '../../races/data/isar_schemas/isar_race_entry.dart';
import '../../services/data/isar_schemas/isar_service_booking.dart';
import '../../services/data/isar_schemas/isar_service_provider.dart';
import '../../services/data/isar_schemas/isar_vet_profile.dart';
import 'isar_schemas/isar_breeding_record.dart';
import 'isar_schemas/isar_co_ownership_record.dart';
import 'isar_schemas/isar_feed_log.dart';
import 'isar_schemas/isar_feed_schedule.dart';
import 'isar_schemas/isar_digital_certificate.dart';
import 'isar_schemas/isar_document_record.dart';
import 'isar_schemas/isar_event.dart';
import 'isar_schemas/isar_event_registration.dart';
import 'isar_schemas/isar_geofence_alert.dart';
import 'isar_schemas/isar_health_log.dart';
import 'isar_schemas/isar_horse.dart';
import 'isar_schemas/isar_horse_location.dart';
import 'isar_schemas/isar_lineage_root.dart';
import 'isar_schemas/isar_lineage_snapshot.dart';
import 'isar_schemas/isar_lineage_tree_node.dart';
import 'isar_schemas/isar_listing_report.dart';
import 'isar_schemas/isar_lost_horse_report.dart';
import 'isar_schemas/isar_market_conversation.dart';
import 'isar_schemas/isar_market_inquiry.dart';
import 'isar_schemas/isar_market_listing.dart';
import 'isar_schemas/isar_market_message.dart';
import 'isar_schemas/isar_market_offer.dart';
import 'isar_schemas/isar_payment_request.dart';
import 'isar_schemas/isar_profile_settings.dart';
import 'isar_schemas/isar_saved_search.dart';
import 'isar_schemas/isar_search_area.dart';
import 'isar_schemas/isar_seller_profile.dart';
import 'isar_schemas/isar_seller_rating.dart';
import 'isar_schemas/isar_seller_verification.dart';
import 'isar_schemas/isar_sync_queue_item.dart';
import 'isar_schemas/isar_training_log.dart';
import 'isar_schemas/isar_performance_record.dart';
import 'isar_schemas/isar_trial_booking.dart';
import 'isar_schemas/isar_trial_slot.dart';
import 'isar_schemas/isar_team.dart';
import 'isar_schemas/isar_team_invitation.dart';
import 'isar_schemas/isar_team_member.dart';

/// Typed accessor layer over Isar collections.
///
/// Replaces [LocalJsonStore] for structured data.
/// Obtain an instance via [IsarStorage.instance] (reads the already-opened DB).
class IsarStorage {
  const IsarStorage._();

  static Isar get _db => IsarDatabase.instance;

  // ── Collections ──────────────────────────────────────────────────

  IsarCollection<IsarHorse> get horses => _db.isarHorses;
  IsarCollection<IsarHealthLog> get healthLogs => _db.isarHealthLogs;
  IsarCollection<IsarEvent> get events => _db.isarEvents;
  IsarCollection<IsarEventRegistration> get eventRegistrations =>
      _db.isarEventRegistrations;
  IsarCollection<IsarServiceBooking> get serviceBookings =>
      _db.isarServiceBookings;
  IsarCollection<IsarServiceProvider> get serviceProviders =>
      _db.isarServiceProviders;
  IsarCollection<IsarVetProfile> get vetProfiles => _db.isarVetProfiles;
  IsarCollection<IsarRace> get races => _db.isarRaces;
  IsarCollection<IsarRaceEntry> get raceEntries => _db.isarRaceEntrys;
  IsarCollection<IsarMarketConversation> get marketConversations =>
      _db.isarMarketConversations;
  IsarCollection<IsarMarketListing> get marketListings =>
      _db.isarMarketListings;
  IsarCollection<IsarMarketMessage> get marketMessages =>
      _db.isarMarketMessages;
  IsarCollection<IsarMarketOffer> get marketOffers => _db.isarMarketOffers;
  IsarCollection<IsarSellerProfile> get sellerProfiles =>
      _db.isarSellerProfiles;
  IsarCollection<IsarSellerRating> get sellerRatings => _db.isarSellerRatings;
  IsarCollection<IsarMarketInquiry> get marketInquiries =>
      _db.isarMarketInquirys;
  IsarCollection<IsarListingReport> get listingReports =>
      _db.isarListingReports;
  IsarCollection<IsarProfileSettings> get profileSettings =>
      _db.isarProfileSettings;
  IsarCollection<IsarBreedingRecord> get breedingRecords =>
      _db.isarBreedingRecords;
  IsarCollection<IsarCoOwnershipRecord> get coOwnershipRecords =>
      _db.isarCoOwnershipRecords;
  IsarCollection<IsarDigitalCertificate> get digitalCertificates =>
      _db.isarDigitalCertificates;
  IsarCollection<IsarLineageRoot> get lineageRoots => _db.isarLineageRoots;
  IsarCollection<IsarLineageTreeNode> get lineageTreeNodes =>
      _db.isarLineageTreeNodes;
  IsarCollection<IsarLineageSnapshot> get lineageSnapshots =>
      _db.isarLineageSnapshots;
  IsarCollection<IsarSyncQueueItem> get syncQueueItems =>
      _db.isarSyncQueueItems;
  IsarCollection<IsarDocumentRecord> get documentRecords =>
      _db.isarDocumentRecords;
  IsarCollection<IsarPaymentRequest> get paymentRequests =>
      _db.isarPaymentRequests;
  IsarCollection<IsarHorseLocation> get horseLocations =>
      _db.isarHorseLocations;
  IsarCollection<IsarLostHorseReport> get lostHorseReports =>
      _db.isarLostHorseReports;
  IsarCollection<IsarSearchArea> get searchAreas => _db.isarSearchAreas;
  IsarCollection<IsarGeofenceAlert> get geofenceAlerts =>
      _db.isarGeofenceAlerts;
  IsarCollection<IsarSellerPhoneVerification> get sellerPhoneVerifications =>
      _db.isarSellerPhoneVerifications;
  IsarCollection<IsarEMongoliaVerification> get eMongoliaVerifications =>
      _db.isarEMongoliaVerifications;
  IsarCollection<IsarSavedSearch> get savedSearches => _db.isarSavedSearchs;
  IsarCollection<IsarTrialSlot> get trialSlots => _db.isarTrialSlots;
  IsarCollection<IsarTrialBooking> get trialBookings => _db.isarTrialBookings;
  IsarCollection<IsarFeedSchedule> get feedSchedules => _db.isarFeedSchedules;
  IsarCollection<IsarFeedLog> get feedLogs => _db.isarFeedLogs;
  IsarCollection<IsarTrainingLog> get trainingLogs => _db.isarTrainingLogs;
  IsarCollection<IsarPerformanceRecord> get performanceRecords =>
      _db.isarPerformanceRecords;
  IsarCollection<IsarTeam> get teams => _db.isarTeams;
  IsarCollection<IsarTeamMember> get teamMembers => _db.isarTeamMembers;
  IsarCollection<IsarTeamInvitation> get teamInvitations =>
      _db.isarTeamInvitations;

  // ── Convenience singleton ────────────────────────────────────────

  static const instance = IsarStorage._();
}
