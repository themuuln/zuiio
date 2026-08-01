// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'market_listing.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$MarketListing {
  String get id => throw _privateConstructorUsedError;
  String get horseId => throw _privateConstructorUsedError;
  String get sellerId => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  int get priceAmount => throw _privateConstructorUsedError;
  String get currency => throw _privateConstructorUsedError;
  MarketSaleType get saleType => throw _privateConstructorUsedError;
  MarketListingStatus get status => throw _privateConstructorUsedError;
  String get locationLabel => throw _privateConstructorUsedError;
  List<String> get disciplineTags => throw _privateConstructorUsedError;
  List<String> get documentTags => throw _privateConstructorUsedError;
  List<String> get mediaUrls => throw _privateConstructorUsedError;
  bool get isSellerVerified => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;
  int get viewsCount => throw _privateConstructorUsedError;
  bool get isFavorite => throw _privateConstructorUsedError;
  @Deprecated('Use boostLevel/vipLevel instead')
  bool get isFeatured => throw _privateConstructorUsedError;
  BoostLevel get boostLevel => throw _privateConstructorUsedError;
  DateTime? get boostExpiresAt => throw _privateConstructorUsedError;
  VipLevel get vipLevel => throw _privateConstructorUsedError;
  DateTime? get vipExpiresAt => throw _privateConstructorUsedError;
  SellerBadgeType get sellerBadge => throw _privateConstructorUsedError;
  DateTime? get sellerBadgeExpiresAt => throw _privateConstructorUsedError;
  double? get commissionRate => throw _privateConstructorUsedError;
  int? get commissionAmount => throw _privateConstructorUsedError;
  bool get lostReportConflict => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $MarketListingCopyWith<MarketListing> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MarketListingCopyWith<$Res> {
  factory $MarketListingCopyWith(
    MarketListing value,
    $Res Function(MarketListing) then,
  ) = _$MarketListingCopyWithImpl<$Res, MarketListing>;
  @useResult
  $Res call({
    String id,
    String horseId,
    String sellerId,
    String title,
    String description,
    int priceAmount,
    String currency,
    MarketSaleType saleType,
    MarketListingStatus status,
    String locationLabel,
    List<String> disciplineTags,
    List<String> documentTags,
    List<String> mediaUrls,
    bool isSellerVerified,
    DateTime createdAt,
    DateTime updatedAt,
    int viewsCount,
    bool isFavorite,
    @Deprecated('Use boostLevel/vipLevel instead') bool isFeatured,
    BoostLevel boostLevel,
    DateTime? boostExpiresAt,
    VipLevel vipLevel,
    DateTime? vipExpiresAt,
    SellerBadgeType sellerBadge,
    DateTime? sellerBadgeExpiresAt,
    double? commissionRate,
    int? commissionAmount,
    bool lostReportConflict,
  });
}

