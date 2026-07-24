// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_horse.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarHorseCollection on Isar {
  IsarCollection<IsarHorse> get isarHorses => this.collection();
}

const IsarHorseSchema = CollectionSchema(
  name: r'IsarHorse',
  id: 9042457938627109439,
  properties: {
    r'awardCount': PropertySchema(
      id: 0,
      name: r'awardCount',
      type: IsarType.long,
    ),
    r'birthYear': PropertySchema(
      id: 1,
      name: r'birthYear',
      type: IsarType.long,
    ),
    r'coat': PropertySchema(
      id: 2,
      name: r'coat',
      type: IsarType.string,
    ),
    r'createdAt': PropertySchema(
      id: 3,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'domainId': PropertySchema(
      id: 4,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'gender': PropertySchema(
      id: 5,
      name: r'gender',
      type: IsarType.byte,
      enumMap: _IsarHorsegenderEnumValueMap,
    ),
    r'isOwnedByHousehold': PropertySchema(
      id: 6,
      name: r'isOwnedByHousehold',
      type: IsarType.bool,
    ),
    r'lineageRootId': PropertySchema(
      id: 7,
      name: r'lineageRootId',
      type: IsarType.string,
    ),
    r'name': PropertySchema(
      id: 8,
      name: r'name',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(
      id: 9,
      name: r'notes',
      type: IsarType.string,
    ),
    r'offspringCount': PropertySchema(
      id: 10,
      name: r'offspringCount',
      type: IsarType.long,
    ),
    r'ownerStampSvg': PropertySchema(
      id: 11,
      name: r'ownerStampSvg',
      type: IsarType.string,
    ),
    r'relationLabel': PropertySchema(
      id: 12,
      name: r'relationLabel',
      type: IsarType.string,
    ),
    r'updatedAt': PropertySchema(
      id: 13,
      name: r'updatedAt',
      type: IsarType.dateTime,
    )
  },
  estimateSize: _isarHorseEstimateSize,
  serialize: _isarHorseSerialize,
  deserialize: _isarHorseDeserialize,
  deserializeProp: _isarHorseDeserializeProp,
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
    r'lineageRootId': IndexSchema(
      id: 553091344210129649,
      name: r'lineageRootId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'lineageRootId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarHorseGetId,
  getLinks: _isarHorseGetLinks,
  attach: _isarHorseAttach,
  version: '3.1.0+1',
);

int _isarHorseEstimateSize(
  IsarHorse object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.coat.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.lineageRootId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.name.length * 3;
  bytesCount += 3 + object.notes.length * 3;
  {
    final value = object.ownerStampSvg;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.relationLabel.length * 3;
  return bytesCount;
}

void _isarHorseSerialize(
  IsarHorse object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.awardCount);
  writer.writeLong(offsets[1], object.birthYear);
  writer.writeString(offsets[2], object.coat);
  writer.writeDateTime(offsets[3], object.createdAt);
  writer.writeString(offsets[4], object.domainId);
  writer.writeByte(offsets[5], object.gender.index);
  writer.writeBool(offsets[6], object.isOwnedByHousehold);
  writer.writeString(offsets[7], object.lineageRootId);
  writer.writeString(offsets[8], object.name);
  writer.writeString(offsets[9], object.notes);
  writer.writeLong(offsets[10], object.offspringCount);
  writer.writeString(offsets[11], object.ownerStampSvg);
  writer.writeString(offsets[12], object.relationLabel);
  writer.writeDateTime(offsets[13], object.updatedAt);
}

IsarHorse _isarHorseDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarHorse();
  object.awardCount = reader.readLong(offsets[0]);
  object.birthYear = reader.readLong(offsets[1]);
  object.coat = reader.readString(offsets[2]);
  object.createdAt = reader.readDateTime(offsets[3]);
  object.domainId = reader.readString(offsets[4]);
  object.gender =
      _IsarHorsegenderValueEnumMap[reader.readByteOrNull(offsets[5])] ??
          HorseGender.stallion;
  object.id = id;
  object.isOwnedByHousehold = reader.readBool(offsets[6]);
  object.lineageRootId = reader.readStringOrNull(offsets[7]);
  object.name = reader.readString(offsets[8]);
  object.notes = reader.readString(offsets[9]);
  object.offspringCount = reader.readLong(offsets[10]);
  object.ownerStampSvg = reader.readStringOrNull(offsets[11]);
  object.relationLabel = reader.readString(offsets[12]);
  object.updatedAt = reader.readDateTime(offsets[13]);
  return object;
}

P _isarHorseDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readLong(offset)) as P;
    case 1:
      return (reader.readLong(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readDateTime(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (_IsarHorsegenderValueEnumMap[reader.readByteOrNull(offset)] ??
          HorseGender.stallion) as P;
    case 6:
      return (reader.readBool(offset)) as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readString(offset)) as P;
    case 10:
      return (reader.readLong(offset)) as P;
    case 11:
      return (reader.readStringOrNull(offset)) as P;
    case 12:
      return (reader.readString(offset)) as P;
    case 13:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarHorsegenderEnumValueMap = {
  'stallion': 0,
  'mare': 1,
  'gelding': 2,
  'foal': 3,
};
const _IsarHorsegenderValueEnumMap = {
  0: HorseGender.stallion,
  1: HorseGender.mare,
  2: HorseGender.gelding,
  3: HorseGender.foal,
};

Id _isarHorseGetId(IsarHorse object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarHorseGetLinks(IsarHorse object) {
  return [];
}

void _isarHorseAttach(IsarCollection<dynamic> col, Id id, IsarHorse object) {
  object.id = id;
}

extension IsarHorseByIndex on IsarCollection<IsarHorse> {
  Future<IsarHorse?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarHorse? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarHorse?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarHorse?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarHorse object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarHorse object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarHorse> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(List<IsarHorse> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarHorseQueryWhereSort
    on QueryBuilder<IsarHorse, IsarHorse, QWhere> {
  QueryBuilder<IsarHorse, IsarHorse, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarHorseQueryWhere
    on QueryBuilder<IsarHorse, IsarHorse, QWhereClause> {
  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idNotEqualTo(Id id) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> domainIdEqualTo(
      String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'domainId',
        value: [domainId],
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> domainIdNotEqualTo(
      String domainId) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> lineageRootIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'lineageRootId',
        value: [null],
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause>
      lineageRootIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.between(
        indexName: r'lineageRootId',
        lower: [null],
        includeLower: false,
        upper: [],
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> lineageRootIdEqualTo(
      String? lineageRootId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'lineageRootId',
        value: [lineageRootId],
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> lineageRootIdNotEqualTo(
      String? lineageRootId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'lineageRootId',
              lower: [],
              upper: [lineageRootId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'lineageRootId',
              lower: [lineageRootId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'lineageRootId',
              lower: [lineageRootId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'lineageRootId',
              lower: [],
              upper: [lineageRootId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension IsarHorseQueryFilter
    on QueryBuilder<IsarHorse, IsarHorse, QFilterCondition> {
  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> awardCountEqualTo(
      int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'awardCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      awardCountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'awardCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> awardCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'awardCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> awardCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'awardCount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> birthYearEqualTo(
      int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'birthYear',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      birthYearGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'birthYear',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> birthYearLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'birthYear',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> birthYearBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'birthYear',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'coat',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'coat',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'coat',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'coat',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> createdAtEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'createdAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> createdAtLessThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> createdAtBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdEqualTo(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdGreaterThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdLessThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdStartsWith(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdEndsWith(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'domainId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderEqualTo(
      HorseGender value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'gender',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderGreaterThan(
    HorseGender value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'gender',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderLessThan(
    HorseGender value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'gender',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderBetween(
    HorseGender lower,
    HorseGender upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'gender',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      isOwnedByHouseholdEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isOwnedByHousehold',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'lineageRootId',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'lineageRootId',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lineageRootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lineageRootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lineageRootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lineageRootId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'lineageRootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'lineageRootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'lineageRootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'lineageRootId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lineageRootId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      lineageRootIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'lineageRootId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'name',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'notes',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'notes',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'notes',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'notes',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      offspringCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'offspringCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      offspringCountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'offspringCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      offspringCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'offspringCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      offspringCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'offspringCount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'ownerStampSvg',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'ownerStampSvg',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'ownerStampSvg',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'ownerStampSvg',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'ownerStampSvg',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'ownerStampSvg',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'ownerStampSvg',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'ownerStampSvg',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'ownerStampSvg',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'ownerStampSvg',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'ownerStampSvg',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      ownerStampSvgIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'ownerStampSvg',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'relationLabel',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'relationLabel',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'relationLabel',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
      relationLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'relationLabel',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> updatedAtEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'updatedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> updatedAtLessThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> updatedAtBetween(
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

extension IsarHorseQueryObject
    on QueryBuilder<IsarHorse, IsarHorse, QFilterCondition> {}

extension IsarHorseQueryLinks
    on QueryBuilder<IsarHorse, IsarHorse, QFilterCondition> {}

extension IsarHorseQuerySortBy on QueryBuilder<IsarHorse, IsarHorse, QSortBy> {
  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByAwardCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByBirthYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByCoat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByCoatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByGenderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByIsOwnedByHousehold() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
      sortByIsOwnedByHouseholdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByLineageRootId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lineageRootId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByLineageRootIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lineageRootId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByOffspringCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByOwnerStampSvg() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerStampSvg', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByOwnerStampSvgDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerStampSvg', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRelationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRelationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarHorseQuerySortThenBy
    on QueryBuilder<IsarHorse, IsarHorse, QSortThenBy> {
  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByAwardCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByBirthYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByCoat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByCoatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByGenderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByIsOwnedByHousehold() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
      thenByIsOwnedByHouseholdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByLineageRootId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lineageRootId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByLineageRootIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lineageRootId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByOffspringCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByOwnerStampSvg() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerStampSvg', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByOwnerStampSvgDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerStampSvg', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRelationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRelationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarHorseQueryWhereDistinct
    on QueryBuilder<IsarHorse, IsarHorse, QDistinct> {
  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'awardCount');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'birthYear');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByCoat(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coat', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByDomainId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'gender');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByIsOwnedByHousehold() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isOwnedByHousehold');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByLineageRootId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lineageRootId',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByNotes(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'offspringCount');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByOwnerStampSvg(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerStampSvg',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByRelationLabel(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'relationLabel',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }
}

extension IsarHorseQueryProperty
    on QueryBuilder<IsarHorse, IsarHorse, QQueryProperty> {
  QueryBuilder<IsarHorse, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarHorse, int, QQueryOperations> awardCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'awardCount');
    });
  }

  QueryBuilder<IsarHorse, int, QQueryOperations> birthYearProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'birthYear');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> coatProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coat');
    });
  }

  QueryBuilder<IsarHorse, DateTime, QQueryOperations> createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarHorse, HorseGender, QQueryOperations> genderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'gender');
    });
  }

  QueryBuilder<IsarHorse, bool, QQueryOperations> isOwnedByHouseholdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isOwnedByHousehold');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> lineageRootIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lineageRootId');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarHorse, int, QQueryOperations> offspringCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'offspringCount');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> ownerStampSvgProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerStampSvg');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> relationLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'relationLabel');
    });
  }

  QueryBuilder<IsarHorse, DateTime, QQueryOperations> updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
