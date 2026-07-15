// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_race_entry.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarRaceEntryCollection on Isar {
  IsarCollection<IsarRaceEntry> get isarRaceEntrys => this.collection();
}

const IsarRaceEntrySchema = CollectionSchema(
  name: r'IsarRaceEntry',
  id: 5640362438934546934,
  properties: {
    r'domainId': PropertySchema(
      id: 0,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'entryStatus': PropertySchema(
      id: 1,
      name: r'entryStatus',
      type: IsarType.byte,
      enumMap: _IsarRaceEntryentryStatusEnumValueMap,
    ),
    r'horseId': PropertySchema(id: 2, name: r'horseId', type: IsarType.string),
    r'jockeyName': PropertySchema(
      id: 3,
      name: r'jockeyName',
      type: IsarType.string,
    ),
    r'ownerId': PropertySchema(id: 4, name: r'ownerId', type: IsarType.string),
    r'placement': PropertySchema(
      id: 5,
      name: r'placement',
      type: IsarType.long,
    ),
    r'prize': PropertySchema(id: 6, name: r'prize', type: IsarType.long),
    r'raceId': PropertySchema(id: 7, name: r'raceId', type: IsarType.string),
    r'result': PropertySchema(id: 8, name: r'result', type: IsarType.string),
  },
  estimateSize: _isarRaceEntryEstimateSize,
  serialize: _isarRaceEntrySerialize,
  deserialize: _isarRaceEntryDeserialize,
  deserializeProp: _isarRaceEntryDeserializeProp,
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
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarRaceEntryGetId,
  getLinks: _isarRaceEntryGetLinks,
  attach: _isarRaceEntryAttach,
  version: '3.1.0+1',
);

int _isarRaceEntryEstimateSize(
  IsarRaceEntry object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.horseId.length * 3;
  {
    final value = object.jockeyName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.ownerId.length * 3;
  bytesCount += 3 + object.raceId.length * 3;
  {
    final value = object.result;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _isarRaceEntrySerialize(
  IsarRaceEntry object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.domainId);
  writer.writeByte(offsets[1], object.entryStatus.index);
  writer.writeString(offsets[2], object.horseId);
  writer.writeString(offsets[3], object.jockeyName);
  writer.writeString(offsets[4], object.ownerId);
  writer.writeLong(offsets[5], object.placement);
  writer.writeLong(offsets[6], object.prize);
  writer.writeString(offsets[7], object.raceId);
  writer.writeString(offsets[8], object.result);
}

IsarRaceEntry _isarRaceEntryDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarRaceEntry();
  object.domainId = reader.readString(offsets[0]);
  object.entryStatus =
      _IsarRaceEntryentryStatusValueEnumMap[reader.readByteOrNull(
        offsets[1],
      )] ??
      RaceEntryStatus.registered;
  object.horseId = reader.readString(offsets[2]);
  object.id = id;
  object.jockeyName = reader.readStringOrNull(offsets[3]);
  object.ownerId = reader.readString(offsets[4]);
  object.placement = reader.readLongOrNull(offsets[5]);
  object.prize = reader.readLongOrNull(offsets[6]);
  object.raceId = reader.readString(offsets[7]);
  object.result = reader.readStringOrNull(offsets[8]);
  return object;
}

P _isarRaceEntryDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (_IsarRaceEntryentryStatusValueEnumMap[reader.readByteOrNull(
                offset,
              )] ??
              RaceEntryStatus.registered)
          as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readStringOrNull(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readLongOrNull(offset)) as P;
    case 6:
      return (reader.readLongOrNull(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readStringOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarRaceEntryentryStatusEnumValueMap = {
  'registered': 0,
  'confirmed': 1,
  'competed': 2,
  'scratched': 3,
};
const _IsarRaceEntryentryStatusValueEnumMap = {
  0: RaceEntryStatus.registered,
  1: RaceEntryStatus.confirmed,
  2: RaceEntryStatus.competed,
  3: RaceEntryStatus.scratched,
};

Id _isarRaceEntryGetId(IsarRaceEntry object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarRaceEntryGetLinks(IsarRaceEntry object) {
  return [];
}

void _isarRaceEntryAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarRaceEntry object,
) {
  object.id = id;
}

extension IsarRaceEntryByIndex on IsarCollection<IsarRaceEntry> {
  Future<IsarRaceEntry?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarRaceEntry? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarRaceEntry?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarRaceEntry?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarRaceEntry object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarRaceEntry object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarRaceEntry> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarRaceEntry> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarRaceEntryQueryWhereSort
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QWhere> {
  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarRaceEntryQueryWhere
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QWhereClause> {
  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> idEqualTo(
    Id id,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> idNotEqualTo(
    Id id,
  ) {
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> domainIdEqualTo(
    String domainId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause> horseIdEqualTo(
    String horseId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'horseId', value: [horseId]),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterWhereClause>
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

extension IsarRaceEntryQueryFilter
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QFilterCondition> {
  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  entryStatusEqualTo(RaceEntryStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'entryStatus', value: value),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  entryStatusGreaterThan(RaceEntryStatus value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'entryStatus',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  entryStatusLessThan(RaceEntryStatus value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'entryStatus',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  entryStatusBetween(
    RaceEntryStatus lower,
    RaceEntryStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'entryStatus',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition> idEqualTo(
    Id value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'jockeyName'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'jockeyName'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'jockeyName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'jockeyName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'jockeyName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'jockeyName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'jockeyName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'jockeyName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'jockeyName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'jockeyName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'jockeyName', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  jockeyNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'jockeyName', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
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

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  ownerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  ownerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  placementIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'placement'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  placementIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'placement'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  placementEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'placement', value: value),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  placementGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'placement',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  placementLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'placement',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  placementBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'placement',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  prizeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'prize'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  prizeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'prize'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  prizeEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'prize', value: value),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  prizeGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'prize',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  prizeLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'prize',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  prizeBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'prize',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'raceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'raceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'raceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'raceId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'raceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'raceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'raceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'raceId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'raceId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  raceIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'raceId', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'result'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'result'),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'result',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'result',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'result', value: ''),
      );
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterFilterCondition>
  resultIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'result', value: ''),
      );
    });
  }
}

extension IsarRaceEntryQueryObject
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QFilterCondition> {}

extension IsarRaceEntryQueryLinks
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QFilterCondition> {}

extension IsarRaceEntryQuerySortBy
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QSortBy> {
  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByEntryStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryStatus', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  sortByEntryStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryStatus', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByJockeyName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jockeyName', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  sortByJockeyNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jockeyName', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByPlacement() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'placement', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  sortByPlacementDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'placement', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByPrize() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prize', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByPrizeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prize', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByRaceId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByRaceIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByResult() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> sortByResultDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.desc);
    });
  }
}

extension IsarRaceEntryQuerySortThenBy
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QSortThenBy> {
  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByEntryStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryStatus', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  thenByEntryStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entryStatus', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByJockeyName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jockeyName', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  thenByJockeyNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jockeyName', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByPlacement() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'placement', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy>
  thenByPlacementDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'placement', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByPrize() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prize', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByPrizeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prize', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByRaceId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceId', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByRaceIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'raceId', Sort.desc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByResult() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.asc);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QAfterSortBy> thenByResultDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.desc);
    });
  }
}

