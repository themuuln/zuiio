import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../application/race_providers.dart';
import '../domain/race.dart';
import '../domain/race_entry.dart';
import 'race_form_screen.dart';
import 'race_results_editor_screen.dart';

/// Уралдааны дэлгэрэнгүй мэдээллийн дэлгэц.
///
/// - Уралдааны бүх мэдээллийг харуулдаг (нэр, огноо, байршил, төрөл, төлөв,
///   оролцооны төлбөр, шагналын хуваарилалт).
/// - Бүртгэгдсэн моридын жагсаалтыг харуулдаг.
/// - "Морь бүртгүүлэх" товчийг ирээдүйн уралдаанд харуулдаг.
/// - Дууссан уралдаанд үр дүнг харуулдаг (байр, шагнал).
class RaceDetailScreen extends ConsumerStatefulWidget {
  const RaceDetailScreen({required this.raceId, super.key});

  /// Уралдааны ID.
  final String raceId;

  @override
  ConsumerState<RaceDetailScreen> createState() => _RaceDetailScreenState();
}

class _RaceDetailScreenState extends ConsumerState<RaceDetailScreen> {
  /// Морь бүртгүүлэх үйлдэл.
  ///
  /// 1. Хэрэглэгчийн моридыг ачаална
  /// 2. Аль хэдийн бүртгэлтэй моридыг шүүнэ
  /// 3. Морь сонгох bottom sheet харуулна
  /// 4. Морьтон нэр оруулах цонх харуулна
  /// 5. Бүртгэлийг баталгаажуулна
  Future<void> _registerHorse(Race race) async {
    final horses = await ref.read(horsesProvider.future);
    final entries = await ref.read(raceEntriesProvider(widget.raceId).future);

    if (!mounted) return;

    final authState = ref.read(authStateProvider).valueOrNull;
    final userId = authState?.userId ?? '';

    // Аль хэдийн бүртгэлтэй моридыг шүүх
    final alreadyRegisteredHorseIds = entries
        .where((e) => e.status != RaceEntryStatus.scratched)
        .map((e) => e.horseId)
        .toSet();

    final availableHorses = horses
        .where((h) => h.ownerId == userId)
        .where((h) => !alreadyRegisteredHorseIds.contains(h.id))
        .toList();

    if (availableHorses.isEmpty) {
      if (mounted) {
        TamgaToast.show(context, 'Бүртгүүлэх боломжтой морь байхгүй байна');
      }
      return;
    }

    if (!mounted) return;

    // Алхам 1: Морь сонгох
    final selectedHorse = await showModalBottomSheet<Horse>(
      context: context,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => _HorseSelectionSheet(horses: availableHorses),
    );

    if (selectedHorse == null) return;
    if (!mounted) return;

    // Алхам 2: Морьтон нэр оруулах
    final jockeyName = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _JockeyNameDialog(),
    );

    if (jockeyName == null) return;
    if (!mounted) return;

    // Алхам 3: Бүртгэлийг баталгаажуулах
    final repository = ref.read(localRaceEntryRepositoryProvider);
    final result = await repository.register(
      raceId: widget.raceId,
      horseId: selectedHorse.id,
      ownerId: userId,
      jockeyName: jockeyName,
    );

    if (!context.mounted) return;

