import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/sync/sync_queue.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../shared/application/sync_providers.dart';
import '../application/market_providers.dart';
import '../application/message_providers.dart';
import '../domain/market_conversation.dart';
import '../domain/market_listing.dart';
import '../domain/market_message.dart';

/// Харилцааны дэлгэц (Chat).
///
/// Зурвасуудыг хөөсөн хэлбэрээр харуулж, доод хэсэгт зурвас
/// бичих талбар байрлана. Дээд хэсэгт зарын мэдээлэл бүхий карт.
///
/// [title]-ийг зааж өгвөл AppBar-ын гарчиг болно. Зааж өгөхгүй бол
/// холбоотой listing-ийн гарчиг хэрэглэгдэнэ.
class ConversationScreen extends ConsumerStatefulWidget {
  const ConversationScreen({
    required this.conversationId,
    this.conversation,
    this.title,
    super.key,
  });

  final String conversationId;
  final MarketConversation? conversation;
  final String? title;

  @override
  ConsumerState<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<ConversationScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  static const _localUserId = 'local-buyer';

  @override
  void initState() {
    super.initState();
    // Mark conversation as read when opening
    Future.microtask(() {
      ref
          .read(messageRepositoryProvider)
          .markConversationRead(widget.conversationId);
      ref.invalidate(unreadCountProvider(_localUserId));
      ref.invalidate(conversationsProvider(_localUserId));
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final conversation = widget.conversation;
    if (conversation == null) return;

    // ── Offline guard ───────────────────────────────────────────────
    final monitor = ref.read(connectionMonitorProvider);
    if (monitor.current == ConnectionStatus.offline) {
      // Offline-first: save the message for later sync and let the user know
      // it will be delivered once the connection is back.
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Офлайн — мессежийг синк хийхэд хадгална'),
          ),
        );
      }

      // Enqueue message in SyncQueue for later delivery
      final now = DateTime.now();
      final message = MarketMessage(
        id: 'msg-${now.millisecondsSinceEpoch}',
        conversationId: widget.conversationId,
        senderId: _localUserId,
        listingId: conversation.listingId,
        reportId: conversation.reportId,
        text: text,
        timestamp: now,
        read: false,
      );
      final syncStorage = ref.read(isarSyncStorageProvider);
      await syncStorage.enqueue(
        SyncQueueItem(
          entityType: 'market_message',
          entityId: message.id,
          action: SyncAction.create,
          data: message.toJson(),
          timestamp: now,
        ),
      );

      _messageController.clear();
      return;
    }
    // ── End offline guard ───────────────────────────────────────────

    _messageController.clear();

    final result = await ref
        .read(messageRepositoryProvider)
        .sendMessage(
          conversationId: widget.conversationId,
          senderId: _localUserId,
          listingId: conversation.listingId,
          reportId: conversation.reportId,
          text: text,
        );

    result.when(
      onSuccess: (_) {
        // Scroll to bottom after sending
        Future.delayed(const Duration(milliseconds: 100), () {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      },
      onFailure: (e) {
        TamgaToast.showError(context, 'Зурвас илгээхэд алдаа гарлаа');
        debugPrint('[ConversationScreen] sendMessage failed: $e');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final conversation = widget.conversation;
    final messagesAsync = ref.watch(
      messageStreamProvider(widget.conversationId),
    );

    // Determine title: use [widget.title] if provided, otherwise listing title
    final isReportConversation = conversation?.reportId != null;

    // Get listing info for market conversations
    final listing = !isReportConversation && conversation?.listingId != null
        ? ref
              .watch(marketListingsMapProvider)[conversation!.listingId!]
              ?.listing
        : null;

    final effectiveTitle = widget.title ?? listing?.title ?? 'Яриа';

    return Scaffold(
      appBar: AppBar(
        title: Text(effectiveTitle),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Нэмэлт үйлдэл',
            onSelected: (value) {
              switch (value) {
                case 'listing':
                  if (listing != null) {
                    context.push('/market/${listing.id}');
                  }
                case 'block':
                  _showBlockDialog(context);
                case 'report':
                  _showReportDialog(context);
              }
            },
            itemBuilder: (context) => [
              if (listing != null)
                const PopupMenuItem(
                  value: 'listing',
                  child: ListTile(
                    leading: Icon(Icons.open_in_new),
                    title: Text('Зар харах'),
                    dense: true,
                  ),
                ),
              const PopupMenuItem(
                value: 'block',
                child: ListTile(
                  leading: Icon(Icons.block),
                  title: Text('Блоклох'),
                  dense: true,
                ),
              ),
              const PopupMenuItem(
                value: 'report',
                child: ListTile(
                  leading: Icon(Icons.flag_outlined),
                  title: Text('Мэдэгдэх'),
                  dense: true,
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Listing card header — only show for listing-based conversations
          if (listing != null) _ListingCardHeader(listing: listing),

          // Messages list
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) {
                  return Center(
                    child: EmptyState(
                      icon: Icons.chat_outlined,
                      title: 'Зурвас илгээх',
                      description: 'Доорх талбараар зурвас бичээд илгээнэ үү.',
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final isMe = message.senderId == _localUserId;
                    return _MessageBubble(
                      message: message,
                      isMe: isMe,
                      showSender:
                          index == 0 ||
                          messages[index - 1].senderId != message.senderId,
                    );
                  },
                );
              },
              loading: () => SkeletonLoader(
                items: 4,
                itemBuilder: (ctx, i) => const Padding(
                  padding: EdgeInsets.all(AppSpacing.md),
                  child: SkeletonCardTile(),
                ),
              ),
              error: (err, _) => Center(
                child: TamgaErrorWidget(
                  message: 'Зурвасуудыг ачаалахад алдаа гарлаа',
                  onRetry: () => ref.invalidate(
                    messageStreamProvider(widget.conversationId),
                  ),
                ),
              ),
            ),
          ),

          // Message composer
          _MessageComposer(
            controller: _messageController,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }

  void _showBlockDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Хэрэглэгчийг блоклох'),
        content: const Text(
          'Та энэ хэрэглэгчийг блоклохдоо итгэлтэй байна уу? '
          'Блоклосны дараа танд зурвас илгээх боломжгүй болно.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () {
              final otherId = widget.conversation?.sellerId == _localUserId
                  ? widget.conversation!.buyerId
                  : widget.conversation!.sellerId;
              ref
                  .read(messageRepositoryProvider)
                  .blockUser(_localUserId, otherId);
              Navigator.pop(ctx);
              TamgaToast.showSuccess(context, 'Хэрэглэгч блоклогдлоо.');
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Блоклох'),
          ),
        ],
      ),
    );
  }

  void _showReportDialog(BuildContext context) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Хэрэглэгчийг мэдэгдэх'),
        content: TextField(
          controller: reasonController,
          autofocus: true,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Шалтгаан',
            hintText: 'Зохисгүй зан авир, залилан...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () {
              final reason = reasonController.text.trim();
              if (reason.isEmpty) return;

              final otherId = widget.conversation?.sellerId == _localUserId
                  ? widget.conversation!.buyerId
                  : widget.conversation!.sellerId;

              ref
                  .read(messageRepositoryProvider)
                  .reportUser(
                    reporterId: _localUserId,
                    reportedUserId: otherId,
                    reason: reason,
                  );
              Navigator.pop(ctx);
              TamgaToast.showSuccess(context, 'Мэдэгдэл илгээгдлээ.');
            },
            child: const Text('Илгээх'),
          ),
        ],
      ),
    );
  }
}

