// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_sync_queue_item.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarSyncQueueItemCollection on Isar {
  IsarCollection<IsarSyncQueueItem> get isarSyncQueueItems => this.collection();
}

const IsarSyncQueueItemSchema = CollectionSchema(
  name: r'IsarSyncQueueItem',
  id: 1568309971225112296,
  properties: {
    r'action': PropertySchema(
      id: 0,
      name: r'action',
      type: IsarType.byte,
      enumMap: _IsarSyncQueueItemactionEnumValueMap,
    ),
    r'dataJson': PropertySchema(
      id: 1,
      name: r'dataJson',
      type: IsarType.string,
    ),
    r'entityId': PropertySchema(
      id: 2,
      name: r'entityId',
      type: IsarType.string,
    ),
    r'entityType': PropertySchema(
      id: 3,
      name: r'entityType',
      type: IsarType.string,
    ),
    r'isDeadLetter': PropertySchema(
      id: 4,
      name: r'isDeadLetter',
      type: IsarType.bool,
    ),
    r'lastAttemptAt': PropertySchema(
      id: 5,
      name: r'lastAttemptAt',
      type: IsarType.dateTime,
    ),
    r'movedAt': PropertySchema(
      id: 6,
      name: r'movedAt',
      type: IsarType.dateTime,
    ),
    r'retryCount': PropertySchema(
      id: 7,
      name: r'retryCount',
      type: IsarType.long,
    ),
    r'status': PropertySchema(
      id: 8,
      name: r'status',
      type: IsarType.byte,
      enumMap: _IsarSyncQueueItemstatusEnumValueMap,
    ),
    r'timestamp': PropertySchema(
      id: 9,
      name: r'timestamp',
      type: IsarType.dateTime,
    )
  },
  estimateSize: _isarSyncQueueItemEstimateSize,
  serialize: _isarSyncQueueItemSerialize,
  deserialize: _isarSyncQueueItemDeserialize,
  deserializeProp: _isarSyncQueueItemDeserializeProp,
  idName: r'id',
  indexes: {},
  links: {},
  embeddedSchemas: {},
  getId: _isarSyncQueueItemGetId,
  getLinks: _isarSyncQueueItemGetLinks,
  attach: _isarSyncQueueItemAttach,
  version: '3.1.0+1',
);

int _isarSyncQueueItemEstimateSize(
  IsarSyncQueueItem object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.dataJson.length * 3;
  bytesCount += 3 + object.entityId.length * 3;
  bytesCount += 3 + object.entityType.length * 3;
  return bytesCount;
}

void _isarSyncQueueItemSerialize(
  IsarSyncQueueItem object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeByte(offsets[0], object.action.index);
  writer.writeString(offsets[1], object.dataJson);
  writer.writeString(offsets[2], object.entityId);
  writer.writeString(offsets[3], object.entityType);
  writer.writeBool(offsets[4], object.isDeadLetter);
  writer.writeDateTime(offsets[5], object.lastAttemptAt);
  writer.writeDateTime(offsets[6], object.movedAt);
  writer.writeLong(offsets[7], object.retryCount);
  writer.writeByte(offsets[8], object.status.index);
  writer.writeDateTime(offsets[9], object.timestamp);
}

IsarSyncQueueItem _isarSyncQueueItemDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarSyncQueueItem();
  object.action =
      _IsarSyncQueueItemactionValueEnumMap[reader.readByteOrNull(offsets[0])] ??
          SyncAction.create;
  object.dataJson = reader.readString(offsets[1]);
  object.entityId = reader.readString(offsets[2]);
  object.entityType = reader.readString(offsets[3]);
  object.id = id;
  object.isDeadLetter = reader.readBool(offsets[4]);
  object.lastAttemptAt = reader.readDateTimeOrNull(offsets[5]);
  object.movedAt = reader.readDateTimeOrNull(offsets[6]);
  object.retryCount = reader.readLong(offsets[7]);
  object.status =
      _IsarSyncQueueItemstatusValueEnumMap[reader.readByteOrNull(offsets[8])] ??
          SyncItemStatus.pending;
  object.timestamp = reader.readDateTime(offsets[9]);
  return object;
}

P _isarSyncQueueItemDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (_IsarSyncQueueItemactionValueEnumMap[
              reader.readByteOrNull(offset)] ??
          SyncAction.create) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readBool(offset)) as P;
    case 5:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 6:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 7:
      return (reader.readLong(offset)) as P;
    case 8:
      return (_IsarSyncQueueItemstatusValueEnumMap[
              reader.readByteOrNull(offset)] ??
          SyncItemStatus.pending) as P;
    case 9:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarSyncQueueItemactionEnumValueMap = {
  'create': 0,
  'update': 1,
  'delete': 2,
};
const _IsarSyncQueueItemactionValueEnumMap = {
  0: SyncAction.create,
  1: SyncAction.update,
  2: SyncAction.delete,
};
const _IsarSyncQueueItemstatusEnumValueMap = {
  'pending': 0,
  'synced': 1,
  'failed': 2,
};
const _IsarSyncQueueItemstatusValueEnumMap = {
  0: SyncItemStatus.pending,
  1: SyncItemStatus.synced,
  2: SyncItemStatus.failed,
};

