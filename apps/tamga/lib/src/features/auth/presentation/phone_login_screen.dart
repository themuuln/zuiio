/// Утасны дугаар нэвтрэх дэлгэц.
/// Хэрэглэгч утасны дугаараа оруулаад OTP код авна.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/auth_providers.dart';
import 'auth_error_messages.dart';

/// Утасны дугаар нэвтрэх хуудас.
class PhoneLoginScreen extends ConsumerStatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  ConsumerState<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends ConsumerState<PhoneLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final phone = '+976${_phoneController.text.trim()}';
      await ref.read(authStateProvider.notifier).signInWithPhone(phone: phone);

      if (mounted) {
        // OTP баталгаажуулах хуудас руу шилжүүлнэ.
        context.push('/phone-verify', extra: phone);
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

    return Scaffold(
      appBar: AppBar(title: const Text('Утасны дугаар')),
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
                    // ── Icon ──
                    Icon(
                      Icons.phone_android,
                      size: 64,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(height: TamgaSpacing.lg),

                    // ── Title ──
                    Text(
                      'Утасны дугаараа оруулна уу',
                      style: TamgaTypography.title1(weight: FontWeight.w700),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: TamgaSpacing.sm),

                    // ── Subtitle ──
                    Text(
                      'Баталгаажуулах код (OTP) илгээнэ',
                      style: TamgaTypography.body(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: TamgaSpacing.xxxl),

                    // ── Error message ──
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: TamgaSpacing.lg),
                        child: Card(
                          color: theme.colorScheme.errorContainer,
                          child: Padding(
                            padding: const EdgeInsets.all(TamgaSpacing.md),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.error_outline,
                                  color: theme.colorScheme.onErrorContainer,
                                ),
                                const SizedBox(width: TamgaSpacing.sm),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: TamgaTypography.body(
                                      color: theme.colorScheme.onErrorContainer,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                    // ── Phone input with country code ──
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Утасны дугаар',
                        hintText: '99123456',
                        prefixIcon: const Icon(Icons.phone_outlined),
                        prefixText: '+976 ',
                        prefixStyle: TamgaTypography.body(
                          weight: FontWeight.w600,
                          color: theme.colorScheme.onSurface,
                        ),
                        border: const OutlineInputBorder(),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Утасны дугаараа оруулна уу';
                        }
                        final cleaned = val.replaceAll(RegExp(r'[\s\-]'), '');
                        if (cleaned.length != 8) {
                          return 'Утасны дугаар 8 оронтой байх ёстой';
                        }
                        if (!RegExp(r'^[0-9]+$').hasMatch(cleaned)) {
                          return 'Зөвхөн тоо оруулна уу';
                        }
                        return null;
                      },
                      onFieldSubmitted: (_) => _handleSendOtp(),
                      textInputAction: TextInputAction.done,
                    ),
                    const SizedBox(height: TamgaSpacing.xxl),

                    // ── Send OTP button ──
                    FilledButton(
                      onPressed: _isLoading ? null : _handleSendOtp,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: _isLoading
                          ? LoadingIndicator(
                              size: 20,
                              color: theme.colorScheme.onPrimary,
                            )
                          : const Text('Код илгээх'),
                    ),
                    const SizedBox(height: TamgaSpacing.lg),

                    // ── Back to email login ──
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Имэйлээр нэвтрэх'),
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
