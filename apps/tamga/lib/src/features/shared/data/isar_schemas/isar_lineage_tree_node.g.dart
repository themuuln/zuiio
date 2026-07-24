// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_lineage_tree_node.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarLineageTreeNodeCollection on Isar {
  IsarCollection<IsarLineageTreeNode> get isarLineageTreeNodes =>
      this.collection();
}

const IsarLineageTreeNodeSchema = CollectionSchema(
  name: r'IsarLineageTreeNode',
  id: -8511846605774595424,
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
    r'branchOrder': PropertySchema(
      id: 2,
      name: r'branchOrder',
      type: IsarType.long,
    ),
    r'coat': PropertySchema(
      id: 3,
      name: r'coat',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: 4,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'generation': PropertySchema(
      id: 5,
      name: r'generation',
      type: IsarType.long,
    ),
    r'hiddenBranchCount': PropertySchema(
      id: 6,
      name: r'hiddenBranchCount',
      type: IsarType.long,
    ),
    r'isOwnedByHousehold': PropertySchema(
      id: 7,
      name: r'isOwnedByHousehold',
      type: IsarType.bool,
    ),
    r'isRoot': PropertySchema(
      id: 8,
      name: r'isRoot',
      type: IsarType.bool,
    ),
    r'name': PropertySchema(
      id: 9,
      name: r'name',
      type: IsarType.string,
    ),
    r'offspringCount': PropertySchema(
      id: 10,
      name: r'offspringCount',
      type: IsarType.long,
    ),
    r'photoUrl': PropertySchema(
      id: 11,
      name: r'photoUrl',
      type: IsarType.string,
    ),
    r'region': PropertySchema(
      id: 12,
      name: r'region',
      type: IsarType.string,
    ),
    r'relationLabel': PropertySchema(
      id: 13,
      name: r'relationLabel',
      type: IsarType.string,
    ),
    r'rootId': PropertySchema(
      id: 14,
      name: r'rootId',
      type: IsarType.string,
    ),
    r'sex': PropertySchema(
      id: 15,
      name: r'sex',
      type: IsarType.string,
    ),
    r'sortOrder': PropertySchema(
      id: 16,
      name: r'sortOrder',
      type: IsarType.long,
    ),
    r'speedIndex': PropertySchema(
      id: 17,
      name: r'speedIndex',
      type: IsarType.double,
    ),
    r'tamgaNo': PropertySchema(
      id: 18,
      name: r'tamgaNo',
      type: IsarType.string,
    )
  },
  estimateSize: _isarLineageTreeNodeEstimateSize,
  serialize: _isarLineageTreeNodeSerialize,
  deserialize: _isarLineageTreeNodeDeserialize,
  deserializeProp: _isarLineageTreeNodeDeserializeProp,
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
    r'rootId': IndexSchema(
      id: 5087693435549841488,
      name: r'rootId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'rootId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarLineageTreeNodeGetId,
  getLinks: _isarLineageTreeNodeGetLinks,
  attach: _isarLineageTreeNodeAttach,
  version: '3.1.0+1',
);

int _isarLineageTreeNodeEstimateSize(
  IsarLineageTreeNode object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.coat.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.name.length * 3;
  {
    final value = object.photoUrl;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.region;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.relationLabel.length * 3;
  bytesCount += 3 + object.rootId.length * 3;
  {
    final value = object.sex;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.tamgaNo;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  return bytesCount;
}

void _isarLineageTreeNodeSerialize(
  IsarLineageTreeNode object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeLong(offsets[0], object.awardCount);
  writer.writeLong(offsets[1], object.birthYear);
  writer.writeLong(offsets[2], object.branchOrder);
  writer.writeString(offsets[3], object.coat);
  writer.writeString(offsets[4], object.domainId);
  writer.writeLong(offsets[5], object.generation);
  writer.writeLong(offsets[6], object.hiddenBranchCount);
  writer.writeBool(offsets[7], object.isOwnedByHousehold);
  writer.writeBool(offsets[8], object.isRoot);
  writer.writeString(offsets[9], object.name);
  writer.writeLong(offsets[10], object.offspringCount);
  writer.writeString(offsets[11], object.photoUrl);
  writer.writeString(offsets[12], object.region);
  writer.writeString(offsets[13], object.relationLabel);
  writer.writeString(offsets[14], object.rootId);
  writer.writeString(offsets[15], object.sex);
  writer.writeLong(offsets[16], object.sortOrder);
  writer.writeDouble(offsets[17], object.speedIndex);
  writer.writeString(offsets[18], object.tamgaNo);
}

IsarLineageTreeNode _isarLineageTreeNodeDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarLineageTreeNode();
  object.awardCount = reader.readLong(offsets[0]);
  object.birthYear = reader.readLong(offsets[1]);
  object.branchOrder = reader.readLong(offsets[2]);
  object.coat = reader.readString(offsets[3]);
  object.domainId = reader.readString(offsets[4]);
  object.generation = reader.readLong(offsets[5]);
  object.hiddenBranchCount = reader.readLong(offsets[6]);
  object.id = id;
  object.isOwnedByHousehold = reader.readBool(offsets[7]);
  object.isRoot = reader.readBool(offsets[8]);
  object.name = reader.readString(offsets[9]);
  object.offspringCount = reader.readLong(offsets[10]);
  object.photoUrl = reader.readStringOrNull(offsets[11]);
  object.region = reader.readStringOrNull(offsets[12]);
  object.relationLabel = reader.readString(offsets[13]);
  object.rootId = reader.readString(offsets[14]);
  object.sex = reader.readStringOrNull(offsets[15]);
  object.sortOrder = reader.readLong(offsets[16]);
  object.speedIndex = reader.readDoubleOrNull(offsets[17]);
  object.tamgaNo = reader.readStringOrNull(offsets[18]);
  return object;
}

P _isarLineageTreeNodeDeserializeProp<P>(
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
      return (reader.readLong(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readLong(offset)) as P;
    case 6:
      return (reader.readLong(offset)) as P;
    case 7:
      return (reader.readBool(offset)) as P;
    case 8:
      return (reader.readBool(offset)) as P;
    case 9:
      return (reader.readString(offset)) as P;
    case 10:
      return (reader.readLong(offset)) as P;
    case 11:
      return (reader.readStringOrNull(offset)) as P;
    case 12:
      return (reader.readStringOrNull(offset)) as P;
    case 13:
      return (reader.readString(offset)) as P;
    case 14:
      return (reader.readString(offset)) as P;
    case 15:
      return (reader.readStringOrNull(offset)) as P;
    case 16:
      return (reader.readLong(offset)) as P;
    case 17:
      return (reader.readDoubleOrNull(offset)) as P;
    case 18:
      return (reader.readStringOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarLineageTreeNodeGetId(IsarLineageTreeNode object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarLineageTreeNodeGetLinks(
    IsarLineageTreeNode object) {
  return [];
}

void _isarLineageTreeNodeAttach(
    IsarCollection<dynamic> col, Id id, IsarLineageTreeNode object) {
  object.id = id;
}

extension IsarLineageTreeNodeByIndex on IsarCollection<IsarLineageTreeNode> {
  Future<IsarLineageTreeNode?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarLineageTreeNode? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarLineageTreeNode?>> getAllByDomainId(
      List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarLineageTreeNode?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarLineageTreeNode object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarLineageTreeNode object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarLineageTreeNode> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(List<IsarLineageTreeNode> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarLineageTreeNodeQueryWhereSort
    on QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QWhere> {
  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarLineageTreeNodeQueryWhere
    on QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QWhereClause> {
  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      idBetween(
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'domainId',
        value: [domainId],
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      rootIdEqualTo(String rootId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'rootId',
        value: [rootId],
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterWhereClause>
      rootIdNotEqualTo(String rootId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'rootId',
              lower: [],
              upper: [rootId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'rootId',
              lower: [rootId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'rootId',
              lower: [rootId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'rootId',
              lower: [],
              upper: [rootId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension IsarLineageTreeNodeQueryFilter on QueryBuilder<IsarLineageTreeNode,
    IsarLineageTreeNode, QFilterCondition> {
  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      awardCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'awardCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      birthYearEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'birthYear',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      branchOrderEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'branchOrder',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      branchOrderGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'branchOrder',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      branchOrderLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'branchOrder',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      branchOrderBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'branchOrder',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      coatContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'coat',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      coatMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'coat',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      coatIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'coat',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      coatIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'coat',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      domainIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'domainId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      domainIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'domainId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'domainId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      generationEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'generation',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      generationGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'generation',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      generationLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'generation',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      generationBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'generation',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      hiddenBranchCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'hiddenBranchCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      hiddenBranchCountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'hiddenBranchCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      hiddenBranchCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'hiddenBranchCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      hiddenBranchCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'hiddenBranchCount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      isOwnedByHouseholdEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isOwnedByHousehold',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      isRootEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isRoot',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      nameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'name',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      nameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'name',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      nameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      nameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'name',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      offspringCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'offspringCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'photoUrl',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'photoUrl',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'photoUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'photoUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'photoUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'photoUrl',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'photoUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'photoUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'photoUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'photoUrl',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'photoUrl',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      photoUrlIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'photoUrl',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'region',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'region',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'region',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'region',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'region',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'region',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'region',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'region',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'region',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'region',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'region',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      regionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'region',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      relationLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'relationLabel',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      relationLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'relationLabel',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      relationLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'relationLabel',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      relationLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'relationLabel',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'rootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'rootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'rootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'rootId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'rootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'rootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'rootId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'rootId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'rootId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      rootIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'rootId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'sex',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'sex',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sex',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'sex',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'sex',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'sex',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'sex',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'sex',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'sex',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'sex',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sex',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sexIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'sex',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sortOrderEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'sortOrder',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sortOrderGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'sortOrder',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sortOrderLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'sortOrder',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      sortOrderBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'sortOrder',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      speedIndexIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'speedIndex',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      speedIndexIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'speedIndex',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      speedIndexEqualTo(
    double? value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'speedIndex',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      speedIndexGreaterThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'speedIndex',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      speedIndexLessThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'speedIndex',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      speedIndexBetween(
    double? lower,
    double? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'speedIndex',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'tamgaNo',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'tamgaNo',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'tamgaNo',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'tamgaNo',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'tamgaNo',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'tamgaNo',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'tamgaNo',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'tamgaNo',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'tamgaNo',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'tamgaNo',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'tamgaNo',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterFilterCondition>
      tamgaNoIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'tamgaNo',
        value: '',
      ));
    });
  }
}

extension IsarLineageTreeNodeQueryObject on QueryBuilder<IsarLineageTreeNode,
    IsarLineageTreeNode, QFilterCondition> {}

extension IsarLineageTreeNodeQueryLinks on QueryBuilder<IsarLineageTreeNode,
    IsarLineageTreeNode, QFilterCondition> {}

extension IsarLineageTreeNodeQuerySortBy
    on QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QSortBy> {
  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByAwardCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByBirthYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByBranchOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'branchOrder', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByBranchOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'branchOrder', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByCoat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByCoatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByGeneration() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'generation', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByGenerationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'generation', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByHiddenBranchCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hiddenBranchCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByHiddenBranchCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hiddenBranchCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByIsOwnedByHousehold() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByIsOwnedByHouseholdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByIsRoot() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isRoot', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByIsRootDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isRoot', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByOffspringCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByPhotoUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByPhotoUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByRegion() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByRegionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByRelationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByRelationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByRootId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByRootIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortBySex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sex', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortBySexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sex', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortBySortOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortBySpeedIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'speedIndex', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortBySpeedIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'speedIndex', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByTamgaNo() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaNo', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      sortByTamgaNoDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaNo', Sort.desc);
    });
  }
}

extension IsarLineageTreeNodeQuerySortThenBy
    on QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QSortThenBy> {
  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByAwardCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'awardCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByBirthYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'birthYear', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByBranchOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'branchOrder', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByBranchOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'branchOrder', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByCoat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByCoatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coat', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByGeneration() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'generation', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByGenerationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'generation', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByHiddenBranchCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hiddenBranchCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByHiddenBranchCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'hiddenBranchCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByIsOwnedByHousehold() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByIsOwnedByHouseholdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isOwnedByHousehold', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByIsRoot() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isRoot', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByIsRootDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isRoot', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'name', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByOffspringCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'offspringCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByPhotoUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByPhotoUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByRegion() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByRegionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'region', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByRelationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByRelationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByRootId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByRootIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenBySex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sex', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenBySexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sex', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenBySortOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenBySpeedIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'speedIndex', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenBySpeedIndexDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'speedIndex', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByTamgaNo() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaNo', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QAfterSortBy>
      thenByTamgaNoDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaNo', Sort.desc);
    });
  }
}

extension IsarLineageTreeNodeQueryWhereDistinct
    on QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct> {
  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByAwardCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'awardCount');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByBirthYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'birthYear');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByBranchOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'branchOrder');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByCoat({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coat', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByGeneration() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'generation');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByHiddenBranchCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'hiddenBranchCount');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByIsOwnedByHousehold() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isOwnedByHousehold');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByIsRoot() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isRoot');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'name', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByOffspringCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'offspringCount');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByPhotoUrl({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'photoUrl', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByRegion({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'region', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByRelationLabel({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'relationLabel',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByRootId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'rootId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctBySex({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sex', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sortOrder');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctBySpeedIndex() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'speedIndex');
    });
  }

  QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QDistinct>
      distinctByTamgaNo({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'tamgaNo', caseSensitive: caseSensitive);
    });
  }
}

