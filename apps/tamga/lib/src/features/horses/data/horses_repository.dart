import '../../../core/error/result.dart';
import '../../shared/data/pagination/paginated_result.dart';
import '../domain/horse_record.dart';

abstract interface class HorsesRepository {
  Future<Result<List<HorseRecord>>> fetchHorses();

  /// Хуудаслалттайгаар морьдыг авах.
  Future<Result<PaginatedResult<HorseRecord>>> fetchHorsesPaginated({
    required int page,
    required int limit,
  });
  Future<Result<List<HorseRecord>>> syncHorses();
  Future<Result<HorseRecord>> saveHorse(HorseRecord horse);

  /// Морийг устгах. [id] - устгах морины ID.
  Future<Result<void>> deleteHorse(String id);
}
