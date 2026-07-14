import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/supabase_bootstrap.dart';
import '../error/app_exception.dart';
import '../error/result.dart';

/// Firebase Cloud Messaging-ийн үндсэн үйлчилгээ.
///
/// - FCM token үүсгэх, шинэчлэх
/// - Permission хүсэх
/// - Token-ийг Supabase user_devices table-д хадгалах
/// - Remote message handler
///
/// Firebase-ийн google-services.json / GoogleService-Info.plist
/// тохируулаагүй үед энгийн no-op болж ажиллана.
class NotificationService {
  NotificationService({SupabaseClient? client})
    : _client = client ?? getConfiguredSupabaseClient();

  final SupabaseClient? _client;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  StreamSubscription<RemoteMessage>? _messageSubscription;
  final StreamController<RemoteMessage> _messageController =
      StreamController<RemoteMessage>.broadcast();

  String? _currentToken;
  bool _initialized = false;

  /// Одоогийн FCM token.
  String? get currentToken => _currentToken;

  /// Амжилттай нэвтрэх үед илгээгдэх remote message stream.
  Stream<RemoteMessage> get onMessage => _messageController.stream;

  /// Firebase амжилттай эхэлсэн эсэх.
  bool get isAvailable => _initialized;

  // ── Initialization ────────────────────────────────────────────

  /// Notification service-ийг эхлүүлэх.
  ///
  /// Firebase тохиргоогүй бол алдаа гаргахгүй — зүгээр no-op.
  Future<Result<void>> initialize() async {
    try {
      // Permission хүсэх.
      final permissionResult = await requestPermission();
      if (permissionResult.isFailure) {
        return permissionResult;
      }

      // FCM token авах.
      final tokenResult = await _getAndStoreToken();
      if (tokenResult.isFailure) {
        return tokenResult;
      }

      // Token refresh listener.
      _messaging.onTokenRefresh.listen((newToken) {
        _currentToken = newToken;
        _storeTokenInSupabase(newToken);
      });

      // Foreground message listener.
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _messageController.add(message);
      });

