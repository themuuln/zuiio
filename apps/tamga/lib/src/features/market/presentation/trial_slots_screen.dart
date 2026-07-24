import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../application/trial_providers.dart';
import '../domain/trial_slot.dart';

// ══════════════════════════════════════════════════════════════════
// Туршилтын цагийн цонхны менежмент (Худалдагчид)
// ══════════════════════════════════════════════════════════════════

/// Худалдагчийн зарынхаа туршилтын цагийн цонхыг удирдах дэлгэц.
class TrialSlotsScreen extends ConsumerStatefulWidget {
  const TrialSlotsScreen({
    required this.listingId,
    required this.sellerId,
    super.key,
  });

  final String listingId;
  final String sellerId;

  @override
  ConsumerState<TrialSlotsScreen> createState() => _TrialSlotsScreenState();
}

class _TrialSlotsScreenState extends ConsumerState<TrialSlotsScreen> {
  @override
  Widget build(BuildContext context) {
    final slotsAsync = ref.watch(
      trialSlotsForListingProvider(widget.listingId),
    );
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Туршилтын цагууд'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Цаг нэмэх',
            onPressed: () => _showAddSlotDialog(context),
          ),
        ],
      ),
      body: slotsAsync.when(
        data: (slots) {
          final available = slots
              .where((s) => s.status == TrialSlotStatus.available)
              .toList();
          final booked = slots
              .where((s) => s.status == TrialSlotStatus.booked)
              .toList();
          final past = slots
              .where(
                (s) =>
                    s.status == TrialSlotStatus.completed ||
                    s.status == TrialSlotStatus.cancelled,
              )
              .toList();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(trialSlotsForListingProvider(widget.listingId));
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: [
                if (available.isNotEmpty) ...[
                  Text(
                    'Чөлөөтэй цагууд',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ...available.map(
                    (slot) => _SlotCard(
                      slot: slot,
                      onDelete: () => _deleteSlot(slot.id),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if (booked.isNotEmpty) ...[
                  Text(
                    'Захиалсан цагууд',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ...booked.map(
                    (slot) => _SlotCard(slot: slot, isBooked: true),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if (past.isNotEmpty) ...[
                  Text(
                    'Дууссан / Цуцлагдсан',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ...past.map((slot) => _SlotCard(slot: slot, isPast: true)),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if (slots.isEmpty)
                  const EmptyState(
                    icon: Icons.event_available_outlined,
                    title: 'Туршилтын цаг товлоогүй байна',
                    description: 'Дээрх + товчоор шинэ цаг нэмнэ үү',
                  ),
              ],
            ),
          );
        },
        loading: () => SkeletonLoader(
          items: 3,
          itemBuilder: (ctx, i) => const SkeletonCardTile(),
        ),
        error: (error, _) => TamgaErrorWidget(
          message: 'Цагийн мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () =>
              ref.invalidate(trialSlotsForListingProvider(widget.listingId)),
        ),
      ),
    );
  }

  Future<void> _showAddSlotDialog(BuildContext context) async {
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    final startTimeController = TextEditingController(text: '10:00');
    final endTimeController = TextEditingController(text: '11:00');
    final notesController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Шинэ цагийн цонх нэмэх'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date picker
                ListTile(
                  title: const Text('Огноо / Date'),
                  subtitle: Text(
                    '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}',
                  ),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: ctx,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                    );
                    if (date != null) {
                      setState(() => selectedDate = date);
                    }
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: startTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Эхлэх цаг (HH:mm)',
                    hintText: '10:00',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: endTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Дуусах цаг (HH:mm)',
                    hintText: '11:00',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Тэмдэглэл (заавал биш)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Цуцлах'),
            ),
            FilledButton(
              onPressed: () {
                if (startTimeController.text.trim().isEmpty ||
                    endTimeController.text.trim().isEmpty) {
                  return;
                }
                Navigator.of(ctx).pop(true);
              },
              child: const Text('Нэмэх'),
            ),
          ],
        ),
      ),
    );

    if (result == true && mounted) {
      final actions = ref.read(trialSlotActionsProvider);
      await actions.createSlot(
        listingId: widget.listingId,
        sellerId: widget.sellerId,
        date: selectedDate,
        startTime: startTimeController.text.trim(),
        endTime: endTimeController.text.trim(),
        notes: notesController.text.trim().isEmpty
            ? null
            : notesController.text.trim(),
      );
    }

    startTimeController.dispose();
    endTimeController.dispose();
    notesController.dispose();
  }

  Future<void> _deleteSlot(String slotId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Цагийн цонх устгах'),
        content: const Text(
          'Та энэ цагийн цонхыг устгахдаа итгэлтэй байна уу?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Устгах'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final actions = ref.read(trialSlotActionsProvider);
      await actions.deleteSlot(slotId, widget.listingId);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Цагийн цонхны Card Widget
// ══════════════════════════════════════════════════════════════════

class _SlotCard extends StatelessWidget {
  const _SlotCard({
    required this.slot,
    this.isBooked = false,
    this.isPast = false,
    this.onDelete,
  });

  final TrialSlot slot;
  final bool isBooked;
  final bool isPast;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        leading: Icon(
          isPast
              ? Icons.event_busy
              : isBooked
              ? Icons.event
              : Icons.event_available,
          color: isPast
              ? theme.colorScheme.error
              : isBooked
              ? Colors.orange
              : theme.colorScheme.tertiary,
        ),
        title: Text(
          '${slot.dateDisplay}  ${slot.timeDisplay}',
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isPast
                  ? slot.status.displayName
                  : isBooked
                  ? 'Захиалсан'
                  : 'Чөлөөтэй',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isPast
                    ? theme.colorScheme.error
                    : isBooked
                    ? Colors.orange
                    : theme.colorScheme.tertiary,
              ),
            ),
            if (slot.notes != null && slot.notes!.isNotEmpty)
              Text(
                slot.notes!,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontStyle: FontStyle.italic,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
          ],
        ),
        trailing: onDelete != null
            ? IconButton(
                icon: Icon(
                  Icons.delete_outline,
                  color: theme.colorScheme.error,
                ),
                onPressed: onDelete,
              )
            : null,
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Худалдан авагчийн туршилтын захиалгын Widget
// ══════════════════════════════════════════════════════════════════

/// Худалдан авагч туршилтын цагийг харж, захиалах widget.
class TrialBookingSection extends ConsumerWidget {
  const TrialBookingSection({
    required this.listingId,
    required this.sellerId,
    super.key,
  });

  final String listingId;
  final String sellerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slotsAsync = ref.watch(trialSlotsForListingProvider(listingId));
    final theme = Theme.of(context);

    return slotsAsync.when(
      data: (slots) {
        final available = slots
            .where((s) => s.status == TrialSlotStatus.available)
            .toList();

        if (available.isEmpty) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(AppSpacing.xl),
              child: Column(
                children: [
                  Icon(
                    Icons.event_busy,
                    size: 32,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Туршилтын цаг товлоогүй байна',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Худалдагч цаг нэмээгүй байна',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return Card(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.event_available,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Туршилтын цагууд', style: theme.textTheme.titleLarge),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Та доорх цагуудаас сонгон туршилтын цаг захиалах боломжтой.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                ...available.map(
                  (slot) => _AvailableSlotItem(
                    slot: slot,
                    listingId: listingId,
                    sellerId: sellerId,
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox(
        height: 100,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _AvailableSlotItem extends ConsumerWidget {
  const _AvailableSlotItem({
    required this.slot,
    required this.listingId,
    required this.sellerId,
  });

  final TrialSlot slot;
  final String listingId;
  final String sellerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Container(
      margin: EdgeInsets.only(bottom: AppSpacing.sm),
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${slot.dateDisplay}  ${slot.timeDisplay}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (slot.notes != null && slot.notes!.isNotEmpty)
                  Text(
                    slot.notes!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          SizedBox(
            height: 36,
            child: FilledButton(
              onPressed: () => _requestBooking(context, ref),
              child: const Text('Захиалах', style: TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _requestBooking(BuildContext context, WidgetRef ref) async {
    final notesController = TextEditingController();
    try {
      final notes = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Туршилт захиалах'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Цаг: ${slot.dateDisplay} ${slot.timeDisplay}',
                style: Theme.of(
                  ctx,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'Тэмдэглэл (заавал биш)',
                  hintText: 'Жишээ нь: 14:00 цагт ирнэ',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Цуцлах'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(
                notesController.text.trim().isEmpty
                    ? null
                    : notesController.text.trim(),
              ),
              child: const Text('Илгээх'),
            ),
          ],
        ),
      );

      if (notes != null && context.mounted) {
        final actions = ref.read(trialBookingActionsProvider);
        final result = await actions.requestBooking(
          listingId: listingId,
          slot: slot,
          sellerId: sellerId,
          notes: notes,
        );

        if (context.mounted) {
          if (result.isSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Туршилтын хүсэлт илгээгдлээ!')),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Алдаа: ${result.error.message}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    } finally {
      notesController.dispose();
    }
  }
}
