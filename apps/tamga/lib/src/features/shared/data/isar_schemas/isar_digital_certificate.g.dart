// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_digital_certificate.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarDigitalCertificateCollection on Isar {
  IsarCollection<IsarDigitalCertificate> get isarDigitalCertificates =>
      this.collection();
}

final IsarDigitalCertificateSchema = CollectionSchema(
  name: r'IsarDigitalCertificate',
  id: int.parse('5848469826314296659'),
  properties: {
    r'createdAt': PropertySchema(
      id: int.parse('0'),
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'dataAgeDays': PropertySchema(
      id: int.parse('1'),
      name: r'dataAgeDays',
      type: IsarType.long,
    ),
    r'domainId': PropertySchema(
      id: int.parse('2'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'expiryDate': PropertySchema(
      id: int.parse('3'),
      name: r'expiryDate',
      type: IsarType.dateTime,
    ),
    r'horseId': PropertySchema(
      id: int.parse('4'),
      name: r'horseId',
      type: IsarType.string,
    ),
    r'horseName': PropertySchema(
      id: int.parse('5'),
      name: r'horseName',
      type: IsarType.string,
    ),
    r'issueDate': PropertySchema(
      id: int.parse('6'),
      name: r'issueDate',
      type: IsarType.dateTime,
    ),
    r'ownerId': PropertySchema(
      id: int.parse('7'),
      name: r'ownerId',
      type: IsarType.string,
    ),
    r'ownerName': PropertySchema(
      id: int.parse('8'),
      name: r'ownerName',
      type: IsarType.string,
    ),
    r'previousOwnerId': PropertySchema(
      id: int.parse('9'),
      name: r'previousOwnerId',
      type: IsarType.string,
    ),
    r'qrCode': PropertySchema(
      id: int.parse('10'),
      name: r'qrCode',
      type: IsarType.string,
    ),
    r'registrationDate': PropertySchema(
      id: int.parse('11'),
      name: r'registrationDate',
      type: IsarType.dateTime,
    ),
    r'status': PropertySchema(
      id: int.parse('12'),
      name: r'status',
      type: IsarType.string,
    ),
    r'trustLevel': PropertySchema(
      id: int.parse('13'),
      name: r'trustLevel',
      type: IsarType.string,
    ),
    r'updatedAt': PropertySchema(
      id: int.parse('14'),
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarDigitalCertificateEstimateSize,
  serialize: _isarDigitalCertificateSerialize,
  deserialize: _isarDigitalCertificateDeserialize,
  deserializeProp: _isarDigitalCertificateDeserializeProp,
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
    r'horseId': IndexSchema(
      id: int.parse('-4681125749579367450'),
      name: r'horseId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'horseId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarDigitalCertificateGetId,
  getLinks: _isarDigitalCertificateGetLinks,
  attach: _isarDigitalCertificateAttach,
  version: '3.1.0+1',
);

int _isarDigitalCertificateEstimateSize(
  IsarDigitalCertificate object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.horseId.length * 3;
  {
    final value = object.horseName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.ownerId.length * 3;
  bytesCount += 3 + object.ownerName.length * 3;
  {
    final value = object.previousOwnerId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.qrCode.length * 3;
  bytesCount += 3 + object.status.length * 3;
  bytesCount += 3 + object.trustLevel.length * 3;
  return bytesCount;
}

void _isarDigitalCertificateSerialize(
  IsarDigitalCertificate object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.createdAt);
  writer.writeLong(offsets[1], object.dataAgeDays);
  writer.writeString(offsets[2], object.domainId);
  writer.writeDateTime(offsets[3], object.expiryDate);
  writer.writeString(offsets[4], object.horseId);
  writer.writeString(offsets[5], object.horseName);
  writer.writeDateTime(offsets[6], object.issueDate);
  writer.writeString(offsets[7], object.ownerId);
  writer.writeString(offsets[8], object.ownerName);
  writer.writeString(offsets[9], object.previousOwnerId);
  writer.writeString(offsets[10], object.qrCode);
  writer.writeDateTime(offsets[11], object.registrationDate);
  writer.writeString(offsets[12], object.status);
  writer.writeString(offsets[13], object.trustLevel);
  writer.writeDateTime(offsets[14], object.updatedAt);
}

IsarDigitalCertificate _isarDigitalCertificateDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarDigitalCertificate();
  object.createdAt = reader.readDateTime(offsets[0]);
  object.dataAgeDays = reader.readLongOrNull(offsets[1]);
  object.domainId = reader.readString(offsets[2]);
  object.expiryDate = reader.readDateTimeOrNull(offsets[3]);
  object.horseId = reader.readString(offsets[4]);
  object.horseName = reader.readStringOrNull(offsets[5]);
  object.id = id;
  object.issueDate = reader.readDateTimeOrNull(offsets[6]);
  object.ownerId = reader.readString(offsets[7]);
  object.ownerName = reader.readString(offsets[8]);
  object.previousOwnerId = reader.readStringOrNull(offsets[9]);
  object.qrCode = reader.readString(offsets[10]);
  object.registrationDate = reader.readDateTimeOrNull(offsets[11]);
  object.status = reader.readString(offsets[12]);
  object.trustLevel = reader.readString(offsets[13]);
  object.updatedAt = reader.readDateTime(offsets[14]);
  return object;
}

P _isarDigitalCertificateDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTime(offset)) as P;
    case 1:
      return (reader.readLongOrNull(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readStringOrNull(offset)) as P;
    case 6:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readStringOrNull(offset)) as P;
    case 10:
      return (reader.readString(offset)) as P;
    case 11:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 12:
      return (reader.readString(offset)) as P;
    case 13:
      return (reader.readString(offset)) as P;
    case 14:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarDigitalCertificateGetId(IsarDigitalCertificate object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarDigitalCertificateGetLinks(
  IsarDigitalCertificate object,
) {
  return [];
}

void _isarDigitalCertificateAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarDigitalCertificate object,
) {
  object.id = id;
}

extension IsarDigitalCertificateByIndex
    on IsarCollection<IsarDigitalCertificate> {
  Future<IsarDigitalCertificate?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarDigitalCertificate? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarDigitalCertificate?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarDigitalCertificate?> getAllByDomainIdSync(
    List<String> domainIdValues,
  ) {
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

  Future<Id> putByDomainId(IsarDigitalCertificate object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarDigitalCertificate object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarDigitalCertificate> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarDigitalCertificate> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarDigitalCertificateQueryWhereSort
    on QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QWhere> {
  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterWhere>
  anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarDigitalCertificateQueryWhere
    on
        QueryBuilder<
          IsarDigitalCertificate,
          IsarDigitalCertificate,
          QWhereClause
        > {
  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
  horseIdEqualTo(String horseId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'horseId', value: [horseId]),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterWhereClause
  >
  horseIdNotEqualTo(String horseId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [],
                upper: [horseId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [horseId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [horseId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [],
                upper: [horseId],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarDigitalCertificateQueryFilter
    on
        QueryBuilder<
          IsarDigitalCertificate,
          IsarDigitalCertificate,
          QFilterCondition
        > {
  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  dataAgeDaysIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'dataAgeDays'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  dataAgeDaysIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'dataAgeDays'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  dataAgeDaysEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'dataAgeDays', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  dataAgeDaysGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'dataAgeDays',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  dataAgeDaysLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'dataAgeDays',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  dataAgeDaysBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'dataAgeDays',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  expiryDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'expiryDate'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  expiryDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'expiryDate'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  expiryDateEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'expiryDate', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  expiryDateGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'expiryDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  expiryDateLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'expiryDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  expiryDateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'expiryDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'horseId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'horseId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'horseName'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'horseName'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'horseName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'horseName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'horseName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'horseName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'horseName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'horseName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'horseName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'horseName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  horseNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  issueDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'issueDate'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  issueDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'issueDate'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  issueDateEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'issueDate', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  issueDateGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'issueDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  issueDateLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'issueDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  issueDateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'issueDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'ownerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'ownerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'ownerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'ownerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'ownerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'ownerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'ownerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'ownerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'ownerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'ownerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'ownerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'ownerName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'ownerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'ownerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'ownerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'ownerName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerName', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  ownerNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerName', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'previousOwnerId'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'previousOwnerId'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'previousOwnerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'previousOwnerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'previousOwnerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'previousOwnerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'previousOwnerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'previousOwnerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'previousOwnerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'previousOwnerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'previousOwnerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  previousOwnerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'previousOwnerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'qrCode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'qrCode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'qrCode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'qrCode',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'qrCode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'qrCode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'qrCode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'qrCode',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'qrCode', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  qrCodeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'qrCode', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  registrationDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'registrationDate'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  registrationDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'registrationDate'),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  registrationDateEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'registrationDate', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  registrationDateGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'registrationDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  registrationDateLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'registrationDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  registrationDateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'registrationDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'trustLevel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'trustLevel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'trustLevel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'trustLevel',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'trustLevel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'trustLevel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'trustLevel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'trustLevel',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'trustLevel', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  trustLevelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'trustLevel', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
  updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarDigitalCertificate,
    IsarDigitalCertificate,
    QAfterFilterCondition
  >
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
}

extension IsarDigitalCertificateQueryObject
    on
        QueryBuilder<
          IsarDigitalCertificate,
          IsarDigitalCertificate,
          QFilterCondition
        > {}

extension IsarDigitalCertificateQueryLinks
    on
        QueryBuilder<
          IsarDigitalCertificate,
          IsarDigitalCertificate,
          QFilterCondition
        > {}

extension IsarDigitalCertificateQuerySortBy
    on QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QSortBy> {
  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByDataAgeDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataAgeDays', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByDataAgeDaysDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataAgeDays', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByExpiryDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiryDate', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByExpiryDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiryDate', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByIssueDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'issueDate', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByIssueDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'issueDate', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByOwnerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByOwnerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByPreviousOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'previousOwnerId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByPreviousOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'previousOwnerId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByQrCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrCode', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByQrCodeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrCode', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByRegistrationDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByTrustLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'trustLevel', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByTrustLevelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'trustLevel', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarDigitalCertificateQuerySortThenBy
    on
        QueryBuilder<
          IsarDigitalCertificate,
          IsarDigitalCertificate,
          QSortThenBy
        > {
  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByDataAgeDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataAgeDays', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByDataAgeDaysDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataAgeDays', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByExpiryDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiryDate', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByExpiryDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiryDate', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByIssueDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'issueDate', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByIssueDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'issueDate', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByOwnerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByOwnerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByPreviousOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'previousOwnerId', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByPreviousOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'previousOwnerId', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByQrCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrCode', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByQrCodeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrCode', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByRegistrationDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByTrustLevel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'trustLevel', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByTrustLevelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'trustLevel', Sort.desc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QAfterSortBy>
  thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarDigitalCertificateQueryWhereDistinct
    on QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct> {
  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByDataAgeDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'dataAgeDays');
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByExpiryDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'expiryDate');
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByHorseId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByHorseName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByIssueDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'issueDate');
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByOwnerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByOwnerName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByPreviousOwnerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'previousOwnerId',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByQrCode({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'qrCode', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'registrationDate');
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByStatus({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByTrustLevel({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'trustLevel', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarDigitalCertificate, IsarDigitalCertificate, QDistinct>
  distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }
}

extension IsarDigitalCertificateQueryProperty
    on
        QueryBuilder<
          IsarDigitalCertificate,
          IsarDigitalCertificate,
          QQueryProperty
        > {
  QueryBuilder<IsarDigitalCertificate, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarDigitalCertificate, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarDigitalCertificate, int?, QQueryOperations>
  dataAgeDaysProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'dataAgeDays');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarDigitalCertificate, DateTime?, QQueryOperations>
  expiryDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'expiryDate');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String?, QQueryOperations>
  horseNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseName');
    });
  }

  QueryBuilder<IsarDigitalCertificate, DateTime?, QQueryOperations>
  issueDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'issueDate');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  ownerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerId');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  ownerNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerName');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String?, QQueryOperations>
  previousOwnerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'previousOwnerId');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  qrCodeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'qrCode');
    });
  }

  QueryBuilder<IsarDigitalCertificate, DateTime?, QQueryOperations>
  registrationDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'registrationDate');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarDigitalCertificate, String, QQueryOperations>
  trustLevelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'trustLevel');
    });
  }

  QueryBuilder<IsarDigitalCertificate, DateTime, QQueryOperations>
  updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
