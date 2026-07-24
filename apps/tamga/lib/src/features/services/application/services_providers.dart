/// Үйлчилгээний repository provider-ууд.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/local_service_booking_repository.dart';
import '../data/local_service_provider_repository.dart';
import '../data/local_vet_profile_repository.dart';
import '../data/services_repository.dart';

// ── Repository providers ─────────────────────────────────────────

/// Service Booking repository provider (local).
final localServiceBookingRepositoryProvider =
    Provider<LocalServiceBookingRepository>((ref) {
      return LocalServiceBookingRepository(
        storage: IsarStorage.instance,
        syncQueue: SyncQueue(),
      );
    });

/// Service Booking repository provider (abstract interface).
final serviceBookingRepositoryProvider =
    FutureProvider<ServiceBookingRepository>((ref) async {
      return ref.read(localServiceBookingRepositoryProvider);
    });

/// Vet Profile repository provider (local).
final localVetProfileRepositoryProvider = Provider<LocalVetProfileRepository>(
  (ref) => LocalVetProfileRepository(storage: IsarStorage.instance),
);

/// Vet Profile repository provider (abstract interface).
final vetProfileRepositoryProvider =
    FutureProvider<VetProfileRepository>((ref) async {
      return ref.read(localVetProfileRepositoryProvider);
    });

/// Service Provider repository provider (local).
final localServiceProviderRepositoryProvider =
    Provider<LocalServiceProviderRepository>(
      (ref) =>
          LocalServiceProviderRepository(storage: IsarStorage.instance),
    );

/// Service Provider repository provider (abstract interface).
final serviceProviderRepositoryProvider =
    FutureProvider<ServiceProviderRepository>((ref) async {
      return ref.read(localServiceProviderRepositoryProvider);
    });