    result.when(
      onSuccess: (_) {
        TamgaToast.showSuccess(context, 'Амжилттай бүртгэгдлээ');
        ref.invalidate(raceEntriesProvider(widget.raceId));
        ref.invalidate(activeRaceEntriesProvider(widget.raceId));
      },
      onFailure: (error) {
        TamgaToast.showError(context, error.message);
      },
    );
  }

  /// Уралдаан засах хуудас руу шилжих.
  Future<void> _editRace(Race race) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => RaceFormScreen(initialRace: race)),
    );
    if (result == true && context.mounted) {
      ref.invalidate(raceDetailProvider(widget.raceId));
      ref.invalidate(racesProvider);
    }
  }

  /// Үр дүн засах хуудас руу шилжих.
  Future<void> _editResults(Race race, List<RaceEntry> entries) async {
    final activeEntries = entries
        .where((e) => e.status != RaceEntryStatus.scratched)
        .toList();

    final horses = await ref.read(horsesProvider.future);
    if (!mounted) return;
    final horseNames = horses.fold<Map<String, String>>(
      {},
      (map, h) => map..[h.id] = h.name,
    );

    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => RaceResultsEditorScreen(
          race: race,
          entries: activeEntries,
          horseNames: horseNames,
        ),
      ),
    );
    if (result == true && context.mounted) {
      ref.invalidate(raceEntriesProvider(widget.raceId));
      ref.invalidate(activeRaceEntriesProvider(widget.raceId));
    }
  }

  @override
  Widget build(BuildContext context) {
    final raceAsync = ref.watch(raceDetailProvider(widget.raceId));
    final entriesAsync = ref.watch(raceEntriesProvider(widget.raceId));
    final authAsync = ref.watch(authStateProvider);
    final userId = authAsync.valueOrNull?.userId ?? '';

    return raceAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Уралдаан')),
        body: const Center(child: LoadingIndicator(size: 28)),
      ),
      error: (error, stack) => Scaffold(
        appBar: AppBar(title: const Text('Уралдаан')),
        body: TamgaErrorWidget(
          message: 'Уралдаан ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(raceDetailProvider(widget.raceId)),
        ),
      ),
      data: (race) {
        final horsesAsync = ref.watch(horsesProvider);
        final horseNames =
            horsesAsync.valueOrNull?.fold<Map<String, String>>(
              {},
              (map, h) => map..[h.id] = h.name,
            ) ??
            <String, String>{};
        return Scaffold(
          appBar: AppBar(
            title: Text(race.name, style: TamgaTypography.title3()),
            actions: [
              // ── Organizer: edit race button ──
              if (race.organizerId == userId &&
                  race.status != RaceStatus.completed &&
                  race.status != RaceStatus.cancelled)
                IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  tooltip: 'Засах',
                  onPressed: () => _editRace(race),
                ),
              // ── Organizer: edit results button ──
              if (race.organizerId == userId &&
                  race.status == RaceStatus.completed)
                IconButton(
                  icon: const Icon(Icons.emoji_events_outlined),
                  tooltip: 'Үр дүн засах',
                  onPressed: () {
                    final entries = entriesAsync.valueOrNull;
                    if (entries != null) {
                      _editResults(race, entries);
                    }
                  },
                ),
            ],
          ),
          body: entriesAsync.when(
            loading: () => const Center(child: LoadingIndicator(size: 28)),
            error: (err, stack) => TamgaErrorWidget(
              message: 'Бүртгэлүүдийг ачаалахад алдаа гарлаа',
              onRetry: () => ref.invalidate(raceEntriesProvider(widget.raceId)),
            ),
            data: (entries) => _RaceDetailContent(
              race: race,
              entries: entries,
              userId: userId,
              horseNames: horseNames,
              onRegister: () => _registerHorse(race),
            ),
          ),
        );
      },
    );
  }
}

// ── Race Detail Content ──────────────────────────────────────────

class _RaceDetailContent extends StatelessWidget {
  const _RaceDetailContent({
    required this.race,
    required this.entries,
    required this.userId,
    required this.horseNames,
    required this.onRegister,
  });

