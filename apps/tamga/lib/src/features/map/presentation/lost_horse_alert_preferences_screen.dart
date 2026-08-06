import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/lost_horse_alert_providers.dart';
import '../application/lost_horse_filters.dart';
import '../domain/lost_horse_alert_subscription.dart';

/// Lets a user opt into regional lost-horse push alerts.
class LostHorseAlertPreferencesScreen extends ConsumerStatefulWidget {
  const LostHorseAlertPreferencesScreen({super.key});

  @override
  ConsumerState<LostHorseAlertPreferencesScreen> createState() =>
      _LostHorseAlertPreferencesScreenState();
}

class _LostHorseAlertPreferencesScreenState
    extends ConsumerState<LostHorseAlertPreferencesScreen> {
  String? _aimag;
  final _sumController = TextEditingController();
  final _bagController = TextEditingController();
  bool _pushEnabled = true;
  bool _smsEnabled = false;
  bool _saving = false;

  @override
  void dispose() {
    _sumController.dispose();
    _bagController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final subscriptions = ref.watch(lostHorseAlertSubscriptionsProvider);

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: Text('Морь олдсон мэдэгдэл', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        children: [
          // ── Intro card ────────────────────────────────────────
          TamgaCard(
            showTopAccent: true,
            accentColor: colors.primary,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.notifications_active_outlined,
                  color: colors.primary,
                ),
                const SizedBox(width: TamgaSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Таны сонгосон бүсэд шинэ хаяж морь бүртгэгдэхэд push мэдэгдэл авна.',
                        style: TamgaTypography.body(weight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Get notified when a new lost-horse report appears nearby.',
                        style: TamgaTypography.caption1(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),

          // ── Region form ───────────────────────────────────────
          Text(
            'Бүс сонгох',
            style: TamgaTypography.footnote(
              weight: FontWeight.w600,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          DropdownButtonFormField<String>(
            initialValue: _aimag,
            decoration: const InputDecoration(
              labelText: 'Аймаг / Aimag',
              border: OutlineInputBorder(),
            ),
            items: kAimags
                .map(
                  (aimag) => DropdownMenuItem(value: aimag, child: Text(aimag)),
                )
                .toList(),
            onChanged: (value) => setState(() => _aimag = value),
          ),
          const SizedBox(height: TamgaSpacing.md),
          TextField(
            controller: _sumController,
            decoration: const InputDecoration(
              labelText: 'Сум (заавал биш) / Sum (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: TamgaSpacing.md),
          TextField(
            controller: _bagController,
            decoration: const InputDecoration(
              labelText: 'Баг (заавал биш) / Bag (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: TamgaSpacing.md),

          // ── Channel toggles ───────────────────────────────────
          TamgaCard(
            padding: const EdgeInsets.symmetric(
              horizontal: TamgaSpacing.md,
              vertical: TamgaSpacing.xs,
            ),
            child: Column(
              children: [
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Push мэдэгдэл / Push alerts'),
                  value: _pushEnabled,
                  onChanged: (value) => setState(() => _pushEnabled = value),
                ),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('SMS мэдэгдэл / SMS alerts'),
                  subtitle: const Text(
                    'Зөвхөн бүртгэлтэй утасны дугаарт / To your verified phone',
                  ),
                  value: _smsEnabled,
                  onChanged: (value) => setState(() => _smsEnabled = value),
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),
          FilledButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.notifications_active_outlined),
            label: const Text('Мэдэгдэл идэвхжүүлэх / Enable alerts'),
          ),
          const SizedBox(height: TamgaSpacing.xl),

          // ── Active regions ────────────────────────────────────
          Text(
            'Идэвхтэй бүсүүд / Active regions',
            style: TamgaTypography.title3(weight: FontWeight.w600),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          subscriptions.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, _) => TamgaCard(
              child: Row(
                children: [
                  const Icon(Icons.error_outline, size: 20),
                  const SizedBox(width: TamgaSpacing.sm),
                  const Expanded(
                    child: Text('Мэдэгдлийн бүсүүд ачаалахад алдаа гарлаа'),
                  ),
                  TextButton(
                    onPressed: () =>
                        ref.invalidate(lostHorseAlertSubscriptionsProvider),
                    child: const Text('Дахин оролдох'),
                  ),
                ],
              ),
            ),
            data: (items) {
              if (items.isEmpty) {
                return const EmptyState(
                  icon: Icons.location_off_outlined,
                  title: 'Одоогоор идэвхтэй бүс алга',
                  description: 'Дээрх маягтаар эхний бүсээ нэмнэ үү',
                  compact: true,
                );
              }
              return Column(children: _subscriptionTiles(items));
            },
          ),
        ],
      ),
    );
  }

  List<Widget> _subscriptionTiles(List<LostHorseAlertSubscription> items) {
    return [
      for (final item in items)
        TamgaCard(
          margin: const EdgeInsets.only(bottom: TamgaSpacing.sm),
          // Transparent Material keeps ListTile ink under its own ancestor.
          child: Material(
            type: MaterialType.transparency,
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: TamgaSpacing.md,
              ),
              leading: const Icon(Icons.location_on_outlined),
              title: Text(item.locationAimag),
              subtitle: Text(
                [item.locationSum, item.locationBag]
                    .whereType<String>()
                    .where((value) => value.isNotEmpty)
                    .join(' · '),
              ),
              trailing: item.id == null
                  ? null
                  : IconButton(
                      tooltip: 'Устгах / Remove',
                      icon: const Icon(Icons.notifications_off_outlined),
                      onPressed: () => _revoke(item.id!),
                    ),
            ),
          ),
        ),
    ];
  }

  Future<void> _save() async {
    final userId = currentSupabaseUserId();
    if (userId == null || _aimag == null) {
      _showMessage('Нэвтэрч, аймаг сонгоно уу / Sign in and choose an aimag.');
      return;
    }

    setState(() => _saving = true);
    try {
      final subscription = LostHorseAlertSubscription(
        userId: userId,
        locationAimag: _aimag!,
        locationSum: _sumController.text.trim().isEmpty
            ? null
            : _sumController.text.trim(),
        locationBag: _bagController.text.trim().isEmpty
            ? null
            : _bagController.text.trim(),
        pushEnabled: _pushEnabled,
        smsEnabled: _smsEnabled,
      );
      await ref.read(
        saveLostHorseAlertSubscriptionProvider(subscription).future,
      );
      if (mounted) _showMessage('Мэдэгдэл идэвхжлээ / Alerts enabled.');
    } catch (error) {
      if (mounted) _showMessage('Хадгалж чадсангүй: $error');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _revoke(String id) async {
    try {
      await ref.read(revokeLostHorseAlertSubscriptionProvider(id).future);
      if (mounted) _showMessage('Мэдэгдэл устгагдлаа / Alert removed.');
    } catch (error) {
      if (mounted) _showMessage('Устгаж чадсангүй: $error');
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}
