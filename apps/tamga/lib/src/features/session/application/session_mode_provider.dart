import 'package:flutter_riverpod/flutter_riverpod.dart';

enum SessionMode { guestLocal }

final sessionModeProvider = Provider<SessionMode>((ref) {
  return SessionMode.guestLocal;
});
