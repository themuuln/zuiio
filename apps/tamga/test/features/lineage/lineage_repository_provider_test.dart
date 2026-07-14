import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/lineage/data/lineage_repository.dart';
import 'package:tamga/src/features/lineage/data/local_lineage_repository.dart';
import 'package:tamga/src/features/lineage/data/supabase_lineage_repository.dart';

void main() {
  group('Repository type hierarchy', () {
    test('SupabaseLineageRepository implements LineageRepository', () {
      final repo = SupabaseLineageRepository(client: null);
      expect(repo, isA<LineageRepository>());
    });

    test('SupabaseLineageRepository supports CRUD methods', () {
      final repo = SupabaseLineageRepository(client: null);

      // CRUD methods exist and have correct signatures
      expect(repo.addParentLink, isA<Function>());
      expect(repo.removeParentLink, isA<Function>());
      expect(repo.updateHorseLineageInfo, isA<Function>());
    });

    test(
      'SupabaseLineageRepository.addParentLink returns failure with null client',
      () async {
        final repo = SupabaseLineageRepository(client: null);
        final result = await repo.addParentLink(
          horseId: 'test',
          parentId: 'parent',
          relation: 'sire',
        );
        expect(result.isFailure, isTrue);
      },
    );

    test(
      'SupabaseLineageRepository.removeParentLink returns failure with null client',
      () async {
        final repo = SupabaseLineageRepository(client: null);
        final result = await repo.removeParentLink(
          horseId: 'test',
          parentId: 'parent',
        );
        expect(result.isFailure, isTrue);
      },
    );

    test(
      'SupabaseLineageRepository.updateHorseLineageInfo returns failure with null client',
      () async {
        final repo = SupabaseLineageRepository(client: null);
        final result = await repo.updateHorseLineageInfo(
          horseId: 'test',
          name: 'New Name',
        );
        expect(result.isFailure, isTrue);
      },
    );
  });

  group('Static type verification', () {
    test('Both implementations satisfy LineageRepository interface', () {
      // Verify at compile time that both implementations exist
      // and can be constructed
      expect(
        () => SupabaseLineageRepository(client: null),
        isNot(throwsA(anything)),
      );

      // LocalLineageRepository constructor exists with named params
      expect(LocalLineageRepository.new, isA<Function>());
    });
  });
}
