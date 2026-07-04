import '../../../shared/domain/horse.dart';

/// Адуучин аппын анхны onboarding хэрэглэгчийн сонголтууд.
///
/// Flow v3 (2026-06):
/// 1. Welcome — value prop + social proof
/// 2. Role — user type selection
/// 3. Goal — personalization goal
/// 4. Horse entry — aha moment (celebration on success)
/// 5. Auth — save progress after value
/// 6. Notifications — permission priming
///
/// Profile setup (name, region, phone) is DEFERRED to post-onboarding
/// to reduce cognitive load and drop-off during the critical first session.
class OnboardingData {
  const OnboardingData({
    required this.isCompleted,
    this.onboardingVersion = 3,
    this.userRole,
    this.firstGoal,
    this.displayName,
    this.region,
    this.rank,
    this.phone,
    this.horseName,
    this.horseGender,
    this.horseCoat,
    this.horseBreed,
    this.horseBirthYear,
    this.sireName,
    this.damName,
    this.horseEntrySkipped = false,
    this.notificationsEnabled = false,
    this.pendingSync = false,
  });

  /// Onboarding бүрэн дууссан эсэх.
  final bool isCompleted;

  /// Onboarding хувилбар — хуучин хадгалсан өгөгдөл шалгахад ашиглана.
  /// v1 = legacy, v2 = auth before quick win, v3 = quick win before auth.
  final int onboardingVersion;

  /// Хэрэглэгчийн үүрэг: 'casual' | 'breeder' | 'stable'
  final String? userRole;

  /// Хэрэглэгчийн onboarding үеийн эхний зорилго.
  final String? firstGoal;

  /// Хэрэглэгчийн нэр.
  final String? displayName;

  /// Аймаг/хот.
  final String? region;

  /// Алдар цол: 'no_rank' | 'zalu_uu' | 'sum_aldart' | 'aimag_aldart' | 'uls_aldart' | 'manlai' | 'tod_manlai' | 'myangat'
  final String? rank;

  /// Утасны дугаар.
  final String? phone;

  /// Морины нэр.
  final String? horseName;

  /// Хүйс.
  final HorseGender? horseGender;

  /// Зүс (өнгө).
  final String? horseCoat;

  /// Угсаа.
  final String? horseBreed;

  /// Төрсөн он.
  final int? horseBirthYear;

  /// Эцэгийн нэр (pedigree).
  final String? sireName;

  /// Эхийн нэр (pedigree).
  final String? damName;

  /// Морь оруулахаас татгалзсан эсэх.
  final bool horseEntrySkipped;

  /// Мэдэгдэл идэвхэсэн эсэх.
  final bool notificationsEnabled;

  /// Зочин хэрэглэгч — дараа нэвтэрсэн үед cloud-д илгээх шаардлагатай эсэх.
  final bool pendingSync;

  OnboardingData copyWith({
    bool? isCompleted,
    int? onboardingVersion,
    String? userRole,
    String? firstGoal,
    String? displayName,
    String? region,
    String? rank,
    String? phone,
    String? horseName,
    HorseGender? horseGender,
    String? horseCoat,
    String? horseBreed,
    int? horseBirthYear,
    String? sireName,
    String? damName,
    bool? horseEntrySkipped,
    bool? notificationsEnabled,
    bool? pendingSync,
  }) {
    return OnboardingData(
      isCompleted: isCompleted ?? this.isCompleted,
      onboardingVersion: onboardingVersion ?? this.onboardingVersion,
      userRole: userRole ?? this.userRole,
      firstGoal: firstGoal ?? this.firstGoal,
      displayName: displayName ?? this.displayName,
      region: region ?? this.region,
      rank: rank ?? this.rank,
      phone: phone ?? this.phone,
      horseName: horseName ?? this.horseName,
      horseGender: horseGender ?? this.horseGender,
      horseCoat: horseCoat ?? this.horseCoat,
      horseBreed: horseBreed ?? this.horseBreed,
      horseBirthYear: horseBirthYear ?? this.horseBirthYear,
      sireName: sireName ?? this.sireName,
      damName: damName ?? this.damName,
      horseEntrySkipped: horseEntrySkipped ?? this.horseEntrySkipped,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      pendingSync: pendingSync ?? this.pendingSync,
    );
  }

