import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/race_videos/domain/race_video.dart';

void main() {
  group('RaceVideo', () {
    test('constructor creates instance with all fields', () {
      final video = RaceVideo(
        id: 'vid-1',
        uploaderId: 'user-1',
        title: 'Наадам 2024',
        videoUrl: 'https://example.com/video.mp4',
        raceName: 'Эртний морьд',
        raceDate: DateTime(2024, 7, 11),
        locationAimag: 'Төв',
        category: 'Монгол',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        freePreviewUrl: 'https://example.com/preview.mp4',
        price3day: 1000,
        price1year: 5000,
        priceLifetime: 10000,
        viewCount: 150,
        published: true,
        taggedHorseIds: ['horse-1', 'horse-2'],
        durationSeconds: 3600,
        createdAt: DateTime(2024, 7, 11, 10, 0),
      );

      expect(video.id, 'vid-1');
      expect(video.title, 'Наадам 2024');
      expect(video.raceName, 'Эртний морьд');
      expect(video.price3day, 1000);
      expect(video.priceLifetime, 10000);
      expect(video.published, isTrue);
      expect(video.taggedHorseIds, ['horse-1', 'horse-2']);
      expect(video.durationSeconds, 3600);
    });

    test('constructor uses defaults', () {
      final video = RaceVideo(
        id: 'vid-2',
        uploaderId: 'user-2',
        title: 'Test',
        videoUrl: 'https://example.com/v.mp4',
      );

      expect(video.price3day, 500);
      expect(video.price1year, 2500);
      expect(video.priceLifetime, 6000);
      expect(video.viewCount, 0);
      expect(video.published, isFalse);
      expect(video.taggedHorseIds, isEmpty);
      expect(video.raceName, isNull);
      expect(video.raceDate, isNull);
      expect(video.durationSeconds, isNull);
    });

    test('fromSupabaseJson parses all fields', () {
      final json = {
        'id': 'vid-3',
        'uploader_id': 'user-3',
        'title': 'Уралдаан',
        'video_url': 'https://example.com/r.mp4',
        'race_name': 'Хангайн морьд',
        'race_date': '2024-08-15T10:00:00.000',
        'location_aimag': 'Архангай',
        'category': 'Монгол',
        'thumbnail_url': 'https://example.com/t.jpg',
        'free_preview_url': 'https://example.com/p.mp4',
        'price_3day': 1000,
        'price_1year': 5000,
        'price_lifetime': 12000,
        'view_count': 75,
        'published': true,
        'duration_seconds': 4200,
        'created_at': '2024-08-15T10:00:00.000',
      };

      final video = RaceVideo.fromSupabaseJson(json);

      expect(video.id, 'vid-3');
      expect(video.uploaderId, 'user-3');
      expect(video.title, 'Уралдаан');
      expect(video.raceName, 'Хангайн морьд');
      expect(video.raceDate, DateTime(2024, 8, 15, 10, 0));
      expect(video.locationAimag, 'Архангай');
      expect(video.price3day, 1000);
      expect(video.priceLifetime, 12000);
      expect(video.viewCount, 75);
      expect(video.published, isTrue);
      expect(video.durationSeconds, 4200);
    });

    test('fromSupabaseJson uses defaults for missing optional fields', () {
      final json = {
        'id': 'vid-4',
        'uploader_id': 'user-4',
        'title': 'Minimal',
        'video_url': 'https://example.com/m.mp4',
      };

      final video = RaceVideo.fromSupabaseJson(json);

      expect(video.raceName, isNull);
      expect(video.raceDate, isNull);
      expect(video.price3day, 500);
      expect(video.price1year, 2500);
      expect(video.priceLifetime, 6000);
      expect(video.viewCount, 0);
      expect(video.published, isFalse);
      expect(video.durationSeconds, isNull);
      expect(video.createdAt, isNull);
    });

    test('fromSupabaseJson handles null optional fields', () {
      final json = {
        'id': 'vid-5',
        'uploader_id': 'user-5',
        'title': 'Nulls',
        'video_url': 'https://example.com/n.mp4',
        'race_name': null,
        'race_date': null,
        'price_3day': null,
        'view_count': null,
      };

      final video = RaceVideo.fromSupabaseJson(json);

      expect(video.raceName, isNull);
      expect(video.raceDate, isNull);
      expect(video.price3day, 500);
      expect(video.viewCount, 0);
    });
  });

  group('VideoAccess', () {
    test('isValid returns true when expiresAt is null', () {
      final access = VideoAccess(
        id: 'acc-1',
        userId: 'user-1',
        videoId: 'vid-1',
        passType: 'lifetime',
        purchasedAt: DateTime(2024),
      );

      expect(access.isValid, isTrue);
    });

    test('isValid returns true when expiresAt is in the future', () {
      final access = VideoAccess(
        id: 'acc-2',
        userId: 'user-1',
        videoId: 'vid-1',
        passType: '3day',
        purchasedAt: DateTime(2024),
        expiresAt: DateTime(2099),
      );

      expect(access.isValid, isTrue);
    });

    test('isValid returns false when expiresAt is in the past', () {
      final access = VideoAccess(
        id: 'acc-3',
        userId: 'user-1',
        videoId: 'vid-1',
        passType: '3day',
        purchasedAt: DateTime(2024),
        expiresAt: DateTime(2024, 1, 1),
      );

      expect(access.isValid, isFalse);
    });
  });
}
