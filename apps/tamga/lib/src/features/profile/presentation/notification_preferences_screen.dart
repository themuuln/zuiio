import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/domain/notification_preferences.dart';
import '../../../core/widgets/widgets.dart';

/// Мэдэгдлийн тохиргооны дэлгэц — хэрэглэгч бүр мэдэгдлүүдийг идэвхжүүлэх/унтраах боломжтой.
class NotificationPreferencesScreen extends ConsumerStatefulWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  ConsumerState<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends ConsumerState<NotificationPreferencesScreen> {
  NotificationPreferences? _preferences;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) {
        setState(() {
          _preferences = NotificationPreferences.defaults;
          _isLoading = false;
        });
        return;
      }

      final response = await client
          .from('profiles')
          .select(
            'notifications_enabled, '
            'notify_health_reminders, '
            'notify_breeding_alerts, '
            'notify_market_updates, '
            'notify_geofence_alerts, '
            'notify_payment_notifications',
          )
          .eq('id', userId)
          .maybeSingle();

      if (response == null) {
        setState(() {
          _preferences = NotificationPreferences.defaults;
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _preferences = NotificationPreferences(
          notificationsEnabled:
              response['notifications_enabled'] as bool? ?? true,
          healthRemindersEnabled:
              response['notify_health_reminders'] as bool? ?? true,
          breedingAlertsEnabled:
              response['notify_breeding_alerts'] as bool? ?? true,
          marketUpdatesEnabled:
              response['notify_market_updates'] as bool? ?? true,
          geofenceAlertsEnabled:
              response['notify_geofence_alerts'] as bool? ?? true,
          paymentNotificationsEnabled:
              response['notify_payment_notifications'] as bool? ?? true,
        );
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _savePreferences(NotificationPreferences prefs) async {
    setState(() => _isSaving = true);

    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return;

      await client
          .from('profiles')
          .update({
            'notifications_enabled': prefs.notificationsEnabled,
            'notify_health_reminders': prefs.healthRemindersEnabled,
            'notify_breeding_alerts': prefs.breedingAlertsEnabled,
            'notify_market_updates': prefs.marketUpdatesEnabled,
            'notify_geofence_alerts': prefs.geofenceAlertsEnabled,
            'notify_payment_notifications': prefs.paymentNotificationsEnabled,
          })
          .eq('id', userId);

      setState(() {
        _preferences = prefs;
        _isSaving = false;
      });

      if (mounted) {
        TamgaToast.showSuccess(context, 'Тохиргоо хадгалагдлаа');
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        TamgaToast.showError(context, 'Алдаа: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Мэдэгдлийн тохиргоо'),
        actions: [
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? SkeletonLoader(
              items: 6,
              itemBuilder: (ctx, i) => const SkeletonListTile(showTrailing: false),
            )
          : _error != null
          ? TamgaErrorWidget(
              message: _error!,
              onRetry: () {
                setState(() {
                  _isLoading = true;
                  _error = null;
                });
                _loadPreferences();
              },
            )
          : _buildPreferencesList(theme),
    );
  }

  Widget _buildPreferencesList(ThemeData theme) {
    final prefs = _preferences ?? NotificationPreferences.defaults;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: SwitchListTile(
            value: prefs.notificationsEnabled,
            title: const Text('Бүх мэдэгдэл'),
            subtitle: const Text('Бүх мэдэгдлийг идэвхжүүлэх/унтраах'),
            onChanged: _isSaving
                ? null
                : (value) => _savePreferences(
                    prefs.copyWith(notificationsEnabled: value),
                  ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Мэдэгдлийн төрөл',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Тус бүрийн мэдэгдлийг идэвхжүүлэх эсвэл унтраана уу.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        _PreferenceTile(
          title: 'Эрүүл мэндийн сануулга',
          subtitle: 'Вакцин, тахлах, эмчийн үзлэг',
          icon: Icons.medical_services_outlined,
          value: prefs.healthRemindersEnabled,
          enabled: prefs.notificationsEnabled,
          onChanged: _isSaving
              ? null
              : (value) => _savePreferences(
                  prefs.copyWith(healthRemindersEnabled: value),
                ),
        ),
        _PreferenceTile(
          title: 'Төллөлтийн огноо',
          subtitle: 'Төллөлтийн огнооны сануулга',
          icon: Icons.pets_outlined,
          value: prefs.breedingAlertsEnabled,
          enabled: prefs.notificationsEnabled,
          onChanged: _isSaving
              ? null
              : (value) => _savePreferences(
                  prefs.copyWith(breedingAlertsEnabled: value),
                ),
        ),
        _PreferenceTile(
          title: 'Зах зээлийн шинэчлэл',
          subtitle: 'Зар сонирхсон хүн, шинэ зар',
          icon: Icons.store_outlined,
          value: prefs.marketUpdatesEnabled,
          enabled: prefs.notificationsEnabled,
          onChanged: _isSaving
              ? null
              : (value) => _savePreferences(
                  prefs.copyWith(marketUpdatesEnabled: value),
                ),
        ),
        _PreferenceTile(
          title: 'Геоференцийн мэдэгдэл',
          subtitle: 'Хаяж морь, хайх бүс',
          icon: Icons.location_on_outlined,
          value: prefs.geofenceAlertsEnabled,
          enabled: prefs.notificationsEnabled,
          onChanged: _isSaving
              ? null
              : (value) => _savePreferences(
                  prefs.copyWith(geofenceAlertsEnabled: value),
                ),
        ),
        _PreferenceTile(
          title: 'Төлбөр баталгаажсан',
          subtitle: 'Төлбөр баталгаажсан мэдэгдэл',
          icon: Icons.payment_outlined,
          value: prefs.paymentNotificationsEnabled,
          enabled: prefs.notificationsEnabled,
          onChanged: _isSaving
              ? null
              : (value) => _savePreferences(
                  prefs.copyWith(paymentNotificationsEnabled: value),
                ),
        ),
      ],
    );
  }
}

class _PreferenceTile extends StatelessWidget {
  const _PreferenceTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.value,
    required this.enabled,
    this.onChanged,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool value;
  final bool enabled;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: SwitchListTile(
        secondary: Icon(
          icon,
          color: enabled
              ? theme.colorScheme.primary
              : theme.colorScheme.onSurfaceVariant,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: enabled ? null : theme.colorScheme.onSurfaceVariant,
          ),
        ),
        subtitle: Text(subtitle),
        value: value,
        onChanged: enabled ? onChanged : null,
      ),
    );
  }
}
