// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_medical_log.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarMedicalLogCollection on Isar {
  IsarCollection<IsarMedicalLog> get isarMedicalLogs => this.collection();
}

const IsarMedicalLogSchema = CollectionSchema(
  name: r'IsarMedicalLog',
  id: 6607690123088412422,
  properties: {
    r'date': PropertySchema(id: 0, name: r'date', type: IsarType.dateTime),
    r'domainId': PropertySchema(
      id: 1,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'horseId': PropertySchema(id: 2, name: r'horseId', type: IsarType.string),
    r'medicament': PropertySchema(
      id: 3,
      name: r'medicament',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(id: 4, name: r'notes', type: IsarType.string),
    r'type': PropertySchema(
      id: 5,
      name: r'type',
      type: IsarType.byte,
      enumMap: _IsarMedicalLogtypeEnumValueMap,
    ),
  },
  estimateSize: _isarMedicalLogEstimateSize,
  serialize: _isarMedicalLogSerialize,
  deserialize: _isarMedicalLogDeserialize,
  deserializeProp: _isarMedicalLogDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _isarMedicalLogGetId,
  getLinks: _isarMedicalLogGetLinks,
  attach: _isarMedicalLogAttach,
  version: '3.1.0+1',
);

int _isarMedicalLogEstimateSize(
  IsarMedicalLog object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
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

void _isarMedicalLogSerialize(
  IsarMedicalLog object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.date);
  writer.writeString(offsets[1], object.domainId);
  writer.writeString(offsets[2], object.horseId);
  writer.writeString(offsets[3], object.medicament);
  writer.writeString(offsets[4], object.notes);
  writer.writeByte(offsets[5], object.type.index);
}

IsarMedicalLog _isarMedicalLogDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarMedicalLog();
  object.date = reader.readDateTime(offsets[0]);
  object.domainId = reader.readString(offsets[1]);
  object.horseId = reader.readString(offsets[2]);
  object.id = id;
  object.medicament = reader.readStringOrNull(offsets[3]);
  object.notes = reader.readString(offsets[4]);
  object.type =
      _IsarMedicalLogtypeValueEnumMap[reader.readByteOrNull(offsets[5])] ??
      MedicalLogType.vaccination;
  return object;
}

P _isarMedicalLogDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTime(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readStringOrNull(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (_IsarMedicalLogtypeValueEnumMap[reader.readByteOrNull(offset)] ??
              MedicalLogType.vaccination)
          as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarMedicalLogtypeEnumValueMap = {
  'vaccination': 0,
  'deworming': 1,
  'treatment': 2,
  'vetVisit': 3,
};
const _IsarMedicalLogtypeValueEnumMap = {
  0: MedicalLogType.vaccination,
  1: MedicalLogType.deworming,
  2: MedicalLogType.treatment,
  3: MedicalLogType.vetVisit,
};

Id _isarMedicalLogGetId(IsarMedicalLog object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarMedicalLogGetLinks(IsarMedicalLog object) {
  return [];
}

void _isarMedicalLogAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarMedicalLog object,
) {
  object.id = id;
}

extension IsarMedicalLogQueryWhereSort
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QWhere> {
  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarMedicalLogQueryWhere
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QWhereClause> {
  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterWhereClause> idEqualTo(
    Id id,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterWhereClause> idNotEqualTo(
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterWhereClause> idBetween(
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
}

extension IsarMedicalLogQueryFilter
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QFilterCondition> {
  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  dateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'date', value: value),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  dateGreaterThan(DateTime value, {bool include = false}) {
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  dateLessThan(DateTime value, {bool include = false}) {
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  dateBetween(
    DateTime lower,
    DateTime upper, {
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition> idEqualTo(
    Id value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  medicamentIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'medicament'),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  medicamentIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'medicament'),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  medicamentIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'medicament', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  medicamentIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'medicament', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
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

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  typeEqualTo(MedicalLogType value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'type', value: value),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  typeGreaterThan(MedicalLogType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'type',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  typeLessThan(MedicalLogType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'type',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterFilterCondition>
  typeBetween(
    MedicalLogType lower,
    MedicalLogType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'type',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarMedicalLogQueryObject
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QFilterCondition> {}

extension IsarMedicalLogQueryLinks
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QFilterCondition> {}

extension IsarMedicalLogQuerySortBy
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QSortBy> {
  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  sortByMedicament() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  sortByMedicamentDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'type', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> sortByTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'type', Sort.desc);
    });
  }
}

extension IsarMedicalLogQuerySortThenBy
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QSortThenBy> {
  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  thenByMedicament() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy>
  thenByMedicamentDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'medicament', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'type', Sort.asc);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QAfterSortBy> thenByTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'type', Sort.desc);
    });
  }
}

extension IsarMedicalLogQueryWhereDistinct
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> {
  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> distinctByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'date');
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> distinctByHorseId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> distinctByMedicament({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'medicament', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> distinctByNotes({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarMedicalLog, IsarMedicalLog, QDistinct> distinctByType() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'type');
    });
  }
}

extension IsarMedicalLogQueryProperty
    on QueryBuilder<IsarMedicalLog, IsarMedicalLog, QQueryProperty> {
  QueryBuilder<IsarMedicalLog, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarMedicalLog, DateTime, QQueryOperations> dateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'date');
    });
  }

  QueryBuilder<IsarMedicalLog, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarMedicalLog, String, QQueryOperations> horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarMedicalLog, String?, QQueryOperations> medicamentProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'medicament');
    });
  }

  QueryBuilder<IsarMedicalLog, String, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarMedicalLog, MedicalLogType, QQueryOperations>
  typeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'type');
    });
  }
}
