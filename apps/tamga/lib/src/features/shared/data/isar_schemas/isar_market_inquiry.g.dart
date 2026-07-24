// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_market_inquiry.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarMarketInquiryCollection on Isar {
  IsarCollection<IsarMarketInquiry> get isarMarketInquirys => this.collection();
}

const IsarMarketInquirySchema = CollectionSchema(
  name: r'IsarMarketInquiry',
  id: -826948826644173561,
  properties: {
    r'buyerId': PropertySchema(
      id: 0,
      name: r'buyerId',
      type: IsarType.string,
    ),
    r'createdAt': PropertySchema(
      id: 1,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'domainId': PropertySchema(
      id: 2,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'listingId': PropertySchema(
      id: 3,
      name: r'listingId',
      type: IsarType.string,
    ),
    r'sellerId': PropertySchema(
      id: 4,
      name: r'sellerId',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: 5,
      name: r'status',
      type: IsarType.byte,
      enumMap: _IsarMarketInquirystatusEnumValueMap,
    ),
    r'updatedAt': PropertySchema(
      id: 6,
      name: r'updatedAt',
      type: IsarType.dateTime,
    )
  },
  estimateSize: _isarMarketInquiryEstimateSize,
  serialize: _isarMarketInquirySerialize,
  deserialize: _isarMarketInquiryDeserialize,
  deserializeProp: _isarMarketInquiryDeserializeProp,
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
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarMarketInquiryGetId,
  getLinks: _isarMarketInquiryGetLinks,
  attach: _isarMarketInquiryAttach,
  version: '3.1.0+1',
);

int _isarMarketInquiryEstimateSize(
  IsarMarketInquiry object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.buyerId.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.listingId.length * 3;
  bytesCount += 3 + object.sellerId.length * 3;
  return bytesCount;
}

void _isarMarketInquirySerialize(
  IsarMarketInquiry object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.buyerId);
  writer.writeDateTime(offsets[1], object.createdAt);
  writer.writeString(offsets[2], object.domainId);
  writer.writeString(offsets[3], object.listingId);
  writer.writeString(offsets[4], object.sellerId);
  writer.writeByte(offsets[5], object.status.index);
  writer.writeDateTime(offsets[6], object.updatedAt);
}

IsarMarketInquiry _isarMarketInquiryDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarMarketInquiry();
  object.buyerId = reader.readString(offsets[0]);
  object.createdAt = reader.readDateTime(offsets[1]);
  object.domainId = reader.readString(offsets[2]);
  object.id = id;
  object.listingId = reader.readString(offsets[3]);
  object.sellerId = reader.readString(offsets[4]);
  object.status =
      _IsarMarketInquirystatusValueEnumMap[reader.readByteOrNull(offsets[5])] ??
          MarketInquiryStatus.newInquiry;
  object.updatedAt = reader.readDateTime(offsets[6]);
  return object;
}

P _isarMarketInquiryDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (_IsarMarketInquirystatusValueEnumMap[
              reader.readByteOrNull(offset)] ??
          MarketInquiryStatus.newInquiry) as P;
    case 6:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarMarketInquirystatusEnumValueMap = {
  'newInquiry': 0,
  'sellerReplied': 1,
  'viewingScheduled': 2,
  'vetCheck': 3,
  'offer': 4,
  'sold': 5,
  'closed': 6,
};
const _IsarMarketInquirystatusValueEnumMap = {
  0: MarketInquiryStatus.newInquiry,
  1: MarketInquiryStatus.sellerReplied,
  2: MarketInquiryStatus.viewingScheduled,
  3: MarketInquiryStatus.vetCheck,
  4: MarketInquiryStatus.offer,
  5: MarketInquiryStatus.sold,
  6: MarketInquiryStatus.closed,
};

Id _isarMarketInquiryGetId(IsarMarketInquiry object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarMarketInquiryGetLinks(
    IsarMarketInquiry object) {
  return [];
}

void _isarMarketInquiryAttach(
    IsarCollection<dynamic> col, Id id, IsarMarketInquiry object) {
  object.id = id;
}

extension IsarMarketInquiryByIndex on IsarCollection<IsarMarketInquiry> {
  Future<IsarMarketInquiry?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarMarketInquiry? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarMarketInquiry?>> getAllByDomainId(
      List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarMarketInquiry?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarMarketInquiry object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarMarketInquiry object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarMarketInquiry> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(List<IsarMarketInquiry> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarMarketInquiryQueryWhereSort
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QWhere> {
  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarMarketInquiryQueryWhere
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QWhereClause> {
  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
      domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'domainId',
        value: [domainId],
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterWhereClause>
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
}

extension IsarMarketInquiryQueryFilter
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QFilterCondition> {
  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'buyerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'buyerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'buyerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'buyerId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'buyerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'buyerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'buyerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'buyerId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'buyerId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      buyerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'buyerId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      domainIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      domainIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'domainId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'listingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'listingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'listingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'listingId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'listingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'listingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'listingId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'listingId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'listingId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      listingIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'listingId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      sellerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'sellerId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      sellerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'sellerId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      sellerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sellerId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      sellerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'sellerId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      statusEqualTo(MarketInquiryStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      statusGreaterThan(
    MarketInquiryStatus value, {
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      statusLessThan(
    MarketInquiryStatus value, {
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      statusBetween(
    MarketInquiryStatus lower,
    MarketInquiryStatus upper, {
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
      updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'updatedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterFilterCondition>
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
}

extension IsarMarketInquiryQueryObject
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QFilterCondition> {}

extension IsarMarketInquiryQueryLinks
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QFilterCondition> {}

extension IsarMarketInquiryQuerySortBy
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QSortBy> {
  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByBuyerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByBuyerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByListingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByListingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarMarketInquiryQuerySortThenBy
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QSortThenBy> {
  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByBuyerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByBuyerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByListingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByListingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QAfterSortBy>
      thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarMarketInquiryQueryWhereDistinct
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct> {
  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctByBuyerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'buyerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctByListingId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'listingId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctBySellerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status');
    });
  }

  QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QDistinct>
      distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }
}

extension IsarMarketInquiryQueryProperty
    on QueryBuilder<IsarMarketInquiry, IsarMarketInquiry, QQueryProperty> {
  QueryBuilder<IsarMarketInquiry, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarMarketInquiry, String, QQueryOperations> buyerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'buyerId');
    });
  }

  QueryBuilder<IsarMarketInquiry, DateTime, QQueryOperations>
      createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarMarketInquiry, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarMarketInquiry, String, QQueryOperations>
      listingIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'listingId');
    });
  }

  QueryBuilder<IsarMarketInquiry, String, QQueryOperations> sellerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerId');
    });
  }

  QueryBuilder<IsarMarketInquiry, MarketInquiryStatus, QQueryOperations>
      statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarMarketInquiry, DateTime, QQueryOperations>
      updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
