// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_trial_booking.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarTrialBookingCollection on Isar {
  IsarCollection<IsarTrialBooking> get isarTrialBookings => this.collection();
}

const IsarTrialBookingSchema = CollectionSchema(
  name: r'IsarTrialBooking',
  id: 2296828737237666454,
  properties: {
    r'buyerId': PropertySchema(id: 0, name: r'buyerId', type: IsarType.string),
    r'domainId': PropertySchema(
      id: 1,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'listingId': PropertySchema(
      id: 2,
      name: r'listingId',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(id: 3, name: r'notes', type: IsarType.string),
    r'requestedAt': PropertySchema(
      id: 4,
      name: r'requestedAt',
      type: IsarType.dateTime,
    ),
    r'respondedAt': PropertySchema(
      id: 5,
      name: r'respondedAt',
      type: IsarType.dateTime,
    ),
    r'sellerId': PropertySchema(
      id: 6,
      name: r'sellerId',
      type: IsarType.string,
    ),
    r'slotId': PropertySchema(id: 7, name: r'slotId', type: IsarType.string),
    r'status': PropertySchema(id: 8, name: r'status', type: IsarType.string),
  },
  estimateSize: _isarTrialBookingEstimateSize,
  serialize: _isarTrialBookingSerialize,
  deserialize: _isarTrialBookingDeserialize,
  deserializeProp: _isarTrialBookingDeserializeProp,
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
    r'slotId': IndexSchema(
      id: -665048265905431799,
      name: r'slotId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'slotId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'buyerId': IndexSchema(
      id: 720979758479371927,
      name: r'buyerId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'buyerId',
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
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarTrialBookingGetId,
  getLinks: _isarTrialBookingGetLinks,
  attach: _isarTrialBookingAttach,
  version: '3.1.0+1',
);

int _isarTrialBookingEstimateSize(
  IsarTrialBooking object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.buyerId.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.listingId.length * 3;
  {
    final value = object.notes;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.sellerId.length * 3;
  bytesCount += 3 + object.slotId.length * 3;
  bytesCount += 3 + object.status.length * 3;
  return bytesCount;
}

void _isarTrialBookingSerialize(
  IsarTrialBooking object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.buyerId);
  writer.writeString(offsets[1], object.domainId);
  writer.writeString(offsets[2], object.listingId);
  writer.writeString(offsets[3], object.notes);
  writer.writeDateTime(offsets[4], object.requestedAt);
  writer.writeDateTime(offsets[5], object.respondedAt);
  writer.writeString(offsets[6], object.sellerId);
  writer.writeString(offsets[7], object.slotId);
  writer.writeString(offsets[8], object.status);
}

IsarTrialBooking _isarTrialBookingDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarTrialBooking();
  object.buyerId = reader.readString(offsets[0]);
  object.domainId = reader.readString(offsets[1]);
  object.id = id;
  object.listingId = reader.readString(offsets[2]);
  object.notes = reader.readStringOrNull(offsets[3]);
  object.requestedAt = reader.readDateTimeOrNull(offsets[4]);
  object.respondedAt = reader.readDateTimeOrNull(offsets[5]);
  object.sellerId = reader.readString(offsets[6]);
  object.slotId = reader.readString(offsets[7]);
  object.status = reader.readString(offsets[8]);
  return object;
}

P _isarTrialBookingDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readStringOrNull(offset)) as P;
    case 4:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 5:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarTrialBookingGetId(IsarTrialBooking object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarTrialBookingGetLinks(IsarTrialBooking object) {
  return [];
}

void _isarTrialBookingAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarTrialBooking object,
) {
  object.id = id;
}

extension IsarTrialBookingByIndex on IsarCollection<IsarTrialBooking> {
  Future<IsarTrialBooking?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarTrialBooking? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarTrialBooking?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarTrialBooking?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarTrialBooking object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarTrialBooking object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarTrialBooking> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarTrialBooking> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarTrialBookingQueryWhereSort
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QWhere> {
  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarTrialBookingQueryWhere
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QWhereClause> {
  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause> idEqualTo(
    Id id,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  listingIdEqualTo(String listingId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'listingId', value: [listingId]),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  slotIdEqualTo(String slotId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'slotId', value: [slotId]),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  slotIdNotEqualTo(String slotId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'slotId',
                lower: [],
                upper: [slotId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'slotId',
                lower: [slotId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'slotId',
                lower: [slotId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'slotId',
                lower: [],
                upper: [slotId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  buyerIdEqualTo(String buyerId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'buyerId', value: [buyerId]),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  buyerIdNotEqualTo(String buyerId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'buyerId',
                lower: [],
                upper: [buyerId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'buyerId',
                lower: [buyerId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'buyerId',
                lower: [buyerId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'buyerId',
                lower: [],
                upper: [buyerId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
  sellerIdEqualTo(String sellerId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'sellerId', value: [sellerId]),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterWhereClause>
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
}

extension IsarTrialBookingQueryFilter
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QFilterCondition> {
  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  buyerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'buyerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  buyerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'buyerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  listingIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'listingId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  listingIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'listingId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'notes'),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'notes'),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'notes',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'notes',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  requestedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'requestedAt'),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  requestedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'requestedAt'),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  requestedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'requestedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  requestedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'requestedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  requestedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'requestedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  requestedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'requestedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  respondedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'respondedAt'),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  respondedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'respondedAt'),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  respondedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'respondedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  respondedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'respondedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  respondedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'respondedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  respondedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'respondedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  sellerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  sellerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'slotId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'slotId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'slotId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'slotId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'slotId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'slotId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'slotId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'slotId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'slotId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  slotIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'slotId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'status',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'status',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterFilterCondition>
  statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'status', value: ''),
      );
    });
  }
}

extension IsarTrialBookingQueryObject
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QFilterCondition> {}

extension IsarTrialBookingQueryLinks
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QFilterCondition> {}

extension IsarTrialBookingQuerySortBy
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QSortBy> {
  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByBuyerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByBuyerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByListingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByListingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy> sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByRequestedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'requestedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByRequestedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'requestedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByRespondedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'respondedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByRespondedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'respondedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortBySlotId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'slotId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortBySlotIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'slotId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }
}

extension IsarTrialBookingQuerySortThenBy
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QSortThenBy> {
  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByBuyerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByBuyerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'buyerId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByListingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByListingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'listingId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy> thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByRequestedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'requestedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByRequestedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'requestedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByRespondedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'respondedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByRespondedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'respondedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenBySlotId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'slotId', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenBySlotIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'slotId', Sort.desc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QAfterSortBy>
  thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }
}

extension IsarTrialBookingQueryWhereDistinct
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct> {
  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct>
  distinctByBuyerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'buyerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct>
  distinctByListingId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'listingId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct> distinctByNotes({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct>
  distinctByRequestedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'requestedAt');
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct>
  distinctByRespondedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'respondedAt');
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct>
  distinctBySellerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct> distinctBySlotId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'slotId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTrialBooking, IsarTrialBooking, QDistinct> distinctByStatus({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }
}

extension IsarTrialBookingQueryProperty
    on QueryBuilder<IsarTrialBooking, IsarTrialBooking, QQueryProperty> {
  QueryBuilder<IsarTrialBooking, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarTrialBooking, String, QQueryOperations> buyerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'buyerId');
    });
  }

  QueryBuilder<IsarTrialBooking, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarTrialBooking, String, QQueryOperations> listingIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'listingId');
    });
  }

  QueryBuilder<IsarTrialBooking, String?, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarTrialBooking, DateTime?, QQueryOperations>
  requestedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'requestedAt');
    });
  }

  QueryBuilder<IsarTrialBooking, DateTime?, QQueryOperations>
  respondedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'respondedAt');
    });
  }

  QueryBuilder<IsarTrialBooking, String, QQueryOperations> sellerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerId');
    });
  }

  QueryBuilder<IsarTrialBooking, String, QQueryOperations> slotIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'slotId');
    });
  }

  QueryBuilder<IsarTrialBooking, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }
}
