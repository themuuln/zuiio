import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/tamga_design_system.dart';
import '../core/widgets/splash_screen.dart';
import '../features/auth/application/auth_providers.dart';
import '../features/auth/domain/auth_state.dart';
import 'router/app_router.dart';

/// Tamga-ийн үндсэн апп компонент.
///
/// Auth төлөв ачааллаж байх үед SplashScreen харуулж,
/// ачаалласны дараа MaterialApp.router руу шилжинэ.
///
/// Сессийн хугацаа дууссан үед re-auth dialog харуулна.
class TamgaApp extends ConsumerStatefulWidget {
  const TamgaApp({super.key});

  @override
  ConsumerState<TamgaApp> createState() => _TamgaAppState();
}

class _TamgaAppState extends ConsumerState<TamgaApp> {
  bool _isShowingReAuthDialog = false;

  @override
  Widget build(BuildContext context) {
    // Auth state өөрчлөгдөхөд GoRouter redirect-ийг дахин үнэлэх
    // Use global ValueNotifier directly (no ref.read) to avoid
    // Riverpod setState during ProviderScope mount (#4781).
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (_, _) {
      routerRefreshNotifier.value++;
    });

    // Сессийн хугацаа дууссан үед re-auth dialog харуулах
    ref.listen<AsyncValue<void>>(sessionExpiredProvider, (prev, next) {
      // Эхний subscribed үед prev == null байна — алгасах.
      if (prev == null) return;

      next.whenOrNull(
        data: (_) {
          if (!mounted || _isShowingReAuthDialog) return;
          _showReAuthDialog();
        },
      );
    });

    final authAsync = ref.watch(authStateProvider);
    final isLoading = authAsync.valueOrNull?.isLoading ?? true;
    final router = ref.watch(appRouterProvider);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeInOut,
      switchOutCurve: Curves.easeInOut,
      child: isLoading
          ? _SplashApp(key: const ValueKey('splash'))
          : TamgaDesignSystem.wrapApp(
              child: MaterialApp.router(
                key: const ValueKey('app'),
                title: 'Tamga',
                debugShowCheckedModeBanner: false,
                theme: TamgaDesignSystem.buildThemeData(Brightness.light),
                darkTheme: TamgaDesignSystem.buildThemeData(Brightness.dark),
                themeMode: ThemeMode.system,
                routerConfig: router,
              ),
            ),
    );
  }

  /// Сессийн хугацаа дууссаныг мэдэгдэх re-auth dialog харуулах.
  void _showReAuthDialog() {
    _isShowingReAuthDialog = true;

    // Одоогийн чиглэлийг хадгалах — дахин нэвтрэхэд сэргээхэд зориулав.
    final currentRoute = GoRouterState.of(context).uri.toString();
    ref.read(preservedRouteAfterReAuthProvider.notifier).state = currentRoute;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Сессийн хугацаа дууссан / Session Expired'),
        content: const Text(
          'Таны нэвтрэх эрхийн хугацаа дууссан. Дахин нэвтрэнэ үү.\n\n'
          'Your session has expired. Please sign in again.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _isShowingReAuthDialog = false;
              context.go('/login');
            },
            child: const Text('Нэвтрэх / Sign In'),
          ),
        ],
      ),
    ).then((_) {
      // Dialog хаагдсаны дараа тэмдэглэгээг цэвэрлэх.
      _isShowingReAuthDialog = false;
    });
  }
}

/// SplashScreen-ийг MaterialApp дотор харуулах туслах widget.
///
/// SplashScreen нь TamgaColors-ыг ашигладаг тул
/// MaterialApp-ийн theme дотор байх шаардлагатай.
class _SplashApp extends StatelessWidget {
  const _SplashApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: const SplashScreen(),
    );
  }
}
