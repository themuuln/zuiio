import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/auth_providers.dart';
import '../../auth/domain/auth_state.dart';
import '../../market/application/message_providers.dart';
import '../../onboarding/application/onboarding_providers.dart';
import '../../shared/application/sync_providers.dart';
import '../../shared/presentation/offline_banner.dart';
import '../../profile/application/cloud_sync_coordinator.dart';
import '../../../app/app_config.dart';
import 'feature_tour.dart';
import 'fab_menu.dart';
import 'quick_actions.dart';

/// Тухайн хэрэглэгчийн role-оос хамаарч өөр өөр хурдан үйлдлүүд гаргана.
class AppShell extends ConsumerStatefulWidget {
  const AppShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  bool _tourCompleted = false;
  bool _tourChecked = false;

  // ── Bottom navigation destinations ──
  List<NavigationDestination> _buildDestinations(
    AuthState? authState,
    int unreadCount,
  ) {
    final displayName = authState?.displayName ?? 'Хэрэглэгч';
    final avatarUrl = authState?.avatarUrl;

    return [
      const NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        label: 'Нүүр',
      ),
      const NavigationDestination(
        icon: Icon(Icons.storefront_outlined),
        selectedIcon: Icon(Icons.storefront),
        label: 'Арилжаа',
      ),
      const NavigationDestination(
        icon: Icon(Icons.emoji_events_outlined),
        selectedIcon: Icon(Icons.emoji_events),
        label: 'Уралдаан',
      ),
      const NavigationDestination(
        icon: Icon(Icons.search_off_outlined),
        selectedIcon: Icon(Icons.search_off),
        label: 'Эрэл хайгуул',
      ),
      NavigationDestination(
        icon: Badge(
          isLabelVisible: unreadCount > 0,
          label: Text('$unreadCount'),
          child: _ProfileAvatar(
            name: displayName,
            imageUrl: avatarUrl,
            isSelected: false,
          ),
        ),
        selectedIcon: Badge(
          isLabelVisible: unreadCount > 0,
          label: Text('$unreadCount'),
          child: _ProfileAvatar(
            name: displayName,
            imageUrl: avatarUrl,
            isSelected: true,
          ),
        ),
        label: 'Профайл',
      ),
    ];
  }

  @override
  void initState() {
    super.initState();
    _checkTourStatus();
  }

  Future<void> _checkTourStatus() async {
    final completed = await isFeatureTourCompleted();
    if (mounted) {
      setState(() {
        _tourCompleted = completed;
        _tourChecked = true;
      });
    }
  }

  void _onTourCompleted() {
    setState(() => _tourCompleted = true);
  }

  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authStateProvider);
    final authState = authAsync.valueOrNull;
    final isUnauthenticated =
        authState != null && authState.status == AuthStatus.unauthenticated;
    final isAnonymous = authState != null && authState.isAnonymous;
    final onboardingCompleted = ref.watch(onboardingCompletedProvider);
    final syncState = ref.watch(syncStateProvider);

    // Зочин хэрэглэгчид харуулах мөр: onboarding дууссан + нэвтрээгүй/зочин
    final showGuestBanner =
        onboardingCompleted && (isUnauthenticated || isAnonymous);

    // Хэрэглэгчийн үүрэг (role) - QuickActions-д ашиглана.
    final onboardingAsync = ref.watch(onboardingProvider);
    final userRole = onboardingAsync.when(
      data: (data) => data.userRole ?? 'casual',
      loading: () => 'casual',
      error: (_, _) => 'casual',
    );

    // Хянах таб эсэх (home tab = index 0)
    final isHomeTab = widget.navigationShell.currentIndex == 0;

    final showQuickActions = _tourChecked && _tourCompleted && isHomeTab;

    return Scaffold(
      body: Stack(
        children: [
          // Navigation content
          widget.navigationShell,

          // Top overlays — OfflineBanner, Quick actions + sync status in a
          // Column for layout-based positioning.
          Positioned(
            top: MediaQuery.of(context).padding.top,
            left: 0,
            right: 0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const OfflineBanner(),
                if (showQuickActions) QuickActions(userRole: userRole),
                if (syncState.status != SyncStatus.idle)
                  _SyncStatusBar(syncState: syncState),
              ],
            ),
          ),

          // Зочин хэрэглэгчид зориулсан бүртгэлийн сануулга
          // — layout-based positioning using safe area insets
          if (showGuestBanner)
            Positioned(
              left: 16,
              right: 80,
              bottom: MediaQuery.of(context).padding.bottom + 16,
              child: _GuestRegistrationPrompt(
                onRegister: () => context.push('/register'),
              ),
            ),

          // Feature tour overlay — AppConfig.featureTourEnabled нөхцөлтэй
          if (AppConfig.featureTourEnabled &&
              _tourChecked &&
              !_tourCompleted &&
              onboardingCompleted)
            FeatureTour(onCompleted: _onTourCompleted),

          // Floating action button menu — бүх нэмэх үйлдлүүд нэг дороо
          if (onboardingCompleted)
            const Positioned.fill(child: FabMenu()),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: widget.navigationShell.currentIndex,
        destinations: _buildDestinations(
          authState,
          ref.watch(inboxUnreadCountProvider).valueOrNull ?? 0,
        ),
        onDestinationSelected: (index) {
          HapticFeedback.selectionClick();
          widget.navigationShell.goBranch(
            index,
            initialLocation: index == widget.navigationShell.currentIndex,
          );
        },
      ),
    );
  }
}

