// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_seller_verification.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarSellerPhoneVerificationCollection on Isar {
  IsarCollection<IsarSellerPhoneVerification>
  get isarSellerPhoneVerifications => this.collection();
}

const IsarSellerPhoneVerificationSchema = CollectionSchema(
  name: r'IsarSellerPhoneVerification',
  id: 9183017056121775790,
  properties: {
    r'domainId': PropertySchema(
      id: 0,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'isVerified': PropertySchema(
      id: 1,
      name: r'isVerified',
      type: IsarType.bool,
    ),
    r'phone': PropertySchema(id: 2, name: r'phone', type: IsarType.string),
    r'sellerId': PropertySchema(
      id: 3,
      name: r'sellerId',
      type: IsarType.string,
    ),
    r'verifiedAt': PropertySchema(
      id: 4,
      name: r'verifiedAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarSellerPhoneVerificationEstimateSize,
  serialize: _isarSellerPhoneVerificationSerialize,
  deserialize: _isarSellerPhoneVerificationDeserialize,
  deserializeProp: _isarSellerPhoneVerificationDeserializeProp,
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
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarSellerPhoneVerificationGetId,
  getLinks: _isarSellerPhoneVerificationGetLinks,
  attach: _isarSellerPhoneVerificationAttach,
  version: '3.1.0+1',
);

int _isarSellerPhoneVerificationEstimateSize(
  IsarSellerPhoneVerification object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.phone.length * 3;
  bytesCount += 3 + object.sellerId.length * 3;
  return bytesCount;
}

void _isarSellerPhoneVerificationSerialize(
  IsarSellerPhoneVerification object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.domainId);
  writer.writeBool(offsets[1], object.isVerified);
  writer.writeString(offsets[2], object.phone);
  writer.writeString(offsets[3], object.sellerId);
  writer.writeDateTime(offsets[4], object.verifiedAt);
}

IsarSellerPhoneVerification _isarSellerPhoneVerificationDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarSellerPhoneVerification();
  object.domainId = reader.readString(offsets[0]);
  object.id = id;
  object.isVerified = reader.readBool(offsets[1]);
  object.phone = reader.readString(offsets[2]);
  object.sellerId = reader.readString(offsets[3]);
  object.verifiedAt = reader.readDateTimeOrNull(offsets[4]);
  return object;
}

P _isarSellerPhoneVerificationDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readString(offset)) as P;
    case 1:
      return (reader.readBool(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (reader.readDateTimeOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarSellerPhoneVerificationGetId(IsarSellerPhoneVerification object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarSellerPhoneVerificationGetLinks(
  IsarSellerPhoneVerification object,
) {
  return [];
}

void _isarSellerPhoneVerificationAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarSellerPhoneVerification object,
) {
  object.id = id;
}

extension IsarSellerPhoneVerificationByIndex
    on IsarCollection<IsarSellerPhoneVerification> {
  Future<IsarSellerPhoneVerification?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarSellerPhoneVerification? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarSellerPhoneVerification?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarSellerPhoneVerification?> getAllByDomainIdSync(
    List<String> domainIdValues,
  ) {
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

  Future<Id> putByDomainId(IsarSellerPhoneVerification object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(
    IsarSellerPhoneVerification object, {
    bool saveLinks = true,
  }) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarSellerPhoneVerification> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarSellerPhoneVerification> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarSellerPhoneVerificationQueryWhereSort
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QWhere
        > {
  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterWhere
  >
  anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarSellerPhoneVerificationQueryWhere
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QWhereClause
        > {
  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterWhereClause
  >
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterWhereClause
  >
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterWhereClause
  >
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

extension IsarSellerPhoneVerificationQueryFilter
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QFilterCondition
        > {
  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  isVerifiedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'isVerified', value: value),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'phone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'phone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'phone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'phone',
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'phone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'phone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'phone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'phone',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'phone', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  phoneIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'phone', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sellerId',
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
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sellerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  sellerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  verifiedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'verifiedAt'),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  verifiedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'verifiedAt'),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  verifiedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'verifiedAt', value: value),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  verifiedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'verifiedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  verifiedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'verifiedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterFilterCondition
  >
  verifiedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'verifiedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarSellerPhoneVerificationQueryObject
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QFilterCondition
        > {}

extension IsarSellerPhoneVerificationQueryLinks
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QFilterCondition
        > {}

extension IsarSellerPhoneVerificationQuerySortBy
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QSortBy
        > {
  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByIsVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByIsVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByPhone() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'phone', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByPhoneDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'phone', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByVerifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  sortByVerifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.desc);
    });
  }
}

extension IsarSellerPhoneVerificationQuerySortThenBy
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QSortThenBy
        > {
  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByIsVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByIsVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByPhone() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'phone', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByPhoneDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'phone', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByVerifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.asc);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QAfterSortBy
  >
  thenByVerifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.desc);
    });
  }
}

