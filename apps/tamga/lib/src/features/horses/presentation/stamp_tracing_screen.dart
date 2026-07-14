import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';

/// A screen for tracing a stamp from a reference image.
///
/// Users can draw over the uploaded photo to create a clean SVG stamp.
class StampTracingScreen extends StatefulWidget {
  const StampTracingScreen({required this.imageFile, super.key});

  final File imageFile;

  /// Returns the SVG string if tracing was completed.
  static Future<String?> show(BuildContext context, File imageFile) {
    return Navigator.of(context, rootNavigator: true).push<String?>(
      MaterialPageRoute(
        builder: (_) => StampTracingScreen(imageFile: imageFile),
      ),
    );
  }

  @override
  State<StampTracingScreen> createState() => _StampTracingScreenState();
}

class _StampTracingScreenState extends State<StampTracingScreen> {
  final List<DrawnPath> _paths = [];
  DrawnPath? _currentPath;
  double _strokeWidth = 4.0;
  bool _isEraser = false;
  double _imageOpacity = 0.5;
  ui.Image? _backgroundImage;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  Future<void> _loadImage() async {
    final bytes = await widget.imageFile.readAsBytes();
    final codec = await ui.instantiateImageCodec(bytes);
    final frame = await codec.getNextFrame();
    setState(() {
      _backgroundImage = frame.image;
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _backgroundImage?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Тамга зурах'),
        actions: [
          IconButton(
            onPressed: _paths.isEmpty ? null : _undo,
            icon: const Icon(Icons.undo),
            tooltip: 'Буцаах',
          ),
          IconButton(
            onPressed: _paths.isEmpty ? null : _clear,
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Арилгах',
          ),
          IconButton(
            onPressed: _save,
            icon: const Icon(Icons.check),
            tooltip: 'Хадгалах',
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Toolbar ──
          _buildToolbar(theme),

          // ── Canvas ──
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _buildCanvas(),
          ),
        ],
      ),
    );
  }

