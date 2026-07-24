/// API түлхүүрийн domain model.
///
/// Захиалагчийн API түлхүүрийг илэрхийлнэ — SHA-256 хэшээр хадгалагдсан
/// түлхүүрийг дүрсэлдэг. Бүх serialization нь snake_case (Supabase).
library;

/// API түлхүүрийн эрхийн түвшин.
enum ApiKeyTier {
  breeder,
  stable;

  /// Монгол хэл дээрх нэр.
  String get displayName => switch (this) {
    ApiKeyTier.breeder => 'Үржүүлэгч',
    ApiKeyTier.stable => 'Хүлээнүүд',
  };

  /// Түвшний тухай товч тайлбар.
  String get description => switch (this) {
    ApiKeyTier.breeder => 'Зөвхөн унших — арга хэмжээний мэдээллийг авах',
    ApiKeyTier.stable => 'Бүрэн эрх — үүсгэх, засах, устгах',
  };

  /// Энэ түвшинд зориулсан эрхүүд.
  List<String> get defaultPermissions => switch (this) {
    ApiKeyTier.breeder => ['read_events', 'read_registrations'],
    ApiKeyTier.stable => [
      'read_events',
      'write_events',
      'read_registrations',
      'write_registrations',
      'write_results',
      'read_horses',
    ],
  };

  /// Эрхээс түвшин рүү хувиргах.
  static ApiKeyTier fromString(String value) => ApiKeyTier.values.firstWhere(
    (t) => t.name == value,
    orElse: () => ApiKeyTier.breeder,
  );
}

/// API түлхүүрийн domain model.
class ApiKey {
  const ApiKey({
    required this.id,
    required this.userId,
    required this.name,
    required this.keyPrefix,
    required this.tier,
    this.permissions = const [],
    this.rateLimitPerMinute = 30,
    this.isActive = true,
    this.lastUsedAt,
    required this.createdAt,
    this.expiresAt,
  });

  /// Түлхүүрийн өвөрмөц ID.
  final String id;

  /// Эзэмшигчийн хэрэглэгчийн ID.
  final String userId;

  /// Түлхүүрийн нэр (хэрэглэгчийн өгсөн).
  final String name;

  /// Түлхүүрийн эхний 8 тэмдэгт (харуулдаг).
  final String keyPrefix;

  /// Эрхийн түвшин (breeder эсвэл stable).
  final ApiKeyTier tier;

  /// Энэ түлхүүртэй холбоотой эрхүүд.
  final List<String> permissions;

  /// Нэг минутын хүсэлтийн хязгаар.
  final int rateLimitPerMinute;

  /// Идэвхитэй эсэх.
  final bool isActive;

  /// Сүүлд ашигласан огноо.
  final DateTime? lastUsedAt;

  /// Үүсгэсэн огноо.
  final DateTime createdAt;

  /// Хугацаа дуусах огноо (хэрэв байвал).
  final DateTime? expiresAt;

  /// Хугацаа дууссан эсэх.
  bool get isExpired =>
      expiresAt != null && expiresAt!.isBefore(DateTime.now());

  /// Түлхүүрийн статус текст.
  String get statusText {
    if (isExpired) return 'Хугацаа дууссан';
    if (!isActive) return 'Идэвхигүй';
    return 'Идэвхитэй';
  }

  /// Сүүлд ашигласан хугацааны текст.
  String get lastUsedText {
    if (lastUsedAt == null) return 'Ашиглаагүй';
    final diff = DateTime.now().difference(lastUsedAt!);
    if (diff.inMinutes < 1) return 'Саяхан';
    if (diff.inHours < 1) return '${diff.inMinutes} минутын өмнө';
    if (diff.inDays < 1) return '${diff.inHours} цагийн өмнө';
    return '${diff.inDays} хоногийн өмнө';
  }