/// @nodoc
class _$MarketListingCopyWithImpl<$Res, $Val extends MarketListing>
    implements $MarketListingCopyWith<$Res> {
  _$MarketListingCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? horseId = null,
    Object? sellerId = null,
    Object? title = null,
    Object? description = null,
    Object? priceAmount = null,
    Object? currency = null,
    Object? saleType = null,
    Object? status = null,
    Object? locationLabel = null,
    Object? disciplineTags = null,
    Object? documentTags = null,
    Object? mediaUrls = null,
    Object? isSellerVerified = null,
    Object? createdAt = null,
    Object? updatedAt = null,
    Object? viewsCount = null,
    Object? isFavorite = null,
    Object? isFeatured = null,
    Object? boostLevel = null,
    Object? boostExpiresAt = freezed,
    Object? vipLevel = null,
    Object? vipExpiresAt = freezed,
    Object? sellerBadge = null,
    Object? sellerBadgeExpiresAt = freezed,
    Object? commissionRate = freezed,
    Object? commissionAmount = freezed,
    Object? lostReportConflict = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            horseId: null == horseId
                ? _value.horseId
                : horseId // ignore: cast_nullable_to_non_nullable
                      as String,
            sellerId: null == sellerId
                ? _value.sellerId
                : sellerId // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            description: null == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String,
            priceAmount: null == priceAmount
                ? _value.priceAmount
                : priceAmount // ignore: cast_nullable_to_non_nullable
                      as int,
            currency: null == currency
                ? _value.currency
                : currency // ignore: cast_nullable_to_non_nullable
                      as String,
            saleType: null == saleType
                ? _value.saleType
                : saleType // ignore: cast_nullable_to_non_nullable
                      as MarketSaleType,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as MarketListingStatus,
            locationLabel: null == locationLabel
                ? _value.locationLabel
                : locationLabel // ignore: cast_nullable_to_non_nullable
                      as String,
            disciplineTags: null == disciplineTags
                ? _value.disciplineTags
                : disciplineTags // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            documentTags: null == documentTags
                ? _value.documentTags
                : documentTags // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            mediaUrls: null == mediaUrls
                ? _value.mediaUrls
                : mediaUrls // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            isSellerVerified: null == isSellerVerified
                ? _value.isSellerVerified
                : isSellerVerified // ignore: cast_nullable_to_non_nullable
                      as bool,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            updatedAt: null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            viewsCount: null == viewsCount
                ? _value.viewsCount
                : viewsCount // ignore: cast_nullable_to_non_nullable
                      as int,
            isFavorite: null == isFavorite
                ? _value.isFavorite
                : isFavorite // ignore: cast_nullable_to_non_nullable
                      as bool,
            isFeatured: null == isFeatured
                ? _value.isFeatured
                : isFeatured // ignore: cast_nullable_to_non_nullable
                      as bool,
            boostLevel: null == boostLevel
                ? _value.boostLevel
                : boostLevel // ignore: cast_nullable_to_non_nullable
                      as BoostLevel,
            boostExpiresAt: freezed == boostExpiresAt
                ? _value.boostExpiresAt
                : boostExpiresAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            vipLevel: null == vipLevel
                ? _value.vipLevel
                : vipLevel // ignore: cast_nullable_to_non_nullable
                      as VipLevel,
            vipExpiresAt: freezed == vipExpiresAt
                ? _value.vipExpiresAt
                : vipExpiresAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            sellerBadge: null == sellerBadge
                ? _value.sellerBadge
                : sellerBadge // ignore: cast_nullable_to_non_nullable
                      as SellerBadgeType,
            sellerBadgeExpiresAt: freezed == sellerBadgeExpiresAt
                ? _value.sellerBadgeExpiresAt
                : sellerBadgeExpiresAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            commissionRate: freezed == commissionRate
                ? _value.commissionRate
                : commissionRate // ignore: cast_nullable_to_non_nullable
                      as double?,
            commissionAmount: freezed == commissionAmount
                ? _value.commissionAmount
                : commissionAmount // ignore: cast_nullable_to_non_nullable
                      as int?,
            lostReportConflict: null == lostReportConflict
                ? _value.lostReportConflict
                : lostReportConflict // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MarketListingImplCopyWith<$Res>
    implements $MarketListingCopyWith<$Res> {
  factory _$$MarketListingImplCopyWith(
    _$MarketListingImpl value,
    $Res Function(_$MarketListingImpl) then,
  ) = __$$MarketListingImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String horseId,
    String sellerId,
    String title,
    String description,
    int priceAmount,
    String currency,
    MarketSaleType saleType,
    MarketListingStatus status,
    String locationLabel,
    List<String> disciplineTags,
    List<String> documentTags,
    List<String> mediaUrls,
    bool isSellerVerified,
    DateTime createdAt,
    DateTime updatedAt,
    int viewsCount,
    bool isFavorite,
    @Deprecated('Use boostLevel/vipLevel instead') bool isFeatured,
    BoostLevel boostLevel,
    DateTime? boostExpiresAt,
    VipLevel vipLevel,
    DateTime? vipExpiresAt,
    SellerBadgeType sellerBadge,
    DateTime? sellerBadgeExpiresAt,
    double? commissionRate,
    int? commissionAmount,
    bool lostReportConflict,
  });
}

