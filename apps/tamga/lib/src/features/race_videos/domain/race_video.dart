/// Уралдааны бичлэгийн domain model.
class RaceVideo {
  const RaceVideo({
    required this.id,
    required this.uploaderId,
    required this.title,
    required this.videoUrl,
    this.raceName,
    this.raceDate,
    this.locationAimag,
    this.category,
    this.thumbnailUrl,
    this.freePreviewUrl,
    this.price3day = 500,
    this.price1year = 2500,
    this.priceLifetime = 6000,
    this.viewCount = 0,
    this.published = false,
    this.taggedHorseIds = const [],
    this.durationSeconds,
    this.createdAt,
  });

  final String id;
  final String uploaderId;
  final String title;
  final String videoUrl;
  final String? raceName;
  final DateTime? raceDate;
  final String? locationAimag;
  final String? category;
  final String? thumbnailUrl;
  final String? freePreviewUrl;
  final int price3day;
  final int price1year;
  final int priceLifetime;
  final int viewCount;
  final bool published;
  final List<String> taggedHorseIds;
  final int? durationSeconds;
  final DateTime? createdAt;

  factory RaceVideo.fromSupabaseJson(Map<String, dynamic> json) => RaceVideo(
    id: json['id'] as String,
    uploaderId: json['uploader_id'] as String,
    title: json['title'] as String,
    videoUrl: json['video_url'] as String,
    raceName: json['race_name'] as String?,
    raceDate: json['race_date'] != null
        ? DateTime.parse(json['race_date'] as String)
        : null,
    locationAimag: json['location_aimag'] as String?,
    category: json['category'] as String?,
    thumbnailUrl: json['thumbnail_url'] as String?,
    freePreviewUrl: json['free_preview_url'] as String?,
    price3day: json['price_3day'] as int? ?? 500,
    price1year: json['price_1year'] as int? ?? 2500,
    priceLifetime: json['price_lifetime'] as int? ?? 6000,
    viewCount: json['view_count'] as int? ?? 0,
    published: json['published'] as bool? ?? false,
    durationSeconds: json['duration_seconds'] as int?,
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'] as String)
        : null,
  );
}

/// Хэрэглэгчийн видео хандалтын бүртгэл.
class VideoAccess {
  const VideoAccess({
    required this.id,
    required this.userId,
    required this.videoId,
    required this.passType,
    required this.purchasedAt,
    this.expiresAt,
  });

  final String id;
  final String userId;
  final String videoId;
  final String passType; // '3day' | '1year' | 'lifetime'
  final DateTime purchasedAt;
  final DateTime? expiresAt;

  bool get isValid => expiresAt == null || expiresAt!.isAfter(DateTime.now());
}


