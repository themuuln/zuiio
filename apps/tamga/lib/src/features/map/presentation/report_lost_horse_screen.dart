import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/constants/horse_coat_colors.dart';
import '../../../core/error/error_helpers.dart';
import '../../../features/payments/data/payment_service.dart';
import '../../../core/storage/cloud/media_storage_providers.dart';
import '../../../core/storage/cloud/media_storage_router.dart';
import '../../../core/storage/cloud/media_storage_service.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/horse.dart';
import '../../auth/application/auth_providers.dart';
import '../../horses/application/horses_providers.dart';
import '../../horses/domain/horse_record.dart';
import '../application/expiry_service.dart';
import '../application/location_providers.dart';
import '../application/lost_horse_providers.dart';
import '../application/map_providers.dart';
import '../domain/animal_enums.dart';
import '../domain/lost_horse_report.dart';
import '../domain/mongolian_locations.dart';

/// Report a lost horse — form with real horse list, GPS location, search radius.
class ReportLostHorseScreen extends ConsumerStatefulWidget {
  const ReportLostHorseScreen({super.key});

  @override
  ConsumerState<ReportLostHorseScreen> createState() =>
      _ReportLostHorseScreenState();
}

class _ReportLostHorseScreenState extends ConsumerState<ReportLostHorseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _bagController = TextEditingController();
  final _locationNameController = TextEditingController();
  final _lostCountController = TextEditingController(text: '1');
  double _searchRadiusKm = 5.0;
  Horse? _selectedHorse;
  bool _isSubmitting = false;

  // ── Location state ──
  String? _selectedAimag;
  String? _selectedSum;

  // ── Animal info state ──
  AnimalType? _selectedAnimalType;
  List<AnimalAge> _selectedAges = [];
  HorseGender? _selectedGender;
  HorseBreed? _selectedBreed;
  String? _selectedCoatColor;
  bool _animalInfoValidated = false;
  bool _locationValidated = false;

  // ── Media state ──
  final _picker = ImagePicker();
  final List<File> _localPhotos = [];
  bool _photosValidated = false;

  // ── Tamga & Ear mark state ──
  File? _tamgaFile;
  final _earMarkController = TextEditingController();
  static const int kMaxEarMarkLength = 500;

  // ── Contact phone state ──
  final _contactPhoneController = TextEditingController();

  // ── Pricing tier state ──
  LostHorsePricingTier _selectedPricingTier = LostHorsePricingTier.free;

  @override
  void initState() {
    super.initState();
    // Auto-fill contact phone from profile after first frame.
    Future.microtask(() {
      if (!mounted) return;
      final authState = ref.read(authStateProvider).valueOrNull;
      if (authState != null && authState.hasPhone) {
        _contactPhoneController.text = authState.phone!;
      }
    });
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _bagController.dispose();
    _locationNameController.dispose();
    _lostCountController.dispose();
    _earMarkController.dispose();
    _contactPhoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final horsesAsync = ref.watch(horsesProvider);
    final currentPos = ref.watch(currentPositionProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Хаяж морь оруулах', style: TamgaTypography.headline()),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(TamgaSpacing.lg),
          children: [
            // ── Horse selector ────────────────────────────────────
            Text(
              'Морь сонгох',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            horsesAsync.when(
              data: (horses) {
                if (horses.isEmpty) {
                  return TamgaCard(
                    child: Text(
                      'Морь байхгүй байна — эхлээд морь нэмнэ үү',
                      style: TamgaTypography.body(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  );
                }
                return DropdownButtonFormField<Horse>(
                  initialValue: _selectedHorse,
                  isExpanded: true,
                  decoration: InputDecoration(
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
                  items: horses
                      .map(
                        (h) => DropdownMenuItem(
                          value: h,
                          child: Text(h.displayName),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => _selectedHorse = v),
                  validator: (v) => v == null ? 'Морь сонгоно уу' : null,
                );
              },
              loading: () => const LoadingIndicator(size: 24),
              error: (e, _) => Text(
                friendlyErrorMessage(e),
                style: TamgaTypography.body(color: colors.error),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Аймаг / Сум / Баг / Газрын нэр ──────────────────
            _buildLocationSection(colors),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Малын мэдээлэл (Animal Info) ────────────────────
            _buildAnimalInfoSection(colors),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Тамга ба Им (Branding) ─────────────────────────
            _buildTamgaSection(colors),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Холбоо барих (Contact) ──────────────────────────
            _buildContactSection(colors),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Description ──────────────────────────────────────
            Text(
              'Тайлбар',
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
                hintText: 'Хаяж морийн талаарх мэдээлэл...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
              ),
              validator: (v) =>
                  (v == null || v.length < 10) ? 'Дор хаяж 10 тэмдэгт' : null,
            ),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Search radius ────────────────────────────────────
            Text(
              'Хайх радиус: ${_searchRadiusKm.toStringAsFixed(0)} км',
              style: TamgaTypography.footnote(
                weight: FontWeight.w600,
                color: colors.onSurfaceVariant,
              ),
            ),
            Slider(
              value: _searchRadiusKm,
              min: 1,
              max: 50,
              divisions: 49,
              activeColor: colors.primary,
              onChanged: (v) => setState(() => _searchRadiusKm = v),
            ),
            const SizedBox(height: TamgaSpacing.xl),

            // ── Last seen location ───────────────────────────────
            currentPos.when(
              data: (pos) {
                final lat = pos?.latitude.toStringAsFixed(4) ?? '--';
                final lng = pos?.longitude.toStringAsFixed(4) ?? '--';
                return TamgaCard(
                  child: Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        color: pos != null ? colors.primary : colors.error,
                      ),
                      const SizedBox(width: TamgaSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Сүүлд үзсэн байршил',
                              style: TamgaTypography.body(),
                            ),
                            Text(
                              pos != null
                                  ? '$lat, $lng ( одоогийн байршил )'
                                  : 'GPS идэвхигүй — байршил тодорхойгүй',
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
                    LoadingIndicator(size: 20),
                    SizedBox(width: TamgaSpacing.md),
                    Text('Байршил тодорхойлж байна...'),
                  ],
                ),
              ),
              error: (_, _) => TamgaCard(
                child: Row(
                  children: [
                    Icon(Icons.location_off, color: colors.error),
                    const SizedBox(width: TamgaSpacing.md),
                    Text(
                      'GPS алдаа',
                      style: TamgaTypography.body(color: colors.error),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xxxl),

            // ── Зураг (Media) ──────────────────────────────────────
            _buildMediaSection(colors),
            const SizedBox(height: TamgaSpacing.xxxl),

            // ── Үнэ ба Нөхцөл (Pricing) ───────────────────────────
            _buildPricingSection(colors),
            const SizedBox(height: TamgaSpacing.xxxl),

            // ── Submit ───────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReport,
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.error,
                  foregroundColor: colors.onError,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadius,
                    ),
                  ),
                ),
                child: _isSubmitting
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: colors.onError,
                        ),
                      )
                    : Text(
                        'Хаяж морь зарлах',
                        style: TamgaTypography.body(
                          color: colors.onError,
                          weight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Location Section ─────────────────────────────────────────────

  Widget _buildLocationSection(TamgaColors colors) {
    final sumsAsync = ref.watch(filteredSumsProvider(_selectedAimag));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text(
          'Байршил',
          style: TamgaTypography.headline(
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: TamgaSpacing.md),

        // ── Аймаг ──
        Text(
          'Аймаг',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCombobox<String>(
          items: kAimagList,
          value: _selectedAimag,
          onSelected: (v) {
            setState(() {
              _selectedAimag = v;
              // Reset sum when aimag changes
              _selectedSum = null;
            });
          },
          itemBuilder: (item) => TamgaComboboxItem(
            value: item,
            child: Text(item),
          ),
          placeholder: 'Аймаг сонгоно уу',
          showClear: true,
        ),
        if (_locationValidated && _selectedAimag == null)
          Padding(
            padding: const EdgeInsets.only(top: TamgaSpacing.xs, left: TamgaSpacing.sm),
            child: Text(
              'Аймаг сонгоно уу',
              style: TamgaTypography.caption1(color: colors.error),
            ),
          ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Сум ──
        Text(
          'Сум / Дүүрэг',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        sumsAsync.when(
          data: (sums) {
            if (_selectedAimag == null) {
              return TamgaCombobox<String>(
                items: const <String>[],
                value: null,
                onSelected: (_) {},
                itemBuilder: (item) => TamgaComboboxItem(
                  value: item,
                  child: Text(item),
                ),
                placeholder: 'Эхлээд аймаг сонгоно уу',
                enabled: false,
              );
            }
            return TamgaCombobox<String>(
              items: sums,
              value: _selectedSum,
              onSelected: (v) => setState(() => _selectedSum = v),
              itemBuilder: (item) => TamgaComboboxItem(
                value: item,
                child: Text(item),
              ),
              placeholder: sums.isEmpty ? 'Сум олдсонгүй' : 'Сум сонгоно уу',
              showClear: true,
            );
          },
          loading: () => TamgaCombobox<String>(
            items: const <String>[],
            value: null,
            onSelected: (_) {},
            itemBuilder: (item) => TamgaComboboxItem(
              value: item,
              child: Text(item),
            ),
            placeholder: 'Ачаалж байна...',
            enabled: false,
          ),
          error: (e, _) => Text(
            friendlyErrorMessage(e),
            style: TamgaTypography.body(color: colors.error),
          ),
        ),
        if (_locationValidated && _selectedAimag != null && _selectedSum == null)
          Padding(
            padding: const EdgeInsets.only(top: TamgaSpacing.xs, left: TamgaSpacing.sm),
            child: Text(
              'Сум сонгоно уу',
              style: TamgaTypography.caption1(color: colors.error),
            ),
          ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Баг ──
        Text(
          'Баг',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TextFormField(
          controller: _bagController,
          decoration: InputDecoration(
            hintText: 'Багын нэр...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
          ),
          validator: _validateBagField,
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Газрын нэр ──
        Text(
          'Газрын нэр',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TextFormField(
          controller: _locationNameController,
          decoration: InputDecoration(
            hintText: 'Газрын тодорхой нэр...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
          ),
          validator: _validateLocationNameField,
        ),
      ],
    );
  }

  // ── Animal Info Section ─────────────────────────────────────────

  Widget _buildAnimalInfoSection(TamgaColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text(
          'Малын мэдээлэл',
          style: TamgaTypography.headline(
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: TamgaSpacing.md),

        // ── Малын төрөл (Animal Type) ──
        Text(
          'Малын төрөл',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCombobox<AnimalType>(
          items: AnimalType.values,
          value: _selectedAnimalType,
          onSelected: (v) => setState(() => _selectedAnimalType = v),
          itemBuilder: (item) => TamgaComboboxItem(
            value: item,
            child: Text(item.displayName),
          ),
          itemToString: (item) => item.displayName,
          placeholder: 'Төрөл сонгоно уу',
        ),
        if (_animalInfoValidated && _selectedAnimalType == null)
          Padding(
            padding: const EdgeInsets.only(
              top: TamgaSpacing.xs,
              left: TamgaSpacing.sm,
            ),
            child: Text(
              'Малын төрөл сонгоно уу',
              style: TamgaTypography.caption1(color: colors.error),
            ),
          ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Нас (Age Multi-select) ──
        Text(
          'Нас',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCombobox<AnimalAge>(
          items: AnimalAge.values,
          multiple: true,
          values: _selectedAges,
          onValuesChanged: (v) => setState(() => _selectedAges = v),
          itemBuilder: (item) => TamgaComboboxItem(
            value: item,
            child: Text(item.displayName),
          ),
          itemToString: (item) => item.displayName,
          placeholder: 'Нас сонгоно уу',
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Хүйс (Gender) ──
        Text(
          'Хүйс',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCombobox<HorseGender>(
          items: HorseGender.values,
          value: _selectedGender,
          onSelected: (v) => setState(() => _selectedGender = v),
          itemBuilder: (item) => TamgaComboboxItem(
            value: item,
            child: Text(item.displayName),
          ),
          itemToString: (item) => item.displayName,
          placeholder: 'Хүйс сонгоно уу',
          showClear: true,
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Үүлдэр (Breed) ──
        Text(
          'Үүлдэр',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCombobox<HorseBreed>(
          items: HorseBreed.values,
          value: _selectedBreed,
          onSelected: (v) => setState(() => _selectedBreed = v),
          itemBuilder: (item) => TamgaComboboxItem(
            value: item,
            child: Text(item.displayName),
          ),
          itemToString: (item) => item.displayName,
          placeholder: 'Үүлдэр сонгоно уу',
          showClear: true,
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Зүс (Coat Color - searchable) ──
        Text(
          'Зүс',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TamgaCombobox<String>(
          items: horseCoatColors,
          value: _selectedCoatColor,
          onSelected: (v) => setState(() => _selectedCoatColor = v),
          itemBuilder: (item) => TamgaComboboxItem(
            value: item,
            child: Text(item),
          ),
          placeholder: 'Зүс сонгоно уу...',
          searchable: true,
          showClear: true,
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Тоо (Count) ──
        Text(
          'Тоо',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TextFormField(
          controller: _lostCountController,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: '1',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
          ),
          validator: _validateLostCount,
        ),
      ],
    );
  }

  // ── Media Section (Зураг) ───────────────────────────────────────

  Widget _buildMediaSection(TamgaColors colors) {
    final totalPhotos = _localPhotos.length;
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text(
          'Зураг',
          style: TamgaTypography.headline(
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: TamgaSpacing.md),

        // ── Photo thumbnails grid ──
        if (totalPhotos > 0)
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: totalPhotos,
              separatorBuilder: (_, _) =>
                  const SizedBox(width: TamgaSpacing.sm),
              itemBuilder: (context, index) {
                return Stack(
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(
                          TamgaSpacing.cornerRadiusSmall,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Image.file(
                        _localPhotos[index],
                        fit: BoxFit.cover,
                      ),
                    ),
                    // ── Remove button ──
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => _removePhoto(index),
                        child: Container(
                          decoration: BoxDecoration(
                            color: colors.error,
                            shape: BoxShape.circle,
                          ),
                          padding: const EdgeInsets.all(4),
                          child: Icon(
                            Icons.close,
                            size: 14,
                            color: colors.onError,
                          ),
                        ),
                      ),
                    ),
                    // ── Photo index badge ──
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface
                              .withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        child: Text(
                          '${index + 1}',
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

        if (totalPhotos > 0) const SizedBox(height: TamgaSpacing.md),

        // ── Add photo buttons ──
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickFromGallery,
                icon: const Icon(Icons.photo_library_outlined),
                label: const Text('Галерээ'),
              ),
            ),
            const SizedBox(width: TamgaSpacing.sm),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickFromCamera,
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Камер'),
              ),
            ),
          ],
        ),

        // ── Photo count info ──
        if (totalPhotos > 0)
          Padding(
            padding: const EdgeInsets.only(top: TamgaSpacing.xs),
            child: Text(
              'Нийт $totalPhotos зураг',
              style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
            ),
          ),

        // ── Validation error ──
        if (_photosValidated && totalPhotos == 0)
          Padding(
            padding: const EdgeInsets.only(top: TamgaSpacing.xs),
            child: Text(
              'Дор хаяж 1 зураг оруулна уу',
              style: TamgaTypography.caption1(color: colors.error),
            ),
          ),
      ],
    );
  }

  // ── Pricing Section ──────────────────────────────────────────────

  Widget _buildPricingSection(TamgaColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text(
          'Үнэ ба Нөхцөл',
          style: TamgaTypography.headline(
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        Text(
          'Зарын төрөл сонгох — үнэ төлбөр нь тайлбар хэсэгт дурдсан данс руу шилжүүлнэ',
          style: TamgaTypography.caption1(
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.md),

        // ── Tier selector cards ──
        ...LostHorsePricingTier.values.map((tier) {
          final isSelected = _selectedPricingTier == tier;
          final isFree = tier == LostHorsePricingTier.free;

          return Padding(
            padding: const EdgeInsets.only(bottom: TamgaSpacing.sm),
            child: InkWell(
              onTap: () => setState(() => _selectedPricingTier = tier),
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                  border: Border.all(
                    color: isSelected
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                    width: isSelected ? 2 : 1,
                  ),
                  color: isSelected
                      ? colors.primary.withValues(alpha: 0.08)
                      : colors.surface,
                ),
                padding: const EdgeInsets.all(TamgaSpacing.md),
                child: Row(
                  children: [
                    // ── Radio indicator ──
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected
                              ? colors.primary
                              : colors.onSurfaceVariant,
                          width: 2,
                        ),
                      ),
                      child: isSelected
                          ? Center(
                              child: Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: colors.primary,
                                ),
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: TamgaSpacing.md),

                    // ── Tier info ──
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tier.displayName,
                            style: TamgaTypography.body(
                              weight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isFree
                                ? 'Хугацаагүй — үнэгүй'
                                : '${tier.durationDays} хоног — ${tier.priceLabel}',
                            style: TamgaTypography.caption1(
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── Price badge ──
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: TamgaSpacing.sm,
                        vertical: TamgaSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(
                          TamgaSpacing.cornerRadiusSmall,
                        ),
                        color: isSelected
                            ? colors.primary
                            : colors.surfaceContainerHighest,
                      ),
                      child: Text(
                        tier.priceLabel,
                        style: TamgaTypography.caption1(
                          weight: FontWeight.w700,
                          color: isSelected
                              ? colors.onPrimary
                              : colors.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  // ── Photo picker methods ──────────────────────────────────────────

  Future<void> _pickFromGallery() async {
    final xFiles = await _picker.pickMultiImage(
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );

    if (xFiles.isNotEmpty) {
      setState(() {
        _localPhotos.addAll(xFiles.map((x) => File(x.path)));
        _photosValidated = false;
      });
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
      setState(() {
        _localPhotos.add(File(xFile.path));
        _photosValidated = false;
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _localPhotos.removeAt(index);
    });
  }

  // ── Tamga picker methods ─────────────────────────────────────────

  Future<void> _pickTamga() async {
    final xFile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );

    if (xFile != null) {
      setState(() => _tamgaFile = File(xFile.path));
    }
  }

  void _removeTamga() {
    setState(() => _tamgaFile = null);
  }

  // ── Tamga & Ear Mark Section ──────────────────────────────────────

  Widget _buildTamgaSection(TamgaColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text(
          'Тамга ба Им',
          style: TamgaTypography.headline(
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: TamgaSpacing.md),

        // ── Тамга зураг (Tamga photo) ──
        Text(
          'Тамганы зураг',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        if (_tamgaFile != null)
          Stack(
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.file(
                  _tamgaFile!,
                  fit: BoxFit.cover,
                  width: 120,
                  height: 120,
                ),
              ),
              Positioned(
                top: 4,
                right: 4,
                child: GestureDetector(
                  onTap: _removeTamga,
                  child: Container(
                    decoration: BoxDecoration(
                      color: colors.error,
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Icon(
                      Icons.close,
                      size: 14,
                      color: colors.onError,
                    ),
                  ),
                ),
              ),
            ],
          ),
        if (_tamgaFile == null)
          OutlinedButton.icon(
            onPressed: _pickTamga,
            icon: const Icon(Icons.image_outlined),
            label: const Text('Тамга зураг оруулах'),
          ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Им (Ear mark) ──
        Text(
          'Им / Чихний им',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TextFormField(
          controller: _earMarkController,
          maxLines: 2,
          maxLength: kMaxEarMarkLength,
          decoration: InputDecoration(
            hintText: 'Чихний имний тодорхойлолт...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Contact Section ───────────────────────────────────────────────

  Widget _buildContactSection(TamgaColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Section header ──
        Text(
          'Холбоо барих',
          style: TamgaTypography.headline(
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: TamgaSpacing.md),

        // ── Утас (Contact phone) ──
        Text(
          'Утасны дугаар',
          style: TamgaTypography.footnote(
            weight: FontWeight.w600,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        TextFormField(
          controller: _contactPhoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            hintText: 'Утасны дугаар...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
            ),
          ),
        ),
        const SizedBox(height: TamgaSpacing.sm),
        Text(
          'Холбоо барих утасны дугаар. Профайлын утаснаас автоматаар бөглөгдөнө.',
          style: TamgaTypography.caption1(
            color: colors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  // ── Validation helpers ───────────────────────────────────────────

  String? _validateBagField(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Баг оруулна уу';
    }
    if (value.length > kMaxLocationFieldLength) {
      return 'Баг $kMaxLocationFieldLength тэмдэгтээс хэтрэхгүй';
    }
    return null;
  }

  String? _validateLocationNameField(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Газрын нэр оруулна уу';
    }
    if (value.length > kMaxLocationFieldLength) {
      return 'Газрын нэр $kMaxLocationFieldLength тэмдэгтээс хэтрэхгүй';
    }
    return null;
  }

  String? _validateLostCount(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Тоо оруулна уу';
    }
    final count = int.tryParse(value.trim());
    if (count == null || count < 1) {
      return 'Тоо 1-ээс багагүй байна';
    }
    return null;
  }

  Future<void> _submitReport() async {
    // ── Phone verification gate (VAL-VERIFY-001) ──────────────────
    //
    // If the user hasn't verified their phone number (no phone in auth
    // profile), show a dialog that prevents submission and offers to
    // navigate to the phone auth flow. After successful verification,
    // the user returns and can re-tap submit — form state is preserved.
    final authAsync = ref.read(authStateProvider);
    final authState = authAsync.valueOrNull;
    if (authState == null || !authState.hasPhone) {
      final shouldVerify = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Text('Утасны дугаар баталгаажуулах'),
          content: const Text(
            'Хаяж морь зарлахын тулд утасны дугаараа баталгаажуулна уу.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Дараа'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Баталгаажуулах'),
            ),
          ],
        ),
      );

      if (shouldVerify == true && mounted) {
        // Navigate to the existing phone auth flow. After OTP
        // verification the user ends up on the lineage screen and
        // can tap back to the lost-horse tab to re-submit.
        await context.push('/phone-login');
        // Refresh auth state so next check picks up the new phone.
        ref.invalidate(authStateProvider);
      }
      return; // Don't submit yet — user must re-tap after verifying.
    }

    // Validate form fields (bag, location name, description, horse, count)
    final formValid = _formKey.currentState!.validate();

    // Validate aimag and sum selections
    final aimagValid = _selectedAimag != null;
    final sumValid = _selectedSum != null;

    // Validate animal type selection (required)
    final animalTypeValid = _selectedAnimalType != null;

    // Validate at least 1 photo (VAL-VERIFY-002)
    final photosValid = _localPhotos.isNotEmpty;

    if (!formValid ||
        !aimagValid ||
        !sumValid ||
        !animalTypeValid ||
        !photosValid
    ) {
      setState(() {
        _locationValidated = true;
        _animalInfoValidated = true;
        _photosValidated = true;
      });
      if (!photosValid) {
        TamgaToast.showError(context, 'Дор хаяж 1 зураг оруулна уу');
      } else if (!animalTypeValid) {
        TamgaToast.showError(context, 'Малын төрөл сонгоно уу');
      } else if (!aimagValid) {
        TamgaToast.showError(context, 'Аймаг сонгоно уу');
      } else if (!sumValid) {
        TamgaToast.showError(context, 'Сум сонгоно уу');
      }
      return;
    }

    final userId = currentSupabaseUserId();
    if (userId == null) {
      TamgaToast.showError(context, 'Нэвтэрсний дараа хаяж морь зарлана уу');
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
    final now = DateTime.now();

    // ── Calculate expiry based on pricing tier ──
    final expiresAt = _selectedPricingTier.durationDays != null
        ? now.add(Duration(days: _selectedPricingTier.durationDays!))
        : null;

    final report = LostHorseReport(
      id: '',
      horseId: _selectedHorse!.id,
      ownerId: userId,
      horseName: _selectedHorse!.displayName,
      description: _descriptionController.text.trim(),
      lastSeenLat: pos.latitude,
      lastSeenLng: pos.longitude,
      lastSeenAt: now,
      searchRadiusKm: _searchRadiusKm,
      createdAt: now,
      updatedAt: now,
      // ── Location fields ──
      locationAimag: _selectedAimag,
      locationSum: _selectedSum,
      locationBag: _bagController.text.trim(),
      locationName: _locationNameController.text.trim(),
      // ── Animal info fields ──
      animalType: _selectedAnimalType!,
      ages: _selectedAges,
      gender: _selectedGender,
      breed: _selectedBreed,
      coatColor: _selectedCoatColor,
      lostCount: int.parse(_lostCountController.text.trim()),
      // ── Tamga / Identification ──
      earMarkDescription: _earMarkController.text.trim().isNotEmpty
          ? _earMarkController.text.trim()
          : null,
      // ── Contact ──
      contactPhone: _contactPhoneController.text.trim().isNotEmpty
          ? _contactPhoneController.text.trim()
          : null,
      // ── Pricing ──
      pricingTier: _selectedPricingTier,
      expiresAt: expiresAt,
    );

    try {
      // Step 1: Create the report (gets back the saved report with ID)
      final savedReport =
          await ref.read(reportLostHorseProvider(report).future);
      final reportId = savedReport.id;

      // Step 2: Upload each photo to Supabase Storage
      final storage = ref.read(mediaStorageProvider);
      final photoUrls = <String>[];

      for (var i = 0; i < _localPhotos.length; i++) {
        final file = _localPhotos[i];
        final path = MediaStorageRouter.lostHorsePhotoPath(
          reportId: reportId,
        );

        final uploadResult = await storage.upload(
          file: file,
          path: path,
          category: MediaCategory.photo,
        );

        uploadResult.when(
          onSuccess: (upload) => photoUrls.add(upload.url),
          onFailure: (error) {
            // Continue uploading remaining photos even if one fails
            TamgaToast.showError(
              context,
              friendlyErrorMessage(error),
            );
          },
        );
      }

      // Step 3: Insert photo URLs into lost_horse_media table
      if (photoUrls.isNotEmpty) {
        final supabase = Supabase.instance.client;
        final mediaRows = photoUrls.map((url) => {
          'report_id': reportId,
          'url': url,
          'media_type': 'photo',
          'sort_order': photoUrls.indexOf(url),
        }).toList();

        await supabase.from('lost_horse_media').insert(mediaRows);
      }

      // Step 4: Upload tamga photo if present
      String? tamgaImageUrl;
      if (_tamgaFile != null) {
        final tamgaPath = MediaStorageRouter.lostHorseTamgaPath(
          reportId: reportId,
        );

        final uploadResult = await storage.upload(
          file: _tamgaFile!,
          path: tamgaPath,
          category: MediaCategory.photo,
        );

        uploadResult.when(
          onSuccess: (upload) => tamgaImageUrl = upload.url,
          onFailure: (error) {
            TamgaToast.showError(
              context,
              friendlyErrorMessage(error),
            );
          },
        );
      }

      // Step 5: Update report with tamgaImageUrl if uploaded
      if (tamgaImageUrl != null) {
        final supabase = Supabase.instance.client;
        await supabase
            .from('lost_horse_reports')
            .update({'tamga_image_url': tamgaImageUrl})
            .eq('id', reportId);
      }

      // Step 6: Handle pricing - generate payment code for paid tiers
      if (_selectedPricingTier.isPaid) {
        final paymentCode = PaymentService.generatePaymentCode();
        final supabase = Supabase.instance.client;
        await supabase.from('lost_horse_payments').insert({
          'report_id': reportId,
          'user_id': userId,
          'amount_mnt': _selectedPricingTier.priceMnt,
          'tier': _selectedPricingTier.name,
          'days': _selectedPricingTier.durationDays,
          'payment_code': paymentCode,
          'status': 'pending',
        });
      }

      // Step 7: Schedule renewal notification for paid reports
      if (_selectedPricingTier.isPaid && expiresAt != null) {
        final expiryService = ref.read(expiryServiceProvider);
        // Use the saved report data for scheduling
        final reportForScheduling = savedReport.copyWith(
          pricingTier: _selectedPricingTier,
          expiresAt: expiresAt,
        );
        // Fire-and-forget: don't block submission on notification scheduling
        unawaited(expiryService.scheduleRenewalNotification(reportForScheduling));
      }

      if (!mounted) return;
      TamgaToast.showSuccess(context, 'Хаяж морийн зар нийтлэгдлээ');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      TamgaToast.showError(context, friendlyErrorMessage(e));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}
