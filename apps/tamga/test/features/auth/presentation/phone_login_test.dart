import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tamga/src/features/auth/presentation/phone_login_screen.dart';

void main() {
  group('PhoneLoginScreen', () {
    testWidgets('renders phone input field', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: PhoneLoginScreen())),
      );

      // Should have a text input field
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('shows send OTP button', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: PhoneLoginScreen())),
      );

      expect(find.text('Код илгээх'), findsOneWidget);
      expect(find.byType(FilledButton), findsOneWidget);
    });

    testWidgets('validates empty phone number', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: PhoneLoginScreen())),
      );

      // Tap button without entering phone number
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      // Should show validation error (appears twice - title and error)
      expect(find.text('Утасны дугаараа оруулна уу'), findsWidgets);
    });

    testWidgets('validates 8-digit phone number', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: PhoneLoginScreen())),
      );

      // Enter invalid phone number (too short)
      await tester.enterText(find.byType(TextFormField), '12345');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      // Should show validation error
      expect(find.text('Утасны дугаар 8 оронтой байх ёстой'), findsOneWidget);
    });

    testWidgets('shows back to email login button', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: MaterialApp(home: PhoneLoginScreen())),
      );

      expect(find.text('Имэйлээр нэвтрэх'), findsOneWidget);
    });
  });
}
