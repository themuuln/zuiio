// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_geofence_alert.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarGeofenceAlertCollection on Isar {
  IsarCollection<IsarGeofenceAlert> get isarGeofenceAlerts => this.collection();
}

const IsarGeofenceAlertSchema = CollectionSchema(
  name: r'IsarGeofenceAlert',
  id: -8627288302332240036,
  properties: {
    r'acknowledged': PropertySchema(
      id: 0,
      name: r'acknowledged',
      type: IsarType.bool,
    ),
    r'alertType': PropertySchema(
      id: 1,
      name: r'alertType',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: 2,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'geofenceId': PropertySchema(
      id: 3,
      name: r'geofenceId',
      type: IsarType.string,
    ),
    r'geofenceName': PropertySchema(
      id: 4,
      name: r'geofenceName',
      type: IsarType.string,
    ),
    r'horseId': PropertySchema(id: 5, name: r'horseId', type: IsarType.string),
    r'horseLat': PropertySchema(
      id: 6,
      name: r'horseLat',
      type: IsarType.double,
    ),
    r'horseLng': PropertySchema(
      id: 7,
      name: r'horseLng',
      type: IsarType.double,
    ),
    r'horseName': PropertySchema(
      id: 8,
      name: r'horseName',
      type: IsarType.string,
    ),
    r'triggeredAt': PropertySchema(
      id: 9,
      name: r'triggeredAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarGeofenceAlertEstimateSize,
  serialize: _isarGeofenceAlertSerialize,
  deserialize: _isarGeofenceAlertDeserialize,
  deserializeProp: _isarGeofenceAlertDeserializeProp,
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
  getId: _isarGeofenceAlertGetId,
  getLinks: _isarGeofenceAlertGetLinks,
  attach: _isarGeofenceAlertAttach,
  version: '3.1.0+1',
);

int _isarGeofenceAlertEstimateSize(
  IsarGeofenceAlert object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.alertType.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.geofenceId.length * 3;
  bytesCount += 3 + object.geofenceName.length * 3;
  bytesCount += 3 + object.horseId.length * 3;
  bytesCount += 3 + object.horseName.length * 3;
  return bytesCount;
}

void _isarGeofenceAlertSerialize(
  IsarGeofenceAlert object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeBool(offsets[0], object.acknowledged);
  writer.writeString(offsets[1], object.alertType);
  writer.writeString(offsets[2], object.domainId);
  writer.writeString(offsets[3], object.geofenceId);
  writer.writeString(offsets[4], object.geofenceName);
  writer.writeString(offsets[5], object.horseId);
  writer.writeDouble(offsets[6], object.horseLat);
  writer.writeDouble(offsets[7], object.horseLng);
  writer.writeString(offsets[8], object.horseName);
  writer.writeDateTime(offsets[9], object.triggeredAt);
}

IsarGeofenceAlert _isarGeofenceAlertDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarGeofenceAlert();
  object.acknowledged = reader.readBool(offsets[0]);
  object.alertType = reader.readString(offsets[1]);
  object.domainId = reader.readString(offsets[2]);
  object.geofenceId = reader.readString(offsets[3]);
  object.geofenceName = reader.readString(offsets[4]);
  object.horseId = reader.readString(offsets[5]);
  object.horseLat = reader.readDouble(offsets[6]);
  object.horseLng = reader.readDouble(offsets[7]);
  object.horseName = reader.readString(offsets[8]);
  object.id = id;
  object.triggeredAt = reader.readDateTime(offsets[9]);
  return object;
}

P _isarGeofenceAlertDeserializeProp<P>(
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
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readDouble(offset)) as P;
    case 7:
      return (reader.readDouble(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarGeofenceAlertGetId(IsarGeofenceAlert object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarGeofenceAlertGetLinks(
  IsarGeofenceAlert object,
) {
  return [];
}

void _isarGeofenceAlertAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarGeofenceAlert object,
) {
  object.id = id;
}

extension IsarGeofenceAlertByIndex on IsarCollection<IsarGeofenceAlert> {
  Future<IsarGeofenceAlert?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarGeofenceAlert? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarGeofenceAlert?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarGeofenceAlert?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarGeofenceAlert object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarGeofenceAlert object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarGeofenceAlert> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarGeofenceAlert> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarGeofenceAlertQueryWhereSort
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QWhere> {
  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarGeofenceAlertQueryWhere
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QWhereClause> {
  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
  horseIdEqualTo(String horseId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'horseId', value: [horseId]),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterWhereClause>
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

extension IsarGeofenceAlertQueryFilter
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QFilterCondition> {
  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  acknowledgedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'acknowledged', value: value),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'alertType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'alertType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'alertType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'alertType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'alertType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'alertType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'alertType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'alertType',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'alertType', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  alertTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'alertType', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'geofenceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'geofenceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'geofenceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'geofenceId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'geofenceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'geofenceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'geofenceId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'geofenceId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'geofenceId', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'geofenceId', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'geofenceName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'geofenceName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'geofenceName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'geofenceName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'geofenceName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'geofenceName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'geofenceName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'geofenceName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'geofenceName', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  geofenceNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'geofenceName', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLatEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'horseLat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLatGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'horseLat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLatLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'horseLat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLatBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'horseLat',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLngEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'horseLng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLngGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'horseLng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLngLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'horseLng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseLngBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'horseLng',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseNameEqualTo(String value, {bool caseSensitive = true}) {
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseNameGreaterThan(
    String value, {
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseNameLessThan(
    String value, {
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseNameBetween(
    String lower,
    String upper, {
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  horseNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
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

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  triggeredAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'triggeredAt', value: value),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  triggeredAtGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'triggeredAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  triggeredAtLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'triggeredAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterFilterCondition>
  triggeredAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'triggeredAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarGeofenceAlertQueryObject
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QFilterCondition> {}

extension IsarGeofenceAlertQueryLinks
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QFilterCondition> {}

extension IsarGeofenceAlertQuerySortBy
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QSortBy> {
  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByAcknowledged() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'acknowledged', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByAcknowledgedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'acknowledged', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByAlertType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'alertType', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByAlertTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'alertType', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByGeofenceId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceId', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByGeofenceIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceId', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByGeofenceName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceName', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByGeofenceNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceName', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLat', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseLatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLat', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLng', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseLngDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLng', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByTriggeredAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'triggeredAt', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  sortByTriggeredAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'triggeredAt', Sort.desc);
    });
  }
}

extension IsarGeofenceAlertQuerySortThenBy
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QSortThenBy> {
  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByAcknowledged() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'acknowledged', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByAcknowledgedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'acknowledged', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByAlertType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'alertType', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByAlertTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'alertType', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByGeofenceId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceId', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByGeofenceIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceId', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByGeofenceName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceName', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByGeofenceNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'geofenceName', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLat', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseLatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLat', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLng', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseLngDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseLng', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByTriggeredAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'triggeredAt', Sort.asc);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QAfterSortBy>
  thenByTriggeredAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'triggeredAt', Sort.desc);
    });
  }
}

extension IsarGeofenceAlertQueryWhereDistinct
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct> {
  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByAcknowledged() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'acknowledged');
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByAlertType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'alertType', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByGeofenceId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'geofenceId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByGeofenceName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'geofenceName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByHorseId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByHorseLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseLat');
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByHorseLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseLng');
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByHorseName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QDistinct>
  distinctByTriggeredAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'triggeredAt');
    });
  }
}