extension IsarSellerPhoneVerificationQueryWhereDistinct
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QDistinct
        > {
  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QDistinct
  >
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QDistinct
  >
  distinctByIsVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isVerified');
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QDistinct
  >
  distinctByPhone({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'phone', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QDistinct
  >
  distinctBySellerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<
    IsarSellerPhoneVerification,
    IsarSellerPhoneVerification,
    QDistinct
  >
  distinctByVerifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'verifiedAt');
    });
  }
}

extension IsarSellerPhoneVerificationQueryProperty
    on
        QueryBuilder<
          IsarSellerPhoneVerification,
          IsarSellerPhoneVerification,
          QQueryProperty
        > {
  QueryBuilder<IsarSellerPhoneVerification, int, QQueryOperations>
  idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarSellerPhoneVerification, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarSellerPhoneVerification, bool, QQueryOperations>
  isVerifiedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isVerified');
    });
  }

  QueryBuilder<IsarSellerPhoneVerification, String, QQueryOperations>
  phoneProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'phone');
    });
  }

  QueryBuilder<IsarSellerPhoneVerification, String, QQueryOperations>
  sellerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerId');
    });
  }

  QueryBuilder<IsarSellerPhoneVerification, DateTime?, QQueryOperations>
  verifiedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'verifiedAt');
    });
  }
}

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarEMongoliaVerificationCollection on Isar {
  IsarCollection<IsarEMongoliaVerification> get isarEMongoliaVerifications =>
      this.collection();
}

