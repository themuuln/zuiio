import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/features/updater/application/upgrade_provider.dart';
import 'package:tamga/src/features/updater/data/update_service.dart';
import 'package:tamga/src/features/updater/domain/app_version.dart';

// ── Mock ────────────────────────────────────────────────────────────────

class MockUpdateService extends Mock implements UpdateService {}

void main() {
  late MockUpdateService mockService;

  setUp(() {
    mockService = MockUpdateService();
  });

  group('updateServiceProvider', () {
    test('defaults to a real UpdateService instance', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final service = container.read(updateServiceProvider);
      expect(service, isA<UpdateService>());
    });
  });

  group('updateCheckInProgressProvider', () {
    test('defaults to false', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(updateCheckInProgressProvider), isFalse);
    });

    test('can be set to true', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(updateCheckInProgressProvider.notifier).state = true;
      expect(container.read(updateCheckInProgressProvider), isTrue);
    });
  });

  group('updateCheckResultProvider', () {
    test('defaults to null', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(updateCheckResultProvider), isNull);
    });
  });

  group('updateDownloadProgressProvider', () {
    test('defaults to 0', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(updateDownloadProgressProvider), 0.0);
    });
  });

  group('updateInstallInProgressProvider', () {
    test('defaults to false', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(updateInstallInProgressProvider), isFalse);
    });
  });

  group('updateErrorProvider', () {
    test('defaults to null', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(container.read(updateErrorProvider), isNull);
    });
  });

  group('UpgradeActionNotifier', () {
    const testVersion = AppVersion(
      versionCode: 2,
      versionName: '1.0.1',
      storagePath: 'apps/tamga.apk',
      sha256Hash: 'abc',
    );

    test('initial state is AsyncData(null)', () {
      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      expect(notifier.state, const AsyncData<void>(null));
    });

    test('check returns AppVersion when update is available', () async {
      when(
        () => mockService.checkForUpdate(),
      ).thenAnswer((_) async => UpdateAvailable(testVersion));

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      final result = await notifier.check();

      expect(result, equals(testVersion));
      verify(() => mockService.checkForUpdate()).called(1);
    });

    test('check returns null when already up to date', () async {
      when(
        () => mockService.checkForUpdate(),
      ).thenAnswer((_) async => const UpToDate());

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      final result = await notifier.check();

      expect(result, isNull);
    });

    test('check returns null and sets error on failure', () async {
      when(
        () => mockService.checkForUpdate(),
      ).thenAnswer((_) async => const UpdateCheckFailed('Network error'));

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      final result = await notifier.check();

      expect(result, isNull);
      expect(
        container.read(updateCheckResultProvider),
        isA<UpdateCheckFailed>(),
      );
    });

    test('check returns null and sets error on exception', () async {
      when(() => mockService.checkForUpdate()).thenThrow(Exception('Timeout'));

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      final result = await notifier.check();

      expect(result, isNull);
      verify(() => mockService.checkForUpdate()).called(1);
    });

    test('check sets inProgress to false after completion', () async {
      when(
        () => mockService.checkForUpdate(),
      ).thenAnswer((_) async => const UpToDate());

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      await notifier.check();

      expect(container.read(updateCheckInProgressProvider), isFalse);
    });

    test('downloadAndInstall returns null on success', () async {
      when(
        () => mockService.downloadAndInstall(testVersion),
      ).thenAnswer((_) async => null);

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      await notifier.downloadAndInstall(testVersion);

      verify(() => mockService.downloadAndInstall(testVersion)).called(1);
    });

    test('downloadAndInstall sets error on failure message', () async {
      when(
        () => mockService.downloadAndInstall(testVersion),
      ).thenAnswer((_) async => 'Download failed');

      final container = ProviderContainer(
        overrides: [updateServiceProvider.overrideWithValue(mockService)],
      );
      addTearDown(container.dispose);

      final notifier = container.read(upgradeActionProvider.notifier);
      await notifier.downloadAndInstall(testVersion);

      expect(container.read(updateErrorProvider), 'Download failed');
    });

    test(
      'downloadAndInstall sets inProgress to false after completion',
      () async {
        when(
          () => mockService.downloadAndInstall(testVersion),
        ).thenAnswer((_) async => null);

        final container = ProviderContainer(
          overrides: [updateServiceProvider.overrideWithValue(mockService)],
        );
        addTearDown(container.dispose);

        final notifier = container.read(upgradeActionProvider.notifier);
        await notifier.downloadAndInstall(testVersion);

        expect(container.read(updateInstallInProgressProvider), isFalse);
      },
    );
  });
}
