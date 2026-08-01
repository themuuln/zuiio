import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/map/domain/lost_horse_report.dart';
import 'package:tamga/src/features/shared/data/isar_schemas/isar_lost_horse_report.dart';

void main() {
  test(
    'public sharing fields survive local Isar mapping without raw token',
    () {
      final report = LostHorseReport(
        id: 'public-report',
        ownerId: 'owner-1',
        lastSeenLat: 47.9,
        lastSeenLng: 106.9,
        lastSeenAt: DateTime(2026, 6, 1),
        createdAt: DateTime(2026, 6, 1),
        updatedAt: DateTime(2026, 6, 1),
        publicShareToken: 'raw-secret-token',
        publicTokenHash: 'sha256-hash',
        publicAccessEnabled: true,
        publicLocationPrecision: 'aimag',
        publicContactMode: 'phone',
      );

      final stored = IsarLostHorseReport.fromDomain(report);
      final restored = stored.toDomain();

      expect(stored.publicTokenHash, 'sha256-hash');
      expect(restored.publicTokenHash, 'sha256-hash');
      expect(restored.publicAccessEnabled, isTrue);
      expect(restored.publicLocationPrecision, 'aimag');
      expect(restored.publicContactMode, 'phone');
      expect(restored.publicShareToken, isNull);
    },
  );
}
