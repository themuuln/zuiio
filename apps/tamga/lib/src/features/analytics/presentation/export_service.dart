import 'dart:io';

import 'package:csv/csv.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../domain/herd_analytics.dart';
import '../domain/health_analytics.dart';
import '../domain/financial_analytics.dart';
import '../domain/breeding_analytics.dart';

/// Аналитик өгөгдлийг CSV / PDF рүү экспортлох үйлчилгээ.
///
/// Экспортлосон файлыг share sheet-ээр нээнэ.
class AnalyticsExportService {
  AnalyticsExportService();

  // ── CSV Export ───────────────────────────────────────────────────

  /// Аналитик өгөгдлийг CSV файлд экспортлоно.
  Future<void> exportToCsv({
    required HerdAnalytics herd,
    required HealthAnalytics health,
    required FinancialAnalytics financial,
    BreedingAnalytics? breeding,
  }) async {
    final rows = <List<String>>[];

    // ── Сүргийн аналитик ──
    rows.add(['--- Сүргийн Аналитик ---']);
    rows.add(['Нийт морьд', '${herd.totalHorses}']);

    rows.add([]);
    rows.add(['Насны хуваарилалт']);
    rows.add(['Насны интервал', 'Тоо']);
    for (final bucket in herd.ageDistribution) {
      rows.add([bucket.label, '${bucket.count}']);
    }

    rows.add([]);
    rows.add(['Хүйсээр хуваарилалт']);
    rows.add(['Хүйс', 'Тоо']);
    for (final entry in herd.genderSplit.entries) {
      if (entry.value > 0) {
        rows.add([entry.key.displayName, '${entry.value}']);
      }
    }

    rows.add([]);
    rows.add(['Үүлдэр/Өнгөөр хуваарилалт']);
    rows.add(['Өнгө', 'Тоо']);
    for (final entry in herd.breedBreakdown.entries) {
      rows.add([entry.key, '${entry.value}']);
    }

    // ── Эрүүл мэндийн аналитик ──
    rows.add([]);
    rows.add(['--- Эрүүл Мэндийн Аналитик ---']);
    rows.add([
      'Вакцинжуулалтын хувь',
      '${(health.vaccinationRate * 100).toStringAsFixed(1)}%',
    ]);

    if (health.upcomingDueItems.isNotEmpty) {
      rows.add([]);
      rows.add(['Удахгүй хийх шаардлагатай зүйлс']);
      rows.add(['Морь ID', 'Төрөл', 'Дуусах хугацаа', 'Үлдсэн хоног']);
      for (final item in health.upcomingDueItems) {
        final dueDateStr =
            '${item.dueDate.year}-${item.dueDate.month.toString().padLeft(2, '0')}-${item.dueDate.day.toString().padLeft(2, '0')}';
        rows.add([
          item.horseName,
          item.logType.displayName,
          dueDateStr,
          '${item.daysUntilDue}',
        ]);
      }
    }

    // ── Санхүүгийн аналитик ──
    rows.add([]);
    rows.add(['--- Санхүүгийн Аналитик ---']);
    rows.add(['Нийт орлого', '${financial.totalRevenue}']);
    rows.add(['Нийт зарлага', '${financial.totalExpenses}']);
    rows.add(['Нийт комисс', '${financial.totalCommission}']);
    rows.add([
      'Хөрөнгө оруулалтын өгөөж',
      '${financial.roi.toStringAsFixed(1)}%',
    ]);
    rows.add(['Идэвхтэй зарууд', '${financial.activeListings}']);
    rows.add(['Борлуулсан зарууд', '${financial.soldListings}']);
    rows.add(['Дундаж үнэ', '${financial.averageSalePrice}']);

    // ── Үржүүлгийн аналитик ──
    if (breeding != null && breeding.totalBreedings > 0) {
      rows.add([]);
      rows.add(['--- Үржүүлгийн Аналитик ---']);
      rows.add(['Идэвхтэй хээлтүүлэг', '${breeding.activeBreedings}']);
      rows.add(['Нийт хээлтүүлэг', '${breeding.totalBreedings}']);
      rows.add([
        'Төллөлтийн амжилт',
        '${breeding.foalingSuccessRate.toStringAsFixed(1)}%',
      ]);

      if (breeding.recentBreedings.isNotEmpty) {
        rows.add([]);
        rows.add(['Хээлтүүлгийн бүртгэлүүд']);
        rows.add(['Эцэг', 'Эх', 'Хээлтсэн', 'Төллөх хугацаа', 'Төлөв']);
        for (final record in breeding.recentBreedings) {
          rows.add([
            record.sireName,
            record.damName,
            '${record.breedingDate.year}-${record.breedingDate.month.toString().padLeft(2, '0')}-${record.breedingDate.day.toString().padLeft(2, '0')}',
            '${record.expectedFoalingDate.year}-${record.expectedFoalingDate.month.toString().padLeft(2, '0')}-${record.expectedFoalingDate.day.toString().padLeft(2, '0')}',
            record.statusDisplayName,
          ]);
        }
      }
    }

    final csvData = const ListToCsvConverter().convert(rows);
    await _saveAndShare(csvData, 'analytics_report.csv');
  }

  // ── PDF Export ───────────────────────────────────────────────────

