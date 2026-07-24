/// Sync хийх үед илэрсэн зөрчилдөөнийг төлөөлөх модель.
///
/// Local болон remote хувилбаруудыг хадгалж,
/// хэрэглэгч аль хувилбарыг хадгалахаа шийдэх боломжтой.
class SyncConflict {
  const SyncConflict({
    required this.entityType,
    required this.entityId,
    required this.localData,
    required this.remoteData,
  });

  /// Entity-ийн төрөл (жишээ нь: 'horse', 'event', 'market').
  final String entityType;

  /// Entity-ийн ID.
  final String entityId;

  /// Local (оффлайн) хувилбар.
  final Map<String, dynamic> localData;

  /// Remote (Supabase) хувилбар.
  final Map<String, dynamic> remoteData;

  /// Зөрчилдөөний түлхүүр — entityType болон entityId-ээс бүрдэнэ.
  String get conflictKey => '$entityType:$entityId';

  /// Local хувилбарын `updatedAt` талбар.
  DateTime? get localUpdatedAt => _parseTimestamp(localData);

  /// Remote хувилбарын `updatedAt` талбар.
  DateTime? get remoteUpdatedAt => _parseTimestamp(remoteData);

  /// Local болон remote хувилбаруудын ялгаатай талбаруудын жагсаалт.
  ///
  /// Буцаах утга: `(fieldName, localValue, remoteValue)` гурвал.
  List<(String, dynamic, dynamic)> get diffFields {
    final allKeys = <String>{...localData.keys, ...remoteData.keys};
    final diffs = <(String, dynamic, dynamic)>[];

    for (final key in allKeys) {
      if (key == 'id' || key == 'entityType' || key == 'entityId') continue;
      final localVal = localData[key];
      final remoteVal = remoteData[key];
      if (!_valuesEqual(localVal, remoteVal)) {
        diffs.add((key, localVal, remoteVal));
      }
    }

    return diffs;
  }

  /// Хоёр утгыг харьцуулах.
  bool _valuesEqual(dynamic a, dynamic b) {
    if (a is Map && b is Map) {
      return _mapsEqual(a, b);
    }
    if (a is List && b is List) {
      return _listsEqual(a, b);
    }
    return a == b;
  }

  bool _mapsEqual(Map a, Map b) {
    if (a.length != b.length) return false;
    for (final key in a.keys) {
      if (!_valuesEqual(a[key], b[key])) return false;
    }
    return true;
  }

  bool _listsEqual(List a, List b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (!_valuesEqual(a[i], b[i])) return false;
    }
    return true;
  }

  /// Data map-аас timestamp утгыг задлах.
  DateTime? _parseTimestamp(Map<String, dynamic> data) {
    final raw = data['updatedAt'] ?? data['updated_at'];
    if (raw is String) return DateTime.tryParse(raw);
    if (raw is DateTime) return raw;
    return null;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SyncConflict &&
          conflictKey == other.conflictKey &&
          _mapsEqual(localData, other.localData) &&
          _mapsEqual(remoteData, other.remoteData);

  @override
  int get hashCode => Object.hash(conflictKey, Object.hashAll(localData.entries), Object.hashAll(remoteData.entries));
}
