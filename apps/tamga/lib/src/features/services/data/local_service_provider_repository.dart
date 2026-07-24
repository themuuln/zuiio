import 'package:isar/isar.dart';

import '../../../core/error/result.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/service_provider.dart';
import '../domain/service_provider_type.dart';
import 'isar_schemas/isar_service_provider.dart';
import 'services_repository.dart';

/// Isar дээр суурилсан локал үйлчилгээ үзүүлэгчийн репозитори.
class LocalServiceProviderRepository implements ServiceProviderRepository {
  LocalServiceProviderRepository({required IsarStorage storage})
    : _storage = storage;

  final IsarStorage _storage;

  @override
  Future<Result<List<ServiceProvider>>> fetchAll() async {
    return Result.tryFuture(() async {
      final stored = await _storage.serviceProviders.where().findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<List<ServiceProvider>>> fetchByType(String providerType) async {
    final type = ServiceProviderType.values.byName(providerType);
    return Result.tryFuture(() async {
      final stored = await _storage.serviceProviders
          .filter()
          .providerTypeEqualTo(type)
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<ServiceProvider?>> fetchById(String id) async {
    return Result.tryFuture(() async {
      final stored = await _storage.serviceProviders
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      return stored?.toDomain();
    });
  }
}
