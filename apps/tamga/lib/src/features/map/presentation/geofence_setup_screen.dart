import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../events/presentation/widgets/event_location_picker.dart';
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
  double? _latitude;
  double? _longitude;

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
          // ── Intro ──────────────────────────────────────────────
          TamgaCard(
            color: colors.primaryContainer,
            padding: TamgaSpacing.cardPadding,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: colors.primary,
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadiusSmall,
                    ),
                  ),
                  child: const Icon(Icons.radar, size: 22, color: Colors.white),
                ),
                const SizedBox(width: TamgaSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Геохашаа',
                        style: TamgaTypography.body(
                          color: colors.onPrimaryContainer,
                          weight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Морь хязгаараас гарахад мэдэгдэнэ',
                        style: TamgaTypography.footnote(
                          color: colors.onPrimaryContainer.withValues(
                            alpha: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),

          // ── Нэр ──────────────────────────────────────────────
          _SectionCard(
            title: 'Мэдээлэл',
            icon: Icons.edit_location_alt_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),

          // ── Radius ────────────────────────────────────────────
          _SectionCard(
            title: 'Хэмжээ',
            icon: Icons.radio_button_checked_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Радиус: ${_radiusKm.toStringAsFixed(0)} км',
                      style: TamgaTypography.footnote(
                        weight: FontWeight.w600,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: Color(_selectedColor),
                        shape: BoxShape.circle,
                        border: Border.all(color: colors.outlineVariant),
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _radiusKm,
                  min: 1,
                  max: 50,
                  divisions: 49,
                  activeColor: Color(_selectedColor),
                  onChanged: (v) => setState(() => _radiusKm = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: TamgaSpacing.lg),

          // ── Color + location ──────────────────────────────────
          _SectionCard(
            title: 'Дүрс байршил',
            icon: Icons.color_lens_outlined,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                              ? const Icon(
                                  Icons.check,
                                  size: 20,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: TamgaSpacing.lg),
                Text(
                  'Байршил',
                  style: TamgaTypography.footnote(
                    weight: FontWeight.w600,
                    color: colors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: TamgaSpacing.sm),
                EventLocationPicker(
                  initialLatitude: _latitude,
                  initialLongitude: _longitude,
                  onLocationChanged: (lat, lng) {
                    setState(() {
                      _latitude = lat;
                      _longitude = lng;
                    });
                  },
                ),
              ],
            ),
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
                elevation: 0,
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
    if (_nameController.text.isEmpty) {
      TamgaToast.show(context, 'Талбайн нэр оруулна уу');
      return;
    }

    final area = SearchArea(
      id: '',
      name: _nameController.text,
      centerLat: _latitude ?? 47.9,
      centerLng: _longitude ?? 106.9,
      radiusKm: _radiusKm,
      color: _selectedColor,
      createdBy: currentSupabaseUserId() ?? '',
      createdAt: DateTime.now(),
    );

    ref.read(createSearchAreaProvider(area));
    Navigator.of(context).pop();
  }
}

/// Grouped section card for the geofence form — title + icon header,
/// then form fields below. Keeps the long form scannable.
class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return TamgaCard(
      padding: TamgaSpacing.cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: colors.primary),
              const SizedBox(width: TamgaSpacing.sm),
              Text(
                title,
                style: TamgaTypography.subheadline(weight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.md),
          child,
        ],
      ),
    );
  }
}
