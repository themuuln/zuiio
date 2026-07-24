// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_market_listing.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarMarketListingCollection on Isar {
  IsarCollection<IsarMarketListing> get isarMarketListings => this.collection();
}

const IsarMarketListingSchema = CollectionSchema(
  name: r'IsarMarketListing',
  id: 7708817955777694012,
  properties: {
    r'boostExpiresAt': PropertySchema(
      id: 0,
      name: r'boostExpiresAt',
      type: IsarType.dateTime,
    ),
    r'boostLevel': PropertySchema(
      id: 1,
      name: r'boostLevel',
      type: IsarType.byte,
      enumMap: _IsarMarketListingboostLevelEnumValueMap,
    ),
    r'createdAt': PropertySchema(
      id: 2,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'currency': PropertySchema(
      id: 3,
      name: r'currency',
      type: IsarType.string,
    ),
    r'description': PropertySchema(
      id: 4,
      name: r'description',
      type: IsarType.string,
    ),
    r'disciplineTags': PropertySchema(
      id: 5,
      name: r'disciplineTags',
      type: IsarType.stringList,
    ),
    r'documentTags': PropertySchema(
      id: 6,
      name: r'documentTags',
      type: IsarType.stringList,
    ),
    r'domainId': PropertySchema(
      id: 7,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'horseId': PropertySchema(
      id: 8,
      name: r'horseId',
      type: IsarType.string,
    ),
    r'isFavorite': PropertySchema(
      id: 9,
      name: r'isFavorite',
      type: IsarType.bool,
    ),
    r'isFeatured': PropertySchema(
      id: 10,
      name: r'isFeatured',
      type: IsarType.bool,
    ),
    r'isSellerVerified': PropertySchema(
      id: 11,
      name: r'isSellerVerified',
      type: IsarType.bool,
    ),
    r'locationLabel': PropertySchema(
      id: 12,
      name: r'locationLabel',
      type: IsarType.string,
    ),
    r'mediaUrls': PropertySchema(
      id: 13,
      name: r'mediaUrls',
      type: IsarType.stringList,
    ),
    r'priceAmount': PropertySchema(
      id: 14,
      name: r'priceAmount',
      type: IsarType.long,
    ),
    r'saleType': PropertySchema(
      id: 15,
      name: r'saleType',
      type: IsarType.byte,
      enumMap: _IsarMarketListingsaleTypeEnumValueMap,
    ),
    r'sellerBadge': PropertySchema(
      id: 16,
      name: r'sellerBadge',
      type: IsarType.byte,
      enumMap: _IsarMarketListingsellerBadgeEnumValueMap,
    ),
    r'sellerBadgeExpiresAt': PropertySchema(
      id: 17,
      name: r'sellerBadgeExpiresAt',
      type: IsarType.dateTime,
    ),
    r'sellerId': PropertySchema(
      id: 18,
      name: r'sellerId',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: 19,
      name: r'status',
      type: IsarType.byte,
      enumMap: _IsarMarketListingstatusEnumValueMap,
    ),
    r'title': PropertySchema(
      id: 20,
      name: r'title',
      type: IsarType.string,
    ),
    r'updatedAt': PropertySchema(
      id: 21,
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
    r'viewsCount': PropertySchema(
      id: 22,
      name: r'viewsCount',
      type: IsarType.long,
    ),
    r'vipExpiresAt': PropertySchema(
      id: 23,
      name: r'vipExpiresAt',
      type: IsarType.dateTime,
    ),
    r'vipLevel': PropertySchema(
      id: 24,
      name: r'vipLevel',
      type: IsarType.byte,
      enumMap: _IsarMarketListingvipLevelEnumValueMap,
    )
  },
  estimateSize: _isarMarketListingEstimateSize,
  serialize: _isarMarketListingSerialize,
  deserialize: _isarMarketListingDeserialize,
  deserializeProp: _isarMarketListingDeserializeProp,
  idName: r'id',
  indexes: {
    r'domainId': IndexSchema(
      id: -9138809277110658179,
      name: r'domainId',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'domainId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    ),
    r'horseId': IndexSchema(
      id: -4681125749579367450,
      name: r'horseId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'horseId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    ),
    r'sellerId': IndexSchema(
      id: -270845138789699514,
      name: r'sellerId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'sellerId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    ),
    r'status': IndexSchema(
      id: -107785170620420283,
      name: r'status',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'status',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    ),
    r'createdAt': IndexSchema(
      id: -3433535483987302584,
      name: r'createdAt',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'createdAt',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    ),
    r'isFavorite': IndexSchema(
      id: 5742774614603939776,
      name: r'isFavorite',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'isFavorite',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    ),
    r'boostLevel': IndexSchema(
      id: 7327909588539191484,
      name: r'boostLevel',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'boostLevel',
          type: IndexType.value,
          caseSensitive: false,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarMarketListingGetId,
  getLinks: _isarMarketListingGetLinks,
  attach: _isarMarketListingAttach,
  version: '3.1.0+1',
);

int _isarMarketListingEstimateSize(
  IsarMarketListing object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.currency.length * 3;
  bytesCount += 3 + object.description.length * 3;
  bytesCount += 3 + object.disciplineTags.length * 3;
  {
    for (var i = 0; i < object.disciplineTags.length; i++) {
      final value = object.disciplineTags[i];
      bytesCount += value.length * 3;
    }
  }
  bytesCount += 3 + object.documentTags.length * 3;
  {
    for (var i = 0; i < object.documentTags.length; i++) {
      final value = object.documentTags[i];
      bytesCount += value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.horseId.length * 3;
  bytesCount += 3 + object.locationLabel.length * 3;
  bytesCount += 3 + object.mediaUrls.length * 3;
  {
    for (var i = 0; i < object.mediaUrls.length; i++) {
      final value = object.mediaUrls[i];
      bytesCount += value.length * 3;
    }
  }
  bytesCount += 3 + object.sellerId.length * 3;
  bytesCount += 3 + object.title.length * 3;
  return bytesCount;
}

void _isarMarketListingSerialize(
  IsarMarketListing object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.boostExpiresAt);
  writer.writeByte(offsets[1], object.boostLevel.index);
  writer.writeDateTime(offsets[2], object.createdAt);
  writer.writeString(offsets[3], object.currency);
  writer.writeString(offsets[4], object.description);
  writer.writeStringList(offsets[5], object.disciplineTags);
  writer.writeStringList(offsets[6], object.documentTags);
  writer.writeString(offsets[7], object.domainId);
  writer.writeString(offsets[8], object.horseId);
  writer.writeBool(offsets[9], object.isFavorite);
  writer.writeBool(offsets[10], object.isFeatured);
  writer.writeBool(offsets[11], object.isSellerVerified);
  writer.writeString(offsets[12], object.locationLabel);
  writer.writeStringList(offsets[13], object.mediaUrls);
  writer.writeLong(offsets[14], object.priceAmount);
  writer.writeByte(offsets[15], object.saleType.index);
  writer.writeByte(offsets[16], object.sellerBadge.index);
  writer.writeDateTime(offsets[17], object.sellerBadgeExpiresAt);
  writer.writeString(offsets[18], object.sellerId);
  writer.writeByte(offsets[19], object.status.index);
  writer.writeString(offsets[20], object.title);
  writer.writeDateTime(offsets[21], object.updatedAt);
  writer.writeLong(offsets[22], object.viewsCount);
  writer.writeDateTime(offsets[23], object.vipExpiresAt);
  writer.writeByte(offsets[24], object.vipLevel.index);
}

IsarMarketListing _isarMarketListingDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarMarketListing();
  object.boostExpiresAt = reader.readDateTimeOrNull(offsets[0]);
  object.boostLevel = _IsarMarketListingboostLevelValueEnumMap[
          reader.readByteOrNull(offsets[1])] ??
      BoostLevel.none;
  object.createdAt = reader.readDateTime(offsets[2]);
  object.currency = reader.readString(offsets[3]);
  object.description = reader.readString(offsets[4]);
  object.disciplineTags = reader.readStringList(offsets[5]) ?? [];
  object.documentTags = reader.readStringList(offsets[6]) ?? [];
  object.domainId = reader.readString(offsets[7]);
  object.horseId = reader.readString(offsets[8]);
  object.id = id;
  object.isFavorite = reader.readBool(offsets[9]);
  object.isFeatured = reader.readBool(offsets[10]);
  object.isSellerVerified = reader.readBool(offsets[11]);
  object.locationLabel = reader.readString(offsets[12]);
  object.mediaUrls = reader.readStringList(offsets[13]) ?? [];
  object.priceAmount = reader.readLong(offsets[14]);
  object.saleType = _IsarMarketListingsaleTypeValueEnumMap[
          reader.readByteOrNull(offsets[15])] ??
      MarketSaleType.sale;
  object.sellerBadge = _IsarMarketListingsellerBadgeValueEnumMap[
          reader.readByteOrNull(offsets[16])] ??
      SellerBadgeType.none;
  object.sellerBadgeExpiresAt = reader.readDateTimeOrNull(offsets[17]);
  object.sellerId = reader.readString(offsets[18]);
  object.status = _IsarMarketListingstatusValueEnumMap[
          reader.readByteOrNull(offsets[19])] ??
      MarketListingStatus.active;
  object.title = reader.readString(offsets[20]);
  object.updatedAt = reader.readDateTime(offsets[21]);
  object.viewsCount = reader.readLong(offsets[22]);
  object.vipExpiresAt = reader.readDateTimeOrNull(offsets[23]);
  object.vipLevel = _IsarMarketListingvipLevelValueEnumMap[
          reader.readByteOrNull(offsets[24])] ??
      VipLevel.none;
  return object;
}

P _isarMarketListingDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 1:
      return (_IsarMarketListingboostLevelValueEnumMap[
              reader.readByteOrNull(offset)] ??
          BoostLevel.none) as P;
    case 2:
      return (reader.readDateTime(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readStringList(offset) ?? []) as P;
    case 6:
      return (reader.readStringList(offset) ?? []) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readBool(offset)) as P;
    case 10:
      return (reader.readBool(offset)) as P;
    case 11:
      return (reader.readBool(offset)) as P;
    case 12:
      return (reader.readString(offset)) as P;
    case 13:
      return (reader.readStringList(offset) ?? []) as P;
    case 14:
      return (reader.readLong(offset)) as P;
    case 15:
      return (_IsarMarketListingsaleTypeValueEnumMap[
              reader.readByteOrNull(offset)] ??
          MarketSaleType.sale) as P;
    case 16:
      return (_IsarMarketListingsellerBadgeValueEnumMap[
              reader.readByteOrNull(offset)] ??
          SellerBadgeType.none) as P;
    case 17:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 18:
      return (reader.readString(offset)) as P;
    case 19:
      return (_IsarMarketListingstatusValueEnumMap[
              reader.readByteOrNull(offset)] ??
          MarketListingStatus.active) as P;
    case 20:
      return (reader.readString(offset)) as P;
    case 21:
      return (reader.readDateTime(offset)) as P;
    case 22:
      return (reader.readLong(offset)) as P;
    case 23:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 24:
      return (_IsarMarketListingvipLevelValueEnumMap[
              reader.readByteOrNull(offset)] ??
          VipLevel.none) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarMarketListingboostLevelEnumValueMap = {
  'none': 0,
  'standard': 1,
  'premium': 2,
};
const _IsarMarketListingboostLevelValueEnumMap = {
  0: BoostLevel.none,
  1: BoostLevel.standard,
  2: BoostLevel.premium,
};
const _IsarMarketListingsaleTypeEnumValueMap = {
  'sale': 0,
  'lease': 1,
  'trade': 2,
  'stud': 3,
};
const _IsarMarketListingsaleTypeValueEnumMap = {
  0: MarketSaleType.sale,
  1: MarketSaleType.lease,
  2: MarketSaleType.trade,
  3: MarketSaleType.stud,
};
const _IsarMarketListingsellerBadgeEnumValueMap = {
  'none': 0,
  'shop': 1,
};
const _IsarMarketListingsellerBadgeValueEnumMap = {
  0: SellerBadgeType.none,
  1: SellerBadgeType.shop,
};
const _IsarMarketListingstatusEnumValueMap = {
  'active': 0,
  'pendingVerification': 1,
  'sold': 2,
  'expired': 3,
  'rejected': 4,
};
const _IsarMarketListingstatusValueEnumMap = {
  0: MarketListingStatus.active,
  1: MarketListingStatus.pendingVerification,
  2: MarketListingStatus.sold,
  3: MarketListingStatus.expired,
  4: MarketListingStatus.rejected,
};
const _IsarMarketListingvipLevelEnumValueMap = {
  'none': 0,
  'standard': 1,
  'premium': 2,
};
const _IsarMarketListingvipLevelValueEnumMap = {
  0: VipLevel.none,
  1: VipLevel.standard,
  2: VipLevel.premium,
};

Id _isarMarketListingGetId(IsarMarketListing object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarMarketListingGetLinks(
    IsarMarketListing object) {
  return [];
}

void _isarMarketListingAttach(
    IsarCollection<dynamic> col, Id id, IsarMarketListing object) {
  object.id = id;
}

extension IsarMarketListingByIndex on IsarCollection<IsarMarketListing> {
  Future<IsarMarketListing?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarMarketListing? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarMarketListing?>> getAllByDomainId(
      List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarMarketListing?> getAllByDomainIdSync(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'domainId', values);
  }

  Future<int> deleteAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'domainId', values);
  }

  int deleteAllByDomainIdSync(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'domainId', values);
  }

  Future<Id> putByDomainId(IsarMarketListing object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarMarketListing object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarMarketListing> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(List<IsarMarketListing> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarMarketListingQueryWhereSort
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QWhere> {
  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhere> anyStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'status'),
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhere>
      anyCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'createdAt'),
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhere>
      anyIsFavorite() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'isFavorite'),
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhere>
      anyBoostLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'boostLevel'),
      );
    });
  }
}

