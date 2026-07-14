import 'package:isar/isar.dart';

import '../../domain/service_provider.dart';
import '../../domain/service_provider_type.dart';

part 'isar_service_provider.g.dart';

@collection
class IsarServiceProvider {
  IsarServiceProvider();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String userId;

  @enumerated
  late ServiceProviderType providerType;

  String? businessName;
  String? phone;
  String? locationAimag;
  String? locationSum;
  late bool isVerified;
  late double rating;

  factory IsarServiceProvider.fromDomain(ServiceProvider provider) {
    return IsarServiceProvider()
      ..domainId = provider.id
      ..userId = provider.userId
      ..providerType = provider.providerType
      ..businessName = provider.businessName
      ..phone = provider.phone
      ..locationAimag = provider.locationAimag
      ..locationSum = provider.locationSum
      ..isVerified = provider.isVerified
      ..rating = provider.rating;
  }

  ServiceProvider toDomain() {
    return ServiceProvider(
      id: domainId,
      userId: userId,
      providerType: providerType,
      businessName: businessName,
      phone: phone,
      locationAimag: locationAimag,
      locationSum: locationSum,
      isVerified: isVerified,
      rating: rating,
    );
  }
}
