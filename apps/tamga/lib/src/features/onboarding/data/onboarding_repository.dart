import '../../../core/storage/local_storage.dart';
import '../domain/onboarding_data.dart';

/// Onboarding төлөвийг local storage-д хадгалах, унших repository.
class OnboardingRepository {
  const OnboardingRepository(this._store);

  static const _storageKey = 'onboarding.data';

  final LocalStorage _store;

  /// Onboarding өгөгдлийг унших. Хэрэв хадгалагдаагүй бол хоосон буцаана.
  OnboardingData load() {
    final raw = _store.readObject(_storageKey);
    if (raw == null) {
      return OnboardingData.empty;
    }
    return OnboardingData.fromMap(raw);
  }

  /// Onboarding өгөгдлийг хадгалах.
  Future<void> save(OnboardingData data) async {
    await _store.writeObject(_storageKey, data.toMap());
  }

  /// Onboarding-ийг дууссан гэж тэмдэглэх.
  Future<void> markCompleted() async {
    final current = load();
    await save(current.copyWith(isCompleted: true));
  }

  /// Onboarding өгөгдлийг устгах (reset).
  Future<void> reset() async {
    await _store.remove(_storageKey);
  }
}