  // Serialization
  factory OnboardingData.fromMap(Map<String, dynamic> map) {
    return OnboardingData(
      isCompleted: map['isCompleted'] as bool? ?? false,
      onboardingVersion: map['onboardingVersion'] as int? ?? 1,
      userRole: map['userRole'] as String?,
      firstGoal: map['firstGoal'] as String?,
      displayName: map['displayName'] as String?,
      region: map['region'] as String?,
      rank: map['rank'] as String?,
      phone: map['phone'] as String?,
      horseName: map['horseName'] as String?,
      horseGender: map['horseGender'] != null
          ? HorseGender.fromString(map['horseGender'] as String)
          : null,
      horseCoat: map['horseCoat'] as String?,
      horseBreed: map['horseBreed'] as String?,
      horseBirthYear: map['horseBirthYear'] as int?,
      sireName: map['sireName'] as String?,
      damName: map['damName'] as String?,
      horseEntrySkipped: map['horseEntrySkipped'] as bool? ?? false,
      notificationsEnabled: map['notificationsEnabled'] as bool? ?? false,
      pendingSync: map['pendingSync'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'isCompleted': isCompleted,
      'onboardingVersion': onboardingVersion,
      if (userRole != null) 'userRole': userRole,
      if (firstGoal != null) 'firstGoal': firstGoal,
      if (displayName != null) 'displayName': displayName,
      if (region != null) 'region': region,
      if (rank != null) 'rank': rank,
      if (phone != null) 'phone': phone,
      if (horseName != null) 'horseName': horseName,
      if (horseGender != null) 'horseGender': horseGender!.name,
      if (horseCoat != null) 'horseCoat': horseCoat,
      if (horseBreed != null) 'horseBreed': horseBreed,
      if (horseBirthYear != null) 'horseBirthYear': horseBirthYear,
      if (sireName != null) 'sireName': sireName,
      if (damName != null) 'damName': damName,
      'horseEntrySkipped': horseEntrySkipped,
      'notificationsEnabled': notificationsEnabled,
      'pendingSync': pendingSync,
    };
  }

  static const empty = OnboardingData(isCompleted: false);

  /// Reset-ийг илэрхийлэх.
  static const completed = OnboardingData(isCompleted: true);
}

/// Уяачийн алдар цолын жагсаалт.
/// Түвшин: Сумын → Аймгийн → Улсын (дээшлэх).
enum UserRank {
  noRank('Адуучин', 'Бүртгүүлж буй анхны хэрэглэгч'),
  zaluUu('Залуу уяач', 'Шинээр эхэлж буй залуу уяач'),
  sumAldart('Сумын алдарт уяач', 'Сумын түвшний алдар цолтой уяач'),
  aimagAldart('Аймгийн алдарт уяач', 'Аймгийн түвшний алдар цолтой уяач'),
  ulsAldart('Улсын алдарт уяач', 'Улсын түвшний алдар цолтой уяач'),
  manlai('Манлай уяач', 'Монгол Улсын Манлай уяач цолтон'),
  todManlai('Тод манлай уяач', 'Монгол Улсын Тод манлай уяач цолтон'),
  myangat('Мянгат малчин', 'Мянган толгой малтай малчин');

  const UserRank(this.displayName, this.subtitle);

  final String displayName;
  final String subtitle;

  /// JSON-д хадгалагдах түлхүүр.
  String get key {
    switch (this) {
      case UserRank.noRank:
        return 'no_rank';
      case UserRank.zaluUu:
        return 'zalu_uu';
      case UserRank.sumAldart:
        return 'sum_aldart';
      case UserRank.aimagAldart:
        return 'aimag_aldart';
      case UserRank.ulsAldart:
        return 'uls_aldart';
      case UserRank.manlai:
        return 'manlai';
      case UserRank.todManlai:
        return 'tod_manlai';
      case UserRank.myangat:
        return 'myangat';
    }
  }