/// @nodoc
class __$$MarketListingImplCopyWithImpl<$Res>
    extends _$MarketListingCopyWithImpl<$Res, _$MarketListingImpl>
    implements _$$MarketListingImplCopyWith<$Res> {
  __$$MarketListingImplCopyWithImpl(
    _$MarketListingImpl _value,
    $Res Function(_$MarketListingImpl) _then,
  ) : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? horseId = null,
    Object? sellerId = null,
    Object? title = null,
    Object? description = null,
    Object? priceAmount = null,
    Object? currency = null,
    Object? saleType = null,
    Object? status = null,
    Object? locationLabel = null,
    Object? disciplineTags = null,
    Object? documentTags = null,
    Object? mediaUrls = null,
    Object? isSellerVerified = null,
    Object? createdAt = null,
    Object? updatedAt = null,
    Object? viewsCount = null,
    Object? isFavorite = null,
    Object? isFeatured = null,
    Object? boostLevel = null,
    Object? boostExpiresAt = freezed,
    Object? vipLevel = null,
    Object? vipExpiresAt = freezed,
    Object? sellerBadge = null,
    Object? sellerBadgeExpiresAt = freezed,
    Object? commissionRate = freezed,
    Object? commissionAmount = freezed,
    Object? lostReportConflict = null,
  }) {
    return _then(
      _$MarketListingImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        horseId: null == horseId
            ? _value.horseId
            : horseId // ignore: cast_nullable_to_non_nullable
                  as String,
        sellerId: null == sellerId
            ? _value.sellerId
            : sellerId // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        description: null == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String,
        priceAmount: null == priceAmount
            ? _value.priceAmount
            : priceAmount // ignore: cast_nullable_to_non_nullable
                  as int,
        currency: null == currency
            ? _value.currency
            : currency // ignore: cast_nullable_to_non_nullable
                  as String,
        saleType: null == saleType
            ? _value.saleType
            : saleType // ignore: cast_nullable_to_non_nullable
                  as MarketSaleType,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as MarketListingStatus,
        locationLabel: null == locationLabel
            ? _value.locationLabel
            : locationLabel // ignore: cast_nullable_to_non_nullable
                  as String,
        disciplineTags: null == disciplineTags
            ? _value._disciplineTags
            : disciplineTags // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        documentTags: null == documentTags
            ? _value._documentTags
            : documentTags // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        mediaUrls: null == mediaUrls
            ? _value._mediaUrls
            : mediaUrls // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        isSellerVerified: null == isSellerVerified
            ? _value.isSellerVerified
            : isSellerVerified // ignore: cast_nullable_to_non_nullable
                  as bool,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        updatedAt: null == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        viewsCount: null == viewsCount
            ? _value.viewsCount
            : viewsCount // ignore: cast_nullable_to_non_nullable
                  as int,
        isFavorite: null == isFavorite
            ? _value.isFavorite
            : isFavorite // ignore: cast_nullable_to_non_nullable
                  as bool,
        isFeatured: null == isFeatured
            ? _value.isFeatured
            : isFeatured // ignore: cast_nullable_to_non_nullable
                  as bool,
        boostLevel: null == boostLevel
            ? _value.boostLevel
            : boostLevel // ignore: cast_nullable_to_non_nullable
                  as BoostLevel,
        boostExpiresAt: freezed == boostExpiresAt
            ? _value.boostExpiresAt
            : boostExpiresAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        vipLevel: null == vipLevel
            ? _value.vipLevel
            : vipLevel // ignore: cast_nullable_to_non_nullable
                  as VipLevel,
        vipExpiresAt: freezed == vipExpiresAt
            ? _value.vipExpiresAt
            : vipExpiresAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        sellerBadge: null == sellerBadge
            ? _value.sellerBadge
            : sellerBadge // ignore: cast_nullable_to_non_nullable
                  as SellerBadgeType,
        sellerBadgeExpiresAt: freezed == sellerBadgeExpiresAt
            ? _value.sellerBadgeExpiresAt
            : sellerBadgeExpiresAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        commissionRate: freezed == commissionRate
            ? _value.commissionRate
            : commissionRate // ignore: cast_nullable_to_non_nullable
                  as double?,
        commissionAmount: freezed == commissionAmount
            ? _value.commissionAmount
            : commissionAmount // ignore: cast_nullable_to_non_nullable
                  as int?,
        lostReportConflict: null == lostReportConflict
            ? _value.lostReportConflict
            : lostReportConflict // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc

class _$MarketListingImpl extends _MarketListing {
  const _$MarketListingImpl({
    required this.id,
    required this.horseId,
    required this.sellerId,
    required this.title,
    this.description = '',
    this.priceAmount = 0,
    this.currency = 'MNT',
    required this.saleType,
    required this.status,
    this.locationLabel = '',
    final List<String> disciplineTags = const [],
    final List<String> documentTags = const [],
    final List<String> mediaUrls = const [],
    this.isSellerVerified = false,
    required this.createdAt,
    required this.updatedAt,
    this.viewsCount = 0,
    this.isFavorite = false,
    @Deprecated('Use boostLevel/vipLevel instead') this.isFeatured = false,
    this.boostLevel = BoostLevel.none,
    this.boostExpiresAt,
    this.vipLevel = VipLevel.none,
    this.vipExpiresAt,
    this.sellerBadge = SellerBadgeType.none,
    this.sellerBadgeExpiresAt,
    this.commissionRate,
    this.commissionAmount,
    this.lostReportConflict = false,
  }) : _disciplineTags = disciplineTags,
       _documentTags = documentTags,
       _mediaUrls = mediaUrls,
       super._();

  @override
  final String id;
  @override
  final String horseId;
  @override
  final String sellerId;
  @override
  final String title;
  @override
  @JsonKey()
  final String description;
  @override
  @JsonKey()
  final int priceAmount;
  @override
  @JsonKey()
  final String currency;
  @override
  final MarketSaleType saleType;
  @override
  final MarketListingStatus status;
  @override
  @JsonKey()
  final String locationLabel;
  final List<String> _disciplineTags;
  @override
  @JsonKey()
  List<String> get disciplineTags {
    if (_disciplineTags is EqualUnmodifiableListView) return _disciplineTags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_disciplineTags);
  }

  final List<String> _documentTags;
  @override
  @JsonKey()
  List<String> get documentTags {
    if (_documentTags is EqualUnmodifiableListView) return _documentTags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_documentTags);
  }

  final List<String> _mediaUrls;
  @override
  @JsonKey()
  List<String> get mediaUrls {
    if (_mediaUrls is EqualUnmodifiableListView) return _mediaUrls;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_mediaUrls);
  }

  @override
  @JsonKey()
  final bool isSellerVerified;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  @JsonKey()
  final int viewsCount;
  @override
  @JsonKey()
  final bool isFavorite;
  @override
  @JsonKey()
  @Deprecated('Use boostLevel/vipLevel instead')
  final bool isFeatured;
  @override
  @JsonKey()
  final BoostLevel boostLevel;
  @override
  final DateTime? boostExpiresAt;
  @override
  @JsonKey()
  final VipLevel vipLevel;
  @override
  final DateTime? vipExpiresAt;
  @override
  @JsonKey()
  final SellerBadgeType sellerBadge;
  @override
  final DateTime? sellerBadgeExpiresAt;
  @override
  final double? commissionRate;
  @override
  final int? commissionAmount;
  @override
  @JsonKey()
  final bool lostReportConflict;

  @override
  String toString() {
    return 'MarketListing(id: $id, horseId: $horseId, sellerId: $sellerId, title: $title, description: $description, priceAmount: $priceAmount, currency: $currency, saleType: $saleType, status: $status, locationLabel: $locationLabel, disciplineTags: $disciplineTags, documentTags: $documentTags, mediaUrls: $mediaUrls, isSellerVerified: $isSellerVerified, createdAt: $createdAt, updatedAt: $updatedAt, viewsCount: $viewsCount, isFavorite: $isFavorite, isFeatured: $isFeatured, boostLevel: $boostLevel, boostExpiresAt: $boostExpiresAt, vipLevel: $vipLevel, vipExpiresAt: $vipExpiresAt, sellerBadge: $sellerBadge, sellerBadgeExpiresAt: $sellerBadgeExpiresAt, commissionRate: $commissionRate, commissionAmount: $commissionAmount, lostReportConflict: $lostReportConflict)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MarketListingImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.horseId, horseId) || other.horseId == horseId) &&
            (identical(other.sellerId, sellerId) ||
                other.sellerId == sellerId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.priceAmount, priceAmount) ||
                other.priceAmount == priceAmount) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.saleType, saleType) ||
                other.saleType == saleType) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.locationLabel, locationLabel) ||
                other.locationLabel == locationLabel) &&
            const DeepCollectionEquality().equals(
              other._disciplineTags,
              _disciplineTags,
            ) &&
            const DeepCollectionEquality().equals(
              other._documentTags,
              _documentTags,
            ) &&
            const DeepCollectionEquality().equals(
              other._mediaUrls,
              _mediaUrls,
            ) &&
            (identical(other.isSellerVerified, isSellerVerified) ||
                other.isSellerVerified == isSellerVerified) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.viewsCount, viewsCount) ||
                other.viewsCount == viewsCount) &&
            (identical(other.isFavorite, isFavorite) ||
                other.isFavorite == isFavorite) &&
            (identical(other.isFeatured, isFeatured) ||
                other.isFeatured == isFeatured) &&
            (identical(other.boostLevel, boostLevel) ||
                other.boostLevel == boostLevel) &&
            (identical(other.boostExpiresAt, boostExpiresAt) ||
                other.boostExpiresAt == boostExpiresAt) &&
            (identical(other.vipLevel, vipLevel) ||
                other.vipLevel == vipLevel) &&
            (identical(other.vipExpiresAt, vipExpiresAt) ||
                other.vipExpiresAt == vipExpiresAt) &&
            (identical(other.sellerBadge, sellerBadge) ||
                other.sellerBadge == sellerBadge) &&
            (identical(other.sellerBadgeExpiresAt, sellerBadgeExpiresAt) ||
                other.sellerBadgeExpiresAt == sellerBadgeExpiresAt) &&
            (identical(other.commissionRate, commissionRate) ||
                other.commissionRate == commissionRate) &&
            (identical(other.commissionAmount, commissionAmount) ||
                other.commissionAmount == commissionAmount) &&
            (identical(other.lostReportConflict, lostReportConflict) ||
                other.lostReportConflict == lostReportConflict));
  }

  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    id,
    horseId,
    sellerId,
    title,
    description,
    priceAmount,
    currency,
    saleType,
    status,
    locationLabel,
    const DeepCollectionEquality().hash(_disciplineTags),
    const DeepCollectionEquality().hash(_documentTags),
    const DeepCollectionEquality().hash(_mediaUrls),
    isSellerVerified,
    createdAt,
    updatedAt,
    viewsCount,
    isFavorite,
    isFeatured,
    boostLevel,
    boostExpiresAt,
    vipLevel,
    vipExpiresAt,
    sellerBadge,
    sellerBadgeExpiresAt,
    commissionRate,
    commissionAmount,
    lostReportConflict,
  ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$MarketListingImplCopyWith<_$MarketListingImpl> get copyWith =>
      __$$MarketListingImplCopyWithImpl<_$MarketListingImpl>(this, _$identity);
}

