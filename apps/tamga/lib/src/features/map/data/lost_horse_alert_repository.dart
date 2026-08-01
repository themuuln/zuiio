import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/lost_horse_alert_subscription.dart';

/// Persistence contract for opt-in lost-horse alert regions.
abstract interface class LostHorseAlertRepository {
  Future<Result<List<LostHorseAlertSubscription>>> getMine();

  Future<Result<LostHorseAlertSubscription>> save(
    LostHorseAlertSubscription subscription,
  );

  Future<Result<void>> revoke(String id);
}

/// Supabase-backed alert subscription repository.
class SupabaseLostHorseAlertRepository implements LostHorseAlertRepository {
  SupabaseLostHorseAlertRepository(this._client);

  final dynamic _client;

  @override
  Future<Result<List<LostHorseAlertSubscription>>> getMine() async {
    try {
      final response = await _client
          .from('lost_horse_alert_subscriptions')
          .select()
          .isFilter('revoked_at', null)
          .order('created_at', ascending: false);
      return Result.ok(
        (response as List)
            .map(
              (row) => LostHorseAlertSubscription.fromJson(
                row as Map<String, dynamic>,
              ),
            )
            .toList(),
      );
    } catch (error) {
      return Result.fail(
        AppException.withDetail(
          'ALERT_SUBSCRIPTIONS_FETCH_FAILED',
          'Мэдэгдлийн бүсүүдийг авч чадсангүй',
          details: {'error': error.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<LostHorseAlertSubscription>> save(
    LostHorseAlertSubscription subscription,
  ) async {
    try {
      final activeRows = await _client
          .from('lost_horse_alert_subscriptions')
          .select('id, location_sum, location_bag')
          .eq('user_id', subscription.userId)
          .eq('location_aimag', subscription.locationAimag)
          .isFilter('revoked_at', null);
      Map<String, dynamic>? existing;
      for (final row in activeRows as List) {
        final candidate = row as Map<String, dynamic>;
        if (candidate['location_sum'] == subscription.locationSum &&
            candidate['location_bag'] == subscription.locationBag) {
          existing = candidate;
          break;
        }
      }

      final query = existing == null
          ? _client
                .from('lost_horse_alert_subscriptions')
                .insert(subscription.toJson())
          : _client
                .from('lost_horse_alert_subscriptions')
                .update(subscription.toJson())
                .eq('id', existing['id']);
      final row = await query.select().single();
      return Result.ok(
        LostHorseAlertSubscription.fromJson(row as Map<String, dynamic>),
      );
    } catch (error) {
      return Result.fail(
        AppException.withDetail(
          'ALERT_SUBSCRIPTION_SAVE_FAILED',
          'Мэдэгдлийн бүсийг хадгалж чадсангүй',
          details: {'error': error.toString()},
        ),
      );
    }
  }

  @override
  Future<Result<void>> revoke(String id) async {
    try {
      await _client
          .from('lost_horse_alert_subscriptions')
          .update({'revoked_at': DateTime.now().toIso8601String()})
          .eq('id', id);
      return const Result.ok(null);
    } catch (error) {
      return Result.fail(
        AppException.withDetail(
          'ALERT_SUBSCRIPTION_REVOKE_FAILED',
          'Мэдэгдлийн бүсийг устгаж чадсангүй',
          details: {'error': error.toString()},
        ),
      );
    }
  }
}
