import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_horse.dart';
import '../../shared/data/local_json_store.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../profile/data/supabase_profile_repository.dart';
import '../../profile/domain/profile_settings.dart';
import '../../horses/data/supabase_horses_repository.dart';
import '../../horses/domain/horse_record.dart' show HorseGender, Horse;
import '../data/onboarding_repository.dart';
import '../domain/onboarding_data.dart';

/// Onboarding төлөвийн notifier.
///
/// SharedPreferences-с ачаалагдаж, өөрчлөгдөх бүрт хадгалагдана.
class OnboardingNotifier extends StateNotifier<AsyncValue<OnboardingData>> {
  OnboardingNotifier() : super(const AsyncLoading()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);
      final data = repo.load();
      state = AsyncData(data);
    } catch (error, stack) {
      state = AsyncError(error, stack);
    }
  }

  /// Onboarding-ийг дуусгаж, бүх өгөгдлийг хадгалах.
  /// Хэрэв хэрэглэгч нэвтэрсэн бол cloud-д илгээнэ.
  Future<void> complete(OnboardingData data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);

      // Хэрэглэгч нэвтэрсэн эсэхийг шалгана.
      final client = getConfiguredSupabaseClient();
      final user = client?.auth.currentUser;
      final isAuthenticated =
          user != null && !user.isAnonymous && user.id.isNotEmpty;

      // Нэвтэрсэн бол pendingSync тэмдэгтийг тохируулахгүй,
      // нэвтрээгүй бол pendingSync = true болгоно.
      final finalData = data.copyWith(
        isCompleted: true,
        pendingSync: !isAuthenticated,
      );
      await repo.save(finalData);

      // Хэрэглэгч морь оруулсан бол Isar-д хадгалах.
      if (data.horseName != null && !data.horseEntrySkipped) {
        await _saveHorseRecord(data);
      }

      state = AsyncData(finalData);

      // Нэвтэрсэн бол cloud-д илгээнэ.
      if (isAuthenticated) {
        await _syncToCloud(data);
      }
    } catch (error, stack) {
      state = AsyncError(error, stack);
    }
  }

  /// Бүх onboarding-ийг алгасах (skip).
  Future<void> skipAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);
      await repo.save(const OnboardingData(isCompleted: true));
      state = const AsyncData(OnboardingData.completed);
    } catch (error, stack) {
      state = AsyncError(error, stack);
    }
  }

  /// Хэрэглэгчийн оруулсан морины мэдээллийг Isar-д хадгалах.
  Future<void> _saveHorseRecord(OnboardingData data) async {
    try {
      final storage = IsarStorage.instance;
      final gender = data.horseGender ?? HorseGender.gelding;
      final id = 'onboard-${DateTime.now().millisecondsSinceEpoch}';

      await storage.horses.put(
        IsarHorse()
          ..domainId = id
          ..name = data.horseName!
          ..relationLabel = 'Хэрэглэгч'
          ..coat = data.horseCoat ?? ''
          ..birthYear = data.horseBirthYear ?? DateTime.now().year
          ..awardCount = 0
          ..offspringCount = 0
          ..isOwnedByHousehold = true
          ..notes = ''
          ..gender = gender
          ..createdAt = DateTime.now()
          ..updatedAt = DateTime.now(),
      );
    } catch (_) {
      // Horse хадгалахад алдаа гарвал чимээгүй алгасах.
    }
  }

  /// Cloud-д profile болон horse-ийг илгээнэ.
  Future<void> _syncToCloud(OnboardingData data) async {
    try {
      // 1. Profile (role) cloud-д шинэчлэх.
      final profileRepo = SupabaseProfileRepository();
      final profile = ProfileSettings(
        autoSyncEnabled: true,
        role: data.userRole ?? 'casual',
        rank: data.rank ?? 'no_rank',
      );
      await profileRepo.update(profile);

      // 2. Хэрэв морь оруулсан бол cloud-д илгээнэ.
      if (data.horseName != null && !data.horseEntrySkipped) {
        final horsesRepo = SupabaseHorsesRepository();
        final horse = Horse(
          id: 'onboard-${DateTime.now().millisecondsSinceEpoch}',
          name: data.horseName!,
          relationLabel: 'Хэрэглэгч',
          coat: data.horseCoat ?? '',
          birthYear: data.horseBirthYear ?? DateTime.now().year,
          awardCount: 0,
          offspringCount: 0,
          isOwnedByHousehold: true,
          notes: '',
          gender: data.horseGender ?? HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await horsesRepo.saveHorse(horse);
      }
    } catch (_) {
      // Cloud sync алдааг чимээгүй алгасах — дараа sync-д нэмэгдэнэ.
    }
  }

  /// Post-onboarding profile details шинэчлэх.
  Future<void> updateProfileDetails({
    required String displayName,
    String? region,
    String? phone,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);
      final current = repo.load();
      final updated = current.copyWith(
        displayName: displayName.trim(),
        region: region,
        phone: phone?.trim().isEmpty == true ? null : phone?.trim(),
      );
      await repo.save(updated);
      state = AsyncData(updated);
    } catch (error, stack) {
      state = AsyncError(error, stack);
    }
  }

  /// Post-onboarding pedigree details шинэчлэх.
  Future<void> updatePedigree({String? sireName, String? damName}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);
      final current = repo.load();
      final updated = current.copyWith(
        sireName: sireName?.trim().isEmpty == true ? null : sireName?.trim(),
        damName: damName?.trim().isEmpty == true ? null : damName?.trim(),
      );
      await repo.save(updated);
      state = AsyncData(updated);
    } catch (error, stack) {
      state = AsyncError(error, stack);
    }
  }

  /// Pending sync тэмдэгтийг арилгах (нэвтэрсний дараа sync хийсний дараа).
  Future<void> clearPendingSync() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);
      final current = repo.load();
      if (current.pendingSync) {
        await repo.save(current.copyWith(pendingSync: false));
        state = AsyncData(current.copyWith(pendingSync: false));
      }
    } catch (_) {
      // Алдааг чимээгүй алгасах.
    }
  }
}

/// Onboarding төлөвийн provider.
final onboardingProvider =
    StateNotifierProvider<OnboardingNotifier, AsyncValue<OnboardingData>>(
      (ref) => OnboardingNotifier(),
    );

/// Onboarding дууссан эсэхийг шалгах provider.
final onboardingCompletedProvider = Provider<bool>((ref) {
  final onboarding = ref.watch(onboardingProvider);
  return onboarding.when(
    data: (data) => data.isCompleted,
    loading: () => false,
    error: (_, _) => true,
  );
});

/// Зочин хэрэглэгчийн onboarding өгөгдлийг cloud-д илгээх шаардлагатай эсэх.
final onboardingPendingSyncProvider = Provider<bool>((ref) {
  final onboarding = ref.watch(onboardingProvider);
  return onboarding.when(
    data: (data) => data.pendingSync,
    loading: () => false,
    error: (_, _) => false,
  );
});