abstract class _MarketListing extends MarketListing {
  const factory _MarketListing({
    required final String id,
    required final String horseId,
    required final String sellerId,
    required final String title,
    final String description,
    final int priceAmount,
    final String currency,
    required final MarketSaleType saleType,
    required final MarketListingStatus status,
    final String locationLabel,
    final List<String> disciplineTags,
    final List<String> documentTags,
    final List<String> mediaUrls,
    final bool isSellerVerified,
    required final DateTime createdAt,
    required final DateTime updatedAt,
    final int viewsCount,
    final bool isFavorite,
    @Deprecated('Use boostLevel/vipLevel instead') final bool isFeatured,
    final BoostLevel boostLevel,
    final DateTime? boostExpiresAt,
    final VipLevel vipLevel,
    final DateTime? vipExpiresAt,
    final SellerBadgeType sellerBadge,
    final DateTime? sellerBadgeExpiresAt,
    final double? commissionRate,
    final int? commissionAmount,
    final bool lostReportConflict,
  }) = _$MarketListingImpl;
  const _MarketListing._() : super._();

  @override
  String get id;
  @override
  String get horseId;
  @override
  String get sellerId;
  @override
  String get title;
  @override
  String get description;
  @override
  int get priceAmount;
  @override
  String get currency;
  @override
  MarketSaleType get saleType;
  @override
  MarketListingStatus get status;
  @override
  String get locationLabel;
  @override
  List<String> get disciplineTags;
  @override
  List<String> get documentTags;
  @override
  List<String> get mediaUrls;
  @override
  bool get isSellerVerified;
  @override
  DateTime get createdAt;
  @override
  DateTime get updatedAt;
  @override
  int get viewsCount;
  @override
  bool get isFavorite;
  @override
  @Deprecated('Use boostLevel/vipLevel instead')
  bool get isFeatured;
  @override
  BoostLevel get boostLevel;
  @override
  DateTime? get boostExpiresAt;
  @override
  VipLevel get vipLevel;
  @override
  DateTime? get vipExpiresAt;
  @override
  SellerBadgeType get sellerBadge;
  @override
  DateTime? get sellerBadgeExpiresAt;
  @override
  double? get commissionRate;
  @override
  int? get commissionAmount;
  @override
  bool get lostReportConflict;
  @override
  @JsonKey(ignore: true)
  _$$MarketListingImplCopyWith<_$MarketListingImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
