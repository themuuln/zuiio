import '../../../core/error/result.dart';
import '../domain/breeding_record.dart';

abstract class BreedingRepository {
  Future<Result<List<BreedingRecord>>> fetchBreedingRecords();
  Future<Result<List<BreedingRecord>>> saveBreedingRecord(
    BreedingRecord record,
  );
  Future<Result<void>> deleteBreedingRecord(String id);
}
