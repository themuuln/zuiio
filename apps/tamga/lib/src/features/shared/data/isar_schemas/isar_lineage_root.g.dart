// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_lineage_root.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarLineageRootCollection on Isar {
  IsarCollection<IsarLineageRoot> get isarLineageRoots => this.collection();
}

const IsarLineageRootSchema = CollectionSchema(
  name: r'IsarLineageRoot',
  id: 2817765634246830082,
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
    r'domainId': PropertySchema(
      id: 3,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'name': PropertySchema(
      id: 4,
      name: r'name',
      type: IsarType.string,
    ),
    r'notes': PropertySchema(
      id: 5,
      name: r'notes',
      type: IsarType.string,
    ),
    r'offspringCount': PropertySchema(
      id: 6,
      name: r'offspringCount',
      type: IsarType.long,
    )
  },
  estimateSize: _isarLineageRootEstimateSize,
  serialize: _isarLineageRootSerialize,
  deserialize: _isarLineageRootDeserialize,
  deserializeProp: _isarLineageRootDeserializeProp,
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
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarLineageRootGetId,
  getLinks: _isarLineageRootGetLinks,
  attach: _isarLineageRootAttach,
  version: '3.1.0+1',
);

int _isarLineageRootEstimateSize(
  IsarLineageRoot object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.coat.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.name.length * 3;
  bytesCount += 3 + object.notes.length * 3;
  return bytesCount;
}

void _isarLineageRootSerialize(
  IsarLineageRoot object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.awardCount);
  writer.writeLong(offsets[1], object.birthYear);
  writer.writeString(offsets[2], object.coat);
  writer.writeString(offsets[3], object.domainId);
  writer.writeString(offsets[4], object.name);
  writer.writeString(offsets[5], object.notes);
  writer.writeLong(offsets[6], object.offspringCount);
}

IsarLineageRoot _isarLineageRootDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarLineageRoot();
  object.awardCount = reader.readLong(offsets[0]);
  object.birthYear = reader.readLong(offsets[1]);
  object.coat = reader.readString(offsets[2]);
  object.domainId = reader.readString(offsets[3]);
  object.id = id;
  object.name = reader.readString(offsets[4]);
  object.notes = reader.readString(offsets[5]);
  object.offspringCount = reader.readLong(offsets[6]);
  return object;
}

P _isarLineageRootDeserializeProp<P>(
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
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readLong(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarLineageRootGetId(IsarLineageRoot object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarLineageRootGetLinks(IsarLineageRoot object) {
  return [];
}

void _isarLineageRootAttach(
    IsarCollection<dynamic> col, Id id, IsarLineageRoot object) {
  object.id = id;
}

extension IsarLineageRootByIndex on IsarCollection<IsarLineageRoot> {
  Future<IsarLineageRoot?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarLineageRoot? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarLineageRoot?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarLineageRoot?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarLineageRoot object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarLineageRoot object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarLineageRoot> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(List<IsarLineageRoot> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarLineageRootQueryWhereSort
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QWhere> {
  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarLineageRootQueryWhere
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QWhereClause> {
  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause> idEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause>
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause> idLessThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause>
      domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'domainId',
        value: [domainId],
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterWhereClause>
      domainIdNotEqualTo(String domainId) {
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
}

extension IsarLineageRootQueryFilter
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QFilterCondition> {
  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      awardCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'awardCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      awardCountLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      awardCountBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      birthYearEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'birthYear',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      birthYearLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      birthYearBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatEqualTo(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatGreaterThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatStartsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatEndsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'coat',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'coat',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      coatIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'coat',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdEqualTo(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdGreaterThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdStartsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdEndsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'domainId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      idGreaterThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      idLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      idBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameEqualTo(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameGreaterThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameStartsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameEndsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesEqualTo(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesGreaterThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesLessThan(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesBetween(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesStartsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesEndsWith(
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'notes',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'notes',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'notes',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'notes',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
      offspringCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'offspringCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterFilterCondition>
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
}

extension IsarLineageRootQueryObject
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QFilterCondition> {}

extension IsarLineageRootQueryLinks
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QFilterCondition> {}

extension IsarLineageRootQuerySortBy
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QSortBy> {
  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByAwardCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByBirthYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> sortByCoat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByCoatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      sortByOffspringCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.desc);
    });
  }
}

extension IsarLineageRootQuerySortThenBy
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QSortThenBy> {
  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByAwardCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByBirthYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> thenByCoat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByCoatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy> thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QAfterSortBy>
      thenByOffspringCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.desc);
    });
  }
}

extension IsarLineageRootQueryWhereDistinct
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct> {
  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct>
      distinctByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'awardCount');
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct>
      distinctByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'birthYear');
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct> distinctByCoat(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coat', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct> distinctByDomainId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct> distinctByName(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct> distinctByNotes(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageRoot, IsarLineageRoot, QDistinct>
      distinctByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'offspringCount');
    });
  }
}

extension IsarLineageRootQueryProperty
    on QueryBuilder<IsarLineageRoot, IsarLineageRoot, QQueryProperty> {
  QueryBuilder<IsarLineageRoot, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarLineageRoot, int, QQueryOperations> awardCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'awardCount');
    });
  }

  QueryBuilder<IsarLineageRoot, int, QQueryOperations> birthYearProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'birthYear');
    });
  }

  QueryBuilder<IsarLineageRoot, String, QQueryOperations> coatProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coat');
    });
  }

  QueryBuilder<IsarLineageRoot, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarLineageRoot, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }

  QueryBuilder<IsarLineageRoot, String, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarLineageRoot, int, QQueryOperations>
      offspringCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'offspringCount');
    });
  }
}
