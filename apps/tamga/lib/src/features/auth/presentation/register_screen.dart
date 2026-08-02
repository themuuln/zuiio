import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/auth_providers.dart';
import '../domain/auth_state.dart';
import 'auth_error_messages.dart';

/// Бүртгүүлэх дэлгэц.
///
/// Имэйл, нууц үг, нэрээр бүртгүүлэх.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (kDebugMode) {
      _nameController.text = 'Test User';
      _emailController.text = 'test@example.com';
      _passwordController.text = 'Password123!';
      _confirmPasswordController.text = 'Password123!';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(authStateProvider.notifier)
          .signUpWithEmail(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            displayName: _nameController.text.trim().isNotEmpty
                ? _nameController.text.trim()
                : null,
          );

      if (mounted) {
        final authState = ref.read(authStateProvider).valueOrNull;
        if (authState?.isAuthenticated ?? false) {
          context.go('/home');
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
    final onErrorContainer = theme.colorScheme.onErrorContainer;
    final parts = text.split('\n');
    if (parts.length < 2) {
      return Text(text, style: TamgaTypography.body(color: onErrorContainer));
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          parts[0],
          style: TamgaTypography.body(
            weight: FontWeight.w600,
            color: onErrorContainer,
          ),
        ),
        const SizedBox(height: TamgaSpacing.xs),
        Text(
          parts.sublist(1).join('\n'),
          style: TamgaTypography.footnote(
            color: onErrorContainer.withValues(alpha: 0.85),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Хэрэв нэвтэрсэн бол шууд эхлэх хуудас руу шилжүүлнэ.
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (prev, next) {
      final state = next.valueOrNull;
      if (state?.isAuthenticated ?? false) {
        context.go('/home');
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Бүртгүүлэх')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: TamgaSpacing.xxxl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Тэмдэг
                    Text('🐎', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: TamgaSpacing.lg),
                    Text(
                      'Шинээр бүртгүүлэх',
                      style: TamgaTypography.title1(weight: FontWeight.w700),
                    ),
                    const SizedBox(height: TamgaSpacing.xxl),

                    // Алдааны мессеж
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: TamgaSpacing.lg),
                        child: Card(
                          color: theme.colorScheme.errorContainer,
                          child: Padding(
                            padding: const EdgeInsets.all(TamgaSpacing.md),
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
                                const SizedBox(width: TamgaSpacing.sm),
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
                          // Нэр талбар
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            autofillHints: kDebugMode
                                ? [AutofillHints.name]
                                : null,
                            decoration: const InputDecoration(
                              labelText: 'Нэр (заавал биш)',
                              hintText: 'Нэрээ оруулна уу',
                              prefixIcon: Icon(Icons.person_outline),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: TamgaSpacing.lg),

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
                          const SizedBox(height: TamgaSpacing.lg),

                          // Нууц үг талбар
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            autofillHints: kDebugMode
                                ? [AutofillHints.newPassword]
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
                          ),
                          const SizedBox(height: TamgaSpacing.lg),

                          // Нууц үг баталгаажуулах
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Нууц үг давтах',
                              prefixIcon: Icon(Icons.lock_outline),
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Нууц үгээ давтан оруулна уу';
                              }
                              if (value != _passwordController.text) {
                                return 'Нууц үг таарахгүй байна';
                              }
                              return null;
                            },
                            onFieldSubmitted: (_) => _handleRegister(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: TamgaSpacing.xxl),

                    // Бүртгүүлэх товч
                    FilledButton(
                      onPressed: _isLoading ? null : _handleRegister,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: _isLoading
                          ? LoadingIndicator(
                              size: 20,
                              color: theme.colorScheme.onPrimary,
                            )
                          : const Text('Бүртгүүлэх'),
                    ),
                    const SizedBox(height: TamgaSpacing.lg),

                    // Нэвтрэх холбоос
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Аль хэдийн бүртгэлтэй юу? Нэвтрэх'),
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
