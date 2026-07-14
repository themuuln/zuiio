/// Гүйцэтгэлийн шугаман график.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/theme/design_tokens.dart';

/// [PerformanceTrendChart] — гүйцэтгэлийн үзүүлэлтүүдийн өөрчлөлтийг харуулах
/// шугаман график.
class PerformanceTrendChart extends StatelessWidget {
  const PerformanceTrendChart({
    super.key,
    required this.dataPoints,
    this.xLabels,
    this.yLabel = '',
    this.height = 200,
    this.lineColor,
    this.dotColor,
    this.backgroundColor,
    this.gridLines = 4,
  });

  /// Графикийн цэгүүд (x,y хослол).
  final List<DataPoint> dataPoints;

  /// X тэнхлэгийн өгөгдлийн шошго. Урт нь [dataPoints]-тай тэнцүү байх ёстой.
  final List<String>? xLabels;

  /// Y тэнхлэгийн нэр.
  final String yLabel;

  /// Графикийн өндөр.
  final double height;

  /// Шугамын өнгө.
  final Color? lineColor;

  /// Цэгийн өнгө.
  final Color? dotColor;

  /// Дэвсгэр өнгө.
  final Color? backgroundColor;

  /// Y тэнхлэгийн сүлжээний шугамын тоо.
  final int gridLines;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final effectiveLineColor = lineColor ?? colors.primary;

    if (dataPoints.isEmpty) {
      return SizedBox(
        height: height,
        child: Center(
          child: Text(
            'Өгөгдөл байхгүй',
            style: TextStyle(color: colors.onSurfaceVariant),
          ),
        ),
      );
    }

    return SizedBox(
      height: height,
      child: CustomPaint(
        painter: _TrendChartPainter(
          dataPoints: dataPoints,
          xLabels: xLabels,
          yLabel: yLabel,
          lineColor: effectiveLineColor,
          dotColor: dotColor ?? effectiveLineColor,
          gridColor: colors.outlineVariant,
          labelColor: colors.onSurfaceVariant,
          gridLines: gridLines,
        ),
        size: Size.infinite,
      ),
    );
  }
}

/// Графикийн нэг цэг.
class DataPoint {
  const DataPoint({required this.x, required this.y});

  final double x;
  final double y;
}

/// [PerformanceTrendChart]-ийн зургийн painter.
class _TrendChartPainter extends CustomPainter {
  _TrendChartPainter({
    required this.dataPoints,
    required this.xLabels,
    required this.yLabel,
    required this.lineColor,
    required this.dotColor,
    required this.gridColor,
    required this.labelColor,
    required this.gridLines,
  });

  final List<DataPoint> dataPoints;
  final List<String>? xLabels;
  final String yLabel;
  final Color lineColor;
  final Color dotColor;
  final Color gridColor;
  final Color labelColor;
  final int gridLines;

  @override
  void paint(Canvas canvas, Size size) {
    final padding = const EdgeInsets.fromLTRB(40, 12, 16, 28);
    final chartRect = Rect.fromLTWH(
      padding.left,
      padding.top,
      (size.width - padding.left - padding.right).clamp(0, double.infinity),
      (size.height - padding.top - padding.bottom).clamp(0, double.infinity),
    );

    if (chartRect.width <= 0 || chartRect.height <= 0) return;

    final yValues = dataPoints.map((p) => p.y).toList();
    final minY = yValues.reduce((a, b) => a < b ? a : b);
    final maxY = yValues.reduce((a, b) => a > b ? a : b);
    final yRange = maxY - minY > 0 ? maxY - minY : 1.0;

    // ── Grid lines and Y labels ──
    final gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 0.5;

    for (var i = 0; i <= gridLines; i++) {
      final y = chartRect.top + (chartRect.height * i / gridLines);
      canvas.drawLine(
        Offset(chartRect.left, y),
        Offset(chartRect.right, y),
        gridPaint,
      );

      final labelValue = maxY - (yRange * i / gridLines);
      final labelText = TextPainter(
        text: TextSpan(
          text: labelValue.toStringAsFixed(1),
          style: TextStyle(
            color: labelColor,
            fontSize: 10,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      labelText.layout();
      labelText.paint(canvas, Offset(chartRect.left - labelText.width - 4, y - labelText.height / 2));
    }

    // ── Y axis label ──
    if (yLabel.isNotEmpty) {
      final yAxisLabel = TextPainter(
        text: TextSpan(
          text: yLabel,
          style: TextStyle(color: labelColor, fontSize: 10, fontWeight: FontWeight.w500),
        ),
        textDirection: TextDirection.ltr,
      );
      yAxisLabel.layout();
      yAxisLabel.paint(
        canvas,
        Offset(4, chartRect.top + chartRect.height / 2 - yAxisLabel.height / 2),
      );
    }

    // ── Line ──
    final linePaint = Paint()
      ..color = lineColor
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final dotPaint = Paint()
      ..color = dotColor
      ..style = PaintingStyle.fill;

    final dotStrokePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final path = Path();
    final points = <Offset>[];

    for (var i = 0; i < dataPoints.length; i++) {
      final x = chartRect.left +
          (chartRect.width * i / math.max(dataPoints.length - 1, 1));
      final y = chartRect.top +
          chartRect.height -
          ((dataPoints[i].y - minY) / yRange * chartRect.height);
      points.add(Offset(x, y));

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }

      // Dot
      canvas.drawCircle(Offset(x, y), 5, dotStrokePaint);
      canvas.drawCircle(Offset(x, y), 4, dotPaint);
    }

    canvas.drawPath(path, linePaint);

    // ── X axis labels ──
    if (xLabels != null) {
      for (var i = 0; i < xLabels!.length && i < dataPoints.length; i++) {
        final x = chartRect.left +
            (chartRect.width * i / math.max(dataPoints.length - 1, 1));
        final label = TextPainter(
          text: TextSpan(
            text: xLabels![i],
            style: TextStyle(color: labelColor, fontSize: 9),
          ),
          textDirection: TextDirection.ltr,
        );
        label.layout();
        label.paint(
          canvas,
          Offset(
            x - label.width / 2,
            chartRect.top + chartRect.height + 4,
          ),
        );
      }
    }
  }

  @override
  bool shouldRepaint(_TrendChartPainter oldDelegate) =>
      dataPoints != oldDelegate.dataPoints ||
      lineColor != oldDelegate.lineColor;
}
