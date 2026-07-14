import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/storage/local_storage.dart';

class LocalJsonStore implements LocalStorage {
  const LocalJsonStore(this._preferences);

  final SharedPreferences _preferences;

  @override
  bool contains(String key) => _preferences.containsKey(key);

  @override
  List<Map<String, dynamic>> readList(String key) {
    final raw = _preferences.getString(key);
    if (raw == null || raw.isEmpty) {
      return const [];
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return decoded
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  @override
  Map<String, dynamic>? readObject(String key) {
    final raw = _preferences.getString(key);
    if (raw == null || raw.isEmpty) return null;

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) return null;
      return Map<String, dynamic>.from(decoded);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> writeList(String key, List<Map<String, dynamic>> value) async {
    await _preferences.setString(key, jsonEncode(value));
  }

  @override
  Future<void> writeObject(String key, Map<String, dynamic> value) async {
    await _preferences.setString(key, jsonEncode(value));
  }

  @override
  Future<void> remove(String key) async {
    await _preferences.remove(key);
  }
}
