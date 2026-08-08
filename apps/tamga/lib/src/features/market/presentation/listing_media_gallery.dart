/// Зарын зургийн галерей.
library;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

/// Зарын зургийн галерей (PageView).
class ListingMediaGallery extends StatelessWidget {
  const ListingMediaGallery({required this.mediaUrls, this.heroTag, super.key});

  /// Зургийн жагсаалт.
  final List<String> mediaUrls;

  /// Hero shared-element transition tag (зөвхөн эхний зурагт).
  final String? heroTag;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (mediaUrls.isEmpty) {
      return _PlaceholderBackground(theme: theme);
    }

    return PageView.builder(
      itemCount: mediaUrls.length,
      itemBuilder: (context, index) {
        final url = mediaUrls[index];
        final isNetwork = url.startsWith('http');

        /// Эхний зургийг Hero shared-element transition-д оруулах.
        final tag = heroTag;
        Widget? imageWidget;
        if (isNetwork) {
          imageWidget = CachedNetworkImage(
            imageUrl: url,
            fit: BoxFit.cover,
            placeholder: (_, _) => _LoadingPlaceholder(theme: theme),
            errorWidget: (_, _, _) => _ErrorPlaceholder(theme: theme),
          );
        }

        // Hero-г зөвхөн эхний зурагт хэрэглэх
        if (index == 0 && tag != null && imageWidget != null) {
          imageWidget = Hero(tag: tag, child: imageWidget);
        }

        return Stack(
          fit: StackFit.expand,
          children: [
            if (imageWidget != null)
              imageWidget
            else
              _PlaceholderBackground(theme: theme),
            // Зургийн дугаарын тэмдэг
            Positioned(
              bottom: AppSpacing.md,
              right: AppSpacing.md,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(138, 0, 0, 0),
                  borderRadius: BorderRadius.circular(
                    AppSpacing.cornerRadiusPill,
                  ),
                ),
                child: Text(
                  '${index + 1} / ${mediaUrls.length}',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: const Color.fromARGB(255, 255, 255, 255),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Ачаалж буй зургийн дүрс.
class _LoadingPlaceholder extends StatelessWidget {
  const _LoadingPlaceholder({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.secondaryContainer,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}

/// Алдаатай зургийн дүрс.
class _ErrorPlaceholder extends StatelessWidget {
  const _ErrorPlaceholder({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.secondaryContainer,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Icon(
          Icons.broken_image_outlined,
          size: 48,
          color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}

/// Зургийн оронцын дүрс.
class _PlaceholderBackground extends StatelessWidget {
  const _PlaceholderBackground({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.secondaryContainer,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Icon(
          Icons.landscape,
          size: 64,
          color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
