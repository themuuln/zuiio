import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tamga/src/core/theme/design_tokens.dart';
import 'package:tamga/src/features/onboarding/application/onboarding_providers.dart';
import 'package:tamga/src/features/onboarding/domain/onboarding_data.dart';
import 'package:tamga/src/features/onboarding/presentation/onboarding_screen.dart';

/// Records what the screen asks the notifier to persist, mirroring the real
/// notifier's contract: `complete()` marks the data as completed.
/// Stand-in platform so NotificationPage's permission request is a no-op in
/// tests instead of throwing LateInitializationError on the unset static
/// `FlutterLocalNotificationsPlatform.instance`.
class _NoopNotificationsPlatform extends FlutterLocalNotificationsPlatform {}

class _RecordingNotifier extends OnboardingNotifier {
  _RecordingNotifier() : super() {
    state = const AsyncData(OnboardingData(isCompleted: false));
  }

  OnboardingData? completed;

  @override
  Future<void> complete(OnboardingData data) async {
    completed = data;
    state = AsyncData(data.copyWith(isCompleted: true));
  }
}

Future<_RecordingNotifier> _pumpOnboarding(
  WidgetTester tester, {
  VoidCallback? onCompleted,
}) async {
  SharedPreferences.setMockInitialValues({});
  // The wizard pages (notifications, sync) are taller than the default
  // 800x600 test viewport; give the screen room to lay out without overflow.
  tester.view.physicalSize = const Size(800, 1600);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  FlutterLocalNotificationsPlatform.instance = _NoopNotificationsPlatform();
  final notifier = _RecordingNotifier();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [onboardingProvider.overrideWith((ref) => notifier)],
      child: MaterialApp(
        theme: ThemeData(extensions: const [TamgaColors.light]),
        home: OnboardingScreen(onCompleted: onCompleted),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return notifier;
}

/// Walks Welcome → Role → Region → Rank → Horse (skipped) → Notifications.
Future<void> _navigateToNotificationPage(WidgetTester tester) async {
  // Welcome
  await tester.tap(find.text('Эхлэх'));
  await tester.pumpAndSettle();
  // Role
  await tester.tap(find.text('Морь сонирхогч'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Үргэлжлүүлэх'));
  await tester.pumpAndSettle();
  // Region
  await tester.tap(find.text('Улаанбаатар'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Үргэлжлүүлэх'));
  await tester.pumpAndSettle();
  // Rank — continue with default rank
  await tester.tap(find.text('Үргэлжлүүлэх'));
  await tester.pumpAndSettle();
  // Horse — skip
  await tester.tap(find.text('Алгасах — дараа оруулна'));
  await tester.pumpAndSettle();
}

void main() {
  group('OnboardingScreen notification → sync flow', () {
    testWidgets(
      'notification primary advances to sync setup and does NOT complete '
      'onboarding; sync primary completes with notifications enabled',
      (tester) async {
        final notifier = await _pumpOnboarding(tester);
        await _navigateToNotificationPage(tester);

        // On the notification page.
        expect(find.text('Мэдэгдэл'), findsOneWidget);

        // Tap the notification page's primary action — must advance, not finish.
        await tester.tap(find.text('Зөвшөөрөх'));
        await tester.pumpAndSettle();

        // Advanced to the sync-setup page; onboarding NOT completed yet.
        expect(find.text('Синк тохиргоо'), findsOneWidget);
        expect(notifier.completed, isNull);

        // Completing from the sync page records notificationsEnabled.
        await tester.tap(find.text('Эхлэх'));
        await tester.pumpAndSettle();

        expect(notifier.completed, isNotNull);
        expect(notifier.completed!.notificationsEnabled, isTrue);
        expect(notifier.state.value!.isCompleted, isTrue);
      },
    );

    testWidgets(
      'notification skip advances to sync setup; sync later completes '
      'onboarding with notifications disabled',
      (tester) async {
        final notifier = await _pumpOnboarding(tester);
        await _navigateToNotificationPage(tester);

        // Skip notifications — must advance, not finish.
        await tester.tap(find.text('Одоохондоо үгүй'));
        await tester.pumpAndSettle();

        expect(find.text('Синк тохиргоо'), findsOneWidget);
        expect(notifier.completed, isNull);

        // "Later" on the sync page completes onboarding without notifications.
        await tester.tap(find.text('Дараа тохируулъя'));
        await tester.pumpAndSettle();

        expect(notifier.completed, isNotNull);
        expect(notifier.completed!.notificationsEnabled, isFalse);
        expect(notifier.state.value!.isCompleted, isTrue);
      },
    );
  });

  group('OnboardingScreen completion navigation', () {
    testWidgets(
      'completion invokes the navigation seam and does not throw in a '
      'router-less harness',
      (tester) async {
        var navigated = false;
        final notifier = await _pumpOnboarding(
          tester,
          onCompleted: () => navigated = true,
        );
        await _navigateToNotificationPage(tester);

        // Skip notifications, then complete from the sync page.
        await tester.tap(find.text('Одоохондоо үгүй'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Дараа тохируулъя'));
        await tester.pumpAndSettle();

        expect(notifier.completed, isNotNull);
        expect(notifier.state.value!.isCompleted, isTrue);
        expect(navigated, isTrue);
      },
    );

    testWidgets(
      'completion navigates to the daily command center via GoRouter',
      (tester) async {
        // Mirror the production wiring from app_router.dart: the /onboarding
        // route hands the screen an onCompleted that goes to /home.
        final router = GoRouter(
          initialLocation: '/onboarding',
          routes: [
            GoRoute(
              path: '/onboarding',
              builder: (ctx, state) =>
                  OnboardingScreen(onCompleted: () => ctx.go('/home')),
            ),
            GoRoute(
              path: '/home',
              builder: (ctx, state) =>
                  const Scaffold(body: Center(child: Text('Home entry'))),
            ),
          ],
        );

        SharedPreferences.setMockInitialValues({});
        tester.view.physicalSize = const Size(800, 1600);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        FlutterLocalNotificationsPlatform.instance =
            _NoopNotificationsPlatform();
        final notifier = _RecordingNotifier();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [onboardingProvider.overrideWith((ref) => notifier)],
            child: MaterialApp.router(
              theme: ThemeData(extensions: const [TamgaColors.light]),
              routerConfig: router,
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('Эхлэх'), findsOneWidget);
        await _navigateToNotificationPage(tester);

        await tester.tap(find.text('Одоохондоо үгүй'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Дараа тохируулъя'));
        await tester.pumpAndSettle();

        expect(notifier.state.value!.isCompleted, isTrue);
        // The wizard is gone and the daily command center is showing.
        expect(find.text('Home entry'), findsOneWidget);
        expect(find.text('Синк тохиргоо'), findsNothing);
      },
    );
  });
}
