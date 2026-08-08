import 'dart:io';

import 'package:uuid/uuid.dart';

import '../../../shared/domain/horse.dart';

/// CSV import result for a single horse.
class CsvImportRow {
  const CsvImportRow({
    required this.name,
    required this.gender,
    required this.coat,
    required this.birthYear,
    this.sireName = '',
    this.damName = '',
    this.isValid = true,
    this.errors = const [],
  });

  final String name;
  final HorseGender gender;
  final String coat;
  final int birthYear;
  final String sireName;
  final String damName;
  final bool isValid;
  final List<String> errors;

  /// Convert to a Horse domain model.
  Horse toHorse({String? ownerId}) {
    return Horse(
      id: const Uuid().v4(),
      ownerId: ownerId ?? '',
      name: name,
      relationLabel: '',
      coat: coat,
      birthYear: birthYear,
      awardCount: 0,
      offspringCount: 0,
      isOwnedByHousehold: true,
      notes: _buildNotes(),
      gender: gender,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  String _buildNotes() {
    final parts = <String>[];
    if (sireName.isNotEmpty) parts.add('Аав: $sireName');
    if (damName.isNotEmpty) parts.add('Ээж: $damName');
    return parts.join('\n');
  }
}

/// CSV import summary.
class CsvImportSummary {
  const CsvImportSummary({
    required this.rows,
    required this.validCount,
    required this.invalidCount,
    required this.duplicateCount,
    this.duplicates = const [],
  });

  final List<CsvImportRow> rows;
  final int validCount;
  final int invalidCount;
  final int duplicateCount;
  final List<String> duplicates;

  bool get hasErrors => invalidCount > 0;
  bool get hasDuplicates => duplicateCount > 0;
  bool get isEmpty => rows.isEmpty;
}

/// Service for importing horses from CSV files.
///
/// Expected CSV format:
/// ```csv
/// Нэр,Хүйс,Зүс,Төрсөн он,Аавын нэр,Ээжийн нэр
/// Хүрэл,Азарга,Хүрэн,2020,Бадам,Сарнай
/// ```
class CsvImportService {
  /// Parse a CSV file and return validated rows.
  static Future<CsvImportSummary> parseFile(
    String filePath, {
    List<Horse>? existingHorses,
  }) async {
    final file = File(filePath);
    if (!await file.exists()) {
      return const CsvImportSummary(
        rows: [],
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
      );
    }

    final content = await file.readAsString();
    return parseContent(content, existingHorses: existingHorses);
  }

  /// Parse CSV content string and return validated rows.
  static CsvImportSummary parseContent(
    String content, {
    List<Horse>? existingHorses,
  }) {
    final lines = content
        .split('\n')
        .where((l) => l.trim().isNotEmpty)
        .toList();
    if (lines.isEmpty) {
      return const CsvImportSummary(
        rows: [],
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
      );
    }

    // Skip header row
    final dataLines = lines.length > 1 ? lines.sublist(1) : <String>[];
    final existingNames =
        existingHorses?.map((h) => h.name.toLowerCase()).toSet() ?? {};

    final rows = <CsvImportRow>[];
    final duplicateNames = <String>{};
    var validCount = 0;
    var invalidCount = 0;
    var duplicateCount = 0;

    for (final line in dataLines) {
      final row = _parseRow(line);
      if (row == null) {
        invalidCount++;
        continue;
      }

      // Check for duplicates
      if (existingNames.contains(row.name.toLowerCase())) {
        duplicateNames.add(row.name);
        duplicateCount++;
        continue;
      }

      // Check for duplicates within the CSV
      if (rows.any((r) => r.name.toLowerCase() == row.name.toLowerCase())) {
        duplicateNames.add(row.name);
        duplicateCount++;
        continue;
      }

      rows.add(row);
      validCount++;
    }

    return CsvImportSummary(
      rows: rows,
      validCount: validCount,
      invalidCount: invalidCount,
      duplicateCount: duplicateCount,
      duplicates: duplicateNames.toList(),
    );
  }

  /// Parse a single CSV row.
  static CsvImportRow? _parseRow(String line) {
    try {
      final fields = _splitCsvLine(line);
      if (fields.length < 4) {
        return CsvImportRow(
          name: '',
          gender: HorseGender.gelding,
          coat: '',
          birthYear: 0,
          isValid: false,
          errors: ['Дутуу мөр: 4-өөс бага багана байна'],
        );
      }

      final name = fields[0].trim();
      if (name.isEmpty) {
        return CsvImportRow(
          name: '',
          gender: HorseGender.gelding,
          coat: '',
          birthYear: 0,
          isValid: false,
          errors: ['Нэр хоосон байна'],
        );
      }

      final gender = _parseGender(fields[1].trim());
      final coat = fields[2].trim();
      final birthYear = int.tryParse(fields[3].trim()) ?? 0;
      final sireName = fields.length > 4 ? fields[4].trim() : '';
      final damName = fields.length > 5 ? fields[5].trim() : '';

      final errors = <String>[];
      if (birthYear < 1900 || birthYear > DateTime.now().year) {
        errors.add('Төрсөн он буруу: $birthYear');
      }

      return CsvImportRow(
        name: name,
        gender: gender,
        coat: coat,
        birthYear: birthYear,
        sireName: sireName,
        damName: damName,
        isValid: errors.isEmpty,
        errors: errors,
      );
    } catch (e) {
      return CsvImportRow(
        name: '',
        gender: HorseGender.gelding,
        coat: '',
        birthYear: 0,
        isValid: false,
        errors: ['Мөр уншихад алдаа гарлаа: $e'],
      );
    }
  }

  /// Parse gender from Mongolian or English text.
  static HorseGender _parseGender(String value) {
    final lower = value.toLowerCase();
    if (lower.contains('азарга') || lower == 'stallion' || lower == 'male') {
      return HorseGender.stallion;
    }
    if (lower.contains('гүү') || lower == 'mare' || lower == 'female') {
      return HorseGender.mare;
    }
    if (lower.contains('унага') || lower == 'foal') {
      return HorseGender.foal;
    }
    if (lower.contains('морь') || lower == 'gelding' || lower == 'gelding') {
      return HorseGender.gelding;
    }
    return HorseGender.gelding;
  }

  /// Split a CSV line handling quoted fields.
  static List<String> _splitCsvLine(String line) {
    final fields = <String>[];
    var current = StringBuffer();
    var inQuotes = false;

    for (var i = 0; i < line.length; i++) {
      final char = line[i];
      if (char == '"') {
        inQuotes = !inQuotes;
      } else if (char == ',' && !inQuotes) {
        fields.add(current.toString());
        current = StringBuffer();
      } else {
        current.write(char);
      }
    }
    fields.add(current.toString());

    return fields;
  }
}
