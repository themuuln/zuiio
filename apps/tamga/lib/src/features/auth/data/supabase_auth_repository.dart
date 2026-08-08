import 'dart:async';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../onboarding/data/onboarding_repository.dart';
import '../../shared/data/local_json_store.dart';
import '../../profile/data/supabase_profile_repository.dart';
import '../../profile/domain/profile_settings.dart';
import '../../horses/data/supabase_horses_repository.dart';
import '../../horses/domain/horse_record.dart' show HorseGender, Horse;
import '../domain/auth_state.dart';
import 'auth_repository.dart';
import '../../../core/features/feature_flags.dart';
import '../../../core/services/notification_service.dart';

/// Supabase ашигласан хэрэглэгчийн нэвтрэх repository.
class SupabaseAuthRepository implements AuthRepository {
  SupabaseAuthRepository({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient(),
      _sessionExpiredController = StreamController<void>.broadcast();

  final SupabaseClient? _client;
  final StreamController<void> _sessionExpiredController;

  /// Хэрэглэгч өөрөө системээс гарсан эсэхийг тодорхойлох тэмдэглэгээ.
  ///
  /// `true` бол хэрэглэгч санаарай системээс гарсан тул
  /// `AuthChangeEvent.signedOut` үйл явдлыг сессийн дуусалт гэж үзэхгүй.
  bool _isUserInitiatedSignOut = false;

  SupabaseClient? get _safeClient => _client;

  /// GoTrue auth object.
  GoTrueClient? get _auth => _safeClient?.auth;

  @override
  Future<Result<AuthState>> getCurrentUser() async {
    try {
      final auth = _auth;
      if (auth == null) {
        return const Result.ok(AuthState.unauthenticated());
      }

      final session = auth.currentSession;
      final user = auth.currentUser;

      if (session == null || user == null) {
        return const Result.ok(AuthState.unauthenticated());
      }

      return Result.ok(_userToAuthState(user));
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      final response = await auth.signUp(
        email: email,
        password: password,
        data: {'display_name': displayName},
      );

      if (response.user == null) {
        return Result.fail(
          const AppException(
            message: 'Бүртгүүлэхэд алдаа гарлаа',
            code: 'SIGNUP_FAILED',
          ),
        );
      }

      return Result.ok(_userToAuthState(response.user!));
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      final response = await auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        return Result.fail(
          const AppException(
            message: 'Нэвтрэхэд алдаа гарлаа',
            code: 'SIGNIN_FAILED',
          ),
        );
      }

      return Result.ok(_userToAuthState(response.user!));
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> signInWithPhone({required String phone}) async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      await auth.signInWithOtp(phone: phone);

      // OTP илгээгдсэн — хэрэглэгчийг өөрчлөхгүй.
      return const Result.ok(AuthState.loading());
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> verifyPhoneOtp({
    required String phone,
    required String token,
  }) async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      final response = await auth.verifyOTP(
        phone: phone,
        token: token,
        type: OtpType.sms,
      );

      if (response.user == null) {
        return Result.fail(
          const AppException(
            message: 'OTP баталгаажуулахад алдаа гарлаа',
            code: 'OTP_VERIFY_FAILED',
          ),
        );
      }

      return Result.ok(_userToAuthState(response.user!));
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> signInAnonymously() async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      final response = await auth.signInAnonymously();

      if (response.user == null) {
        return Result.fail(
          const AppException(
            message: 'Зочин нэвтрэхэд алдаа гарлаа',
            code: 'ANONYMOUS_SIGNIN_FAILED',
          ),
        );
      }

      return Result.ok(_userToAuthState(response.user!));
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> signInWithGoogle() async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      // TODO: Configure Google Sign-In in Supabase dashboard
      // Requires: Supabase > Authentication > Providers > Google
      // Requires: Google Cloud Console OAuth 2.0 credentials
      final response = await auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.tamga://login-callback/',
      );

      if (!response) {
        return Result.fail(
          const AppException(
            message: 'Google нэвтрэхэд алдаа гарлаа',
            code: 'GOOGLE_SIGNIN_FAILED',
          ),
        );
      }

      // OAuth flow is async - auth state will update via stream
      return const Result.ok(AuthState.loading());
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Future<Result<AuthState>> signInWithApple() async {
    try {
      final auth = _auth;
      if (auth == null) {
        return Result.fail(_noClientError());
      }

      // TODO: Configure Apple Sign-In in Supabase dashboard
      // Requires: Supabase > Authentication > Providers > Apple
      // Requires: Apple Developer account with Sign In with Apple capability
      final response = await auth.signInWithOAuth(
        OAuthProvider.apple,
        redirectTo: 'io.supabase.tamga://login-callback/',
      );

      if (!response) {
        return Result.fail(
          const AppException(
            message: 'Apple нэвтрэхэд алдаа гарлаа',
            code: 'APPLE_SIGNIN_FAILED',
          ),
        );
      }

      // OAuth flow is async - auth state will update via stream
      return const Result.ok(AuthState.loading());
    } catch (e) {
      return Result.fail(_wrapError(e));
    }
  }

  @override
  Stream<void> get sessionExpired => _sessionExpiredController.stream;

  @override
  Future<void> signOut() async {
    // Хэрэглэгч өөрөө системээс гарч байгааг тэмдэглэх.
    _isUserInitiatedSignOut = true;

    // FCM token-ийг устгах — Supabase signOut-оос өмнө.
    // Зөвхөн push notification идэвхтэй үед л хийх.
    unawaited(
      SharedPreferences.getInstance().then((prefs) async {
        final pushEnabled =
            prefs.getBool(FeatureFlag.pushNotifications.storageKey) ??
            FeatureFlag.pushNotifications.defaultValue;
        if (!pushEnabled) return;
        try {
          final notificationService = NotificationService();
          await notificationService.removeToken();
        } catch (_) {}
      }),
    );

    try {
      await _auth?.signOut();
    } catch (_) {
      // Нэвтрэх эрхийг цуцлах нь амжилтгүй болсон ч үргэлжлүүлнэ.
    }

    // Safety net: хэрэв auth.onAuthStateChange signedOut үйл явдал
    // гаргахгүй байсан ч тэмдэглэгээг цэвэрлэнэ.
    Future.delayed(const Duration(seconds: 3), () {
      _isUserInitiatedSignOut = false;
    });
  }

  @override
  Stream<AuthState> get authStateChanges {
    final auth = _auth;
    if (auth == null) {
      return Stream.value(const AuthState.unauthenticated());
    }

    return auth.onAuthStateChange.map((data) {
      // Хэрэглэгчийн хүсэлтгүйгээр signedOut гарсан бол сессийн дуусалт.
      if (data.event == AuthChangeEvent.signedOut && !_isUserInitiatedSignOut) {
        _sessionExpiredController.add(null);
      }

      // Тэмдэглэгээг цэвэрлэх — дараагийн signedOut үйл явдлыг
      // зөв тодорхойлоход зориулав.
      _isUserInitiatedSignOut = false;

      final user = data.event == AuthChangeEvent.signedOut
          ? null
          : data.session?.user;

      if (user == null || data.session == null) {
        return const AuthState.unauthenticated();
      }

      return _userToAuthState(user);
    });
  }

  /// Supabase User-ийг AuthState рүү хөрвүүлэх.
  AuthState _userToAuthState(User user) {
    return AuthState.authenticated(
      userId: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.userMetadata?['display_name'] as String?,
      avatarUrl: user.userMetadata?['avatar_url'] as String?,
      isAnonymous: user.isAnonymous,
    );
  }

  /// Алдааг AppException рүү хөрвүүлэх.
  AppException _wrapError(Object e) {
    if (e is AuthException) {
      return AppException(
        message: e.message,
        code: 'AUTH_ERROR',
        details: {'original': e.message},
      );
    }

    return AppException(message: e.toString(), code: 'UNKNOWN_AUTH_ERROR');
  }

  /// Клиент байхгүй үеийн алдаа.
  AppException _noClientError() {
    return const AppException(
      message: 'Supabase тохиргоо байхгүй байна',
      code: 'SUPABASE_NOT_CONFIGURED',
    );
  }

  // ── Onboarding sync ──────────────────────────────────────────

  /// Зочин хэрэглэгчийн onboarding өгөгдлийг cloud-д илгээнэ.
  ///
  /// Нэвтэрсний дараа дуудна: pendingSync тэмдэгтийг шалгаж,
  /// хэрэв байвал profile болон horse-ийг Supabase-д push хийнэ.
  @override
  Future<Result<void>> syncPendingOnboarding() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final store = LocalJsonStore(prefs);
      final repo = OnboardingRepository(store);
      final data = repo.load();

      if (!data.pendingSync) {
        return const Result.ok(null);
      }

      // 1. Хэрэглэгчийн нэр, утасны дугаарыг Supabase Auth metadata-д шинэчлэх.
      final auth = _client?.auth;
      if (auth != null &&
          data.displayName != null &&
          data.displayName!.isNotEmpty) {
        await auth.updateUser(
          UserAttributes(
            data: {
              'display_name': data.displayName,
              if (data.phone != null) 'phone': data.phone,
              if (data.region != null) 'region': data.region,
              if (data.rank != null) 'rank': data.rank,
            },
          ),
        );
      }

      // 2. Profile (role) cloud-д шинэчлэх.
      final profileRepo = SupabaseProfileRepository();
      final profile = ProfileSettings(
        autoSyncEnabled: true,
        role: data.userRole ?? 'casual',
        rank: data.rank ?? 'no_rank',
      );
      final profileResult = await profileRepo.update(profile);
      if (profileResult.isFailure) {
        return Result.fail(profileResult.error);
      }

      // 3. Хэрэв морь оруулсан бол cloud-д илгээнэ.
      if (data.horseName != null && !data.horseEntrySkipped) {
        final horsesRepo = SupabaseHorsesRepository();
        final horse = Horse(
          id: 'onboard-${DateTime.now().millisecondsSinceEpoch}',
          name: data.horseName!,
          relationLabel: 'Хэрэглэгч',
          coat: data.horseCoat ?? '',
          birthYear: data.horseBirthYear ?? DateTime.now().year,
          awardCount: 0,
          offspringCount: 0,
          isOwnedByHousehold: true,
          notes: '',
          gender: data.horseGender ?? HorseGender.gelding,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        final horseResult = await horsesRepo.saveHorse(horse);
        if (horseResult.isFailure) {
          return Result.fail(horseResult.error);
        }
      }

      // 4. Pending sync тэмдэгтийг арилгана.
      await repo.save(data.copyWith(pendingSync: false));

      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Onboarding sync алдаа: $e',
          code: 'ONBOARDING_SYNC_ERROR',
        ),
      );
    }
  }
}
