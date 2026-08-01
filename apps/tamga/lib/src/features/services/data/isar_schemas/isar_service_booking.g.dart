// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_service_booking.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarServiceBookingCollection on Isar {
  IsarCollection<IsarServiceBooking> get isarServiceBookings =>
      this.collection();
}

final IsarServiceBookingSchema = CollectionSchema(
  name: r'IsarServiceBooking',
  id: int.parse('6554383272419625858'),
  properties: {
    r'address': PropertySchema(
      id: int.parse('0'),
      name: r'address',
      type: IsarType.string,
    ),
    r'bookingDate': PropertySchema(
      id: int.parse('1'),
      name: r'bookingDate',
      type: IsarType.dateTime,
    ),
    r'createdAt': PropertySchema(
      id: int.parse('2'),
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'domainId': PropertySchema(
      id: int.parse('3'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'horseIds': PropertySchema(
      id: int.parse('4'),
      name: r'horseIds',
      type: IsarType.stringList,
    ),
    r'locationAimag': PropertySchema(
      id: int.parse('5'),
      name: r'locationAimag',
      type: IsarType.string,
    ),
    r'locationSum': PropertySchema(
      id: int.parse('6'),
      name: r'locationSum',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(
      id: int.parse('7'),
      name: r'notes',
      type: IsarType.string,
    ),
    r'providerId': PropertySchema(
      id: int.parse('8'),
      name: r'providerId',
      type: IsarType.string,
    ),
    r'providerType': PropertySchema(
      id: int.parse('9'),
      name: r'providerType',
      type: IsarType.byte,
      enumMap: _IsarServiceBookingproviderTypeEnumValueMap,
    ),
    r'serviceType': PropertySchema(
      id: int.parse('10'),
      name: r'serviceType',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: int.parse('11'),
      name: r'status',
      type: IsarType.byte,
      enumMap: _IsarServiceBookingstatusEnumValueMap,
    ),
    r'totalAmount': PropertySchema(
      id: int.parse('12'),
      name: r'totalAmount',
      type: IsarType.long,
    ),
    r'updatedAt': PropertySchema(
      id: int.parse('13'),
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
    r'userId': PropertySchema(
      id: int.parse('14'),
      name: r'userId',
      type: IsarType.string,
    ),
  },
  estimateSize: _isarServiceBookingEstimateSize,
  serialize: _isarServiceBookingSerialize,
  deserialize: _isarServiceBookingDeserialize,
  deserializeProp: _isarServiceBookingDeserializeProp,
  idName: r'id',
  indexes: {
    r'domainId': IndexSchema(
      id: int.parse('-9138809277110658179'),
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
    r'userId': IndexSchema(
      id: int.parse('-2005826577402374815'),
      name: r'userId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'userId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'createdAt': IndexSchema(
      id: int.parse('-3433535483987302584'),
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
  getId: _isarServiceBookingGetId,
  getLinks: _isarServiceBookingGetLinks,
  attach: _isarServiceBookingAttach,
  version: '3.1.0+1',
);

int _isarServiceBookingEstimateSize(
  IsarServiceBooking object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.address;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.horseIds.length * 3;
  {
    for (var i = 0; i < object.horseIds.length; i++) {
      final value = object.horseIds[i];
      bytesCount += value.length * 3;
    }
  }
  {
    final value = object.locationAimag;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.locationSum;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.notes;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.providerId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.serviceType.length * 3;
  bytesCount += 3 + object.userId.length * 3;
  return bytesCount;
}

void _isarServiceBookingSerialize(
  IsarServiceBooking object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.address);
  writer.writeDateTime(offsets[1], object.bookingDate);
  writer.writeDateTime(offsets[2], object.createdAt);
  writer.writeString(offsets[3], object.domainId);
  writer.writeStringList(offsets[4], object.horseIds);
  writer.writeString(offsets[5], object.locationAimag);
  writer.writeString(offsets[6], object.locationSum);
  writer.writeString(offsets[7], object.notes);
  writer.writeString(offsets[8], object.providerId);
  writer.writeByte(offsets[9], object.providerType.index);
  writer.writeString(offsets[10], object.serviceType);
  writer.writeByte(offsets[11], object.status.index);
  writer.writeLong(offsets[12], object.totalAmount);
  writer.writeDateTime(offsets[13], object.updatedAt);
  writer.writeString(offsets[14], object.userId);
}

IsarServiceBooking _isarServiceBookingDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarServiceBooking();
  object.address = reader.readStringOrNull(offsets[0]);
  object.bookingDate = reader.readDateTime(offsets[1]);
  object.createdAt = reader.readDateTime(offsets[2]);
  object.domainId = reader.readString(offsets[3]);
  object.horseIds = reader.readStringList(offsets[4]) ?? [];
  object.id = id;
  object.locationAimag = reader.readStringOrNull(offsets[5]);
  object.locationSum = reader.readStringOrNull(offsets[6]);
  object.notes = reader.readStringOrNull(offsets[7]);
  object.providerId = reader.readStringOrNull(offsets[8]);
  object.providerType =
      _IsarServiceBookingproviderTypeValueEnumMap[reader.readByteOrNull(
        offsets[9],
      )] ??
      ServiceProviderType.photographer;
  object.serviceType = reader.readString(offsets[10]);
  object.status =
      _IsarServiceBookingstatusValueEnumMap[reader.readByteOrNull(
        offsets[11],
      )] ??
      ServiceBookingStatus.pending;
  object.totalAmount = reader.readLongOrNull(offsets[12]);
  object.updatedAt = reader.readDateTime(offsets[13]);
  object.userId = reader.readString(offsets[14]);
  return object;
}

P _isarServiceBookingDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringOrNull(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readDateTime(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readStringList(offset) ?? []) as P;
    case 5:
      return (reader.readStringOrNull(offset)) as P;
    case 6:
      return (reader.readStringOrNull(offset)) as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readStringOrNull(offset)) as P;
    case 9:
      return (_IsarServiceBookingproviderTypeValueEnumMap[reader.readByteOrNull(
                offset,
              )] ??
              ServiceProviderType.photographer)
          as P;
    case 10:
      return (reader.readString(offset)) as P;
    case 11:
      return (_IsarServiceBookingstatusValueEnumMap[reader.readByteOrNull(
                offset,
              )] ??
              ServiceBookingStatus.pending)
          as P;
    case 12:
      return (reader.readLongOrNull(offset)) as P;
    case 13:
      return (reader.readDateTime(offset)) as P;
    case 14:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarServiceBookingproviderTypeEnumValueMap = {
  'photographer': 0,
  'vet': 1,
};
const _IsarServiceBookingproviderTypeValueEnumMap = {
  0: ServiceProviderType.photographer,
  1: ServiceProviderType.vet,
};
const _IsarServiceBookingstatusEnumValueMap = {
  'pending': 0,
  'confirmed': 1,
  'completed': 2,
  'cancelled': 3,
};
const _IsarServiceBookingstatusValueEnumMap = {
  0: ServiceBookingStatus.pending,
  1: ServiceBookingStatus.confirmed,
  2: ServiceBookingStatus.completed,
  3: ServiceBookingStatus.cancelled,
};

Id _isarServiceBookingGetId(IsarServiceBooking object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarServiceBookingGetLinks(
  IsarServiceBooking object,
) {
  return [];
}

void _isarServiceBookingAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarServiceBooking object,
) {
  object.id = id;
}

extension IsarServiceBookingByIndex on IsarCollection<IsarServiceBooking> {
  Future<IsarServiceBooking?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarServiceBooking? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarServiceBooking?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarServiceBooking?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarServiceBooking object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarServiceBooking object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarServiceBooking> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarServiceBooking> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarServiceBookingQueryWhereSort
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QWhere> {
  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhere>
  anyCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'createdAt'),
      );
    });
  }
}

extension IsarServiceBookingQueryWhere
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QWhereClause> {
  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  idBetween(
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  userIdEqualTo(String userId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'userId', value: [userId]),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  userIdNotEqualTo(String userId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'userId',
                lower: [],
                upper: [userId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'userId',
                lower: [userId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'userId',
                lower: [userId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'userId',
                lower: [],
                upper: [userId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
  createdAtEqualTo(DateTime createdAt) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'createdAt', value: [createdAt]),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterWhereClause>
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

extension IsarServiceBookingQueryFilter
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QFilterCondition> {
  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'address'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'address'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'address',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'address',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'address', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  addressIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'address', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  bookingDateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'bookingDate', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  bookingDateGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'bookingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  bookingDateLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'bookingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  bookingDateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'bookingDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'horseIds',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'horseIds',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'horseIds',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'horseIds',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'horseIds',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'horseIds',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'horseIds',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'horseIds',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseIds', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseIds', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'horseIds', length, true, length, true);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'horseIds', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'horseIds', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'horseIds', 0, true, length, include);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'horseIds', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  horseIdsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'horseIds',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'locationAimag'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'locationAimag'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationAimag',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationAimag',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationAimag', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationAimagIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationAimag', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'locationSum'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'locationSum'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationSum',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationSum',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationSum', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  locationSumIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationSum', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  notesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'notes'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  notesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'notes'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
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

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'providerId'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'providerId'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'providerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'providerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'providerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'providerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerTypeEqualTo(ServiceProviderType value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'providerType', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerTypeGreaterThan(ServiceProviderType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'providerType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerTypeLessThan(ServiceProviderType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'providerType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  providerTypeBetween(
    ServiceProviderType lower,
    ServiceProviderType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'providerType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'serviceType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'serviceType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'serviceType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'serviceType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'serviceType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'serviceType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'serviceType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'serviceType',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'serviceType', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  serviceTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'serviceType', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  statusEqualTo(ServiceBookingStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'status', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  statusGreaterThan(ServiceBookingStatus value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'status',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  statusLessThan(ServiceBookingStatus value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'status',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  statusBetween(
    ServiceBookingStatus lower,
    ServiceBookingStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'status',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  totalAmountIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'totalAmount'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  totalAmountIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'totalAmount'),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  totalAmountEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'totalAmount', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  totalAmountGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'totalAmount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  totalAmountLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'totalAmount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  totalAmountBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'totalAmount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  updatedAtGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'updatedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  updatedAtLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'updatedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  updatedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'updatedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'userId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'userId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'userId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'userId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'userId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'userId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'userId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'userId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'userId', value: ''),
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterFilterCondition>
  userIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'userId', value: ''),
      );
    });
  }
}

extension IsarServiceBookingQueryObject
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QFilterCondition> {}

extension IsarServiceBookingQueryLinks
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QFilterCondition> {}

extension IsarServiceBookingQuerySortBy
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QSortBy> {
  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByAddress() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByAddressDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByBookingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bookingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByBookingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bookingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByLocationAimag() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByLocationAimagDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByLocationSum() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByLocationSumDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByProviderId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByProviderIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByProviderType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerType', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByProviderTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerType', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByServiceType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'serviceType', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByServiceTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'serviceType', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByTotalAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalAmount', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByTotalAmountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalAmount', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByUserId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'userId', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  sortByUserIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'userId', Sort.desc);
    });
  }
}

extension IsarServiceBookingQuerySortThenBy
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QSortThenBy> {
  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByAddress() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByAddressDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByBookingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bookingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByBookingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bookingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByLocationAimag() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByLocationAimagDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByLocationSum() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByLocationSumDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByProviderId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByProviderIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByProviderType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerType', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByProviderTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerType', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByServiceType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'serviceType', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByServiceTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'serviceType', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByTotalAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalAmount', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByTotalAmountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalAmount', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByUserId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'userId', Sort.asc);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QAfterSortBy>
  thenByUserIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'userId', Sort.desc);
    });
  }
}

extension IsarServiceBookingQueryWhereDistinct
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct> {
  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByAddress({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'address', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByBookingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'bookingDate');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByHorseIds() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseIds');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByLocationAimag({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'locationAimag',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByLocationSum({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'locationSum', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByNotes({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByProviderId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'providerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByProviderType() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'providerType');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByServiceType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'serviceType', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByTotalAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'totalAmount');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }

  QueryBuilder<IsarServiceBooking, IsarServiceBooking, QDistinct>
  distinctByUserId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'userId', caseSensitive: caseSensitive);
    });
  }
}

