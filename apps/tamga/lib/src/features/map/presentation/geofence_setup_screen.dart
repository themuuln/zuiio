import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/theme/design_tokens.dart';
import '../application/geofence_providers.dart';
import '../domain/search_area.dart';

/// Create a custom geofence by tapping the map.
class GeofenceSetupScreen extends ConsumerStatefulWidget {
  const GeofenceSetupScreen({super.key});

  @override
  ConsumerState<GeofenceSetupScreen> createState() =>
      _GeofenceSetupScreenState();
}

class _GeofenceSetupScreenState extends ConsumerState<GeofenceSetupScreen> {
  final _nameController = TextEditingController();
  double _radiusKm = 10.0;
  int _selectedColor = 0xFFF06A2E;

  static const _presetColors = [
    0xFFF06A2E, // primary orange
    0xFFC41012, // destructive red
    0xFF0A6B1C, // success green
    0xFF0A3BA8, // info blue
    0xFFB55A0A, // warning amber
  ];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Хайх талбай үүсгэх', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        children: [
          // ── Name ──────────────────────────────────────────────
          Text(
            'Нэр',
            style: TamgaTypography.footnote(
              weight: FontWeight.w600,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              hintText: 'Талбайн нэр (жиш: Гэрийн ойролцоо)',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(
                  TamgaSpacing.cornerRadiusSmall,
                ),
              ),
            ),
          ),
          const SizedBox(height: TamgaSpacing.xl),

          // ── Radius ────────────────────────────────────────────
          Text(
            'Радиус: ${_radiusKm.toStringAsFixed(0)} км',
            style: TamgaTypography.footnote(
              weight: FontWeight.w600,
              color: colors.onSurfaceVariant,
            ),
          ),
          Slider(
            value: _radiusKm,
            min: 1,
            max: 50,
            divisions: 49,
            activeColor: Color(_selectedColor),
            onChanged: (v) => setState(() => _radiusKm = v),
          ),
          const SizedBox(height: TamgaSpacing.xl),

          // ── Color picker ──────────────────────────────────────
          Text(
            'Өнгө',
            style: TamgaTypography.footnote(
              weight: FontWeight.w600,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          Row(
            children: _presetColors.map((c) {
              final isSelected = c == _selectedColor;
              return Semantics(
                label: 'Өнгө сонгох',
                button: true,
                selected: isSelected,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => setState(() => _selectedColor = c),
                  child: Container(
                    width: 44,
                    height: 44,
                    margin: const EdgeInsets.only(right: TamgaSpacing.sm),
                    decoration: BoxDecoration(
                      color: Color(c),
                      shape: BoxShape.circle,
                      border: isSelected
                          ? Border.all(color: colors.onSurface, width: 2)
                          : null,
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 20, color: Colors.white)
                        : null,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: TamgaSpacing.xxxl),

          // ── Save ──────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _saveGeofence,
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(_selectedColor),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadius,
                  ),
                ),
              ),
              child: Text(
                'Хадгалах',
                style: TamgaTypography.body(
                  color: Colors.white,
                  weight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _saveGeofence() {
    if (_nameController.text.isEmpty) return;

    final area = SearchArea(
      id: '',
      name: _nameController.text,
      centerLat: 47.9,
      centerLng: 106.9,
      radiusKm: _radiusKm,
      color: _selectedColor,
      createdBy: currentSupabaseUserId() ?? '',
      createdAt: DateTime.now(),
    );

    ref.read(createSearchAreaProvider(area));
    Navigator.of(context).pop();
  }
}
