import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tamga/src/features/auth/presentation/otp_verify_screen.dart';

void main() {
  group('OtpVerifyScreen', () {
    testWidgets('renders 6 OTP input fields', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: OtpVerifyScreen(phone: '+97699123456')),
        ),
      );

      // Should have 6 text fields for OTP
      expect(find.byType(TextFormField), findsNWidgets(6));
    });

    testWidgets('shows verify button', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: OtpVerifyScreen(phone: '+97699123456')),
        ),
      );

      expect(find.text('Баталгаажуулах'), findsOneWidget);
    });

    testWidgets('shows resend countdown', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: OtpVerifyScreen(phone: '+97699123456')),
        ),
      );

      // Should show countdown
      expect(find.textContaining('Дахин илгээх'), findsOneWidget);
    });

    testWidgets('shows change number button', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: OtpVerifyScreen(phone: '+97699123456')),
        ),
      );

      expect(find.text('Дугаар солих'), findsOneWidget);
    });

    testWidgets('OTP fields accept single digit input', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: OtpVerifyScreen(phone: '+97699123456')),
        ),
      );

      // Enter a single digit in first field
      final fields = find.byType(TextFormField);
      await tester.enterText(fields.first, '5');
      await tester.pumpAndSettle();

      expect(find.text('5'), findsOneWidget);
    });
  });
}
