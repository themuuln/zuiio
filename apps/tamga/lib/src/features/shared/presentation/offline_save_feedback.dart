import 'package:flutter/material.dart';

import '../../../core/sync/connection_status.dart';
import '../../../core/widgets/widgets.dart';

/// Хадгалсан амжилтын тухай офлайн-aware snackbar.
///
/// Сүлжээ тасарсан үед хадгалахад дараах мессежийг харуулна:
/// "Хадгалагдлаа — Сүлжээнд холбогдсон үед синк хийгдэнэ".
///
/// Хэрэглэх жишээ:
/// ```dart
/// // Save form data
/// await repository.save(data);
///
/// // Show offline-aware feedback
/// showOfflineSaveFeedback(
///   context,
///   ConnectionMonitor.instance.current,
/// );
/// ```
///
/// [currentStatus] — одоогийн сүлжээний төлв (ConnectionMonitor-с).
/// [onSavedMessage] — хадгалалт амжилттай болсон мессеж (default: "Хадгалагдлаа").
/// [offlineMessage] — офлайн үед харуулах нэмэлт мессеж (default: "Сүлжээнд холбогдсон үед синк хийгдэнэ").
void showOfflineAwareSaveFeedback(
  BuildContext context,
  ConnectionStatus currentStatus, {
  String onSavedMessage = 'Хадгалагдлаа',
  String offlineMessage = 'Сүлжээнд холбогдсон үед синк хийгдэнэ',
}) {
  if (currentStatus == ConnectionStatus.offline) {
    TamgaToast.show(
      context,
      '$onSavedMessage — $offlineMessage',
      icon: Icons.cloud_upload_outlined,
    );
  } else {
    TamgaToast.showSuccess(
      context,
      onSavedMessage,
    );
  }
}
