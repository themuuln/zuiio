import '../../../core/error/result.dart';
import '../domain/auth_state.dart';

/// Хэрэглэгчийн нэвтрэх үйлдлийн интерфейс.
abstract interface class AuthRepository {
  /// Нэвтрэх эрхийн хугацаа дууссан үед дохио өгөх түгээгч.
  ///
  /// Энэ түгээгч нь хэрэглэгч өөрөө системээс гараагүй,
  /// харин сессийн хугацаа дууссанаас үүдэлтэй
  /// `AuthChangeEvent.signedOut` үйл явдлыг дамжуулдаг.
  Stream<void> get sessionExpired;

  /// Одоогийн хэрэглэгчийн мэдээлэл.
  Future<Result<AuthState>> getCurrentUser();

  /// Имэйл хаягаар бүртгүүлэх.
  Future<Result<AuthState>> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  });

  /// Имэйл хаягаар нэвтрэх.
  Future<Result<AuthState>> signInWithEmail({
    required String email,
    required String password,
  });

  /// Утасны дугаар нэвтрэх (OTP илгээх).
  Future<Result<AuthState>> signInWithPhone({required String phone});

  /// OTP баталгаажуулах.
  Future<Result<AuthState>> verifyPhoneOtp({
    required String phone,
    required String token,
  });

  /// Зочин хэрэглэгч нэвтрэх.
  Future<Result<AuthState>> signInAnonymously();

  /// Google-аар нэвтрэх.
  Future<Result<AuthState>> signInWithGoogle();

  /// Apple-аар нэвтрэх.
  Future<Result<AuthState>> signInWithApple();

  /// Нэвтрэх эрхийг цуцлах.
  Future<void> signOut();

  /// Хэрэглэгчийн нэвтрэх төлөв өөрчлөх мөр.
  Stream<AuthState> get authStateChanges;

  /// Зочин хэрэглэгчийн onboarding өгөгдлийг cloud-д илгээнэ.
  ///
  /// Нэвтэрсний дараа pendingSync тэмдэгтийг шалгаж,
  /// хэрэв байвал profile болон horse-ийг Supabase-д push хийнэ.
  Future<Result<void>> syncPendingOnboarding();
}
