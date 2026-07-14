/// Морины эзэмшил шилжүүлэх Supabase repository.
library;

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/data/supabase_repository_mixin.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/error/result.dart';
import '../domain/horse_transfer.dart';
import 'horse_transfer_repository.dart';

/// Морины эзэмшил шилжүүлэх cloud repository.
class SupabaseHorseTransferRepository with SupabaseRepositoryMixin implements HorseTransferRepository {
  const SupabaseHorseTransferRepository._(this._client);
  factory SupabaseHorseTransferRepository() =>
      SupabaseHorseTransferRepository._(Supabase.instance.client);

  final SupabaseClient _client;

  @override
  SupabaseClient? get client => _client;

  @override
  Future<Result<HorseTransferHistory>> fetchTransferHistory(
    String horseId,
  ) async {
    try {
      final data = await _client
          .from('horse_transfers')
          .select()
          .eq('horse_id', horseId)
          .order('transfer_date');

      final transfers = data.map((row) => _rowToTransfer(row)).toList();

      return Result.ok(
        HorseTransferHistory(horseId: horseId, transfers: transfers),
      );
    } catch (e) {
      return Result.fail(
        AppException.withDetail('FETCH_TRANSFER_HISTORY_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<HorseTransfer>> createTransfer(HorseTransfer transfer) async {
    try {
      final data = {
        'id': transfer.id,
        'horse_id': transfer.horseId,
        'from_owner_id': transfer.fromOwnerId,
        'from_owner_name': transfer.fromOwnerName,
        'to_owner_id': transfer.toOwnerId,
        'to_owner_name': transfer.toOwnerName,
        'transfer_date': transfer.transferDate.toIso8601String(),
        'price': transfer.price,
        'notes': transfer.notes,
        'is_verified': transfer.isVerified,
      };

      await _client.from('horse_transfers').insert(data);

      return Result.ok(transfer);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('CREATE_TRANSFER_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<HorseTransfer>> verifyTransfer({
    required String transferId,
    required String verifiedBy,
  }) async {
    try {
      final now = DateTime.now().toIso8601String();

      await _client
          .from('horse_transfers')
          .update({
            'is_verified': true,
            'verified_at': now,
            'verified_by': verifiedBy,
          })
          .eq('id', transferId);

      // Return a copy with verification info
      return Result.ok(
        HorseTransfer(
          id: transferId,
          horseId: '',
          fromOwnerId: '',
          fromOwnerName: '',
          toOwnerId: '',
          toOwnerName: '',
          transferDate: DateTime.now(),
          isVerified: true,
          verifiedAt: DateTime.now(),
          verifiedBy: verifiedBy,
        ),
      );
    } catch (e) {
      return Result.fail(
        AppException.withDetail('VERIFY_TRANSFER_ERROR', e.toString()),
      );
    }
  }

  @override
  Future<Result<String?>> getCurrentOwnerId(String horseId) async {
    try {
      // Хамгийн сүүлийн шилжүүлгээс шинэ эзнийг олох.
      final data = await _client
          .from('horse_transfers')
          .select('to_owner_id')
          .eq('horse_id', horseId)
          .order('transfer_date', ascending: false)
          .limit(1)
          .maybeSingle();

      return Result.ok(data?['to_owner_id'] as String?);
    } catch (e) {
      return Result.fail(
        AppException.withDetail('GET_CURRENT_OWNER_ERROR', e.toString()),
      );
    }
  }

  HorseTransfer _rowToTransfer(Map<String, dynamic> row) {
    return HorseTransfer(
      id: row['id'] as String,
      horseId: row['horse_id'] as String,
      fromOwnerId: row['from_owner_id'] as String,
      fromOwnerName: row['from_owner_name'] as String? ?? '',
      toOwnerId: row['to_owner_id'] as String,
      toOwnerName: row['to_owner_name'] as String? ?? '',
      transferDate: DateTime.parse(row['transfer_date'] as String),
      price: (row['price'] as num?)?.toDouble(),
      notes: row['notes'] as String? ?? '',
      isVerified: row['is_verified'] as bool? ?? false,
      verifiedAt: row['verified_at'] != null
          ? DateTime.parse(row['verified_at'] as String)
          : null,
      verifiedBy: row['verified_by'] as String?,
    );
  }
}