  final Race race;
  final List<RaceEntry> entries;
  final String userId;
  final Map<String, String> horseNames;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final activeEntries = entries
        .where((e) => e.status != RaceEntryStatus.scratched)
        .toList();
    final isUpcoming =
        race.status == RaceStatus.upcoming || race.status == RaceStatus.ongoing;
    final isCompleted = race.status == RaceStatus.completed;
    final isFull =
        race.hasMaxEntries && activeEntries.length >= race.maxEntries!;
    final canRegister = isUpcoming && !isFull && userId.isNotEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Registration button ──
          if (isUpcoming || isFull) ...[
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: canRegister ? onRegister : null,
                icon: Icon(isFull ? Icons.lock_outline : Icons.add),
                label: Text(isFull ? 'Бүртгэл дууссан' : 'Морь бүртгүүлэх'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Race info card ──
          _RaceInfoCard(race: race),

          const SizedBox(height: AppSpacing.lg),

          // ── Prize distribution ──
          if (race.prizeDistribution != null &&
              race.prizeDistribution!.isNotEmpty) ...[
            _PrizeDistributionCard(race: race),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Description ──
          if (race.description != null && race.description!.isNotEmpty) ...[
            TamgaCard(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Тодорхойлолт',
                      style: TamgaTypography.title3(weight: FontWeight.w600),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(race.description!, style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Registered horses section ──
          _RegisteredHorsesSection(
            entries: activeEntries,
            isCompleted: isCompleted,
            isUpcoming: isUpcoming,
            horseNames: horseNames,
          ),

          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }
}

// ── Horse selection bottom sheet ────────────────────────────────

class _HorseSelectionSheet extends StatelessWidget {
  const _HorseSelectionSheet({required this.horses});

  final List<Horse> horses;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppSpacing.md),
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              'Морь сонгох',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            if (horses.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
                child: Center(child: Text('Бүртгүүлэх боломжтой морь байхгүй')),
              )
            else
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: horses.length,
                  itemBuilder: (ctx, i) {
                    final horse = horses[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: theme.colorScheme.primaryContainer,
                        child: Text(
                          horse.name.isNotEmpty
                              ? horse.name[0].toUpperCase()
                              : '?',
                          style: TextStyle(
                            color: theme.colorScheme.onPrimaryContainer,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      title: Text(horse.name),
                      subtitle: Text('${horse.birthYear} · ${horse.coat}'),
                      trailing: const Icon(Icons.add_circle_outline),
                      onTap: () => Navigator.of(context).pop(horse),
                    );
                  },
                ),
              ),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}

// ── Jockey name input dialog ───────────────────────────────────

class _JockeyNameDialog extends StatefulWidget {
  @override
  State<_JockeyNameDialog> createState() => _JockeyNameDialogState();
}

class _JockeyNameDialogState extends State<_JockeyNameDialog> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Морьтон нэр'),
      content: Form(
        key: _formKey,
        child: TextFormField(
          controller: _controller,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Морьтон нэр *',
            hintText: 'Морьтон хүний нэр',
            border: OutlineInputBorder(),
          ),
          validator: (v) => (v == null || v.trim().isEmpty)
              ? 'Морьтон нэр шаардлагатай'
              : null,
          onFieldSubmitted: (_) => _submit(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Цуцлах'),
        ),
        FilledButton(onPressed: _submit, child: const Text('Бүртгүүлэх')),
      ],
    );
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      Navigator.of(context).pop(_controller.text.trim());
    }
  }
}

// ── Race Info Card ────────────────────────────────────────────────

class _RaceInfoCard extends StatelessWidget {
  const _RaceInfoCard({required this.race});

  final Race race;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final dateStr = race.date != null
        ? '${race.date!.year}-${race.date!.month.toString().padLeft(2, '0')}-${race.date!.day.toString().padLeft(2, '0')}'
        : 'Тодорхойгүй';

    return TamgaCard(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Type badge ──
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: colorScheme.secondaryContainer,
                  radius: 20,
                  child: Icon(
                    Icons.emoji_events_outlined,
                    color: colorScheme.onSecondaryContainer,
                    size: 20,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      race.type.displayName,
                      style: TamgaTypography.body(
                        weight: FontWeight.w600,
                        color: colorScheme.onSecondaryContainer,
                      ),
                    ),
                    Text(
                      race.status.displayName,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                _StatusChip(status: race.status),
              ],
            ),

            const Divider(height: AppSpacing.xl),

            // ── Date ──
            _InfoRow(
              icon: Icons.calendar_today_outlined,
              label: 'Огноо',
              value: dateStr,
            ),
            const SizedBox(height: AppSpacing.sm),

            // ── Location ──
            if (race.location != null && race.location!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _InfoRow(
                  icon: Icons.place_outlined,
                  label: 'Байршил',
                  value: race.location!,
                ),
              ),

            // ── Entry fee ──
            if (race.entryFee > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _InfoRow(
                  icon: Icons.monetization_on_outlined,
                  label: 'Оролцооны төлбөр',
                  value: '${race.entryFee}₮',
                ),
              ),

            // ── Max entries ──
            if (race.maxEntries != null)
              _InfoRow(
                icon: Icons.people_outline,
                label: 'Оролцогчдын дээд тоо',
                value: '${race.maxEntries}',
              ),
          ],
        ),
      ),
    );
  }
}

