/// Төрөл бүрийн үйлчилгээ үзүүлэгчийн төрөл.
enum ServiceProviderType { photographer, vet }

extension ServiceProviderTypeLabel on ServiceProviderType {
  String get label => switch (this) {
    ServiceProviderType.photographer => 'Гэрэл зурагчин',
    ServiceProviderType.vet => 'Мал эмнэлэг',
  };
}
