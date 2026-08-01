// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_vet_profile.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarVetProfileCollection on Isar {
  IsarCollection<IsarVetProfile> get isarVetProfiles => this.collection();
}

final IsarVetProfileSchema = CollectionSchema(
  name: r'IsarVetProfile',
  id: int.parse('5566058682065015217'),
  properties: {
    r'availableDays': PropertySchema(
      id: int.parse('0'),
      name: r'availableDays',
      type: IsarType.stringList,
    ),
    r'consultationFee': PropertySchema(
      id: int.parse('1'),
      name: r'consultationFee',
      type: IsarType.long,
    ),
    r'domainId': PropertySchema(
      id: int.parse('2'),
      name: r'domainId',
      type: IsarType.string,
    ),
    r'education': PropertySchema(
      id: int.parse('3'),
      name: r'education',
      type: IsarType.string,
    ),
    r'experienceYears': PropertySchema(
      id: int.parse('4'),
      name: r'experienceYears',
      type: IsarType.long,
    ),
    r'licenseNumber': PropertySchema(
      id: int.parse('5'),
      name: r'licenseNumber',
      type: IsarType.string,
    ),
    r'providerId': PropertySchema(
      id: int.parse('6'),
      name: r'providerId',
      type: IsarType.string,
    ),
    r'specialization': PropertySchema(
      id: int.parse('7'),
      name: r'specialization',
      type: IsarType.stringList,
    ),
    r'travelSurcharge': PropertySchema(
      id: int.parse('8'),
      name: r'travelSurcharge',
      type: IsarType.long,
    ),
  },
  estimateSize: _isarVetProfileEstimateSize,
  serialize: _isarVetProfileSerialize,
  deserialize: _isarVetProfileDeserialize,
  deserializeProp: _isarVetProfileDeserializeProp,
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
    r'providerId': IndexSchema(
      id: int.parse('-1675978104265523206'),
      name: r'providerId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'providerId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarVetProfileGetId,
  getLinks: _isarVetProfileGetLinks,
  attach: _isarVetProfileAttach,
  version: '3.1.0+1',
);

int _isarVetProfileEstimateSize(
  IsarVetProfile object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.availableDays.length * 3;
  {
    for (var i = 0; i < object.availableDays.length; i++) {
      final value = object.availableDays[i];
      bytesCount += value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.education;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.licenseNumber;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.providerId.length * 3;
  bytesCount += 3 + object.specialization.length * 3;
  {
    for (var i = 0; i < object.specialization.length; i++) {
      final value = object.specialization[i];
      bytesCount += value.length * 3;
    }
  }
  return bytesCount;
}

void _isarVetProfileSerialize(
  IsarVetProfile object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeStringList(offsets[0], object.availableDays);
  writer.writeLong(offsets[1], object.consultationFee);
  writer.writeString(offsets[2], object.domainId);
  writer.writeString(offsets[3], object.education);
  writer.writeLong(offsets[4], object.experienceYears);
  writer.writeString(offsets[5], object.licenseNumber);
  writer.writeString(offsets[6], object.providerId);
  writer.writeStringList(offsets[7], object.specialization);
  writer.writeLong(offsets[8], object.travelSurcharge);
}

IsarVetProfile _isarVetProfileDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarVetProfile();
  object.availableDays = reader.readStringList(offsets[0]) ?? [];
  object.consultationFee = reader.readLongOrNull(offsets[1]);
  object.domainId = reader.readString(offsets[2]);
  object.education = reader.readStringOrNull(offsets[3]);
  object.experienceYears = reader.readLongOrNull(offsets[4]);
  object.id = id;
  object.licenseNumber = reader.readStringOrNull(offsets[5]);
  object.providerId = reader.readString(offsets[6]);
  object.specialization = reader.readStringList(offsets[7]) ?? [];
  object.travelSurcharge = reader.readLongOrNull(offsets[8]);
  return object;
}

P _isarVetProfileDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringList(offset) ?? []) as P;
    case 1:
      return (reader.readLongOrNull(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readStringOrNull(offset)) as P;
    case 4:
      return (reader.readLongOrNull(offset)) as P;
    case 5:
      return (reader.readStringOrNull(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readStringList(offset) ?? []) as P;
    case 8:
      return (reader.readLongOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarVetProfileGetId(IsarVetProfile object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarVetProfileGetLinks(IsarVetProfile object) {
  return [];
}

void _isarVetProfileAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarVetProfile object,
) {
  object.id = id;
}

extension IsarVetProfileByIndex on IsarCollection<IsarVetProfile> {
  Future<IsarVetProfile?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarVetProfile? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarVetProfile?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarVetProfile?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarVetProfile object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarVetProfile object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarVetProfile> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarVetProfile> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarVetProfileQueryWhereSort
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QWhere> {
  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarVetProfileQueryWhere
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QWhereClause> {
  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause> idEqualTo(
    Id id,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause> idNotEqualTo(
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause>
  providerIdEqualTo(String providerId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'providerId', value: [providerId]),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterWhereClause>
  providerIdNotEqualTo(String providerId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'providerId',
                lower: [],
                upper: [providerId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'providerId',
                lower: [providerId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'providerId',
                lower: [providerId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'providerId',
                lower: [],
                upper: [providerId],
                includeUpper: false,
              ),
            );
      }
    });
  }
}

extension IsarVetProfileQueryFilter
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QFilterCondition> {
  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'availableDays',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'availableDays',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'availableDays',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'availableDays',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'availableDays',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'availableDays',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'availableDays',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'availableDays',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'availableDays', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'availableDays', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'availableDays', length, true, length, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'availableDays', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'availableDays', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'availableDays', 0, true, length, include);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'availableDays', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  availableDaysLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'availableDays',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  consultationFeeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'consultationFee'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  consultationFeeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'consultationFee'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  consultationFeeEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'consultationFee', value: value),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  consultationFeeGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'consultationFee',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  consultationFeeLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'consultationFee',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  consultationFeeBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'consultationFee',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'education'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'education'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'education',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'education',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'education',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'education',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'education',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'education',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'education',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'education',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'education', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  educationIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'education', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  experienceYearsIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'experienceYears'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  experienceYearsIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'experienceYears'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  experienceYearsEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'experienceYears', value: value),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  experienceYearsGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'experienceYears',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  experienceYearsLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'experienceYears',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  experienceYearsBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'experienceYears',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition> idEqualTo(
    Id value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'licenseNumber'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'licenseNumber'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'licenseNumber',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'licenseNumber',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'licenseNumber',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'licenseNumber',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'licenseNumber',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'licenseNumber',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'licenseNumber',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'licenseNumber',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'licenseNumber', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  licenseNumberIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'licenseNumber', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'providerId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'providerId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'providerId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'providerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  providerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'providerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'specialization',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'specialization',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'specialization',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'specialization',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'specialization',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'specialization',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'specialization',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'specialization',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'specialization', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'specialization', value: ''),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'specialization', length, true, length, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'specialization', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'specialization', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'specialization', 0, true, length, include);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'specialization', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  specializationLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'specialization',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  travelSurchargeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'travelSurcharge'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  travelSurchargeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'travelSurcharge'),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  travelSurchargeEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'travelSurcharge', value: value),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  travelSurchargeGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'travelSurcharge',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  travelSurchargeLessThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'travelSurcharge',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterFilterCondition>
  travelSurchargeBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'travelSurcharge',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarVetProfileQueryObject
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QFilterCondition> {}

extension IsarVetProfileQueryLinks
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QFilterCondition> {}

extension IsarVetProfileQuerySortBy
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QSortBy> {
  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByConsultationFee() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'consultationFee', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByConsultationFeeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'consultationFee', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy> sortByEducation() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'education', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByEducationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'education', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByExperienceYears() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'experienceYears', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByExperienceYearsDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'experienceYears', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByLicenseNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'licenseNumber', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByLicenseNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'licenseNumber', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByProviderId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByProviderIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByTravelSurcharge() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'travelSurcharge', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  sortByTravelSurchargeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'travelSurcharge', Sort.desc);
    });
  }
}

extension IsarVetProfileQuerySortThenBy
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QSortThenBy> {
  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByConsultationFee() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'consultationFee', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByConsultationFeeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'consultationFee', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy> thenByEducation() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'education', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByEducationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'education', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByExperienceYears() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'experienceYears', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByExperienceYearsDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'experienceYears', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByLicenseNumber() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'licenseNumber', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByLicenseNumberDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'licenseNumber', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByProviderId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByProviderIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'providerId', Sort.desc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByTravelSurcharge() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'travelSurcharge', Sort.asc);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QAfterSortBy>
  thenByTravelSurchargeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'travelSurcharge', Sort.desc);
    });
  }
}