extension IsarLineageTreeNodeQueryProperty
    on QueryBuilder<IsarLineageTreeNode, IsarLineageTreeNode, QQueryProperty> {
  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations>
      awardCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'awardCount');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations> birthYearProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'birthYear');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations>
      branchOrderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'branchOrder');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String, QQueryOperations> coatProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coat');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String, QQueryOperations>
      domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations>
      generationProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'generation');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations>
      hiddenBranchCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'hiddenBranchCount');
    });
  }

  QueryBuilder<IsarLineageTreeNode, bool, QQueryOperations>
      isOwnedByHouseholdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isOwnedByHousehold');
    });
  }

  QueryBuilder<IsarLineageTreeNode, bool, QQueryOperations> isRootProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isRoot');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String, QQueryOperations> nameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'name');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations>
      offspringCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'offspringCount');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String?, QQueryOperations>
      photoUrlProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'photoUrl');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String?, QQueryOperations>
      regionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'region');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String, QQueryOperations>
      relationLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'relationLabel');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String, QQueryOperations> rootIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'rootId');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String?, QQueryOperations> sexProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sex');
    });
  }

  QueryBuilder<IsarLineageTreeNode, int, QQueryOperations> sortOrderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sortOrder');
    });
  }

  QueryBuilder<IsarLineageTreeNode, double?, QQueryOperations>
      speedIndexProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'speedIndex');
    });
  }

  QueryBuilder<IsarLineageTreeNode, String?, QQueryOperations>
      tamgaNoProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'tamgaNo');
    });
  }
}
