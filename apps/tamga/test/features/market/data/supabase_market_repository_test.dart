import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/market/data/supabase_market_repository.dart';
import 'package:tamga/src/features/market/domain/market_listing.dart';
import 'package:tamga/src/features/market/domain/market_offer.dart';
import 'package:tamga/src/features/market/domain/saved_search.dart';
import 'package:tamga/src/features/market/domain/seller_rating.dart';
import 'package:tamga/src/features/market/domain/seller_verification.dart';
import 'package:tamga/src/features/market/domain/trial_booking.dart';
import 'package:tamga/src/features/market/domain/trial_slot.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

/// Repository variant whose `fetchEMongoliaVerification` always fails, so
/// `fetchSellerVerificationSummary` can be tested against an E-Mongolia
/// dependency failure without faking the method under test.
class FailingEMongoliaRepository extends SupabaseMarketRepository {
  FailingEMongoliaRepository({required SupabaseClient client})
    : super(client: client);

  @override
  Future<Result<EMongoliaVerification?>> fetchEMongoliaVerification(
    String sellerId,
  ) async {
    return const Result.fail(
      AppException(message: 'E-Mongolia API down', code: 'E_MONGOLIA_ERROR'),
    );
  }
}

/// A fake [SupabaseQueryBuilder] that returns itself for every chained method
/// and completes with [_result] when awaited.
///
/// The entry points (select/insert/update/upsert/delete) are overridden to
/// return a filter-builder fake whose runtime type matches the SDK's declared
/// return type; a bare `noSuchMethod => this` fails the VM's typed forwarder
/// casts for these methods.
class FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  FakeQueryBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(dynamic) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then(onValue, onError: onError);
  }

  @override
  PostgrestFilterBuilder<PostgrestList> select([String columns = '*']) =>
      FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> insert(
    Object values, {
    bool defaultToNull = true,
  }) => FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> update(Map values) =>
      FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) => FakeFilterBuilder(_result);

  @override
  PostgrestFilterBuilder<PostgrestList> delete() => FakeFilterBuilder(_result);
}

/// List-flavored filter builder fake. Chain methods that return a
/// list-flavored builder (eq, or, order, range, select, ...) are satisfied by
/// `this` via noSuchMethod casts; single/maybeSingle switch to the map flavor
/// and count returns a response builder.
class FakeFilterBuilder extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  FakeFilterBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return null as R;
      return onValue(value as PostgrestList);
    }, onError: onError);
  }

  @override
  PostgrestFilterBuilder<Map<String, dynamic>> single() =>
      FakeMapFilter(_result);

  @override
  PostgrestFilterBuilder<Map<String, dynamic>?> maybeSingle() =>
      FakeNullableMapFilter(_result);

  @override
  ResponsePostgrestBuilder<
    PostgrestResponse<PostgrestList>,
    PostgrestList,
    PostgrestList
  >
  count([CountOption count = CountOption.exact]) =>
      FakeResponseBuilder(_result);
}

/// Map-flavored filter builder fake for single()/maybeSingle() chains.
class FakeMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>> {
  FakeMapFilter(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic>) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then((value) {
      if (value == null) return null as R;
      return onValue(value as Map<String, dynamic>);
    }, onError: onError);
  }
}

/// Nullable map-flavored filter builder fake for maybeSingle() chains. The
/// VM instantiates the await continuation with the receiver's Future type
/// argument, so a non-nullable-flavored fake can never deliver a null result.
class FakeNullableMapFilter extends Fake
    implements PostgrestFilterBuilder<Map<String, dynamic>?> {
  FakeNullableMapFilter(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(Map<String, dynamic>?) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then(
      (value) => onValue(value as Map<String, dynamic>?),
      onError: onError,
    );
  }
}