// ── Listing Card Header ────────────────────────────────────────────

class _ListingCardHeader extends StatelessWidget {
  const _ListingCardHeader({required this.listing});

  final MarketListing listing;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return GestureDetector(
      onTap: () => context.push('/market/${listing.id}'),
      child: Container(
        padding: TamgaSpacing.listCellPadding,
        decoration: BoxDecoration(
          color: colors.surfaceContainerLow,
          border: Border(bottom: BorderSide(color: colors.outlineVariant)),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
              child: SizedBox(
                width: 48,
                height: 48,
                child: listing.mediaUrls.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: listing.mediaUrls.first,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => Icon(
                          Icons.image_outlined,
                          color: colors.onSurfaceVariant,
                        ),
                      )
                    : Icon(
                        Icons.image_outlined,
                        color: colors.onSurfaceVariant,
                      ),
              ),
            ),
            const SizedBox(width: TamgaSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.title,
                    style: TamgaTypography.body(weight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${_formatPrice(listing)} • ${listing.locationLabel}',
                    style: TamgaTypography.footnote(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: colors.outline),
          ],
        ),
      ),
    );
  }

  String _formatPrice(MarketListing listing) {
    final value = listing.priceAmount.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '$value ${listing.currency}';
  }
}

// ── Message Bubble ────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
    required this.isMe,
    this.showSender = true,
  });

  final MarketMessage message;
  final bool isMe;
  final bool showSender;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Column(
        crossAxisAlignment: isMe
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          if (showSender && !isMe)
            Padding(
              padding: const EdgeInsets.only(
                left: AppSpacing.xs,
                bottom: AppSpacing.xs,
              ),
              child: Text(
                'Худалдагч',
                style: TamgaTypography.caption1(
                  color: colors.onSurfaceVariant,
                  weight: FontWeight.w600,
                ),
              ),
            ),
          Row(
            mainAxisAlignment: isMe
                ? MainAxisAlignment.end
                : MainAxisAlignment.start,
            children: [
              if (!isMe) const SizedBox(width: AppSpacing.xl),
              Flexible(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: isMe
                        ? colors.primary
                        : scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(
                        isMe
                            ? TamgaSpacing.cornerRadius
                            : TamgaSpacing.cornerRadiusSmall,
                      ),
                      topRight: Radius.circular(
                        isMe
                            ? TamgaSpacing.cornerRadiusSmall
                            : TamgaSpacing.cornerRadius,
                      ),
                      bottomLeft: const Radius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      bottomRight: const Radius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.text,
                        style: TamgaTypography.body(
                          color: isMe ? colors.onPrimary : colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _formatTime(message.timestamp),
                            style: TamgaTypography.caption1(
                              color: isMe
                                  ? colors.onPrimary.withValues(alpha: 0.7)
                                  : colors.onSurfaceVariant,
                            ).copyWith(fontSize: 10),
                          ),
                          if (isMe) ...[
                            const SizedBox(width: AppSpacing.xs),
                            Icon(
                              message.read ? Icons.done_all : Icons.done,
                              size: 12,
                              color: colors.onPrimary.withValues(alpha: 0.7),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              if (isMe) const SizedBox(width: AppSpacing.xl),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return 'одоо';
    if (diff.inHours < 1) return '${diff.inMinutes}м өмнө';
    if (diff.inDays < 1) return '${diff.inHours}ц өмнө';
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}

// ── Message Composer ──────────────────────────────────────────────

class _MessageComposer extends StatelessWidget {
  const _MessageComposer({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          top: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText: 'Зурвас бичих...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusPill,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.sm,
                  ),
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            IconButton.filled(
              onPressed: onSend,
              icon: const Icon(Icons.send_rounded),
              tooltip: 'Илгээх',
            ),
          ],
        ),
      ),
    );
  }
}