extension IsarGeofenceAlertQueryProperty
    on QueryBuilder<IsarGeofenceAlert, IsarGeofenceAlert, QQueryProperty> {
  QueryBuilder<IsarGeofenceAlert, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarGeofenceAlert, bool, QQueryOperations>
  acknowledgedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'acknowledged');
    });
  }

  QueryBuilder<IsarGeofenceAlert, String, QQueryOperations>
  alertTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'alertType');
    });
  }

  QueryBuilder<IsarGeofenceAlert, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarGeofenceAlert, String, QQueryOperations>
  geofenceIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'geofenceId');
    });
  }

  QueryBuilder<IsarGeofenceAlert, String, QQueryOperations>
  geofenceNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'geofenceName');
    });
  }

  QueryBuilder<IsarGeofenceAlert, String, QQueryOperations> horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarGeofenceAlert, double, QQueryOperations> horseLatProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseLat');
    });
  }

  QueryBuilder<IsarGeofenceAlert, double, QQueryOperations> horseLngProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseLng');
    });
  }

  QueryBuilder<IsarGeofenceAlert, String, QQueryOperations>
  horseNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseName');
    });
  }

  QueryBuilder<IsarGeofenceAlert, DateTime, QQueryOperations>
  triggeredAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'triggeredAt');
    });
  }
}
