// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_profile_settings.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarProfileSettingsCollection on Isar {
  IsarCollection<IsarProfileSettings> get isarProfileSettings =>
      this.collection();
}

final IsarProfileSettingsSchema = CollectionSchema(
  name: r'IsarProfileSettings',
  id: int.parse('-3948342721376362034'),
  properties: {
    r'autoSyncEnabled': PropertySchema(
      id: int.parse('0'),
      name: r'autoSyncEnabled',
      type: IsarType.bool,
    ),
    r'domainId': PropertySchema(
      id: int.parse('1'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'lastSyncCheckAt': PropertySchema(
      id: int.parse('2'),
      name: r'lastSyncCheckAt',
      type: IsarType.dateTime,
    ),
    r'rank': PropertySchema(
      id: int.parse('3'),
      name: r'rank',
      type: IsarType.string,
    ),
    r'role': PropertySchema(
      id: int.parse('4'),
      name: r'role',
      type: IsarType.string,
    ),
  },
  estimateSize: _isarProfileSettingsEstimateSize,
  serialize: _isarProfileSettingsSerialize,
  deserialize: _isarProfileSettingsDeserialize,
  deserializeProp: _isarProfileSettingsDeserializeProp,
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
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarProfileSettingsGetId,
  getLinks: _isarProfileSettingsGetLinks,
  attach: _isarProfileSettingsAttach,
  version: '3.1.0+1',
);

int _isarProfileSettingsEstimateSize(
  IsarProfileSettings object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.rank.length * 3;
  bytesCount += 3 + object.role.length * 3;
  return bytesCount;
}

void _isarProfileSettingsSerialize(
  IsarProfileSettings object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeBool(offsets[0], object.autoSyncEnabled);
  writer.writeString(offsets[1], object.domainId);
  writer.writeDateTime(offsets[2], object.lastSyncCheckAt);
  writer.writeString(offsets[3], object.rank);
  writer.writeString(offsets[4], object.role);
}

IsarProfileSettings _isarProfileSettingsDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarProfileSettings();
  object.autoSyncEnabled = reader.readBool(offsets[0]);
  object.domainId = reader.readString(offsets[1]);
  object.id = id;
  object.lastSyncCheckAt = reader.readDateTimeOrNull(offsets[2]);
  object.rank = reader.readString(offsets[3]);
  object.role = reader.readString(offsets[4]);
  return object;
}

P _isarProfileSettingsDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readBool(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarProfileSettingsGetId(IsarProfileSettings object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarProfileSettingsGetLinks(
  IsarProfileSettings object,
) {
  return [];
}

void _isarProfileSettingsAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarProfileSettings object,
) {
  object.id = id;
}

extension IsarProfileSettingsByIndex on IsarCollection<IsarProfileSettings> {
  Future<IsarProfileSettings?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarProfileSettings? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarProfileSettings?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarProfileSettings?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarProfileSettings object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarProfileSettings object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarProfileSettings> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarProfileSettings> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarProfileSettingsQueryWhereSort
    on QueryBuilder<IsarProfileSettings, IsarProfileSettings, QWhere> {
  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarProfileSettingsQueryWhere
    on QueryBuilder<IsarProfileSettings, IsarProfileSettings, QWhereClause> {
  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterWhereClause>
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
}

extension IsarProfileSettingsQueryFilter
    on
        QueryBuilder<
          IsarProfileSettings,
          IsarProfileSettings,
          QFilterCondition
        > {
  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  autoSyncEnabledEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'autoSyncEnabled', value: value),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
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

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  lastSyncCheckAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'lastSyncCheckAt'),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  lastSyncCheckAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'lastSyncCheckAt'),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  lastSyncCheckAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'lastSyncCheckAt', value: value),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  lastSyncCheckAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lastSyncCheckAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  lastSyncCheckAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lastSyncCheckAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  lastSyncCheckAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lastSyncCheckAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'rank',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'rank',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'rank',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'rank',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'rank',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'rank',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'rank',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'rank',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'rank', value: ''),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  rankIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'rank', value: ''),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'role',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'role',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'role',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'role',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'role',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'role',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'role',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'role',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'role', value: ''),
      );
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterFilterCondition>
  roleIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'role', value: ''),
      );
    });
  }
}

extension IsarProfileSettingsQueryObject
    on
        QueryBuilder<
          IsarProfileSettings,
          IsarProfileSettings,
          QFilterCondition
        > {}

extension IsarProfileSettingsQueryLinks
    on
        QueryBuilder<
          IsarProfileSettings,
          IsarProfileSettings,
          QFilterCondition
        > {}

extension IsarProfileSettingsQuerySortBy
    on QueryBuilder<IsarProfileSettings, IsarProfileSettings, QSortBy> {
  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByAutoSyncEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'autoSyncEnabled', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByAutoSyncEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'autoSyncEnabled', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByLastSyncCheckAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSyncCheckAt', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByLastSyncCheckAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSyncCheckAt', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByRank() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rank', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByRankDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rank', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByRole() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  sortByRoleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.desc);
    });
  }
}

extension IsarProfileSettingsQuerySortThenBy
    on QueryBuilder<IsarProfileSettings, IsarProfileSettings, QSortThenBy> {
  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByAutoSyncEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'autoSyncEnabled', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByAutoSyncEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'autoSyncEnabled', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByLastSyncCheckAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSyncCheckAt', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByLastSyncCheckAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSyncCheckAt', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByRank() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rank', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByRankDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rank', Sort.desc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByRole() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.asc);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QAfterSortBy>
  thenByRoleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.desc);
    });
  }
}

extension IsarProfileSettingsQueryWhereDistinct
    on QueryBuilder<IsarProfileSettings, IsarProfileSettings, QDistinct> {
  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QDistinct>
  distinctByAutoSyncEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'autoSyncEnabled');
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QDistinct>
  distinctByLastSyncCheckAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastSyncCheckAt');
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QDistinct>
  distinctByRank({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'rank', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarProfileSettings, IsarProfileSettings, QDistinct>
  distinctByRole({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'role', caseSensitive: caseSensitive);
    });
  }
}

extension IsarProfileSettingsQueryProperty
    on QueryBuilder<IsarProfileSettings, IsarProfileSettings, QQueryProperty> {
  QueryBuilder<IsarProfileSettings, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarProfileSettings, bool, QQueryOperations>
  autoSyncEnabledProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'autoSyncEnabled');
    });
  }

  QueryBuilder<IsarProfileSettings, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarProfileSettings, DateTime?, QQueryOperations>
  lastSyncCheckAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastSyncCheckAt');
    });
  }

  QueryBuilder<IsarProfileSettings, String, QQueryOperations> rankProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'rank');
    });
  }

  QueryBuilder<IsarProfileSettings, String, QQueryOperations> roleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'role');
    });
  }
}
