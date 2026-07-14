import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Test file for VAL-LOC-006: Seed data integrity.
///
/// Verifies that the mongolian_locations seed data in migration 017
/// has entries for every aimag, no orphaned/duplicated sums, and
/// matches the expected administrative divisions.
void main() {
  group('VAL-LOC-006: Seed data integrity', () {
    late String migrationSql;
    late List<String> lines;

    setUpAll(() {
      // Read the migration file from the project root
      final file = File(
        'supabase/migrations/017_lost_horse_enhancements.sql',
      );
      migrationSql = file.readAsStringSync();
      lines = migrationSql.split('\n');
    });

    test('migration file exists and is non-empty', () {
      expect(migrationSql.isNotEmpty, isTrue,
          reason: 'Migration 017 must contain seed data');
    });

    test('contains mongolian_locations table creation', () {
      expect(migrationSql, contains('CREATE TABLE IF NOT EXISTS mongolian_locations'),
          reason: 'Migration must create mongolian_locations table');
    });

    test('kAimagList has 22 entries matching aimag list', () {
      // This is already tested in mongolian_locations_test.dart, but we
      // verify here that the SQL seed covers all entries in kAimagList
      const expectedAimags = [
        'Улаанбаатар',
        'Төв',
        'Хэнтий',
        'Булган',
        'Сэлэнгэ',
        'Дархан-Уул',
        'Орхон',
        'Архангай',
        'Өвөрхангай',
        'Баянхонгор',
        'Говь-Алтай',
        'Ховд',
        'Увс',
        'Завхан',
        'Дундговь',
        'Говьсүмбэр',
        'Дорнод',
        'Хамын',
        'Сүхбаатар',
        'Дорноговь',
        'Өмнөговь',
        'Баян-Өлгий',
      ];

      for (final aimag in expectedAimags) {
        expect(migrationSql, contains("'$aimag'"),
            reason: 'Migration must have seed data entries for $aimag');
      }
    });

    test('no orphaned aimags in INSERT statements', () {
      // Extract all UNIQUE aimag names from INSERT lines
      final aimagPattern = RegExp(r"\('([^']+)',\s*'[^']+'");
      final insertLines = lines
          .where((l) => l.trimLeft().startsWith('('))
          .map((l) => l.trim())
          .toList();

      final aimagsInSeed = <String>{};
      for (final line in insertLines) {
        final match = aimagPattern.firstMatch(line);
        if (match != null) {
          aimagsInSeed.add(match.group(1)!);
        }
      }

      // Each aimag in kAimagList must have at least one sum entry
      expect(aimagsInSeed.length, 22,
          reason: 'All 22 aimags/districts must have seed data entries');
    });

    test('no duplicate aimag+sum combinations', () {
      // Extract all (aimag, sum) pairs from INSERT lines
      final pairPattern = RegExp(r"\('([^']+)',\s*'([^']+)'");
      final insertLines = lines
          .where((l) => l.trimLeft().startsWith('('))
          .map((l) => l.trim())
          .toList();

      final seen = <String>{};
      final duplicates = <String>[];
      for (final line in insertLines) {
        final match = pairPattern.firstMatch(line);
        if (match != null) {
          final key = '${match.group(1)}:${match.group(2)}';
          if (!seen.add(key)) {
            duplicates.add(key);
          }
        }
      }

      expect(duplicates, isEmpty,
          reason: 'No duplicate aimag+sum combinations allowed');
    });

    test('all aimag slugs present and non-empty', () {
      final slugPattern = RegExp(r"\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)");
      final insertLines = lines
          .where((l) => l.trimLeft().startsWith('('))
          .map((l) => l.trim())
          .toList();

      for (final line in insertLines) {
        final match = slugPattern.firstMatch(line);
        if (match != null) {
          final aimagSlug = match.group(3)!;
          final sumSlug = match.group(4)!;
          expect(aimagSlug.trim().isNotEmpty, isTrue,
              reason: 'aimag_slug must be non-empty');
          expect(sumSlug.trim().isNotEmpty, isTrue,
              reason: 'sum_slug must be non-empty');
        }
      }
    });

    test('Баян-Өлгий has exactly 13 sums', () {
      final count = _countLinesForAimag(lines, 'Баян-Өлгий');
      expect(count, 13,
          reason: 'Баян-Өлгий must have 13 sum entries');
    });

    test('Улаанбаатар has exactly 9 districts', () {
      final count = _countLinesForAimag(lines, 'Улаанбаатар');
      expect(count, 9,
          reason: 'Улаанбаатар must have 9 district entries');
    });

    // ── VAL-LOC-002: Data-level sum filtering validation ──

    test('sums are correctly filtered by aimag (Архангай has 19 sums)', () {
      final count = _countLinesForAimag(lines, 'Архангай');
      expect(count, 19,
          reason: 'Архангай must have 19 sums');
    });

    test('sums are correctly filtered by aimag (Ховд has 17 sums)', () {
      final count = _countLinesForAimag(lines, 'Ховд');
      expect(count, 17,
          reason: 'Ховд must have 17 sums');
    });

    test('sums are correctly filtered by aimag (Дорнод has 14 sums)', () {
      final count = _countLinesForAimag(lines, 'Дорнод');
      expect(count, 14,
          reason: 'Дорнод must have 14 sums');
    });

    test('sums are unique per aimag (no duplicate sum names within same aimag)', () {
      // Parse (aimag, sum) pairs and check for duplicates within each aimag
      final pairPattern = RegExp(r"\('([^']+)',\s*'([^']+)'");
      final insertLines = lines
          .where((l) => l.trimLeft().startsWith('('))
          .map((l) => l.trim())
          .toList();

      final sumsByAimag = <String, Set<String>>{};
      for (final line in insertLines) {
        final match = pairPattern.firstMatch(line);
        if (match != null) {
          final aimag = match.group(1)!;
          final sum = match.group(2)!;
          sumsByAimag.putIfAbsent(aimag, () => <String>{});
          sumsByAimag[aimag]!.add(sum);
        }
      }

      // Verify no duplicates by comparing line count to unique sum count
      for (final aimag in sumsByAimag.keys) {
        final lineCount = _countLinesForAimag(lines, aimag);
        final uniqueCount = sumsByAimag[aimag]!.length;
        expect(lineCount, uniqueCount,
            reason: 'Aimag "$aimag" has $lineCount total lines but $uniqueCount unique sums — duplicates exist');
      }
    });
  });
}

/// Count the number of INSERT value lines for a given aimag.
/// Uses simple substring matching: counts lines starting with '(' that contain
/// the aimag name followed by a comma-quote pattern.
int _countLinesForAimag(List<String> lines, String aimag) {
  final target = "('$aimag',";
  return lines
      .where((l) => l.trimLeft().startsWith('(') && l.contains(target))
      .length;
}
