import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tamga/src/app/theme/app_theme.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/core/sync/connection_status.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/market/application/message_providers.dart';
import 'package:tamga/src/features/market/data/message_repository.dart';
import 'package:tamga/src/features/market/domain/market_conversation.dart';
import 'package:tamga/src/features/market/domain/market_message.dart';
import 'package:tamga/src/features/market/presentation/conversation_screen.dart';
import 'package:tamga/src/features/shared/application/sync_providers.dart';
import 'package:tamga/src/features/shared/data/isar_sync_storage.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockMessageRepository extends Mock implements MessageRepository {}

class MockConnectionMonitor extends Mock implements ConnectionMonitor {}

class MockIsarSyncStorage extends Mock implements IsarSyncStorage {}

// ── Test data ───────────────────────────────────────────────────────────

final testConversation = MarketConversation(
  id: 'test-conv-1',
  listingId: 'test-listing-1',
  buyerId: 'local-buyer',
  sellerId: 'test-seller-1',
  lastMessage: '',
  lastMessageAt: null,
  unreadCount: 0,
);

void _registerFallbackValues() {
  registerFallbackValue(SyncQueue());
  registerFallbackValue(
    SyncQueueItem(
      entityType: 'market_message',
      entityId: 'fallback',
      action: SyncAction.create,
      data: {},
      timestamp: DateTime(2026),
    ),
  );
  registerFallbackValue(
    MarketMessage(
      id: 'fallback',
      conversationId: 'fallback',
      senderId: 'fallback',
      text: 'fallback',
      timestamp: DateTime(2026),
    ),
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

Widget buildConversationTestApp({
  required ConnectionMonitor connectionMonitor,
  required MessageRepository messageRepository,
  required IsarSyncStorage syncStorage,
}) {
  final overrides = <Override>[
    connectionMonitorProvider.overrideWith((ref) => connectionMonitor),
    isarSyncStorageProvider.overrideWith((ref) => syncStorage),
    messageRepositoryProvider.overrideWith((ref) => messageRepository),
  ];

  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      theme: AppTheme.light(),
      home: ConversationScreen(
        conversationId: testConversation.id,
        conversation: testConversation,
        title: 'Test Conversation',
      ),
    ),
  );
}

StreamController<List<MarketMessage>> _createMessageController() {
  return StreamController<List<MarketMessage>>.broadcast();
}

// ── Tests ───────────────────────────────────────────────────────────────

void main() {
  setUpAll(() {
    _registerFallbackValues();
  });

  group('VAL-FOUND-024: ConversationScreen offline guard', () {
    late MockConnectionMonitor mockMonitor;
    late MockMessageRepository mockRepo;
    late MockIsarSyncStorage mockSyncStorage;
    late StreamController<List<MarketMessage>> messagesController;

    setUp(() {
      mockMonitor = MockConnectionMonitor();
      mockRepo = MockMessageRepository();
      mockSyncStorage = MockIsarSyncStorage();
      messagesController = _createMessageController();

      // Default stubs for required repo methods
      when(
        () => mockRepo.markConversationRead(any()),
      ).thenAnswer((_) async => const Result.ok(null));
      when(
        () => mockRepo.fetchMessages(any()),
      ).thenAnswer((_) async => const Result.ok([]));
      when(
        () => mockRepo.messageStream(any()),
      ).thenAnswer((_) => const Stream.empty());
      when(
        () => mockRepo.getUnreadCount(any()),
      ).thenAnswer((_) async => const Result.ok(0));
      when(
        () => mockRepo.fetchConversations(any()),
      ).thenAnswer((_) async => const Result.ok([]));

      // Default stubs for sync storage
      when(() => mockSyncStorage.enqueue(any())).thenAnswer((_) async {});
    });

    tearDown(() {
      messagesController.close();
    });

    testWidgets('blocks message send with snackbar when offline', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.offline);

      await tester.pumpWidget(
        buildConversationTestApp(
          connectionMonitor: mockMonitor,
          messageRepository: mockRepo,
          syncStorage: mockSyncStorage,
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Type a message
      await tester.enterText(find.byType(TextField), 'Hello offline world');
      await tester.pump();

      // Tap send button
      await tester.tap(find.byIcon(Icons.send_rounded));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Verify snackbar is shown
      expect(
        find.text('Офлайн — мессежийг синк хийхэд хадгална'),
        findsOneWidget,
      );

      // Verify sendMessage was NOT called
      verifyNever(
        () => mockRepo.sendMessage(
          conversationId: any(named: 'conversationId'),
          senderId: any(named: 'senderId'),
          listingId: any(named: 'listingId'),
          reportId: any(named: 'reportId'),
          text: any(named: 'text'),
        ),
      );

      // Verify enqueue WAS called
      verify(() => mockSyncStorage.enqueue(any())).called(1);
    });

    testWidgets('sends message normally when online', (
      WidgetTester tester,
    ) async {
      when(() => mockMonitor.current).thenReturn(ConnectionStatus.online);

      when(
        () => mockRepo.sendMessage(
          conversationId: any(named: 'conversationId'),
          senderId: any(named: 'senderId'),
          listingId: any(named: 'listingId'),
          reportId: any(named: 'reportId'),
          text: any(named: 'text'),
        ),
      ).thenAnswer(
        (_) async => Result.ok(
          MarketMessage(
            id: 'msg-1',
            conversationId: testConversation.id,
            senderId: 'local-buyer',
            text: 'Hello online world',
            timestamp: DateTime.now(),
          ),
        ),
      );

      await tester.pumpWidget(
        buildConversationTestApp(
          connectionMonitor: mockMonitor,
          messageRepository: mockRepo,
          syncStorage: mockSyncStorage,
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Type a message
      await tester.enterText(find.byType(TextField), 'Hello online world');
      await tester.pump();

      // Tap send button
      await tester.tap(find.byIcon(Icons.send_rounded));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Verify sendMessage WAS called
      verify(
        () => mockRepo.sendMessage(
          conversationId: any(named: 'conversationId'),
          senderId: any(named: 'senderId'),
          listingId: any(named: 'listingId'),
          reportId: any(named: 'reportId'),
          text: any(named: 'text'),
        ),
      ).called(1);

      // No offline snackbar
      expect(
        find.text('Офлайн — мессежийг синк хийхэд хадгална'),
        findsNothing,
      );
    });
  });
}