class _GuestRegistrationPrompt extends StatelessWidget {
  const _GuestRegistrationPrompt({required this.onRegister});
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      top: false,
      child: Material(
        elevation: 6,
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.cloud_upload_outlined,
                  size: 18,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Өгөгдөө хамгаалахын тулд бүртгүүлнэ үү',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.tonal(
                onPressed: onRegister,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
                child: const Text('Бүртгүүлэх'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sync төлөвийн дээд мөр — syncing/spinner, synced/time, err/retry.
class _SyncStatusBar extends ConsumerWidget {
  const _SyncStatusBar({required this.syncState});
  final SyncState syncState;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Material(
      elevation: 2,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        color: _backgroundColor(theme),
        child: Row(
          children: [
            _buildIcon(theme),
            const SizedBox(width: 8),
            Expanded(child: _buildText(theme)),
            if (syncState.status == SyncStatus.error)
              IconButton(
                icon: const Icon(Icons.refresh, size: 18),
                onPressed: () {
                  ref.read(syncStateProvider.notifier).triggerSync();
                },
                tooltip: 'Дахин оролдох',
              ),
          ],
        ),
      ),
    );
  }

  Color _backgroundColor(ThemeData theme) => switch (syncState.status) {
    SyncStatus.syncing => theme.colorScheme.secondaryContainer,
    SyncStatus.synced => theme.colorScheme.tertiaryContainer,
    SyncStatus.error => theme.colorScheme.errorContainer,
    SyncStatus.idle => Colors.transparent,
  };

  Widget _buildIcon(ThemeData theme) => switch (syncState.status) {
    SyncStatus.syncing => SizedBox(
      width: 14,
      height: 14,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: theme.colorScheme.onSecondaryContainer,
      ),
    ),
    SyncStatus.synced => Icon(
      Icons.cloud_done_outlined,
      size: 16,
      color: theme.colorScheme.onTertiaryContainer,
    ),
    SyncStatus.error => Icon(
      Icons.cloud_off_outlined,
      size: 16,
      color: theme.colorScheme.onErrorContainer,
    ),
    SyncStatus.idle => const SizedBox.shrink(),
  };

  Widget _buildText(ThemeData theme) {
    final textStyle = theme.textTheme.bodySmall;
    return switch (syncState.status) {
      SyncStatus.syncing => Text(
        'Синхрончлол явагдаж байна...',
        style: textStyle?.copyWith(
          color: theme.colorScheme.onSecondaryContainer,
        ),
      ),
      SyncStatus.synced => Text(
        _formatLastSyncTime(syncState.lastSyncTime, theme),
        style: textStyle?.copyWith(
          color: theme.colorScheme.onTertiaryContainer,
        ),
      ),
      SyncStatus.error => Text(
        syncState.errorMessage ?? 'Синхрончлолд алдаа гарлаа',
        style: textStyle?.copyWith(color: theme.colorScheme.onErrorContainer),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      SyncStatus.idle => const SizedBox.shrink(),
    };
  }

  String _formatLastSyncTime(DateTime? time, ThemeData theme) {
    if (time == null) return 'Синхрончлогдсон';
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return 'Саяхан синхрончлогдсон';
    if (diff.inHours < 1) {
      return '${diff.inMinutes} минутын өмнө синхрончлогдсон';
    }
    if (diff.inDays < 1) return '${diff.inHours} цагийн өмнө синхрончлогдсон';
    return '${diff.inDays} хоногийн өмнө синхрончлогдсон';
  }
}

/// Bottom navigation-д ашиглагдах профайл зураг.
/// Facebook-ийн адил: зураг байвал зураг, байвал initials эсвэл placeholder.
class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.name,
    this.imageUrl,
    required this.isSelected,
  });

  final String name;
  final String? imageUrl;
  final bool isSelected;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final size = isSelected ? 28.0 : 24.0;

    // Зураг байвал зураг харуулна
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isSelected ? colorScheme.primary : Colors.transparent,
            width: 2,
          ),
          image: DecorationImage(
            image: NetworkImage(imageUrl!),
            fit: BoxFit.cover,
          ),
        ),
      );
    }

    // Зураггүй бол initials эсвэл placeholder харуулна
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isSelected
            ? colorScheme.primary.withValues(alpha: 0.15)
            : colorScheme.surfaceContainerHighest,
        border: Border.all(
          color: isSelected ? colorScheme.primary : Colors.transparent,
          width: 2,
        ),
      ),
      child: Center(
        child: Text(
          _initials,
          style: TextStyle(
            fontSize: size * 0.4,
            fontWeight: FontWeight.w600,
            color: isSelected
                ? colorScheme.primary
                : colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
