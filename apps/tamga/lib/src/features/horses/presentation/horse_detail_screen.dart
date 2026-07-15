import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../nutrition/presentation/feed_log_screen.dart';
import '../../nutrition/presentation/feed_schedule_screen.dart';
import '../../training/presentation/performance_screen.dart';
import '../../training/presentation/training_screen.dart';
import '../app/horse_photo_upload.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import 'horse_health_tab.dart';
import 'horse_info_tab.dart';

/// Full-screen horse detail with tabbed layout.
///
/// Tabs: Мэдээлэл (Info) · Эрүүл мэнд (Health) · Уралдаан (Events) · Угшил (Lineage)
class HorseDetailScreen extends ConsumerWidget {
  const HorseDetailScreen({required this.horse, super.key});

  final HorseRecord horse;

  void _showPhotoPicker(BuildContext context, WidgetRef ref, String horseId) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Галерээ'),
              onTap: () async {
                Navigator.of(ctx).pop();
                final result = await uploadHorsePhoto(
                  horseId: horseId,
                  source: ImageSource.gallery,
                );
                if (context.mounted) {
                  result.when(
                    onSuccess: (_) {
                      ref.invalidate(horsesProvider);
                      TamgaToast.showSuccess(
                        context,
                        'Зураг амжилттай нэмэгдлээ',
                      );
                    },
                    onFailure: (error) {
                      TamgaToast.showError(context, 'Алдаа: ${error.message}');
                    },
                  );
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Камер'),
              onTap: () async {
                Navigator.of(ctx).pop();
                final result = await uploadHorsePhoto(
                  horseId: horseId,
                  source: ImageSource.camera,
                );
                if (context.mounted) {
                  result.when(
                    onSuccess: (_) {
                      ref.invalidate(horsesProvider);
                    },
                    onFailure: (error) {
                      TamgaToast.showError(context, 'Алдаа: ${error.message}');
                    },
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final theme = Theme.of(ctx);

    return DefaultTabController(
      length: 8,
      child: Scaffold(
        body: NestedScrollView(
          headerSliverBuilder: (ctx, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 280,
              pinned: true,
              floating: false,
              leading: IconButton(
                onPressed: () => Navigator.of(ctx).pop(),
                icon: const Icon(Icons.arrow_back_ios_new),
              ),
              actions: [
                IconButton(
                  tooltip: 'Зураг нэмэх',
                  onPressed: () => _showPhotoPicker(ctx, ref, horse.id),
                  icon: const Icon(Icons.add_a_photo_outlined),
                ),
                IconButton(
                  tooltip: 'Засах',
                  onPressed: () {
                    // TODO: open edit sheet
                  },
                  icon: const Icon(Icons.edit_outlined),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsetsDirectional.only(
                  start: AppSpacing.lg,
                  bottom: AppSpacing.section,
                ),
                title: Text(
                  horse.name,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                background: _HorsePhotoHeader(horse: horse),
              ),
              bottom: TabBar(
                isScrollable: true,
                onTap: (_) => HapticFeedback.selectionClick(),
                tabs: [
                  const Tab(text: 'Мэдээлэл'),
                  const Tab(text: 'Эрүүл мэнд'),
                  const Tab(text: 'Дасгалжуулалт'),
                  const Tab(text: 'Гүйцэтгэл'),
                  const Tab(text: 'Тэжээлийн хуваарь'),
                  const Tab(text: 'Тэжээлийн бүртгэл'),
                  const Tab(text: 'Уралдаан'),
                  const Tab(text: 'Угшил'),
                ],
              ),
            ),
          ],
          body: TabBarView(
            children: [
              HorseInfoTab(horse: horse),
              HorseHealthTab(horseId: horse.id),
              TrainingScreen(horseId: horse.id),
              PerformanceScreen(horseId: horse.id),
              FeedScheduleScreen(horseId: horse.id),
              FeedLogScreen(horseId: horse.id),
              const _EventsTab(),
              _LineageTab(horse: horse),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Photo Header ──────────────────────────────────────────────────────

class _HorsePhotoHeader extends StatelessWidget {
  const _HorsePhotoHeader({required this.horse});
  final HorseRecord horse;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final colorScheme = theme.colorScheme;

    if (horse.photoUrls.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          Hero(
            tag: 'horse-image-${horse.id}',
            child: CachedNetworkImage(
              imageUrl: horse.photoUrls.first,
              fit: BoxFit.cover,
              placeholder: (_, _) =>
                  _PlaceholderImage(colorScheme: colorScheme),
              errorWidget: (_, _, _) =>
                  _PlaceholderImage(colorScheme: colorScheme),
            ),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black54],
                stops: [0.5, 1.0],
              ),
            ),
          ),
        ],
      );
    }

    return _PlaceholderImage(colorScheme: colorScheme);
  }
}

class _PlaceholderImage extends StatelessWidget {
  const _PlaceholderImage({required this.colorScheme});
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext ctx) {
    return Container(
      color: colorScheme.primaryContainer,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.pets,
              size: 64,
              color: colorScheme.onPrimaryContainer.withValues(alpha: 0.4),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Зураг байхгүй',
              style: TextStyle(
                color: colorScheme.onPrimaryContainer.withValues(alpha: 0.6),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Events Tab ───────────────────────────────────────────────────────

class _EventsTab extends StatelessWidget {
  const _EventsTab();

  @override
  Widget build(BuildContext ctx) {
    return const EmptyState(
      icon: Icons.emoji_events_outlined,
      title: 'Уралдааны мэдээлэл холбогдоогүй байна',
      description:
          'Энэ морины уралдааны мэдээлэл одоогоор бүртгэгдээгүй байна.',
    );
  }
}

// ── Lineage Tab ──────────────────────────────────────────────────────

class _LineageTab extends StatelessWidget {
  const _LineageTab({required this.horse});
  final HorseRecord horse;

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);

    if (horse.lineageRootId == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(AppSpacing.xxxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.account_tree_outlined, size: 48),
              SizedBox(height: AppSpacing.lg),
              Text('Угшилтын мэдээлэл холбогдоогүй байна.'),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Card(
          child: ListTile(
            leading: const Icon(Icons.account_tree),
            title: const Text('Root шугам'),
            subtitle: Text(horse.lineageRootId!),
            trailing: const Icon(Icons.chevron_right),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Угшилтын модон дээрх бусад морьдыг харахын тулд lineage хуудсыг ашиглана уу.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
