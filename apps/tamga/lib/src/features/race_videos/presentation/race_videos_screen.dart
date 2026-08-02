import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/constants/race_categories.dart';
import '../../../core/theme/design_tokens.dart';
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
      body: CustomScrollView(
        slivers: [
          // ── Command header ──
          TamgaSliverHeader(
            title: 'Уралдааны бичлэгүүд',
            subtitle: 'Тэмцээний бичлэгийн зах зээл',
            pinned: true,
            actions: [
              IconButton(
                onPressed: _showUploadSheet,
                icon: const Icon(Icons.upload_outlined),
                tooltip: 'Бичлэг нэмэх',
              ),
            ],
          ),

          // ── Ангиллын шүүлтүүр ──────────────────────────────────
          SliverToBoxAdapter(
            child: SizedBox(
              height: 56,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                itemCount: kRaceCategories.length,
                separatorBuilder: (_, index) =>
                    const SizedBox(width: AppSpacing.sm),
                itemBuilder: (context, i) {
                  final cat = kRaceCategories[i];
                  final selected = cat == _selectedCategory;
                  return TamgaChoicePill(
                    label: cat,
                    selected: selected,
                    onTap: () => setState(() => _selectedCategory = cat),
                  );
                },
              ),
            ),
          ),

          // ── Видео жагсаалт ─────────────────────────────────────
          _VideoFeedSliver(category: _selectedCategory),
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

// ── Feed sliver ──────────────────────────────────────────────────────────────

class _VideoFeedSliver extends ConsumerWidget {
  const _VideoFeedSliver({required this.category});

  final String category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final videosAsync = ref.watch(raceVideosProvider(category));

    return videosAsync.when(
      loading: () => SliverPadding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        sliver: SliverList.separated(
          itemCount: 4,
          separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
          itemBuilder: (_, i) => const SkeletonCardTile(),
        ),
      ),
      error: (err, _) => SliverFillRemaining(
        hasScrollBody: false,
        child: TamgaErrorWidget(
          message: 'Уралдааны бичлэг ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(raceVideosProvider(category)),
        ),
      ),
      data: (videos) {
        if (videos.isEmpty) {
          return const SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyState(
              icon: Icons.videocam_off_outlined,
              title: 'Бичлэг байхгүй',
              description:
                  'Энэ ангилалд бичлэг олдсонгүй. Дээрх товчоор бичлэг нэмэх боломжтой.',
            ),
          );
        }
        return SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.sm,
            AppSpacing.lg,
            AppSpacing.xxl * 2,
          ),
          sliver: SliverList.separated(
            itemCount: videos.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, i) => _VideoCard(video: videos[i]),
          ),
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
    return TamgaCard(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: EdgeInsets.zero,
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
                  child: Semantics(
                    label: 'Бичлэг үзэх',
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: const Icon(
                        Icons.play_arrow,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                  ),
                ),
                // Free badge
                if (video.price3day == 0)
                  const Positioned(
                    top: AppSpacing.sm,
                    left: AppSpacing.sm,
                    child: TamgaBadge(
                      label: 'Үнэгүй',
                      variant: TamgaBadgeVariant.success,
                      icon: Icons.check_circle_outline,
                    ),
                  ),
              ],
            ),
          ),

          // ── Metadata ──
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  video.title,
                  style: TamgaTypography.body(weight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.xs),
                Wrap(
                  spacing: AppSpacing.md,
                  runSpacing: AppSpacing.xs,
                  children: [
                    if (video.category != null)
                      _MetaLabel(
                        icon: Icons.sports,
                        text: video.category!,
                        theme: theme,
                      ),
                    if (video.locationAimag != null)
                      _MetaLabel(
                        icon: Icons.location_on_outlined,
                        text: video.locationAimag!,
                        theme: theme,
                      ),
                    _MetaLabel(
                      icon: Icons.visibility_outlined,
                      text: '${video.viewCount}',
                      theme: theme,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      video.price3day == 0
                          ? 'Үнэгүй'
                          : '₮${video.price3day} / 3 хоног',
                      style: TamgaTypography.footnote(
                        weight: FontWeight.w600,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    FilledButton.tonal(
                      onPressed: () => _onBuyTap(context, video),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(76, 44),
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                        ),
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

// ── Metadata label ───────────────────────────────────────────────────────────

class _MetaLabel extends StatelessWidget {
  const _MetaLabel({
    required this.icon,
    required this.text,
    required this.theme,
  });

  final IconData icon;
  final String text;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: text,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 4),
          Text(
            text,
            style: theme.textTheme.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
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
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.xxl,
        AppSpacing.lg,
        AppSpacing.xxxl,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            video.title,
            style: TamgaTypography.title3(weight: FontWeight.w600),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Хандалтын төрлийг сонгоно уу',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _PassTile(
            label: '3 хоног',
            price: video.price3day,
            description: 'Нэг удаагийн үзэлт',
            icon: Icons.timelapse,
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: AppSpacing.sm),
          _PassTile(
            label: '1 жил',
            price: video.price1year,
            description: 'Олон удаагийн үзэлт',
            icon: Icons.calendar_month_outlined,
            highlighted: true,
            onTap: () => Navigator.pop(context),
          ),
          const SizedBox(height: AppSpacing.sm),
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
    return TamgaCard(
      color: highlighted ? theme.colorScheme.primaryContainer : null,
      padding: EdgeInsets.zero,
      child: ListTile(
        leading: Icon(
          icon,
          color: highlighted ? theme.colorScheme.primary : null,
        ),
        title: Text(
          label,
          style: TamgaTypography.body(
            weight: FontWeight.w600,
            color: highlighted ? theme.colorScheme.primary : null,
          ),
        ),
        subtitle: Text(description),
        trailing: FilledButton(
          onPressed: onTap,
          style: FilledButton.styleFrom(
            minimumSize: const Size(76, 44),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          ),
          child: Text('₮$price'),
        ),
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
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Бичлэг нэмэх',
            style: TamgaTypography.title3(weight: FontWeight.w600),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Video picker placeholder
          Semantics(
            button: true,
            label: 'Видео сонгох',
            child: GestureDetector(
              onTap: () {
                // TODO: image_picker / video picker
              },
              child: Container(
                height: 120,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
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
                    const SizedBox(height: AppSpacing.sm),
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
          ),
          const SizedBox(height: AppSpacing.md),

          TextFormField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Гарчиг *',
              hintText: 'Жишээ: Улсын наадам 2026 — Шодон даага',
            ),
          ),
          const SizedBox(height: AppSpacing.md),
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
              const SizedBox(width: AppSpacing.md),
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
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () {
                // TODO: upload logic
                Navigator.pop(context);
              },
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
              child: const Text('Нийтлэх'),
            ),
          ),
        ],
      ),
    );
  }
}
