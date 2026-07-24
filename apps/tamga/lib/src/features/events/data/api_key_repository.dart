import '../../../core/error/result.dart';
import '../domain/api_key.dart';

/// Result-д суурилсан API түлхүүрийн repository interface.
abstract class ApiKeyRepository {
  /// Хэрэглэгчийн API түлхүүрүүдийг авах.
  Future<Result<List<ApiKey>>> getApiKeys(String userId);

  /// Шинэ API түлхүүр үүсгэх.
  ///
  /// Буцаах утга нь `ApiKeyCreated` — fullKey нь зөвхөн
  /// энэ удаад л харуулна.
  Future<Result<ApiKeyCreated>> createApiKey(
    String userId,
    CreateApiKeyRequest request,
  );

  /// API түлхүүрийг идэвхигүй болгох (устгахгүй, зөвхөн deactivate).
  Future<Result<void>> revokeApiKey(String keyId);

  /// API түлхүүрийн хэрэглээний статистик авах.
  Future<Result<ApiKeyUsageStats>> getUsageStats(String keyId);
}
