import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/horses/data/csv_import_service.dart';
import 'package:tamga/src/shared/domain/horse.dart';

const _header = 'Нэр,Хүйс,Зүс,Төрсөн он,Аавын нэр,Ээжийн нэр';

Horse _horse(String name) {
  return Horse(
    id: 'existing-$name',
    name: name,
    relationLabel: '',
    coat: 'Хээр',
    birthYear: 2020,
    awardCount: 0,
    offspringCount: 0,
    isOwnedByHousehold: true,
    notes: '',
    gender: HorseGender.gelding,
    createdAt: DateTime(2026, 1, 1),
    updatedAt: DateTime(2026, 1, 1),
  );
}

void main() {
  group('CsvImportService.parseContent', () {
    test('parses valid rows from CSV content', () {
      final summary = CsvImportService.parseContent('''
$_header
Хүрэл,Азарга,Хүрэн,2020,Бадам,Сарнай
Салхи,Гүү,Хээр,2019,,
''');

      expect(summary.validCount, 2);
      expect(summary.invalidCount, 0);
      expect(summary.duplicateCount, 0);
      expect(summary.rows, hasLength(2));
      expect(summary.rows[0].name, 'Хүрэл');
      expect(summary.rows[0].gender, HorseGender.stallion);
      expect(summary.rows[0].coat, 'Хүрэн');
      expect(summary.rows[0].birthYear, 2020);
      expect(summary.rows[0].sireName, 'Бадам');
      expect(summary.rows[0].damName, 'Сарнай');
      expect(summary.rows[1].sireName, '');
      expect(summary.rows[1].damName, '');
    });

    test('parses Mongolian gender words', () {
      final summary = CsvImportService.parseContent('''
$_header
Нэг,Азарга,Хээр,2020
Хоёр,Гүү,Бор,2019
Гурав,Унага,Саарал,2021
Дөрөв,Морь,Хүрэн,2018
''');

      expect(summary.rows[0].gender, HorseGender.stallion);
      expect(summary.rows[1].gender, HorseGender.mare);
      expect(summary.rows[2].gender, HorseGender.foal);
      expect(summary.rows[3].gender, HorseGender.gelding);
    });

    test('parses English gender words', () {
      final summary = CsvImportService.parseContent('''
$_header
One,stallion,Хээр,2020
Two,mare,Бор,2019
Three,foal,Саарал,2021
Four,gelding,Хүрэн,2018
''');

      expect(summary.rows[0].gender, HorseGender.stallion);
      expect(summary.rows[1].gender, HorseGender.mare);
      expect(summary.rows[2].gender, HorseGender.foal);
      expect(summary.rows[3].gender, HorseGender.gelding);
    });

    test('unknown gender defaults to gelding without invalidating the row', () {
      final summary = CsvImportService.parseContent('''
$_header
Хачирхалтай,тэмээ,Хээр,2020
''');

      expect(summary.validCount, 1);
      expect(summary.rows.single.gender, HorseGender.gelding);
      expect(summary.rows.single.isValid, true);
    });

    test('row with fewer than four columns is invalid', () {
      final summary = CsvImportService.parseContent('''
$_header
Дутуу,Азарга
''');

      expect(summary.invalidCount, 1);
      expect(summary.validCount, 0);
      expect(summary.rows.single.isValid, false);
      expect(
        summary.rows.single.errors,
        contains('Дутуу мөр: 4-өөс бага багана байна'),
      );
    });

    test('empty name is invalid', () {
      final summary = CsvImportService.parseContent('''
$_header
,Азарга,Хээр,2020
''');

      expect(summary.invalidCount, 1);
      expect(summary.rows.single.errors, contains('Нэр хоосон байна'));
    });

    test('out-of-range birth year is invalid', () {
      final summary = CsvImportService.parseContent('''
$_header
Хуучин,Азарга,Хээр,1800
''');

      expect(summary.invalidCount, 1);
      expect(
        summary.rows.single.errors,
        anyElement(contains('Төрсөн он буруу')),
      );
    });

    test('duplicate against existingHorses is counted and excluded', () {
      final summary = CsvImportService.parseContent(
        '''
$_header
Хүрэл,Азарга,Хүрэн,2020
Шинэ,Гүү,Бор,2019
''',
        existingHorses: [_horse('хүрэл')],
      );

      expect(summary.validCount, 1);
      expect(summary.duplicateCount, 1);
      expect(summary.rows.map((r) => r.name), ['Шинэ']);
      expect(summary.duplicates, ['Хүрэл']);
    });

    test('duplicate within the CSV is counted and listed', () {
      final summary = CsvImportService.parseContent('''
$_header
Давхар,Азарга,Хээр,2020
Давхар,Гүү,Бор,2019
''');

      expect(summary.validCount, 1);
      expect(summary.duplicateCount, 1);
      expect(summary.rows, hasLength(1));
      expect(summary.duplicates, ['Давхар']);
    });

    test('empty content returns an empty summary', () {
      final summary = CsvImportService.parseContent('');

      expect(summary.isEmpty, true);
      expect(summary.validCount, 0);
      expect(summary.invalidCount, 0);
      expect(summary.duplicateCount, 0);
    });

    test('header-only content returns zero counts', () {
      final summary = CsvImportService.parseContent(_header);

      expect(summary.isEmpty, true);
      expect(summary.validCount, 0);
      expect(summary.invalidCount, 0);
      expect(summary.rows, isEmpty);
    });

    test('quoted field containing a comma is parsed as one value', () {
      final summary = CsvImportService.parseContent('''
$_header
"Бат, Дорж",Азарга,Хээр,2020
''');

      expect(summary.validCount, 1);
      expect(summary.rows.single.name, 'Бат, Дорж');
      expect(summary.rows.single.gender, HorseGender.stallion);
    });
  });

  group('CsvImportRow.toHorse', () {
    test('builds a Horse with generated id, ownerId and parent notes', () {
      const row = CsvImportRow(
        name: 'Хүрэл',
        gender: HorseGender.stallion,
        coat: 'Хүрэн',
        birthYear: 2020,
        sireName: 'Бадам',
        damName: 'Сарнай',
      );

      final horse = row.toHorse(ownerId: 'owner-1');

      expect(horse.id, isNotEmpty);
      expect(horse.ownerId, 'owner-1');
      expect(horse.name, 'Хүрэл');
      expect(horse.gender, HorseGender.stallion);
      expect(horse.coat, 'Хүрэн');
      expect(horse.birthYear, 2020);
      expect(horse.isOwnedByHousehold, true);
      expect(horse.notes, contains('Аав: Бадам'));
      expect(horse.notes, contains('Ээж: Сарнай'));
    });

    test('toHorse notes omit absent parents and default ownerId', () {
      const row = CsvImportRow(
        name: 'Салхи',
        gender: HorseGender.mare,
        coat: 'Хээр',
        birthYear: 2019,
      );

      final horse = row.toHorse();

      expect(horse.notes, '');
      expect(horse.ownerId, '');
    });

    test('toHorse generates a unique id per call', () {
      const row = CsvImportRow(
        name: 'Хүрэл',
        gender: HorseGender.stallion,
        coat: 'Хүрэн',
        birthYear: 2020,
      );

      expect(row.toHorse().id, isNot(row.toHorse().id));
    });
  });

  group('CsvImportSummary', () {
    test('hasErrors reflects invalid rows', () {
      const clean = CsvImportSummary(
        rows: [],
        validCount: 1,
        invalidCount: 0,
        duplicateCount: 0,
      );
      const dirty = CsvImportSummary(
        rows: [],
        validCount: 0,
        invalidCount: 1,
        duplicateCount: 0,
      );

      expect(clean.hasErrors, false);
      expect(dirty.hasErrors, true);
    });

    test('hasDuplicates and isEmpty reflect state', () {
      const empty = CsvImportSummary(
        rows: [],
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
      );
      // validCount > 0 implies rows is non-empty (valid rows are added to
      // rows), so this fixture must carry a row to be consistent.
      const dup = CsvImportSummary(
        rows: [
          CsvImportRow(
            name: 'Хүрэл',
            gender: HorseGender.gelding,
            coat: 'Хүрэн',
            birthYear: 2020,
          ),
        ],
        validCount: 1,
        invalidCount: 0,
        duplicateCount: 2,
        duplicates: ['Хүрэл'],
      );

      expect(empty.isEmpty, true);
      expect(empty.hasDuplicates, false);
      expect(dup.isEmpty, false);
      expect(dup.hasDuplicates, true);
      expect(dup.duplicates, ['Хүрэл']);
    });
  });

  group('CsvImportService.parseFile', () {
    test('returns an empty summary for a missing file', () async {
      final summary = await CsvImportService.parseFile(
        '/nonexistent/import.csv',
      );

      expect(summary.isEmpty, true);
      expect(summary.validCount, 0);
    });

    test('reads and parses a real CSV file', () async {
      final dir = Directory.systemTemp.createTempSync('csv_import_test');
      final file = File('${dir.path}/import.csv')
        ..writeAsStringSync('$_header\nХүрэл,Азарга,Хүрэн,2020,Бадам,Сарнай\n');

      final summary = await CsvImportService.parseFile(file.path);

      expect(summary.validCount, 1);
      expect(summary.rows.single.name, 'Хүрэл');
    });
  });
}
