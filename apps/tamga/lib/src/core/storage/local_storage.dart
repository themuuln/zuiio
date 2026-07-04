/// Local storage abstraction.
///
/// SharedPreferences-based implementation одоо байгаа.
/// Ирээдүйд Hive/Isar шилжихэд энэ interface-ийг ашиглана.
abstract class LocalStorage {
  bool contains(String key);
  List<Map<String, dynamic>> readList(String key);
  Map<String, dynamic>? readObject(String key);
  Future<void> writeList(String key, List<Map<String, dynamic>> value);
  Future<void> writeObject(String key, Map<String, dynamic> value);
  Future<void> remove(String key);
}
