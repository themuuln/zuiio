import 'package:isar/isar.dart';

import '../../domain/vet_profile.dart';

part 'isar_vet_profile.g.dart';

@collection
class IsarVetProfile {
  IsarVetProfile();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String domainId;

  @Index()
  late String providerId;

  late List<String> specialization;
  String? licenseNumber;
  String? education;
  int? experienceYears;
  int? consultationFee;
  int? travelSurcharge;
  late List<String> availableDays;

  factory IsarVetProfile.fromDomain(VetProfile profile) {
    return IsarVetProfile()
      ..domainId = profile.id
      ..providerId = profile.providerId
      ..specialization = List<String>.from(profile.specialization)
      ..licenseNumber = profile.licenseNumber
      ..education = profile.education
      ..experienceYears = profile.experienceYears
      ..consultationFee = profile.consultationFee
      ..travelSurcharge = profile.travelSurcharge
      ..availableDays = List<String>.from(profile.availableDays);
  }

  VetProfile toDomain() {
    return VetProfile(
      id: domainId,
      providerId: providerId,
      specialization: List<String>.from(specialization),
      licenseNumber: licenseNumber,
      education: education,
      experienceYears: experienceYears,
      consultationFee: consultationFee,
      travelSurcharge: travelSurcharge,
      availableDays: List<String>.from(availableDays),
    );
  }
}
