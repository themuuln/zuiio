import 'dart:async';
// ignore_for_file: avoid_print

import 'package:supabase_flutter/supabase_flutter.dart'
    show
        PostgresChangeEvent,
        PostgresChangeFilter,
        PostgresChangeFilterType,
        Supabase,
        SupabaseClient;

import '../../../core/error/result.dart';
import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../domain/market_conversation.dart';
import '../domain/market_message.dart';
import 'local_message_repository.dart';
import 'message_repository.dart';

/// Supabase Realtime-д суурилсан MessageRepository.
///
/// Supabase-д зурвас хадгалах ба Realtime channel-аар дамжуулан
/// шууд хүлээн авах боломжийг олгоно.
class SupabaseMessageRepository implements MessageRepository {
  SupabaseMessageRepository({
    required IsarStorage storage,
    required SyncQueue syncQueue,
  }) : _local = LocalMessageRepository(storage: storage, syncQueue: syncQueue);

  final LocalMessageRepository _local;
  final Map<String, StreamSubscription> _subscriptions = {};
  int _subscriptionCounter = 0;

  SupabaseClient get _client => Supabase.instance.client;

  @override
  Future<Result<List<MarketConversation>>> fetchConversations(
    String userId,
  ) async {
    return _local.fetchConversations(userId);
  }

  @override
  Future<Result<MarketConversation?>> fetchConversation(String id) async {
    return _local.fetchConversation(id);
  }

  @override
  Future<Result<MarketConversation?>> findConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  }) async {
    return _local.findConversation(
      listingId: listingId,
      reportId: reportId,
      buyerId: buyerId,
      sellerId: sellerId,
    );
  }

  @override
  Future<Result<MarketConversation>> createConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  }) async {
    final result = await _local.createConversation(
      listingId: listingId,
      reportId: reportId,
      buyerId: buyerId,
      sellerId: sellerId,
    );

    // Also create via Supabase
    result.when(
      onSuccess: (conversation) {
        _sendToSupabase('conversations', conversation.toJson());
      },
      onFailure: (_) {},
    );

    return result;
  }

  @override
  Future<Result<MarketConversation>> updateConversation(
    MarketConversation conversation,
  ) async {
    final result = await _local.updateConversation(conversation);
    result.when(
      onSuccess: (conv) {
        _sendToSupabase('conversations', conv.toJson());
      },
      onFailure: (_) {},
    );
    return result;
  }

  @override
  Future<Result<void>> markConversationRead(String conversationId) async {
    return _local.markConversationRead(conversationId);
  }

  @override
  Future<Result<int>> getUnreadCount(String userId) async {
    return _local.getUnreadCount(userId);
  }

  @override
  Future<Result<List<MarketMessage>>> fetchMessages(
    String conversationId,
  ) async {
    return _local.fetchMessages(conversationId);
  }

  @override
  Future<Result<MarketMessage>> sendMessage({
    required String conversationId,
    required String senderId,
    String? listingId,
    String? reportId,
    required String text,
  }) async {
    final result = await _local.sendMessage(
      conversationId: conversationId,
      senderId: senderId,
      listingId: listingId,
      reportId: reportId,
      text: text,
    );

    result.when(
      onSuccess: (message) {
        _sendToSupabase('messages', message.toJson());
      },
      onFailure: (_) {},
    );

    return result;
  }

  @override
  Stream<MarketMessage> messageStream(String conversationId) {
    final subId = _subscriptionCounter++;

    // Return a stream that listens to both local changes and Supabase Realtime
    final localStream = _local.messageStream(conversationId);

    // Set up Supabase Realtime subscription for new messages
    try {
      final supabaseChannel = _client.channel('messages:$conversationId');

      final controller = StreamController<MarketMessage>.broadcast();

      supabaseChannel.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'messages',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'conversation_id',
          value: conversationId,
        ),
        callback: (payload) {
          final data = payload.newRecord as Map<String, dynamic>?;
          if (data != null) {
            final message = MarketMessage.fromJson(data);
            controller.add(message);
          }
        },
      );

      supabaseChannel.subscribe();

      _subscriptions[subId.toString()] = localStream.listen(
        (message) => controller.add(message),
      );

      // Clean up on subscription cancel
      controller.onCancel = () {
        supabaseChannel.unsubscribe();
        _subscriptions.remove(subId.toString())?.cancel();
      };

      return controller.stream;
    } catch (e) {
      // If Supabase isn't configured, fall back to local stream
      return localStream;
    }
  }

  @override
  Future<Result<void>> blockUser(String userId, String blockedUserId) async {
    return _local.blockUser(userId, blockedUserId);
  }

  @override
  Future<Result<void>> reportUser({
    required String reporterId,
    required String reportedUserId,
    required String reason,
  }) async {
    return _local.reportUser(
      reporterId: reporterId,
      reportedUserId: reportedUserId,
      reason: reason,
    );
  }

  /// Өгөгдлийг Supabase руу илгээх.
  Future<void> _sendToSupabase(String table, Map<String, dynamic> data) async {
    try {
      await _client.from(table).upsert(data);
    } catch (e) {
      // Supabase алдааг үл тоомсорлох — local-д хадгалагдсан
      print('[SupabaseMessageRepository] Sync failed for $table: $e');
    }
  }
}
