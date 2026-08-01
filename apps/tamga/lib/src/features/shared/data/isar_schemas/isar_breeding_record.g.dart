// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_breeding_record.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarBreedingRecordCollection on Isar {
  IsarCollection<IsarBreedingRecord> get isarBreedingRecords =>
      this.collection();
}

final IsarBreedingRecordSchema = CollectionSchema(
  name: r'IsarBreedingRecord',
  id: int.parse('458482297470456438'),
  properties: {
    r'actualFoalingDate': PropertySchema(
      id: int.parse('0'),
      name: r'actualFoalingDate',
      type: IsarType.dateTime,
    ),
    r'breedingDate': PropertySchema(
      id: int.parse('1'),
      name: r'breedingDate',
      type: IsarType.dateTime,
    ),
    r'createdAt': PropertySchema(
      id: int.parse('2'),
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'damId': PropertySchema(
      id: int.parse('3'),
      name: r'damId',
      type: IsarType.string,
    ),
    r'damName': PropertySchema(
      id: int.parse('4'),
      name: r'damName',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: int.parse('5'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'expectedFoalingDate': PropertySchema(
      id: int.parse('6'),
      name: r'expectedFoalingDate',
      type: IsarType.dateTime,
    ),
    r'foalColor': PropertySchema(
      id: int.parse('7'),
      name: r'foalColor',
      type: IsarType.string,
    ),
    r'foalGender': PropertySchema(
      id: int.parse('8'),
      name: r'foalGender',
      type: IsarType.string,
    ),
    r'foalId': PropertySchema(
      id: int.parse('9'),
      name: r'foalId',
      type: IsarType.string,
    ),
    r'foalName': PropertySchema(
      id: int.parse('10'),
      name: r'foalName',
      type: IsarType.string,
    ),
    r'herdLabel': PropertySchema(
      id: int.parse('11'),
      name: r'herdLabel',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(
      id: int.parse('12'),
      name: r'notes',
      type: IsarType.string,
    ),
    r'sireId': PropertySchema(
      id: int.parse('13'),
      name: r'sireId',
      type: IsarType.string,
    ),
    r'sireName': PropertySchema(
      id: int.parse('14'),
      name: r'sireName',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: int.parse('15'),
      name: r'status',
      type: IsarType.string,
    ),
    r'updatedAt': PropertySchema(
      id: int.parse('16'),
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarBreedingRecordEstimateSize,
  serialize: _isarBreedingRecordSerialize,
  deserialize: _isarBreedingRecordDeserialize,
  deserializeProp: _isarBreedingRecordDeserializeProp,
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
    r'sireId': IndexSchema(
      id: int.parse('-1156203555194561420'),
      name: r'sireId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'sireId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'damId': IndexSchema(
      id: int.parse('6504086851974029461'),
      name: r'damId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'damId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'status': IndexSchema(
      id: int.parse('-107785170620420283'),
      name: r'status',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'status',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarBreedingRecordGetId,
  getLinks: _isarBreedingRecordGetLinks,
  attach: _isarBreedingRecordAttach,
  version: '3.1.0+1',
);

int _isarBreedingRecordEstimateSize(
  IsarBreedingRecord object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.damId.length * 3;
  bytesCount += 3 + object.damName.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.foalColor;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.foalGender;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.foalId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.foalName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.herdLabel.length * 3;
  bytesCount += 3 + object.notes.length * 3;
  bytesCount += 3 + object.sireId.length * 3;
  bytesCount += 3 + object.sireName.length * 3;
  bytesCount += 3 + object.status.length * 3;
  return bytesCount;
}

void _isarBreedingRecordSerialize(
  IsarBreedingRecord object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.actualFoalingDate);
  writer.writeDateTime(offsets[1], object.breedingDate);
  writer.writeDateTime(offsets[2], object.createdAt);
  writer.writeString(offsets[3], object.damId);
  writer.writeString(offsets[4], object.damName);
  writer.writeString(offsets[5], object.domainId);
  writer.writeDateTime(offsets[6], object.expectedFoalingDate);
  writer.writeString(offsets[7], object.foalColor);
  writer.writeString(offsets[8], object.foalGender);
  writer.writeString(offsets[9], object.foalId);
  writer.writeString(offsets[10], object.foalName);
  writer.writeString(offsets[11], object.herdLabel);
  writer.writeString(offsets[12], object.notes);
  writer.writeString(offsets[13], object.sireId);
  writer.writeString(offsets[14], object.sireName);
  writer.writeString(offsets[15], object.status);
  writer.writeDateTime(offsets[16], object.updatedAt);
}

IsarBreedingRecord _isarBreedingRecordDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarBreedingRecord();
  object.actualFoalingDate = reader.readDateTimeOrNull(offsets[0]);
  object.breedingDate = reader.readDateTime(offsets[1]);
  object.createdAt = reader.readDateTime(offsets[2]);
  object.damId = reader.readString(offsets[3]);
  object.damName = reader.readString(offsets[4]);
  object.domainId = reader.readString(offsets[5]);
  object.expectedFoalingDate = reader.readDateTime(offsets[6]);
  object.foalColor = reader.readStringOrNull(offsets[7]);
  object.foalGender = reader.readStringOrNull(offsets[8]);
  object.foalId = reader.readStringOrNull(offsets[9]);
  object.foalName = reader.readStringOrNull(offsets[10]);
  object.herdLabel = reader.readString(offsets[11]);
  object.id = id;
  object.notes = reader.readString(offsets[12]);
  object.sireId = reader.readString(offsets[13]);
  object.sireName = reader.readString(offsets[14]);
  object.status = reader.readString(offsets[15]);
  object.updatedAt = reader.readDateTime(offsets[16]);
  return object;
}

P _isarBreedingRecordDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readDateTime(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readDateTime(offset)) as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readStringOrNull(offset)) as P;
    case 9:
      return (reader.readStringOrNull(offset)) as P;
    case 10:
      return (reader.readStringOrNull(offset)) as P;
    case 11:
      return (reader.readString(offset)) as P;
    case 12:
      return (reader.readString(offset)) as P;
    case 13:
      return (reader.readString(offset)) as P;
    case 14:
      return (reader.readString(offset)) as P;
    case 15:
      return (reader.readString(offset)) as P;
    case 16:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarBreedingRecordGetId(IsarBreedingRecord object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarBreedingRecordGetLinks(
  IsarBreedingRecord object,
) {
  return [];
}

void _isarBreedingRecordAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarBreedingRecord object,
) {
  object.id = id;
}

extension IsarBreedingRecordByIndex on IsarCollection<IsarBreedingRecord> {
  Future<IsarBreedingRecord?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarBreedingRecord? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarBreedingRecord?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarBreedingRecord?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarBreedingRecord object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarBreedingRecord object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarBreedingRecord> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarBreedingRecord> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarBreedingRecordQueryWhereSort
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QWhere> {
  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarBreedingRecordQueryWhere
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QWhereClause> {
  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  sireIdEqualTo(String sireId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'sireId', value: [sireId]),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  sireIdNotEqualTo(String sireId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sireId',
                lower: [],
                upper: [sireId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sireId',
                lower: [sireId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sireId',
                lower: [sireId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'sireId',
                lower: [],
                upper: [sireId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  damIdEqualTo(String damId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'damId', value: [damId]),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  damIdNotEqualTo(String damId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'damId',
                lower: [],
                upper: [damId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'damId',
                lower: [damId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'damId',
                lower: [damId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'damId',
                lower: [],
                upper: [damId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  statusEqualTo(String status) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'status', value: [status]),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterWhereClause>
  statusNotEqualTo(String status) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'status',
                lower: [],
                upper: [status],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'status',
                lower: [status],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'status',
                lower: [status],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'status',
                lower: [],
                upper: [status],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarBreedingRecordQueryFilter
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QFilterCondition> {
  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  actualFoalingDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'actualFoalingDate'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  actualFoalingDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'actualFoalingDate'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  actualFoalingDateEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'actualFoalingDate', value: value),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  actualFoalingDateGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'actualFoalingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  actualFoalingDateLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'actualFoalingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  actualFoalingDateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'actualFoalingDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  breedingDateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'breedingDate', value: value),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  breedingDateGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'breedingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  breedingDateLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'breedingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  breedingDateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'breedingDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'damId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'damId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'damId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'damId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'damId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'damId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'damId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'damId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'damId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'damId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'damName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'damName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'damName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'damName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'damName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'damName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'damName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'damName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'damName', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  damNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'damName', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  expectedFoalingDateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'expectedFoalingDate', value: value),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  expectedFoalingDateGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'expectedFoalingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  expectedFoalingDateLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'expectedFoalingDate',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  expectedFoalingDateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'expectedFoalingDate',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'foalColor'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'foalColor'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'foalColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'foalColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'foalColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'foalColor',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'foalColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'foalColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'foalColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'foalColor',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'foalColor', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalColorIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'foalColor', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'foalGender'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'foalGender'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'foalGender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'foalGender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'foalGender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'foalGender',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'foalGender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'foalGender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'foalGender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'foalGender',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'foalGender', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalGenderIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'foalGender', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'foalId'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'foalId'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'foalId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'foalId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'foalId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'foalId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'foalId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'foalId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'foalId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'foalId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'foalId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'foalId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'foalName'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'foalName'),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'foalName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'foalName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'foalName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'foalName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'foalName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'foalName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'foalName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'foalName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'foalName', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  foalNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'foalName', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'herdLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'herdLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'herdLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'herdLabel',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'herdLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'herdLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'herdLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'herdLabel',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'herdLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  herdLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'herdLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  notesEqualTo(String value, {bool caseSensitive = true}) {
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  notesGreaterThan(
    String value, {
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  notesLessThan(
    String value, {
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  notesBetween(
    String lower,
    String upper, {
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sireId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sireId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sireId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sireId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sireId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sireId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sireId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sireId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sireId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sireId', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sireName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sireName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sireName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sireName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sireName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sireName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sireName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sireName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sireName', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  sireNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sireName', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
  updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterFilterCondition>
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

extension IsarBreedingRecordQueryObject
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QFilterCondition> {}

extension IsarBreedingRecordQueryLinks
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QFilterCondition> {}

extension IsarBreedingRecordQuerySortBy
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QSortBy> {
  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByActualFoalingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'actualFoalingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByActualFoalingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'actualFoalingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByBreedingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByBreedingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByDamId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByDamIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByDamName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damName', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByDamNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damName', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByExpectedFoalingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expectedFoalingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByExpectedFoalingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expectedFoalingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalColor() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalColor', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalColorDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalColor', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalGender', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalGenderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalGender', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalName', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByFoalNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalName', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByHerdLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'herdLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByHerdLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'herdLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortBySireId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortBySireIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortBySireName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireName', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortBySireNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireName', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarBreedingRecordQuerySortThenBy
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QSortThenBy> {
  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByActualFoalingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'actualFoalingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByActualFoalingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'actualFoalingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByBreedingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByBreedingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByDamId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByDamIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByDamName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damName', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByDamNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damName', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByExpectedFoalingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expectedFoalingDate', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByExpectedFoalingDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expectedFoalingDate', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalColor() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalColor', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalColorDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalColor', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalGender', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalGenderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalGender', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalName', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByFoalNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'foalName', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByHerdLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'herdLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByHerdLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'herdLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenBySireId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenBySireIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenBySireName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireName', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenBySireNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireName', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QAfterSortBy>
  thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarBreedingRecordQueryWhereDistinct
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct> {
  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByActualFoalingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'actualFoalingDate');
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByBreedingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'breedingDate');
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByDamId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'damId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByDamName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'damName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByExpectedFoalingDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'expectedFoalingDate');
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByFoalColor({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'foalColor', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByFoalGender({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'foalGender', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByFoalId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'foalId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByFoalName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'foalName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByHerdLabel({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'herdLabel', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByNotes({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctBySireId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sireId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctBySireName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sireName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByStatus({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QDistinct>
  distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }
}

extension IsarBreedingRecordQueryProperty
    on QueryBuilder<IsarBreedingRecord, IsarBreedingRecord, QQueryProperty> {
  QueryBuilder<IsarBreedingRecord, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarBreedingRecord, DateTime?, QQueryOperations>
  actualFoalingDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'actualFoalingDate');
    });
  }

  QueryBuilder<IsarBreedingRecord, DateTime, QQueryOperations>
  breedingDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'breedingDate');
    });
  }

  QueryBuilder<IsarBreedingRecord, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations> damIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'damId');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations> damNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'damName');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarBreedingRecord, DateTime, QQueryOperations>
  expectedFoalingDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'expectedFoalingDate');
    });
  }

  QueryBuilder<IsarBreedingRecord, String?, QQueryOperations>
  foalColorProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'foalColor');
    });
  }

  QueryBuilder<IsarBreedingRecord, String?, QQueryOperations>
  foalGenderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'foalGender');
    });
  }

  QueryBuilder<IsarBreedingRecord, String?, QQueryOperations> foalIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'foalId');
    });
  }

  QueryBuilder<IsarBreedingRecord, String?, QQueryOperations>
  foalNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'foalName');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations>
  herdLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'herdLabel');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations> sireIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sireId');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations>
  sireNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sireName');
    });
  }

  QueryBuilder<IsarBreedingRecord, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarBreedingRecord, DateTime, QQueryOperations>
  updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
