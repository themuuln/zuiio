import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/sighting_report.dart';
import 'sighting_repository.dart';

/// Supabase implementation of [SightingRepository].
class SupabaseSightingRepository
    with SupabaseRepositoryMixin
    implements SightingRepository {
  SupabaseSightingRepository({SupabaseClient? client})
    : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  @override
  SupabaseClient? get client => _client;

  @override
  Future<Result<SightingReport>> reportSighting(SightingReport sighting) async {
    try {
      final data = sighting.toJson()..remove('id');
      final response = await _client
          .from('lost_horse_sightings')
          .insert(data)
          .select()
          .single();
      return Result.ok(SightingReport.fromJson(response));
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'SIGHTING_FAILED',
          message: 'Мэдээлэл хадгалсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<SightingReport>>> getSightingsForReport(
    String reportId,
  ) async {
    try {
      final response = await _client
          .from('lost_horse_sightings')
          .select()
          .eq('report_id', reportId)
          .order('created_at', ascending: false);
      final sightings = (response as List)
          .map((r) => SightingReport.fromJson(r as Map<String, dynamic>))
          .toList();
      return Result.ok(sightings);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_SIGHTINGS_FAILED',
          message: 'Мэдээллүүд авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<List<SightingReport>>> getMySightings(String reporterId) async {
    try {
      final response = await _client
          .from('lost_horse_sightings')
          .select()
          .eq('reporter_id', reporterId)
          .order('created_at', ascending: false);
      final sightings = (response as List)
          .map((r) => SightingReport.fromJson(r as Map<String, dynamic>))
          .toList();
      return Result.ok(sightings);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'FETCH_MY_SIGHTINGS_FAILED',
          message: 'Таны мэдээллүүд авч чадсангүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> updateSightingStatus(String id, String status) async {
    try {
      await _client
          .from('lost_horse_sightings')
          .update({'status': status})
          .eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'SIGHTING_STATUS_FAILED',
          message: 'Төлөв шинэчилсэнгүй: $e',
        ),
      );
    }
  }

  @override
  Future<Result<void>> deleteSighting(String id) async {
    try {
      await _client.from('lost_horse_sightings').delete().eq('id', id);
      return const Result.ok(null);
    } catch (e) {
      return Result.fail(
        AppException(
          code: 'DELETE_SIGHTING_FAILED',
          message: 'Мэдээлэл устгасангүй: $e',
        ),
      );
    }
  }

  @override
  Stream<List<SightingReport>> watchSightingsForReport(String reportId) {
    return _client
        .from('lost_horse_sightings')
        .stream(primaryKey: ['id'])
        .eq('report_id', reportId)
        .order('created_at', ascending: false)
        .map((rows) => rows.map((r) => SightingReport.fromJson(r)).toList());
  }
}
