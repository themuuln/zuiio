// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_lineage_snapshot.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarLineageSnapshotCollection on Isar {
  IsarCollection<IsarLineageSnapshot> get isarLineageSnapshots =>
      this.collection();
}

const IsarLineageSnapshotSchema = CollectionSchema(
  name: r'IsarLineageSnapshot',
  id: 7534822217904641931,
  properties: {
    r'cachedAt': PropertySchema(
      id: 0,
      name: r'cachedAt',
      type: IsarType.dateTime,
    ),
    r'relatedHorsesJson': PropertySchema(
      id: 1,
      name: r'relatedHorsesJson',
      type: IsarType.string,
    ),
    r'rootId': PropertySchema(id: 2, name: r'rootId', type: IsarType.string),
    r'timelineJson': PropertySchema(
      id: 3,
      name: r'timelineJson',
      type: IsarType.string,
    ),
    r'treeEdgesJson': PropertySchema(
      id: 4,
      name: r'treeEdgesJson',
      type: IsarType.string,
    ),
    r'treeNodesJson': PropertySchema(
      id: 5,
      name: r'treeNodesJson',
      type: IsarType.string,
    ),
    r'treeSummary': PropertySchema(
      id: 6,
      name: r'treeSummary',
      type: IsarType.string,
    ),
  },
  estimateSize: _isarLineageSnapshotEstimateSize,
  serialize: _isarLineageSnapshotSerialize,
  deserialize: _isarLineageSnapshotDeserialize,
  deserializeProp: _isarLineageSnapshotDeserializeProp,
  idName: r'id',
  indexes: {
    r'rootId': IndexSchema(
      id: 5087693435549841488,
      name: r'rootId',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'rootId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarLineageSnapshotGetId,
  getLinks: _isarLineageSnapshotGetLinks,
  attach: _isarLineageSnapshotAttach,
  version: '3.1.0+1',
);

int _isarLineageSnapshotEstimateSize(
  IsarLineageSnapshot object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.relatedHorsesJson.length * 3;
  bytesCount += 3 + object.rootId.length * 3;
  bytesCount += 3 + object.timelineJson.length * 3;
  bytesCount += 3 + object.treeEdgesJson.length * 3;
  bytesCount += 3 + object.treeNodesJson.length * 3;
  bytesCount += 3 + object.treeSummary.length * 3;
  return bytesCount;
}

void _isarLineageSnapshotSerialize(
  IsarLineageSnapshot object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.cachedAt);
  writer.writeString(offsets[1], object.relatedHorsesJson);
  writer.writeString(offsets[2], object.rootId);
  writer.writeString(offsets[3], object.timelineJson);
  writer.writeString(offsets[4], object.treeEdgesJson);
  writer.writeString(offsets[5], object.treeNodesJson);
  writer.writeString(offsets[6], object.treeSummary);
}

IsarLineageSnapshot _isarLineageSnapshotDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarLineageSnapshot();
  object.cachedAt = reader.readDateTime(offsets[0]);
  object.id = id;
  object.relatedHorsesJson = reader.readString(offsets[1]);
  object.rootId = reader.readString(offsets[2]);
  object.timelineJson = reader.readString(offsets[3]);
  object.treeEdgesJson = reader.readString(offsets[4]);
  object.treeNodesJson = reader.readString(offsets[5]);
  object.treeSummary = reader.readString(offsets[6]);
  return object;
}

P _isarLineageSnapshotDeserializeProp<P>(
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
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarLineageSnapshotGetId(IsarLineageSnapshot object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarLineageSnapshotGetLinks(
  IsarLineageSnapshot object,
) {
  return [];
}

void _isarLineageSnapshotAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarLineageSnapshot object,
) {
  object.id = id;
}

extension IsarLineageSnapshotByIndex on IsarCollection<IsarLineageSnapshot> {
  Future<IsarLineageSnapshot?> getByRootId(String rootId) {
    return getByIndex(r'rootId', [rootId]);
  }

  IsarLineageSnapshot? getByRootIdSync(String rootId) {
    return getByIndexSync(r'rootId', [rootId]);
  }

  Future<bool> deleteByRootId(String rootId) {
    return deleteByIndex(r'rootId', [rootId]);
  }

  bool deleteByRootIdSync(String rootId) {
    return deleteByIndexSync(r'rootId', [rootId]);
  }

  Future<List<IsarLineageSnapshot?>> getAllByRootId(List<String> rootIdValues) {
    final values = rootIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'rootId', values);
  }

  List<IsarLineageSnapshot?> getAllByRootIdSync(List<String> rootIdValues) {
    final values = rootIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'rootId', values);
  }

  Future<int> deleteAllByRootId(List<String> rootIdValues) {
    final values = rootIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'rootId', values);
  }

  int deleteAllByRootIdSync(List<String> rootIdValues) {
    final values = rootIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'rootId', values);
  }

  Future<Id> putByRootId(IsarLineageSnapshot object) {
    return putByIndex(r'rootId', object);
  }

  Id putByRootIdSync(IsarLineageSnapshot object, {bool saveLinks = true}) {
    return putByIndexSync(r'rootId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByRootId(List<IsarLineageSnapshot> objects) {
    return putAllByIndex(r'rootId', objects);
  }

  List<Id> putAllByRootIdSync(
    List<IsarLineageSnapshot> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'rootId', objects, saveLinks: saveLinks);
  }
}

