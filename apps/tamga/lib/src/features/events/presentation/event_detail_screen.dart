import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/services/notification_types.dart';
import '../../../core/sync/connection_status.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/event.dart';
import '../../../shared/domain/event_registration.dart';
import '../../auth/application/auth_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../application/auto_achievement_provider.dart';
import '../application/events_providers.dart';
import 'add_event_screen.dart';
import 'widgets/event_map_preview.dart';
import 'widgets/navigate_to_location_button.dart';

/// Арга хэмжээний дэлгэрэнгүй мэдээллийн дэлгэц.
///
/// - Үйл явдлын бүх мэдээллийг харуулдаг.
/// - `registrationEnabled = true` үед "Морь бүртгүүлэх" товчийг харуулдаг.
/// - Бүртгэгдсэн моридын жагсаалтыг харуулдаг.
/// - Хэрэглэгч өөрийн бүртгэлийг цуцлах боломжтой.
/// - Давхар бүртгэлээс сэргийлдэг.
class EventDetailScreen extends ConsumerStatefulWidget {
  const EventDetailScreen({required this.event, super.key});

  /// Арга хэмжээ.
  final Event event;

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  /// Edit хэсгээс буцаж ирэхэд event-г хадгалах.
  Future<void> _editEvent() async {
    final result = await Navigator.of(context).push<Event>(
      MaterialPageRoute(
        builder: (_) => AddEventScreen(
          horseId: widget.event.horseId,
          horseName: widget.event.horseName ?? '',
          initialEvent: widget.event,
        ),
      ),
    );

    if (result != null) {
      final repo = ref.read(localEventRepositoryProvider);
      final saveResult = await repo.saveEvent(result);
      saveResult.when(
        onSuccess: (_) {
          // Auto-achievement: detect completion and update tournament profiles
          processEventCompletionFromRef(ref, result);
          if (context.mounted) {
            showOfflineAwareSaveFeedback(
              context,
              ConnectionMonitor.instance.current,
            );
            Navigator.of(context).pop();
          }
        },
        onFailure: (error) {
          if (context.mounted) {
            TamgaToast.showError(
              context,
              'Хадгалахад алдаа гарлаа: ${error.message}',
            );
          }
        },
      );
    }
  }

