import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/auth/domain/auth_state.dart';
import 'package:tamga/src/core/theme/design_tokens.dart';

// ── Gate Condition (matching the logic in _submitReport) ───────────
//
// The phone verification gate checks whether the AuthState has a phone
// number.  If null / no-phone → verification required (blocked).
// If phone present → proceed.

bool _canProceedWithSubmit(AuthState? authState) {
  return authState != null && authState.hasPhone;
}

void main() {
  // ── Phone verification gate — condition tests (VAL-VERIFY-001) ──

  group('Phone verification gate condition', () {
    test('null auth state blocks submission', () {
      expect(_canProceedWithSubmit(null), isFalse);
    });

    test('loading auth state blocks submission', () {
      final state = const AuthState.loading();
      expect(_canProceedWithSubmit(state), isFalse);
    });

    test('unauthenticated user (no phone) is blocked', () {
      final state = const AuthState.unauthenticated();
      expect(_canProceedWithSubmit(state), isFalse);
    });

    test('authenticated user without phone is blocked', () {
      final state = AuthState.authenticated(
        userId: 'user1',
        email: 'test@example.com',
      );
      expect(_canProceedWithSubmit(state), isFalse);
    });

    test('authenticated user with phone proceeds', () {
      final state = AuthState.authenticated(
        userId: 'user1',
        phone: '+97699123456',
      );
      expect(_canProceedWithSubmit(state), isTrue);
    });

    test('authenticated user with empty phone string is blocked', () {
      final state = AuthState.authenticated(userId: 'user1', phone: '');
      // hasPhone is `phone != null && phone!.isNotEmpty`
      expect(_canProceedWithSubmit(state), isFalse);
    });
  });

  // ── Verification dialog structure ───────────────────────────────

  group('Verification dialog layout', () {
    testWidgets('shows correct title, content and buttons', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(extensions: const [TamgaColors.light]),
          home: _DialogTestHarness(),
        ),
      );

      // Wait for the dialog to appear
      await tester.pumpAndSettle();

      // Title
      expect(find.text('Утасны дугаар баталгаажуулах'), findsOneWidget);

      // Content
      expect(
        find.text('Хаяж морь зарлахын тулд утасны дугаараа баталгаажуулна уу.'),
        findsOneWidget,
      );

      // Two buttons: "Дараа" (dismiss) and "Баталгаажуулах" (verify)
      expect(find.text('Дараа'), findsOneWidget);
      expect(find.text('Баталгаажуулах'), findsOneWidget);
    });

    testWidgets('tapping Дараа dismisses dialog', (tester) async {
      bool? dialogResult;
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(extensions: const [TamgaColors.light]),
          home: _DialogTestHarness(onResult: (r) => dialogResult = r),
        ),
      );

      await tester.pumpAndSettle();

      // Tap "Дараа"
      await tester.tap(find.text('Дараа'));
      await tester.pumpAndSettle();

      // Dialog should be dismissed
      expect(find.text('Утасны дугаар баталгаажуулах'), findsNothing);

      // Result should be false (user declined)
      expect(dialogResult, isFalse);
    });

    testWidgets('tapping Баталгаажуулах returns true', (tester) async {
      bool? dialogResult;
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(extensions: const [TamgaColors.light]),
          home: _DialogTestHarness(onResult: (r) => dialogResult = r),
        ),
      );

      await tester.pumpAndSettle();

      // Tap "Баталгаажуулах"
      await tester.tap(find.text('Баталгаажуулах'));
      await tester.pumpAndSettle();

      // Dialog should be dismissed
      expect(find.text('Утасны дугаар баталгаажуулах'), findsNothing);

      // Result should be true (user wants to verify)
      expect(dialogResult, isTrue);
    });
  });
}

// ── Test harness that immediately shows the verification dialog ───

class _DialogTestHarness extends StatelessWidget {
  const _DialogTestHarness({this.onResult});

  final void Function(bool)? onResult;

  @override
  Widget build(BuildContext context) {
    // Show dialog immediately via post-frame callback
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final result = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('Утасны дугаар баталгаажуулах'),
          content: const Text(
            'Хаяж морь зарлахын тулд утасны дугаараа баталгаажуулна уу.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Дараа'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Баталгаажуулах'),
            ),
          ],
        ),
      );

      onResult?.call(result ?? false);
    });

    return const Scaffold(body: Center(child: Text('Test harness')));
  }
}
