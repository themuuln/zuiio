import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/data/isar_storage.dart';
import '../data/local_profile_settings_repository.dart';
import '../data/profile_settings_repository.dart';
import '../domain/profile_settings.dart';

final profileSettingsRepositoryProvider =
    FutureProvider<ProfileSettingsRepository>((ref) async {
      return LocalProfileSettingsRepository(IsarStorage.instance);
    });

final profileSettingsProvider = FutureProvider<ProfileSettings>((ref) async {
  final repository = await ref.watch(profileSettingsRepositoryProvider.future);
  return (await repository.fetchSettings()).getOrThrow();
});

final cloudSyncInProgressProvider = StateProvider<bool>((ref) => false);
