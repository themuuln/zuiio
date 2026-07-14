import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/update_service.dart';
import '../domain/app_version.dart';

/// Provider for the update service singleton.
final updateServiceProvider = Provider<UpdateService>((ref) {
  return UpdateService();
});

/// Tracks whether an update check is currently in progress.
final updateCheckInProgressProvider = StateProvider<bool>((ref) => false);

/// The result of the latest update check.
final updateCheckResultProvider = StateProvider<UpdateCheckResult?>(
  (ref) => null,
);

/// Download progress — percentage 0–100.
final updateDownloadProgressProvider = StateProvider<double>((ref) => 0);

/// Whether a download/install is currently in progress.
final updateInstallInProgressProvider = StateProvider<bool>((ref) => false);

/// Error message from a failed download/install, if any.
final updateErrorProvider = StateProvider<String?>((ref) => null);

/// Action notifier that checks for and applies app updates.
final upgradeActionProvider =
    StateNotifierProvider<UpgradeActionNotifier, AsyncValue<void>>((ref) {
      return UpgradeActionNotifier(ref);
    });

class UpgradeActionNotifier extends StateNotifier<AsyncValue<void>> {
  UpgradeActionNotifier(this._ref) : super(const AsyncData(null));

  final Ref _ref;

  /// Check if a newer version exists. Returns the result or null on failure.
  Future<AppVersion?> check() async {
    _ref.read(updateCheckInProgressProvider.notifier).state = true;

    try {
      final service = _ref.read(updateServiceProvider);
      final result = await service.checkForUpdate();

      _ref.read(updateCheckResultProvider.notifier).state = result;

      return switch (result) {
        UpdateAvailable(:final version) => version,
        _ => null,
      };
    } catch (e) {
      _ref.read(updateCheckResultProvider.notifier).state = UpdateCheckFailed(
        '$e',
      );
      return null;
    } finally {
      _ref.read(updateCheckInProgressProvider.notifier).state = false;
    }
  }

  /// Download and install the given version.
  Future<void> downloadAndInstall(AppVersion version) async {
    _ref.read(updateInstallInProgressProvider.notifier).state = true;
    _ref.read(updateErrorProvider.notifier).state = null;

    try {
      final service = _ref.read(updateServiceProvider);
      final error = await service.downloadAndInstall(version);

      if (error != null) {
        _ref.read(updateErrorProvider.notifier).state = error;
        state = AsyncError(error, StackTrace.current);
      } else {
        state = const AsyncData(null);
      }
    } catch (e) {
      _ref.read(updateErrorProvider.notifier).state = '$e';
      state = AsyncError(e, StackTrace.current);
    } finally {
      _ref.read(updateInstallInProgressProvider.notifier).state = false;
    }
  }
}