const IsarEMongoliaVerificationSchema = CollectionSchema(
  name: r'IsarEMongoliaVerification',
  id: -3804368658895489013,
  properties: {
    r'documentUrls': PropertySchema(
      id: 0,
      name: r'documentUrls',
      type: IsarType.stringList,
    ),
    r'domainId': PropertySchema(
      id: 1,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'eMongoliaId': PropertySchema(
      id: 2,
      name: r'eMongoliaId',
      type: IsarType.string,
    ),
    r'errorMessage': PropertySchema(
      id: 3,
      name: r'errorMessage',
      type: IsarType.string,
    ),
    r'fullName': PropertySchema(
      id: 4,
      name: r'fullName',
      type: IsarType.string,
    ),
    r'isVerified': PropertySchema(
      id: 5,
      name: r'isVerified',
      type: IsarType.bool,
    ),
    r'sellerId': PropertySchema(
      id: 6,
      name: r'sellerId',
      type: IsarType.string,
    ),
    r'submittedAt': PropertySchema(
      id: 7,
      name: r'submittedAt',
      type: IsarType.dateTime,
    ),
    r'verifiedAt': PropertySchema(
      id: 8,
      name: r'verifiedAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarEMongoliaVerificationEstimateSize,
  serialize: _isarEMongoliaVerificationSerialize,
  deserialize: _isarEMongoliaVerificationDeserialize,
  deserializeProp: _isarEMongoliaVerificationDeserializeProp,
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
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarEMongoliaVerificationGetId,
  getLinks: _isarEMongoliaVerificationGetLinks,
  attach: _isarEMongoliaVerificationAttach,
  version: '3.1.0+1',
);

int _isarEMongoliaVerificationEstimateSize(
  IsarEMongoliaVerification object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.documentUrls.length * 3;
  {
    for (var i = 0; i < object.documentUrls.length; i++) {
      final value = object.documentUrls[i];
      bytesCount += value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.eMongoliaId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.errorMessage;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.fullName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.sellerId.length * 3;
  return bytesCount;
}

void _isarEMongoliaVerificationSerialize(
  IsarEMongoliaVerification object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeStringList(offsets[0], object.documentUrls);
  writer.writeString(offsets[1], object.domainId);
  writer.writeString(offsets[2], object.eMongoliaId);
  writer.writeString(offsets[3], object.errorMessage);
  writer.writeString(offsets[4], object.fullName);
  writer.writeBool(offsets[5], object.isVerified);
  writer.writeString(offsets[6], object.sellerId);
  writer.writeDateTime(offsets[7], object.submittedAt);
  writer.writeDateTime(offsets[8], object.verifiedAt);
}

IsarEMongoliaVerification _isarEMongoliaVerificationDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarEMongoliaVerification();
  object.documentUrls = reader.readStringList(offsets[0]) ?? [];
  object.domainId = reader.readString(offsets[1]);
  object.eMongoliaId = reader.readStringOrNull(offsets[2]);
  object.errorMessage = reader.readStringOrNull(offsets[3]);
  object.fullName = reader.readStringOrNull(offsets[4]);
  object.id = id;
  object.isVerified = reader.readBool(offsets[5]);
  object.sellerId = reader.readString(offsets[6]);
  object.submittedAt = reader.readDateTimeOrNull(offsets[7]);
  object.verifiedAt = reader.readDateTimeOrNull(offsets[8]);
  return object;
}

P _isarEMongoliaVerificationDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringList(offset) ?? []) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readStringOrNull(offset)) as P;
    case 3:
      return (reader.readStringOrNull(offset)) as P;
    case 4:
      return (reader.readStringOrNull(offset)) as P;
    case 5:
      return (reader.readBool(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 8:
      return (reader.readDateTimeOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarEMongoliaVerificationGetId(IsarEMongoliaVerification object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarEMongoliaVerificationGetLinks(
  IsarEMongoliaVerification object,
) {
  return [];
}

void _isarEMongoliaVerificationAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarEMongoliaVerification object,
) {
  object.id = id;
}

extension IsarEMongoliaVerificationByIndex
    on IsarCollection<IsarEMongoliaVerification> {
  Future<IsarEMongoliaVerification?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarEMongoliaVerification? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarEMongoliaVerification?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarEMongoliaVerification?> getAllByDomainIdSync(
    List<String> domainIdValues,
  ) {
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

  Future<Id> putByDomainId(IsarEMongoliaVerification object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(
    IsarEMongoliaVerification object, {
    bool saveLinks = true,
  }) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarEMongoliaVerification> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarEMongoliaVerification> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarEMongoliaVerificationQueryWhereSort
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QWhere
        > {
  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterWhere
  >
  anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarEMongoliaVerificationQueryWhere
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QWhereClause
        > {
  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterWhereClause
  >
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterWhereClause
  >
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterWhereClause
  >
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

extension IsarEMongoliaVerificationQueryFilter
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QFilterCondition
        > {
  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'documentUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'documentUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'documentUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'documentUrls',
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'documentUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'documentUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'documentUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'documentUrls',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'documentUrls', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'documentUrls', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'documentUrls', length, true, length, true);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'documentUrls', 0, true, 0, true);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'documentUrls', 0, false, 999999, true);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'documentUrls', 0, true, length, include);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'documentUrls', length, include, 999999, true);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  documentUrlsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'documentUrls',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
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

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'eMongoliaId'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'eMongoliaId'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'eMongoliaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'eMongoliaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'eMongoliaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'eMongoliaId',
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'eMongoliaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'eMongoliaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'eMongoliaId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'eMongoliaId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'eMongoliaId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  eMongoliaIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'eMongoliaId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'errorMessage'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'errorMessage'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'errorMessage',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'errorMessage',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'errorMessage',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'errorMessage',
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'errorMessage',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'errorMessage',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'errorMessage',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'errorMessage',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'errorMessage', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  errorMessageIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'errorMessage', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'fullName'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'fullName'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'fullName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'fullName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'fullName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'fullName',
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'fullName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'fullName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'fullName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'fullName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'fullName', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  fullNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'fullName', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  isVerifiedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'isVerified', value: value),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sellerId',
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
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'sellerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'sellerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  sellerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'sellerId', value: ''),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  submittedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'submittedAt'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  submittedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'submittedAt'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  submittedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'submittedAt', value: value),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  submittedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'submittedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  submittedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'submittedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  submittedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'submittedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  verifiedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'verifiedAt'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  verifiedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'verifiedAt'),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  verifiedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'verifiedAt', value: value),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  verifiedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'verifiedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  verifiedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'verifiedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterFilterCondition
  >
  verifiedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'verifiedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarEMongoliaVerificationQueryObject
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QFilterCondition
        > {}

extension IsarEMongoliaVerificationQueryLinks
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QFilterCondition
        > {}

extension IsarEMongoliaVerificationQuerySortBy
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QSortBy
        > {
  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByEMongoliaId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eMongoliaId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByEMongoliaIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eMongoliaId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByErrorMessage() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'errorMessage', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByErrorMessageDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'errorMessage', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByFullName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'fullName', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByFullNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'fullName', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByIsVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByIsVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortBySubmittedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'submittedAt', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortBySubmittedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'submittedAt', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByVerifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  sortByVerifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.desc);
    });
  }
}

extension IsarEMongoliaVerificationQuerySortThenBy
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QSortThenBy
        > {
  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByEMongoliaId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eMongoliaId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByEMongoliaIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eMongoliaId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByErrorMessage() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'errorMessage', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByErrorMessageDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'errorMessage', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByFullName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'fullName', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByFullNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'fullName', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByIsVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByIsVerifiedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isVerified', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenBySellerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenBySellerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sellerId', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenBySubmittedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'submittedAt', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenBySubmittedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'submittedAt', Sort.desc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByVerifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.asc);
    });
  }

  QueryBuilder<
    IsarEMongoliaVerification,
    IsarEMongoliaVerification,
    QAfterSortBy
  >
  thenByVerifiedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedAt', Sort.desc);
    });
  }
}

