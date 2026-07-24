import 'dart:async';

import 'package:isar/isar.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../../shared/data/isar_schemas/isar_market_conversation.dart';
import '../../shared/data/isar_schemas/isar_market_message.dart';
import '../domain/market_conversation.dart';
import '../domain/market_message.dart';
import 'message_repository.dart';

/// Local-first MessageRepository implementation with Isar + SyncQueue.
class LocalMessageRepository implements MessageRepository {
  LocalMessageRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _storage = storage,
       _syncQueue = syncQueue;

  final IsarStorage _storage;
  final SyncQueue _syncQueue;

  // ============================================================
  // Conversations
  // ============================================================

  @override
  Future<Result<List<MarketConversation>>> fetchConversations(
    String userId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await _storage.marketConversations
          .filter()
          .anyOf([userId], (q, id) => q.buyerIdEqualTo(id).or().sellerIdEqualTo(id))
          .sortByLastMessageAtDesc()
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<MarketConversation?>> fetchConversation(String id) async {
    return Result.tryFuture(() async {
      final stored = await _storage.marketConversations
          .filter()
          .domainIdEqualTo(id)
          .findFirst();
      return stored?.toDomain();
    });
  }

  @override
  Future<Result<MarketConversation?>> findConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  }) async {
    return Result.tryFuture(() async {
      if (listingId != null) {
        final stored = await _storage.marketConversations
            .filter()
            .listingIdEqualTo(listingId)
            .buyerIdEqualTo(buyerId)
            .sellerIdEqualTo(sellerId)
            .findFirst();
        return stored?.toDomain();
      }
      if (reportId != null) {
        final stored = await _storage.marketConversations
            .filter()
            .reportIdEqualTo(reportId)
            .buyerIdEqualTo(buyerId)
            .sellerIdEqualTo(sellerId)
            .findFirst();
        return stored?.toDomain();
      }
      return null;
    });
  }

  @override
  Future<Result<MarketConversation>> createConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  }) async {
    return Result.tryFuture(() async {
      final now = DateTime.now();
      final conversation = MarketConversation(
        id: 'conv-${now.millisecondsSinceEpoch}',
        listingId: listingId,
        reportId: reportId,
        buyerId: buyerId,
        sellerId: sellerId,
        lastMessage: '',
        lastMessageAt: null,
        unreadCount: 0,
      );

      final isarConv = IsarMarketConversation.fromDomain(conversation);
      await _storage.marketConversations.isar.writeTxn(() async {
        await _storage.marketConversations.put(isarConv);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market_conversation',
          entityId: conversation.id,
          action: SyncAction.create,
          data: conversation.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return conversation;
    });
  }

  @override
  Future<Result<MarketConversation>> updateConversation(
    MarketConversation conversation,
  ) async {
    return Result.tryFuture(() async {
      final existing = await _storage.marketConversations
          .filter()
          .domainIdEqualTo(conversation.id)
          .findFirst();
      if (existing == null) {
        throw AppException(
          message: 'Conversation not found: ${conversation.id}',
          code: 'CONVERSATION_NOT_FOUND',
        );
      }

      final updated = IsarMarketConversation.fromDomain(conversation);
      updated.id = existing.id;
      await _storage.marketConversations.isar.writeTxn(() async {
        await _storage.marketConversations.put(updated);
      });

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market_conversation',
          entityId: conversation.id,
          action: SyncAction.update,
          data: conversation.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return conversation;
    });
  }

  @override
  Future<Result<void>> markConversationRead(String conversationId) async {
    return Result.tryFuture(() async {
      final existing = await _storage.marketConversations
          .filter()
          .domainIdEqualTo(conversationId)
          .findFirst();
      if (existing == null) return;

      final updated = IsarMarketConversation()
        ..id = existing.id
        ..domainId = existing.domainId
        ..listingId = existing.listingId
        ..buyerId = existing.buyerId
        ..sellerId = existing.sellerId
        ..lastMessage = existing.lastMessage
        ..lastMessageAt = existing.lastMessageAt
        ..unreadCount = 0;

      await _storage.marketConversations.isar.writeTxn(() async {
        await _storage.marketConversations.put(updated);
      });
    });
  }

  @override
  Future<Result<int>> getUnreadCount(String userId) async {
    return Result.tryFuture(() async {
      final conversations = await _storage.marketConversations
          .filter()
          .anyOf([userId], (q, id) => q.buyerIdEqualTo(id).or().sellerIdEqualTo(id))
          .findAll();
      return conversations.fold<int>(0, (sum, c) => sum + c.unreadCount);
    });
  }

  // ============================================================
  // Messages
  // ============================================================

  @override
  Future<Result<List<MarketMessage>>> fetchMessages(
    String conversationId,
  ) async {
    return Result.tryFuture(() async {
      final stored = await _storage.marketMessages
          .filter()
          .conversationIdEqualTo(conversationId)
          .sortByTimestamp()
          .findAll();
      return stored.map((e) => e.toDomain()).toList();
    });
  }

  @override
  Future<Result<MarketMessage>> sendMessage({
    required String conversationId,
    required String senderId,
    String? listingId,
    String? reportId,
    required String text,
  }) async {
    return Result.tryFuture(() async {
      final now = DateTime.now();
      final message = MarketMessage(
        id: 'msg-${now.millisecondsSinceEpoch}',
        conversationId: conversationId,
        senderId: senderId,
        listingId: listingId,
        reportId: reportId,
        text: text,
        timestamp: now,
        read: false,
      );

      final isarMsg = IsarMarketMessage.fromDomain(message);
      await _storage.marketMessages.isar.writeTxn(() async {
        await _storage.marketMessages.put(isarMsg);
      });

      // Update conversation with last message
      final existingConv = await _storage.marketConversations
          .filter()
          .domainIdEqualTo(conversationId)
          .findFirst();
      if (existingConv != null) {
        final isOtherUser = senderId != existingConv.buyerId;
        final updatedConv = IsarMarketConversation()
          ..id = existingConv.id
          ..domainId = existingConv.domainId
          ..listingId = existingConv.listingId
          ..reportId = existingConv.reportId
          ..buyerId = existingConv.buyerId
          ..sellerId = existingConv.sellerId
          ..lastMessage = text
          ..lastMessageAt = now
          ..unreadCount = existingConv.unreadCount + (isOtherUser ? 1 : 0);

        await _storage.marketConversations.isar.writeTxn(() async {
          await _storage.marketConversations.put(updatedConv);
        });
      }

      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'market_message',
          entityId: message.id,
          action: SyncAction.create,
          data: message.toJson(),
          timestamp: DateTime.now(),
        ),
      );

      return message;
    });
  }

  @override
  Stream<MarketMessage> messageStream(String conversationId) {
    return _storage.marketMessages
        .filter()
        .conversationIdEqualTo(conversationId)
        .watch()
        .asyncExpand((events) async* {
          // yield the latest messages when the collection changes
          final messages = await _storage.marketMessages
              .filter()
              .conversationIdEqualTo(conversationId)
              .sortByTimestamp()
              .findAll();
          for (final msg in messages) {
            yield msg.toDomain();
          }
        });
  }

  // ============================================================
  // Block / Report
  // ============================================================

  @override
  Future<Result<void>> blockUser(String userId, String blockedUserId) async {
    return Result.tryFuture(() async {
      // Block is stored in local preferences/settings
      // For now, log the action and enqueue sync
      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'block',
          entityId: '${userId}_$blockedUserId',
          action: SyncAction.create,
          data: {
            'userId': userId,
            'blockedUserId': blockedUserId,
            'timestamp': DateTime.now().toIso8601String(),
          },
          timestamp: DateTime.now(),
        ),
      );
    });
  }

  @override
  Future<Result<void>> reportUser({
    required String reporterId,
    required String reportedUserId,
    required String reason,
  }) async {
    return Result.tryFuture(() async {
      final now = DateTime.now();
      _syncQueue.enqueue(
        SyncQueueItem(
          entityType: 'user_report',
          entityId: 'report-${now.millisecondsSinceEpoch}',
          action: SyncAction.create,
          data: {
            'reporterId': reporterId,
            'reportedUserId': reportedUserId,
            'reason': reason,
            'timestamp': now.toIso8601String(),
          },
          timestamp: now,
        ),
      );
    });
  }
}
