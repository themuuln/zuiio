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
    r'breedLineageIndex': PropertySchema(
      id: 2,
      name: r'breedLineageIndex',
      type: IsarType.long,
    ),
    r'coat': PropertySchema(id: 3, name: r'coat', type: IsarType.string),
    r'coatColorIndex': PropertySchema(
      id: 4,
      name: r'coatColorIndex',
      type: IsarType.long,
    ),
    r'createdAt': PropertySchema(
      id: 5,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'damId': PropertySchema(id: 6, name: r'damId', type: IsarType.string),
    r'domainId': PropertySchema(
      id: 7,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'gender': PropertySchema(
      id: 8,
      name: r'gender',
      type: IsarType.byte,
      enumMap: _IsarHorsegenderEnumValueMap,
    ),
    r'isOwnedByHousehold': PropertySchema(
      id: 9,
      name: r'isOwnedByHousehold',
      type: IsarType.bool,
    ),
    r'lineageRootId': PropertySchema(
      id: 10,
      name: r'lineageRootId',
      type: IsarType.string,
    ),
    r'markingsJson': PropertySchema(
      id: 11,
      name: r'markingsJson',
      type: IsarType.string,
    ),
    r'microchipId': PropertySchema(
      id: 12,
      name: r'microchipId',
      type: IsarType.string,
    ),
    r'name': PropertySchema(id: 13, name: r'name', type: IsarType.string),
    r'notes': PropertySchema(id: 14, name: r'notes', type: IsarType.string),
    r'offspringCount': PropertySchema(
      id: 15,
      name: r'offspringCount',
      type: IsarType.long,
    ),
    r'ownerStampSvg': PropertySchema(
      id: 16,
      name: r'ownerStampSvg',
      type: IsarType.string,
    ),
    r'photoUrls': PropertySchema(
      id: 17,
      name: r'photoUrls',
      type: IsarType.stringList,
    ),
    r'region': PropertySchema(id: 18, name: r'region', type: IsarType.string),
    r'registrationDate': PropertySchema(
      id: 19,
      name: r'registrationDate',
      type: IsarType.dateTime,
    ),
    r'registrationNo': PropertySchema(
      id: 20,
      name: r'registrationNo',
      type: IsarType.string,
    ),
    r'relationLabel': PropertySchema(
      id: 21,
      name: r'relationLabel',
      type: IsarType.string,
    ),
    r'sireId': PropertySchema(id: 22, name: r'sireId', type: IsarType.string),
    r'stateVerified': PropertySchema(
      id: 23,
      name: r'stateVerified',
      type: IsarType.bool,
    ),
    r'sum': PropertySchema(id: 24, name: r'sum', type: IsarType.string),
    r'tamgaBrandClan': PropertySchema(
      id: 25,
      name: r'tamgaBrandClan',
      type: IsarType.string,
    ),
    r'tamgaBrandGeneration': PropertySchema(
      id: 26,
      name: r'tamgaBrandGeneration',
      type: IsarType.long,
    ),
    r'tamgaVerified': PropertySchema(
      id: 27,
      name: r'tamgaVerified',
      type: IsarType.bool,
    ),
    r'updatedAt': PropertySchema(
      id: 28,
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
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
        ),
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
        ),
      ],
    ),
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
  {
    final value = object.damId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.lineageRootId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.markingsJson;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.microchipId;
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
  {
    final list = object.photoUrls;
    if (list != null) {
      bytesCount += 3 + list.length * 3;
      {
        for (var i = 0; i < list.length; i++) {
          final value = list[i];
          bytesCount += value.length * 3;
        }
      }
    }
  }
  {
    final value = object.region;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.registrationNo;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.relationLabel.length * 3;
  {
    final value = object.sireId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.sum;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.tamgaBrandClan;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
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
  writer.writeLong(offsets[2], object.breedLineageIndex);
  writer.writeString(offsets[3], object.coat);
  writer.writeLong(offsets[4], object.coatColorIndex);
  writer.writeDateTime(offsets[5], object.createdAt);
  writer.writeString(offsets[6], object.damId);
  writer.writeString(offsets[7], object.domainId);
  writer.writeByte(offsets[8], object.gender.index);
  writer.writeBool(offsets[9], object.isOwnedByHousehold);
  writer.writeString(offsets[10], object.lineageRootId);
  writer.writeString(offsets[11], object.markingsJson);
  writer.writeString(offsets[12], object.microchipId);
  writer.writeString(offsets[13], object.name);
  writer.writeString(offsets[14], object.notes);
  writer.writeLong(offsets[15], object.offspringCount);
  writer.writeString(offsets[16], object.ownerStampSvg);
  writer.writeStringList(offsets[17], object.photoUrls);
  writer.writeString(offsets[18], object.region);
  writer.writeDateTime(offsets[19], object.registrationDate);
  writer.writeString(offsets[20], object.registrationNo);
  writer.writeString(offsets[21], object.relationLabel);
  writer.writeString(offsets[22], object.sireId);
  writer.writeBool(offsets[23], object.stateVerified);
  writer.writeString(offsets[24], object.sum);
  writer.writeString(offsets[25], object.tamgaBrandClan);
  writer.writeLong(offsets[26], object.tamgaBrandGeneration);
  writer.writeBool(offsets[27], object.tamgaVerified);
  writer.writeDateTime(offsets[28], object.updatedAt);
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
  object.breedLineageIndex = reader.readLongOrNull(offsets[2]);
  object.coat = reader.readString(offsets[3]);
  object.coatColorIndex = reader.readLongOrNull(offsets[4]);
  object.createdAt = reader.readDateTime(offsets[5]);
  object.damId = reader.readStringOrNull(offsets[6]);
  object.domainId = reader.readString(offsets[7]);
  object.gender =
      _IsarHorsegenderValueEnumMap[reader.readByteOrNull(offsets[8])] ??
      HorseGender.stallion;
  object.id = id;
  object.isOwnedByHousehold = reader.readBool(offsets[9]);
  object.lineageRootId = reader.readStringOrNull(offsets[10]);
  object.markingsJson = reader.readStringOrNull(offsets[11]);
  object.microchipId = reader.readStringOrNull(offsets[12]);
  object.name = reader.readString(offsets[13]);
  object.notes = reader.readString(offsets[14]);
  object.offspringCount = reader.readLong(offsets[15]);
  object.ownerStampSvg = reader.readStringOrNull(offsets[16]);
  object.photoUrls = reader.readStringList(offsets[17]);
  object.region = reader.readStringOrNull(offsets[18]);
  object.registrationDate = reader.readDateTimeOrNull(offsets[19]);
  object.registrationNo = reader.readStringOrNull(offsets[20]);
  object.relationLabel = reader.readString(offsets[21]);
  object.sireId = reader.readStringOrNull(offsets[22]);
  object.stateVerified = reader.readBool(offsets[23]);
  object.sum = reader.readStringOrNull(offsets[24]);
  object.tamgaBrandClan = reader.readStringOrNull(offsets[25]);
  object.tamgaBrandGeneration = reader.readLongOrNull(offsets[26]);
  object.tamgaVerified = reader.readBool(offsets[27]);
  object.updatedAt = reader.readDateTime(offsets[28]);
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
      return (reader.readLongOrNull(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readLongOrNull(offset)) as P;
    case 5:
      return (reader.readDateTime(offset)) as P;
    case 6:
      return (reader.readStringOrNull(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (_IsarHorsegenderValueEnumMap[reader.readByteOrNull(offset)] ??
              HorseGender.stallion)
          as P;
    case 9:
      return (reader.readBool(offset)) as P;
    case 10:
      return (reader.readStringOrNull(offset)) as P;
    case 11:
      return (reader.readStringOrNull(offset)) as P;
    case 12:
      return (reader.readStringOrNull(offset)) as P;
    case 13:
      return (reader.readString(offset)) as P;
    case 14:
      return (reader.readString(offset)) as P;
    case 15:
      return (reader.readLong(offset)) as P;
    case 16:
      return (reader.readStringOrNull(offset)) as P;
    case 17:
      return (reader.readStringList(offset)) as P;
    case 18:
      return (reader.readStringOrNull(offset)) as P;
    case 19:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 20:
      return (reader.readStringOrNull(offset)) as P;
    case 21:
      return (reader.readString(offset)) as P;
    case 22:
      return (reader.readStringOrNull(offset)) as P;
    case 23:
      return (reader.readBool(offset)) as P;
    case 24:
      return (reader.readStringOrNull(offset)) as P;
    case 25:
      return (reader.readStringOrNull(offset)) as P;
    case 26:
      return (reader.readLongOrNull(offset)) as P;
    case 27:
      return (reader.readBool(offset)) as P;
    case 28:
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

  List<Id> putAllByDomainIdSync(
    List<IsarHorse> objects, {
    bool saveLinks = true,
  }) {
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
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> domainIdEqualTo(
    String domainId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> domainIdNotEqualTo(
    String domainId,
  ) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> lineageRootIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'lineageRootId', value: [null]),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause>
  lineageRootIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'lineageRootId',
          lower: [null],
          includeLower: false,
          upper: [],
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> lineageRootIdEqualTo(
    String? lineageRootId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(
          indexName: r'lineageRootId',
          value: [lineageRootId],
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterWhereClause> lineageRootIdNotEqualTo(
    String? lineageRootId,
  ) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'lineageRootId',
                lower: [],
                upper: [lineageRootId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'lineageRootId',
                lower: [lineageRootId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'lineageRootId',
                lower: [lineageRootId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'lineageRootId',
                lower: [],
                upper: [lineageRootId],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarHorseQueryFilter
    on QueryBuilder<IsarHorse, IsarHorse, QFilterCondition> {
  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> awardCountEqualTo(
    int value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'awardCount', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  awardCountGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'awardCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> awardCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'awardCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> awardCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'awardCount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> birthYearEqualTo(
    int value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'birthYear', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  birthYearGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'birthYear',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> birthYearLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'birthYear',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> birthYearBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'birthYear',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  breedLineageIndexIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'breedLineageIndex'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  breedLineageIndexIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'breedLineageIndex'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  breedLineageIndexEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'breedLineageIndex', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  breedLineageIndexGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'breedLineageIndex',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  breedLineageIndexLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'breedLineageIndex',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  breedLineageIndexBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'breedLineageIndex',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'coat',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'coat',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'coat',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
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
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'coat',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'coat',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'coat',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'coat',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'coat',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'coat', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> coatIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'coat', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  coatColorIndexIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'coatColorIndex'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  coatColorIndexIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'coatColorIndex'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  coatColorIndexEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'coatColorIndex', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  coatColorIndexGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'coatColorIndex',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  coatColorIndexLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'coatColorIndex',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  coatColorIndexBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'coatColorIndex',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> createdAtEqualTo(
    DateTime value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> createdAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> createdAtBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'damId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'damId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdGreaterThan(
    String? value, {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdLessThan(
    String? value, {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdBetween(
    String? lower,
    String? upper, {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'damId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> damIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'damId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdGreaterThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdLessThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderEqualTo(
    HorseGender value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'gender', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderGreaterThan(
    HorseGender value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'gender',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderLessThan(
    HorseGender value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'gender',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> genderBetween(
    HorseGender lower,
    HorseGender upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'gender',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idEqualTo(
    Id value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  isOwnedByHouseholdEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'isOwnedByHousehold', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'lineageRootId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'lineageRootId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'lineageRootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lineageRootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lineageRootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
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
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lineageRootId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'lineageRootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'lineageRootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'lineageRootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'lineageRootId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'lineageRootId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  lineageRootIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'lineageRootId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'markingsJson'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'markingsJson'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> markingsJsonEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'markingsJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'markingsJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'markingsJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> markingsJsonBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'markingsJson',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'markingsJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'markingsJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'markingsJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> markingsJsonMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'markingsJson',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'markingsJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  markingsJsonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'markingsJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  microchipIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'microchipId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  microchipIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'microchipId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> microchipIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'microchipId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  microchipIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'microchipId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> microchipIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'microchipId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> microchipIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'microchipId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  microchipIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'microchipId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> microchipIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'microchipId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> microchipIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'microchipId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> microchipIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'microchipId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  microchipIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'microchipId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  microchipIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'microchipId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'name',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'name',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'name',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
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
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'name',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'name',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'name',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'name',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'name',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'name', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'name', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesGreaterThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesLessThan(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  offspringCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'offspringCount', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  offspringCountGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'offspringCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  offspringCountLessThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'offspringCount',
          value: value,
        ),
      );
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
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'offspringCount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'ownerStampSvg'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'ownerStampSvg'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'ownerStampSvg',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'ownerStampSvg',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'ownerStampSvg',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
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
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'ownerStampSvg',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'ownerStampSvg',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'ownerStampSvg',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'ownerStampSvg',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'ownerStampSvg',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerStampSvg', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  ownerStampSvgIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerStampSvg', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> photoUrlsIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'photoUrls'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'photoUrls'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'photoUrls',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'photoUrls',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'photoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'photoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', length, true, length, true);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> photoUrlsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, true, length, include);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  photoUrlsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'photoUrls',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'region'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'region'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'region',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'region',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'region',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'region',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'region',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'region',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'region',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'region',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'region', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> regionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'region', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationDateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'registrationDate'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationDateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'registrationDate'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationDateEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'registrationDate', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'registrationNo'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'registrationNo'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'registrationNo',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'registrationNo',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'registrationNo',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'registrationNo',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'registrationNo',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'registrationNo',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'registrationNo',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'registrationNo',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'registrationNo', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  registrationNoIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'registrationNo', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'relationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'relationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'relationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
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
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'relationLabel',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'relationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'relationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'relationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'relationLabel',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'relationLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  relationLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'relationLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'sireId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'sireId'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdGreaterThan(
    String? value, {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdLessThan(
    String? value, {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdBetween(
    String? lower,
    String? upper, {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sireId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sireIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sireId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  stateVerifiedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'stateVerified', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'sum'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'sum'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sum',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sum',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sum', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> sumIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sum', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'tamgaBrandClan'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'tamgaBrandClan'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'tamgaBrandClan',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'tamgaBrandClan',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'tamgaBrandClan',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'tamgaBrandClan',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'tamgaBrandClan',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'tamgaBrandClan',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'tamgaBrandClan',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'tamgaBrandClan',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'tamgaBrandClan', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandClanIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'tamgaBrandClan', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandGenerationIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'tamgaBrandGeneration'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandGenerationIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'tamgaBrandGeneration'),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandGenerationEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'tamgaBrandGeneration',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandGenerationGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'tamgaBrandGeneration',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandGenerationLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'tamgaBrandGeneration',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaBrandGenerationBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'tamgaBrandGeneration',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
  tamgaVerifiedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'tamgaVerified', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> updatedAtEqualTo(
    DateTime value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition>
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> updatedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterFilterCondition> updatedAtBetween(
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByBreedLineageIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedLineageIndex', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  sortByBreedLineageIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedLineageIndex', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByCoatColorIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColorIndex', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByCoatColorIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColorIndex', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByDamId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByDamIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByMarkingsJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'markingsJson', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByMarkingsJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'markingsJson', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByMicrochipId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'microchipId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByMicrochipIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'microchipId', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRegion() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRegionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  sortByRegistrationDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRegistrationNo() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationNo', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByRegistrationNoDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationNo', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortBySireId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortBySireIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByStateVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stateVerified', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByStateVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stateVerified', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortBySum() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sum', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortBySumDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sum', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByTamgaBrandClan() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandClan', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByTamgaBrandClanDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandClan', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  sortByTamgaBrandGeneration() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandGeneration', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  sortByTamgaBrandGenerationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandGeneration', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByTamgaVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaVerified', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> sortByTamgaVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaVerified', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByBreedLineageIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedLineageIndex', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  thenByBreedLineageIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breedLineageIndex', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByCoatColorIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColorIndex', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByCoatColorIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColorIndex', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByDamId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByDamIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'damId', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByMarkingsJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'markingsJson', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByMarkingsJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'markingsJson', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByMicrochipId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'microchipId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByMicrochipIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'microchipId', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRegion() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRegionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  thenByRegistrationDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationDate', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRegistrationNo() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationNo', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByRegistrationNoDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationNo', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenBySireId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenBySireIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sireId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByStateVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stateVerified', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByStateVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stateVerified', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenBySum() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sum', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenBySumDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sum', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByTamgaBrandClan() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandClan', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByTamgaBrandClanDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandClan', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  thenByTamgaBrandGeneration() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandGeneration', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy>
  thenByTamgaBrandGenerationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaBrandGeneration', Sort.desc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByTamgaVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaVerified', Sort.asc);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QAfterSortBy> thenByTamgaVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaVerified', Sort.desc);
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

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByBreedLineageIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'breedLineageIndex');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByCoat({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coat', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByCoatColorIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coatColorIndex');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByDamId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'damId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByLineageRootId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'lineageRootId',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByMarkingsJson({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'markingsJson', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByMicrochipId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'microchipId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByName({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByNotes({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'offspringCount');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByOwnerStampSvg({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'ownerStampSvg',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByPhotoUrls() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'photoUrls');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByRegion({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'region', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByRegistrationDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'registrationDate');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByRegistrationNo({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'registrationNo',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByRelationLabel({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'relationLabel',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctBySireId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sireId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByStateVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'stateVerified');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctBySum({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sum', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByTamgaBrandClan({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'tamgaBrandClan',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct>
  distinctByTamgaBrandGeneration() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'tamgaBrandGeneration');
    });
  }

  QueryBuilder<IsarHorse, IsarHorse, QDistinct> distinctByTamgaVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'tamgaVerified');
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

  QueryBuilder<IsarHorse, int?, QQueryOperations> breedLineageIndexProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'breedLineageIndex');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> coatProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coat');
    });
  }

  QueryBuilder<IsarHorse, int?, QQueryOperations> coatColorIndexProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coatColorIndex');
    });
  }

  QueryBuilder<IsarHorse, DateTime, QQueryOperations> createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> damIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'damId');
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

  QueryBuilder<IsarHorse, String?, QQueryOperations> markingsJsonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'markingsJson');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> microchipIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'microchipId');
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

  QueryBuilder<IsarHorse, List<String>?, QQueryOperations> photoUrlsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'photoUrls');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> regionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'region');
    });
  }

  QueryBuilder<IsarHorse, DateTime?, QQueryOperations>
  registrationDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'registrationDate');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> registrationNoProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'registrationNo');
    });
  }

  QueryBuilder<IsarHorse, String, QQueryOperations> relationLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'relationLabel');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> sireIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sireId');
    });
  }

  QueryBuilder<IsarHorse, bool, QQueryOperations> stateVerifiedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'stateVerified');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> sumProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sum');
    });
  }

  QueryBuilder<IsarHorse, String?, QQueryOperations> tamgaBrandClanProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'tamgaBrandClan');
    });
  }

  QueryBuilder<IsarHorse, int?, QQueryOperations>
  tamgaBrandGenerationProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'tamgaBrandGeneration');
    });
  }

  QueryBuilder<IsarHorse, bool, QQueryOperations> tamgaVerifiedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'tamgaVerified');
    });
  }

  QueryBuilder<IsarHorse, DateTime, QQueryOperations> updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