extension IsarVetProfileQueryWhereDistinct
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct> {
  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct>
  distinctByAvailableDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'availableDays');
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct>
  distinctByConsultationFee() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'consultationFee');
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct> distinctByEducation({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'education', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct>
  distinctByExperienceYears() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'experienceYears');
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct>
  distinctByLicenseNumber({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'licenseNumber',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct> distinctByProviderId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'providerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct>
  distinctBySpecialization() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'specialization');
    });
  }

  QueryBuilder<IsarVetProfile, IsarVetProfile, QDistinct>
  distinctByTravelSurcharge() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'travelSurcharge');
    });
  }
}

extension IsarVetProfileQueryProperty
    on QueryBuilder<IsarVetProfile, IsarVetProfile, QQueryProperty> {
  QueryBuilder<IsarVetProfile, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarVetProfile, List<String>, QQueryOperations>
  availableDaysProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'availableDays');
    });
  }

  QueryBuilder<IsarVetProfile, int?, QQueryOperations>
  consultationFeeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'consultationFee');
    });
  }

  QueryBuilder<IsarVetProfile, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarVetProfile, String?, QQueryOperations> educationProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'education');
    });
  }

  QueryBuilder<IsarVetProfile, int?, QQueryOperations>
  experienceYearsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'experienceYears');
    });
  }

  QueryBuilder<IsarVetProfile, String?, QQueryOperations>
  licenseNumberProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'licenseNumber');
    });
  }

  QueryBuilder<IsarVetProfile, String, QQueryOperations> providerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'providerId');
    });
  }

  QueryBuilder<IsarVetProfile, List<String>, QQueryOperations>
  specializationProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'specialization');
    });
  }

  QueryBuilder<IsarVetProfile, int?, QQueryOperations>
  travelSurchargeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'travelSurcharge');
    });
  }
}