Id _isarSyncQueueItemGetId(IsarSyncQueueItem object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarSyncQueueItemGetLinks(
    IsarSyncQueueItem object) {
  return [];
}

void _isarSyncQueueItemAttach(
    IsarCollection<dynamic> col, Id id, IsarSyncQueueItem object) {
  object.id = id;
}

extension IsarSyncQueueItemQueryWhereSort
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QWhere> {
  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarSyncQueueItemQueryWhere
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QWhereClause> {
  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterWhereClause>
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

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterWhereClause>
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
}

extension IsarSyncQueueItemQueryFilter
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QFilterCondition> {
  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      actionEqualTo(SyncAction value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'action',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      actionGreaterThan(
    SyncAction value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'action',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      actionLessThan(
    SyncAction value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'action',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      actionBetween(
    SyncAction lower,
    SyncAction upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'action',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'dataJson',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'dataJson',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'dataJson',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'dataJson',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'dataJson',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'dataJson',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'dataJson',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'dataJson',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'dataJson',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      dataJsonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'dataJson',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'entityId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'entityId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'entityId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'entityId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'entityId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'entityId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'entityId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'entityId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'entityId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'entityId',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'entityType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'entityType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'entityType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'entityType',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'entityType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'entityType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'entityType',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'entityType',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'entityType',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      entityTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'entityType',
        value: '',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
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

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
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

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
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

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      isDeadLetterEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'isDeadLetter',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      lastAttemptAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'lastAttemptAt',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      lastAttemptAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'lastAttemptAt',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      lastAttemptAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lastAttemptAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      lastAttemptAtGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lastAttemptAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      lastAttemptAtLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lastAttemptAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      lastAttemptAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lastAttemptAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      movedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'movedAt',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      movedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'movedAt',
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      movedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'movedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      movedAtGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'movedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      movedAtLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'movedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      movedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'movedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      retryCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'retryCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      retryCountGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'retryCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      retryCountLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'retryCount',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      retryCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'retryCount',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      statusEqualTo(SyncItemStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      statusGreaterThan(
    SyncItemStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      statusLessThan(
    SyncItemStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'status',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      statusBetween(
    SyncItemStatus lower,
    SyncItemStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'status',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      timestampEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'timestamp',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      timestampGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'timestamp',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      timestampLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'timestamp',
        value: value,
      ));
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterFilterCondition>
      timestampBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'timestamp',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension IsarSyncQueueItemQueryObject
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QFilterCondition> {}

extension IsarSyncQueueItemQueryLinks
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QFilterCondition> {}

extension IsarSyncQueueItemQuerySortBy
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QSortBy> {
  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByAction() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'action', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByActionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'action', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByDataJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataJson', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByDataJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataJson', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByEntityId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityId', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByEntityIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityId', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByEntityType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityType', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByEntityTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityType', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByIsDeadLetter() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDeadLetter', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByIsDeadLetterDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDeadLetter', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByLastAttemptAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastAttemptAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByLastAttemptAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastAttemptAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByMovedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'movedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByMovedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'movedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByRetryCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'retryCount', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByRetryCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'retryCount', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByTimestamp() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timestamp', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      sortByTimestampDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timestamp', Sort.desc);
    });
  }
}

extension IsarSyncQueueItemQuerySortThenBy
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QSortThenBy> {
  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByAction() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'action', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByActionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'action', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByDataJson() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataJson', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByDataJsonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'dataJson', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByEntityId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityId', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByEntityIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityId', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByEntityType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityType', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByEntityTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'entityType', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByIsDeadLetter() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDeadLetter', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByIsDeadLetterDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isDeadLetter', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByLastAttemptAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastAttemptAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByLastAttemptAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastAttemptAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByMovedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'movedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByMovedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'movedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByRetryCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'retryCount', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByRetryCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'retryCount', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByTimestamp() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timestamp', Sort.asc);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QAfterSortBy>
      thenByTimestampDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'timestamp', Sort.desc);
    });
  }
}

extension IsarSyncQueueItemQueryWhereDistinct
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct> {
  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByAction() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'action');
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByDataJson({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'dataJson', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByEntityId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'entityId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByEntityType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'entityType', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByIsDeadLetter() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isDeadLetter');
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByLastAttemptAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastAttemptAt');
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByMovedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'movedAt');
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByRetryCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'retryCount');
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status');
    });
  }

  QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QDistinct>
      distinctByTimestamp() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'timestamp');
    });
  }
}

extension IsarSyncQueueItemQueryProperty
    on QueryBuilder<IsarSyncQueueItem, IsarSyncQueueItem, QQueryProperty> {
  QueryBuilder<IsarSyncQueueItem, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarSyncQueueItem, SyncAction, QQueryOperations>
      actionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'action');
    });
  }

  QueryBuilder<IsarSyncQueueItem, String, QQueryOperations> dataJsonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'dataJson');
    });
  }

  QueryBuilder<IsarSyncQueueItem, String, QQueryOperations> entityIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'entityId');
    });
  }

  QueryBuilder<IsarSyncQueueItem, String, QQueryOperations>
      entityTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'entityType');
    });
  }

  QueryBuilder<IsarSyncQueueItem, bool, QQueryOperations>
      isDeadLetterProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isDeadLetter');
    });
  }

  QueryBuilder<IsarSyncQueueItem, DateTime?, QQueryOperations>
      lastAttemptAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastAttemptAt');
    });
  }

  QueryBuilder<IsarSyncQueueItem, DateTime?, QQueryOperations>
      movedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'movedAt');
    });
  }

  QueryBuilder<IsarSyncQueueItem, int, QQueryOperations> retryCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'retryCount');
    });
  }

  QueryBuilder<IsarSyncQueueItem, SyncItemStatus, QQueryOperations>
      statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarSyncQueueItem, DateTime, QQueryOperations>
      timestampProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'timestamp');
    });
  }
}
