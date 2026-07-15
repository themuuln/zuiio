/// Тэмцээний профайлыг автоматаар шинэчлэх provider.
///
/// Энэ module нь дараах зүйлсийг агуулна:
/// - `autoAchievementServiceProvider` — `AutoAchievementService`-г өгдөг
/// - `processEventCompletion()` — дууссан үйл явдлыг боловсруулж, бүртгэлтэй
///   моридын тэмцээний профайлыг шинэчилдэг
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/domain/event.dart';
import '../../../shared/domain/event_registration.dart';
import '../../events/data/event_registration_repository.dart';
import 'auto_achievement_service.dart';
import 'events_providers.dart';
import 'tournament_providers.dart';

/// `AutoAchievementService`-г өгөх provider.
final autoAchievementServiceProvider = Provider<AutoAchievementService>((ref) {
  return const AutoAchievementService();
});

/// Дууссан үйл явдлыг боловсруулж, бүртгэлтэй моридын тэмцээний профайлыг
/// шинэчлэх.
///
/// [ref] — provider-ийн Ref объект (жишээ нь, `ConsumerWidget`-ийн ref).
/// [event] — хадгалагдсан үйл явдал.
///
/// Энэ функцийг үйл явдал хадгалсны дараа дуудах хэрэгтэй. Функц нь дараах
/// алхмуудыг гүйцэтгэдэг:
/// 1. Үйл явдал дууссан эсэхийг шалгах (`result` хоосон биш, `isUpcoming` false)
/// 2. Дууссан бол тухайн үйл явдалд бүртгэлтэй моридыг олох
/// 3. Морид бүрийн `tournamentProfileProvider`-г invalidation хийх
///
/// Жишээ:
/// ```dart
/// final saveResult = await repo.saveEvent(event);
/// await processEventCompletion(ref, event);
/// ```
Future<void> processEventCompletion({
  required Event event,
  required EventRegistrationRepository registrationRepo,
  required void Function(String horseId) invalidateProfile,
}) async {
  final service = const AutoAchievementService();
  if (!service.isCompleted(event)) return;

  final result = await registrationRepo.fetchRegistrations(event.id);
  final registrations = result.getOrThrow();

  for (final reg in registrations) {
    if (reg.status != RegistrationStatus.cancelled) {
      invalidateProfile(reg.horseId);
    }
  }
}

/// Дууссан үйл явдлыг боловсруулж, бүртгэлтэй моридын тэмцээний профайлыг
/// шинэчлэх WidgetRef хувилбар.
///
/// [ref] — ConsumerWidget эсвэл ConsumerState-ийн ref объект.
/// [event] — хадгалагдсан үйл явдал.
Future<void> processEventCompletionFromRef(WidgetRef ref, Event event) async {
  final regRepo = await ref.read(eventRegistrationRepositoryProvider.future);
  await processEventCompletion(
    event: event,
    registrationRepo: regRepo,
    invalidateProfile: (horseId) {
      ref.invalidate(tournamentProfileProvider(horseId));
    },
  );
}