  /// Тэмдэгтээр хувиргах.
  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'name': name,
    'key_prefix': keyPrefix,
    'tier': tier.name,
    'permissions': permissions,
    'rate_limit_per_minute': rateLimitPerMinute,
    'is_active': isActive,
    'last_used_at': lastUsedAt?.toIso8601String(),
    'created_at': createdAt.toIso8601String(),
    'expires_at': expiresAt?.toIso8601String(),
  };

  /// Supabase-аас үүсгэх.
  factory ApiKey.fromSupabaseJson(Map<String, dynamic> json) {
    return ApiKey(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String? ?? '',
      keyPrefix: json['key_prefix'] as String,
      tier: ApiKeyTier.fromString(json['tier'] as String? ?? 'breeder'),
      permissions:
          (json['permissions'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      rateLimitPerMinute: json['rate_limit_per_minute'] as int? ?? 30,
      isActive: json['is_active'] as bool? ?? true,
      lastUsedAt: json['last_used_at'] != null
          ? DateTime.parse(json['last_used_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : null,
    );
  }
}

/// Түлхүүр үүсгэх хүсэлтийн model.
class CreateApiKeyRequest {
  const CreateApiKeyRequest({
    required this.name,
    this.tier = ApiKeyTier.breeder,
    this.expiresInDays,
  });

  /// Түлхүүрийн нэр.
  final String name;

  /// Эрхийн түвшин.
  final ApiKeyTier tier;

  /// Хугацаа (хоногоор). null = хязгааргүй.
  final int? expiresInDays;

  Map<String, dynamic> toJson() => {
    'name': name,
    'tier': tier.name,
    'expires_in_days': expiresInDays,
  };
}

/// Үүсгэсэн API түлхүүрийн үр дүн.
///
/// Анх удаа үүсгэхдээ бүтэн түлхүүрийг нэг л удаа харуулна.
class ApiKeyCreated {
  const ApiKeyCreated({required this.key, required this.fullKey});

  /// Түлхүүрийн metadata.
  final ApiKey key;

  /// Бүтэн түлхүүр (зөвхөн үүсгэхэд нэг удаа харуулна).
  final String fullKey;
}

/// API хэрэглээний статистик.
class ApiKeyUsageStats {
  const ApiKeyUsageStats({
    required this.keyId,
    required this.totalRequests,
    required this.requestsToday,
    required this.requestsThisMinute,
    required this.rateLimit,
    this.avgResponseTimeMs,
    this.errorRate,
    this.lastEndpoints,
  });

  /// Түлхүүрийн ID.
  final String keyId;

  /// Нийт хүсэлтийн тоо.
  final int totalRequests;

  /// Өнөөдрийн хүсэлтийн тоо.
  final int requestsToday;

  /// Сүүлийн нэг минутын хүсэлтийн тоо.
  final int requestsThisMinute;

  /// Нэг минутын хязгаар.
  final int rateLimit;

  /// Дундаж хариуны хугацаа (миллисекунд).
  final double? avgResponseTimeMs;

  /// Алдааны хувь (0.0 - 1.0).
  final double? errorRate;

  /// Сүүлийн хүсэлтүүд (эндпоинт → тоо).
  final Map<String, int>? lastEndpoints;

  /// Хязгаарын хувь (0.0 - 1.0).
  double get rateUsage => rateLimit > 0 ? requestsThisMinute / rateLimit : 0;

  /// Хязгаарын статус текст.
  String get rateLimitStatus {
    final usage = rateUsage;
    if (usage > 0.9) return 'Хязгаар ойрхон байна';
    if (usage > 0.5) return 'Дундаж ачаалал';
    return 'Чөлөөтэй';
  }

  Map<String, dynamic> toJson() => {
    'key_id': keyId,
    'total_requests': totalRequests,
    'requests_today': requestsToday,
    'requests_this_minute': requestsThisMinute,
    'rate_limit': rateLimit,
    'avg_response_time_ms': avgResponseTimeMs,
    'error_rate': errorRate,
    'last_endpoints': lastEndpoints,
  };

  factory ApiKeyUsageStats.fromJson(Map<String, dynamic> json) {
    return ApiKeyUsageStats(
      keyId: json['key_id'] as String,
      totalRequests: json['total_requests'] as int? ?? 0,
      requestsToday: json['requests_today'] as int? ?? 0,
      requestsThisMinute: json['requests_this_minute'] as int? ?? 0,
      rateLimit: json['rate_limit'] as int? ?? 30,
      avgResponseTimeMs: (json['avg_response_time_ms'] as num?)?.toDouble(),
      errorRate: (json['error_rate'] as num?)?.toDouble(),
      lastEndpoints: (json['last_endpoints'] as Map<String, dynamic>?)?.map(
        (k, v) => MapEntry(k, v as int),
      ),
    );
  }
}
