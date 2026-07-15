// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_seller_rating.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarSellerRatingCollection on Isar {
  IsarCollection<IsarSellerRating> get isarSellerRatings => this.collection();
}

const IsarSellerRatingSchema = CollectionSchema(
  name: r'IsarSellerRating',
  id: -7471720961247538377,
  properties: {
    r'buyerId': PropertySchema(id: 0, name: r'buyerId', type: IsarType.string),
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
    r'rating': PropertySchema(id: 4, name: r'rating', type: IsarType.long),
    r'responseAt': PropertySchema(
      id: 5,
      name: r'responseAt',
      type: IsarType.dateTime,
    ),
    r'review': PropertySchema(id: 6, name: r'review', type: IsarType.string),
    r'sellerId': PropertySchema(
      id: 7,
      name: r'sellerId',
      type: IsarType.string,
    ),
    r'sellerResponse': PropertySchema(
      id: 8,
      name: r'sellerResponse',
      type: IsarType.string,
    ),
  },
  estimateSize: _isarSellerRatingEstimateSize,
  serialize: _isarSellerRatingSerialize,
  deserialize: _isarSellerRatingDeserialize,
  deserializeProp: _isarSellerRatingDeserializeProp,
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
        ),
      ],
    ),
    r'listingId': IndexSchema(
      id: -7684668030872652461,
      name: r'listingId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'listingId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
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
        ),
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
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarSellerRatingGetId,
  getLinks: _isarSellerRatingGetLinks,
  attach: _isarSellerRatingAttach,
  version: '3.1.0+1',
);

int _isarSellerRatingEstimateSize(
  IsarSellerRating object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.buyerId.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.listingId.length * 3;
  bytesCount += 3 + object.review.length * 3;
  bytesCount += 3 + object.sellerId.length * 3;
  {
    final value = object.sellerResponse;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _isarSellerRatingSerialize(
  IsarSellerRating object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.buyerId);
  writer.writeDateTime(offsets[1], object.createdAt);
  writer.writeString(offsets[2], object.domainId);
  writer.writeString(offsets[3], object.listingId);
  writer.writeLong(offsets[4], object.rating);
  writer.writeDateTime(offsets[5], object.responseAt);
  writer.writeString(offsets[6], object.review);
  writer.writeString(offsets[7], object.sellerId);
  writer.writeString(offsets[8], object.sellerResponse);
}

IsarSellerRating _isarSellerRatingDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarSellerRating();
  object.buyerId = reader.readString(offsets[0]);
  object.createdAt = reader.readDateTime(offsets[1]);
  object.domainId = reader.readString(offsets[2]);
  object.id = id;
  object.listingId = reader.readString(offsets[3]);
  object.rating = reader.readLong(offsets[4]);
  object.responseAt = reader.readDateTimeOrNull(offsets[5]);
  object.review = reader.readString(offsets[6]);
  object.sellerId = reader.readString(offsets[7]);
  object.sellerResponse = reader.readStringOrNull(offsets[8]);
  return object;
}

P _isarSellerRatingDeserializeProp<P>(
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
      return (reader.readLong(offset)) as P;
    case 5:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readStringOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarSellerRatingGetId(IsarSellerRating object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarSellerRatingGetLinks(IsarSellerRating object) {
  return [];
}

void _isarSellerRatingAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarSellerRating object,
) {
  object.id = id;
}

extension IsarSellerRatingByIndex on IsarCollection<IsarSellerRating> {
  Future<IsarSellerRating?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarSellerRating? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarSellerRating?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarSellerRating?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarSellerRating object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarSellerRating object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarSellerRating> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarSellerRating> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarSellerRatingQueryWhereSort
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QWhere> {
  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhere> anyCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'createdAt'),
      );
    });
  }
}

