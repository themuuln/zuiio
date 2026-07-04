import '../../../shared/domain/horse.dart';

export '../../../shared/domain/horse.dart';

/// Backward-compatibility redirect.
///
/// [HorseRecord] is now a type alias for the shared [Horse] model.
/// New code should import and use [Horse] directly.
typedef HorseRecord = Horse;
