import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';

import '../../features/races/data/isar_schemas/isar_race.dart';
import '../../features/races/data/isar_schemas/isar_race_entry.dart';
import '../../features/services/data/isar_schemas/isar_service_booking.dart';
import '../../features/services/data/isar_schemas/isar_service_provider.dart';
import '../../features/services/data/isar_schemas/isar_vet_profile.dart';
import '../../features/shared/data/isar_schemas/isar_breeding_record.dart';
import '../../features/shared/data/isar_schemas/isar_co_ownership_record.dart';
import '../../features/shared/data/isar_schemas/isar_digital_certificate.dart';
import '../../features/shared/data/isar_schemas/isar_document_record.dart';
import '../../features/shared/data/isar_schemas/isar_event.dart';
import '../../features/shared/data/isar_schemas/isar_event_registration.dart';
import '../../features/shared/data/isar_schemas/isar_geofence_alert.dart';
import '../../features/shared/data/isar_schemas/isar_health_log.dart';
import '../../features/shared/data/isar_schemas/isar_horse.dart';
import '../../features/shared/data/isar_schemas/isar_horse_location.dart';
import '../../features/shared/data/isar_schemas/isar_lineage_root.dart';
import '../../features/shared/data/isar_schemas/isar_lineage_snapshot.dart';
import '../../features/shared/data/isar_schemas/isar_lineage_tree_node.dart';
import '../../features/shared/data/isar_schemas/isar_listing_report.dart';
import '../../features/shared/data/isar_schemas/isar_lost_horse_report.dart';
import '../../features/shared/data/isar_schemas/isar_lost_horse_media_draft.dart';
import '../../features/shared/data/isar_schemas/isar_market_conversation.dart';
import '../../features/shared/data/isar_schemas/isar_market_inquiry.dart';
import '../../features/shared/data/isar_schemas/isar_market_listing.dart';
import '../../features/shared/data/isar_schemas/isar_market_message.dart';
import '../../features/shared/data/isar_schemas/isar_market_offer.dart';
import '../../features/shared/data/isar_schemas/isar_payment_request.dart';
import '../../features/shared/data/isar_schemas/isar_profile_settings.dart';
import '../../features/shared/data/isar_schemas/isar_saved_search.dart';
import '../../features/shared/data/isar_schemas/isar_search_area.dart';
import '../../features/shared/data/isar_schemas/isar_seller_profile.dart';
import '../../features/shared/data/isar_schemas/isar_seller_rating.dart';
import '../../features/shared/data/isar_schemas/isar_seller_verification.dart';
import '../../features/shared/data/isar_schemas/isar_sync_queue_item.dart';
import '../../features/shared/data/isar_schemas/isar_feed_log.dart';
import '../../features/shared/data/isar_schemas/isar_feed_schedule.dart';
import '../../features/shared/data/isar_schemas/isar_training_log.dart';
import '../../features/shared/data/isar_schemas/isar_performance_record.dart';
import '../../features/shared/data/isar_schemas/isar_trial_booking.dart';
import '../../features/shared/data/isar_schemas/isar_trial_slot.dart';
import '../../features/shared/data/isar_schemas/isar_team.dart';
import '../../features/shared/data/isar_schemas/isar_team_invitation.dart';
import '../../features/shared/data/isar_schemas/isar_team_member.dart';
import '../../features/shared/data/isar_schemas/isar_event_record.dart';
import '../../features/shared/data/isar_schemas/isar_sighting_report.dart';

/// Singleton Isar database.
///
/// Initialize once in [main] before runApp, then use [instance] everywhere.
class IsarDatabase {
  IsarDatabase._();

  static Isar? _instance;

  static final List<CollectionSchema<dynamic>> _schemas = [
    IsarHorseSchema,
    IsarHealthLogSchema,
    IsarEventSchema,
    IsarEventRegistrationSchema,
    IsarRaceSchema,
    IsarRaceEntrySchema,
    IsarServiceBookingSchema,
    IsarServiceProviderSchema,
    IsarVetProfileSchema,
    IsarMarketConversationSchema,
    IsarMarketListingSchema,
    IsarMarketMessageSchema,
    IsarMarketOfferSchema,
    IsarSellerProfileSchema,
    IsarSellerRatingSchema,
    IsarMarketInquirySchema,
    IsarListingReportSchema,
    IsarProfileSettingsSchema,
    IsarBreedingRecordSchema,
    IsarCoOwnershipRecordSchema,
    IsarDigitalCertificateSchema,
    IsarLineageRootSchema,
    IsarLineageTreeNodeSchema,
    IsarLineageSnapshotSchema,
    IsarPaymentRequestSchema,
    IsarSyncQueueItemSchema,
    IsarDocumentRecordSchema,
    IsarHorseLocationSchema,
    IsarLostHorseReportSchema,
    IsarLostHorseMediaDraftSchema,
    IsarSearchAreaSchema,
    IsarGeofenceAlertSchema,
    IsarSellerPhoneVerificationSchema,
    IsarEMongoliaVerificationSchema,
    IsarSavedSearchSchema,
    IsarTrialSlotSchema,
    IsarTrialBookingSchema,
    IsarFeedScheduleSchema,
    IsarFeedLogSchema,
    IsarTrainingLogSchema,
    IsarPerformanceRecordSchema,
    IsarEventRecordSchema,
    IsarSightingReportSchema,
    IsarTeamSchema,
    IsarTeamMemberSchema,
    IsarTeamInvitationSchema,
  ];

  /// Open the database (call once at app startup).
  static Future<Isar> initialize() async {
    if (_instance != null) return _instance!;
    final dir = await getApplicationDocumentsDirectory();
    _instance = await Isar.open(_schemas, directory: dir.path);
    return _instance!;
  }

  /// Return the already-opened database instance.
  ///
  /// Throws if [initialize] has not been called.
  static Isar get instance {
    final db = _instance;
    if (db == null) {
      throw StateError(
        'IsarDatabase has not been initialized. '
        'Call IsarDatabase.initialize() in main() first.',
      );
    }
    return db;
  }

  /// Close the database (for tests or hot-restart).
  static Future<void> close() async {
    await _instance?.close();
    _instance = null;
  }
}
