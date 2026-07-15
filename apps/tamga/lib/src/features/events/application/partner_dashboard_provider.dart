/// Түншийн самбарын providers.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/domain/event.dart';
import '../../../shared/domain/event_registration.dart';
import '../../auth/application/auth_providers.dart';
import 'events_providers.dart';

/// Түншийн (одоогийн хэрэглэгчийн) арга хэмжээнүүдийн жагсаалт.
///
/// Зөвхөн `ownerId` нь одоогийн хэрэглэгчийн ID-тай тэнцэх арга хэмжээнүүдийг
/// буцаана.
final partnerEventsProvider = FutureProvider<List<Event>>((ref) async {
  final authState = ref.watch(authStateProvider).valueOrNull;
  final userId = authState?.userId;
  if (userId == null || userId.isEmpty) return [];

  final repository = await ref.watch(eventRepositoryProvider.future);
  final result = await repository.fetchEventsByOwner(userId);
  return result.getOrThrow();
});

/// Тухайн арга хэмжээний бүртгэлийн тоог буцаах FutureProvider.
///
/// `eventRegistrationsProvider(eventId)`-ээс бүртгэлийн тоог гаргаж авна.
final registrationCountProvider = FutureProvider.family<int, String>((
  ref,
  eventId,
) async {
  final result = await ref.watch(eventRegistrationsProvider(eventId).future);
  // Цуцлагдсан бүртгэлийг тоолохгүй
  return result.where((r) => r.status != RegistrationStatus.cancelled).length;
});
