/// Enums for animal types, ages, breeds and pricing tiers used by the lost horse
/// report system.
library;

// ── AnimalType ──────────────────────────────────────────────────────

/// Малын төрөл — the type of animal in a lost horse report.
enum AnimalType {
  horse('Адуу'),
  cattle('Үхэр'),
  sheep('Хонь'),
  goat('Ямаа'),
  camel('Тэмээ');

  const AnimalType(this.displayName);

  /// Mongolian display name for this animal type.
  final String displayName;
}

// ── AnimalAge ───────────────────────────────────────────────────────

/// Монгол нэршил — Mongolian age classifications for animals.
enum AnimalAge {
  unaga('Унага'),
  daaga('Даага'),
  shudlen('Шүдлэн'),
  khazaalan('Хязаалан'),
  soyolon('Соёолон'),
  ikhNas('Их нас'),
  khavchigMori('Хавчиг морь'),
  buduunMori('Бүдүүн морь'),
  azarga('Азарга'),
  guu('Гүү'),
  unagataiGuu('Унагатай гүү'),
  azargaAduu('Азарга адуу'),
  uree('Үрээ'),
  bairlag('Байдас');

  const AnimalAge(this.displayName);

  /// Mongolian display name for this age classification.
  final String displayName;
}

// ── HorseBreed ──────────────────────────────────────────────────────

/// Үүлдэр — horse breed categories.
enum HorseBreed {
  mongol('Монгол'),
  shineTsagiinMongol('Шинэ цагийн монгол'),
  tseverTsusni('Цэвэр цусны'),
  erliiz('Эрлийз');

  const HorseBreed(this.displayName);

  /// Mongolian display name for this breed.
  final String displayName;
}

// ── TravelDirection ────────────────────────────────────────────────

/// Хөдөлсөн зүг — likely direction of travel for a lost animal.
/// Mirrors the зүг field used in Mongolian lost-livestock notices.
enum TravelDirection {
  north('Хойд'),
  northEast('Зүүн хойд'),
  east('Зүүн'),
  southEast('Зүүн урд'),
  south('Урд'),
  southWest('Баруун урд'),
  west('Баруун'),
  northWest('Баруун хойд');

  const TravelDirection(this.displayName);

  /// Mongolian display name for this direction.
  final String displayName;
}

// ── LostHorsePricingTier ────────────────────────────────────────────

/// Үнийн түвшин — pricing tiers for lost horse reports.
enum LostHorsePricingTier {
  free('Энгийн', 0, null),
  featured('Онцлох', 5000, 7),
  vip('VIP', 9900, 14);

  const LostHorsePricingTier(
    this.displayName,
    this.priceMnt,
    this.durationDays,
  );

  /// Mongolian display name for this pricing tier.
  final String displayName;

  /// Price in Mongolian Tögrög (₮).
  final int priceMnt;

  /// Duration in days (null = no expiry).
  final int? durationDays;

  /// Formatted price label: "0₮", "5,000₮", "9,900₮".
  String get priceLabel {
    if (priceMnt == 0) return '0₮';
    final formatted = priceMnt.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
    return '$formatted₮';
  }

  /// Duration label: "Хугацаагүй" (no expiry), "7 хоног", "14 хоног".
  String get durationLabel {
    if (durationDays == null) return 'Хугацаагүй';
    return '$durationDays хоног';
  }

  /// Whether this tier is paid.
  bool get isPaid => priceMnt > 0;
}
