import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../app/app_config.dart';

/// Creates and persists the private token used by a public lost-horse page.
///
/// Only the SHA-256 digest is sent to Supabase. The raw token remains on the
/// owner's device so a database read cannot be used to generate share links.
class PublicLostHorseShareService {
  PublicLostHorseShareService._();

  static const _tokenKeyPrefix = 'lost_horse_public_token_';
  static const _uuid = Uuid();

  /// Generates a 256-bit URL-safe token and its database digest.
  static PublicLostHorseShare create() {
    final token = '${_uuid.v4()}${_uuid.v4()}';
    return PublicLostHorseShare(
      token: token,
      tokenHash: sha256.convert(utf8.encode(token)).toString(),
    );
  }

  /// Builds the public Edge Function URL for [token].
  static String buildUrl(String token) {
    final base = AppConfig.supabaseUrl.replaceFirst(RegExp(r'/$'), '');
    return '$base/functions/v1/public-lost-horse?token='
        '${Uri.encodeQueryComponent(token)}';
  }

  /// Stores the raw token locally for future sharing from the detail screen.
  static Future<void> saveToken(String reportId, String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_tokenKeyPrefix$reportId', token);
  }

  /// Returns the locally retained token for [reportId], if available.
  static Future<String?> tokenFor(String reportId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('$_tokenKeyPrefix$reportId');
  }

  /// Removes a token after a report is no longer shareable.
  static Future<void> clearToken(String reportId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_tokenKeyPrefix$reportId');
  }
}

/// Raw token and digest returned when a public share is created.
class PublicLostHorseShare {
  const PublicLostHorseShare({required this.token, required this.tokenHash});

  /// Raw URL token. Never send this value to Supabase.
  final String token;

  /// SHA-256 digest stored in `lost_horse_reports.public_token_hash`.
  final String tokenHash;
}
