import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../data/lost_horse_alert_repository.dart';
import '../domain/lost_horse_alert_subscription.dart';

/// Supabase repository for regional lost-horse alert subscriptions.
final lostHorseAlertRepositoryProvider = Provider<LostHorseAlertRepository>((
  ref,
) {
  return SupabaseLostHorseAlertRepository(Supabase.instance.client);
});

/// Active alert regions for the current user.
final lostHorseAlertSubscriptionsProvider =
    FutureProvider<List<LostHorseAlertSubscription>>((ref) async {
      final userId = currentSupabaseUserId();
      if (userId == null) return const [];

      final result = await ref.read(lostHorseAlertRepositoryProvider).getMine();
      return result.getOrThrow();
    });

/// Saves one alert region, then refreshes the user's active regions.
final saveLostHorseAlertSubscriptionProvider =
    FutureProvider.family<
      LostHorseAlertSubscription,
      LostHorseAlertSubscription
    >((ref, subscription) async {
      final result = await ref
          .read(lostHorseAlertRepositoryProvider)
          .save(subscription);
      final saved = result.getOrThrow();
      ref.invalidate(lostHorseAlertSubscriptionsProvider);
      return saved;
    });

/// Revokes one alert region.
final revokeLostHorseAlertSubscriptionProvider =
    FutureProvider.family<void, String>((ref, id) async {
      final result = await ref
          .read(lostHorseAlertRepositoryProvider)
          .revoke(id);
      if (result.isFailure) throw result.error;
      ref.invalidate(lostHorseAlertSubscriptionsProvider);
    });