  /// Аналитик өгөгдлийг PDF файлд экспортлоно.
  Future<void> exportToPdf({
    required HerdAnalytics herd,
    required HealthAnalytics health,
    required FinancialAnalytics financial,
    BreedingAnalytics? breeding,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            // Гарчиг
            pw.Header(
              level: 0,
              child: pw.Text(
                'Tamga Analytics Report',
                style: pw.TextStyle(
                  fontSize: 24,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.SizedBox(height: 8),
            pw.Text(
              'Үүсгэсэн: ${DateTime.now().toIso8601String()}',
              style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey),
            ),
            pw.SizedBox(height: 24),

            // ── Сүргийн аналитик ──
            pw.Header(level: 1, text: 'Сүргийн Аналитик'),
            pw.Text('Нийт морьд: ${herd.totalHorses}'),
            pw.SizedBox(height: 12),

            pw.Header(level: 2, text: 'Насны хуваарилалт'),
            _buildTable(
              headers: ['Насны интервал', 'Тоо'],
              rows: herd.ageDistribution
                  .map((b) => [b.label, '${b.count}'])
                  .toList(),
            ),
            pw.SizedBox(height: 12),

            pw.Header(level: 2, text: 'Хүйсээр хуваарилалт'),
            _buildTable(
              headers: ['Хүйс', 'Тоо'],
              rows: herd.genderSplit.entries
                  .where((e) => e.value > 0)
                  .map((e) => [e.key.displayName, '${e.value}'])
                  .toList(),
            ),
            pw.SizedBox(height: 12),

            pw.Header(level: 2, text: 'Үүлдэр/Өнгөөр хуваарилалт'),
            _buildTable(
              headers: ['Өнгө', 'Тоо'],
              rows: herd.breedBreakdown.entries
                  .map((e) => [e.key, '${e.value}'])
                  .toList(),
            ),

            // ── Эрүүл мэндийн аналитик ──
            pw.Header(level: 1, text: 'Эрүүл Мэндийн Аналитик'),
            pw.Text(
              'Вакцинжуулалтын хувь: ${(health.vaccinationRate * 100).toStringAsFixed(1)}%',
            ),
            pw.SizedBox(height: 12),

            if (health.upcomingDueItems.isNotEmpty) ...[
              pw.Header(level: 2, text: 'Удахгүй хийх шаардлагатай зүйлс'),
              _buildTable(
                headers: ['Морь ID', 'Төрөл', 'Дуусах огноо', 'Үлдсэн хоног'],
                rows: health.upcomingDueItems.map((item) {
                  return [
                    item.horseName,
                    item.logType.displayName,
                    '${item.dueDate.year}-${item.dueDate.month.toString().padLeft(2, '0')}-${item.dueDate.day.toString().padLeft(2, '0')}',
                    '${item.daysUntilDue}',
                  ];
                }).toList(),
              ),
            ],

            // ── Санхүүгийн аналитик ──
            pw.Header(level: 1, text: 'Санхүүгийн Аналитик'),
            pw.Text('Нийт орлого: ${financial.totalRevenue}'),
            pw.Text('Нийт зарлага: ${financial.totalExpenses}'),
            pw.Text('Нийт комисс: ${financial.totalCommission}'),
            pw.Text(
              'Хөрөнгө оруулалтын өгөөж: ${financial.roi.toStringAsFixed(1)}%',
            ),
            pw.Text('Идэвхтэй зарууд: ${financial.activeListings}'),
            pw.Text('Борлуулсан зарууд: ${financial.soldListings}'),
            pw.Text('Дундаж үнэ: ${financial.averageSalePrice}'),

            // ── Үржүүлгийн аналитик ──
            if (breeding != null && breeding.totalBreedings > 0) ...[
              pw.SizedBox(height: 16),
              pw.Header(level: 1, text: 'Үржүүлгийн Аналитик'),
              pw.Text('Идэвхтэй хээлтүүлэг: ${breeding.activeBreedings}'),
              pw.Text('Нийт хээлтүүлэг: ${breeding.totalBreedings}'),
              pw.Text(
                'Төллөлтийн амжилт: ${breeding.foalingSuccessRate.toStringAsFixed(1)}%',
              ),
              pw.SizedBox(height: 12),

              if (breeding.recentBreedings.isNotEmpty) ...[
                pw.Header(level: 2, text: 'Хээлтүүлгийн бүртгэлүүд'),
                _buildTable(
                  headers: ['Эцэг', 'Эх', 'Хээлтсэн', 'Төлөх', 'Төлөв'],
                  rows: breeding.recentBreedings.map((r) {
                    return [
                      r.sireName,
                      r.damName,
                      '${r.breedingDate.year}-${r.breedingDate.month.toString().padLeft(2, '0')}-${r.breedingDate.day.toString().padLeft(2, '0')}',
                      '${r.expectedFoalingDate.year}-${r.expectedFoalingDate.month.toString().padLeft(2, '0')}-${r.expectedFoalingDate.day.toString().padLeft(2, '0')}',
                      r.statusDisplayName,
                    ];
                  }).toList(),
                ),
              ],
            ],
          ];
        },
      ),
    );

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/analytics_report.pdf');
    await file.writeAsBytes(await pdf.save());
    await Share.shareXFiles([
      XFile(file.path),
    ], subject: 'Tamga Analytics Report');
  }

  // ── Helpers ─────────────────────────────────────────────────────

  /// CSV өгөгдлийг файлд хадгаад share хийх.
  Future<void> _saveAndShare(String csvData, String fileName) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    await file.writeAsString(csvData);
    await Share.shareXFiles([
      XFile(file.path),
    ], subject: 'Tamga Analytics Report');
  }

  /// PDF дотор хүснэгт үүсгэх.
  pw.Widget _buildTable({
    required List<String> headers,
    required List<List<String>> rows,
  }) {
    return pw.TableHelper.fromTextArray(
      headers: headers,
      data: rows,
      border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
      headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
      cellStyle: const pw.TextStyle(fontSize: 9),
      headerDecoration: const pw.BoxDecoration(color: PdfColors.grey200),
      cellAlignments: {0: pw.Alignment.centerLeft, 1: pw.Alignment.centerRight},
    );
  }
}
