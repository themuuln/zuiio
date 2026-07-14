/// Зарын гүйцэтгэлийн түүх.
library;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../shared/domain/event.dart';

/// Гүйцэтгэлийн түүх.
class ListingPerformanceHistory extends StatelessWidget {
  const ListingPerformanceHistory({required this.events, super.key});

  /// Арга хэмжээний жагсаалт.
  final List<Event> events;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Performance history', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.md),
            if (events.isEmpty)
              const Text('Уралдааны холбоотой record алга.')
            else
              for (final event in events)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.emoji_events),
                  title: Text(event.title),
                  subtitle: Text(
                    '${event.date != null ? '${event.date!.year}-${event.date!.month.toString().padLeft(2, '0')}-${event.date!.day.toString().padLeft(2, '0')}' : 'Огноо тодорхойгүй'} • ${event.location ?? 'Байршил тодорхойгүй'} • ${event.result ?? 'Үр дүн тодорхойгүй'}',
                  ),
                ),
          ],
        ),
      ),
    );
  }
}
