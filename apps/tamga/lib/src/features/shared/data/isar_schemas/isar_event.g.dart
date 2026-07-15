// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'isar_event.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetIsarEventCollection on Isar {
  IsarCollection<IsarEvent> get isarEvents => this.collection();
}

const IsarEventSchema = CollectionSchema(
  name: r'IsarEvent',
  id: 5962100766301502855,
  properties: {
    r'address': PropertySchema(id: 0, name: r'address', type: IsarType.string),
    r'createdAt': PropertySchema(
      id: 1,
      name: r'createdAt',
      type: IsarType.dateTime,
    ),
    r'date': PropertySchema(id: 2, name: r'date', type: IsarType.dateTime),
    r'domainId': PropertySchema(
      id: 3,
      name: r'domainId',
      type: IsarType.string,
    ),
    r'eventType': PropertySchema(
      id: 4,
      name: r'eventType',
      type: IsarType.byte,
      enumMap: _IsarEventeventTypeEnumValueMap,
    ),
    r'horseId': PropertySchema(id: 5, name: r'horseId', type: IsarType.string),
    r'horseName': PropertySchema(
      id: 6,
      name: r'horseName',
      type: IsarType.string,
    ),
    r'isFeatured': PropertySchema(
      id: 7,
      name: r'isFeatured',
      type: IsarType.bool,
    ),
    r'latitude': PropertySchema(
      id: 8,
      name: r'latitude',
      type: IsarType.double,
    ),
    r'location': PropertySchema(
      id: 9,
      name: r'location',
      type: IsarType.string,
    ),
    r'longitude': PropertySchema(
      id: 10,
      name: r'longitude',
      type: IsarType.double,
    ),
    r'notes': PropertySchema(id: 11, name: r'notes', type: IsarType.string),
    r'organizerEmail': PropertySchema(
      id: 12,
      name: r'organizerEmail',
      type: IsarType.string,
    ),
    r'organizerName': PropertySchema(
      id: 13,
      name: r'organizerName',
      type: IsarType.string,
    ),
    r'organizerPhone': PropertySchema(
      id: 14,
      name: r'organizerPhone',
      type: IsarType.string,
    ),
    r'ownerId': PropertySchema(id: 15, name: r'ownerId', type: IsarType.string),
    r'photoUrls': PropertySchema(
      id: 16,
      name: r'photoUrls',
      type: IsarType.stringList,
    ),
    r'prizeAmount': PropertySchema(
      id: 17,
      name: r'prizeAmount',
      type: IsarType.long,
    ),
    r'registrationEnabled': PropertySchema(
      id: 18,
      name: r'registrationEnabled',
      type: IsarType.bool,
    ),
    r'result': PropertySchema(id: 19, name: r'result', type: IsarType.string),
    r'title': PropertySchema(id: 20, name: r'title', type: IsarType.string),
    r'updatedAt': PropertySchema(
      id: 21,
      name: r'updatedAt',
      type: IsarType.dateTime,
    ),
  },
  estimateSize: _isarEventEstimateSize,
  serialize: _isarEventSerialize,
  deserialize: _isarEventDeserialize,
  deserializeProp: _isarEventDeserializeProp,
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
    r'horseId': IndexSchema(
      id: -4681125749579367450,
      name: r'horseId',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'horseId',
          type: IndexType.hash,
          caseSensitive: true,
        ),
      ],
    ),
    r'eventType': IndexSchema(
      id: -3849237371187389498,
      name: r'eventType',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'eventType',
          type: IndexType.value,
          caseSensitive: false,
        ),
      ],
    ),
    r'date': IndexSchema(
      id: -7552997827385218417,
      name: r'date',
      unique: false,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'date',
          type: IndexType.value,
          caseSensitive: false,
        ),
      ],
    ),
  },
  links: {},
  embeddedSchemas: {},
  getId: _isarEventGetId,
  getLinks: _isarEventGetLinks,
  attach: _isarEventAttach,
  version: '3.1.0+1',
);

