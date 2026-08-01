// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_health_log.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarHealthLogCollection on Isar {
  IsarCollection<IsarHealthLog> get isarHealthLogs => this.collection();
}

final IsarHealthLogSchema = CollectionSchema(
  name: r'IsarHealthLog',
  id: int.parse('2980641072404148757'),
  properties: {
    r'cost': PropertySchema(
      id: int.parse('0'),
      name: r'cost',
      type: IsarType.double,
    ),
    r'createdAt': PropertySchema(
      id: int.parse('1'),
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'date': PropertySchema(
      id: int.parse('2'),
      name: r'date',
      type: IsarType.dateTime,
    ),
    r'domainId': PropertySchema(
      id: int.parse('3'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'farrierName': PropertySchema(
      id: int.parse('4'),
      name: r'farrierName',
      type: IsarType.string,
    ),
    r'horseId': PropertySchema(
      id: int.parse('5'),
      name: r'horseId',
      type: IsarType.string,
    ),
    r'logType': PropertySchema(
      id: int.parse('6'),
      name: r'logType',
      type: IsarType.byte,
      enumMap: _IsarHealthLoglogTypeEnumValueMap,
    ),
    r'medicament': PropertySchema(
      id: int.parse('7'),
      name: r'medicament',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(
      id: int.parse('8'),
      name: r'notes',
      type: IsarType.string,
    ),
    r'updatedAt': PropertySchema(
      id: int.parse('9'),
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarHealthLogEstimateSize,
  serialize: _isarHealthLogSerialize,
  deserialize: _isarHealthLogDeserialize,
  deserializeProp: _isarHealthLogDeserializeProp,
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
    r'logType': IndexSchema(
      id: int.parse('-1575070705662519133'),
      name: r'logType',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'logType',
          type: IndexType.value,
          caseSensitive: false,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarHealthLogGetId,
  getLinks: _isarHealthLogGetLinks,
  attach: _isarHealthLogAttach,
  version: '3.1.0+1',
);

int _isarHealthLogEstimateSize(
  IsarHealthLog object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.farrierName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.horseId.length * 3;
  {
    final value = object.medicament;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.notes.length * 3;
  return bytesCount;
}

void _isarHealthLogSerialize(
  IsarHealthLog object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDouble(offsets[0], object.cost);
  writer.writeDateTime(offsets[1], object.createdAt);
  writer.writeDateTime(offsets[2], object.date);
  writer.writeString(offsets[3], object.domainId);
  writer.writeString(offsets[4], object.farrierName);
  writer.writeString(offsets[5], object.horseId);
  writer.writeByte(offsets[6], object.logType.index);
  writer.writeString(offsets[7], object.medicament);
  writer.writeString(offsets[8], object.notes);
  writer.writeDateTime(offsets[9], object.updatedAt);
}

IsarHealthLog _isarHealthLogDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarHealthLog();
  object.cost = reader.readDoubleOrNull(offsets[0]);
  object.createdAt = reader.readDateTime(offsets[1]);
  object.date = reader.readDateTimeOrNull(offsets[2]);
  object.domainId = reader.readString(offsets[3]);
  object.farrierName = reader.readStringOrNull(offsets[4]);
  object.horseId = reader.readString(offsets[5]);
  object.id = id;
  object.logType =
      _IsarHealthLoglogTypeValueEnumMap[reader.readByteOrNull(offsets[6])] ??
      LogType.vaccination;
  object.medicament = reader.readStringOrNull(offsets[7]);
  object.notes = reader.readString(offsets[8]);
  object.updatedAt = reader.readDateTime(offsets[9]);
  return object;
}

P _isarHealthLogDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDoubleOrNull(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readStringOrNull(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (_IsarHealthLoglogTypeValueEnumMap[reader.readByteOrNull(
                offset,
              )] ??
              LogType.vaccination)
          as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarHealthLoglogTypeEnumValueMap = {
  'vaccination': 0,
  'deworming': 1,
  'treatment': 2,
  'vetVisit': 3,
  'shoeing': 4,
  'trimming': 5,
};
const _IsarHealthLoglogTypeValueEnumMap = {
  0: LogType.vaccination,
  1: LogType.deworming,
  2: LogType.treatment,
  3: LogType.vetVisit,
  4: LogType.shoeing,
  5: LogType.trimming,
};

Id _isarHealthLogGetId(IsarHealthLog object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarHealthLogGetLinks(IsarHealthLog object) {
  return [];
}

void _isarHealthLogAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarHealthLog object,
) {
  object.id = id;
}

extension IsarHealthLogByIndex on IsarCollection<IsarHealthLog> {
  Future<IsarHealthLog?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarHealthLog? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarHealthLog?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarHealthLog?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarHealthLog object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarHealthLog object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarHealthLog> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarHealthLog> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarHealthLogQueryWhereSort
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QWhere> {
  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhere> anyLogType() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'logType'),
      );
    });
  }
}

extension IsarHealthLogQueryWhere
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QWhereClause> {
  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> idEqualTo(
    Id id,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> idNotEqualTo(
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> domainIdEqualTo(
    String domainId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> horseIdEqualTo(
    String horseId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'horseId', value: [horseId]),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> logTypeEqualTo(
    LogType logType,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'logType', value: [logType]),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause>
  logTypeNotEqualTo(LogType logType) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'logType',
                lower: [],
                upper: [logType],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'logType',
                lower: [logType],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'logType',
                lower: [logType],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'logType',
                lower: [],
                upper: [logType],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause>
  logTypeGreaterThan(LogType logType, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'logType',
          lower: [logType],
          includeLower: include,
          upper: [],
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> logTypeLessThan(
    LogType logType, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'logType',
          lower: [],
          upper: [logType],
          includeUpper: include,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterWhereClause> logTypeBetween(
    LogType lowerLogType,
    LogType upperLogType, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'logType',
          lower: [lowerLogType],
          includeLower: includeLower,
          upper: [upperLogType],
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarHealthLogQueryFilter
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QFilterCondition> {
  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  costIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'cost'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  costIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'cost'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> costEqualTo(
    double? value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'cost',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  costGreaterThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'cost',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  costLessThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'cost',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> costBetween(
    double? lower,
    double? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'cost',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  dateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'date'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  dateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'date'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> dateEqualTo(
    DateTime? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'date', value: value),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  dateGreaterThan(DateTime? value, {bool include = false}) {
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  dateLessThan(DateTime? value, {bool include = false}) {
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> dateBetween(
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'farrierName'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'farrierName'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'farrierName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'farrierName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'farrierName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'farrierName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'farrierName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'farrierName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'farrierName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'farrierName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'farrierName', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  farrierNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'farrierName', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> idEqualTo(
    Id value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> idLessThan(
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  logTypeEqualTo(LogType value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'logType', value: value),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  logTypeGreaterThan(LogType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'logType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  logTypeLessThan(LogType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'logType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  logTypeBetween(
    LogType lower,
    LogType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'logType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'medicament'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'medicament'),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'medicament',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'medicament',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'medicament',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'medicament',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'medicament',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'medicament',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'medicament',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'medicament',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'medicament', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  medicamentIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'medicament', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
  updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterFilterCondition>
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

extension IsarHealthLogQueryObject
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QFilterCondition> {}

extension IsarHealthLogQueryLinks
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QFilterCondition> {}

extension IsarHealthLogQuerySortBy
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QSortBy> {
  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByCost() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cost', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByCostDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cost', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByFarrierName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'farrierName', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  sortByFarrierNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'farrierName', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByLogType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'logType', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByLogTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'logType', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByMedicament() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  sortByMedicamentDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarHealthLogQuerySortThenBy
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QSortThenBy> {
  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByCost() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cost', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByCostDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cost', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByFarrierName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'farrierName', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  thenByFarrierNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'farrierName', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByLogType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'logType', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByLogTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'logType', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByMedicament() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  thenByMedicamentDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy> thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QAfterSortBy>
  thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarHealthLogQueryWhereDistinct
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> {
  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByCost() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'cost');
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'date');
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByFarrierName({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'farrierName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByHorseId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByLogType() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'logType');
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByMedicament({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'medicament', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByNotes({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHealthLog, IsarHealthLog, QDistinct> distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }
}

extension IsarHealthLogQueryProperty
    on QueryBuilder<IsarHealthLog, IsarHealthLog, QQueryProperty> {
  QueryBuilder<IsarHealthLog, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarHealthLog, double?, QQueryOperations> costProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'cost');
    });
  }

  QueryBuilder<IsarHealthLog, DateTime, QQueryOperations> createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarHealthLog, DateTime?, QQueryOperations> dateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'date');
    });
  }

  QueryBuilder<IsarHealthLog, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarHealthLog, String?, QQueryOperations> farrierNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'farrierName');
    });
  }

  QueryBuilder<IsarHealthLog, String, QQueryOperations> horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarHealthLog, LogType, QQueryOperations> logTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'logType');
    });
  }

  QueryBuilder<IsarHealthLog, String?, QQueryOperations> medicamentProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'medicament');
    });
  }

  QueryBuilder<IsarHealthLog, String, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarHealthLog, DateTime, QQueryOperations> updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