  Widget _buildToolbar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        border: Border(
          bottom: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      child: Row(
        children: [
          // ── Pen/Eraser toggle ──
          IconButton(
            onPressed: () => setState(() => _isEraser = false),
            icon: Icon(
              Icons.edit,
              color: !_isEraser ? theme.colorScheme.primary : null,
            ),
            tooltip: 'Зүзгэн',
          ),
          IconButton(
            onPressed: () => setState(() => _isEraser = true),
            icon: Icon(
              Icons.auto_fix_high,
              color: _isEraser ? theme.colorScheme.primary : null,
            ),
            tooltip: 'oader',
          ),

          const SizedBox(width: AppSpacing.lg),

          // ── Stroke width ──
          Expanded(
            child: Row(
              children: [
                const Text('Тэмдэг: '),
                Expanded(
                  child: Slider(
                    value: _strokeWidth,
                    min: 1,
                    max: 20,
                    onChanged: (v) => setState(() => _strokeWidth = v),
                  ),
                ),
                Text('${_strokeWidth.round()}'),
              ],
            ),
          ),

          const SizedBox(width: AppSpacing.lg),

          // ── Image opacity ──
          Expanded(
            child: Row(
              children: [
                const Text('Зураг: '),
                Expanded(
                  child: Slider(
                    value: _imageOpacity,
                    min: 0,
                    max: 1,
                    onChanged: (v) => setState(() => _imageOpacity = v),
                  ),
                ),
                Text('${(_imageOpacity * 100).round()}%'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCanvas() {
    return GestureDetector(
      onPanStart: _onPanStart,
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: CustomPaint(
        painter: StampPainter(
          paths: _paths,
          currentPath: _currentPath,
          backgroundImage: _backgroundImage,
          imageOpacity: _imageOpacity,
        ),
        size: Size.infinite,
      ),
    );
  }

  void _onPanStart(DragStartDetails details) {
    final box = context.findRenderObject() as RenderBox?;
    if (box == null) return;

    final localPosition = box.globalToLocal(details.globalPosition);
    setState(() {
      _currentPath = DrawnPath(
        points: [localPosition],
        strokeWidth: _strokeWidth,
        isEraser: _isEraser,
      );
    });
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (_currentPath == null) return;

    final box = context.findRenderObject() as RenderBox?;
    if (box == null) return;

    final localPosition = box.globalToLocal(details.globalPosition);
    setState(() {
      _currentPath!.points.add(localPosition);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    if (_currentPath != null) {
      setState(() {
        _paths.add(_currentPath!);
        _currentPath = null;
      });
    }
  }

  void _undo() {
    if (_paths.isNotEmpty) {
      setState(() => _paths.removeLast());
    }
  }

  void _clear() {
    setState(() => _paths.clear());
  }

  Future<void> _save() async {
    if (_paths.isEmpty) {
      TamgaToast.show(context, 'Тамга зурагна уу!');
      return;
    }

    final svg = _generateSvg();

    if (mounted) {
      Navigator.of(context).pop(svg);
    }
  }

  String _generateSvg() {
    final buffer = StringBuffer();
    buffer.writeln(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
    );

    for (final path in _paths) {
      if (path.points.isEmpty) continue;

      final pathData = StringBuffer();
      pathData.write('M ${path.points.first.dx} ${path.points.first.dy}');

      for (int i = 1; i < path.points.length; i++) {
        pathData.write(' L ${path.points[i].dx} ${path.points[i].dy}');
      }

      buffer.writeln(
        '  <path d="$pathData" fill="none" stroke="${path.isEraser ? '#FFFFFF' : '#000000'}" stroke-width="${path.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>',
      );
    }

    buffer.writeln('</svg>');
    return buffer.toString();
  }
}

/// Represents a single drawn path.
class DrawnPath {
  DrawnPath({
    required this.points,
    required this.strokeWidth,
    this.isEraser = false,
  });

  final List<Offset> points;
  final double strokeWidth;
  final bool isEraser;
}

/// Custom painter for the stamp tracing canvas.
class StampPainter extends CustomPainter {
  StampPainter({
    required this.paths,
    this.currentPath,
    this.backgroundImage,
    this.imageOpacity = 0.5,
  });

  final List<DrawnPath> paths;
  final DrawnPath? currentPath;
  final ui.Image? backgroundImage;
  final double imageOpacity;

  @override
  void paint(Canvas canvas, Size size) {
    // Draw background image
    if (backgroundImage != null) {
      final paint = Paint()
        ..color = Color.fromRGBO(255, 255, 255, imageOpacity);

      // Scale image to fit canvas while maintaining aspect ratio
      final imageWidth = backgroundImage!.width.toDouble();
      final imageHeight = backgroundImage!.height.toDouble();
      final scaleX = size.width / imageWidth;
      final scaleY = size.height / imageHeight;
      final scale = scaleX < scaleY ? scaleX : scaleY;

      final dx = (size.width - imageWidth * scale) / 2;
      final dy = (size.height - imageHeight * scale) / 2;

      canvas.save();
      canvas.translate(dx, dy);
      canvas.scale(scale);
      canvas.drawImage(backgroundImage!, Offset.zero, paint);
      canvas.restore();
    }

    // Draw completed paths
    for (final path in paths) {
      _drawPath(canvas, path);
    }

    // Draw current path
    if (currentPath != null) {
      _drawPath(canvas, currentPath!);
    }
  }

  void _drawPath(Canvas canvas, DrawnPath path) {
    if (path.points.isEmpty) return;

    final paint = Paint()
      ..color = path.isEraser ? Colors.white : Colors.black
      ..strokeWidth = path.strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final pathObj = ui.Path();
    pathObj.moveTo(path.points.first.dx, path.points.first.dy);

    for (int i = 1; i < path.points.length; i++) {
      pathObj.lineTo(path.points[i].dx, path.points[i].dy);
    }

    canvas.drawPath(pathObj, paint);
  }

  @override
  bool shouldRepaint(covariant StampPainter oldDelegate) => true;
}
