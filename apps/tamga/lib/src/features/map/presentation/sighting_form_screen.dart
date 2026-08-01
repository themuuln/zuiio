import 'package:uuid/uuid.dart';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/error/error_helpers.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/map_providers.dart';
import '../application/sighting_providers.dart';
import '../domain/sighting_report.dart';

/// Form screen for community members to report "I saw this horse"
/// linked to a specific lost horse report.
class SightingFormScreen extends ConsumerStatefulWidget {
  const SightingFormScreen({super.key, required this.reportId});

  final String reportId;

  @override
  ConsumerState<SightingFormScreen> createState() => _SightingFormScreenState();
}

class _SightingFormScreenState extends ConsumerState<SightingFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _locationNameController = TextEditingController();
  final _descriptionController = TextEditingController();

  bool _isAnonymous = false;
  bool _isSubmitting = false;

  // ── Photo state ──
  final _picker = ImagePicker();
  File? _photo;

  @override
  void dispose() {
    _locationNameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  // ── Photo picker methods ──────────────────────────────────────────

  Future<void> _pickFromGallery() async {
    final xFile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );
    if (xFile != null) {
      setState(() => _photo = File(xFile.path));
    }
  }

  Future<void> _pickFromCamera() async {
    final xFile = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );
    if (xFile != null) {
      setState(() => _photo = File(xFile.path));
    }
  }

  void _removePhoto() {
    setState(() => _photo = null);
  }

  // ── Submit ────────────────────────────────────────────────────────

  Future<void> _submitSighting() async {
    if (!_formKey.currentState!.validate()) return;

    final userId = currentSupabaseUserId();
    if (userId == null) {
      TamgaToast.showError(context, 'Нэвтэрсний дараа мэдээлэл илгээнэ үү');
      return;
    }

    final pos = ref.read(currentPositionProvider).value;
    if (pos == null) {
      TamgaToast.showError(
        context,
        'GPS байршил олдсонгүй. Байршлаа асаагаад дахин оролдоно уу',
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final now = DateTime.now();
      final sightingId = const Uuid().v4();
      final sighting = SightingReport(
        id: sightingId,
        clientId: sightingId,
        reportId: widget.reportId,
        reporterId: userId,
        lat: pos.latitude,
        lng: pos.longitude,
        locationName: _locationNameController.text.trim().isNotEmpty
            ? _locationNameController.text.trim()
            : null,
        description: _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : null,
        photoUrl: _photo?.path,
        isAnonymous: _isAnonymous,
        createdAt: now,
      );

      await ref.read(reportSightingProvider(sighting).future);
      if (!mounted) return;
      TamgaToast.showSuccess(context, 'Мэдээлэл амжилттай илгээгдлээ');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      TamgaToast.showError(context, friendlyErrorMessage(e));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  // ── Build ─────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final currentPos = ref.watch(currentPositionProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Морь олсон мэдээлэл', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(TamgaSpacing.lg),
          children: [
            // ── Photo section ────────────────────────────────────
            Text(
              'Зураг (заавал биш)',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            _buildPhotoSection(colors),
            const SizedBox(height: TamgaSpacing.xl),

            // ── GPS location ─────────────────────────────────────
            Text(
              'Байршил',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            _buildLocationPreview(currentPos, colors),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Location description ─────────────────────────────
            Text(
              'Газрын нэр (заавал биш)',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TextFormField(
              controller: _locationNameController,
              decoration: InputDecoration(
                hintText: 'Жишээ: Хэнтий аймгийн Өндөрхаан сум',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: TamgaSpacing.md,
                  vertical: TamgaSpacing.md,
                ),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Description / Notes ──────────────────────────────
            Text(
              'Тайлбар (заавал биш)',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Морийг харагдсан талаар мэдээлэл...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: TamgaSpacing.md,
                  vertical: TamgaSpacing.md,
                ),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Anonymous toggle ─────────────────────────────────
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Нууцлан мэдээлэх', style: TamgaTypography.body()),
              subtitle: Text(
                'Таны нэр нууцлаг хэрэглэгч болон харагдана',
                style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
              ),
              value: _isAnonymous,
              onChanged: (v) => setState(() => _isAnonymous = v),
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Submit button ────────────────────────────────────
            SizedBox(
              height: 50,
              child: FilledButton(
                onPressed: _isSubmitting ? null : _submitSighting,
                style: FilledButton.styleFrom(
                  backgroundColor: colors.primary,
                  foregroundColor: colors.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadiusSmall,
                    ),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        'Мэдээлэл илгээх',
                        style: TamgaTypography.body(
                          weight: FontWeight.w600,
                          color: colors.onPrimary,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Photo section ───────────────────────────────────────────────

  Widget _buildPhotoSection(TamgaColors colors) {
    if (_photo != null) {
      return Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
            child: Image.file(
              _photo!,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Positioned(
            top: TamgaSpacing.sm,
            right: TamgaSpacing.sm,
            child: GestureDetector(
              onTap: _removePhoto,
              child: Container(
                padding: const EdgeInsets.all(TamgaSpacing.xs),
                decoration: BoxDecoration(
                  color: colors.destructive,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.close,
                  size: 18,
                  color: colors.destructiveForeground,
                ),
              ),
            ),
          ),
        ],
      );
    }

    return Row(
      children: [
        Expanded(
          child: _buildPhotoActionButton(
            icon: Icons.camera_alt_outlined,
            label: 'Камера',
            onTap: _pickFromCamera,
            colors: colors,
          ),
        ),
        const SizedBox(width: TamgaSpacing.md),
        Expanded(
          child: _buildPhotoActionButton(
            icon: Icons.photo_library_outlined,
            label: 'Зургийн сан',
            onTap: _pickFromGallery,
            colors: colors,
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required TamgaColors colors,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: TamgaSpacing.lg),
        decoration: BoxDecoration(
          color: colors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
          border: Border.all(color: colors.outline),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: colors.onSurfaceVariant, size: 28),
            const SizedBox(height: TamgaSpacing.xs),
            Text(
              label,
              style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }

  // ── Location preview ─────────────────────────────────────────────

  Widget _buildLocationPreview(AsyncValue<dynamic> pos, TamgaColors colors) {
    return pos.when(
      data: (position) {
        if (position == null) {
          return TamgaCard(
            child: Row(
              children: [
                Icon(
                  Icons.location_off_outlined,
                  color: colors.onSurfaceVariant,
                ),
                const SizedBox(width: TamgaSpacing.md),
                Expanded(
                  child: Text(
                    'GPS байршил олдсонгүй. Төхөөрөмжийн байршлаа асаана уу',
                    style: TamgaTypography.body(color: colors.onSurfaceVariant),
                  ),
                ),
              ],
            ),
          );
        }

        return TamgaCard(
          child: Row(
            children: [
              Icon(Icons.my_location, color: colors.primary),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Автомат байршил',
                      style: TamgaTypography.footnote(
                        weight: FontWeight.w600,
                        color: colors.onSurface,
                      ),
                    ),
                    const SizedBox(height: TamgaSpacing.xs),
                    Text(
                      '${position.latitude.toStringAsFixed(5)}, '
                      '${position.longitude.toStringAsFixed(5)}',
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const TamgaCard(
        child: Row(
          children: [
            LoadingIndicator(size: 16),
            SizedBox(width: TamgaSpacing.md),
            Text('GPS байршил татаж байна...'),
          ],
        ),
      ),
      error: (e, _) => TamgaCard(
        child: Row(
          children: [
            Icon(Icons.location_off_outlined, color: colors.error),
            const SizedBox(width: TamgaSpacing.md),
            Expanded(
              child: Text(
                'GPS алдаа: ${friendlyErrorMessage(e)}',
                style: TamgaTypography.body(color: colors.error),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