int _isarEventEstimateSize(
  IsarEvent object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  {
    final value = object.address;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.domainId.length * 3;
  bytesCount += 3 + object.horseId.length * 3;
  {
    final value = object.horseName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.location;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.notes;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.organizerEmail;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.organizerName;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.organizerPhone;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  {
    final value = object.ownerId;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.photoUrls.length * 3;
  {
    for (var i = 0; i < object.photoUrls.length; i++) {
      final value = object.photoUrls[i];
      bytesCount += value.length * 3;
    }
  }
  {
    final value = object.result;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.title.length * 3;
  return bytesCount;
}

void _isarEventSerialize(
  IsarEvent object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeString(offsets[0], object.address);
  writer.writeDateTime(offsets[1], object.createdAt);
  writer.writeDateTime(offsets[2], object.date);
  writer.writeString(offsets[3], object.domainId);
  writer.writeByte(offsets[4], object.eventType.index);
  writer.writeString(offsets[5], object.horseId);
  writer.writeString(offsets[6], object.horseName);
  writer.writeBool(offsets[7], object.isFeatured);
  writer.writeDouble(offsets[8], object.latitude);
  writer.writeString(offsets[9], object.location);
  writer.writeDouble(offsets[10], object.longitude);
  writer.writeString(offsets[11], object.notes);
  writer.writeString(offsets[12], object.organizerEmail);
  writer.writeString(offsets[13], object.organizerName);
  writer.writeString(offsets[14], object.organizerPhone);
  writer.writeString(offsets[15], object.ownerId);
  writer.writeStringList(offsets[16], object.photoUrls);
  writer.writeLong(offsets[17], object.prizeAmount);
  writer.writeBool(offsets[18], object.registrationEnabled);
  writer.writeString(offsets[19], object.result);
  writer.writeString(offsets[20], object.title);
  writer.writeDateTime(offsets[21], object.updatedAt);
}

IsarEvent _isarEventDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = IsarEvent();
  object.address = reader.readStringOrNull(offsets[0]);
  object.createdAt = reader.readDateTime(offsets[1]);
  object.date = reader.readDateTimeOrNull(offsets[2]);
  object.domainId = reader.readString(offsets[3]);
  object.eventType =
      _IsarEventeventTypeValueEnumMap[reader.readByteOrNull(offsets[4])] ??
      EventType.race;
  object.horseId = reader.readString(offsets[5]);
  object.horseName = reader.readStringOrNull(offsets[6]);
  object.id = id;
  object.isFeatured = reader.readBoolOrNull(offsets[7]);
  object.latitude = reader.readDoubleOrNull(offsets[8]);
  object.location = reader.readStringOrNull(offsets[9]);
  object.longitude = reader.readDoubleOrNull(offsets[10]);
  object.notes = reader.readStringOrNull(offsets[11]);
  object.organizerEmail = reader.readStringOrNull(offsets[12]);
  object.organizerName = reader.readStringOrNull(offsets[13]);
  object.organizerPhone = reader.readStringOrNull(offsets[14]);
  object.ownerId = reader.readStringOrNull(offsets[15]);
  object.photoUrls = reader.readStringList(offsets[16]) ?? [];
  object.prizeAmount = reader.readLongOrNull(offsets[17]);
  object.registrationEnabled = reader.readBoolOrNull(offsets[18]);
  object.result = reader.readStringOrNull(offsets[19]);
  object.title = reader.readString(offsets[20]);
  object.updatedAt = reader.readDateTime(offsets[21]);
  return object;
}

P _isarEventDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readStringOrNull(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 3:
      return (reader.readString(offset)) as P;
    case 4:
      return (_IsarEventeventTypeValueEnumMap[reader.readByteOrNull(offset)] ??
              EventType.race)
          as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readStringOrNull(offset)) as P;
    case 7:
      return (reader.readBoolOrNull(offset)) as P;
    case 8:
      return (reader.readDoubleOrNull(offset)) as P;
    case 9:
      return (reader.readStringOrNull(offset)) as P;
    case 10:
      return (reader.readDoubleOrNull(offset)) as P;
    case 11:
      return (reader.readStringOrNull(offset)) as P;
    case 12:
      return (reader.readStringOrNull(offset)) as P;
    case 13:
      return (reader.readStringOrNull(offset)) as P;
    case 14:
      return (reader.readStringOrNull(offset)) as P;
    case 15:
      return (reader.readStringOrNull(offset)) as P;
    case 16:
      return (reader.readStringList(offset) ?? []) as P;
    case 17:
      return (reader.readLongOrNull(offset)) as P;
    case 18:
      return (reader.readBoolOrNull(offset)) as P;
    case 19:
      return (reader.readStringOrNull(offset)) as P;
    case 20:
      return (reader.readString(offset)) as P;
    case 21:
      return (reader.readDateTime(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

const _IsarEventeventTypeEnumValueMap = {
  'race': 0,
  'auction': 1,
  'expo': 2,
  'training': 3,
};
const _IsarEventeventTypeValueEnumMap = {
  0: EventType.race,
  1: EventType.auction,
  2: EventType.expo,
  3: EventType.training,
};

Id _isarEventGetId(IsarEvent object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _isarEventGetLinks(IsarEvent object) {
  return [];
}

void _isarEventAttach(IsarCollection<dynamic> col, Id id, IsarEvent object) {
  object.id = id;
}

extension IsarEventByIndex on IsarCollection<IsarEvent> {
  Future<IsarEvent?> getByDomainId(String domainId) {
    return getByIndex(r'domainId', [domainId]);
  }

  IsarEvent? getByDomainIdSync(String domainId) {
    return getByIndexSync(r'domainId', [domainId]);
  }

  Future<bool> deleteByDomainId(String domainId) {
    return deleteByIndex(r'domainId', [domainId]);
  }

  bool deleteByDomainIdSync(String domainId) {
    return deleteByIndexSync(r'domainId', [domainId]);
  }

  Future<List<IsarEvent?>> getAllByDomainId(List<String> domainIdValues) {
    final values = domainIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'domainId', values);
  }

  List<IsarEvent?> getAllByDomainIdSync(List<String> domainIdValues) {
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

  Future<Id> putByDomainId(IsarEvent object) {
    return putByIndex(r'domainId', object);
  }

  Id putByDomainIdSync(IsarEvent object, {bool saveLinks = true}) {
    return putByIndexSync(r'domainId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByDomainId(List<IsarEvent> objects) {
    return putAllByIndex(r'domainId', objects);
  }

  List<Id> putAllByDomainIdSync(
    List<IsarEvent> objects, {
    bool saveLinks = true,
  }) {
    return putAllByIndexSync(r'domainId', objects, saveLinks: saveLinks);
  }
}

extension IsarEventQueryWhereSort
    on QueryBuilder<IsarEvent, IsarEvent, QWhere> {
  QueryBuilder<IsarEvent, IsarEvent, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhere> anyEventType() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'eventType'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhere> anyDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        const IndexWhereClause.any(indexName: r'date'),
      );
    });
  }
}

extension IsarEventQueryWhere
    on QueryBuilder<IsarEvent, IsarEvent, QWhereClause> {
  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(lower: id, upper: id));
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> idNotEqualTo(Id id) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> idGreaterThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> idLessThan(
    Id id, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> idBetween(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> domainIdEqualTo(
    String domainId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'domainId', value: [domainId]),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> domainIdNotEqualTo(
    String domainId,
  ) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> horseIdEqualTo(
    String horseId,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'horseId', value: [horseId]),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> horseIdNotEqualTo(
    String horseId,
  ) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [],
                upper: [horseId],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [horseId],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [horseId],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'horseId',
                lower: [],
                upper: [horseId],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> eventTypeEqualTo(
    EventType eventType,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'eventType', value: [eventType]),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> eventTypeNotEqualTo(
    EventType eventType,
  ) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'eventType',
                lower: [],
                upper: [eventType],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'eventType',
                lower: [eventType],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'eventType',
                lower: [eventType],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'eventType',
                lower: [],
                upper: [eventType],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> eventTypeGreaterThan(
    EventType eventType, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'eventType',
          lower: [eventType],
          includeLower: include,
          upper: [],
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> eventTypeLessThan(
    EventType eventType, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'eventType',
          lower: [],
          upper: [eventType],
          includeUpper: include,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> eventTypeBetween(
    EventType lowerEventType,
    EventType upperEventType, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'eventType',
          lower: [lowerEventType],
          includeLower: includeLower,
          upper: [upperEventType],
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'date', value: [null]),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'date',
          lower: [null],
          includeLower: false,
          upper: [],
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateEqualTo(
    DateTime? date,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.equalTo(indexName: r'date', value: [date]),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateNotEqualTo(
    DateTime? date,
  ) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'date',
                lower: [],
                upper: [date],
                includeUpper: false,
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'date',
                lower: [date],
                includeLower: false,
                upper: [],
              ),
            );
      } else {
        return query
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'date',
                lower: [date],
                includeLower: false,
                upper: [],
              ),
            )
            .addWhereClause(
              IndexWhereClause.between(
                indexName: r'date',
                lower: [],
                upper: [date],
                includeUpper: false,
              ),
            );
      }
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateGreaterThan(
    DateTime? date, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'date',
          lower: [date],
          includeLower: include,
          upper: [],
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateLessThan(
    DateTime? date, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'date',
          lower: [],
          upper: [date],
          includeUpper: include,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterWhereClause> dateBetween(
    DateTime? lowerDate,
    DateTime? upperDate, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IndexWhereClause.between(
          indexName: r'date',
          lower: [lowerDate],
          includeLower: includeLower,
          upper: [upperDate],
          includeUpper: includeUpper,
        ),
      );
    });
  }
}

extension IsarEventQueryFilter
    on QueryBuilder<IsarEvent, IsarEvent, QFilterCondition> {
  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'address'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'address'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'address',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'address',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'address',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> addressIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'address', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  addressIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'address', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> createdAtEqualTo(
    DateTime value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'createdAt', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> createdAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> createdAtBetween(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> dateIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'date'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> dateIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'date'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> dateEqualTo(
    DateTime? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'date', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> dateGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'date',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> dateLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'date',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> dateBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'date',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdGreaterThan(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdLessThan(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdBetween(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> domainIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  domainIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'domainId', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> eventTypeEqualTo(
    EventType value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'eventType', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  eventTypeGreaterThan(EventType value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'eventType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> eventTypeLessThan(
    EventType value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'eventType',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> eventTypeBetween(
    EventType lower,
    EventType upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'eventType',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdGreaterThan(
    String value, {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdLessThan(
    String value, {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdBetween(
    String lower,
    String upper, {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  horseIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseId', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'horseName'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  horseNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'horseName'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameLessThan(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameBetween(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> horseNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  horseNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'horseName', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> idEqualTo(
    Id value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'id', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> idBetween(
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> isFeaturedIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'isFeatured'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  isFeaturedIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'isFeatured'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> isFeaturedEqualTo(
    bool? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'isFeatured', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> latitudeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'latitude'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  latitudeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'latitude'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> latitudeEqualTo(
    double? value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'latitude',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> latitudeGreaterThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'latitude',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> latitudeLessThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'latitude',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> latitudeBetween(
    double? lower,
    double? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'latitude',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'location'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  locationIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'location'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'location',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'location',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'location',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> locationIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'location', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  locationIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'location', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> longitudeIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'longitude'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  longitudeIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'longitude'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> longitudeEqualTo(
    double? value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'longitude',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  longitudeGreaterThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'longitude',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> longitudeLessThan(
    double? value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'longitude',
          value: value,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> longitudeBetween(
    double? lower,
    double? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'longitude',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          epsilon: epsilon,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'notes'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'notes'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'notes',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'notes',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'notes',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> notesIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'notes', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'organizerEmail'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'organizerEmail'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'organizerEmail',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'organizerEmail',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'organizerEmail',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'organizerEmail',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'organizerEmail',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'organizerEmail',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'organizerEmail',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'organizerEmail',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'organizerEmail', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerEmailIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'organizerEmail', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'organizerName'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'organizerName'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'organizerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'organizerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'organizerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'organizerName',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'organizerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'organizerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'organizerName',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'organizerName',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'organizerName', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'organizerName', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'organizerPhone'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'organizerPhone'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneEqualTo(String? value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'organizerPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'organizerPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'organizerPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'organizerPhone',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneStartsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'organizerPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneEndsWith(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'organizerPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'organizerPhone',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'organizerPhone',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'organizerPhone', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  organizerPhoneIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'organizerPhone', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'ownerId'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'ownerId'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdGreaterThan(
    String? value, {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdLessThan(
    String? value, {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdBetween(
    String? lower,
    String? upper, {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdContains(
    String value, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> ownerIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  ownerIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'ownerId', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  photoUrlsElementIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'photoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  photoUrlsElementIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'photoUrls', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  photoUrlsLengthEqualTo(int length) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', length, true, length, true);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> photoUrlsIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, true, 0, true);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  photoUrlsIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, false, 999999, true);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  photoUrlsLengthLessThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', 0, true, length, include);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  photoUrlsLengthGreaterThan(int length, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.listLength(r'photoUrls', length, include, 999999, true);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  prizeAmountIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'prizeAmount'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  prizeAmountIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'prizeAmount'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> prizeAmountEqualTo(
    int? value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'prizeAmount', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  prizeAmountGreaterThan(int? value, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'prizeAmount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> prizeAmountLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'prizeAmount',
          value: value,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> prizeAmountBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'prizeAmount',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  registrationEnabledIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'registrationEnabled'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  registrationEnabledIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'registrationEnabled'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
  registrationEnabledEqualTo(bool? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'registrationEnabled', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNull(property: r'result'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        const FilterCondition.isNotNull(property: r'result'),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'result',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'result',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'result',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'result', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> resultIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'result', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(
          property: r'title',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(
          include: include,
          property: r'title',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.lessThan(
          include: include,
          property: r'title',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.between(
          property: r'title',
          lower: lower,
          includeLower: includeLower,
          upper: upper,
          includeUpper: includeUpper,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.startsWith(
          property: r'title',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.endsWith(
          property: r'title',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleContains(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.contains(
          property: r'title',
          value: value,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleMatches(
    String pattern, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.matches(
          property: r'title',
          wildcard: pattern,
          caseSensitive: caseSensitive,
        ),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'title', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> titleIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.greaterThan(property: r'title', value: ''),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> updatedAtEqualTo(
    DateTime value,
  ) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(
        FilterCondition.equalTo(property: r'updatedAt', value: value),
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition>
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> updatedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
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

  QueryBuilder<IsarEvent, IsarEvent, QAfterFilterCondition> updatedAtBetween(
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
}

extension IsarEventQueryObject
    on QueryBuilder<IsarEvent, IsarEvent, QFilterCondition> {}

extension IsarEventQueryLinks
    on QueryBuilder<IsarEvent, IsarEvent, QFilterCondition> {}

extension IsarEventQuerySortBy on QueryBuilder<IsarEvent, IsarEvent, QSortBy> {
  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByAddress() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByAddressDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByEventType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventType', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByEventTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventType', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByIsFeatured() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByIsFeaturedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByLatitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByLatitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByLocation() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByLocationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByLongitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByLongitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOrganizerEmail() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerEmail', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOrganizerEmailDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerEmail', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOrganizerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerName', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOrganizerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerName', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOrganizerPhone() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerPhone', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOrganizerPhoneDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerPhone', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByPrizeAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeAmount', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByPrizeAmountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeAmount', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByRegistrationEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationEnabled', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy>
  sortByRegistrationEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationEnabled', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByResult() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByResultDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByTitle() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByTitleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> sortByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarEventQuerySortThenBy
    on QueryBuilder<IsarEvent, IsarEvent, QSortThenBy> {
  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByAddress() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByAddressDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'address', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByCreatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'createdAt', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByDomainId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByDomainIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'domainId', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByEventType() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventType', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByEventTypeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'eventType', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByHorseId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByHorseIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseId', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByHorseName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByHorseNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'horseName', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByIsFeatured() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByIsFeaturedDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'isFeatured', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByLatitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByLatitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'latitude', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByLocation() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByLocationDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'location', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByLongitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByLongitudeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'longitude', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByNotes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByNotesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'notes', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOrganizerEmail() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerEmail', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOrganizerEmailDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerEmail', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOrganizerName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerName', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOrganizerNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerName', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOrganizerPhone() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerPhone', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOrganizerPhoneDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizerPhone', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOwnerId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByOwnerIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'ownerId', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByPrizeAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeAmount', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByPrizeAmountDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'prizeAmount', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByRegistrationEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationEnabled', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy>
  thenByRegistrationEnabledDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'registrationEnabled', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByResult() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByResultDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'result', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByTitle() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByTitleDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'title', Sort.desc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.asc);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QAfterSortBy> thenByUpdatedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'updatedAt', Sort.desc);
    });
  }
}

extension IsarEventQueryWhereDistinct
    on QueryBuilder<IsarEvent, IsarEvent, QDistinct> {
  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByAddress({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'address', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByCreatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'createdAt');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'date');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByDomainId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'domainId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByEventType() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'eventType');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByHorseId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByHorseName({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'horseName', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByIsFeatured() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'isFeatured');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByLatitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'latitude');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByLocation({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'location', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByLongitude() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'longitude');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByNotes({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'notes', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByOrganizerEmail({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'organizerEmail',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByOrganizerName({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'organizerName',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByOrganizerPhone({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(
        r'organizerPhone',
        caseSensitive: caseSensitive,
      );
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByOwnerId({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'ownerId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByPhotoUrls() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'photoUrls');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByPrizeAmount() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'prizeAmount');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct>
  distinctByRegistrationEnabled() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'registrationEnabled');
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByResult({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'result', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByTitle({
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'title', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<IsarEvent, IsarEvent, QDistinct> distinctByUpdatedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'updatedAt');
    });
  }
}

extension IsarEventQueryProperty
    on QueryBuilder<IsarEvent, IsarEvent, QQueryProperty> {
  QueryBuilder<IsarEvent, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> addressProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'address');
    });
  }

  QueryBuilder<IsarEvent, DateTime, QQueryOperations> createdAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'createdAt');
    });
  }

  QueryBuilder<IsarEvent, DateTime?, QQueryOperations> dateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'date');
    });
  }

  QueryBuilder<IsarEvent, String, QQueryOperations> domainIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'domainId');
    });
  }

  QueryBuilder<IsarEvent, EventType, QQueryOperations> eventTypeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'eventType');
    });
  }

  QueryBuilder<IsarEvent, String, QQueryOperations> horseIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseId');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> horseNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'horseName');
    });
  }

  QueryBuilder<IsarEvent, bool?, QQueryOperations> isFeaturedProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'isFeatured');
    });
  }

  QueryBuilder<IsarEvent, double?, QQueryOperations> latitudeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'latitude');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> locationProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'location');
    });
  }

  QueryBuilder<IsarEvent, double?, QQueryOperations> longitudeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'longitude');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> notesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'notes');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> organizerEmailProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizerEmail');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> organizerNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizerName');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> organizerPhoneProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizerPhone');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> ownerIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'ownerId');
    });
  }

  QueryBuilder<IsarEvent, List<String>, QQueryOperations> photoUrlsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'photoUrls');
    });
  }

  QueryBuilder<IsarEvent, int?, QQueryOperations> prizeAmountProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'prizeAmount');
    });
  }

  QueryBuilder<IsarEvent, bool?, QQueryOperations>
  registrationEnabledProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'registrationEnabled');
    });
  }

  QueryBuilder<IsarEvent, String?, QQueryOperations> resultProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'result');
    });
  }

  QueryBuilder<IsarEvent, String, QQueryOperations> titleProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'title');
    });
  }

  QueryBuilder<IsarEvent, DateTime, QQueryOperations> updatedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'updatedAt');
    });
  }
}