extension IsarMarketListingQueryWhere
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QWhereClause> {
  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      idNotEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'domainId',
        value: [domainId],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      domainIdNotEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'domainId',
              lower: [],
              upper: [domainId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'domainId',
              lower: [domainId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'domainId',
              lower: [domainId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'domainId',
              lower: [],
              upper: [domainId],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      horseIdEqualTo(String horseId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'horseId',
        value: [horseId],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      horseIdNotEqualTo(String horseId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'horseId',
              lower: [],
              upper: [horseId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'horseId',
              lower: [horseId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'horseId',
              lower: [horseId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'horseId',
              lower: [],
              upper: [horseId],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      sellerIdEqualTo(String sellerId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'sellerId',
        value: [sellerId],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      sellerIdNotEqualTo(String sellerId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'sellerId',
              lower: [],
              upper: [sellerId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'sellerId',
              lower: [sellerId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'sellerId',
              lower: [sellerId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'sellerId',
              lower: [],
              upper: [sellerId],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      statusEqualTo(MarketListingStatus status) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'status',
        value: [status],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      statusNotEqualTo(MarketListingStatus status) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'status',
              lower: [],
              upper: [status],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'status',
              lower: [status],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'status',
              lower: [status],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'status',
              lower: [],
              upper: [status],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      statusGreaterThan(
    MarketListingStatus status, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'status',
        lower: [status],
        includeLower: include,
        upper: [],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      statusLessThan(
    MarketListingStatus status, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'status',
        lower: [],
        upper: [status],
        includeUpper: include,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      statusBetween(
    MarketListingStatus lowerStatus,
    MarketListingStatus upperStatus, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'status',
        lower: [lowerStatus],
        includeLower: includeLower,
        upper: [upperStatus],
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      createdAtEqualTo(DateTime createdAt) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'createdAt',
        value: [createdAt],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      createdAtNotEqualTo(DateTime createdAt) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'createdAt',
              lower: [],
              upper: [createdAt],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'createdAt',
              lower: [createdAt],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'createdAt',
              lower: [createdAt],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'createdAt',
              lower: [],
              upper: [createdAt],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      createdAtGreaterThan(
    DateTime createdAt, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'createdAt',
        lower: [createdAt],
        includeLower: include,
        upper: [],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      createdAtLessThan(
    DateTime createdAt, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'createdAt',
        lower: [],
        upper: [createdAt],
        includeUpper: include,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      createdAtBetween(
    DateTime lowerCreatedAt,
    DateTime upperCreatedAt, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'createdAt',
        lower: [lowerCreatedAt],
        includeLower: includeLower,
        upper: [upperCreatedAt],
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      isFavoriteEqualTo(bool isFavorite) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'isFavorite',
        value: [isFavorite],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      isFavoriteNotEqualTo(bool isFavorite) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'isFavorite',
              lower: [],
              upper: [isFavorite],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'isFavorite',
              lower: [isFavorite],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'isFavorite',
              lower: [isFavorite],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'isFavorite',
              lower: [],
              upper: [isFavorite],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      boostLevelEqualTo(BoostLevel boostLevel) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'boostLevel',
        value: [boostLevel],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      boostLevelNotEqualTo(BoostLevel boostLevel) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'boostLevel',
              lower: [],
              upper: [boostLevel],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'boostLevel',
              lower: [boostLevel],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'boostLevel',
              lower: [boostLevel],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'boostLevel',
              lower: [],
              upper: [boostLevel],
              includeUpper: false,
            ));
      }
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      boostLevelGreaterThan(
    BoostLevel boostLevel, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'boostLevel',
        lower: [boostLevel],
        includeLower: include,
        upper: [],
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      boostLevelLessThan(
    BoostLevel boostLevel, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'boostLevel',
        lower: [],
        upper: [boostLevel],
        includeUpper: include,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterWhereClause>
      boostLevelBetween(
    BoostLevel lowerBoostLevel,
    BoostLevel upperBoostLevel, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'boostLevel',
        lower: [lowerBoostLevel],
        includeLower: includeLower,
        upper: [upperBoostLevel],
        includeUpper: includeUpper,
      ));
    });
  }
}

extension IsarMarketListingQueryFilter
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QFilterCondition> {
  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostExpiresAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'boostExpiresAt',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostExpiresAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'boostExpiresAt',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostExpiresAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'boostExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostExpiresAtGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'boostExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostExpiresAtLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'boostExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostExpiresAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'boostExpiresAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostLevelEqualTo(BoostLevel value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'boostLevel',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostLevelGreaterThan(
    BoostLevel value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'boostLevel',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostLevelLessThan(
    BoostLevel value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'boostLevel',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      boostLevelBetween(
    BoostLevel lower,
    BoostLevel upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'boostLevel',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      createdAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      createdAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      createdAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'createdAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'currency',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'currency',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'currency',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'currency',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'currency',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'currency',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'currency',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'currency',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'currency',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      currencyIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'currency',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'description',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'description',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'description',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'description',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'description',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'description',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'description',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'description',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'description',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      descriptionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'description',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'disciplineTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'disciplineTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'disciplineTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'disciplineTags',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'disciplineTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'disciplineTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'disciplineTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementMatches(String pattern,
          {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'disciplineTags',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'disciplineTags',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'disciplineTags',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'disciplineTags',
        length,
        true,
        length,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'disciplineTags',
        0,
        true,
        0,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'disciplineTags',
        0,
        false,
        999999,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'disciplineTags',
        0,
        true,
        length,
        include,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'disciplineTags',
        length,
        include,
        999999,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      disciplineTagsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'disciplineTags',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'documentTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'documentTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'documentTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'documentTags',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'documentTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'documentTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'documentTags',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'documentTags',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'documentTags',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'documentTags',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentTags',
        length,
        true,
        length,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentTags',
        0,
        true,
        0,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentTags',
        0,
        false,
        999999,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentTags',
        0,
        true,
        length,
        include,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentTags',
        length,
        include,
        999999,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      documentTagsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentTags',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'domainId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'domainId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'horseId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'horseId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'horseId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'horseId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'horseId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'horseId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'horseId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'horseId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'horseId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'horseId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      isFavoriteEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isFavorite',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      isFeaturedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isFeatured',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      isSellerVerifiedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isSellerVerified',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'locationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'locationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'locationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'locationLabel',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'locationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'locationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'locationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'locationLabel',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'locationLabel',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      locationLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'locationLabel',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'mediaUrls',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'mediaUrls',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'mediaUrls',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'mediaUrls',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'mediaUrls',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'mediaUrls',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'mediaUrls',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'mediaUrls',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'mediaUrls',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'mediaUrls',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'mediaUrls',
        length,
        true,
        length,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'mediaUrls',
        0,
        true,
        0,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'mediaUrls',
        0,
        false,
        999999,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsLengthLessThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'mediaUrls',
        0,
        true,
        length,
        include,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsLengthGreaterThan(
    int length, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'mediaUrls',
        length,
        include,
        999999,
        true,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      mediaUrlsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'mediaUrls',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      priceAmountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'priceAmount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      priceAmountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'priceAmount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      priceAmountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'priceAmount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      priceAmountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'priceAmount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      saleTypeEqualTo(MarketSaleType value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'saleType',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      saleTypeGreaterThan(
    MarketSaleType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'saleType',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      saleTypeLessThan(
    MarketSaleType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'saleType',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      saleTypeBetween(
    MarketSaleType lower,
    MarketSaleType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'saleType',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeEqualTo(SellerBadgeType value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sellerBadge',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeGreaterThan(
    SellerBadgeType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'sellerBadge',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeLessThan(
    SellerBadgeType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'sellerBadge',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeBetween(
    SellerBadgeType lower,
    SellerBadgeType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'sellerBadge',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeExpiresAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'sellerBadgeExpiresAt',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeExpiresAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'sellerBadgeExpiresAt',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeExpiresAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sellerBadgeExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeExpiresAtGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'sellerBadgeExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeExpiresAtLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'sellerBadgeExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerBadgeExpiresAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'sellerBadgeExpiresAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'sellerId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'sellerId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sellerId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      sellerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'sellerId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      statusEqualTo(MarketListingStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      statusGreaterThan(
    MarketListingStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      statusLessThan(
    MarketListingStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      statusBetween(
    MarketListingStatus lower,
    MarketListingStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'status',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'title',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'title',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'title',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'title',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'title',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'title',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'title',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'title',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'title',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      titleIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'title',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'updatedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      updatedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'updatedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      updatedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'updatedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      updatedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'updatedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      viewsCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'viewsCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      viewsCountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'viewsCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      viewsCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'viewsCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      viewsCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'viewsCount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipExpiresAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'vipExpiresAt',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipExpiresAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'vipExpiresAt',
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipExpiresAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'vipExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipExpiresAtGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'vipExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipExpiresAtLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'vipExpiresAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipExpiresAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'vipExpiresAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipLevelEqualTo(VipLevel value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'vipLevel',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipLevelGreaterThan(
    VipLevel value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'vipLevel',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipLevelLessThan(
    VipLevel value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'vipLevel',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterFilterCondition>
      vipLevelBetween(
    VipLevel lower,
    VipLevel upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'vipLevel',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension IsarMarketListingQueryObject
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QFilterCondition> {}

extension IsarMarketListingQueryLinks
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QFilterCondition> {}

extension IsarMarketListingQuerySortBy
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QSortBy> {
  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByBoostExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostExpiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByBoostExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostExpiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByBoostLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostLevel', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByBoostLevelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostLevel', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByCurrency() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'currency', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByCurrencyDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'currency', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByIsFavorite() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFavorite', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByIsFavoriteDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFavorite', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByIsFeatured() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByIsFeaturedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByIsSellerVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isSellerVerified', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByIsSellerVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isSellerVerified', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByLocationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByLocationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByPriceAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'priceAmount', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByPriceAmountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'priceAmount', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySaleType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'saleType', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySaleTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'saleType', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySellerBadge() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadge', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySellerBadgeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadge', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySellerBadgeExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadgeExpiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySellerBadgeExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadgeExpiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByTitle() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByTitleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByViewsCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'viewsCount', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByViewsCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'viewsCount', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByVipExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipExpiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByVipExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipExpiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByVipLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipLevel', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      sortByVipLevelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipLevel', Sort.desc);
    });
  }
}

extension IsarMarketListingQuerySortThenBy
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QSortThenBy> {
  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByBoostExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostExpiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByBoostExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostExpiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByBoostLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostLevel', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByBoostLevelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'boostLevel', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByCurrency() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'currency', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByCurrencyDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'currency', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIsFavorite() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFavorite', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIsFavoriteDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFavorite', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIsFeatured() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIsFeaturedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIsSellerVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isSellerVerified', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByIsSellerVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isSellerVerified', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByLocationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByLocationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByPriceAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'priceAmount', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByPriceAmountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'priceAmount', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySaleType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'saleType', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySaleTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'saleType', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySellerBadge() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadge', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySellerBadgeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadge', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySellerBadgeExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadgeExpiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySellerBadgeExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerBadgeExpiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByTitle() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByTitleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByViewsCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'viewsCount', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByViewsCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'viewsCount', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByVipExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipExpiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByVipExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipExpiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByVipLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipLevel', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QAfterSortBy>
      thenByVipLevelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'vipLevel', Sort.desc);
    });
  }
}

extension IsarMarketListingQueryWhereDistinct
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct> {
  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByBoostExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'boostExpiresAt');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByBoostLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'boostLevel');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByCurrency({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'currency', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByDescription({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'description', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByDisciplineTags() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'disciplineTags');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByDocumentTags() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'documentTags');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByHorseId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByIsFavorite() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isFavorite');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByIsFeatured() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isFeatured');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByIsSellerVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isSellerVerified');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByLocationLabel({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'locationLabel',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByMediaUrls() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'mediaUrls');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByPriceAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'priceAmount');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctBySaleType() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'saleType');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctBySellerBadge() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerBadge');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctBySellerBadgeExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerBadgeExpiresAt');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctBySellerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct> distinctByTitle(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'title', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByViewsCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'viewsCount');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByVipExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'vipExpiresAt');
    });
  }

  QueryBuilder<IsarMarketListing, IsarMarketListing, QDistinct>
      distinctByVipLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'vipLevel');
    });
  }
}

extension IsarMarketListingQueryProperty
    on QueryBuilder<IsarMarketListing, IsarMarketListing, QQueryProperty> {
  QueryBuilder<IsarMarketListing, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarMarketListing, DateTime?, QQueryOperations>
      boostExpiresAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'boostExpiresAt');
    });
  }

  QueryBuilder<IsarMarketListing, BoostLevel, QQueryOperations>
      boostLevelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'boostLevel');
    });
  }

  QueryBuilder<IsarMarketListing, DateTime, QQueryOperations>
      createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations> currencyProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'currency');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations>
      descriptionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'description');
    });
  }

  QueryBuilder<IsarMarketListing, List<String>, QQueryOperations>
      disciplineTagsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'disciplineTags');
    });
  }

  QueryBuilder<IsarMarketListing, List<String>, QQueryOperations>
      documentTagsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'documentTags');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations> horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarMarketListing, bool, QQueryOperations> isFavoriteProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isFavorite');
    });
  }

  QueryBuilder<IsarMarketListing, bool, QQueryOperations> isFeaturedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isFeatured');
    });
  }

  QueryBuilder<IsarMarketListing, bool, QQueryOperations>
      isSellerVerifiedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isSellerVerified');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations>
      locationLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationLabel');
    });
  }

  QueryBuilder<IsarMarketListing, List<String>, QQueryOperations>
      mediaUrlsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'mediaUrls');
    });
  }

  QueryBuilder<IsarMarketListing, int, QQueryOperations> priceAmountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'priceAmount');
    });
  }

  QueryBuilder<IsarMarketListing, MarketSaleType, QQueryOperations>
      saleTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'saleType');
    });
  }

  QueryBuilder<IsarMarketListing, SellerBadgeType, QQueryOperations>
      sellerBadgeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerBadge');
    });
  }

  QueryBuilder<IsarMarketListing, DateTime?, QQueryOperations>
      sellerBadgeExpiresAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerBadgeExpiresAt');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations> sellerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerId');
    });
  }

  QueryBuilder<IsarMarketListing, MarketListingStatus, QQueryOperations>
      statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarMarketListing, String, QQueryOperations> titleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'title');
    });
  }

  QueryBuilder<IsarMarketListing, DateTime, QQueryOperations>
      updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }

  QueryBuilder<IsarMarketListing, int, QQueryOperations> viewsCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'viewsCount');
    });
  }

  QueryBuilder<IsarMarketListing, DateTime?, QQueryOperations>
      vipExpiresAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'vipExpiresAt');
    });
  }

  QueryBuilder<IsarMarketListing, VipLevel, QQueryOperations>
      vipLevelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'vipLevel');
    });
  }
}
