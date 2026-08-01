// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_seller_profile.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarSellerProfileCollection on Isar {
  IsarCollection<IsarSellerProfile> get isarSellerProfiles => this.collection();
}

final IsarSellerProfileSchema = CollectionSchema(
  name: r'IsarSellerProfile',
  id: int.parse('926639826832267622'),
  properties: {
    r'averageRating': PropertySchema(
      id: int.parse('0'),
      name: r'averageRating',
      type: IsarType.double,
    ),
    r'bio': PropertySchema(
      id: int.parse('1'),
      name: r'bio',
      type: IsarType.string,
    ),
    r'displayName': PropertySchema(
      id: int.parse('2'),
      name: r'displayName',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: int.parse('3'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'locationLabel': PropertySchema(
      id: int.parse('4'),
      name: r'locationLabel',
      type: IsarType.string,
    ),
    r'ratingCount': PropertySchema(
      id: int.parse('5'),
      name: r'ratingCount',
      type: IsarType.long,
    ),
    r'responseNote': PropertySchema(
      id: int.parse('6'),
      name: r'responseNote',
      type: IsarType.string,
    ),
    r'reviews': PropertySchema(
      id: int.parse('7'),
      name: r'reviews',
      type: IsarType.stringList,
    ),
    r'stableName': PropertySchema(
      id: int.parse('8'),
      name: r'stableName',
      type: IsarType.string,
    ),
    r'verificationLabel': PropertySchema(
      id: int.parse('9'),
      name: r'verificationLabel',
      type: IsarType.string,
    ),
    r'verificationStatus': PropertySchema(
      id: int.parse('10'),
      name: r'verificationStatus',
      type: IsarType.byte,
      enumMap: _IsarSellerProfileverificationStatusEnumValueMap,
    ),
  },
  estimateSize: _isarSellerProfileEstimateSize,
  serialize: _isarSellerProfileSerialize,
  deserialize: _isarSellerProfileDeserialize,
  deserializeProp: _isarSellerProfileDeserializeProp,
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
  getId: _isarSellerProfileGetId,
  getLinks: _isarSellerProfileGetLinks,
  attach: _isarSellerProfileAttach,
  version: '3.1.0+1',
);

int _isarSellerProfileEstimateSize(
  IsarSellerProfile object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.bio.length * 3;
  bytesCount += 3 + object.displayName.length * 3;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.locationLabel.length * 3;
  bytesCount += 3 + object.responseNote.length * 3;
  bytesCount += 3 + object.reviews.length * 3;
  {
    for (var i = 0; i < object.reviews.length; i++) {
      final value = object.reviews[i];
      bytesCount += value.length * 3;
    }
  }
  bytesCount += 3 + object.stableName.length * 3;
  bytesCount += 3 + object.verificationLabel.length * 3;
  return bytesCount;
}

void _isarSellerProfileSerialize(
  IsarSellerProfile object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDouble(offsets[0], object.averageRating);
  writer.writeString(offsets[1], object.bio);
  writer.writeString(offsets[2], object.displayName);
  writer.writeString(offsets[3], object.domainId);
  writer.writeString(offsets[4], object.locationLabel);
  writer.writeLong(offsets[5], object.ratingCount);
  writer.writeString(offsets[6], object.responseNote);
  writer.writeStringList(offsets[7], object.reviews);
  writer.writeString(offsets[8], object.stableName);
  writer.writeString(offsets[9], object.verificationLabel);
  writer.writeByte(offsets[10], object.verificationStatus.index);
}

IsarSellerProfile _isarSellerProfileDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarSellerProfile();
  object.averageRating = reader.readDouble(offsets[0]);
  object.bio = reader.readString(offsets[1]);
  object.displayName = reader.readString(offsets[2]);
  object.domainId = reader.readString(offsets[3]);
  object.id = id;
  object.locationLabel = reader.readString(offsets[4]);
  object.ratingCount = reader.readLong(offsets[5]);
  object.responseNote = reader.readString(offsets[6]);
  object.reviews = reader.readStringList(offsets[7]) ?? [];
  object.stableName = reader.readString(offsets[8]);
  object.verificationLabel = reader.readString(offsets[9]);
  object.verificationStatus =
      _IsarSellerProfileverificationStatusValueEnumMap[reader.readByteOrNull(
        offsets[10],
      )] ??
      SellerVerificationStatus.unverified;
  return object;
}

P _isarSellerProfileDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDouble(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readLong(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readStringList(offset) ?? []) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readString(offset)) as P;
    case 10:
      return (_IsarSellerProfileverificationStatusValueEnumMap[reader
                  .readByteOrNull(offset)] ??
              SellerVerificationStatus.unverified)
          as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarSellerProfileverificationStatusEnumValueMap = {
  'unverified': 0,
  'verified': 1,
  'trustedStable': 2,
};
const _IsarSellerProfileverificationStatusValueEnumMap = {
  0: SellerVerificationStatus.unverified,
  1: SellerVerificationStatus.verified,
  2: SellerVerificationStatus.trustedStable,
};

Id _isarSellerProfileGetId(IsarSellerProfile object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarSellerProfileGetLinks(
  IsarSellerProfile object,
) {
  return [];
}

void _isarSellerProfileAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarSellerProfile object,
) {
  object.id = id;
}

extension IsarSellerProfileByIndex on IsarCollection<IsarSellerProfile> {
  Future<IsarSellerProfile?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarSellerProfile? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarSellerProfile?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarSellerProfile?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarSellerProfile object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarSellerProfile object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarSellerProfile> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarSellerProfile> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarSellerProfileQueryWhereSort
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QWhere> {
  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarSellerProfileQueryWhere
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QWhereClause> {
  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterWhereClause>
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

extension IsarSellerProfileQueryFilter
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QFilterCondition> {
  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  averageRatingEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'averageRating',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  averageRatingGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'averageRating',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  averageRatingLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'averageRating',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  averageRatingBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'averageRating',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'bio',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'bio',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioLessThan(String value, {bool include = false, bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'bio',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'bio',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'bio',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'bio',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'bio',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'bio',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'bio', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  bioIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'bio', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'displayName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'displayName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'displayName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'displayName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'displayName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'displayName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'displayName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'displayName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'displayName', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  displayNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'displayName', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationLabel',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationLabel',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  locationLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  ratingCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ratingCount', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  ratingCountGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'ratingCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  ratingCountLessThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'ratingCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  ratingCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'ratingCount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'responseNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'responseNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'responseNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'responseNote',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'responseNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'responseNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'responseNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'responseNote',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'responseNote', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  responseNoteIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'responseNote', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'reviews',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'reviews',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'reviews',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'reviews',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'reviews',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'reviews',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'reviews',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'reviews',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'reviews', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'reviews', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'reviews', length, true, length, true);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'reviews', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'reviews', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'reviews', 0, true, length, include);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'reviews', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  reviewsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'reviews',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'stableName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'stableName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'stableName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'stableName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'stableName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'stableName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'stableName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'stableName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'stableName', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  stableNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'stableName', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'verificationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'verificationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'verificationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'verificationLabel',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'verificationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'verificationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'verificationLabel',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'verificationLabel',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'verificationLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationLabelIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'verificationLabel', value: ''),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationStatusEqualTo(SellerVerificationStatus value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'verificationStatus', value: value),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationStatusGreaterThan(
    SellerVerificationStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'verificationStatus',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationStatusLessThan(
    SellerVerificationStatus value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'verificationStatus',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterFilterCondition>
  verificationStatusBetween(
    SellerVerificationStatus lower,
    SellerVerificationStatus upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'verificationStatus',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarSellerProfileQueryObject
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QFilterCondition> {}

extension IsarSellerProfileQueryLinks
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QFilterCondition> {}

extension IsarSellerProfileQuerySortBy
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QSortBy> {
  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByAverageRating() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'averageRating', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByAverageRatingDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'averageRating', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy> sortByBio() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bio', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByBioDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bio', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByDisplayName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'displayName', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByDisplayNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'displayName', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByLocationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByLocationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByRatingCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ratingCount', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByRatingCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ratingCount', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByResponseNote() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseNote', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByResponseNoteDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseNote', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByStableName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stableName', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByStableNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stableName', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByVerificationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByVerificationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByVerificationStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationStatus', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  sortByVerificationStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationStatus', Sort.desc);
    });
  }
}

extension IsarSellerProfileQuerySortThenBy
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QSortThenBy> {
  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByAverageRating() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'averageRating', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByAverageRatingDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'averageRating', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy> thenByBio() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bio', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByBioDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'bio', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByDisplayName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'displayName', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByDisplayNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'displayName', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByLocationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByLocationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByRatingCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ratingCount', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByRatingCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ratingCount', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByResponseNote() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseNote', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByResponseNoteDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'responseNote', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByStableName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stableName', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByStableNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'stableName', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByVerificationLabel() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationLabel', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByVerificationLabelDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationLabel', Sort.desc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByVerificationStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationStatus', Sort.asc);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QAfterSortBy>
  thenByVerificationStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verificationStatus', Sort.desc);
    });
  }
}

