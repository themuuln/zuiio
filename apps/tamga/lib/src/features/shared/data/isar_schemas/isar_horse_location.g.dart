// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_horse_location.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarHorseLocationCollection on Isar {
  IsarCollection<IsarHorseLocation> get isarHorseLocations => this.collection();
}

final IsarHorseLocationSchema = CollectionSchema(
  name: r'IsarHorseLocation',
  id: int.parse('2620617625593184836'),
  properties: {
    r'coatColor': PropertySchema(
      id: int.parse('0'),
      name: r'coatColor',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: int.parse('1'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'horseName': PropertySchema(
      id: int.parse('2'),
      name: r'horseName',
      type: IsarType.string,
    ),
    r'isVisible': PropertySchema(
      id: int.parse('3'),
      name: r'isVisible',
      type: IsarType.bool,
    ),
    r'lastUpdated': PropertySchema(
      id: int.parse('4'),
      name: r'lastUpdated',
      type: IsarType.dateTime,
    ),
    r'lat': PropertySchema(
      id: int.parse('5'),
      name: r'lat',
      type: IsarType.double,
    ),
    r'lng': PropertySchema(
      id: int.parse('6'),
      name: r'lng',
      type: IsarType.double,
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
  },
  estimateSize: _isarHorseLocationEstimateSize,
  serialize: _isarHorseLocationSerialize,
  deserialize: _isarHorseLocationDeserialize,
  deserializeProp: _isarHorseLocationDeserializeProp,
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
  getId: _isarHorseLocationGetId,
  getLinks: _isarHorseLocationGetLinks,
  attach: _isarHorseLocationAttach,
  version: '3.1.0+1',
);

int _isarHorseLocationEstimateSize(
  IsarHorseLocation object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.coatColor;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.horseName.length * 3;
  bytesCount += 3 + object.ownerId.length * 3;
  bytesCount += 3 + object.ownerName.length * 3;
  return bytesCount;
}

void _isarHorseLocationSerialize(
  IsarHorseLocation object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.coatColor);
  writer.writeString(offsets[1], object.domainId);
  writer.writeString(offsets[2], object.horseName);
  writer.writeBool(offsets[3], object.isVisible);
  writer.writeDateTime(offsets[4], object.lastUpdated);
  writer.writeDouble(offsets[5], object.lat);
  writer.writeDouble(offsets[6], object.lng);
  writer.writeString(offsets[7], object.ownerId);
  writer.writeString(offsets[8], object.ownerName);
}

IsarHorseLocation _isarHorseLocationDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarHorseLocation();
  object.coatColor = reader.readStringOrNull(offsets[0]);
  object.domainId = reader.readString(offsets[1]);
  object.horseName = reader.readString(offsets[2]);
  object.id = id;
  object.isVisible = reader.readBool(offsets[3]);
  object.lastUpdated = reader.readDateTime(offsets[4]);
  object.lat = reader.readDouble(offsets[5]);
  object.lng = reader.readDouble(offsets[6]);
  object.ownerId = reader.readString(offsets[7]);
  object.ownerName = reader.readString(offsets[8]);
  return object;
}

P _isarHorseLocationDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringOrNull(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readBool(offset)) as P;
    case 4:
      return (reader.readDateTime(offset)) as P;
    case 5:
      return (reader.readDouble(offset)) as P;
    case 6:
      return (reader.readDouble(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarHorseLocationGetId(IsarHorseLocation object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarHorseLocationGetLinks(
  IsarHorseLocation object,
) {
  return [];
}

void _isarHorseLocationAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarHorseLocation object,
) {
  object.id = id;
}

extension IsarHorseLocationByIndex on IsarCollection<IsarHorseLocation> {
  Future<IsarHorseLocation?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarHorseLocation? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarHorseLocation?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarHorseLocation?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarHorseLocation object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarHorseLocation object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarHorseLocation> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarHorseLocation> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarHorseLocationQueryWhereSort
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QWhere> {
  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarHorseLocationQueryWhere
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QWhereClause> {
  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterWhereClause>
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

extension IsarHorseLocationQueryFilter
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QFilterCondition> {
  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'coatColor'),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'coatColor'),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'coatColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'coatColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'coatColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'coatColor',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'coatColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'coatColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'coatColor',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'coatColor',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'coatColor', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  coatColorIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'coatColor', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  horseNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  horseNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  isVisibleEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'isVisible', value: value),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lastUpdatedEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'lastUpdated', value: value),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lastUpdatedGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lastUpdated',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lastUpdatedLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lastUpdated',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lastUpdatedBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lastUpdated',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  latEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'lat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  latGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  latLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  latBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lat',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lngEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'lng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lngGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lngLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  lngBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lng',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  ownerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  ownerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
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

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  ownerNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerName', value: ''),
      );
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterFilterCondition>
  ownerNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerName', value: ''),
      );
    });
  }
}

extension IsarHorseLocationQueryObject
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QFilterCondition> {}

extension IsarHorseLocationQueryLinks
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QFilterCondition> {}

extension IsarHorseLocationQuerySortBy
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QSortBy> {
  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByCoatColor() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByCoatColorDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByIsVisible() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVisible', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByIsVisibleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVisible', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByLastUpdated() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastUpdated', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByLastUpdatedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastUpdated', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy> sortByLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lat', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByLatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lat', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy> sortByLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lng', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByLngDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lng', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByOwnerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  sortByOwnerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.desc);
    });
  }
}

extension IsarHorseLocationQuerySortThenBy
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QSortThenBy> {
  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByCoatColor() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByCoatColorDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByIsVisible() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVisible', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByIsVisibleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVisible', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByLastUpdated() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastUpdated', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByLastUpdatedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastUpdated', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy> thenByLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lat', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByLatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lat', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy> thenByLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lng', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByLngDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lng', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByOwnerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.asc);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QAfterSortBy>
  thenByOwnerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerName', Sort.desc);
    });
  }
}

extension IsarHorseLocationQueryWhereDistinct
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct> {
  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByCoatColor({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coatColor', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByHorseName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByIsVisible() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isVisible');
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByLastUpdated() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastUpdated');
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lat');
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lng');
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByOwnerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarHorseLocation, IsarHorseLocation, QDistinct>
  distinctByOwnerName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerName', caseSensitive: caseSensitive);
    });
  }
}

extension IsarHorseLocationQueryProperty
    on QueryBuilder<IsarHorseLocation, IsarHorseLocation, QQueryProperty> {
  QueryBuilder<IsarHorseLocation, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarHorseLocation, String?, QQueryOperations>
  coatColorProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coatColor');
    });
  }

  QueryBuilder<IsarHorseLocation, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarHorseLocation, String, QQueryOperations>
  horseNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseName');
    });
  }

  QueryBuilder<IsarHorseLocation, bool, QQueryOperations> isVisibleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isVisible');
    });
  }

  QueryBuilder<IsarHorseLocation, DateTime, QQueryOperations>
  lastUpdatedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastUpdated');
    });
  }

  QueryBuilder<IsarHorseLocation, double, QQueryOperations> latProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lat');
    });
  }

  QueryBuilder<IsarHorseLocation, double, QQueryOperations> lngProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lng');
    });
  }

  QueryBuilder<IsarHorseLocation, String, QQueryOperations> ownerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerId');
    });
  }

  QueryBuilder<IsarHorseLocation, String, QQueryOperations>
  ownerNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerName');
    });
  }
}
