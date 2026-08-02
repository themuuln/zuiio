import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/core/storage/isar_database.dart';
import 'package:tamga/src/core/sync/sync_queue.dart';
import 'package:tamga/src/features/market/data/message_repository.dart';
import 'package:tamga/src/features/market/data/supabase_message_repository.dart';
import 'package:tamga/src/features/market/domain/market_conversation.dart';
import 'package:tamga/src/features/market/domain/market_message.dart';
import 'package:tamga/src/features/shared/data/isar_storage.dart';

import '../../../helpers/test_helpers.dart';

void main() {
  group('SupabaseMessageRepository', () {
    late SyncQueue syncQueue;
    late SupabaseMessageRepository repository;

    setUp(() async {
      await setupTestEnvironment();
      await IsarDatabase.initialize();
      syncQueue = SyncQueue();
      repository = SupabaseMessageRepository(
        storage: IsarStorage.instance,
        syncQueue: syncQueue,
      );
    });

    tearDown(() async {
      await IsarDatabase.close();
    });

    test('implements MessageRepository', () {
      expect(repository, isA<MessageRepository>());
    });

    group('conversations', () {
      test(
        'createConversation persists and is returned by fetchConversations',
        () async {
          final result = await repository.createConversation(
            listingId: 'm-1',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
          );

          expect(result.isSuccess, isTrue);
          final conversation = result.value;
          expect(conversation.listingId, 'm-1');
          expect(conversation.buyerId, 'buyer-1');
          expect(conversation.sellerId, 'seller-1');
          expect(conversation.unreadCount, 0);

          final fetched = await repository.fetchConversations('buyer-1');
          expect(fetched.isSuccess, isTrue);
          expect(fetched.value, hasLength(1));
          expect(fetched.value.first.id, conversation.id);
        },
      );

      test(
        'createConversation succeeds locally even when Supabase is unavailable',
        () async {
          // Supabase.instance is not initialized in tests; the fire-and-forget
          // Supabase sync must fail silently without breaking the local result.
          final result = await repository.createConversation(
            listingId: 'm-1',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
          );

          expect(result.isSuccess, isTrue);
        },
      );

      test('createConversation enqueues a sync create action', () async {
        syncQueue.clear();
        await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'market_conversation');
        expect(item.action, SyncAction.create);
      });

      test('findConversation finds by listing, buyer and seller', () async {
        await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        final result = await repository.findConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        expect(result.isSuccess, isTrue);
        expect(result.value, isNotNull);
        expect(result.value!.listingId, 'm-1');
      });

      test(
        'findConversation returns null when no conversation matches',
        () async {
          final result = await repository.findConversation(
            listingId: 'missing',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
          );

          expect(result.isSuccess, isTrue);
          expect(result.value, isNull);
        },
      );

      test('fetchConversation returns the conversation by id', () async {
        final created = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        final result = await repository.fetchConversation(created.value.id);

        expect(result.isSuccess, isTrue);
        expect(result.value!.id, created.value.id);
      });

      test(
        'fetchConversation returns null for a missing conversation',
        () async {
          final result = await repository.fetchConversation('missing');

          expect(result.isSuccess, isTrue);
          expect(result.value, isNull);
        },
      );

      test('updateConversation updates conversation fields', () async {
        final created = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        final updated = await repository.updateConversation(
          created.value.copyWith(lastMessage: 'Сайн уу?', unreadCount: 1),
        );

        expect(updated.isSuccess, isTrue);
        expect(updated.value.lastMessage, 'Сайн уу?');
        expect(updated.value.unreadCount, 1);

        final fetched = await repository.fetchConversation(created.value.id);
        expect(fetched.value!.lastMessage, 'Сайн уу?');
      });

      test(
        'updateConversation fails when the conversation is missing',
        () async {
          final result = await repository.updateConversation(
            MarketConversation(
              id: 'missing-conv',
              buyerId: 'buyer-1',
              sellerId: 'seller-1',
            ),
          );

          expect(result.isFailure, isTrue);
          expect(result.error.code, 'CONVERSATION_NOT_FOUND');
          expect(result.error.message, contains('missing-conv'));
        },
      );

      test('markConversationRead resets the unread count', () async {
        final created = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );
        await repository.updateConversation(
          created.value.copyWith(unreadCount: 3),
        );

        final result = await repository.markConversationRead(created.value.id);

        expect(result.isSuccess, isTrue);
        final fetched = await repository.fetchConversation(created.value.id);
        expect(fetched.value!.unreadCount, 0);
      });

      test('getUnreadCount sums unread counts across conversations', () async {
        final first = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );
        await repository.createConversation(
          listingId: 'm-2',
          buyerId: 'buyer-1',
          sellerId: 'seller-2',
        );
        await repository.updateConversation(
          first.value.copyWith(unreadCount: 2),
        );

        final result = await repository.getUnreadCount('buyer-1');

        expect(result.isSuccess, isTrue);
        expect(result.value, 2);
      });
    });

    group('messages', () {
      test('sendMessage persists and updates the conversation', () async {
        final conv = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        final result = await repository.sendMessage(
          conversationId: conv.value.id,
          senderId: 'buyer-1',
          text: 'Сайн уу?',
        );

        expect(result.isSuccess, isTrue);
        final message = result.value;
        expect(message.conversationId, conv.value.id);
        expect(message.senderId, 'buyer-1');
        expect(message.text, 'Сайн уу?');
        expect(message.read, isFalse);

        final messages = await repository.fetchMessages(conv.value.id);
        expect(messages.isSuccess, isTrue);
        expect(messages.value, hasLength(1));
        expect(messages.value.first.text, 'Сайн уу?');

        final updated = await repository.fetchConversation(conv.value.id);
        expect(updated.value!.lastMessage, 'Сайн уу?');
      });

      test(
        'sendMessage from the other party increments the unread count',
        () async {
          final conv = await repository.createConversation(
            listingId: 'm-1',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
          );

          await repository.sendMessage(
            conversationId: conv.value.id,
            senderId: 'seller-1',
            text: 'Сайн байна уу?',
          );

          final updated = await repository.fetchConversation(conv.value.id);
          expect(updated.value!.unreadCount, 1);
        },
      );

      test('sendMessage enqueues a sync create action', () async {
        final conv = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );
        syncQueue.clear();

        await repository.sendMessage(
          conversationId: conv.value.id,
          senderId: 'buyer-1',
          text: 'Тест',
        );

        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'market_message');
        expect(item.action, SyncAction.create);
      });

      test(
        'fetchMessages returns an empty list for a fresh conversation',
        () async {
          final conv = await repository.createConversation(
            listingId: 'm-1',
            buyerId: 'buyer-1',
            sellerId: 'seller-1',
          );

          final result = await repository.fetchMessages(conv.value.id);

          expect(result.isSuccess, isTrue);
          expect(result.value, isEmpty);
        },
      );

      test('messageStream emits messages when Supabase is unavailable '
          '(local fallback)', () async {
        final conv = await repository.createConversation(
          listingId: 'm-1',
          buyerId: 'buyer-1',
          sellerId: 'seller-1',
        );

        final events = <MarketMessage>[];
        final sub = repository.messageStream(conv.value.id).listen(events.add);

        await repository.sendMessage(
          conversationId: conv.value.id,
          senderId: 'buyer-1',
          text: 'Шинэ зурвас',
        );

        // Wait for the Isar watch stream to deliver the change.
        final deadline = DateTime.now().add(const Duration(seconds: 3));
        while (events.isEmpty && DateTime.now().isBefore(deadline)) {
          await Future<void>.delayed(const Duration(milliseconds: 50));
        }
        await sub.cancel();

        expect(events.map((m) => m.text), contains('Шинэ зурвас'));
      });
    });

    group('block / report', () {
      test('blockUser enqueues a block sync item', () async {
        syncQueue.clear();
        final result = await repository.blockUser('user-1', 'blocked-1');

        expect(result.isSuccess, isTrue);
        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'block');
        expect(item.action, SyncAction.create);
        expect(item.entityId, 'user-1_blocked-1');
      });

      test('reportUser enqueues a user_report sync item', () async {
        syncQueue.clear();
        final result = await repository.reportUser(
          reporterId: 'user-1',
          reportedUserId: 'user-2',
          reason: 'Хуурамч зар',
        );

        expect(result.isSuccess, isTrue);
        expect(syncQueue.pendingCount, 1);
        final item = syncQueue.peek()!;
        expect(item.entityType, 'user_report');
        expect(item.action, SyncAction.create);
        expect(item.data['reason'], 'Хуурамч зар');
      });
    });
  });
}
