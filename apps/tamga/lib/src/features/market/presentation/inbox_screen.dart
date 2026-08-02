import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/market_providers.dart';
import '../application/message_providers.dart';
import '../domain/market_conversation.dart';

/// Ирсэн зурвасуудын дэлгэц (Inbox).
///
/// Хэрэглэгчийн бүх active conversation-уудыг харуулна.
class InboxScreen extends ConsumerWidget {
  const InboxScreen({super.key});

  static const localUserId = 'local-buyer';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider(localUserId));
    final unreadCountAsync = ref.watch(unreadCountProvider(localUserId));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Ирсэн'),
            const SizedBox(width: AppSpacing.sm),
            unreadCountAsync.when(
              data: (count) {
                if (count > 0) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.error,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.cornerRadiusPill,
                      ),
                    ),
                    child: Text(
                      '$count',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onError,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
              loading: () => SizedBox(
                width: 16,
                height: 16,
                child: LoadingIndicator(size: 12),
              ),
              error: (_, _) => const SizedBox.shrink(),
            ),
          ],
        ),
      ),
      body: conversationsAsync.when(
        data: (conversations) {
          if (conversations.isEmpty) {
            return Center(
              child: EmptyState(
                icon: Icons.chat_bubble_outline,
                title: 'Зурвас байхгүй',
                description:
                    'Зарын дэлгэрэнгүй хуудаснаас худалдагчтай холбогдох боломжтой.',
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(conversationsProvider(localUserId));
              ref.invalidate(unreadCountProvider(localUserId));
            },
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              itemCount: conversations.length,
              itemBuilder: (context, index) {
                final conversation = conversations[index];
                return _ConversationListTile(
                  conversation: conversation,
                  onTap: () => context.push(
                    '/inbox/${conversation.id}',
                    extra: conversation,
                  ),
                );
              },
            ),
          );
        },
        loading: () => SkeletonLoader(
          items: 5,
          itemBuilder: (ctx, i) => const SkeletonListTile(),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xxl),
            child: TamgaErrorWidget(
              message: 'Зурвасуудыг ачаалахад алдаа гарлаа',
              onRetry: () {
                ref.invalidate(conversationsProvider(localUserId));
                ref.invalidate(unreadCountProvider(localUserId));
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// Нэг conversation-ийг харуулах жагсаалтын элемент.
class _ConversationListTile extends ConsumerWidget {
  const _ConversationListTile({
    required this.conversation,
    required this.onTap,
  });

  final MarketConversation conversation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    final isReportConversation = conversation.reportId != null;

    // Get listing info for thumbnail and title (only for listing-based conversations)
    String title;
    String? thumbnailUrl;
    if (isReportConversation) {
      title = 'Хаяж морь';
      thumbnailUrl = null;
    } else {
      final listingsMap = ref.watch(marketListingsMapProvider);
      final listingVm = conversation.listingId != null
          ? listingsMap[conversation.listingId]
          : null;
      final listing = listingVm?.listing;
      title = listing?.title ?? 'Худалдагч';
      if (listing != null && listing.mediaUrls.isNotEmpty) {
        thumbnailUrl = listing.mediaUrls.first;
      }
    }

    final hasUnread = conversation.unreadCount > 0;

    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xs,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              // Listing thumbnail (or placeholder for report conversations)
              ClipRRect(
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadiusSmall,
                ),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: thumbnailUrl != null
                      ? Image.network(
                          thumbnailUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _ThumbnailPlaceholder(),
                        )
                      : _ThumbnailPlaceholder(),
                ),
              ),
              const SizedBox(width: AppSpacing.md),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: hasUnread
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (conversation.lastMessageAt != null)
                          Text(
                            _formatTime(conversation.lastMessageAt!),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.lastMessage.isNotEmpty
                                ? conversation.lastMessage
                                : 'Шинэ чат',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: hasUnread
                                  ? theme.colorScheme.onSurface
                                  : theme.colorScheme.onSurfaceVariant,
                              fontWeight: hasUnread
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (hasUnread)
                          Container(
                            margin: const EdgeInsets.only(left: AppSpacing.sm),
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.sm,
                              vertical: AppSpacing.xs,
                            ),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.error,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '${conversation.unreadCount}',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: theme.colorScheme.onError,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return 'одоо';
    if (diff.inHours < 1) return '${diff.inMinutes}м';
    if (diff.inDays < 1) return '${diff.inHours}ц';
    if (diff.inDays < 7) return '${diff.inDays}ө';
    return '${time.month}/${time.day}';
  }
}

/// Зургийн оронд харуулах placeholder.
class _ThumbnailPlaceholder extends StatelessWidget {
  const _ThumbnailPlaceholder();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      color: theme.colorScheme.surfaceContainerHighest,
      child: Center(
        child: Icon(
          Icons.image_outlined,
          size: 24,
          color: theme.colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}
