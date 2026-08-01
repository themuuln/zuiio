import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../app/theme/app_spacing.dart';
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
    final subscriptions = ref.watch(lostHorseAlertSubscriptionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Морь олдсон мэдэгдэл')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text(
            'Таны сонгосон бүсэд шинэ хаяж морь бүртгэгдэхэд push мэдэгдэл авна.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Get notified when a new lost-horse report appears nearby.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
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
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _sumController,
            decoration: const InputDecoration(
              labelText: 'Сум (заавал биш) / Sum (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _bagController,
            decoration: const InputDecoration(
              labelText: 'Баг (заавал биш) / Bag (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
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
          const SizedBox(height: AppSpacing.md),
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
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Идэвхтэй бүсүүд / Active regions',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.sm),
          subscriptions.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Text('Алдаа гарлаа: $error'),
            data: (items) {
              if (items.isEmpty) {
                return const Text('Одоогоор идэвхтэй бүс алга.');
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
        Card(
          child: ListTile(
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
