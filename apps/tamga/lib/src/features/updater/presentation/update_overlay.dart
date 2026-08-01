import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/upgrade_provider.dart';
import '../domain/app_version.dart';

/// Overlay widget that shows an update banner when a new version is available.
///
/// Place this near the root of the widget tree. It displays a Material banner
/// at the top of the screen when an update is available, with download progress
/// and install/cancel buttons.
class UpdateOverlay extends ConsumerStatefulWidget {
  const UpdateOverlay({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<UpdateOverlay> createState() => _UpdateOverlayState();
}

class _UpdateOverlayState extends ConsumerState<UpdateOverlay> {
  AppVersion? _availableVersion;
  bool _dismissed = false;
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    // Defer to post-frame callback to avoid triggering Riverpod
    // provider creation during ProviderScope mount (issue #4781).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _checkForUpdate();
    });
  }

  Future<void> _checkForUpdate() async {
    setState(() => _isChecking = true);
    final version = await ref.read(upgradeActionProvider.notifier).check();
    if (mounted) {
      setState(() {
        _availableVersion = version;
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final installInProgress = ref.watch(updateInstallInProgressProvider);
    final error = ref.watch(updateErrorProvider);

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Stack(
        children: [
          widget.child,
          if (!_isChecking && _availableVersion != null && !_dismissed)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Material(
                elevation: 4,
                color: Theme.of(context).colorScheme.primaryContainer,
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ── Header ──
                        Row(
                          children: [
                            Icon(
                              Icons.system_update_rounded,
                              color: Theme.of(
                                context,
                              ).colorScheme.onPrimaryContainer,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Шинэ хувилбар ${_availableVersion!.versionName}',
                                style: Theme.of(context).textTheme.titleSmall
                                    ?.copyWith(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.onPrimaryContainer,
                                    ),
                              ),
                            ),
                            if (!installInProgress)
                              IconButton(
                                icon: const Icon(Icons.close, size: 18),
                                onPressed: () =>
                                    setState(() => _dismissed = true),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                color: Theme.of(
                                  context,
                                ).colorScheme.onPrimaryContainer,
                              ),
                          ],
                        ),
                        if (_availableVersion!.changelog.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            _availableVersion!.changelog,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onPrimaryContainer
                                      .withValues(alpha: 0.8),
                                ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 8),
                        // ── Error message ──
                        if (error != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text(
                              error,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Theme.of(context).colorScheme.error,
                                  ),
                            ),
                          ),
                        // ── Action buttons ──
                        if (installInProgress)
                          const LinearProgressIndicator()
                        else
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () =>
                                    setState(() => _dismissed = true),
                                child: const Text('Дараа'),
                              ),
                              const SizedBox(width: 8),
                              FilledButton.icon(
                                onPressed: () => _installUpdate(),
                                icon: const Icon(Icons.download, size: 18),
                                label: const Text('Шинэчлэх'),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _installUpdate() async {
    if (_availableVersion == null) return;
    await ref
        .read(upgradeActionProvider.notifier)
        .downloadAndInstall(_availableVersion!);
  }
}