  /// Түвшин тоо (илүү их = илүү дээд).
  int get level {
    switch (this) {
      case UserRank.noRank:
        return 0;
      case UserRank.zaluUu:
        return 1;
      case UserRank.sumAldart:
        return 2;
      case UserRank.aimagAldart:
        return 3;
      case UserRank.ulsAldart:
        return 4;
      case UserRank.manlai:
        return 5;
      case UserRank.todManlai:
        return 6;
      case UserRank.myangat:
        return 7;
    }
  }

  /// Emoji тэмдэгт.
  String get emoji {
    switch (this) {
      case UserRank.noRank:
        return '🐎';
      case UserRank.zaluUu:
        return '🌟';
      case UserRank.sumAldart:
        return '🏅';
      case UserRank.aimagAldart:
        return '🏆';
      case UserRank.ulsAldart:
      case UserRank.manlai:
      case UserRank.todManlai:
        return '👑';
      case UserRank.myangat:
        return '🐄';
    }
  }

  /// JSON түлхүүрээс буцаана.
  static UserRank fromKey(String? key) {
    return UserRank.values.firstWhere(
      (r) => r.key == key,
      orElse: () => UserRank.noRank,
    );
  }
}

/// Хэрэглэгчийн onboarding үеийн эхний зорилго.
enum OnboardingGoal {
  trackOneHorse,
  manageHerd,
  improveBreeding,
  trackHealth,
  prepareEvents;

  String get displayName {
    switch (this) {
      case OnboardingGoal.trackOneHorse:
        return 'Нэг морь бүртгэх';
      case OnboardingGoal.manageHerd:
        return 'Адуугаа удирдах';
      case OnboardingGoal.improveBreeding:
        return 'Угсаа сайжруулах';
      case OnboardingGoal.trackHealth:
        return 'Эрүүл мэнд хянах';
      case OnboardingGoal.prepareEvents:
        return 'Наадамд бэлтгэх';
    }
  }

  String get subtitle {
    switch (this) {
      case OnboardingGoal.trackOneHorse:
        return 'Анхны морио бүртгэж эхлэх';
      case OnboardingGoal.manageHerd:
        return 'Бүх морио нэг дээр хянах';
      case OnboardingGoal.improveBreeding:
        return 'Удам угсааны мэдээлэл хянах';
      case OnboardingGoal.trackHealth:
        return 'Эмчилгээ, вакцин бүртгэх';
      case OnboardingGoal.prepareEvents:
        return 'Уралдаан, наадамд бэлтгэх';
    }
  }

  String get emoji {
    switch (this) {
      case OnboardingGoal.trackOneHorse:
        return '🐎';
      case OnboardingGoal.manageHerd:
        return '🏇';
      case OnboardingGoal.improveBreeding:
        return '🧬';
      case OnboardingGoal.trackHealth:
        return '💊';
      case OnboardingGoal.prepareEvents:
        return '🏆';
    }
  }
}

/// Хэрэглэгчийн үүргийн сонголт.
enum UserRole {
  casual,
  breeder,
  stable;

  String get displayName {
    switch (this) {
      case UserRole.casual:
        return 'Морь сонирхогч';
      case UserRole.breeder:
        return 'Уяач / Малчин';
      case UserRole.stable:
        return 'Жүчээ / Бизнес';
    }
  }

  String get subtitle {
    switch (this) {
      case UserRole.casual:
        return 'Цөөн адуутай, хувийн хэрэглээ болон хобби чиглэлээр';
      case UserRole.breeder:
        return 'Олон адуутай, удам угсаа хянах, хурдан морины чиглэлээр';
      case UserRole.stable:
        return 'Жүчээ бизнес, олон хэрэглэгч';
    }
  }

  /// Material icon for the role.
  String get iconName {
    switch (this) {
      case UserRole.casual:
        return 'person';
      case UserRole.breeder:
        return 'pets';
      case UserRole.stable:
        return 'business';
    }
  }

  String get iconAssetPath {
    switch (this) {
      case UserRole.casual:
        return '🐎';
      case UserRole.breeder:
        return '🌿';
      case UserRole.stable:
        return '🏪';
    }
  }
}