extension IsarRaceEntryQueryWhereDistinct
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> {
  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct>
  distinctByEntryStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'entryStatus');
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByHorseId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByJockeyName({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'jockeyName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByOwnerId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByPlacement() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'placement');
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByPrize() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'prize');
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByRaceId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'raceId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarRaceEntry, IsarRaceEntry, QDistinct> distinctByResult({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'result', caseSensitive: caseSensitive);
    });
  }
}

extension IsarRaceEntryQueryProperty
    on QueryBuilder<IsarRaceEntry, IsarRaceEntry, QQueryProperty> {
  QueryBuilder<IsarRaceEntry, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarRaceEntry, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarRaceEntry, RaceEntryStatus, QQueryOperations>
  entryStatusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'entryStatus');
    });
  }

  QueryBuilder<IsarRaceEntry, String, QQueryOperations> horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarRaceEntry, String?, QQueryOperations> jockeyNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'jockeyName');
    });
  }

  QueryBuilder<IsarRaceEntry, String, QQueryOperations> ownerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerId');
    });
  }

  QueryBuilder<IsarRaceEntry, int?, QQueryOperations> placementProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'placement');
    });
  }

  QueryBuilder<IsarRaceEntry, int?, QQueryOperations> prizeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'prize');
    });
  }

  QueryBuilder<IsarRaceEntry, String, QQueryOperations> raceIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'raceId');
    });
  }

  QueryBuilder<IsarRaceEntry, String?, QQueryOperations> resultProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'result');
    });
  }
}
