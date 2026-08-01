import 'package:isar/isar.dart';

part 'isar_lost_horse_media_draft.g.dart';

/// Durable local attachment metadata for a recovery report submission.
@collection
class IsarLostHorseMediaDraft {
  IsarLostHorseMediaDraft();

  Id id = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String mediaId;

  @Index()
  late String reportId;

  @Index()
  late String accountId;

  late String localPath;
  late String mediaType;
  late String storagePath;
  late int sortOrder;
  late DateTime createdAt;
  bool uploaded = false;
  String? remoteUrl;
}
