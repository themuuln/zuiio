// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_race.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarRaceCollection on Isar {
  IsarCollection<IsarRace> get isarRaces => this.collection();
}

const IsarRaceSchema = CollectionSchema(
  name: r'IsarRace',
  id: 672194119055800382,
  properties: {
    r'date': PropertySchema(id: 0, name: r'date', type: IsarType.dateTime),
    r'description': PropertySchema(
      id: 1,
      name: r'description',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: 2,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'entryFee': PropertySchema(id: 3, name: r'entryFee', type: IsarType.long),
    r'location': PropertySchema(
      id: 4,
      name: r'location',
      type: IsarType.string,
    ),
    r'maxEntries': PropertySchema(
      id: 5,
      name: r'maxEntries',
      type: IsarType.long,
    ),
    r'name': PropertySchema(id: 6, name: r'name', type: IsarType.string),
    r'organizerId': PropertySchema(
      id: 7,
      name: r'organizerId',
      type: IsarType.string,
    ),
    r'prizeDistribution': PropertySchema(
      id: 8,
      name: r'prizeDistribution',
      type: IsarType.string,
    ),
    r'raceStatus': PropertySchema(
      id: 9,
      name: r'raceStatus',
      type: IsarType.byte,
      enumMap: _IsarRaceraceStatusEnumValueMap,
    ),
    r'raceType': PropertySchema(
      id: 10,
      name: r'raceType',
      type: IsarType.byte,
      enumMap: _IsarRaceraceTypeEnumValueMap,
    ),
  },
  estimateSize: _isarRaceEstimateSize,
  serialize: _isarRaceSerialize,
  deserialize: _isarRaceDeserialize,
  deserializeProp: _isarRaceDeserializeProp,
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
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarRaceGetId,
  getLinks: _isarRaceGetLinks,
  attach: _isarRaceAttach,
  version: '3.1.0+1',
);

int _isarRaceEstimateSize(
  IsarRace object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.description;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.location;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.name.length * 3;
  {
    final value = object.organizerId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.prizeDistribution;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _isarRaceSerialize(
  IsarRace object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.date);
  writer.writeString(offsets[1], object.description);
  writer.writeString(offsets[2], object.domainId);
  writer.writeLong(offsets[3], object.entryFee);
  writer.writeString(offsets[4], object.location);
  writer.writeLong(offsets[5], object.maxEntries);
  writer.writeString(offsets[6], object.name);
  writer.writeString(offsets[7], object.organizerId);
  writer.writeString(offsets[8], object.prizeDistribution);
  writer.writeByte(offsets[9], object.raceStatus.index);
  writer.writeByte(offsets[10], object.raceType.index);
}

IsarRace _isarRaceDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarRace();
  object.date = reader.readDateTimeOrNull(offsets[0]);
  object.description = reader.readStringOrNull(offsets[1]);
  object.domainId = reader.readString(offsets[2]);
  object.entryFee = reader.readLongOrNull(offsets[3]);
  object.id = id;
  object.location = reader.readStringOrNull(offsets[4]);
  object.maxEntries = reader.readLongOrNull(offsets[5]);
  object.name = reader.readString(offsets[6]);
  object.organizerId = reader.readStringOrNull(offsets[7]);
  object.prizeDistribution = reader.readStringOrNull(offsets[8]);
  object.raceStatus =
      _IsarRaceraceStatusValueEnumMap[reader.readByteOrNull(offsets[9])] ??
      RaceStatus.upcoming;
  object.raceType =
      _IsarRaceraceTypeValueEnumMap[reader.readByteOrNull(offsets[10])] ??
      RaceType.naadam;
  return object;
}

P _isarRaceDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 1:
      return (reader.readStringOrNull(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readLongOrNull(offset)) as P;
    case 4:
      return (reader.readStringOrNull(offset)) as P;
    case 5:
      return (reader.readLongOrNull(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readStringOrNull(offset)) as P;
    case 9:
      return (_IsarRaceraceStatusValueEnumMap[reader.readByteOrNull(offset)] ??
              RaceStatus.upcoming)
          as P;
    case 10:
      return (_IsarRaceraceTypeValueEnumMap[reader.readByteOrNull(offset)] ??
              RaceType.naadam)
          as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarRaceraceStatusEnumValueMap = {
  'upcoming': 0,
  'ongoing': 1,
  'completed': 2,
  'cancelled': 3,
};
const _IsarRaceraceStatusValueEnumMap = {
  0: RaceStatus.upcoming,
  1: RaceStatus.ongoing,
  2: RaceStatus.completed,
  3: RaceStatus.cancelled,
};
const _IsarRaceraceTypeEnumValueMap = {'naadam': 0, 'regional': 1, 'local': 2};
const _IsarRaceraceTypeValueEnumMap = {
  0: RaceType.naadam,
  1: RaceType.regional,
  2: RaceType.local,
};

Id _isarRaceGetId(IsarRace object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarRaceGetLinks(IsarRace object) {
  return [];
}

void _isarRaceAttach(IsarCollection<dynamic> col, Id id, IsarRace object) {
  object.id = id;
}

extension IsarRaceByIndex on IsarCollection<IsarRace> {
  Future<IsarRace?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarRace? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarRace?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarRace?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarRace object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarRace object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarRace> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarRace> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarRaceQueryWhereSort on QueryBuilder<IsarRace, IsarRace, QWhere> {
  QueryBuilder<IsarRace, IsarRace, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarRaceQueryWhere on QueryBuilder<IsarRace, IsarRace, QWhereClause> {
  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> idNotEqualTo(Id id) {
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

  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> domainIdEqualTo(
    String domainId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterWhereClause> domainIdNotEqualTo(
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
}

extension IsarRaceQueryFilter
    on QueryBuilder<IsarRace, IsarRace, QFilterCondition> {
  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> dateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'date'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> dateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'date'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> dateEqualTo(
    DateTime? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'date', value: value),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> dateGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'date',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> dateLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'date',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> dateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'date',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'description'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  descriptionIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'description'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  descriptionGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'description',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'description',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> descriptionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'description', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  descriptionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'description', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdEqualTo(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdGreaterThan(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdLessThan(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdBetween(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdStartsWith(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdEndsWith(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdContains(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdMatches(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> entryFeeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'entryFee'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> entryFeeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'entryFee'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> entryFeeEqualTo(
    int? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'entryFee', value: value),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> entryFeeGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'entryFee',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> entryFeeLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'entryFee',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> entryFeeBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'entryFee',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'location'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'location'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'location',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'location',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'location', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> locationIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'location', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> maxEntriesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'maxEntries'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  maxEntriesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'maxEntries'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> maxEntriesEqualTo(
    int? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'maxEntries', value: value),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> maxEntriesGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'maxEntries',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> maxEntriesLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'maxEntries',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> maxEntriesBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'maxEntries',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameEqualTo(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameGreaterThan(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameLessThan(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameBetween(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameStartsWith(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameEndsWith(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameContains(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameMatches(
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

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'name', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'name', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'organizerId'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  organizerIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'organizerId'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'organizerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  organizerIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'organizerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'organizerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'organizerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'organizerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'organizerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'organizerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'organizerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> organizerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'organizerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  organizerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'organizerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'prizeDistribution'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'prizeDistribution'),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'prizeDistribution',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'prizeDistribution',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'prizeDistribution',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'prizeDistribution',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'prizeDistribution',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'prizeDistribution',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'prizeDistribution',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'prizeDistribution',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'prizeDistribution', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition>
  prizeDistributionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'prizeDistribution', value: ''),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceStatusEqualTo(
    RaceStatus value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'raceStatus', value: value),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceStatusGreaterThan(
    RaceStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'raceStatus',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceStatusLessThan(
    RaceStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'raceStatus',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceStatusBetween(
    RaceStatus lower,
    RaceStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'raceStatus',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceTypeEqualTo(
    RaceType value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'raceType', value: value),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceTypeGreaterThan(
    RaceType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'raceType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceTypeLessThan(
    RaceType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'raceType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterFilterCondition> raceTypeBetween(
    RaceType lower,
    RaceType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'raceType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarRaceQueryObject
    on QueryBuilder<IsarRace, IsarRace, QFilterCondition> {}

extension IsarRaceQueryLinks
    on QueryBuilder<IsarRace, IsarRace, QFilterCondition> {}

extension IsarRaceQuerySortBy on QueryBuilder<IsarRace, IsarRace, QSortBy> {
  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByEntryFee() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryFee', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByEntryFeeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryFee', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByLocation() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByLocationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByMaxEntries() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'maxEntries', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByMaxEntriesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'maxEntries', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByOrganizerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerId', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByOrganizerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerId', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByPrizeDistribution() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeDistribution', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByPrizeDistributionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeDistribution', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByRaceStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceStatus', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByRaceStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceStatus', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByRaceType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceType', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> sortByRaceTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceType', Sort.desc);
    });
  }
}

extension IsarRaceQuerySortThenBy
    on QueryBuilder<IsarRace, IsarRace, QSortThenBy> {
  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByEntryFee() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryFee', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByEntryFeeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryFee', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByLocation() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByLocationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByMaxEntries() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'maxEntries', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByMaxEntriesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'maxEntries', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByOrganizerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerId', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByOrganizerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerId', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByPrizeDistribution() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeDistribution', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByPrizeDistributionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeDistribution', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByRaceStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceStatus', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByRaceStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceStatus', Sort.desc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByRaceType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceType', Sort.asc);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QAfterSortBy> thenByRaceTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceType', Sort.desc);
    });
  }
}

extension IsarRaceQueryWhereDistinct
    on QueryBuilder<IsarRace, IsarRace, QDistinct> {
  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'date');
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByDescription({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'description', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByEntryFee() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'entryFee');
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByLocation({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'location', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByMaxEntries() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'maxEntries');
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByName({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByOrganizerId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'organizerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByPrizeDistribution({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'prizeDistribution',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByRaceStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'raceStatus');
    });
  }

  QueryBuilder<IsarRace, IsarRace, QDistinct> distinctByRaceType() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'raceType');
    });
  }
}

extension IsarRaceQueryProperty
    on QueryBuilder<IsarRace, IsarRace, QQueryProperty> {
  QueryBuilder<IsarRace, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarRace, DateTime?, QQueryOperations> dateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'date');
    });
  }

  QueryBuilder<IsarRace, String?, QQueryOperations> descriptionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'description');
    });
  }

  QueryBuilder<IsarRace, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarRace, int?, QQueryOperations> entryFeeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'entryFee');
    });
  }

  QueryBuilder<IsarRace, String?, QQueryOperations> locationProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'location');
    });
  }

  QueryBuilder<IsarRace, int?, QQueryOperations> maxEntriesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'maxEntries');
    });
  }

  QueryBuilder<IsarRace, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }

  QueryBuilder<IsarRace, String?, QQueryOperations> organizerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizerId');
    });
  }

  QueryBuilder<IsarRace, String?, QQueryOperations>
  prizeDistributionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'prizeDistribution');
    });
  }

  QueryBuilder<IsarRace, RaceStatus, QQueryOperations> raceStatusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'raceStatus');
    });
  }

  QueryBuilder<IsarRace, RaceType, QQueryOperations> raceTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'raceType');
    });
  }
}
