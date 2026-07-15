import 'dart:async';

import '../../../core/error/result.dart';
import '../domain/market_conversation.dart';
import '../domain/market_message.dart';

/// Мессежийн repository — Messaging системийн гол обьект.
///
/// Зурвас болон conversation-уудын CRUD үйлдлүүдийг тодорхойлно.
abstract class MessageRepository {
  // ============================================================
  // Conversations
  // ============================================================

  /// Хэрэглэгчийн бүх active conversation-уудыг авах.
  Future<Result<List<MarketConversation>>> fetchConversations(String userId);

  /// Нэг conversation-ийг ID-аар авах.
  Future<Result<MarketConversation?>> fetchConversation(String id);

  /// Тухайн зарын эсвэл хаяж морины мэдээний хэрэглэгчийн conversation-ийг олох (байгаа бол).
  Future<Result<MarketConversation?>> findConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  });

  /// Шинэ conversation үүсгэх (зар эсвэл хаяж морины мэдээнд зориулсан).
  Future<Result<MarketConversation>> createConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  });

  /// Conversation-ийг шинэчлэх (сүүлийн зурвас, уншаагүй тоо).
  Future<Result<MarketConversation>> updateConversation(
    MarketConversation conversation,
  );

  /// Уншаагүй зурвасуудыг unread болгох.
  Future<Result<void>> markConversationRead(String conversationId);

  /// Хэрэглэгчийн нийт уншаагүй зурвасын тоог авах.
  Future<Result<int>> getUnreadCount(String userId);

  // ============================================================
  // Messages
  // ============================================================

  /// Тухайн conversation-ийн бүх зурвасуудыг авах.
  Future<Result<List<MarketMessage>>> fetchMessages(String conversationId);

  /// Шинэ зурвас илгээх.
  Future<Result<MarketMessage>> sendMessage({
    required String conversationId,
    required String senderId,
    String? listingId,
    String? reportId,
    required String text,
  });

  /// Supabase Realtime-ээр зурвас сонсох stream.
  Stream<MarketMessage> messageStream(String conversationId);

  // ============================================================
  // Block / Report
  // ============================================================

  /// Хэрэглэгчийг блоклох.
  Future<Result<void>> blockUser(String userId, String blockedUserId);

  /// Хэрэглэгчийг мэдэгдэх.
  Future<Result<void>> reportUser({
    required String reporterId,
    required String reportedUserId,
    required String reason,
  });
}
