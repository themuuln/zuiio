/// Тэмцээний профайлын providers.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/domain/event_registration.dart';
import '../domain/tournament_profile.dart';
import 'events_providers.dart';

/// Морины бүртгэлүүдийг ID-аар авах provider.
final eventRegistrationsByHorseProvider =
    FutureProvider.family<List<EventRegistration>, String>((
  ref,
  horseId,
) async {
  final repository =
      await ref.watch(eventRegistrationRepositoryProvider.future);
  final result = await repository.fetchRegistrationsByHorse(horseId);
  return result.getOrThrow();
});

/// Морины тэмцээний профайл.
///
/// Энэ нь дараах эх сурвалжуудаас арга хэмжээг цуглуулдаг:
/// 1. `Event.horseId == horseId` байх арга хэмжээнүүд (үндсэн морь)
/// 2. `EventRegistration`-аар бүртгүүлсэн арга хэмжээнүүд
final tournamentProfileProvider =
    FutureProvider.family<TournamentProfile?, String>((ref, horseId) async {
      final events = await ref.watch(eventsProvider.future);
      final registrations = await ref.watch(
        eventRegistrationsByHorseProvider(horseId).future,
      );

      // Энэ морь бүртгэлтэй арга хэмжээний ID-ууд
      final registeredEventIds = registrations
          .where((r) => r.status != RegistrationStatus.cancelled)
          .map((r) => r.eventId)
          .toSet();

      // Хувь морины арга хэмжээг шүүх (үндсэн + бүртгүүлсэн)
      final horseEvents = events
          .where(
            (event) =>
                event.horseId == horseId ||
                registeredEventIds.contains(event.id),
          )
          .map(
            (event) => <String, dynamic>{
              'id': event.id,
              'name': event.title,
              'date': event.date?.toIso8601String(),
              'place': _parsePlace(event.result ?? ''),
              'participants': 0,
              'prize': event.prizeAmount,
              'notes': event.result ?? '',
            },
          )
          .toList();

      if (horseEvents.isEmpty) return null;

      // Морины нэрийг олох
      final horseName = events
              .where((e) => e.horseId == horseId)
              .map((e) => e.horseName)
              .firstOrNull ??
          '';

      return TournamentProfileBuilder.fromEvents(
        horseId: horseId,
        horseName: horseName,
        events: horseEvents,
      );
    });

/// Байрны дугаарыг ойлгох.
///
/// "1-р байр", "Түрүү", "Амжилттай" гэх мэт текстээс дугаарыг гаргах.
int _parsePlace(String resultText) {
  if (resultText.isEmpty) return 0;
  // "Түрүү" → 1
  if (resultText.contains('Түрүү') || resultText.contains('түрүү')) return 1;
  // "1-р байр" гэх мэт текстээс дугаарыг гаргах
  final match = RegExp(r'(\d+)').firstMatch(resultText);
  if (match != null) {
    return int.tryParse(match.group(1)!) ?? 0;
  }
  // Амжилттай, Оролцсон → participation
  return 0;
}
