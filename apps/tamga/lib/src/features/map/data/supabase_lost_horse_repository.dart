import 'dart:io';

import '../../../core/storage/cloud/media_storage_service.dart';
import '../../../core/storage/cloud/supabase_media_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/lost_horse_report.dart';
import '../domain/animal_enums.dart';
import '../domain/map_enums.dart';
import '../domain/sighting_report.dart';
import 'lost_horse_repository.dart';

/// Supabase data source for owner-only recovery records and redacted helpers.
class SupabaseLostHorseRepository implements LostHorseRepository {
  SupabaseLostHorseRepository({
    SupabaseClient? client,
    MediaStorageService? mediaStorage,
  }) : _client = client ?? Supabase.instance.client,
       _mediaStorage =
           mediaStorage ??
           SupabaseMediaStorage(client: client ?? Supabase.instance.client);

  final SupabaseClient _client;
  final MediaStorageService _mediaStorage;
  @override
  Future<Result<LostHorseReport>> createReport(
    LostHorseReport report, {
    List<String> localMediaPaths = const [],
    List<String> mediaIds = const [],
  }) async {
    try {
      final row = Map<String, dynamic>.from(report.toJson())
        ..remove('photo_urls')
        ..remove('video_urls');
      Map<String, dynamic> response;
      try {
        response = await _client
            .from('lost_horse_reports')
            .insert(row)
            .select()
            .single();
      } on PostgrestException catch (error) {
        if (error.code != '23505') rethrow;
        response = await _client
            .from('lost_horse_reports')
            .select()
            .eq('id', report.id)
            .single();
      }
      final saved = LostHorseReport.fromJson(response);
      await _uploadReportMedia(
        report: saved,
        localMediaPaths: localMediaPaths,
        mediaIds: mediaIds,
      );
      await _uploadTamgaImage(report: saved);
      return Result.ok(saved);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_CREATE_FAILED', e.toString()),
      );
    }
  }

  Future<void> _uploadReportMedia({
    required LostHorseReport report,
    required List<String> localMediaPaths,
    required List<String> mediaIds,
  }) async {
    for (var index = 0; index < localMediaPaths.length; index++) {
      final mediaId = index < mediaIds.length ? mediaIds[index] : null;
      final file = File(localMediaPaths[index]);
      if (!await file.exists()) {
        if (mediaId != null) {
          final existing = await _client
              .from('lost_horse_media')
              .select('storage_path')
              .eq('id', mediaId)
              .maybeSingle();
          if (existing?['storage_path'] is String) continue;
        }
        throw AppException.withDetail(
          'MEDIA_FILE_MISSING',
          'Recovery media file does not exist: ${file.path}',
        );
      }
      final storagePath =
          '${report.ownerId}/${report.id}/$index.${_extensionOf(file.path)}';
      final upload = (await _mediaStorage.upload(
        file: file,
        path: storagePath,
        category: MediaCategory.recoveryPhoto,
      )).getOrThrow();
      final mediaPayload = <String, dynamic>{
        'report_id': report.id,
        'url': upload.path,
        'storage_path': upload.path,
        'media_type': 'photo',
        'sort_order': index,
      };
      if (mediaId != null) mediaPayload['id'] = mediaId;
      await _client
          .from('lost_horse_media')
          .upsert(mediaPayload, onConflict: 'report_id,storage_path');
    }
  }

  String _extensionOf(String path) {
    final extension = path.split('.').last.toLowerCase();
    return extension.isEmpty || extension == path ? 'jpg' : extension;
  }

  /// Uploads the owner's tamga (brand stamp) photo to the private recovery
  /// bucket and repoints `tamga_image_url` at the storage path so the public
  /// share page can render it through a service-role signed URL.
  Future<void> _uploadTamgaImage({required LostHorseReport report}) async {
    final localPath = report.tamgaImageUrl;
    if (localPath == null || localPath.isEmpty) return;
    final file = File(localPath);
    if (!await file.exists()) return; // already a storage path or missing
    final storagePath =
        '${report.ownerId}/${report.id}/tamga.${_extensionOf(localPath)}';
    final upload = (await _mediaStorage.upload(
      file: file,
      path: storagePath,
      category: MediaCategory.recoveryPhoto,
    )).getOrThrow();
    await _client
        .from('lost_horse_reports')
        .update({'tamga_image_url': upload.path})
        .eq('id', report.id);
  }

  Future<LostHorseReport> _attachPrivateMediaUrls(
    LostHorseReport report,
  ) async {
    try {
      final rows = await _client
          .from('lost_horse_media')
          .select('url, storage_path, media_type')
          .eq('report_id', report.id)
          .order('sort_order');
      final urls = <String>[];
      for (final rawRow in rows as List) {
        final row = Map<String, dynamic>.from(rawRow as Map);
        if (row['media_type'] != 'photo') continue;
        final path = row['storage_path'] as String? ?? row['url'] as String?;
        final signed = await _mediaStorage.getSignedUrl(
          path: path!,
          category: MediaCategory.recoveryPhoto,
        );
        if (signed.isSuccess) urls.add(signed.getOrThrow());
      }
      var attached = urls.isEmpty ? report : report.copyWith(photoUrls: urls);
      // Tamga image lives in a private bucket — hand non-owner viewers a
      // signed URL instead of the raw storage path.
      final tamga = report.tamgaImageUrl;
      if (tamga != null && !File(tamga).existsSync()) {
        final signed = await _mediaStorage.getSignedUrl(
          path: tamga,
          category: MediaCategory.recoveryPhoto,
        );
        if (signed.isSuccess) {
          attached = attached.copyWith(tamgaImageUrl: signed.getOrThrow());
        }
      }
      return attached;
    } catch (_) {
      return report;
    }
  }

  @override
  Future<Result<LostHorseReport>> getReport(String reportId) async {
    try {
      final response = await _client
          .from('lost_horse_reports')
          .select()
          .eq('id', reportId)
          .single();
      final report = LostHorseReport.fromJson(response);
      return Result.ok(await _attachPrivateMediaUrls(report));
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_READ_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> getMyReports(String ownerId) async {
    try {
      final response = await _client
          .from('lost_horse_reports')
          .select()
          .eq('owner_id', ownerId)
          .order('created_at', ascending: false);
      final reports = (response as List)
          .map((row) => LostHorseReport.fromJson(row as Map<String, dynamic>))
          .toList();
      return Result.ok(await Future.wait(reports.map(_attachPrivateMediaUrls)));
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_LIST_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<LostHorseReport>>> browseActiveReports() async {
    try {
      final response = await _client.rpc('browse_active_lost_horse_reports');
      return Result.ok(
        (response as List).map((row) {
          final data = Map<String, dynamic>.from(row as Map);
          return LostHorseReport(
            id: data['id'] as String,
            ownerId: '',
            horseName: data['horse_name'] as String?,
            description: data['description'] as String?,
            animalType: AnimalType.values.firstWhere(
              (type) => type.name == data['animal_type'],
              orElse: () => AnimalType.horse,
            ),
            lostCount: (data['lost_count'] as num?)?.toInt() ?? 1,
            locationAimag: data['location_aimag'] as String?,
            locationSum: data['location_sum'] as String?,
            locationBag: data['location_bag'] as String?,
            locationName: data['location_name'] as String?,
            lastSeenLat: 0,
            lastSeenLng: 0,
            lastSeenAt: DateTime.parse(data['last_seen_at'] as String),
            sightingCount: (data['sighting_count'] as num?)?.toInt() ?? 0,
            createdAt: DateTime.parse(data['created_at'] as String),
            updatedAt: DateTime.parse(data['created_at'] as String),
            publicAccessEnabled: true,
            publicLocationPrecision:
                data['public_location_precision'] as String? ?? 'sum',
            publicContactMode: data['public_contact_mode'] as String? ?? 'none',
            travelDirection: data['travel_direction'] != null
                ? TravelDirection.values.firstWhere(
                    (e) => e.name == data['travel_direction'],
                    orElse: () => TravelDirection.north,
                  )
                : null,
          );
        }).toList(),
      );
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_BROWSE_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<LostHorseReport>> publishReport(
    String reportId, {
    List<String> expectedMediaIds = const [],
  }) async {
    try {
      await _client.rpc(
        'publish_lost_horse_submission',
        params: {
          'p_report_id': reportId,
          'p_expected_media_ids': expectedMediaIds,
        },
      );
      return getReport(reportId);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_PUBLISH_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<LostHorseReport>> resolveReport({
    required String reportId,
    required LostHorseResolutionType resolutionType,
    String? note,
    String? verifiedSightingId,
  }) async {
    try {
      await _client.rpc(
        'resolve_lost_horse_report',
        params: {
          'p_report_id': reportId,
          'p_resolution_type': resolutionType.name,
          'p_resolution_note': note,
          'p_verified_sighting_id': verifiedSightingId,
        },
      );
      return getReport(reportId);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('REPORT_RESOLVE_FAILED', e.toString()),
      );
    }
  }

  Future<SightingReport> _attachSightingMediaUrl(
    SightingReport sighting,
  ) async {
    final path = sighting.photoUrl;
    if (path == null || path.isEmpty) return sighting;
    try {
      final signed = await _mediaStorage.getSignedUrl(
        path: path,
        category: MediaCategory.recoverySightingPhoto,
      );
      return signed.isSuccess
          ? sighting.copyWith(photoUrl: signed.getOrThrow())
          : sighting;
    } catch (_) {
      return sighting;
    }
  }

  @override
  Future<Result<SightingReport>> createSighting(SightingReport sighting) async {
    try {
      final payload = Map<String, dynamic>.from(sighting.toJson());
      if (sighting.id.isEmpty) payload.remove('id');
      final localPhotoPath = sighting.photoUrl;
      if (localPhotoPath != null && await File(localPhotoPath).exists()) {
        final file = File(localPhotoPath);
        final mediaKey = sighting.clientId ?? sighting.id;
        final storagePath =
            '${sighting.reporterId}/${sighting.reportId}/'
            '$mediaKey.${_extensionOf(file.path)}';
        final upload = (await _mediaStorage.upload(
          file: file,
          path: storagePath,
          category: MediaCategory.recoverySightingPhoto,
        )).getOrThrow();
        payload['photo_url'] = upload.path;
        payload['storage_path'] = upload.path;
      }
      Map<String, dynamic> row;
      try {
        row = await _client
            .from('lost_horse_sightings')
            .insert(payload)
            .select()
            .single();
      } on PostgrestException catch (error) {
        if (error.code != '23505') rethrow;
        final query = _client.from('lost_horse_sightings').select();
        row =
            await (sighting.clientId != null
                    ? query.eq('client_id', sighting.clientId!)
                    : query.eq('id', sighting.id))
                .single();
      }
      return Result.ok(SightingReport.fromJson(row));
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SIGHTING_CREATE_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<List<SightingReport>>> getSightings(String reportId) async {
    try {
      final response = await _client
          .from('lost_horse_sightings')
          .select()
          .eq('report_id', reportId)
          .order('created_at', ascending: false);
      final sightings = (response as List)
          .map((row) => SightingReport.fromJson(row as Map<String, dynamic>))
          .toList();
      return Result.ok(
        await Future.wait(sightings.map(_attachSightingMediaUrl)),
      );
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SIGHTING_LIST_FAILED', e.toString()),
      );
    }
  }

  @override
  Future<Result<SightingReport>> reviewSighting({
    required String sightingId,
    required SightingStatus status,
  }) async {
    try {
      final row = await _client
          .from('lost_horse_sightings')
          .update({'status': status.name})
          .eq('id', sightingId)
          .select()
          .single();
      return Result.ok(SightingReport.fromJson(row));
    } catch (e) {
      return Result.fail(
        AppException.withDetail('SIGHTING_REVIEW_FAILED', e.toString()),
      );
    }
  }
}