      // Background message handler registered via FirebaseMessaging.onMessageOpenedApp.
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint(
          '[NotificationService] Message opened from background: '
          '${message.messageId}',
        );
      });

      _initialized = true;
      return const Result.ok(null);
    } catch (e) {
      // Firebase not configured — graceful degradation.
      debugPrint('[NotificationService] Init failed (non-fatal): $e');
      return const Result.ok(null);
    }
  }

  /// Background message handler — FirebaseMessaging.onBackgroundMessage
  /// тусгай функцийг шаарддаг тул энд register хийнэ.
  static Future<void> initializeBackgroundHandler() async {
    FirebaseMessaging.onBackgroundMessage(_backgroundMessageHandler);
  }

  // ── Permission ────────────────────────────────────────────────

  /// Push notification permission хүсэх.
  Future<Result<bool>> requestPermission() async {
    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
        criticalAlert: false,
        carPlay: false,
        announcement: false,
      );

      final granted =
          settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;

      debugPrint(
        '[NotificationService] Permission: '
        '${settings.authorizationStatus.name}',
      );

      return Result.ok(granted);
    } catch (e) {
      debugPrint('[NotificationService] Permission request failed: $e');
      return Result.fail(
        AppException(
          message: 'Мэдэгдлийн зөвшөөрөл авахад алдаа гарлаа',
          code: 'NOTIFICATION_PERMISSION_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  // ── Token Management ─────────────────────────────────────────

  /// FCM token авах ба Supabase-д хадгалах.
  ///
  /// iOS дээр APNS token-ийг хүлээж авна — permission авсны дараа
  /// APNS token нэн даруй бэлэн болдоггүй.
  Future<Result<String>> _getAndStoreToken() async {
    try {
      // iOS дээр APNS token-ийг хүлээх — max 5 удаа оролдоно.
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        for (var i = 0; i < 5; i++) {
          final apnsToken = await _messaging.getAPNSToken();
          if (apnsToken != null) break;
          debugPrint(
            '[NotificationService] Waiting for APNS token (${i + 1}/5)...',
          );
          await Future<void>.delayed(const Duration(milliseconds: 500));
        }
      }

      final token = await _messaging.getToken();
      if (token == null) {
        return const Result.fail(
          AppException(
            message: 'FCM token авч чадсангүй',
            code: 'FCM_TOKEN_NULL',
          ),
        );
      }

      _currentToken = token;
      debugPrint(
        '[NotificationService] FCM token: ${token.substring(0, 20)}...',
      );

      // Supabase-д хадгалах.
      await _storeTokenInSupabase(token);

      return Result.ok(token);
    } catch (e) {
      debugPrint('[NotificationService] Token fetch failed: $e');
      return Result.fail(
        AppException(
          message: 'FCM token авахад алдаа гарлаа',
          code: 'FCM_TOKEN_ERROR',
          details: {'error': e.toString()},
        ),
      );
    }
  }

  /// FCM token-ийг Supabase user_devices table-д хадгалах.
  Future<void> _storeTokenInSupabase(String token) async {
    try {
      final userId = await ensureSupabaseUserId();
      if (userId == null) return;

      final client = _client;
      if (client == null) return;

      await client.from('user_devices').upsert({
        'user_id': userId,
        'fcm_token': token,
        'platform': defaultTargetPlatform.name,
        'last_seen_at': DateTime.now().toIso8601String(),
      }, onConflict: 'user_id,fcm_token');

      debugPrint('[NotificationService] Token stored in Supabase');
    } catch (e) {
      // Хадгалах алдааг ignore хийж болно — token refresh үед дахин оролдоно.
      debugPrint('[NotificationService] Token store failed (non-fatal): $e');
    }
  }

  /// Token-ийг Supabase-ээс устгах (sign-out үед).
  Future<Result<void>> removeToken() async {
    try {
      if (_currentToken == null) return const Result.ok(null);

      final userId = currentSupabaseUserId();
      if (userId == null) return const Result.ok(null);

      final client = _client;
      if (client == null) return const Result.ok(null);

      await client
          .from('user_devices')
          .delete()
          .eq('user_id', userId)
          .eq('fcm_token', _currentToken!);

      _currentToken = null;
      debugPrint('[NotificationService] Token removed from Supabase');

      return const Result.ok(null);
    } catch (e) {
      debugPrint('[NotificationService] Token removal failed: $e');
      return const Result.ok(null);
    }
  }

  // ── Topic Management ─────────────────────────────────────────

  /// Сэдвийг дагах (жишээ: market_listing_updates).
  Future<Result<void>> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      debugPrint('[NotificationService] Subscribed to topic: $topic');
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Сэдэв дагахад алдаа гарлаа',
          code: 'TOPIC_SUBSCRIBE_ERROR',
          details: {'topic': topic, 'error': e.toString()},
        ),
      );
    }
  }

  /// Сэдвийг дагахаа болих.
  Future<Result<void>> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      debugPrint('[NotificationService] Unsubscribed from topic: $topic');
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          message: 'Сэдэв дагахаа болиход алдаа гарлаа',
          code: 'TOPIC_UNSUBSCRIBE_ERROR',
          details: {'topic': topic, 'error': e.toString()},
        ),
      );
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────

  /// Service-ийг цэвэрлэх — subscription-уудыг цуцлах.
  void dispose() {
    _messageSubscription?.cancel();
    _messageController.close();
  }
}

/// Firebase onBackgroundMessage handler — тусгай топ-LEVEL async function байх ёстой.
@pragma('vm:entry-point')
Future<void> _backgroundMessageHandler(RemoteMessage message) async {
  debugPrint('[NotificationService] Background message: ${message.messageId}');
}