extension IsarEMongoliaVerificationQueryWhereDistinct
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QDistinct
        > {
  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByDocumentUrls() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'documentUrls');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByEMongoliaId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'eMongoliaId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByErrorMessage({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'errorMessage', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByFullName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'fullName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByIsVerified() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isVerified');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctBySellerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sellerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctBySubmittedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'submittedAt');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, IsarEMongoliaVerification, QDistinct>
  distinctByVerifiedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'verifiedAt');
    });
  }
}

extension IsarEMongoliaVerificationQueryProperty
    on
        QueryBuilder<
          IsarEMongoliaVerification,
          IsarEMongoliaVerification,
          QQueryProperty
        > {
  QueryBuilder<IsarEMongoliaVerification, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, List<String>, QQueryOperations>
  documentUrlsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'documentUrls');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, String?, QQueryOperations>
  eMongoliaIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'eMongoliaId');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, String?, QQueryOperations>
  errorMessageProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'errorMessage');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, String?, QQueryOperations>
  fullNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'fullName');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, bool, QQueryOperations>
  isVerifiedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isVerified');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, String, QQueryOperations>
  sellerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sellerId');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, DateTime?, QQueryOperations>
  submittedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'submittedAt');
    });
  }

  QueryBuilder<IsarEMongoliaVerification, DateTime?, QQueryOperations>
  verifiedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'verifiedAt');
    });
  }
}