extension IsarLineageSnapshotQueryWhereSort
    on QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QWhere> {
  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarLineageSnapshotQueryWhere
    on QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QWhereClause> {
  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
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

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
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

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
  rootIdEqualTo(String rootId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'rootId', value: [rootId]),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterWhereClause>
  rootIdNotEqualTo(String rootId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'rootId',
                lower: [],
                upper: [rootId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'rootId',
                lower: [rootId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'rootId',
                lower: [rootId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'rootId',
                lower: [],
                upper: [rootId],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarLineageSnapshotQueryFilter
    on
        QueryBuilder<
          IsarLineageSnapshot,
          IsarLineageSnapshot,
          QFilterCondition
        > {
  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  cachedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'cachedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  cachedAtGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'cachedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  cachedAtLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'cachedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  cachedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'cachedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
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

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'relatedHorsesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'relatedHorsesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'relatedHorsesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'relatedHorsesJson',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'relatedHorsesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'relatedHorsesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'relatedHorsesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'relatedHorsesJson',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'relatedHorsesJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  relatedHorsesJsonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'relatedHorsesJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'rootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'rootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'rootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'rootId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'rootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'rootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'rootId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'rootId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'rootId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  rootIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'rootId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'timelineJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'timelineJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'timelineJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'timelineJson',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'timelineJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'timelineJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'timelineJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'timelineJson',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'timelineJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  timelineJsonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'timelineJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'treeEdgesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'treeEdgesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'treeEdgesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'treeEdgesJson',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'treeEdgesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'treeEdgesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'treeEdgesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'treeEdgesJson',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'treeEdgesJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeEdgesJsonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'treeEdgesJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'treeNodesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'treeNodesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'treeNodesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'treeNodesJson',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'treeNodesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'treeNodesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'treeNodesJson',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'treeNodesJson',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'treeNodesJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeNodesJsonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'treeNodesJson', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'treeSummary',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'treeSummary',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'treeSummary',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'treeSummary',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'treeSummary',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'treeSummary',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'treeSummary',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'treeSummary',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'treeSummary', value: ''),
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterFilterCondition>
  treeSummaryIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'treeSummary', value: ''),
      );
    });
  }
}

extension IsarLineageSnapshotQueryObject
    on
        QueryBuilder<
          IsarLineageSnapshot,
          IsarLineageSnapshot,
          QFilterCondition
        > {}

extension IsarLineageSnapshotQueryLinks
    on
        QueryBuilder<
          IsarLineageSnapshot,
          IsarLineageSnapshot,
          QFilterCondition
        > {}

extension IsarLineageSnapshotQuerySortBy
    on QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QSortBy> {
  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByRelatedHorsesJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relatedHorsesJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByRelatedHorsesJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relatedHorsesJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByRootId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByRootIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTimelineJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timelineJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTimelineJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timelineJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTreeEdgesJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeEdgesJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTreeEdgesJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeEdgesJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTreeNodesJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeNodesJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTreeNodesJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeNodesJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTreeSummary() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeSummary', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  sortByTreeSummaryDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeSummary', Sort.desc);
    });
  }
}

extension IsarLineageSnapshotQuerySortThenBy
    on QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QSortThenBy> {
  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByRelatedHorsesJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relatedHorsesJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByRelatedHorsesJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'relatedHorsesJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByRootId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByRootIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'rootId', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTimelineJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timelineJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTimelineJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timelineJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTreeEdgesJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeEdgesJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTreeEdgesJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeEdgesJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTreeNodesJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeNodesJson', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTreeNodesJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeNodesJson', Sort.desc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTreeSummary() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeSummary', Sort.asc);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QAfterSortBy>
  thenByTreeSummaryDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'treeSummary', Sort.desc);
    });
  }
}

extension IsarLineageSnapshotQueryWhereDistinct
    on QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct> {
  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'cachedAt');
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByRelatedHorsesJson({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'relatedHorsesJson',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByRootId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'rootId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByTimelineJson({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'timelineJson', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByTreeEdgesJson({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'treeEdgesJson',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByTreeNodesJson({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'treeNodesJson',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QDistinct>
  distinctByTreeSummary({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'treeSummary', caseSensitive: caseSensitive);
    });
  }
}

extension IsarLineageSnapshotQueryProperty
    on QueryBuilder<IsarLineageSnapshot, IsarLineageSnapshot, QQueryProperty> {
  QueryBuilder<IsarLineageSnapshot, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarLineageSnapshot, DateTime, QQueryOperations>
  cachedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'cachedAt');
    });
  }

  QueryBuilder<IsarLineageSnapshot, String, QQueryOperations>
  relatedHorsesJsonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'relatedHorsesJson');
    });
  }

  QueryBuilder<IsarLineageSnapshot, String, QQueryOperations> rootIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'rootId');
    });
  }

  QueryBuilder<IsarLineageSnapshot, String, QQueryOperations>
  timelineJsonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'timelineJson');
    });
  }

  QueryBuilder<IsarLineageSnapshot, String, QQueryOperations>
  treeEdgesJsonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'treeEdgesJson');
    });
  }

  QueryBuilder<IsarLineageSnapshot, String, QQueryOperations>
  treeNodesJsonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'treeNodesJson');
    });
  }

  QueryBuilder<IsarLineageSnapshot, String, QQueryOperations>
  treeSummaryProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'treeSummary');
    });
  }
}
