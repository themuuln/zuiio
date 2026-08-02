import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/auth_providers.dart';
import '../../auth/domain/auth_state.dart';
import '../../onboarding/application/onboarding_providers.dart';
import '../../shared/presentation/offline_banner.dart';
import '../../../app/app_config.dart';
import '../../../core/sync/connection_status.dart';
import '../../shared/application/sync_providers.dart';
import 'feature_tour.dart';
import 'fab_menu.dart';
import '../../../core/widgets/tamga_bottom_nav.dart';

/// The primary product jobs shown in the persistent navigation bar.
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
  List<TamgaNavItem> _buildDestinations() {
    return const [
      TamgaNavItem(
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: 'Нүүр',
      ),
      TamgaNavItem(
        icon: Icons.pets_outlined,
        activeIcon: Icons.pets,
        label: 'Морьд',
      ),
      TamgaNavItem(
        icon: Icons.event_note_outlined,
        activeIcon: Icons.event_note,
        label: 'Арчилгаа',
      ),
      TamgaNavItem(
        icon: Icons.account_tree_outlined,
        activeIcon: Icons.account_tree,
        label: 'Угшил',
      ),
      TamgaNavItem(
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        label: 'Зах',
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
    final authState = ref.watch(authStateProvider).valueOrNull;
    final isUnauthenticated =
        authState != null && authState.status == AuthStatus.unauthenticated;
    final isAnonymous = authState != null && authState.isAnonymous;
    final onboardingCompleted = ref.watch(onboardingCompletedProvider);
    final showGuestBanner =
        onboardingCompleted && (isUnauthenticated || isAnonymous);
    final connectionMonitor = ref.watch(connectionMonitorProvider);

    return StreamBuilder<ConnectionStatus>(
      stream: connectionMonitor.status,
      initialData: connectionMonitor.current,
      builder: (context, snapshot) {
        final isOffline = snapshot.data == ConnectionStatus.offline;
        final shellStack = Stack(
          children: [
            widget.navigationShell,
            if (showGuestBanner)
              Positioned(
                left: 16,
                right: 16,
                bottom: MediaQuery.of(context).padding.bottom + 16,
                child: _GuestRegistrationPrompt(
                  onRegister: () => context.push('/register'),
                ),
              ),
            if (AppConfig.featureTourEnabled &&
                _tourChecked &&
                !_tourCompleted &&
                onboardingCompleted)
              FeatureTour(onCompleted: _onTourCompleted),
            // Positioned inside the (bounded) shell Stack — NOT the Scaffold
            // FAB slot, which lays out with tight width and UNBOUNDED height
            // (Stack requires bounded constraints and would assert at runtime,
            // cascading into semantics/parentDataDirty failures under XCTest).
            if (!showGuestBanner)
              const Positioned(right: 0, bottom: 0, child: FabMenu()),
          ],
        );

        return Scaffold(
          body: Column(
            children: [
              if (isOffline)
                const SafeArea(
                  top: true,
                  bottom: false,
                  child: OfflineBanner(),
                ),
              Expanded(
                child: isOffline
                    ? MediaQuery.removePadding(
                        context: context,
                        removeTop: true,
                        child: shellStack,
                      )
                    : shellStack,
              ),
            ],
          ),
          // Mounted inside the shell Stack (bounded constraints) — the
          // Scaffold FAB slot provides unbounded height and crashes the
          // all-Positioned menu Stack at runtime.
          bottomNavigationBar: TamgaBottomNav(
            currentIndex: widget.navigationShell.currentIndex,
            items: _buildDestinations(),
            onTap: (index) {
              HapticFeedback.selectionClick();
              widget.navigationShell.goBranch(
                index,
                initialLocation: index == widget.navigationShell.currentIndex,
              );
            },
          ),
        );
      },
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
    );
  }
}