/// Response builder fake for count() chains (paginated listings).
class FakeResponseBuilder extends Fake
    implements
        ResponsePostgrestBuilder<
          PostgrestResponse<PostgrestList>,
          PostgrestList,
          PostgrestList
        > {
  FakeResponseBuilder(this._result);

  final dynamic _result;

  @override
  dynamic noSuchMethod(Invocation invocation) => this;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestResponse<PostgrestList>) onValue, {
    Function? onError,
  }) {
    return Future<dynamic>.value(_result).then(
      (value) => onValue(value as PostgrestResponse<PostgrestList>),
      onError: onError,
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> sampleListingRow({
  String id = 'm-1',
  String horseId = 'horse-1',
  String sellerId = 'seller-1',
  String title = 'Хан Хүлэг',
  String description = 'Шилдэг азарга',
  int priceAmount = 5000000,
  String currency = 'MNT',
  String saleType = 'sale',
  String status = 'published',
  String locationLabel = 'Улаанбаатар',
  List<String> disciplineTags = const ['Уралдаан'],
  List<String> documentTags = const ['Pedigree'],
  List<String> mediaUrls = const [],
  bool isSellerVerified = true,
  String createdAt = '2026-01-01T00:00:00.000Z',
  String updatedAt = '2026-01-01T00:00:00.000Z',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'seller_id': sellerId,
    'title': title,
    'description': description,
    'price_amount': priceAmount,
    'currency': currency,
    'sale_type': saleType,
    'status': status,
    'location_label': locationLabel,
    'discipline_tags': disciplineTags,
    'document_tags': documentTags,
    'media_urls': mediaUrls,
    'is_seller_verified': isSellerVerified,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

Map<String, dynamic> sampleRatingRow({
  String id = 'r-1',
  String listingId = 'm-1',
  String sellerId = 'seller-1',
  String buyerId = 'buyer-1',
  int rating = 5,
  String review = 'Сайн худалдагч',
  String createdAt = '2026-06-01T00:00:00.000Z',
  String? sellerResponse,
  String? responseAt,
}) {
  return {
    'id': id,
    'listing_id': listingId,
    'seller_id': sellerId,
    'buyer_id': buyerId,
    'rating': rating,
    'review': review,
    'created_at': createdAt,
    'seller_response': sellerResponse,
    'response_at': responseAt,
  };
}

Map<String, dynamic> sampleSavedSearchRow({
  String id = 'ss-1',
  String userId = 'user-1',
  Map<String, dynamic> filters = const {'saleType': 'sale'},
  String name = 'Азарга',
  String createdAt = '2026-01-01T00:00:00.000Z',
  String? lastNotifiedAt,
}) {
  return {
    'id': id,
    'user_id': userId,
    'filters': filters,
    'name': name,
    'created_at': createdAt,
    'last_notified_at': lastNotifiedAt,
  };
}

Map<String, dynamic> sampleOfferRow({
  String id = 'of-1',
  String listingId = 'm-1',
  String buyerId = 'buyer-1',
  String sellerId = 'seller-1',
  int amount = 4500000,
  String status = 'pending',
  int? counterAmount,
  String? message,
  String createdAt = '2026-05-01T00:00:00.000Z',
  String? respondedAt,
}) {
  return {
    'id': id,
    'listing_id': listingId,
    'buyer_id': buyerId,
    'seller_id': sellerId,
    'amount': amount,
    'status': status,
    'counter_amount': counterAmount,
    'message': message,
    'created_at': createdAt,
    'responded_at': respondedAt,
  };
}

Map<String, dynamic> sampleTrialSlotRow({
  String id = 'slot-1',
  String listingId = 'm-1',
  String sellerId = 'seller-1',
  String date = '2026-08-01T00:00:00.000Z',
  String startTime = '10:00',
  String endTime = '11:00',
  String status = 'available',
  String? buyerId,
  String? notes,
  String createdAt = '2026-01-01T00:00:00.000Z',
}) {
  return {
    'id': id,
    'listing_id': listingId,
    'seller_id': sellerId,
    'date': date,
    'start_time': startTime,
    'end_time': endTime,
    'status': status,
    'buyer_id': buyerId,
    'notes': notes,
    'created_at': createdAt,
  };
}

Map<String, dynamic> sampleTrialBookingRow({
  String id = 'tb-1',
  String listingId = 'm-1',
  String slotId = 'slot-1',
  String buyerId = 'buyer-1',
  String sellerId = 'seller-1',
  String status = 'requested',
  String? notes,
  String requestedAt = '2026-07-01T00:00:00.000Z',
  String? respondedAt,
}) {
  return {
    'id': id,
    'listing_id': listingId,
    'slot_id': slotId,
    'buyer_id': buyerId,
    'seller_id': sellerId,
    'status': status,
    'notes': notes,
    'requested_at': requestedAt,
    'responded_at': respondedAt,
  };
}

MarketListing sampleListing() {
  return MarketListing(
    id: 'm-1',
    horseId: 'horse-1',
    sellerId: 'seller-1',
    title: 'Хан Хүлэг',
    description: 'Шилдэг азарга',
    priceAmount: 5000000,
    currency: 'MNT',
    saleType: MarketSaleType.sale,
    status: MarketListingStatus.active,
    locationLabel: 'Улаанбаатар',
    disciplineTags: const ['Уралдаан'],
    documentTags: const ['Pedigree'],
    isSellerVerified: true,
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseMarketRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseMarketRepository(client: mockClient);
  });

  // Stub every .from() call to resolve with [result].
  void stubFrom(dynamic result) {
    when(
      () => mockClient.from(any()),
    ).thenAnswer((_) => FakeQueryBuilder(result));
  }

  // Stub .from() calls to resolve with each queued result, in order.
  void stubQueue(List<dynamic> results) {
    when(
      () => mockClient.from(any()),
    ).thenAnswer((_) => FakeQueryBuilder(results.removeAt(0)));
  }

  group('SupabaseMarketRepository', () {
    group('listPublishedPaginated', () {
      test('returns empty page when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.listPublishedPaginated(page: 0, limit: 20);
        expect(result.isSuccess, isTrue);
        expect(result.value.items, isEmpty);
        expect(result.value.totalCount, 0);
      });

      test('maps rows and count into a PaginatedResult on success', () async {
        stubQueue([
          [sampleListingRow(id: 'm-1'), sampleListingRow(id: 'm-2')],
          PostgrestResponse(data: const <Map<String, dynamic>>[], count: 7),
        ]);

        final result = await repository.listPublishedPaginated(
          page: 0,
          limit: 20,
        );

        expect(result.isSuccess, isTrue);
        final page = result.value;
        expect(page.items, hasLength(2));
        expect(page.items.first.id, 'm-1');
        expect(page.items.first.title, 'Хан Хүлэг');
        expect(page.items.first.status, MarketListingStatus.active);
        expect(page.items.first.saleType, MarketSaleType.sale);
        expect(page.items.first.priceAmount, 5000000);
        expect(page.totalCount, 7);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Network error'));

        final result = await repository.listPublishedPaginated(
          page: 0,
          limit: 20,
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('listPublished', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.listPublished();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to MarketListing models on success', () async {
        stubFrom([
          sampleListingRow(id: 'm-1', title: 'Хан Хүлэг'),
          sampleListingRow(id: 'm-2', title: 'Морин хүрд'),
        ]);

        final result = await repository.listPublished();

        expect(result.isSuccess, isTrue);
        expect(result.value, hasLength(2));
        expect(result.value.first.id, 'm-1');
        expect(result.value.first.title, 'Хан Хүлэг');
        expect(result.value.first.sellerId, 'seller-1');
        expect(result.value.first.status, MarketListingStatus.active);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.listPublished();

        expect(result.isFailure, isTrue);
      });
    });

    group('listBySeller', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.listBySeller('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows on success', () async {
        stubFrom([sampleListingRow(id: 'm-1', sellerId: 'seller-1')]);

        final result = await repository.listBySeller('seller-1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.sellerId, 'seller-1');
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.listBySeller('seller-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('create', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.create(sampleListing());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('upserts and returns the listing on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.create(sampleListing());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'm-1');
        verify(() => mockClient.from('market_listings')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.create(sampleListing());

        expect(result.isFailure, isTrue);
      });
    });

    group('update', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.update(sampleListing());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('upserts and returns the listing on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.update(sampleListing());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'm-1');
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.update(sampleListing());

        expect(result.isFailure, isTrue);
      });
    });

    group('delete', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.delete('m-1');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('deletes the listing on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.delete('m-1');

        expect(result.isSuccess, isTrue);
        verify(() => mockClient.from('market_listings')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.delete('m-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('boostListing', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.boostListing(
          listingId: 'm-1',
          level: BoostLevel.premium,
          expiresAt: DateTime(2026, 8, 1),
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('updates boost fields on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.boostListing(
          listingId: 'm-1',
          level: BoostLevel.standard,
          expiresAt: DateTime(2026, 8, 1),
        );

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.boostListing(
          listingId: 'm-1',
          level: BoostLevel.premium,
          expiresAt: DateTime(2026, 8, 1),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('setVipLevel', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.setVipLevel(
          listingId: 'm-1',
          level: VipLevel.premium,
          expiresAt: DateTime(2026, 8, 1),
        );
        expect(result.isFailure, isTrue);
      });

      test('updates vip fields on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.setVipLevel(
          listingId: 'm-1',
          level: VipLevel.standard,
          expiresAt: DateTime(2026, 8, 1),
        );

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.setVipLevel(
          listingId: 'm-1',
          level: VipLevel.premium,
          expiresAt: DateTime(2026, 8, 1),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('setSellerBadge', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.setSellerBadge(
          listingId: 'm-1',
          badge: SellerBadgeType.shop,
          expiresAt: DateTime(2026, 8, 1),
        );
        expect(result.isFailure, isTrue);
      });

      test('updates badge fields on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.setSellerBadge(
          listingId: 'm-1',
          badge: SellerBadgeType.shop,
          expiresAt: DateTime(2026, 8, 1),
        );

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.setSellerBadge(
          listingId: 'm-1',
          badge: SellerBadgeType.shop,
          expiresAt: DateTime(2026, 8, 1),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('submitSellerRating', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.submitSellerRating(
          listingId: 'm-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          rating: 5,
          review: 'Сайн',
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('inserts and returns the rating on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.submitSellerRating(
          listingId: 'm-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          rating: 5,
          review: 'Сайн худалдагч',
        );

        expect(result.isSuccess, isTrue);
        final rating = result.value;
        expect(rating.listingId, 'm-1');
        expect(rating.sellerId, 'seller-1');
        expect(rating.buyerId, 'buyer-1');
        expect(rating.rating, 5);
        expect(rating.review, 'Сайн худалдагч');
      });

      test('clamps out-of-range ratings into 1-5', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final high = await repository.submitSellerRating(
          listingId: 'm-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          rating: 9,
          review: '',
        );
        expect(high.value.rating, 5);

        final low = await repository.submitSellerRating(
          listingId: 'm-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          rating: -3,
          review: '',
        );
        expect(low.value.rating, 1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Insert failed'));

        final result = await repository.submitSellerRating(
          listingId: 'm-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          rating: 5,
          review: '',
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchSellerRatings', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchSellerRatings('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to SellerRating models on success', () async {
        stubFrom([
          sampleRatingRow(
            id: 'r-1',
            rating: 5,
            review: 'Сайн',
            sellerResponse: 'Баярлалаа',
            responseAt: '2026-06-02T00:00:00.000Z',
          ),
          sampleRatingRow(
            id: 'r-2',
            rating: 4,
            review: 'За',
            sellerResponse: null,
          ),
        ]);

        final result = await repository.fetchSellerRatings('seller-1');

        expect(result.isSuccess, isTrue);
        final List<SellerRating> ratings = result.value;
        expect(ratings, hasLength(2));

        final first = ratings.first;
        expect(first.id, 'r-1');
        expect(first.listingId, 'm-1');
        expect(first.sellerId, 'seller-1');
        expect(first.buyerId, 'buyer-1');
        expect(first.rating, 5);
        expect(first.review, 'Сайн');
        expect(first.sellerResponse, 'Баярлалаа');
        expect(first.responseAt, DateTime.parse('2026-06-02T00:00:00.000Z'));

        expect(ratings[1].rating, 4);
        expect(ratings[1].sellerResponse, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchSellerRatings('seller-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchSellerRatingSummary', () {
      test('returns empty summary when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchSellerRatingSummary('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value.averageRating, 0.0);
        expect(result.value.totalCount, 0);
      });

      test('aggregates rows into a summary on success', () async {
        stubFrom([
          sampleRatingRow(id: 'r-1', rating: 5),
          sampleRatingRow(id: 'r-2', rating: 5),
          sampleRatingRow(id: 'r-3', rating: 2),
        ]);

        final result = await repository.fetchSellerRatingSummary('seller-1');

        expect(result.isSuccess, isTrue);
        final SellerRatingSummary summary = result.value;
        expect(summary.totalCount, 3);
        expect(summary.averageRating, closeTo(4.0, 0.001));
        expect(summary.distribution[5], 2);
        expect(summary.distribution[2], 1);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchSellerRatingSummary('seller-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('respondToReview', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.respondToReview(
          ratingId: 'r-1',
          response: 'Баярлалаа',
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('updates the seller response on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.respondToReview(
          ratingId: 'r-1',
          response: 'Баярлалаа',
        );

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.respondToReview(
          ratingId: 'r-1',
          response: 'Баярлалаа',
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('savePhoneVerification', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.savePhoneVerification(
          SellerPhoneVerification(
            id: 'pv-1',
            sellerId: 'seller-1',
            phone: '+97699112233',
            isVerified: true,
            verifiedAt: DateTime(2026, 6, 1),
          ),
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('upserts and returns the verification on success', () async {
        stubFrom(<Map<String, dynamic>>[]);
        final verification = SellerPhoneVerification(
          id: 'pv-1',
          sellerId: 'seller-1',
          phone: '+97699112233',
          isVerified: true,
        );

        final result = await repository.savePhoneVerification(verification);

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'pv-1');
        expect(result.value.phone, '+97699112233');
        expect(result.value.isVerified, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.savePhoneVerification(
          const SellerPhoneVerification(
            id: 'pv-1',
            sellerId: 'seller-1',
            phone: '+97699112233',
          ),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchPhoneVerification', () {
      test('returns null when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchPhoneVerification('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('maps the row on success', () async {
        stubFrom({
          'id': 'pv-1',
          'seller_id': 'seller-1',
          'phone': '+97699112233',
          'is_verified': true,
          'verified_at': '2026-06-01T00:00:00.000Z',
        });

        final result = await repository.fetchPhoneVerification('seller-1');

        expect(result.isSuccess, isTrue);
        final verification = result.value!;
        expect(verification.id, 'pv-1');
        expect(verification.sellerId, 'seller-1');
        expect(verification.phone, '+97699112233');
        expect(verification.isVerified, isTrue);
        expect(
          verification.verifiedAt,
          DateTime.parse('2026-06-01T00:00:00.000Z'),
        );
      });

      test('returns null when no row is found', () async {
        stubFrom(null);

        final result = await repository.fetchPhoneVerification('seller-1');

        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchPhoneVerification('seller-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('markSellerListingsVerified', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.markSellerListingsVerified('seller-1');
        expect(result.isFailure, isTrue);
      });

      test('updates listings on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.markSellerListingsVerified('seller-1');

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.markSellerListingsVerified('seller-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('markSellerListingsUnverified', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.markSellerListingsUnverified('seller-1');
        expect(result.isFailure, isTrue);
      });

      test('updates listings on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.markSellerListingsUnverified(
          'seller-1',
        );

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.markSellerListingsUnverified(
          'seller-1',
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('saveEMongoliaVerification', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.saveEMongoliaVerification(
          const EMongoliaVerification(id: 'em-1', sellerId: 'seller-1'),
        );
        expect(result.isFailure, isTrue);
      });

      test('upserts and returns the verification on success', () async {
        stubFrom(<Map<String, dynamic>>[]);
        final verification = EMongoliaVerification(
          id: 'em-1',
          sellerId: 'seller-1',
          eMongoliaId: 'EM123',
          fullName: 'Бат',
          isVerified: true,
        );

        final result = await repository.saveEMongoliaVerification(verification);

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'em-1');
        expect(result.value.eMongoliaId, 'EM123');
        expect(result.value.fullName, 'Бат');
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.saveEMongoliaVerification(
          const EMongoliaVerification(id: 'em-1', sellerId: 'seller-1'),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchEMongoliaVerification', () {
      test('returns null (stub) even with a configured client', () async {
        final result = await repository.fetchEMongoliaVerification('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });
    });

    group('fetchSellerVerificationSummary', () {
      test('returns unverified summary when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchSellerVerificationSummary('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value.phoneVerified, isFalse);
        expect(result.value.eMongoliaVerified, isFalse);
      });

      test('returns phone verification data on success', () async {
        stubFrom({
          'id': 'pv-1',
          'seller_id': 'seller-1',
          'phone': '+97699112233',
          'is_verified': true,
          'verified_at': null,
        });

        final result = await repository.fetchSellerVerificationSummary(
          'seller-1',
        );

        expect(result.isSuccess, isTrue);
        final summary = result.value;
        expect(summary.phoneVerified, isTrue);
        expect(summary.phone, '+97699112233');
      });

      test('returns Result.fail preserving the AppException when phone fetch '
          'fails, without throwing', () async {
        // Regression: fetchSellerVerificationSummary used getOrThrow(), so
        // a phone fetch failure threw the AppException out of the
        // Result-returning method instead of returning Result.fail.
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchSellerVerificationSummary(
          'seller-1',
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'UNKNOWN_ERROR');
        expect(result.error.message, 'Exception: DB error');
      });

      test('returns Result.fail preserving the AppException when E-Mongolia '
          'fetch fails, without throwing', () async {
        stubFrom({
          'id': 'pv-1',
          'seller_id': 'seller-1',
          'phone': '+97699112233',
          'is_verified': true,
          'verified_at': null,
        });

        final repo = FailingEMongoliaRepository(client: mockClient);
        final result = await repo.fetchSellerVerificationSummary('seller-1');

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'E_MONGOLIA_ERROR');
        expect(result.error.message, 'E-Mongolia API down');
      });
    });

    group('saveSavedSearch', () {
      test('returns the search when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final search = SavedSearch(
          id: 'ss-1',
          userId: 'user-1',
          filters: const {'saleType': 'sale'},
          name: 'Азарга',
          createdAt: DateTime(2026, 1, 1),
        );
        final result = await repo.saveSavedSearch(search);
        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'ss-1');
      });

      test('upserts and returns the search on success', () async {
        stubFrom(<Map<String, dynamic>>[]);
        final search = SavedSearch(
          id: 'ss-1',
          userId: 'user-1',
          filters: const {'saleType': 'sale'},
          name: 'Азарга',
          createdAt: DateTime(2026, 1, 1),
        );

        final result = await repository.saveSavedSearch(search);

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'ss-1');
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Upsert failed'));

        final result = await repository.saveSavedSearch(
          SavedSearch(
            id: 'ss-1',
            userId: 'user-1',
            filters: const {},
            name: 'Азарга',
            createdAt: DateTime(2026, 1, 1),
          ),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('deleteSavedSearch', () {
      test('returns null result when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.deleteSavedSearch('ss-1');
        expect(result.isSuccess, isTrue);
      });

      test('deletes the search on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.deleteSavedSearch('ss-1');

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.deleteSavedSearch('ss-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchSavedSearches', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchSavedSearches('user-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to SavedSearch models on success', () async {
        stubFrom([
          sampleSavedSearchRow(
            id: 'ss-1',
            userId: 'user-1',
            filters: const {'saleType': 'sale'},
            name: 'Азарга',
            lastNotifiedAt: '2026-07-01T00:00:00.000Z',
          ),
          sampleSavedSearchRow(
            id: 'ss-2',
            userId: 'user-1',
            name: 'Хязаалан',
            lastNotifiedAt: null,
          ),
        ]);

        final result = await repository.fetchSavedSearches('user-1');

        expect(result.isSuccess, isTrue);
        final searches = result.value;
        expect(searches, hasLength(2));

        final first = searches.first;
        expect(first.id, 'ss-1');
        expect(first.userId, 'user-1');
        expect(first.filters, {'saleType': 'sale'});
        expect(first.name, 'Азарга');
        expect(
          first.lastNotifiedAt,
          DateTime.parse('2026-07-01T00:00:00.000Z'),
        );

        expect(searches[1].name, 'Хязаалан');
        expect(searches[1].lastNotifiedAt, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchSavedSearches('user-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('updateSavedSearchName', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.updateSavedSearchName('ss-1', 'Шинэ нэр');
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONNECTED');
      });

      test('updates and returns the renamed search on success', () async {
        stubFrom(sampleSavedSearchRow(id: 'ss-1', name: 'Шинэ нэр'));

        final result = await repository.updateSavedSearchName(
          'ss-1',
          'Шинэ нэр',
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'ss-1');
        expect(result.value.name, 'Шинэ нэр');
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.updateSavedSearchName('ss-1', 'Нэр');

        expect(result.isFailure, isTrue);
      });
    });

    group('updateSavedSearchLastNotifiedAt', () {
      test('returns null result when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.updateSavedSearchLastNotifiedAt(
          'ss-1',
          DateTime(2026, 7, 1),
        );
        expect(result.isSuccess, isTrue);
      });

      test('updates last_notified_at on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.updateSavedSearchLastNotifiedAt(
          'ss-1',
          DateTime(2026, 7, 1),
        );

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.updateSavedSearchLastNotifiedAt(
          'ss-1',
          DateTime(2026, 7, 1),
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchAllSavedSearches', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchAllSavedSearches();
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows on success', () async {
        stubFrom([sampleSavedSearchRow(id: 'ss-1')]);

        final result = await repository.fetchAllSavedSearches();

        expect(result.isSuccess, isTrue);
        expect(result.value.single.id, 'ss-1');
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchAllSavedSearches();

        expect(result.isFailure, isTrue);
      });
    });

    group('createOffer', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.createOffer(_sampleOffer());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('inserts and returns the offer on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.createOffer(_sampleOffer());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'of-1');
        expect(result.value.listingId, 'm-1');
        expect(result.value.buyerId, 'buyer-1');
        expect(result.value.sellerId, 'seller-1');
        expect(result.value.amount, 4500000);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Insert failed'));

        final result = await repository.createOffer(_sampleOffer());

        expect(result.isFailure, isTrue);
      });
    });

    group('respondToOffer', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.respondToOffer(
          offerId: 'of-1',
          status: MarketOfferStatus.accepted,
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('maps the updated row on success', () async {
        stubFrom(
          sampleOfferRow(
            id: 'of-1',
            status: 'accepted',
            respondedAt: '2026-07-01T00:00:00.000Z',
          ),
        );

        final result = await repository.respondToOffer(
          offerId: 'of-1',
          status: MarketOfferStatus.accepted,
        );

        expect(result.isSuccess, isTrue);
        final offer = result.value;
        expect(offer.id, 'of-1');
        expect(offer.status, MarketOfferStatus.accepted);
        expect(offer.respondedAt, DateTime.parse('2026-07-01T00:00:00.000Z'));
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.respondToOffer(
          offerId: 'of-1',
          status: MarketOfferStatus.declined,
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchOffersForListing', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchOffersForListing('m-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to MarketOffer models on success', () async {
        stubFrom([
          sampleOfferRow(id: 'of-1', status: 'pending'),
          sampleOfferRow(
            id: 'of-2',
            status: 'countered',
            counterAmount: 4800000,
            message: 'Хариу санал',
          ),
        ]);

        final result = await repository.fetchOffersForListing('m-1');

        expect(result.isSuccess, isTrue);
        final offers = result.value;
        expect(offers, hasLength(2));

        expect(offers.first.id, 'of-1');
        expect(offers.first.status, MarketOfferStatus.pending);
        expect(offers.first.amount, 4500000);

        expect(offers[1].status, MarketOfferStatus.countered);
        expect(offers[1].counterAmount, 4800000);
        expect(offers[1].message, 'Хариу санал');
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchOffersForListing('m-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchOffersForUser', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchOffersForUser('user-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows on success', () async {
        stubFrom([sampleOfferRow(id: 'of-1')]);

        final result = await repository.fetchOffersForUser('user-1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.id, 'of-1');
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchOffersForUser('user-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('createTrialSlot', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.createTrialSlot(_sampleSlot());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('inserts and returns the slot on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.createTrialSlot(_sampleSlot());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'slot-1');
        expect(result.value.listingId, 'm-1');
        expect(result.value.status, TrialSlotStatus.available);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Insert failed'));

        final result = await repository.createTrialSlot(_sampleSlot());

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchTrialSlotsForListing', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchTrialSlotsForListing('m-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to TrialSlot models on success', () async {
        stubFrom([
          sampleTrialSlotRow(
            id: 'slot-1',
            startTime: '10:00',
            endTime: '11:00',
            status: 'booked',
            buyerId: 'buyer-1',
            notes: 'Үдээс өмнө',
          ),
          sampleTrialSlotRow(id: 'slot-2', status: 'available', buyerId: null),
        ]);

        final result = await repository.fetchTrialSlotsForListing('m-1');

        expect(result.isSuccess, isTrue);
        final slots = result.value;
        expect(slots, hasLength(2));

        final first = slots.first;
        expect(first.id, 'slot-1');
        expect(first.listingId, 'm-1');
        expect(first.sellerId, 'seller-1');
        expect(first.date, DateTime.parse('2026-08-01T00:00:00.000Z'));
        expect(first.startTime, '10:00');
        expect(first.endTime, '11:00');
        expect(first.status, TrialSlotStatus.booked);
        expect(first.buyerId, 'buyer-1');
        expect(first.notes, 'Үдээс өмнө');

        expect(slots[1].status, TrialSlotStatus.available);
        expect(slots[1].buyerId, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchTrialSlotsForListing('m-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('updateTrialSlot', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.updateTrialSlot(_sampleSlot());
        expect(result.isFailure, isTrue);
      });

      test('updates and returns the slot on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.updateTrialSlot(_sampleSlot());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'slot-1');
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Update failed'));

        final result = await repository.updateTrialSlot(_sampleSlot());

        expect(result.isFailure, isTrue);
      });
    });

    group('deleteTrialSlot', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.deleteTrialSlot('slot-1');
        expect(result.isFailure, isTrue);
      });

      test('deletes the slot on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.deleteTrialSlot('slot-1');

        expect(result.isSuccess, isTrue);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Delete failed'));

        final result = await repository.deleteTrialSlot('slot-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('createTrialBooking', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.createTrialBooking(_sampleBooking());
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('inserts and returns the booking on success', () async {
        stubFrom(<Map<String, dynamic>>[]);

        final result = await repository.createTrialBooking(_sampleBooking());

        expect(result.isSuccess, isTrue);
        expect(result.value.id, 'tb-1');
        expect(result.value.slotId, 'slot-1');
        expect(result.value.buyerId, 'buyer-1');
        expect(result.value.sellerId, 'seller-1');
        expect(result.value.status, TrialBookingStatus.requested);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Insert failed'));

        final result = await repository.createTrialBooking(_sampleBooking());

        expect(result.isFailure, isTrue);
      });
    });

    group('updateTrialBookingStatus', () {
      test('returns failure when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.updateTrialBookingStatus(
          bookingId: 'tb-1',
          status: TrialBookingStatus.confirmed,
        );
        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      });

      test('updates status and returns a minimal booking on success', () async {
        stubQueue([
          {'slot_id': 'slot-1'},
          <Map<String, dynamic>>[],
        ]);

        final result = await repository.updateTrialBookingStatus(
          bookingId: 'tb-1',
          status: TrialBookingStatus.confirmed,
        );

        expect(result.isSuccess, isTrue);
        final booking = result.value;
        expect(booking.id, 'tb-1');
        expect(booking.status, TrialBookingStatus.confirmed);
      });

      test('reverts the slot when the booking is cancelled', () async {
        stubQueue([
          {'slot_id': 'slot-1'},
          <Map<String, dynamic>>[],
          <Map<String, dynamic>>[],
        ]);

        final result = await repository.updateTrialBookingStatus(
          bookingId: 'tb-1',
          status: TrialBookingStatus.cancelled,
        );

        expect(result.isSuccess, isTrue);
        expect(result.value.status, TrialBookingStatus.cancelled);
        verify(() => mockClient.from('trial_bookings')).called(2);
        verify(() => mockClient.from('trial_slots')).called(1);
      });

      test('returns failure on query error', () async {
        when(
          () => mockClient.from(any()),
        ).thenThrow(Exception('Select failed'));

        final result = await repository.updateTrialBookingStatus(
          bookingId: 'tb-1',
          status: TrialBookingStatus.completed,
        );

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchTrialBookingsForListing', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchTrialBookingsForListing('m-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows to TrialBooking models on success', () async {
        stubFrom([
          sampleTrialBookingRow(
            id: 'tb-1',
            status: 'confirmed',
            respondedAt: '2026-07-02T00:00:00.000Z',
          ),
          sampleTrialBookingRow(
            id: 'tb-2',
            status: 'requested',
            respondedAt: null,
          ),
        ]);

        final result = await repository.fetchTrialBookingsForListing('m-1');

        expect(result.isSuccess, isTrue);
        final bookings = result.value;
        expect(bookings, hasLength(2));

        final first = bookings.first;
        expect(first.id, 'tb-1');
        expect(first.listingId, 'm-1');
        expect(first.slotId, 'slot-1');
        expect(first.buyerId, 'buyer-1');
        expect(first.sellerId, 'seller-1');
        expect(first.status, TrialBookingStatus.confirmed);
        expect(first.requestedAt, DateTime.parse('2026-07-01T00:00:00.000Z'));
        expect(first.respondedAt, DateTime.parse('2026-07-02T00:00:00.000Z'));

        expect(bookings[1].status, TrialBookingStatus.requested);
        expect(bookings[1].respondedAt, isNull);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchTrialBookingsForListing('m-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchTrialBookingsForBuyer', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchTrialBookingsForBuyer('buyer-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows on success', () async {
        stubFrom([sampleTrialBookingRow(id: 'tb-1')]);

        final result = await repository.fetchTrialBookingsForBuyer('buyer-1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.buyerId, 'buyer-1');
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchTrialBookingsForBuyer('buyer-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchTrialBookingsForSeller', () {
      test('returns empty list when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchTrialBookingsForSeller('seller-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isEmpty);
      });

      test('maps rows on success', () async {
        stubFrom([sampleTrialBookingRow(id: 'tb-1')]);

        final result = await repository.fetchTrialBookingsForSeller('seller-1');

        expect(result.isSuccess, isTrue);
        expect(result.value.single.sellerId, 'seller-1');
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchTrialBookingsForSeller('seller-1');

        expect(result.isFailure, isTrue);
      });
    });

    group('fetchTrialBookingById', () {
      test('returns null when Supabase client is null', () async {
        final repo = SupabaseMarketRepository(client: null);
        final result = await repo.fetchTrialBookingById('tb-1');
        expect(result.isSuccess, isTrue);
        expect(result.value, isNull);
      });

      test('maps the row on success', () async {
        stubFrom(sampleTrialBookingRow(id: 'tb-1', status: 'completed'));

        final result = await repository.fetchTrialBookingById('tb-1');

        expect(result.isSuccess, isTrue);
        expect(result.value!.id, 'tb-1');
        expect(result.value!.status, TrialBookingStatus.completed);
      });

      test('returns failure on query error', () async {
        when(() => mockClient.from(any())).thenThrow(Exception('DB error'));

        final result = await repository.fetchTrialBookingById('tb-1');

        expect(result.isFailure, isTrue);
      });
    });
  });
}

MarketOffer _sampleOffer() {
  return MarketOffer(
    id: 'of-1',
    listingId: 'm-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    amount: 4500000,
    createdAt: DateTime(2026, 5, 1),
  );
}

TrialSlot _sampleSlot() {
  return TrialSlot(
    id: 'slot-1',
    listingId: 'm-1',
    sellerId: 'seller-1',
    date: DateTime(2026, 8, 1),
    startTime: '10:00',
    endTime: '11:00',
    createdAt: DateTime(2026, 1, 1),
  );
}

TrialBooking _sampleBooking() {
  return TrialBooking(
    id: 'tb-1',
    listingId: 'm-1',
    slotId: 'slot-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    requestedAt: DateTime(2026, 7, 1),
  );
}