// ── Prize Distribution Card ───────────────────────────────────────

class _PrizeDistributionCard extends StatelessWidget {
  const _PrizeDistributionCard({required this.race});

  final Race race;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return TamgaCard(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.emoji_events, size: 18, color: colorScheme.primary),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Шагналын хуваарилалт',
                  style: TamgaTypography.title3(weight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: colorScheme.tertiaryContainer.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadiusSmall,
                ),
              ),
              child: Text(
                race.prizeDistribution!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onTertiaryContainer,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Registered Horses Section ─────────────────────────────────────

class _RegisteredHorsesSection extends StatelessWidget {
  const _RegisteredHorsesSection({
    required this.entries,
    required this.isCompleted,
    required this.isUpcoming,
    required this.horseNames,
  });

  final List<RaceEntry> entries;
  final bool isCompleted;
  final bool isUpcoming;
  final Map<String, String> horseNames;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return TamgaCard(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Бүртгэгдсэн морьд',
                  style: TamgaTypography.title3(weight: FontWeight.w600),
                ),
                const SizedBox(width: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadiusPill,
                    ),
                  ),
                  child: Text(
                    '${entries.length}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            if (entries.isEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
                  child: Text(
                    'Бүртгэл байхгүй байна',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ] else ...[
              const SizedBox(height: AppSpacing.md),
              ...entries.map(
                (entry) => _EntryTile(
                  entry: entry,
                  isCompleted: isCompleted,
                  horseName: horseNames[entry.horseId] ?? entry.horseId,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Entry Tile ───────────────────────────────────────────────────

class _EntryTile extends StatelessWidget {
  const _EntryTile({
    required this.entry,
    required this.isCompleted,
    required this.horseName,
  });

  final RaceEntry entry;
  final bool isCompleted;
  final String horseName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          // ── Placement badge (if completed) ──
          if (isCompleted && entry.placement != null) ...[
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: _placementColor(entry.placement!, colorScheme),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${entry.placement}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: entry.placement == 1
                        ? Colors.white
                        : colorScheme.onSurface,
                  ),
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
          ],

          // ── Horse icon ──
          if (!isCompleted || entry.placement == null)
            CircleAvatar(
              backgroundColor: colorScheme.secondaryContainer,
              radius: 14,
              child: Icon(
                Icons.pets,
                size: 14,
                color: colorScheme.onSecondaryContainer,
              ),
            ),
          if (!isCompleted || entry.placement == null)
            const SizedBox(width: AppSpacing.md),

          // ── Horse & jockey name ──
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Морь: $horseName',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (entry.jockeyName != null && entry.jockeyName!.isNotEmpty)
                  Text(
                    'Морьтон: ${entry.jockeyName}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),

          // ── Status or prize ──
          if (isCompleted && entry.prize != null && entry.prize! > 0)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(
                  AppSpacing.cornerRadiusPill,
                ),
              ),
              child: Text(
                '${entry.prize}₮',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
            )
          else
            Text(
              entry.status.displayName,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }

  Color _placementColor(int placement, ColorScheme colorScheme) {
    switch (placement) {
      case 1:
        return const Color(0xFFFFD700); // Gold
      case 2:
        return const Color(0xFFC0C0C0); // Silver
      case 3:
        return const Color(0xFFCD7F32); // Bronze
      default:
        return colorScheme.surfaceContainerHighest;
    }
  }
}

// ── Info Row ─────────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Row(
      children: [
        Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
        const SizedBox(width: AppSpacing.sm),
        Text(
          '$label: ',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
      ],
    );
  }
}

// ── Status Chip ───────────────────────────────────────────────────

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final RaceStatus status;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final (Color bg, Color fg) = switch (status) {
      RaceStatus.upcoming => (
        colorScheme.primaryContainer,
        colorScheme.onPrimaryContainer,
      ),
      RaceStatus.ongoing => (
        colorScheme.tertiaryContainer,
        colorScheme.onTertiaryContainer,
      ),
      RaceStatus.completed => (
        colorScheme.secondaryContainer,
        colorScheme.onSecondaryContainer,
      ),
      RaceStatus.cancelled => (
        colorScheme.errorContainer,
        colorScheme.onErrorContainer,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}
