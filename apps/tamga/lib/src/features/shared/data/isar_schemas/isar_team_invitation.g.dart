// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_team_invitation.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarTeamInvitationCollection on Isar {
  IsarCollection<IsarTeamInvitation> get isarTeamInvitations =>
      this.collection();
}

final IsarTeamInvitationSchema = CollectionSchema(
  name: r'IsarTeamInvitation',
  id: int.parse('1843860492833883654'),
  properties: {
    r'createdAt': PropertySchema(
      id: int.parse('0'),
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'domainId': PropertySchema(
      id: int.parse('1'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'invitedByUserId': PropertySchema(
      id: int.parse('2'),
      name: r'invitedByUserId',
      type: IsarType.string,
    ),
    r'invitedUserId': PropertySchema(
      id: int.parse('3'),
      name: r'invitedUserId',
      type: IsarType.string,
    ),
    r'role': PropertySchema(
      id: int.parse('4'),
      name: r'role',
      type: IsarType.byte,
      enumMap: _IsarTeamInvitationroleEnumValueMap,
    ),
    r'status': PropertySchema(
      id: int.parse('5'),
      name: r'status',
      type: IsarType.byte,
      enumMap: _IsarTeamInvitationstatusEnumValueMap,
    ),
    r'teamId': PropertySchema(
      id: int.parse('6'),
      name: r'teamId',
      type: IsarType.string,
    ),
    r'teamName': PropertySchema(
      id: int.parse('7'),
      name: r'teamName',
      type: IsarType.string,
    ),
  },
  estimateSize: _isarTeamInvitationEstimateSize,
  serialize: _isarTeamInvitationSerialize,
  deserialize: _isarTeamInvitationDeserialize,
  deserializeProp: _isarTeamInvitationDeserializeProp,
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
    r'invitedUserId': IndexSchema(
      id: int.parse('-5455332076709583523'),
      name: r'invitedUserId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'invitedUserId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarTeamInvitationGetId,
  getLinks: _isarTeamInvitationGetLinks,
  attach: _isarTeamInvitationAttach,
  version: '3.1.0+1',
);

int _isarTeamInvitationEstimateSize(
  IsarTeamInvitation object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.invitedByUserId.length * 3;
  bytesCount += 3 + object.invitedUserId.length * 3;
  bytesCount += 3 + object.teamId.length * 3;
  bytesCount += 3 + object.teamName.length * 3;
  return bytesCount;
}

void _isarTeamInvitationSerialize(
  IsarTeamInvitation object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.createdAt);
  writer.writeString(offsets[1], object.domainId);
  writer.writeString(offsets[2], object.invitedByUserId);
  writer.writeString(offsets[3], object.invitedUserId);
  writer.writeByte(offsets[4], object.role.index);
  writer.writeByte(offsets[5], object.status.index);
  writer.writeString(offsets[6], object.teamId);
  writer.writeString(offsets[7], object.teamName);
}

IsarTeamInvitation _isarTeamInvitationDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarTeamInvitation();
  object.createdAt = reader.readDateTime(offsets[0]);
  object.domainId = reader.readString(offsets[1]);
  object.id = id;
  object.invitedByUserId = reader.readString(offsets[2]);
  object.invitedUserId = reader.readString(offsets[3]);
  object.role =
      _IsarTeamInvitationroleValueEnumMap[reader.readByteOrNull(offsets[4])] ??
      TeamRole.owner;
  object.status =
      _IsarTeamInvitationstatusValueEnumMap[reader.readByteOrNull(
        offsets[5],
      )] ??
      InvitationStatus.pending;
  object.teamId = reader.readString(offsets[6]);
  object.teamName = reader.readString(offsets[7]);
  return object;
}

P _isarTeamInvitationDeserializeProp<P>(
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
      return (_IsarTeamInvitationroleValueEnumMap[reader.readByteOrNull(
                offset,
              )] ??
              TeamRole.owner)
          as P;
    case 5:
      return (_IsarTeamInvitationstatusValueEnumMap[reader.readByteOrNull(
                offset,
              )] ??
              InvitationStatus.pending)
          as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarTeamInvitationroleEnumValueMap = {
  'owner': 0,
  'manager': 1,
  'vet': 2,
  'groom': 3,
  'viewer': 4,
};
const _IsarTeamInvitationroleValueEnumMap = {
  0: TeamRole.owner,
  1: TeamRole.manager,
  2: TeamRole.vet,
  3: TeamRole.groom,
  4: TeamRole.viewer,
};
const _IsarTeamInvitationstatusEnumValueMap = {
  'pending': 0,
  'accepted': 1,
  'declined': 2,
};
const _IsarTeamInvitationstatusValueEnumMap = {
  0: InvitationStatus.pending,
  1: InvitationStatus.accepted,
  2: InvitationStatus.declined,
};

Id _isarTeamInvitationGetId(IsarTeamInvitation object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarTeamInvitationGetLinks(
  IsarTeamInvitation object,
) {
  return [];
}

void _isarTeamInvitationAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarTeamInvitation object,
) {
  object.id = id;
}

extension IsarTeamInvitationByIndex on IsarCollection<IsarTeamInvitation> {
  Future<IsarTeamInvitation?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarTeamInvitation? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarTeamInvitation?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarTeamInvitation?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarTeamInvitation object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarTeamInvitation object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarTeamInvitation> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarTeamInvitation> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarTeamInvitationQueryWhereSort
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QWhere> {
  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarTeamInvitationQueryWhere
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QWhereClause> {
  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
  invitedUserIdEqualTo(String invitedUserId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(
          indexName: r'invitedUserId',
          value: [invitedUserId],
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterWhereClause>
  invitedUserIdNotEqualTo(String invitedUserId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'invitedUserId',
                lower: [],
                upper: [invitedUserId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'invitedUserId',
                lower: [invitedUserId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'invitedUserId',
                lower: [invitedUserId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'invitedUserId',
                lower: [],
                upper: [invitedUserId],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarTeamInvitationQueryFilter
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QFilterCondition> {
  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
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

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'invitedByUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'invitedByUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'invitedByUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'invitedByUserId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'invitedByUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'invitedByUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'invitedByUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'invitedByUserId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'invitedByUserId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedByUserIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'invitedByUserId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'invitedUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'invitedUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'invitedUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'invitedUserId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'invitedUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'invitedUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'invitedUserId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'invitedUserId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'invitedUserId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  invitedUserIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'invitedUserId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  roleEqualTo(TeamRole value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'role', value: value),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  roleGreaterThan(TeamRole value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'role',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  roleLessThan(TeamRole value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'role',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  roleBetween(
    TeamRole lower,
    TeamRole upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'role',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  statusEqualTo(InvitationStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'status', value: value),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  statusGreaterThan(InvitationStatus value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'status',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  statusLessThan(InvitationStatus value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'status',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  statusBetween(
    InvitationStatus lower,
    InvitationStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'status',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'teamId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'teamId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'teamId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'teamId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'teamId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'teamId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'teamId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'teamId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'teamId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'teamId', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'teamName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'teamName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'teamName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'teamName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'teamName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'teamName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'teamName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'teamName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'teamName', value: ''),
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterFilterCondition>
  teamNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'teamName', value: ''),
      );
    });
  }
}

extension IsarTeamInvitationQueryObject
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QFilterCondition> {}

extension IsarTeamInvitationQueryLinks
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QFilterCondition> {}

extension IsarTeamInvitationQuerySortBy
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QSortBy> {
  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByInvitedByUserId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedByUserId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByInvitedByUserIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedByUserId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByInvitedUserId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedUserId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByInvitedUserIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedUserId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByRole() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByRoleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByTeamId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByTeamIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByTeamName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamName', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  sortByTeamNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamName', Sort.desc);
    });
  }
}

extension IsarTeamInvitationQuerySortThenBy
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QSortThenBy> {
  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByInvitedByUserId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedByUserId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByInvitedByUserIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedByUserId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByInvitedUserId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedUserId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByInvitedUserIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'invitedUserId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByRole() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByRoleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'role', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByTeamId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamId', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByTeamIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamId', Sort.desc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByTeamName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamName', Sort.asc);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QAfterSortBy>
  thenByTeamNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'teamName', Sort.desc);
    });
  }
}

extension IsarTeamInvitationQueryWhereDistinct
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct> {
  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByInvitedByUserId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'invitedByUserId',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByInvitedUserId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'invitedUserId',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByRole() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'role');
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status');
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByTeamId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'teamId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QDistinct>
  distinctByTeamName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'teamName', caseSensitive: caseSensitive);
    });
  }
}

extension IsarTeamInvitationQueryProperty
    on QueryBuilder<IsarTeamInvitation, IsarTeamInvitation, QQueryProperty> {
  QueryBuilder<IsarTeamInvitation, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarTeamInvitation, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarTeamInvitation, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarTeamInvitation, String, QQueryOperations>
  invitedByUserIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'invitedByUserId');
    });
  }

  QueryBuilder<IsarTeamInvitation, String, QQueryOperations>
  invitedUserIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'invitedUserId');
    });
  }

  QueryBuilder<IsarTeamInvitation, TeamRole, QQueryOperations> roleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'role');
    });
  }

  QueryBuilder<IsarTeamInvitation, InvitationStatus, QQueryOperations>
  statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarTeamInvitation, String, QQueryOperations> teamIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'teamId');
    });
  }

  QueryBuilder<IsarTeamInvitation, String, QQueryOperations>
  teamNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'teamName');
    });
  }
}
