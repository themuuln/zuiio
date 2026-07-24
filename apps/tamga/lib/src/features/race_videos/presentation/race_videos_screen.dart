import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/race_categories.dart';
import '../../../core/widgets/widgets.dart';
import '../application/race_videos_providers.dart';
import '../domain/race_video.dart';

/// Уралдааны бичлэгийн зах зээл.
class RaceVideosScreen extends ConsumerStatefulWidget {
  const RaceVideosScreen({super.key});

  @override
  ConsumerState<RaceVideosScreen> createState() => _RaceVideosScreenState();
}

class _RaceVideosScreenState extends ConsumerState<RaceVideosScreen> {
  String _selectedCategory = 'Бүгд';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Уралдааны бичлэгүүд'),
        actions: [
          IconButton(
            onPressed: _showUploadSheet,
            icon: const Icon(Icons.upload_outlined),
            tooltip: 'Бичлэг нэмэх',
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Ангиллын шүүлтүүр ──────────────────────────────────
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: kRaceCategories.length,
              separatorBuilder: (_, index) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = kRaceCategories[i];
                final selected = cat == _selectedCategory;
                return FilterChip(
                  label: Text(cat),
                  selected: selected,
                  onSelected: (_) => setState(() => _selectedCategory = cat),
                );
              },
            ),
          ),

          // ── Видео жагсаалт ─────────────────────────────────────
          Expanded(child: _VideoFeedList(category: _selectedCategory)),
        ],
      ),
    );
  }

  void _showUploadSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const _VideoUploadSheet(),
    );
  }
}

// ── Feed list ───────────────────────────────────────────────────────────────

class _VideoFeedList extends ConsumerWidget {
  const _VideoFeedList({required this.category});

  final String category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final videosAsync = ref.watch(raceVideosProvider(category));

    return videosAsync.when(
      loading: () => SkeletonLoader(
        items: 4,
        itemBuilder: (ctx, i) => const SkeletonCardTile(),
      ),
      error: (err, _) => TamgaErrorWidget(
        message: 'Уралдааны бичлэг ачаалахад алдаа гарлаа',
        onRetry: () => ref.invalidate(raceVideosProvider(category)),
      ),
      data: (videos) {
        if (videos.isEmpty) {
          return const EmptyState(
            icon: Icons.videocam_off_outlined,
            title: 'Бичлэг байхгүй',
            description: 'Энэ ангилалд бичлэг олдсонгүй. Дээрх товчоор бичлэг нэмэх боломжтой.',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: videos.length,
          itemBuilder: (context, i) => _VideoCard(video: videos[i]),
        );
      },
    );
  }
}

// ── Video card ──────────────────────────────────────────────────────────────

class _VideoCard extends StatelessWidget {
  const _VideoCard({required this.video});

  final RaceVideo video;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Thumbnail ──
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  color: theme.colorScheme.surfaceContainerHighest,
                  child: video.thumbnailUrl != null
                      ? CachedNetworkImage(
                          imageUrl: video.thumbnailUrl!,
                          fit: BoxFit.cover,
                        )
                      : Icon(
                          Icons.videocam_outlined,
                          size: 48,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                ),
                // Preview play button
                Center(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(12),
                    child: const Icon(
                      Icons.play_arrow,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
                // Free badge
                if (video.price3day == 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Үнэгүй',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // ── Metadata ──
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  video.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (video.category != null) ...[
                      Icon(
                        Icons.sports,
                        size: 14,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(video.category!, style: theme.textTheme.bodySmall),
                      const SizedBox(width: 12),
                    ],
                    if (video.locationAimag != null) ...[
                      Icon(
                        Icons.location_on_outlined,
                        size: 14,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        video.locationAimag!,
                        style: theme.textTheme.bodySmall,
                      ),
                      const SizedBox(width: 12),
                    ],
                    Icon(
                      Icons.visibility_outlined,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${video.viewCount}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      video.price3day == 0
                          ? 'Үнэгүй'
                          : '₮${video.price3day} / 3 хоног',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    FilledButton.tonal(
                      onPressed: () => _onBuyTap(context, video),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text('Үзэх'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _onBuyTap(BuildContext context, RaceVideo video) {
    showModalBottomSheet(
      context: context,
      builder: (_) => _AccessPassSheet(video: video),
    );
  }
}

// ── Access pass purchase sheet ──────────────────────────────────────────────

class _AccessPassSheet extends StatelessWidget {
  const _AccessPassSheet({required this.video});

  final RaceVideo video;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            video.title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Хандалтын төрлийг сонгоно уу',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          _PassTile(
            label: '3 хоног',
            price: video.price3day,
            description: 'Нэг удаагийн үзэлт',
            icon: Icons.timelapse,
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: 8),
          _PassTile(
            label: '1 жил',
            price: video.price1year,
            description: 'Олон удаагийн үзэлт',
            icon: Icons.calendar_month_outlined,
            highlighted: true,
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: 8),
          _PassTile(
            label: 'Бүрмөсөн',
            price: video.priceLifetime,
            description: 'Хязгааргүй хандалт',
            icon: Icons.all_inclusive,
            onTap: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}

class _PassTile extends StatelessWidget {
  const _PassTile({
    required this.label,
    required this.price,
    required this.description,
    required this.icon,
    required this.onTap,
    this.highlighted = false,
  });

  final String label;
  final int price;
  final String description;
  final IconData icon;
  final VoidCallback onTap;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      color: highlighted ? theme.colorScheme.primaryContainer : null,
      child: ListTile(
        leading: Icon(
          icon,
          color: highlighted ? theme.colorScheme.primary : null,
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: highlighted ? theme.colorScheme.primary : null,
          ),
        ),
        subtitle: Text(description),
        trailing: FilledButton(onPressed: onTap, child: Text('₮$price')),
      ),
    );
  }
}

// ── Upload sheet ────────────────────────────────────────────────────────────

class _VideoUploadSheet extends StatefulWidget {
  const _VideoUploadSheet();

  @override
  State<_VideoUploadSheet> createState() => _VideoUploadSheetState();
}

class _VideoUploadSheetState extends State<_VideoUploadSheet> {
  final _titleController = TextEditingController();
  final _raceNameController = TextEditingController();
  String? _selectedCategory;

  @override
  void dispose() {
    _titleController.dispose();
    _raceNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        MediaQuery.viewInsetsOf(context).bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Бичлэг нэмэх',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // Video picker placeholder
          GestureDetector(
            onTap: () {
              // TODO: image_picker / video picker
            },
            child: Container(
              height: 120,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: theme.colorScheme.outline.withValues(alpha: 0.5),
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.video_call_outlined,
                    size: 36,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Видео сонгох',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          TextFormField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Гарчиг *',
              hintText: 'Жишээ: Улсын наадам 2026 — Шодон даага',
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _raceNameController,
                  decoration: const InputDecoration(
                    labelText: 'Тэмцээний нэр',
                    hintText: 'Улсын наадам',
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Ангилал'),
                  items: [
                    for (final c in kRaceCategories.skip(1))
                      DropdownMenuItem(value: c, child: Text(c)),
                  ],
                  onChanged: (v) => setState(() => _selectedCategory = v),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                // TODO: upload logic
                Navigator.pop(context);
              },
              child: const Text('Нийтлэх'),
            ),
          ),
        ],
      ),
    );
  }
}
