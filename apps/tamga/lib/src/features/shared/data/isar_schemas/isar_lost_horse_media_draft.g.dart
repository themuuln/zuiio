// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_lost_horse_media_draft.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarLostHorseMediaDraftCollection on Isar {
  IsarCollection<IsarLostHorseMediaDraft> get isarLostHorseMediaDrafts =>
      this.collection();
}

const IsarLostHorseMediaDraftSchema = CollectionSchema(
  name: r'IsarLostHorseMediaDraft',
  id: -5089706340680065698,
  properties: {
    r'accountId': PropertySchema(
      id: 0,
      name: r'accountId',
      type: IsarType.string,
    ),
    r'createdAt': PropertySchema(
      id: 1,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'localPath': PropertySchema(
      id: 2,
      name: r'localPath',
      type: IsarType.string,
    ),
    r'mediaId': PropertySchema(id: 3, name: r'mediaId', type: IsarType.string),
    r'mediaType': PropertySchema(
      id: 4,
      name: r'mediaType',
      type: IsarType.string,
    ),
    r'remoteUrl': PropertySchema(
      id: 5,
      name: r'remoteUrl',
      type: IsarType.string,
    ),
    r'reportId': PropertySchema(
      id: 6,
      name: r'reportId',
      type: IsarType.string,
    ),
    r'sortOrder': PropertySchema(
      id: 7,
      name: r'sortOrder',
      type: IsarType.long,
    ),
    r'storagePath': PropertySchema(
      id: 8,
      name: r'storagePath',
      type: IsarType.string,
    ),
    r'uploaded': PropertySchema(id: 9, name: r'uploaded', type: IsarType.bool),
  },
  estimateSize: _isarLostHorseMediaDraftEstimateSize,
  serialize: _isarLostHorseMediaDraftSerialize,
  deserialize: _isarLostHorseMediaDraftDeserialize,
  deserializeProp: _isarLostHorseMediaDraftDeserializeProp,
  idName: r'id',
  indexes: {
    r'mediaId': IndexSchema(
      id: -8001372983137409759,
      name: r'mediaId',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'mediaId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'reportId': IndexSchema(
      id: 1732854644896652467,
      name: r'reportId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'reportId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'accountId': IndexSchema(
      id: -1591555361937770434,
      name: r'accountId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'accountId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarLostHorseMediaDraftGetId,
  getLinks: _isarLostHorseMediaDraftGetLinks,
  attach: _isarLostHorseMediaDraftAttach,
  version: '3.1.0+1',
);

int _isarLostHorseMediaDraftEstimateSize(
  IsarLostHorseMediaDraft object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.accountId.length * 3;
  bytesCount += 3 + object.localPath.length * 3;
  bytesCount += 3 + object.mediaId.length * 3;
  bytesCount += 3 + object.mediaType.length * 3;
  {
    final value = object.remoteUrl;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.reportId.length * 3;
  bytesCount += 3 + object.storagePath.length * 3;
  return bytesCount;
}

void _isarLostHorseMediaDraftSerialize(
  IsarLostHorseMediaDraft object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.accountId);
  writer.writeDateTime(offsets[1], object.createdAt);
  writer.writeString(offsets[2], object.localPath);
  writer.writeString(offsets[3], object.mediaId);
  writer.writeString(offsets[4], object.mediaType);
  writer.writeString(offsets[5], object.remoteUrl);
  writer.writeString(offsets[6], object.reportId);
  writer.writeLong(offsets[7], object.sortOrder);
  writer.writeString(offsets[8], object.storagePath);
  writer.writeBool(offsets[9], object.uploaded);
}

IsarLostHorseMediaDraft _isarLostHorseMediaDraftDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarLostHorseMediaDraft();
  object.accountId = reader.readString(offsets[0]);
  object.createdAt = reader.readDateTime(offsets[1]);
  object.id = id;
  object.localPath = reader.readString(offsets[2]);
  object.mediaId = reader.readString(offsets[3]);
  object.mediaType = reader.readString(offsets[4]);
  object.remoteUrl = reader.readStringOrNull(offsets[5]);
  object.reportId = reader.readString(offsets[6]);
  object.sortOrder = reader.readLong(offsets[7]);
  object.storagePath = reader.readString(offsets[8]);
  object.uploaded = reader.readBool(offsets[9]);
  return object;
}

P _isarLostHorseMediaDraftDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readStringOrNull(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readLong(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readBool(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarLostHorseMediaDraftGetId(IsarLostHorseMediaDraft object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarLostHorseMediaDraftGetLinks(
  IsarLostHorseMediaDraft object,
) {
  return [];
}

void _isarLostHorseMediaDraftAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarLostHorseMediaDraft object,
) {
  object.id = id;
}

extension IsarLostHorseMediaDraftByIndex
    on IsarCollection<IsarLostHorseMediaDraft> {
  Future<IsarLostHorseMediaDraft?> getByMediaId(String mediaId) {
    return getByIndex(r'mediaId', [mediaId]);
  }

  IsarLostHorseMediaDraft? getByMediaIdSync(String mediaId) {
    return getByIndexSync(r'mediaId', [mediaId]);
  }

  Future<bool> deleteByMediaId(String mediaId) {
    return deleteByIndex(r'mediaId', [mediaId]);
  }

  bool deleteByMediaIdSync(String mediaId) {
    return deleteByIndexSync(r'mediaId', [mediaId]);
  }

  Future<List<IsarLostHorseMediaDraft?>> getAllByMediaId(
    List<String> mediaIdValues,
  ) {
    final values = mediaIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'mediaId', values);
  }

  List<IsarLostHorseMediaDraft?> getAllByMediaIdSync(
    List<String> mediaIdValues,
  ) {
    final values = mediaIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'mediaId', values);
  }

  Future<int> deleteAllByMediaId(List<String> mediaIdValues) {
    final values = mediaIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'mediaId', values);
  }

  int deleteAllByMediaIdSync(List<String> mediaIdValues) {
    final values = mediaIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'mediaId', values);
  }

  Future<Id> putByMediaId(IsarLostHorseMediaDraft object) {
    return putByIndex(r'mediaId', object);
  }

  Id putByMediaIdSync(IsarLostHorseMediaDraft object, {bool saveLinks = true}) {
    return putByIndexSync(r'mediaId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByMediaId(List<IsarLostHorseMediaDraft> objects) {
    return putAllByIndex(r'mediaId', objects);
  }

  List<Id> putAllByMediaIdSync(
    List<IsarLostHorseMediaDraft> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'mediaId', objects, saveLinks: saveLinks);
  }
}

extension IsarLostHorseMediaDraftQueryWhereSort
    on QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QWhere> {
  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterWhere>
  anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarLostHorseMediaDraftQueryWhere
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QWhereClause
        > {
  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  mediaIdEqualTo(String mediaId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'mediaId', value: [mediaId]),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  mediaIdNotEqualTo(String mediaId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'mediaId',
                lower: [],
                upper: [mediaId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'mediaId',
                lower: [mediaId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'mediaId',
                lower: [mediaId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'mediaId',
                lower: [],
                upper: [mediaId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  reportIdEqualTo(String reportId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'reportId', value: [reportId]),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  reportIdNotEqualTo(String reportId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'reportId',
                lower: [],
                upper: [reportId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'reportId',
                lower: [reportId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'reportId',
                lower: [reportId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'reportId',
                lower: [],
                upper: [reportId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  accountIdEqualTo(String accountId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'accountId', value: [accountId]),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterWhereClause
  >
  accountIdNotEqualTo(String accountId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'accountId',
                lower: [],
                upper: [accountId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'accountId',
                lower: [accountId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'accountId',
                lower: [accountId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'accountId',
                lower: [],
                upper: [accountId],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarLostHorseMediaDraftQueryFilter
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QFilterCondition
        > {
  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'accountId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'accountId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'accountId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'accountId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'accountId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'accountId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'accountId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'accountId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'accountId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  accountIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'accountId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'localPath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'localPath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'localPath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'localPath',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'localPath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'localPath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'localPath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'localPath',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'localPath', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  localPathIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'localPath', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'mediaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'mediaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'mediaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'mediaId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'mediaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'mediaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'mediaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'mediaId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'mediaId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'mediaId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'mediaType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'mediaType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'mediaType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'mediaType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'mediaType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'mediaType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'mediaType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'mediaType',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'mediaType', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  mediaTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'mediaType', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'remoteUrl'),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'remoteUrl'),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'remoteUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'remoteUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'remoteUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'remoteUrl',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'remoteUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'remoteUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'remoteUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'remoteUrl',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'remoteUrl', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  remoteUrlIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'remoteUrl', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'reportId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'reportId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'reportId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'reportId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'reportId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'reportId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'reportId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'reportId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'reportId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  reportIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'reportId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  sortOrderEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sortOrder', value: value),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  sortOrderGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sortOrder',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  sortOrderLessThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sortOrder',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  sortOrderBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sortOrder',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'storagePath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'storagePath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'storagePath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'storagePath',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'storagePath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'storagePath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'storagePath',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'storagePath',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'storagePath', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  storagePathIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'storagePath', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarLostHorseMediaDraft,
    IsarLostHorseMediaDraft,
    QAfterFilterCondition
  >
  uploadedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'uploaded', value: value),
      );
    });
  }
}

extension IsarLostHorseMediaDraftQueryObject
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QFilterCondition
        > {}

extension IsarLostHorseMediaDraftQueryLinks
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QFilterCondition
        > {}

extension IsarLostHorseMediaDraftQuerySortBy
    on QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QSortBy> {
  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByAccountId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByAccountIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByLocalPath() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localPath', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByLocalPathDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localPath', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByMediaId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByMediaIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByMediaType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaType', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByMediaTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaType', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByRemoteUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByRemoteUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByReportId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reportId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByReportIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reportId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortBySortOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByStoragePath() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'storagePath', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByStoragePathDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'storagePath', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByUploaded() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'uploaded', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  sortByUploadedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'uploaded', Sort.desc);
    });
  }
}

extension IsarLostHorseMediaDraftQuerySortThenBy
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QSortThenBy
        > {
  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByAccountId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByAccountIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByLocalPath() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localPath', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByLocalPathDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'localPath', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByMediaId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByMediaIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByMediaType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaType', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByMediaTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'mediaType', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByRemoteUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByRemoteUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remoteUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByReportId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reportId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByReportIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reportId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenBySortOrderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sortOrder', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByStoragePath() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'storagePath', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByStoragePathDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'storagePath', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByUploaded() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'uploaded', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QAfterSortBy>
  thenByUploadedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'uploaded', Sort.desc);
    });
  }
}

extension IsarLostHorseMediaDraftQueryWhereDistinct
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QDistinct
        > {
  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByAccountId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'accountId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByLocalPath({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'localPath', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByMediaId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'mediaId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByMediaType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'mediaType', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByRemoteUrl({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'remoteUrl', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByReportId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'reportId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctBySortOrder() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sortOrder');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByStoragePath({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'storagePath', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, IsarLostHorseMediaDraft, QDistinct>
  distinctByUploaded() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'uploaded');
    });
  }
}

extension IsarLostHorseMediaDraftQueryProperty
    on
        QueryBuilder<
          IsarLostHorseMediaDraft,
          IsarLostHorseMediaDraft,
          QQueryProperty
        > {
  QueryBuilder<IsarLostHorseMediaDraft, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String, QQueryOperations>
  accountIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'accountId');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String, QQueryOperations>
  localPathProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'localPath');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String, QQueryOperations>
  mediaIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'mediaId');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String, QQueryOperations>
  mediaTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'mediaType');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String?, QQueryOperations>
  remoteUrlProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'remoteUrl');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String, QQueryOperations>
  reportIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'reportId');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, int, QQueryOperations>
  sortOrderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sortOrder');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, String, QQueryOperations>
  storagePathProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'storagePath');
    });
  }

  QueryBuilder<IsarLostHorseMediaDraft, bool, QQueryOperations>
  uploadedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'uploaded');
    });
  }
}
