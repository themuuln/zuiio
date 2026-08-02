/// OTP баталгаажуулах дэлгэц.
/// 6 оронтой код оруулж баталгаажуулна. Давхарлан илгээх боломжтой.
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/auth_providers.dart';

/// OTP баталгаажуулах хуудас.
class OtpVerifyScreen extends ConsumerStatefulWidget {
  const OtpVerifyScreen({required this.phone, super.key});

  /// Баталгаажуулах утасны дугаар (+976...).
  final String phone;

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen> {
  final _otpControllers = List.generate(6, (_) => TextEditingController());
  final _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;
  String? _errorMessage;
  int _resendSeconds = 60;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    _resendTimer?.cancel();
    super.dispose();
  }

  // ── Resend timer ──

  void _startResendTimer() {
    _resendSeconds = 60;
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendSeconds > 0) {
        setState(() => _resendSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  // ── OTP code ──

  String get _otpCode => _otpControllers.map((c) => c.text).join();

  bool get _isOtpComplete => _otpCode.length == 6;

  Future<void> _handleVerify() async {
    if (!_isOtpComplete) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(authStateProvider.notifier)
          .verifyPhoneOtp(phone: widget.phone, token: _otpCode);

      if (mounted) {
        // Амжилттай — эхлэх хуудас руу шилжүүлнэ.
        context.go('/home');
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
      // Алдаа гарвал OTP талбарыг цэвэрлэнэ.
      for (final c in _otpControllers) {
        c.clear();
      }
      _focusNodes[0].requestFocus();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResend() async {
    if (_resendSeconds > 0) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(authStateProvider.notifier)
          .signInWithPhone(phone: widget.phone);
      _startResendTimer();
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final maskedPhone = widget.phone.replaceRange(
      4,
      widget.phone.length - 3,
      '***',
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Код баталгаажуулах')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: TamgaSpacing.xxxl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // ── Icon ──
                  Icon(
                    Icons.sms_outlined,
                    size: 64,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: TamgaSpacing.lg),

                  // ── Title ──
                  Text(
                    'Баталгаажуулах код илгээлээ',
                    style: TamgaTypography.title1(weight: FontWeight.w700),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: TamgaSpacing.sm),

                  // ── Subtitle ──
                  Text(
                    '$maskedPhone руу 6 оронтой код илгээлээ',
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

                  // ── OTP input fields ──
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(6, (index) {
                      return Container(
                        width: 48,
                        margin: const EdgeInsets.symmetric(
                          horizontal: TamgaSpacing.xs,
                        ),
                        child: TextFormField(
                          controller: _otpControllers[index],
                          focusNode: _focusNodes[index],
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          maxLength: 1,
                          style: TamgaTypography.title1(
                            weight: FontWeight.w700,
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: InputDecoration(
                            counterText: '',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(
                                TamgaSpacing.cornerRadiusSmall,
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: TamgaSpacing.md,
                            ),
                          ),
                          onChanged: (value) {
                            if (value.isNotEmpty && index < 5) {
                              _focusNodes[index + 1].requestFocus();
                            } else if (value.isEmpty && index > 0) {
                              _focusNodes[index - 1].requestFocus();
                            }

                            // Бүх талбар дүүэрсэн бол автоматаар баталгаажуулна.
                            if (_isOtpComplete) {
                              _handleVerify();
                            }
                          },
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: TamgaSpacing.xxl),

                  // ── Verify button ──
                  FilledButton(
                    onPressed: (_isLoading || !_isOtpComplete)
                        ? null
                        : _handleVerify,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                    child: _isLoading
                        ? LoadingIndicator(
                            size: 20,
                            color: theme.colorScheme.onPrimary,
                          )
                        : const Text('Баталгаажуулах'),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),

                  // ── Resend code ──
                  if (_resendSeconds > 0)
                    Text(
                      'Дахин илгээх: $_resendSecondsс',
                      style: TamgaTypography.body(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    )
                  else
                    TextButton(
                      onPressed: _handleResend,
                      child: const Text('Дахин код илгээх'),
                    ),
                  const SizedBox(height: TamgaSpacing.lg),

                  // ── Change number ──
                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text('Дугаар солих'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
