import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../application/auth_providers.dart';
import '../domain/auth_state.dart';
import 'auth_error_messages.dart';

/// Нэвтрэх дэлгэц.
///
/// Имэйл + нууц үгээр нэвтрэх, бүртгүүлэх, зочин хэрэглэгч үргэлжлүүлэх.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (kDebugMode) {
      _emailController.text = 'test@example.com';
      _passwordController.text = 'password123';
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(authStateProvider.notifier)
          .signInWithEmail(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );

      if (mounted) {
        final authState = ref.read(authStateProvider).valueOrNull;
        if (authState?.isAuthenticated ?? false) {
          context.go('/lineage');
        }
      }
    } catch (e) {
      setState(() => _errorMessage = formatAuthErrorMessage(e));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// Хоёр хэлээр (Монгол + Англи) алдааны текст харуулах.
  ///
  /// Текст нь `message\n\ntranslation` форматтай байх ба
  /// эхний мөрийг Монгол, хоёр дахь мөрийг Англи хэлээр харуулна.
  Widget _buildBilingualErrorText(String text, ThemeData theme) {
    final parts = text.split('\n');
    if (parts.length < 2) {
      return Text(
        text,
        style: TextStyle(color: theme.colorScheme.onErrorContainer),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          parts[0],
          style: TextStyle(
            color: theme.colorScheme.onErrorContainer,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          parts.sublist(1).join('\n'),
          style: TextStyle(
            color: theme.colorScheme.onErrorContainer.withValues(alpha: 0.85),
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Future<void> _handleGuestLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref.read(authStateProvider.notifier).signInAnonymously();

      if (mounted) {
        context.go('/lineage');
      }
    } catch (e) {
      setState(() => _errorMessage = formatAuthErrorMessage(e));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Хэрэв нэвтэрсэн бол шууд эхлэх хуудас руу шилжүүлнэ.
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (prev, next) {
      final state = next.valueOrNull;
      if (state?.isAuthenticated ?? false) {
        context.go('/lineage');
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Лого
                    Text('🐎', style: TextStyle(fontSize: 64)),
                    const SizedBox(height: 16),
                    Text(
                      'Адуучин',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Нэвтрэх',
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Алдааны мессеж
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Card(
                          color: theme.colorScheme.errorContainer,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Icon(
                                    Icons.error_outline,
                                    color: theme.colorScheme.onErrorContainer,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _buildBilingualErrorText(
                                    _errorMessage!,
                                    theme,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                    AutofillGroup(
                      child: Column(
                        children: [
                          // Имэйл талбар
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            autofillHints: kDebugMode
                                ? [AutofillHints.email]
                                : null,
                            decoration: const InputDecoration(
                              labelText: 'Имэйл',
                              hintText: 'name@example.com',
                              prefixIcon: Icon(Icons.email_outlined),
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Имэйл хаягаа оруулна уу';
                              }
                              if (!value.contains('@') ||
                                  !value.contains('.')) {
                                return 'Зөв имэйл хаяг оруулна уу';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Нууц үг талбар
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            autofillHints: kDebugMode
                                ? [AutofillHints.password]
                                : null,
                            decoration: const InputDecoration(
                              labelText: 'Нууц үг',
                              prefixIcon: Icon(Icons.lock_outline),
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Нууц үгээ оруулна уу';
                              }
                              if (value.length < 6) {
                                return 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой';
                              }
                              return null;
                            },
                            onFieldSubmitted: (_) => _handleLogin(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Нэвтрэх товч
                    FilledButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Нэвтрэх'),
                    ),
                    const SizedBox(height: 16),

                    // Бүртгүүлэх холбоос
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Бүртгүүлэх'),
                    ),
                    const SizedBox(height: 24),

                    // Зүсэлтийн шугам
                    Row(
                      children: [
                        const Expanded(child: Divider()),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'эсвэл',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                        const Expanded(child: Divider()),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Утасны дугаараар нэвтрэх
                    OutlinedButton.icon(
                      onPressed: _isLoading
                          ? null
                          : () => context.push('/phone-login'),
                      icon: const Icon(Icons.phone_outlined),
                      label: const Text('Утасны дугаараар нэвтрэх'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Google-аар нэвтрэх
                    OutlinedButton.icon(
                      onPressed: _isLoading
                          ? null
                          : () => ref
                                .read(authStateProvider.notifier)
                                .signInWithGoogle(),
                      icon: const Icon(Icons.g_mobiledata, size: 24),
                      label: const Text('Google-аар нэвтрэх'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Apple-аар нэвтрэх
                    OutlinedButton.icon(
                      onPressed: _isLoading
                          ? null
                          : () => ref
                                .read(authStateProvider.notifier)
                                .signInWithApple(),
                      icon: const Icon(Icons.apple, size: 24),
                      label: const Text('Apple-аар нэвтрэх'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Зочин хэрэглэгч үргэлжлүүлэх
                    OutlinedButton(
                      onPressed: _isLoading ? null : _handleGuestLogin,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: const Text('Зочин хэрэглэгч'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
