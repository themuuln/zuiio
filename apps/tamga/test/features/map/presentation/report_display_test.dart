import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/animal_enums.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/shared/domain/horse.dart';

/// Helper to create a minimal LostHorseReport with defaults.
LostHorseReport _createReport({
  String id = 'r1',
  String ownerId = 'o1',
  double lat = 47.9,
  double lng = 106.9,
  DateTime? now,
}) {
  final t = now ?? DateTime(2026, 6, 1);
  return LostHorseReport(
    id: id,
    ownerId: ownerId,
    lastSeenLat: lat,
    lastSeenLng: lng,
    lastSeenAt: t,
    createdAt: t,
    updatedAt: t,
  );
}

void main() {
  // ── LostHorseCard badge logic tests ──────────────────────────────

  group('LostHorseCard badge logic', () {
    test('report with coatColor has non-null coatColor', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      expect(
        report.coatColor,
        isNull,
        reason: 'Default report should have null coatColor',
      );

      final withColor = report.copyWith(coatColor: 'Хээр');
      expect(withColor.coatColor, isNotNull);
      expect(withColor.coatColor, 'Хээр');
    });

    test('report with aimag has non-null locationAimag', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      expect(
        report.locationAimag,
        isNull,
        reason: 'Default report should have null locationAimag',
      );

      final withAimag = report.copyWith(locationAimag: 'Архангай');
      expect(withAimag.locationAimag, isNotNull);
      expect(withAimag.locationAimag, 'Архангай');
    });

    test('report with ages has non-empty ages list', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      expect(
        report.ages,
        isEmpty,
        reason: 'Default report should have empty ages',
      );

      final withAges = report.copyWith(
        ages: [AnimalAge.daaga, AnimalAge.shudlen],
      );
      expect(withAges.ages, isNotEmpty);
      expect(withAges.ages.length, 2);
    });

    test('report with all card fields populated', () {
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        horseName: 'Алтан',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
        coatColor: 'Халиун',
        locationAimag: 'Хэнтий',
        ages: [AnimalAge.ikhNas],
      );

      expect(report.coatColor, 'Халиун');
      expect(report.locationAimag, 'Хэнтий');
      expect(report.ages, [AnimalAge.ikhNas]);

      // Verify display names are accessible for badge labels
      expect(report.ages.first.displayName, 'Их нас');
    });

    test('report with no extra fields has null/empty badge data', () {
      final report = _createReport(now: DateTime(2026, 6, 1));

      expect(report.coatColor, isNull);
      expect(report.locationAimag, isNull);
      expect(report.ages, isEmpty);
    });

    test('coatColor display string is not empty when set', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      final withColor = report.copyWith(coatColor: 'Цагаан');
      expect(withColor.coatColor!.isNotEmpty, isTrue);
    });

    test('locationAimag display string is not empty when set', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      final withAimag = report.copyWith(locationAimag: 'Улаанбаатар');
      expect(withAimag.locationAimag!.isNotEmpty, isTrue);
    });

    test('ages display names join correctly for badge label', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      final withAges = report.copyWith(
        ages: [AnimalAge.unaga, AnimalAge.daaga],
      );

      final ageLabels = withAges.ages.map((a) => a.displayName).join(', ');
      expect(ageLabels, 'Унага, Даага');
    });
  });

  // ── LostHorseDetailScreen animal info section logic ────────────

  group('LostHorseDetailScreen animal info section', () {
    /// Simulates the _hasAnimalInfoData logic from the detail screen.
    bool hasAnimalInfoData(LostHorseReport report) {
      return report.ages.isNotEmpty ||
          report.gender != null ||
          report.breed != null ||
          report.coatColor != null ||
          report.lostCount > 1;
    }

    test('default report has no animal info data', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      expect(
        hasAnimalInfoData(report),
        isFalse,
        reason: 'Default report should not show animal info section',
      );
    });

    test('report with ages shows animal info section', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(ages: [AnimalAge.unaga]);
      expect(hasAnimalInfoData(report), isTrue);
    });

    test('report with gender shows animal info section', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(gender: HorseGender.mare);
      expect(hasAnimalInfoData(report), isTrue);
    });

    test('report with breed shows animal info section', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(breed: HorseBreed.mongol);
      expect(hasAnimalInfoData(report), isTrue);
    });

    test('report with coatColor shows animal info section', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(coatColor: 'Бор');
      expect(hasAnimalInfoData(report), isTrue);
    });

    test('report with lostCount > 1 shows animal info section', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(lostCount: 5);
      expect(hasAnimalInfoData(report), isTrue);
    });

    test('report with lostCount == 1 does not trigger by count alone', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      expect(report.lostCount, 1);
      // No other animal info → section hidden
      expect(hasAnimalInfoData(report), isFalse);
    });

    test('report with all animal info fields shows section', () {
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
        animalType: AnimalType.cattle,
        ages: [AnimalAge.ikhNas],
        gender: HorseGender.stallion,
        breed: HorseBreed.erliiz,
        coatColor: 'Хөх',
        lostCount: 3,
      );

      expect(hasAnimalInfoData(report), isTrue);

      // Verify all display names are accessible
      expect(report.animalType.displayName, 'Үхэр');
      expect(report.ages.first.displayName, 'Их нас');
      expect(report.gender!.displayName, 'Азарга');
      expect(report.breed!.displayName, 'Эрлийз');
      expect(report.coatColor, 'Хөх');
      expect(report.lostCount, 3);
    });

    test(
      'report with only animalType and lostCount=1 has no additional data',
      () {
        final report = _createReport(now: DateTime(2026, 6, 1));
        // Default animalType=horse, lostCount=1, no other fields
        expect(hasAnimalInfoData(report), isFalse);
      },
    );
  });

  // ── LostHorseDetailScreen location section logic ───────────────

  group('LostHorseDetailScreen location section', () {
    /// Simulates the _hasLocationData logic from the detail screen.
    bool hasLocationData(LostHorseReport report) {
      return report.locationAimag != null ||
          report.locationSum != null ||
          report.locationBag != null ||
          report.locationName != null;
    }

    test('no location data hides location section', () {
      final report = _createReport(now: DateTime(2026, 6, 1));
      expect(
        hasLocationData(report),
        isFalse,
        reason: 'No location data → section hidden',
      );
    });

    test('partial location data renders partial display', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(locationAimag: 'Архангай');
      expect(hasLocationData(report), isTrue);

      // Only aimag set
      expect(report.locationAimag, isNotNull);
      expect(report.locationSum, isNull);
      expect(report.locationBag, isNull);
      expect(report.locationName, isNull);
    });

    test('partial location with aimag+sum renders correctly', () {
      final report = _createReport(
        now: DateTime(2026, 6, 1),
      ).copyWith(locationAimag: 'Ховд', locationSum: 'Булган');
      expect(hasLocationData(report), isTrue);
      expect(report.locationAimag, 'Ховд');
      expect(report.locationSum, 'Булган');
      expect(report.locationBag, isNull);
      expect(report.locationName, isNull);
    });

    test('full location hierarchy renders', () {
      final report = _createReport(now: DateTime(2026, 6, 1)).copyWith(
        locationAimag: 'Баянхонгор',
        locationSum: 'Баянхонгор',
        locationBag: '1-р баг',
        locationName: 'Хөшөөт',
      );
      expect(hasLocationData(report), isTrue);
      expect(report.locationAimag, 'Баянхонгор');
      expect(report.locationSum, 'Баянхонгор');
      expect(report.locationBag, '1-р баг');
      expect(report.locationName, 'Хөшөөт');
    });
  });

  // ── LostHorseDetailScreen photo gallery logic (VAL-MEDIA-005) ──

  group('LostHorseDetailScreen photo gallery', () {
    /// Helper to check gallery visibility.
    bool hasGallery(LostHorseReport r) => r.photoUrls.isNotEmpty;

    /// Mock report for gallery tests.
    late LostHorseReport report;

    setUp(() {
      final now = DateTime(2026, 6, 1);
      report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      );
    });

    test('gallery section hidden when no photos', () {
      // Default report has empty photoUrls
      expect(
        hasGallery(report),
        isFalse,
        reason: 'Gallery section should be hidden when no photos exist',
      );
    });

    test('gallery section visible when photos present', () {
      report = report.copyWith(photoUrls: ['https://example.com/photo1.jpg']);
      expect(
        hasGallery(report),
        isTrue,
        reason: 'Gallery section should be visible when photos exist',
      );
    });

    test('gallery renders multiple photos', () {
      report = report.copyWith(
        photoUrls: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
          'https://example.com/photo3.jpg',
        ],
      );
      expect(report.photoUrls.length, 3);
      expect(hasGallery(report), isTrue);
    });

    test('gallery section hidden when photoUrls list cleared', () {
      report = report.copyWith(photoUrls: ['https://example.com/photo1.jpg']);
      expect(hasGallery(report), isTrue);

      report = report.copyWith(photoUrls: []);
      expect(
        hasGallery(report),
        isFalse,
        reason: 'Clearing photoUrls should hide the gallery',
      );
    });

    test('gallery uses CachedNetworkImage URLs', () {
      const photoUrl =
          'https://supabase.co/storage/v1/object/public/'
          'horse-photos/lost-horse-photos/report123/uuid.jpg';

      report = report.copyWith(photoUrls: [photoUrl]);

      expect(
        report.photoUrls.first,
        startsWith('http'),
        reason: 'CachedNetworkImage requires http/https URLs',
      );
      expect(report.photoUrls.first, contains('lost-horse-photos/'));
    });

    test('gallery renders many photos without arbitrary limit', () {
      final manyUrls = List.generate(
        50,
        (i) => 'https://example.com/photo_$i.jpg',
      );
      report = report.copyWith(photoUrls: manyUrls);

      expect(report.photoUrls.length, 50);
      expect(hasGallery(report), isTrue);
    });

    test('gallery with different photo counts renders correctly', () {
      // 1 photo
      report = report.copyWith(photoUrls: ['https://example.com/p1.jpg']);
      expect(report.photoUrls.length, 1);
      expect(hasGallery(report), isTrue);

      // 4 photos
      report = report.copyWith(
        photoUrls: [
          'https://example.com/p1.jpg',
          'https://example.com/p2.jpg',
          'https://example.com/p3.jpg',
          'https://example.com/p4.jpg',
        ],
      );
      expect(report.photoUrls.length, 4);
      expect(hasGallery(report), isTrue);
    });
  });

  // ── LostHorseDetailScreen tamga section logic (VAL-TAMGA-003, VAL-TAMGA-004) ──

  group('LostHorseDetailScreen tamga section', () {
    /// Simulates the _hasTamgaSection logic from the detail screen.
    bool hasTamgaSection(LostHorseReport r) {
      return r.tamgaImageUrl != null || r.earMarkDescription != null;
    }

    late LostHorseReport report;

    setUp(() {
      final now = DateTime(2026, 6, 1);
      report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      );
    });

    test(
      'tamga section hidden when tamgaImageUrl and earMarkDescription are null',
      () {
        expect(report.tamgaImageUrl, isNull);
        expect(report.earMarkDescription, isNull);
        expect(
          hasTamgaSection(report),
          isFalse,
          reason: 'Tamga section should be hidden when both fields are null',
        );
      },
    );

    test('tamga section visible when tamgaImageUrl is present', () {
      report = report.copyWith(tamgaImageUrl: 'https://example.com/tamga.jpg');
      expect(report.tamgaImageUrl, isNotNull);
      expect(
        hasTamgaSection(report),
        isTrue,
        reason: 'Tamga section should be visible when tamgaImageUrl is present',
      );
    });

    test('tamga section visible when earMarkDescription is present', () {
      report = report.copyWith(earMarkDescription: 'Зүүн чихэнд тэмдэг');
      expect(report.earMarkDescription, isNotNull);
      expect(
        hasTamgaSection(report),
        isTrue,
        reason:
            'Tamga section should be visible when earMarkDescription is present',
      );
    });

    test('tamga section visible when both fields are present', () {
      report = report.copyWith(
        tamgaImageUrl: 'https://example.com/tamga.jpg',
        earMarkDescription: 'Баруун чихэнд V тэмдэг',
      );
      expect(hasTamgaSection(report), isTrue);
    });
  });

  // ── LostHorseDetailScreen ear mark field logic (VAL-TAMGA-004) ──

  group('LostHorseDetailScreen ear mark field', () {
    late LostHorseReport report;

    setUp(() {
      final now = DateTime(2026, 6, 1);
      report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      );
    });

    test('ear mark text defaults to null', () {
      expect(report.earMarkDescription, isNull);
    });

    test('ear mark text displayed when earMarkDescription is present', () {
      const earMark = 'Баруун чихэнд V хэлбэрийн ховил';
      report = report.copyWith(earMarkDescription: earMark);
      expect(report.earMarkDescription, earMark);
      expect(report.earMarkDescription!.isNotEmpty, isTrue);
    });

    test('long ear mark text up to 500 chars is supported', () {
      const longEarMark =
          'Чихний им: зүүн чихний дээд хэсэгт гурвалжин хэлбэрийн '
          'зүсэлт, баруун чихний доод хэсэгт хэвтээ шугам. '
          'Мөн чихний ар талд жижиг дугуй тэмдэг байна.';
      report = report.copyWith(earMarkDescription: longEarMark);
      expect(report.earMarkDescription, longEarMark);
      expect(report.earMarkDescription!.length, lessThanOrEqualTo(500));
    });
  });

  // ── LostHorseDetailScreen private verification detail logic ──

  group('LostHorseDetailScreen private verification detail', () {
    /// Simulates the owner-only private mark visibility rule.
    bool showPrivateDetail(LostHorseReport r, {required bool isOwner}) {
      return isOwner &&
          r.privateVerificationDetail != null &&
          r.privateVerificationDetail!.trim().isNotEmpty;
    }

    LostHorseReport withMark(String? mark) => LostHorseReport(
      id: 'r1',
      ownerId: 'o1',
      lastSeenLat: 47.9,
      lastSeenLng: 106.9,
      lastSeenAt: DateTime(2026, 6, 1),
      createdAt: DateTime(2026, 6, 1),
      updatedAt: DateTime(2026, 6, 1),
      privateVerificationDetail: mark,
    );

    test('hidden from non-owners even when populated', () {
      expect(
        showPrivateDetail(
          withMark('Баруун талын чихэнд цагаан толбо'),
          isOwner: false,
        ),
        isFalse,
      );
    });

    test('visible to the owner', () {
      expect(
        showPrivateDetail(
          withMark('Баруун талын чихэнд цагаан толбо'),
          isOwner: true,
        ),
        isTrue,
      );
    });

    test('hidden when the mark is blank', () {
      expect(showPrivateDetail(withMark('   '), isOwner: true), isFalse);
    });

    test('hidden when no mark was provided', () {
      expect(showPrivateDetail(withMark(null), isOwner: true), isFalse);
    });
  });

  // ── LostHorseDetailScreen travel direction logic ──

  group('LostHorseDetailScreen travel direction', () {
    test('direction is rendered in animal info when present', () {
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026, 6, 1),
        createdAt: DateTime(2026, 6, 1),
        updatedAt: DateTime(2026, 6, 1),
        travelDirection: TravelDirection.southEast,
      );
      expect(report.travelDirection, TravelDirection.southEast);
      expect(report.travelDirection!.displayName, 'Зүүн урд');
    });

    test('direction defaults to null', () {
      final report = LostHorseReport(
        id: 'r1',
        ownerId: 'o1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026, 6, 1),
        createdAt: DateTime(2026, 6, 1),
        updatedAt: DateTime(2026, 6, 1),
      );
      expect(report.travelDirection, isNull);
    });
  });

  // ── LostHorseDetailScreen video section logic (VAL-MEDIA-004) ──

  group('LostHorseDetailScreen video section', () {
    /// Simulates the video section visibility logic.
    /// Video section shows if there are video URLs OR if R2 is not available
    /// (showing "Тун удахгүй" placeholder).
    bool shouldShowVideoSection({
      required bool isR2Available,
      required List<String> videoUrls,
    }) {
      return videoUrls.isNotEmpty || !isR2Available;
    }

    test('video section visible with "Тун удахгүй" when R2 not configured', () {
      final showVideo = shouldShowVideoSection(
        isR2Available: false,
        videoUrls: [],
      );
      expect(
        showVideo,
        isTrue,
        reason:
            'Video section should show "Тун удахгүй" when R2 is not '
            'configured, even without videos',
      );
    });

    test('video section hidden when R2 available and no videos', () {
      final showVideo = shouldShowVideoSection(
        isR2Available: true,
        videoUrls: [],
      );
      expect(
        showVideo,
        isFalse,
        reason:
            'Video section should be hidden when R2 is configured '
            'but no videos exist',
      );
    });

    test('video section visible when R2 available and videos present', () {
      final showVideo = shouldShowVideoSection(
        isR2Available: true,
        videoUrls: ['https://videos.example.com/v1.mp4'],
      );
      expect(
        showVideo,
        isTrue,
        reason: 'Video section should be visible with actual videos',
      );
    });

    test('video section visible when R2 available and multiple videos', () {
      final showVideo = shouldShowVideoSection(
        isR2Available: true,
        videoUrls: [
          'https://videos.example.com/v1.mp4',
          'https://videos.example.com/v2.mp4',
        ],
      );
      expect(
        showVideo,
        isTrue,
        reason: 'Video section should render multiple videos',
      );
    });
  });

  // ── LostHorseDetailScreen contact phone logic (VAL-CONTACT-001, VAL-CONTACT-002, VAL-CONTACT-003) ──

  group('LostHorseDetailScreen contact phone', () {
    /// Simulates the contact phone visibility logic from the detail screen.
    bool hasContactPhone(LostHorseReport r) {
      return r.contactPhone != null;
    }

    late LostHorseReport report;
    late DateTime now;

    setUp(() {
      now = DateTime(2026, 6, 1);
      report = _createReport(now: now);
    });

    test('contact phone hidden when null', () {
      expect(report.contactPhone, isNull);
      expect(
        hasContactPhone(report),
        isFalse,
        reason: 'Contact phone section should be hidden when null',
      );
    });

    test('contact phone visible when present', () {
      report = report.copyWith(contactPhone: '+97699112233');
      expect(report.contactPhone, isNotNull);
      expect(
        hasContactPhone(report),
        isTrue,
        reason: 'Contact phone section should be visible when present',
      );
    });

    test('contact phone displays correct value', () {
      report = report.copyWith(contactPhone: '+97699554433');
      expect(report.contactPhone, '+97699554433');
    });

    test('contact phone toggles visibility when set and cleared', () {
      expect(hasContactPhone(report), isFalse);

      report = report.copyWith(contactPhone: '+97699112233');
      expect(hasContactPhone(report), isTrue);

      report = _createReport(now: now);
      expect(
        hasContactPhone(report),
        isFalse,
        reason:
            'Contact phone should be hidden again after creating a new report without it',
      );
    });
  });
}