extension IsarServiceBookingQueryProperty
    on QueryBuilder<IsarServiceBooking, IsarServiceBooking, QQueryProperty> {
  QueryBuilder<IsarServiceBooking, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarServiceBooking, String?, QQueryOperations>
  addressProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'address');
    });
  }

  QueryBuilder<IsarServiceBooking, DateTime, QQueryOperations>
  bookingDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'bookingDate');
    });
  }

  QueryBuilder<IsarServiceBooking, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarServiceBooking, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarServiceBooking, List<String>, QQueryOperations>
  horseIdsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseIds');
    });
  }

  QueryBuilder<IsarServiceBooking, String?, QQueryOperations>
  locationAimagProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationAimag');
    });
  }

  QueryBuilder<IsarServiceBooking, String?, QQueryOperations>
  locationSumProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationSum');
    });
  }

  QueryBuilder<IsarServiceBooking, String?, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarServiceBooking, String?, QQueryOperations>
  providerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'providerId');
    });
  }

  QueryBuilder<IsarServiceBooking, ServiceProviderType, QQueryOperations>
  providerTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'providerType');
    });
  }

  QueryBuilder<IsarServiceBooking, String, QQueryOperations>
  serviceTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'serviceType');
    });
  }

  QueryBuilder<IsarServiceBooking, ServiceBookingStatus, QQueryOperations>
  statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarServiceBooking, int?, QQueryOperations>
  totalAmountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'totalAmount');
    });
  }

  QueryBuilder<IsarServiceBooking, DateTime, QQueryOperations>
  updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }

  QueryBuilder<IsarServiceBooking, String, QQueryOperations> userIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'userId');
    });
  }
}
