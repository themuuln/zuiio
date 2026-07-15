import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app_config.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../data/auth_repository.dart';
import '../data/supabase_auth_repository.dart';
import '../domain/auth_state.dart';

/// Хэрэглэгчийн нэвтрэх repository.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (!AppConfig.isSupabaseConfigured) {
    return _NoOpAuthRepository();
  }
  return SupabaseAuthRepository();
});

/// Хэрэглэгчийн нэвтрэх төлөв.
final authStateProvider = StreamNotifierProvider<AuthStateNotifier, AuthState>(
  AuthStateNotifier.new,
);

/// Сессийн хугацаа дууссан үйл явдлын түгээгч.
///
/// Энэ provider нь хэрэглэгч өөрөө системээс гараагүй,
/// харин сессийн хугацаа дууссанаас үүдэлтэй
/// `AuthChangeEvent.signedOut` үйл явдлыг дамжуулдаг.
final sessionExpiredProvider = StreamProvider<void>((ref) {
  return ref.read(authRepositoryProvider).sessionExpired;
});

/// Сессийн хугацаа дууссаны дараа хадгалагдсан сүүлийн чиглэл.
///
/// Хэрэглэгч дахин нэвтрэхдээ өмнөх хуудас руу шилжихэд ашиглана.
final preservedRouteAfterReAuthProvider = StateProvider<String?>((ref) => null);

/// Хэрэглэгчийн нэвтрэх төлөвийг удирдах Notifier.
class AuthStateNotifier extends StreamNotifier<AuthState> {
  @override
  Stream<AuthState> build() async* {
    // Эхлээд одоогийн төлөвийг шалгана.
    final repository = ref.read(authRepositoryProvider);
    final currentResult = await repository.getCurrentUser();

    yield currentResult.isSuccess
        ? currentResult.value
        : const AuthState.unauthenticated();

    // Дараа нь өөрчлөлтийг сонсно.
    yield* repository.authStateChanges;
  }

  /// Имэйл хаягаар бүртгүүлэх.
  ///
  /// Амжилттай бол onboarding-ийг cloud-д илгээнэ.
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.signUpWithEmail(
      email: email,
      password: password,
      displayName: displayName,
    );
    if (result.isFailure) {
      throw result.error;
    }
    await repository.syncPendingOnboarding();
  }

  /// Имэйл хаягаар нэвтрэх.
  ///
  /// Амжилттай бол onboarding-ийг cloud-д илгээнэ.
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.signInWithEmail(
      email: email,
      password: password,
    );
    if (result.isFailure) {
      throw result.error;
    }
    await repository.syncPendingOnboarding();
  }

  /// Утасны дугаар нэвтрэх.
  ///
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> signInWithPhone({required String phone}) async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.signInWithPhone(phone: phone);
    if (result.isFailure) {
      throw result.error;
    }
  }

  /// OTP баталгаажуулах.
  ///
  /// Амжилттай бол onboarding-ийг cloud-д илгээнэ.
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> verifyPhoneOtp({
    required String phone,
    required String token,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.verifyPhoneOtp(phone: phone, token: token);
    if (result.isFailure) {
      throw result.error;
    }
    await repository.syncPendingOnboarding();
  }

  /// Зочин хэрэглэгч нэвтрэх.
  ///
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> signInAnonymously() async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.signInAnonymously();
    if (result.isFailure) {
      throw result.error;
    }
    if (result.isSuccess) {
      await repository.syncPendingOnboarding();
    }
  }

  /// Google-аар нэвтрэх.
  ///
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> signInWithGoogle() async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.signInWithGoogle();
    if (result.isFailure) {
      throw result.error;
    }
    await repository.syncPendingOnboarding();
  }

  /// Apple-аар нэвтрэх.
  ///
  /// Алдаа гарвал [AppException] throw хийнэ.
  Future<void> signInWithApple() async {
    final repository = ref.read(authRepositoryProvider);
    final result = await repository.signInWithApple();
    if (result.isFailure) {
      throw result.error;
    }
    await repository.syncPendingOnboarding();
  }

  /// Нэвтрэх эрхийг цуцлах.
  Future<void> signOut() async {
    final repository = ref.read(authRepositoryProvider);
    await repository.signOut();
  }
}

/// Supabase тохиргоогүй үед ажиллах NoOp implementation.
class _NoOpAuthRepository implements AuthRepository {
  @override
  Future<Result<AuthState>> getCurrentUser() async {
    // Хэрэв anonymous auth амжилттай болсон бол нэгтгэнэ.
    final userId = currentSupabaseUserId();
    if (userId != null) {
      return Result.ok(
        AuthState.authenticated(userId: userId, isAnonymous: true),
      );
    }
    return const Result.ok(AuthState.unauthenticated());
  }

  @override
  Future<Result<AuthState>> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<Result<AuthState>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<Result<AuthState>> signInWithPhone({required String phone}) async {
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<Result<AuthState>> verifyPhoneOtp({
    required String phone,
    required String token,
  }) async {
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<Result<AuthState>> signInAnonymously() async {
    // Anonymous auth нь Supabase bootstrap-аар явагддаг.
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<Result<AuthState>> signInWithGoogle() async {
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<Result<AuthState>> signInWithApple() async {
    return const Result.fail(
      AppException(
        message: 'Supabase тохиргоо байхгүй байна',
        code: 'SUPABASE_NOT_CONFIGURED',
      ),
    );
  }

  @override
  Future<void> signOut() async {}

  @override
  Stream<AuthState> get authStateChanges =>
      Stream.value(const AuthState.unauthenticated());

  @override
  Stream<void> get sessionExpired => const Stream.empty();

  @override
  Future<Result<void>> syncPendingOnboarding() async {
    // Supabase тохиргоогүй тул sync хийх шаардлагагүй.
    return const Result.ok(null);
  }
}
