import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../app/app_config.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/breeding_advice.dart';
import '../domain/breeding_query.dart';
import 'ai_repository.dart';

/// Supabase Edge Function-д хүсэлт илгээх репозитори.
///
/// [AiRepository] интерфейсийг хэрэгжүүлж,
/// `supabase/functions/v1/ai-breeding` Edge Function-д
/// HTTP POST хүсэлт илгээнэ.
class SupabaseAiRepository implements AiRepository {
  SupabaseAiRepository({http.Client? httpClient, String? baseUrl})
    : _http = httpClient ?? http.Client(),
      _baseUrl = baseUrl ?? '';

  final http.Client _http;
  final String _baseUrl;

  /// Edge Function-ийн бүтэн URL.
  String get _functionUrl {
    final base = _baseUrl.isNotEmpty ? _baseUrl : AppConfig.supabaseUrl;
    return '$base/functions/v1/ai-breeding';
  }

  @override
  Future<Result<BreedingAdvice>> getBreedingAdvice(BreedingQuery query) async {
    try {
      final client = getConfiguredSupabaseClient();
      final accessToken = client?.auth.currentSession?.accessToken;

      final headers = <String, String>{'Content-Type': 'application/json'};

      // Add auth token if available
      if (accessToken != null) {
        headers['Authorization'] = 'Bearer $accessToken';
      }

      final response = await _http.post(
        Uri.parse(_functionUrl),
        headers: headers,
        body: jsonEncode(query.toJson()),
      );

      if (response.statusCode == 429) {
        // Rate limit exceeded
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return Result.fail(
          AppException(
            message:
                body['message'] as String? ??
                'Сарын хязгаар дууссан. Багцаа шинэчилнэ үү.',
            code: 'RATE_LIMIT_EXCEEDED',
          ),
        );
      }

      if (response.statusCode != 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return Result.fail(
          AppException(
            message:
                body['error'] as String? ?? 'AI шинжилгээ авахад алдаа гарлаа',
            code: 'AI_FUNCTION_ERROR',
          ),
        );
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final advice = BreedingAdvice.fromJson(body);

      return Result.ok(advice);
    } on http.ClientException catch (e) {
      return Result.fail(
        AppException(
          message: 'Сүлжээний алдаа: ${e.message}',
          code: 'NETWORK_ERROR',
        ),
      );
    } on FormatException {
      return Result.fail(
        AppException(
          message: 'Хариу өгөгдлийг уншихад алдаа гарлаа',
          code: 'PARSE_ERROR',
        ),
      );
    } catch (_) {
      return Result.fail(
        AppException(
          message: 'AI шинжилгээ авахад алдаа гарлаа',
          code: 'UNKNOWN_ERROR',
        ),
      );
    }
  }
}
