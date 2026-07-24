import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/sync/sync_queue.dart';
import '../../shared/data/isar_storage.dart';
import '../data/message_repository.dart';
import '../data/supabase_message_repository.dart';
import '../domain/market_conversation.dart';
import '../domain/market_message.dart';

// ── Repository Provider ──────────────────────────────────────────

/// Мессежийн repository provider.
///
/// Supabase тохируулсан бол SupabaseMessageRepository, үгүй бол
/// LocalMessageRepository-г ашиглана.
final messageRepositoryProvider = Provider<MessageRepository>((ref) {
  return SupabaseMessageRepository(
    storage: IsarStorage.instance,
    syncQueue: SyncQueue(),
  );
});

// ── Conversations ────────────────────────────────────────────────

/// Хэрэглэгчийн бүх conversation-ууд.
final conversationsProvider =
    FutureProvider.family<List<MarketConversation>, String>((
  ref,
  userId,
) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.fetchConversations(userId);
  return result.getOrThrow();
});

/// Нэг conversation-ийг авах.
final conversationProvider =
    FutureProvider.family<MarketConversation?, String>((
  ref,
  conversationId,
) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.fetchConversation(conversationId);
  return result.getOrThrow();
});

/// Тухайн зарын эсвэл хаяж морины мэдээний conversation-ийг олох.
final findConversationProvider =
    FutureProvider.family<MarketConversation?, _ConversationLookup>((
  ref,
  lookup,
) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.findConversation(
    listingId: lookup.listingId,
    reportId: lookup.reportId,
    buyerId: lookup.buyerId,
    sellerId: lookup.sellerId,
  );
  return result.getOrThrow();
});

/// Уншаагүй зурвасын тоо.
final unreadCountProvider = FutureProvider.family<int, String>((ref, userId) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.getUnreadCount(userId);
  return result.getOrThrow();
});

/// Нэвтрэх цонхны уншаагүй зурвасын тоо.
/// `local-buyer` ID ашиглан.
final inboxUnreadCountProvider = FutureProvider<int>((ref) async {
  final count = await ref.watch(unreadCountProvider('local-buyer').future);
  return count;
});

// ── Messages ─────────────────────────────────────────────────────

/// Тухайн conversation-ийн бүх зурвасууд.
final messagesProvider = FutureProvider.family<List<MarketMessage>, String>((
  ref,
  conversationId,
) async {
  final repository = ref.watch(messageRepositoryProvider);
  final result = await repository.fetchMessages(conversationId);
  return result.getOrThrow();
});

/// Мессежний stream — Realtime шинэчлэлтүүдийг хүлээн авах.
///
/// Эхний ачаалал дээр бүх зурвасыг татаж, дараа нь Isar-ийн өөрчлөлт
/// бүрт шинэчлэн харуулна.
final messageStreamProvider =
    StreamProvider.family<List<MarketMessage>, String>((
  ref,
  conversationId,
) async* {
  final repository = ref.watch(messageRepositoryProvider);

  // Эхний ачаалал
  final initialResult = await repository.fetchMessages(conversationId);
  yield initialResult.getOrThrow();

  // Isar stream-ээр дамжуулан шинэ зурвасуудыг сонсож, бүрт шинэчлэнэ
  await for (final _ in repository.messageStream(conversationId)) {
    final result = await repository.fetchMessages(conversationId);
    yield result.getOrThrow();
  }
});

// ── Notifiers ────────────────────────────────────────────────────

/// Шинэ conversation үүсгэх, эсвэл байгаа бол буцаах.
class ConversationNotifier extends StateNotifier<AsyncValue<MarketConversation?>> {
  ConversationNotifier(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  Future<MarketConversation> getOrCreateConversation({
    String? listingId,
    String? reportId,
    required String buyerId,
    required String sellerId,
  }) async {
    final repository = _ref.read(messageRepositoryProvider);

    // Эхлээд байгаа эсэхийг шалгах
    final existing = await repository.findConversation(
      listingId: listingId,
      reportId: reportId,
      buyerId: buyerId,
      sellerId: sellerId,
    );
    final existingConv = existing.getOrThrow();
    if (existingConv != null) {
      state = AsyncValue.data(existingConv);
      return existingConv;
    }

    // Байхгүй бол шинээр үүсгэх
    final result = await repository.createConversation(
      listingId: listingId,
      reportId: reportId,
      buyerId: buyerId,
      sellerId: sellerId,
    );
    final conv = result.getOrThrow();
    state = AsyncValue.data(conv);
    return conv;
  }
}

final conversationNotifierProvider =
    StateNotifierProvider<ConversationNotifier, AsyncValue<MarketConversation?>>((
  ref,
) {
  return ConversationNotifier(ref);
});

// ── Helper types ─────────────────────────────────────────────────

class _ConversationLookup {
  const _ConversationLookup({
    required this.buyerId,
    required this.sellerId,
  }) : reportId = null, listingId = null;

  final String? listingId;
  final String? reportId;
  final String buyerId;
  final String sellerId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _ConversationLookup &&
          listingId == other.listingId &&
          reportId == other.reportId &&
          buyerId == other.buyerId &&
          sellerId == other.sellerId;

  @override
  int get hashCode => Object.hash(listingId, reportId, buyerId, sellerId);
}
