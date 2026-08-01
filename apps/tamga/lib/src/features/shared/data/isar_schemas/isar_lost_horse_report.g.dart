// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_lost_horse_report.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarLostHorseReportCollection on Isar {
  IsarCollection<IsarLostHorseReport> get isarLostHorseReports =>
      this.collection();
}

const IsarLostHorseReportSchema = CollectionSchema(
  name: r'IsarLostHorseReport',
  id: -2769513905194916098,
  properties: {
    r'accountId': PropertySchema(
      id: 0,
      name: r'accountId',
      type: IsarType.string,
    ),
    r'ages': PropertySchema(id: 1, name: r'ages', type: IsarType.stringList),
    r'animalType': PropertySchema(
      id: 2,
      name: r'animalType',
      type: IsarType.string,
    ),
    r'breed': PropertySchema(id: 3, name: r'breed', type: IsarType.string),
    r'coatColor': PropertySchema(
      id: 4,
      name: r'coatColor',
      type: IsarType.string,
    ),
    r'contactPhone': PropertySchema(
      id: 5,
      name: r'contactPhone',
      type: IsarType.string,
    ),
    r'createdAt': PropertySchema(
      id: 6,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'description': PropertySchema(
      id: 7,
      name: r'description',
      type: IsarType.string,
    ),
    r'domainId': PropertySchema(
      id: 8,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'earMarkDescription': PropertySchema(
      id: 9,
      name: r'earMarkDescription',
      type: IsarType.string,
    ),
    r'expiresAt': PropertySchema(
      id: 10,
      name: r'expiresAt',
      type: IsarType.dateTime,
    ),
    r'gender': PropertySchema(id: 11, name: r'gender', type: IsarType.string),
    r'horseId': PropertySchema(id: 12, name: r'horseId', type: IsarType.string),
    r'horseName': PropertySchema(
      id: 13,
      name: r'horseName',
      type: IsarType.string,
    ),
    r'lastSeenAt': PropertySchema(
      id: 14,
      name: r'lastSeenAt',
      type: IsarType.dateTime,
    ),
    r'lastSeenLat': PropertySchema(
      id: 15,
      name: r'lastSeenLat',
      type: IsarType.double,
    ),
    r'lastSeenLng': PropertySchema(
      id: 16,
      name: r'lastSeenLng',
      type: IsarType.double,
    ),
    r'locationAimag': PropertySchema(
      id: 17,
      name: r'locationAimag',
      type: IsarType.string,
    ),
    r'locationBag': PropertySchema(
      id: 18,
      name: r'locationBag',
      type: IsarType.string,
    ),
    r'locationName': PropertySchema(
      id: 19,
      name: r'locationName',
      type: IsarType.string,
    ),
    r'locationSum': PropertySchema(
      id: 20,
      name: r'locationSum',
      type: IsarType.string,
    ),
    r'lostCount': PropertySchema(
      id: 21,
      name: r'lostCount',
      type: IsarType.long,
    ),
    r'ownerId': PropertySchema(id: 22, name: r'ownerId', type: IsarType.string),
    r'photoUrl': PropertySchema(
      id: 23,
      name: r'photoUrl',
      type: IsarType.string,
    ),
    r'photoUrls': PropertySchema(
      id: 24,
      name: r'photoUrls',
      type: IsarType.stringList,
    ),
    r'pricingTier': PropertySchema(
      id: 25,
      name: r'pricingTier',
      type: IsarType.string,
    ),
    r'publicAccessEnabled': PropertySchema(
      id: 26,
      name: r'publicAccessEnabled',
      type: IsarType.bool,
    ),
    r'publicContactMode': PropertySchema(
      id: 27,
      name: r'publicContactMode',
      type: IsarType.string,
    ),
    r'publicLocationPrecision': PropertySchema(
      id: 28,
      name: r'publicLocationPrecision',
      type: IsarType.string,
    ),
    r'publicTokenHash': PropertySchema(
      id: 29,
      name: r'publicTokenHash',
      type: IsarType.string,
    ),
    r'renewalRequested': PropertySchema(
      id: 30,
      name: r'renewalRequested',
      type: IsarType.bool,
    ),
    r'resolutionNote': PropertySchema(
      id: 31,
      name: r'resolutionNote',
      type: IsarType.string,
    ),
    r'resolutionType': PropertySchema(
      id: 32,
      name: r'resolutionType',
      type: IsarType.string,
    ),
    r'resolvedAt': PropertySchema(
      id: 33,
      name: r'resolvedAt',
      type: IsarType.dateTime,
    ),
    r'resolvedBy': PropertySchema(
      id: 34,
      name: r'resolvedBy',
      type: IsarType.string,
    ),
    r'reviewedAt': PropertySchema(
      id: 35,
      name: r'reviewedAt',
      type: IsarType.dateTime,
    ),
    r'reviewedBy': PropertySchema(
      id: 36,
      name: r'reviewedBy',
      type: IsarType.string,
    ),
    r'searchRadiusKm': PropertySchema(
      id: 37,
      name: r'searchRadiusKm',
      type: IsarType.double,
    ),
    r'sightingCount': PropertySchema(
      id: 38,
      name: r'sightingCount',
      type: IsarType.long,
    ),
    r'status': PropertySchema(id: 39, name: r'status', type: IsarType.string),
    r'tamgaImageUrl': PropertySchema(
      id: 40,
      name: r'tamgaImageUrl',
      type: IsarType.string,
    ),
    r'updatedAt': PropertySchema(
      id: 41,
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
    r'verifiedSightingId': PropertySchema(
      id: 42,
      name: r'verifiedSightingId',
      type: IsarType.string,
    ),
    r'videoUrls': PropertySchema(
      id: 43,
      name: r'videoUrls',
      type: IsarType.stringList,
    ),
  },
  estimateSize: _isarLostHorseReportEstimateSize,
  serialize: _isarLostHorseReportSerialize,
  deserialize: _isarLostHorseReportDeserialize,
  deserializeProp: _isarLostHorseReportDeserializeProp,
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
  getId: _isarLostHorseReportGetId,
  getLinks: _isarLostHorseReportGetLinks,
  attach: _isarLostHorseReportAttach,
  version: '3.1.0+1',
);

int _isarLostHorseReportEstimateSize(
  IsarLostHorseReport object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.accountId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final list = object.ages;
    if (list != null) {
      bytesCount += 3 + list.length * 3;
      {
        for (var i = 0; i < list.length; i++) {
          final value = list[i];
          bytesCount += value.length * 3;
        }
      }
    }
  }
  bytesCount += 3 + object.animalType.length * 3;
  {
    final value = object.breed;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.coatColor;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.contactPhone;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.description;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  {
    final value = object.earMarkDescription;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.gender;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.horseId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.horseName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.locationAimag;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.locationBag;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.locationName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.locationSum;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.ownerId.length * 3;
  {
    final value = object.photoUrl;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final list = object.photoUrls;
    if (list != null) {
      bytesCount += 3 + list.length * 3;
      {
        for (var i = 0; i < list.length; i++) {
          final value = list[i];
          bytesCount += value.length * 3;
        }
      }
    }
  }
  bytesCount += 3 + object.pricingTier.length * 3;
  bytesCount += 3 + object.publicContactMode.length * 3;
  bytesCount += 3 + object.publicLocationPrecision.length * 3;
  {
    final value = object.publicTokenHash;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.resolutionNote;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.resolutionType;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.resolvedBy;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.reviewedBy;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.status.length * 3;
  {
    final value = object.tamgaImageUrl;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.verifiedSightingId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final list = object.videoUrls;
    if (list != null) {
      bytesCount += 3 + list.length * 3;
      {
        for (var i = 0; i < list.length; i++) {
          final value = list[i];
          bytesCount += value.length * 3;
        }
      }
    }
  }
  return bytesCount;
}

void _isarLostHorseReportSerialize(
  IsarLostHorseReport object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.accountId);
  writer.writeStringList(offsets[1], object.ages);
  writer.writeString(offsets[2], object.animalType);
  writer.writeString(offsets[3], object.breed);
  writer.writeString(offsets[4], object.coatColor);
  writer.writeString(offsets[5], object.contactPhone);
  writer.writeDateTime(offsets[6], object.createdAt);
  writer.writeString(offsets[7], object.description);
  writer.writeString(offsets[8], object.domainId);
  writer.writeString(offsets[9], object.earMarkDescription);
  writer.writeDateTime(offsets[10], object.expiresAt);
  writer.writeString(offsets[11], object.gender);
  writer.writeString(offsets[12], object.horseId);
  writer.writeString(offsets[13], object.horseName);
  writer.writeDateTime(offsets[14], object.lastSeenAt);
  writer.writeDouble(offsets[15], object.lastSeenLat);
  writer.writeDouble(offsets[16], object.lastSeenLng);
  writer.writeString(offsets[17], object.locationAimag);
  writer.writeString(offsets[18], object.locationBag);
  writer.writeString(offsets[19], object.locationName);
  writer.writeString(offsets[20], object.locationSum);
  writer.writeLong(offsets[21], object.lostCount);
  writer.writeString(offsets[22], object.ownerId);
  writer.writeString(offsets[23], object.photoUrl);
  writer.writeStringList(offsets[24], object.photoUrls);
  writer.writeString(offsets[25], object.pricingTier);
  writer.writeBool(offsets[26], object.publicAccessEnabled);
  writer.writeString(offsets[27], object.publicContactMode);
  writer.writeString(offsets[28], object.publicLocationPrecision);
  writer.writeString(offsets[29], object.publicTokenHash);
  writer.writeBool(offsets[30], object.renewalRequested);
  writer.writeString(offsets[31], object.resolutionNote);
  writer.writeString(offsets[32], object.resolutionType);
  writer.writeDateTime(offsets[33], object.resolvedAt);
  writer.writeString(offsets[34], object.resolvedBy);
  writer.writeDateTime(offsets[35], object.reviewedAt);
  writer.writeString(offsets[36], object.reviewedBy);
  writer.writeDouble(offsets[37], object.searchRadiusKm);
  writer.writeLong(offsets[38], object.sightingCount);
  writer.writeString(offsets[39], object.status);
  writer.writeString(offsets[40], object.tamgaImageUrl);
  writer.writeDateTime(offsets[41], object.updatedAt);
  writer.writeString(offsets[42], object.verifiedSightingId);
  writer.writeStringList(offsets[43], object.videoUrls);
}

IsarLostHorseReport _isarLostHorseReportDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarLostHorseReport();
  object.accountId = reader.readStringOrNull(offsets[0]);
  object.ages = reader.readStringList(offsets[1]);
  object.animalType = reader.readString(offsets[2]);
  object.breed = reader.readStringOrNull(offsets[3]);
  object.coatColor = reader.readStringOrNull(offsets[4]);
  object.contactPhone = reader.readStringOrNull(offsets[5]);
  object.createdAt = reader.readDateTime(offsets[6]);
  object.description = reader.readStringOrNull(offsets[7]);
  object.domainId = reader.readString(offsets[8]);
  object.earMarkDescription = reader.readStringOrNull(offsets[9]);
  object.expiresAt = reader.readDateTimeOrNull(offsets[10]);
  object.gender = reader.readStringOrNull(offsets[11]);
  object.horseId = reader.readStringOrNull(offsets[12]);
  object.horseName = reader.readStringOrNull(offsets[13]);
  object.id = id;
  object.lastSeenAt = reader.readDateTime(offsets[14]);
  object.lastSeenLat = reader.readDouble(offsets[15]);
  object.lastSeenLng = reader.readDouble(offsets[16]);
  object.locationAimag = reader.readStringOrNull(offsets[17]);
  object.locationBag = reader.readStringOrNull(offsets[18]);
  object.locationName = reader.readStringOrNull(offsets[19]);
  object.locationSum = reader.readStringOrNull(offsets[20]);
  object.lostCount = reader.readLong(offsets[21]);
  object.ownerId = reader.readString(offsets[22]);
  object.photoUrl = reader.readStringOrNull(offsets[23]);
  object.photoUrls = reader.readStringList(offsets[24]);
  object.pricingTier = reader.readString(offsets[25]);
  object.publicAccessEnabled = reader.readBool(offsets[26]);
  object.publicContactMode = reader.readString(offsets[27]);
  object.publicLocationPrecision = reader.readString(offsets[28]);
  object.publicTokenHash = reader.readStringOrNull(offsets[29]);
  object.renewalRequested = reader.readBool(offsets[30]);
  object.resolutionNote = reader.readStringOrNull(offsets[31]);
  object.resolutionType = reader.readStringOrNull(offsets[32]);
  object.resolvedAt = reader.readDateTimeOrNull(offsets[33]);
  object.resolvedBy = reader.readStringOrNull(offsets[34]);
  object.reviewedAt = reader.readDateTimeOrNull(offsets[35]);
  object.reviewedBy = reader.readStringOrNull(offsets[36]);
  object.searchRadiusKm = reader.readDouble(offsets[37]);
  object.sightingCount = reader.readLong(offsets[38]);
  object.status = reader.readString(offsets[39]);
  object.tamgaImageUrl = reader.readStringOrNull(offsets[40]);
  object.updatedAt = reader.readDateTime(offsets[41]);
  object.verifiedSightingId = reader.readStringOrNull(offsets[42]);
  object.videoUrls = reader.readStringList(offsets[43]);
  return object;
}

P _isarLostHorseReportDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringOrNull(offset)) as P;
    case 1:
      return (reader.readStringList(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readStringOrNull(offset)) as P;
    case 4:
      return (reader.readStringOrNull(offset)) as P;
    case 5:
      return (reader.readStringOrNull(offset)) as P;
    case 6:
      return (reader.readDateTime(offset)) as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readStringOrNull(offset)) as P;
    case 10:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 11:
      return (reader.readStringOrNull(offset)) as P;
    case 12:
      return (reader.readStringOrNull(offset)) as P;
    case 13:
      return (reader.readStringOrNull(offset)) as P;
    case 14:
      return (reader.readDateTime(offset)) as P;
    case 15:
      return (reader.readDouble(offset)) as P;
    case 16:
      return (reader.readDouble(offset)) as P;
    case 17:
      return (reader.readStringOrNull(offset)) as P;
    case 18:
      return (reader.readStringOrNull(offset)) as P;
    case 19:
      return (reader.readStringOrNull(offset)) as P;
    case 20:
      return (reader.readStringOrNull(offset)) as P;
    case 21:
      return (reader.readLong(offset)) as P;
    case 22:
      return (reader.readString(offset)) as P;
    case 23:
      return (reader.readStringOrNull(offset)) as P;
    case 24:
      return (reader.readStringList(offset)) as P;
    case 25:
      return (reader.readString(offset)) as P;
    case 26:
      return (reader.readBool(offset)) as P;
    case 27:
      return (reader.readString(offset)) as P;
    case 28:
      return (reader.readString(offset)) as P;
    case 29:
      return (reader.readStringOrNull(offset)) as P;
    case 30:
      return (reader.readBool(offset)) as P;
    case 31:
      return (reader.readStringOrNull(offset)) as P;
    case 32:
      return (reader.readStringOrNull(offset)) as P;
    case 33:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 34:
      return (reader.readStringOrNull(offset)) as P;
    case 35:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 36:
      return (reader.readStringOrNull(offset)) as P;
    case 37:
      return (reader.readDouble(offset)) as P;
    case 38:
      return (reader.readLong(offset)) as P;
    case 39:
      return (reader.readString(offset)) as P;
    case 40:
      return (reader.readStringOrNull(offset)) as P;
    case 41:
      return (reader.readDateTime(offset)) as P;
    case 42:
      return (reader.readStringOrNull(offset)) as P;
    case 43:
      return (reader.readStringList(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _isarLostHorseReportGetId(IsarLostHorseReport object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarLostHorseReportGetLinks(
  IsarLostHorseReport object,
) {
  return [];
}

void _isarLostHorseReportAttach(
  IsarCollection<dynamic> col,
  Id id,
  IsarLostHorseReport object,
) {
  object.id = id;
}

extension IsarLostHorseReportByIndex on IsarCollection<IsarLostHorseReport> {
  Future<IsarLostHorseReport?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarLostHorseReport? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarLostHorseReport?>> getAllByDomainId(
    List<String> domainIdValues,
  ) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarLostHorseReport?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarLostHorseReport object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarLostHorseReport object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarLostHorseReport> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarLostHorseReport> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarLostHorseReportQueryWhereSort
    on QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QWhere> {
  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension IsarLostHorseReportQueryWhere
    on QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QWhereClause> {
  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
  idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
  idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
  idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
  domainIdEqualTo(String domainId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterWhereClause>
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

extension IsarLostHorseReportQueryFilter
    on
        QueryBuilder<
          IsarLostHorseReport,
          IsarLostHorseReport,
          QFilterCondition
        > {
  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'accountId'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'accountId'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdEqualTo(String? value, {bool caseSensitive = true}) {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdGreaterThan(
    String? value, {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdLessThan(
    String? value, {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdBetween(
    String? lower,
    String? upper, {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'accountId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  accountIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'accountId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'ages'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'ages'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'ages',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'ages',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'ages',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'ages',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'ages',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'ages',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'ages',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'ages',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ages', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ages', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'ages', length, true, length, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'ages', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'ages', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'ages', 0, true, length, include);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'ages', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  agesLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'ages',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'animalType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'animalType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'animalType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'animalType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'animalType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'animalType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'animalType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'animalType',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'animalType', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  animalTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'animalType', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'breed'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'breed'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'breed',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'breed',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'breed',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'breed',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'breed',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'breed',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'breed',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'breed',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'breed', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  breedIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'breed', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  coatColorIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'coatColor'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  coatColorIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'coatColor'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  coatColorIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'coatColor', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  coatColorIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'coatColor', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'contactPhone'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'contactPhone'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'contactPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'contactPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'contactPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'contactPhone',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'contactPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'contactPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'contactPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'contactPhone',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'contactPhone', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  contactPhoneIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'contactPhone', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  createdAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'description'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'description'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'description',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'description',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'description',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'description', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  descriptionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'description', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'earMarkDescription'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'earMarkDescription'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'earMarkDescription',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'earMarkDescription',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'earMarkDescription',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'earMarkDescription',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'earMarkDescription',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'earMarkDescription',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'earMarkDescription',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'earMarkDescription',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'earMarkDescription', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  earMarkDescriptionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'earMarkDescription', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  expiresAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'expiresAt'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  expiresAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'expiresAt'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  expiresAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'expiresAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  expiresAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'expiresAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  expiresAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'expiresAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  expiresAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'expiresAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'gender'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'gender'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'gender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'gender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'gender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'gender',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'gender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'gender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'gender',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'gender',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'gender', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  genderIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'gender', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'horseId'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'horseId'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'horseId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'horseId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'horseId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'horseName'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'horseName'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameEqualTo(String? value, {bool caseSensitive = true}) {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameGreaterThan(
    String? value, {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameLessThan(
    String? value, {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameBetween(
    String? lower,
    String? upper, {
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  horseNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'lastSeenAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenAtGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lastSeenAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenAtLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lastSeenAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lastSeenAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLatEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'lastSeenLat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLatGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lastSeenLat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLatLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lastSeenLat',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLatBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lastSeenLat',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLngEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'lastSeenLng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLngGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lastSeenLng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLngLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lastSeenLng',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lastSeenLngBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lastSeenLng',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'locationAimag'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'locationAimag'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationAimag',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationAimag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationAimag',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationAimag', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationAimagIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationAimag', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'locationBag'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'locationBag'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationBag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationBag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationBag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationBag',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationBag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationBag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationBag',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationBag',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationBag', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationBagIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationBag', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'locationName'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'locationName'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationName', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationName', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'locationSum'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'locationSum'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'locationSum',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'locationSum',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'locationSum',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'locationSum', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  locationSumIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'locationSum', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lostCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'lostCount', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lostCountGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'lostCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lostCountLessThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'lostCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  lostCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'lostCount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
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

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  ownerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  ownerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'photoUrl'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'photoUrl'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'photoUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'photoUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'photoUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'photoUrl',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'photoUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'photoUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'photoUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'photoUrl',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'photoUrl', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'photoUrl', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'photoUrls'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'photoUrls'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'photoUrls',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'photoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'photoUrls',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'photoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'photoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', length, true, length, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, true, length, include);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  photoUrlsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'photoUrls',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'pricingTier',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'pricingTier',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'pricingTier',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'pricingTier',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'pricingTier',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'pricingTier',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'pricingTier',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'pricingTier',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'pricingTier', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  pricingTierIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'pricingTier', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicAccessEnabledEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'publicAccessEnabled', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'publicContactMode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'publicContactMode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'publicContactMode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'publicContactMode',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'publicContactMode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'publicContactMode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'publicContactMode',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'publicContactMode',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'publicContactMode', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicContactModeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'publicContactMode', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'publicLocationPrecision',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'publicLocationPrecision',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'publicLocationPrecision',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'publicLocationPrecision',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'publicLocationPrecision',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'publicLocationPrecision',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'publicLocationPrecision',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'publicLocationPrecision',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'publicLocationPrecision',
          value: '',
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicLocationPrecisionIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          property: r'publicLocationPrecision',
          value: '',
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'publicTokenHash'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'publicTokenHash'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'publicTokenHash',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'publicTokenHash',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'publicTokenHash',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'publicTokenHash',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'publicTokenHash',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'publicTokenHash',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'publicTokenHash',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'publicTokenHash',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'publicTokenHash', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  publicTokenHashIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'publicTokenHash', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  renewalRequestedEqualTo(bool value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'renewalRequested', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'resolutionNote'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'resolutionNote'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'resolutionNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'resolutionNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'resolutionNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'resolutionNote',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'resolutionNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'resolutionNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'resolutionNote',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'resolutionNote',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'resolutionNote', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionNoteIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'resolutionNote', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'resolutionType'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'resolutionType'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'resolutionType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'resolutionType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'resolutionType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'resolutionType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'resolutionType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'resolutionType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'resolutionType',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'resolutionType',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'resolutionType', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolutionTypeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'resolutionType', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'resolvedAt'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'resolvedAt'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'resolvedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'resolvedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'resolvedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'resolvedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'resolvedBy'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'resolvedBy'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'resolvedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'resolvedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'resolvedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'resolvedBy',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'resolvedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'resolvedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'resolvedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'resolvedBy',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'resolvedBy', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  resolvedByIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'resolvedBy', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedAtIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'reviewedAt'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedAtIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'reviewedAt'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedAtEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'reviewedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedAtGreaterThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'reviewedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedAtLessThan(DateTime? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'reviewedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedAtBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'reviewedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'reviewedBy'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'reviewedBy'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'reviewedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'reviewedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'reviewedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'reviewedBy',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'reviewedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'reviewedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'reviewedBy',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'reviewedBy',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'reviewedBy', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  reviewedByIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'reviewedBy', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  searchRadiusKmEqualTo(double value, {double epsilon = Query.epsilon}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'searchRadiusKm',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  searchRadiusKmGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'searchRadiusKm',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  searchRadiusKmLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'searchRadiusKm',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  searchRadiusKmBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'searchRadiusKm',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  sightingCountEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'sightingCount', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  sightingCountGreaterThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'sightingCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  sightingCountLessThan(int value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'sightingCount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  sightingCountBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'sightingCount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'status',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'status',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'status',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'status', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'tamgaImageUrl'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'tamgaImageUrl'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'tamgaImageUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'tamgaImageUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'tamgaImageUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'tamgaImageUrl',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'tamgaImageUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'tamgaImageUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'tamgaImageUrl',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'tamgaImageUrl',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'tamgaImageUrl', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  tamgaImageUrlIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'tamgaImageUrl', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  updatedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  updatedAtGreaterThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'updatedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  updatedAtLessThan(DateTime value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'updatedAt',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  updatedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'updatedAt',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'verifiedSightingId'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'verifiedSightingId'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'verifiedSightingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'verifiedSightingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'verifiedSightingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'verifiedSightingId',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'verifiedSightingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'verifiedSightingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'verifiedSightingId',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'verifiedSightingId',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'verifiedSightingId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  verifiedSightingIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'verifiedSightingId', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'videoUrls'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'videoUrls'),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementEqualTo(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'videoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'videoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'videoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'videoUrls',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'videoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'videoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'videoUrls',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'videoUrls',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'videoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'videoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'videoUrls', length, true, length, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'videoUrls', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'videoUrls', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'videoUrls', 0, true, length, include);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'videoUrls', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterFilterCondition>
  videoUrlsLengthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(
        r'videoUrls',
        lower,
        includeLower,
        upper,
        includeUpper,
      );
    });
  }
}

extension IsarLostHorseReportQueryObject
    on
        QueryBuilder<
          IsarLostHorseReport,
          IsarLostHorseReport,
          QFilterCondition
        > {}

extension IsarLostHorseReportQueryLinks
    on
        QueryBuilder<
          IsarLostHorseReport,
          IsarLostHorseReport,
          QFilterCondition
        > {}

extension IsarLostHorseReportQuerySortBy
    on QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QSortBy> {
  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByAccountId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByAccountIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByAnimalType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'animalType', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByAnimalTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'animalType', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByBreed() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breed', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByBreedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breed', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByCoatColor() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByCoatColorDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByContactPhone() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'contactPhone', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByContactPhoneDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'contactPhone', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByEarMarkDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'earMarkDescription', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByEarMarkDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'earMarkDescription', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByGenderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLastSeenAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLastSeenAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLastSeenLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLat', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLastSeenLatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLat', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLastSeenLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLng', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLastSeenLngDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLng', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationAimag() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationAimagDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationBag() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationBag', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationBagDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationBag', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationName', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationName', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationSum() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLocationSumDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLostCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lostCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByLostCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lostCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPhotoUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPhotoUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPricingTier() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pricingTier', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPricingTierDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pricingTier', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicAccessEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicAccessEnabled', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicAccessEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicAccessEnabled', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicContactMode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicContactMode', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicContactModeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicContactMode', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicLocationPrecision() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicLocationPrecision', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicLocationPrecisionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicLocationPrecision', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicTokenHash() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicTokenHash', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByPublicTokenHashDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicTokenHash', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByRenewalRequested() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'renewalRequested', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByRenewalRequestedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'renewalRequested', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolutionNote() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionNote', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolutionNoteDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionNote', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolutionType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionType', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolutionTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionType', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolvedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolvedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolvedBy() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedBy', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByResolvedByDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedBy', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByReviewedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByReviewedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByReviewedBy() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedBy', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByReviewedByDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedBy', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortBySearchRadiusKm() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'searchRadiusKm', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortBySearchRadiusKmDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'searchRadiusKm', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortBySightingCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sightingCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortBySightingCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sightingCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByTamgaImageUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaImageUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByTamgaImageUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaImageUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByVerifiedSightingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedSightingId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  sortByVerifiedSightingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedSightingId', Sort.desc);
    });
  }
}

extension IsarLostHorseReportQuerySortThenBy
    on QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QSortThenBy> {
  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByAccountId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByAccountIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'accountId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByAnimalType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'animalType', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByAnimalTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'animalType', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByBreed() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breed', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByBreedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'breed', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByCoatColor() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByCoatColorDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'coatColor', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByContactPhone() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'contactPhone', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByContactPhoneDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'contactPhone', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'description', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByEarMarkDescription() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'earMarkDescription', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByEarMarkDescriptionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'earMarkDescription', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiresAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByExpiresAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'expiresAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByGender() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByGenderDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'gender', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLastSeenAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLastSeenAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLastSeenLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLat', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLastSeenLatDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLat', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLastSeenLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLng', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLastSeenLngDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lastSeenLng', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationAimag() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationAimagDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationAimag', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationBag() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationBag', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationBagDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationBag', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationName', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationName', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationSum() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLocationSumDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'locationSum', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLostCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lostCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByLostCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lostCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPhotoUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPhotoUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'photoUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPricingTier() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pricingTier', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPricingTierDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pricingTier', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicAccessEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicAccessEnabled', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicAccessEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicAccessEnabled', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicContactMode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicContactMode', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicContactModeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicContactMode', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicLocationPrecision() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicLocationPrecision', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicLocationPrecisionDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicLocationPrecision', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicTokenHash() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicTokenHash', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByPublicTokenHashDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'publicTokenHash', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByRenewalRequested() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'renewalRequested', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByRenewalRequestedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'renewalRequested', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolutionNote() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionNote', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolutionNoteDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionNote', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolutionType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionType', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolutionTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolutionType', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolvedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolvedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolvedBy() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedBy', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByResolvedByDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'resolvedBy', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByReviewedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByReviewedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByReviewedBy() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedBy', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByReviewedByDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reviewedBy', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenBySearchRadiusKm() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'searchRadiusKm', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenBySearchRadiusKmDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'searchRadiusKm', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenBySightingCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sightingCount', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenBySightingCountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'sightingCount', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByTamgaImageUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaImageUrl', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByTamgaImageUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'tamgaImageUrl', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByVerifiedSightingId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedSightingId', Sort.asc);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QAfterSortBy>
  thenByVerifiedSightingIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'verifiedSightingId', Sort.desc);
    });
  }
}

extension IsarLostHorseReportQueryWhereDistinct
    on QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct> {
  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByAccountId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'accountId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByAges() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ages');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByAnimalType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'animalType', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByBreed({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'breed', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByCoatColor({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'coatColor', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByContactPhone({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'contactPhone', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByDescription({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'description', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByDomainId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByEarMarkDescription({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'earMarkDescription',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByExpiresAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'expiresAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByGender({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'gender', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByHorseId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByHorseName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLastSeenAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastSeenAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLastSeenLat() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastSeenLat');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLastSeenLng() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lastSeenLng');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLocationAimag({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'locationAimag',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLocationBag({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'locationBag', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLocationName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'locationName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLocationSum({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'locationSum', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByLostCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lostCount');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByOwnerId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPhotoUrl({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'photoUrl', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPhotoUrls() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'photoUrls');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPricingTier({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'pricingTier', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPublicAccessEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'publicAccessEnabled');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPublicContactMode({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'publicContactMode',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPublicLocationPrecision({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'publicLocationPrecision',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByPublicTokenHash({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'publicTokenHash',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByRenewalRequested() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'renewalRequested');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByResolutionNote({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'resolutionNote',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByResolutionType({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'resolutionType',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByResolvedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'resolvedAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByResolvedBy({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'resolvedBy', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByReviewedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'reviewedAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByReviewedBy({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'reviewedBy', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctBySearchRadiusKm() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'searchRadiusKm');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctBySightingCount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'sightingCount');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByStatus({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByTamgaImageUrl({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'tamgaImageUrl',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByVerifiedSightingId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'verifiedSightingId',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QDistinct>
  distinctByVideoUrls() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'videoUrls');
    });
  }
}

extension IsarLostHorseReportQueryProperty
    on QueryBuilder<IsarLostHorseReport, IsarLostHorseReport, QQueryProperty> {
  QueryBuilder<IsarLostHorseReport, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  accountIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'accountId');
    });
  }

  QueryBuilder<IsarLostHorseReport, List<String>?, QQueryOperations>
  agesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ages');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations>
  animalTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'animalType');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations> breedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'breed');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  coatColorProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'coatColor');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  contactPhoneProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'contactPhone');
    });
  }

  QueryBuilder<IsarLostHorseReport, DateTime, QQueryOperations>
  createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  descriptionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'description');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations>
  domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  earMarkDescriptionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'earMarkDescription');
    });
  }

  QueryBuilder<IsarLostHorseReport, DateTime?, QQueryOperations>
  expiresAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'expiresAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  genderProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'gender');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  horseNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseName');
    });
  }

  QueryBuilder<IsarLostHorseReport, DateTime, QQueryOperations>
  lastSeenAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastSeenAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, double, QQueryOperations>
  lastSeenLatProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastSeenLat');
    });
  }

  QueryBuilder<IsarLostHorseReport, double, QQueryOperations>
  lastSeenLngProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lastSeenLng');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  locationAimagProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationAimag');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  locationBagProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationBag');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  locationNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationName');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  locationSumProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'locationSum');
    });
  }

  QueryBuilder<IsarLostHorseReport, int, QQueryOperations> lostCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lostCount');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations>
  ownerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerId');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  photoUrlProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'photoUrl');
    });
  }

  QueryBuilder<IsarLostHorseReport, List<String>?, QQueryOperations>
  photoUrlsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'photoUrls');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations>
  pricingTierProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'pricingTier');
    });
  }

  QueryBuilder<IsarLostHorseReport, bool, QQueryOperations>
  publicAccessEnabledProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'publicAccessEnabled');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations>
  publicContactModeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'publicContactMode');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations>
  publicLocationPrecisionProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'publicLocationPrecision');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  publicTokenHashProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'publicTokenHash');
    });
  }

  QueryBuilder<IsarLostHorseReport, bool, QQueryOperations>
  renewalRequestedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'renewalRequested');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  resolutionNoteProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'resolutionNote');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  resolutionTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'resolutionType');
    });
  }

  QueryBuilder<IsarLostHorseReport, DateTime?, QQueryOperations>
  resolvedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'resolvedAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  resolvedByProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'resolvedBy');
    });
  }

  QueryBuilder<IsarLostHorseReport, DateTime?, QQueryOperations>
  reviewedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'reviewedAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  reviewedByProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'reviewedBy');
    });
  }

  QueryBuilder<IsarLostHorseReport, double, QQueryOperations>
  searchRadiusKmProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'searchRadiusKm');
    });
  }

  QueryBuilder<IsarLostHorseReport, int, QQueryOperations>
  sightingCountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'sightingCount');
    });
  }

  QueryBuilder<IsarLostHorseReport, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  tamgaImageUrlProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'tamgaImageUrl');
    });
  }

  QueryBuilder<IsarLostHorseReport, DateTime, QQueryOperations>
  updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }

  QueryBuilder<IsarLostHorseReport, String?, QQueryOperations>
  verifiedSightingIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'verifiedSightingId');
    });
  }

  QueryBuilder<IsarLostHorseReport, List<String>?, QQueryOperations>
  videoUrlsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'videoUrls');
    });
  }
}
