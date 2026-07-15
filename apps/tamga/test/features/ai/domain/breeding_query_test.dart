import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/ai/domain/breeding_query.dart';

void main() {
  group('BreedingQuery', () {
    test('constructs with sireId and damId', () {
      final query = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      expect(query.sireId, 'sire-1');
      expect(query.damId, 'dam-1');
    });

    test('toJson serializes correctly', () {
      final query = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      final json = query.toJson();
      expect(json, {'sireId': 'sire-1', 'damId': 'dam-1'});
    });

    test('fromJson deserializes correctly', () {
      final json = {'sireId': 'sire-123', 'damId': 'dam-456'};
      final query = BreedingQuery.fromJson(json);
      expect(query.sireId, 'sire-123');
      expect(query.damId, 'dam-456');
    });

    test('equality works', () {
      final a = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      final b = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      final c = BreedingQuery(sireId: 'sire-2', damId: 'dam-1');
      expect(a, equals(b));
      expect(a, isNot(equals(c)));
    });

    test('hashCode is consistent', () {
      final a = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      final b = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      expect(a.hashCode, equals(b.hashCode));
    });

    test('toString contains fields', () {
      final query = BreedingQuery(sireId: 'sire-1', damId: 'dam-1');
      final str = query.toString();
      expect(str, contains('sire-1'));
      expect(str, contains('dam-1'));
    });
  });
}
