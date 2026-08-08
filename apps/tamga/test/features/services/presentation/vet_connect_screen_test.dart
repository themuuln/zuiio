import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:tamga/src/features/services/application/vet_directory_providers.dart';
import 'package:tamga/src/features/services/domain/vet_profile.dart';
import 'package:tamga/src/features/services/presentation/vet_connect_screen.dart';
import 'package:tamga/src/core/theme/tamga_design_system.dart';

/// Helper to create a ProviderScope wrapping VetConnectScreen.
Widget createVetConnectScreen({List<VetProfile>? profiles}) {
  return ProviderScope(
    overrides: [
      allVetProfilesProvider.overrideWith((ref) async {
        return profiles ?? [];
      }),
      filteredVetProfilesProvider.overrideWith((ref, filter) async {
        var result = profiles ?? <VetProfile>[];
        if (filter.aimag != null && filter.aimag!.isNotEmpty) {
          // Since we mock at a higher level, just return all for simplicity
        }
        if (filter.specialization != null &&
            filter.specialization!.isNotEmpty) {
          result = result
              .where((v) => v.specialization.contains(filter.specialization))
              .toList();
        }
        return result;
      }),
      // Override the family providers too
      vetProfilesByAimagProvider.overrideWith((ref, aimag) async {
        return profiles ?? [];
      }),
      vetProfileByIdProvider.overrideWith((ref, id) async {
        return profiles?.where((p) => p.id == id).firstOrNull;
      }),
    ],
    child: MaterialApp(
      theme: TamgaDesignSystem.buildThemeData(Brightness.light),
      home: const VetConnectScreen(),
    ),
  );
}

void main() {
  group('VetConnectScreen', () {
    VetProfile createTestProfile({
      String id = 'vet-1',
      String providerId = 'provider-1',
      List<String> specialization = const ['general'],
      int? consultationFee = 30000,
    }) {
      return VetProfile(
        id: id,
        providerId: providerId,
        specialization: specialization,
        licenseNumber: 'LIC-001',
        education: 'Vet School',
        experienceYears: 5,
        consultationFee: consultationFee,
        travelSurcharge: 10000,
        availableDays: ['mon', 'tue', 'wed'],
      );
    }

    testWidgets('shows empty state when no vets available', (tester) async {
      await tester.pumpWidget(createVetConnectScreen(profiles: []));
      await tester.pumpAndSettle();

      // Verify empty state
      expect(find.text('Мал эмч олдсонгүй / No Vets Found'), findsOneWidget);
    });

    testWidgets('shows vet profiles when data is available', (tester) async {
      final profiles = [
        createTestProfile(id: 'v1', specialization: ['general']),
        createTestProfile(id: 'v2', specialization: ['dentistry']),
      ];

      await tester.pumpWidget(createVetConnectScreen(profiles: profiles));
      await tester.pumpAndSettle();

      // Verify vet cards
      expect(find.text('Цаг захиалах / Book'), findsNWidgets(2));
    });

    testWidgets('shows filter chips for aimag selection', (tester) async {
      await tester.pumpWidget(createVetConnectScreen(profiles: []));
      await tester.pumpAndSettle();

      // Verify filter sections
      expect(find.text('Аймгаар шүүх / Filter by Aimag'), findsOneWidget);
      expect(
        find.text('Мэргэжлээр шүүх / Filter by Specialization'),
        findsOneWidget,
      );

      // Verify some filter chips
      expect(find.text('Бүгд / All'), findsWidgets);
      expect(find.text('Архангай'), findsOneWidget);
    });

    testWidgets('shows consultation fee on vet card', (tester) async {
      final profiles = [createTestProfile(id: 'v1', consultationFee: 50000)];

      await tester.pumpWidget(createVetConnectScreen(profiles: profiles));
      await tester.pumpAndSettle();

      // Verify fee is displayed
      expect(find.text('50000₮'), findsOneWidget);
    });

    testWidgets('shows licensed badge when license exists', (tester) async {
      final profiles = [
        createTestProfile(id: 'v1', specialization: ['general']),
      ];

      await tester.pumpWidget(createVetConnectScreen(profiles: profiles));
      await tester.pumpAndSettle();

      // Verify licensed badge
      expect(find.text('Лицензтэй / Licensed'), findsOneWidget);
    });
  });
}