extension IsarSellerProfileQueryWhereDistinct
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct> {
  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByAverageRating() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'averageRating');
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct> distinctByBio({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'bio', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByDisplayName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'displayName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByLocationLabel({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'locationLabel',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByRatingCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ratingCount');
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByResponseNote({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'responseNote', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByReviews() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'reviews');
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByStableName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'stableName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByVerificationLabel({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'verificationLabel',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarSellerProfile, IsarSellerProfile, QDistinct>
  distinctByVerificationStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'verificationStatus');
    });
  }
}

extension IsarSellerProfileQueryProperty
    on QueryBuilder<IsarSellerProfile, IsarSellerProfile, QQueryProperty> {
  QueryBuilder<IsarSellerProfile, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarSellerProfile, double, QQueryOperations>
  averageRatingProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'averageRating');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations> bioProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'bio');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations>
  displayNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'displayName');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations>
  locationLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationLabel');
    });
  }

  QueryBuilder<IsarSellerProfile, int, QQueryOperations> ratingCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ratingCount');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations>
  responseNoteProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'responseNote');
    });
  }

  QueryBuilder<IsarSellerProfile, List<String>, QQueryOperations>
  reviewsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'reviews');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations>
  stableNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'stableName');
    });
  }

  QueryBuilder<IsarSellerProfile, String, QQueryOperations>
  verificationLabelProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'verificationLabel');
    });
  }

  QueryBuilder<IsarSellerProfile, SellerVerificationStatus, QQueryOperations>
  verificationStatusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'verificationStatus');
    });
  }
}
