import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/sync/connection_status.dart';
import 'package:tamga/src/features/shared/presentation/offline_save_feedback.dart';

/// Helper to wrap a widget that can show overlay-based toasts.
class ToastTestHost extends StatelessWidget {
  const ToastTestHost({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ElevatedButton(
        onPressed: () {
          showOfflineAwareSaveFeedback(context, ConnectionStatus.offline);
        },
        child: const Text('Show Toast'),
      ),
    );
  }
}

void main() {
  testWidgets('shows offline message when ConnectionStatus is offline', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.light(), home: const ToastTestHost()),
    );

    // Tap the button to trigger offline save feedback
    await tester.tap(find.text('Show Toast'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    // The toast should show the offline-specific message
    expect(
      find.text('Хадгалагдлаа — Сүлжээнд холбогдсон үед синк хийгдэнэ'),
      findsOneWidget,
    );
    expect(find.byIcon(Icons.cloud_upload_outlined), findsOneWidget);
  });

  testWidgets('shows success message when ConnectionStatus is online', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () {
                showOfflineAwareSaveFeedback(context, ConnectionStatus.online);
              },
              child: const Text('Show Online Toast'),
            ),
          ),
        ),
      ),
    );

    // Tap the button to trigger online save feedback
    await tester.tap(find.text('Show Online Toast'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    // The toast should show the success message without offline suffix
    expect(find.text('Хадгалагдлаа'), findsOneWidget);
  });

  testWidgets('shows custom offline message when provided', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () {
                showOfflineAwareSaveFeedback(
                  context,
                  ConnectionStatus.offline,
                  onSavedMessage: 'Хадгалагдлаа',
                  offlineMessage: 'Сүлжээнд холбогдсон үед синк хийгдэнэ',
                );
              },
              child: const Text('Custom'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Custom'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    // The message should contain the default offline format
    expect(
      find.text('Хадгалагдлаа — Сүлжээнд холбогдсон үед синк хийгдэнэ'),
      findsOneWidget,
    );
  });
}