extension IsarSellerRatingQueryWhere
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QWhereClause> {
  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause> idEqualTo(
    Id id,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
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

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.between(
          lower: lowerId,
          includeLower: includeLower,
          upper: upperId,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  domainIdNotEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'domainId',
                lower: [],
                upper: [domainId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'domainId',
                lower: [domainId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'domainId',
                lower: [domainId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'domainId',
                lower: [],
                upper: [domainId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  listingIdEqualTo(String listingId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'listingId', value: [listingId]),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  listingIdNotEqualTo(String listingId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'listingId',
                lower: [],
                upper: [listingId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'listingId',
                lower: [listingId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'listingId',
                lower: [listingId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'listingId',
                lower: [],
                upper: [listingId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  sellerIdEqualTo(String sellerId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'sellerId', value: [sellerId]),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  sellerIdNotEqualTo(String sellerId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sellerId',
                lower: [],
                upper: [sellerId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sellerId',
                lower: [sellerId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sellerId',
                lower: [sellerId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sellerId',
                lower: [],
                upper: [sellerId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  createdAtEqualTo(DateTime createdAt) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'createdAt', value: [createdAt]),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  createdAtNotEqualTo(DateTime createdAt) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'createdAt',
                lower: [],
                upper: [createdAt],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'createdAt',
                lower: [createdAt],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'createdAt',
                lower: [createdAt],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'createdAt',
                lower: [],
                upper: [createdAt],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  createdAtGreaterThan(DateTime createdAt, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'createdAt',
          lower: [createdAt],
          includeLower: include,
          upper: [],
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  createdAtLessThan(DateTime createdAt, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'createdAt',
          lower: [],
          upper: [createdAt],
          includeUpper: include,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterWhereClause>
  createdAtBetween(
    DateTime lowerCreatedAt,
    DateTime upperCreatedAt, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'createdAt',
          lower: [lowerCreatedAt],
          includeLower: includeLower,
          upper: [upperCreatedAt],
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarSellerRatingQueryFilter
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QFilterCondition> {
  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'buyerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'buyerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'buyerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'buyerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'buyerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'buyerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'buyerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'buyerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'buyerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  buyerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'buyerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  createdAtGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'createdAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  createdAtLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'createdAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  createdAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'createdAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'domainId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'domainId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'domainId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'domainId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'domainId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'domainId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'domainId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'domainId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  idGreaterThan(Id value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'id',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  idLessThan(Id value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'id',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'id',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'listingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'listingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'listingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'listingId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'listingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'listingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'listingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'listingId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'listingId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  listingIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'listingId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  ratingEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'rating', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  ratingGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'rating',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  ratingLessThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'rating',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  ratingBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'rating',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  responseAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'responseAt'),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  responseAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'responseAt'),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  responseAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'responseAt', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  responseAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'responseAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  responseAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'responseAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  responseAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'responseAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'review',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'review',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'review',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'review',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'review',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'review',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'review',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'review',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'review', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  reviewIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'review', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sellerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sellerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'sellerResponse'),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'sellerResponse'),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sellerResponse',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sellerResponse',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sellerResponse',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sellerResponse',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sellerResponse',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sellerResponse',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sellerResponse',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sellerResponse',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sellerResponse', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterFilterCondition>
  sellerResponseIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sellerResponse', value: ''),
      );
    });
  }
}

extension IsarSellerRatingQueryObject
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QFilterCondition> {}

extension IsarSellerRatingQueryLinks
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QFilterCondition> {}

extension IsarSellerRatingQuerySortBy
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QSortBy> {
  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByBuyerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByBuyerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByListingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByListingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByRating() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rating', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByRatingDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rating', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByResponseAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByResponseAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByReview() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'review', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortByReviewDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'review', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortBySellerResponse() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerResponse', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  sortBySellerResponseDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerResponse', Sort.desc);
    });
  }
}

extension IsarSellerRatingQuerySortThenBy
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QSortThenBy> {
  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByBuyerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByBuyerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByListingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByListingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByRating() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rating', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByRatingDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rating', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByResponseAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByResponseAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByReview() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'review', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenByReviewDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'review', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenBySellerResponse() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerResponse', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QAfterSortBy>
  thenBySellerResponseDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerResponse', Sort.desc);
    });
  }
}

extension IsarSellerRatingQueryWhereDistinct
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct> {
  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctByBuyerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'buyerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctByListingId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'listingId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctByRating() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'rating');
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctByResponseAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'responseAt');
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct> distinctByReview({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'review', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctBySellerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerRating, IsarSellerRating, QDistinct>
  distinctBySellerResponse({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'sellerResponse',
        caseSensitive: caseSensitive,
      );
    });
  }
}

extension IsarSellerRatingQueryProperty
    on QueryBuilder<IsarSellerRating, IsarSellerRating, QQueryProperty> {
  QueryBuilder<IsarSellerRating, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarSellerRating, String, QQueryOperations> buyerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'buyerId');
    });
  }

  QueryBuilder<IsarSellerRating, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarSellerRating, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarSellerRating, String, QQueryOperations> listingIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'listingId');
    });
  }

  QueryBuilder<IsarSellerRating, int, QQueryOperations> ratingProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'rating');
    });
  }

  QueryBuilder<IsarSellerRating, DateTime?, QQueryOperations>
  responseAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'responseAt');
    });
  }

  QueryBuilder<IsarSellerRating, String, QQueryOperations> reviewProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'review');
    });
  }

  QueryBuilder<IsarSellerRating, String, QQueryOperations> sellerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerId');
    });
  }

  QueryBuilder<IsarSellerRating, String?, QQueryOperations>
  sellerResponseProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerResponse');
    });
  }
}