  /// Морь сонгох цонхыг нээж, бүртгүүлэх.
  Future<void> _showRegisterHorseSheet() async {
    final horses = await ref.read(horsesProvider.future);
    final registrations = await ref.read(
      eventRegistrationsProvider(widget.event.id).future,
    );

    if (!mounted) return;

    final authState = ref.read(authStateProvider).valueOrNull;
    final userId = authState?.userId;

    // Өөрийн моридыг шүүж, аль хэдийн бүртгэлтэй моридыг хасах.
    final alreadyRegisteredHorseIds = registrations
        .where((r) => r.status != RegistrationStatus.cancelled)
        .map((r) => r.horseId)
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

    final repo = ref.read(localEventRegistrationRepositoryProvider);
    final result = await repo.registerHorse(
      eventId: widget.event.id,
      horseId: selectedHorse.id,
      ownerId: userId ?? '',
    );

    result.when(
      onSuccess: (_) {
        if (context.mounted) {
          TamgaToast.show(
            context,
            '${selectedHorse.name} амжилттай бүртгэгдлээ',
          );
          ref.invalidate(eventRegistrationsProvider(widget.event.id));
        }
      },
      onFailure: (error) {
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Бүртгэхэд алдаа гарлаа: ${error.message}',
          );
        }
      },
    );
  }

  /// "Сануулах" товчны үйлдэл — event-ийн өдрөөс 1 хоногийн өмнө notification товлох.
  Future<void> _scheduleReminder() async {
    final eventDate = widget.event.date;
    if (eventDate == null) return;

    final scheduledDate = eventDate.subtract(const Duration(days: 1));
    final notificationId = widget.event.id.hashCode.abs();

    final notificationService = ref.read(localNotificationServiceProvider);
    final result = await notificationService.scheduleNotification(
      id: notificationId,
      title: 'Арга хэмжээний сануулга',
      body: widget.event.title,
      scheduledDate: scheduledDate,
      type: NotificationType.healthReminder,
      referenceId: widget.event.id,
      referenceType: 'event',
    );

    if (context.mounted) {
      result.when(
        onSuccess: (_) {
          TamgaToast.show(context, 'Сануулга амжилттай товлогдлоо');
        },
        onFailure: (error) {
          TamgaToast.showError(
            context,
            'Сануулга товлоход алдаа гарлаа: ${error.message}',
          );
        },
      );
    }
  }

  /// Бүртгэлийг цуцлах.
  Future<void> _cancelRegistration(EventRegistration reg) async {
    final confirmed = await TamgaConfirmDialog.show(
      context,
      title: 'Бүртгэл цуцлах',
      message: 'Энэ морины бүртгэлийг цуцлахдаа итгэлтэй байна уу?',
      confirmLabel: 'Цуцлах',
      isDestructive: true,
    );

    if (confirmed != true) return;
    if (!context.mounted) return;

    final repo = ref.read(localEventRegistrationRepositoryProvider);
    final result = await repo.cancelRegistration(reg.id);

    result.when(
      onSuccess: (_) {
        if (context.mounted) {
          TamgaToast.show(context, 'Бүртгэл цуцлагдлаа');
          ref.invalidate(eventRegistrationsProvider(widget.event.id));
        }
      },
      onFailure: (error) {
        if (context.mounted) {
          TamgaToast.showError(
            context,
            'Цуцлахад алдаа гарлаа: ${error.message}',
          );
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final registrationsAsync = ref.watch(
      eventRegistrationsProvider(widget.event.id),
    );
    final authAsync = ref.watch(authStateProvider);
    final authState = authAsync.valueOrNull;
    final userId = authState?.userId;
    final horsesAsync = ref.watch(horsesProvider);

    // Морины ID → нэр хөрвүүлэгч
    final horseNames =
        horsesAsync.valueOrNull?.fold<Map<String, String>>(
          {},
          (map, h) => map..[h.id] = h.name,
        ) ??
        <String, String>{};

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.event.title, style: TamgaTypography.title3()),
        actions: [
          IconButton(
            tooltip: 'Засах',
            icon: const Icon(Icons.edit_outlined),
            onPressed: _editEvent,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          // ── Event type badge ──
          _EventTypeBadge(event: widget.event),

          const SizedBox(height: AppSpacing.lg),

          // ── Date & Location ──
          _EventInfoSection(event: widget.event),

          const SizedBox(height: AppSpacing.lg),

          // ── Result (if completed) ──
          if (widget.event.result != null &&
              widget.event.result!.isNotEmpty) ...[
            _ResultSection(event: widget.event),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Organizer info ──
          if (widget.event.organizerName != null ||
              widget.event.organizerPhone != null ||
              widget.event.organizerEmail != null) ...[
            _OrganizerSection(event: widget.event),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Reminder button (Сануулах) ──
          if (widget.event.date != null &&
              widget.event.date!.isAfter(DateTime.now())) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _scheduleReminder,
                icon: const Icon(Icons.notifications_outlined),
                label: const Text('Сануулах'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Notes ──
          if (widget.event.notes != null && widget.event.notes!.isNotEmpty) ...[
            _NotesSection(event: widget.event),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Map preview ──
          if (widget.event.latitude != null &&
              widget.event.longitude != null) ...[
            EventMapPreview(
              latitude: widget.event.latitude,
              longitude: widget.event.longitude,
            ),
            const SizedBox(height: AppSpacing.sm),
            NavigateToLocationButton(
              latitude: widget.event.latitude,
              longitude: widget.event.longitude,
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ── Registered horses section ──
          registrationsAsync.when(
            data: (registrations) {
              final activeRegs = registrations
                  .where((r) => r.status != RegistrationStatus.cancelled)
                  .toList();

              return _RegisteredHorsesSection(
                registrations: activeRegs,
                horseNames: horseNames,
                currentUserId: userId,
                onCancel: _cancelRegistration,
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: LoadingIndicator(size: 24),
            ),
            error: (err, _) => TamgaErrorWidget(
              message: 'Бүртгэлүүдийг ачаалахад алдаа гарлаа',
              onRetry: () =>
                  ref.invalidate(eventRegistrationsProvider(widget.event.id)),
            ),
          ),

          const SizedBox(height: AppSpacing.xl),
        ],
      ),
      bottomNavigationBar: widget.event.registrationEnabled
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.sm,
                  AppSpacing.lg,
                  AppSpacing.lg,
                ),
                child: FilledButton.icon(
                  onPressed: _showRegisterHorseSheet,
                  icon: const Icon(Icons.add),
                  label: const Text('Морь бүртгүүлэх'),
                ),
              ),
            )
          : null,
    );
  }
}

// ── Event type badge ──────────────────────────────────────────────────

class _EventTypeBadge extends StatelessWidget {
  const _EventTypeBadge({required this.event});

  final Event event;

  IconData get _icon {
    switch (event.eventType) {
      case EventType.race:
        return Icons.speed;
      case EventType.auction:
        return Icons.gavel;
      case EventType.expo:
        return Icons.storefront;
      case EventType.training:
        return Icons.school;
    }
  }

  Color _color(BuildContext context) {
    final tc = TamgaColors.of(context);
    switch (event.eventType) {
      case EventType.race:
        return tc.primary;
      case EventType.auction:
        return tc.tertiary;
      case EventType.expo:
        return tc.secondary;
      case EventType.training:
        return AppColors.systemPurple;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _color(context);

    return Row(
      children: [
        CircleAvatar(
          backgroundColor: color,
          radius: 24,
          child: Icon(_icon, color: Colors.white, size: 22),
        ),
        const SizedBox(width: AppSpacing.md),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              event.eventType.displayName,
              style: TamgaTypography.title3(
                color: color,
                weight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              event.isUpcoming ? 'Удахгүй' : 'Дууссан',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Event info section (date, location) ─────────────────────────────

class _EventInfoSection extends StatelessWidget {
  const _EventInfoSection({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Мэдээлэл',
              style: TamgaTypography.title3(weight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.md),
            // Date
            if (event.date != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 18,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      '${event.date!.year}-${event.date!.month.toString().padLeft(2, '0')}-${event.date!.day.toString().padLeft(2, '0')}',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            // Location
            if (event.location != null && event.location!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    Icon(
                      Icons.place_outlined,
                      size: 18,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        event.location!,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            // Address
            if (event.address != null && event.address!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Row(
                  children: [
                    Icon(
                      Icons.location_city_outlined,
                      size: 18,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        event.address!,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            // Horse name
            if (event.horseName != null && event.horseName!.isNotEmpty)
              Row(
                children: [
                  Icon(
                    Icons.pets_outlined,
                    size: 18,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      event.horseName!,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

// ── Result section ───────────────────────────────────────────────────

class _ResultSection extends StatelessWidget {
  const _ResultSection({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Үр дүн',
              style: TamgaTypography.title3(weight: FontWeight.w600),
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
              child: Row(
                children: [
                  Icon(
                    Icons.emoji_events_outlined,
                    size: 20,
                    color: colorScheme.onTertiaryContainer,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      event.result!,
                      style: TamgaTypography.body(
                        weight: FontWeight.w500,
                        color: colorScheme.onTertiaryContainer,
                      ),
                    ),
                  ),
                  if (event.prizeAmount != null && event.prizeAmount! > 0) ...[
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
                        '${event.prizeAmount!}₮',
                        style: TamgaTypography.caption1(
                          weight: FontWeight.w600,
                          color: colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Organizer section ────────────────────────────────────────────────

class _OrganizerSection extends StatelessWidget {
  const _OrganizerSection({required this.event});

  final Event event;

  bool get _hasPhone =>
      event.organizerPhone != null && event.organizerPhone!.isNotEmpty;

  bool get _hasEmail =>
      event.organizerEmail != null && event.organizerEmail!.isNotEmpty;

  bool get _hasContact => _hasPhone || _hasEmail;

  /// Нээх: утасны апп (tel:) эсвэл имэйл апп (mailto:).
  Future<void> _contactOrganizer(BuildContext context) async {
    if (_hasPhone && _hasEmail) {
      // Хоёулаа байвал сонголттой bottom sheet харуулах.
      final action = await _showContactSheet(context);
      if (action == null) return;
      if (!context.mounted) return;
      if (action == 'phone') {
        await _launchPhone(context);
      } else if (action == 'email') {
        await _launchEmail(context);
      }
    } else if (_hasPhone) {
      await _launchPhone(context);
    } else if (_hasEmail) {
      await _launchEmail(context);
    }
  }

  /// Bottom sheet харуулж, хэрэглэгчийн сонголтыг буцаана ('phone' | 'email' | null).
  Future<String?> _showContactSheet(BuildContext context) {
    return showModalBottomSheet<String>(
      context: context,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
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
                  decoration: BoxDecoration(
                    color: Theme.of(
                      ctx,
                    ).colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Зарлагчтай холбогдох',
                style: TamgaTypography.title3(weight: FontWeight.w600),
              ),
              const SizedBox(height: AppSpacing.md),
              if (_hasPhone)
                ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: const Text('Засах/Захиалах'),
                  subtitle: Text(event.organizerPhone!),
                  onTap: () => Navigator.of(ctx).pop('phone'),
                ),
              if (_hasEmail)
                ListTile(
                  leading: const Icon(Icons.email_outlined),
                  title: const Text('Имэйл'),
                  subtitle: Text(event.organizerEmail!),
                  onTap: () => Navigator.of(ctx).pop('email'),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _launchPhone(BuildContext context) async {
    final uri = Uri.parse('tel:${event.organizerPhone!}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        TamgaToast.showError(context, 'Утас нээхэд алдаа гарлаа');
      }
    }
  }

  Future<void> _launchEmail(BuildContext context) async {
    final uri = Uri.parse('mailto:${event.organizerEmail!}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        TamgaToast.showError(context, 'Имэйл нээхэд алдаа гарлаа');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Зохион байгуулагч',
              style: TamgaTypography.title3(weight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.md),
            if (event.organizerName != null && event.organizerName!.isNotEmpty)
              _InfoRow(
                icon: Icons.person_outlined,
                text: event.organizerName!,
                colorScheme: colorScheme,
                theme: theme,
              ),
            if (_hasPhone)
              _InfoRow(
                icon: Icons.phone_outlined,
                text: event.organizerPhone!,
                colorScheme: colorScheme,
                theme: theme,
              ),
            if (_hasEmail)
              _InfoRow(
                icon: Icons.email_outlined,
                text: event.organizerEmail!,
                colorScheme: colorScheme,
                theme: theme,
              ),
            const SizedBox(height: AppSpacing.md),
            // "Зарлагчтай холбогдох" button — only when phone or email exists
            if (_hasContact)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _contactOrganizer(context),
                  icon: const Icon(Icons.contact_phone_outlined),
                  label: const Text('Зарлагчтай холбогдох'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.text,
    required this.colorScheme,
    required this.theme,
  });

  final IconData icon;
  final String text;
  final ColorScheme colorScheme;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(text, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

// ── Notes section ───────────────────────────────────────────────────

class _NotesSection extends StatelessWidget {
  const _NotesSection({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Тэмдэглэл',
              style: TamgaTypography.title3(weight: FontWeight.w600),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              event.notes!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Registered horses section ─────────────────────────────────────────

class _RegisteredHorsesSection extends StatelessWidget {
  const _RegisteredHorsesSection({
    required this.registrations,
    required this.horseNames,
    required this.currentUserId,
    required this.onCancel,
  });

  final List<EventRegistration> registrations;
  final Map<String, String> horseNames;
  final String? currentUserId;
  final ValueChanged<EventRegistration> onCancel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Card(
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
                    '${registrations.length}',
                    style: TamgaTypography.caption1(
                      weight: FontWeight.w600,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ],
            ),
            if (registrations.isEmpty) ...[
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
              ...registrations.map(
                (reg) => _RegisteredHorseTile(
                  registration: reg,
                  horseName: horseNames[reg.horseId] ?? reg.horseId,
                  isOwnedByCurrentUser: reg.ownerId == currentUserId,
                  onCancel: () => onCancel(reg),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RegisteredHorseTile extends StatelessWidget {
  const _RegisteredHorseTile({
    required this.registration,
    required this.horseName,
    required this.isOwnedByCurrentUser,
    required this.onCancel,
  });

  final EventRegistration registration;
  final String horseName;
  final bool isOwnedByCurrentUser;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: colorScheme.secondaryContainer,
            radius: 16,
            child: Icon(
              Icons.pets,
              size: 16,
              color: colorScheme.onSecondaryContainer,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  horseName,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  registration.status.displayName,
                  style: TamgaTypography.caption1(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          if (isOwnedByCurrentUser)
            TextButton.icon(
              onPressed: onCancel,
              icon: const Icon(Icons.cancel_outlined, size: 16),
              label: const Text('Цуцлах'),
              style: TextButton.styleFrom(
                foregroundColor: colorScheme.error,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Horse selection bottom sheet ──────────────────────────────────────

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
              style: TamgaTypography.title3(weight: FontWeight.w600),
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
                      subtitle: Text(
                        '${horse.birthYear} · ${horse.coat}',
                        style: TamgaTypography.caption1(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
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
