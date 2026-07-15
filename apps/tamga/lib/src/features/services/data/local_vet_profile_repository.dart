import 'package:isar/isar.dart';

import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/vet_profile.dart';
import 'isar_schemas/isar_service_provider.dart';
import 'isar_schemas/isar_vet_profile.dart';
import 'services_repository.dart';

/// Isar дээр суурилсан локал мал эмнэлгийн профайлын репозитори.
class LocalVetProfileRepository implements VetProfileRepository {
  LocalVetProfileRepository({required IsarStorage storage})
    : _storage = storage;

  final IsarStorage _storage;

  @override
  Future<Result<List<VetProfile>>> fetchAll() async {
    return Result.tryFuture(() async {
      final stored = await _storage.vetProfiles.where().findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<VetProfile>>> fetchByAimag(String aimag) async {
    return Result.tryFuture(() async {
      final providers = await _storage.serviceProviders
          .filter()
          .locationAimagEqualTo(aimag)
          .findAll();
      final providerIds = providers.map((p) => p.domainId).toSet();

      final stored = await _storage.vetProfiles.where().findAll();
      return stored
          .where((v) => providerIds.contains(v.providerId))
          .map((e) => e.toDomain())
          .toList();
    });
  }

  @override
  Future<Result<VetProfile?>> fetchById(String id) async {
    return Result.tryFuture(() async {
      final stored = await _storage.vetProfiles
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      return stored?.toDomain();
    });
  }
}
