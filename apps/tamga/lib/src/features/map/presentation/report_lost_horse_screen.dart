import 'package:uuid/uuid.dart';

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/constants/horse_coat_colors.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../../../shared/domain/horse.dart' show HorseGender;
import '../application/map_providers.dart';
import '../application/public_lost_horse_share_service.dart';
import '../domain/animal_enums.dart';
import '../domain/lost_horse_report.dart';
import '../domain/mongolian_locations.dart';
import '../domain/report_form_state.dart';

/// Three-step, free, offline-first horse/livestock recovery report wizard.
///
/// Step 1 groups the localized identity card into themed cards (identity,
/// marks, media, contact) so a long form stays scannable. Photos render as
/// an editable grid with thumbnails, not a single opaque button.
class ReportLostHorseScreen extends ConsumerStatefulWidget {
  const ReportLostHorseScreen({super.key});

  @override
  ConsumerState<ReportLostHorseScreen> createState() =>
      _ReportLostHorseScreenState();
}

class _ReportLostHorseScreenState extends ConsumerState<ReportLostHorseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _animalNameController = TextEditingController();
  final _coatController = TextEditingController();
  final _earMarkController = TextEditingController();
  final _privateDetailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _bagController = TextEditingController();
  final _placeController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();
  final _picker = ImagePicker();

  int _step = 0;
  String? _selectedHorseId;
  AnimalType _animalType = AnimalType.horse;
  final Set<AnimalAge> _ages = {};
  HorseGender? _gender;
  HorseBreed? _breed;
  int _lostCount = 1;
  double _searchRadiusKm = 5.0;
  XFile? _tamgaImage;
  TravelDirection? _direction;
  bool _sharePhone = false;
  String? _aimag;
  String? _sum;
  DateTime _lastSeenAt = DateTime.now();
  final List<XFile> _photos = [];
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _animalNameController.dispose();
    _coatController.dispose();
    _earMarkController.dispose();
    _privateDetailController.dispose();
    _phoneController.dispose();
    _descriptionController.dispose();
    _bagController.dispose();
    _placeController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final horses = ref.watch(horsesProvider);

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.pop()),
        titleSpacing: 0,
        title: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Мал хайх зар', style: TamgaTypography.headline()),
            Text(
              'Report a lost animal',
              style: TamgaTypography.caption1(color: colors.onSurfaceVariant),
            ),
          ],
        ),
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            _StepHeader(step: _step, color: colors.primary),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(
                  TamgaSpacing.xl,
                  TamgaSpacing.sm,
                  TamgaSpacing.xl,
                  TamgaSpacing.xl,
                ),
                children: [
                  if (_errorMessage != null) ...[
                    _ErrorBanner(message: _errorMessage!),
                    const SizedBox(height: TamgaSpacing.md),
                  ],
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    child: switch (_step) {
                      0 => _buildIdentityStep(context, horses),
                      1 => _buildLastSeenStep(context),
                      _ => _buildReviewStep(context),
                    },
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: TamgaSpacing.sm),
              child: _BottomAction(
                label: _step == 2
                    ? 'Зар хадгалах / Save report'
                    : 'Үргэлжлүүлэх / Continue',
                isBusy: _isSubmitting,
                onPressed: _isSubmitting ? null : _continue,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 1: identity card ────────────────────────────────────────

  Widget _buildIdentityStep(
    BuildContext context,
    AsyncValue<dynamic> horsesAsync,
  ) {
    final colors = TamgaColors.of(context);
    return Column(
      key: const ValueKey('identity'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TitleBlock(
          title: 'Амьтнаа таних мэдээлэл',
          subtitle: 'Identify the horse or livestock',
        ),
        const SizedBox(height: 24),

        // ── Card 1: Мал (animal) ───────────────────────────────
        _FormSectionCard(
          title: 'Мал',
          subtitle: 'Төрөл, нас, зүс — таних гол шинж',
          icon: Icons.pets_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionLabel('Бүртгэлтэй морь / Registered horse'),
              const SizedBox(height: 8),
              horsesAsync.when(
                data: (horses) => DropdownButtonFormField<String>(
                  initialValue: _selectedHorseId,
                  decoration: const InputDecoration(
                    hintText: 'Сонгохгүй бол гараар үргэлжлүүлнэ',
                  ),
                  items: [
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text('Гараар оруулах / Manual entry'),
                    ),
                    ...horses.map<DropdownMenuItem<String>>(
                      (horse) => DropdownMenuItem<String>(
                        value: horse.id,
                        child: Text(horse.displayName),
                      ),
                    ),
                  ],
                  onChanged: (value) =>
                      setState(() => _selectedHorseId = value),
                ),
                loading: () => const LinearProgressIndicator(minHeight: 2),
                error: (_, _) => const Text(
                  'Бүртгэлтэй морь одоогоор ачаалагдсангүй. Гараар үргэлжлүүлнэ үү.',
                ),
              ),
              const SizedBox(height: 20),
              _SectionLabel('Малын төрөл / Animal type'),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (
                        var index = 0;
                        index < AnimalType.values.length;
                        index++
                      )
                        Padding(
                          padding: EdgeInsets.only(
                            right: index == AnimalType.values.length - 1
                                ? 0
                                : 6,
                          ),
                          child: TamgaChoicePill(
                            label: AnimalType.values[index].displayName,
                            selected: _animalType == AnimalType.values[index],
                            onTap: () => setState(
                              () => _animalType = AnimalType.values[index],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _animalNameController,
                decoration: const InputDecoration(
                  labelText: 'Нэр / Name (optional)',
                  hintText: 'Жишээ: Хээр азарга',
                ),
              ),
              const SizedBox(height: 12),
              Autocomplete<String>(
                optionsBuilder: (TextEditingValue textEditingValue) {
                  if (textEditingValue.text.isEmpty) {
                    return const Iterable<String>.empty();
                  }
                  final query = textEditingValue.text.trim().toLowerCase();
                  return horseCoatColors.where(
                    (color) => color.toLowerCase().contains(query),
                  );
                },
                onSelected: (selection) => _coatController.text = selection,
                fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                  return TextFormField(
                    controller: controller,
                    focusNode: focusNode,
                    // The outer controller is the source of truth for the draft;
                    // Autocomplete only rebuilds its own controller, so sync every
                    // keystroke (fieldViewBuilder alone misses selection updates).
                    onChanged: (value) => _coatController.text = value,
                    decoration: const InputDecoration(
                      labelText: 'Зүс / Coat color (optional)',
                      hintText: 'Жишээ: Хээр, Зээрд, Бор…',
                      suffixIcon: Icon(Icons.search),
                    ),
                  );
                },
                optionsViewBuilder: (context, onSelected, options) {
                  return Align(
                    alignment: Alignment.topLeft,
                    child: Material(
                      elevation: 4,
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadiusSmall,
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 240),
                        child: ListView.builder(
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemCount: options.length,
                          itemBuilder: (context, index) {
                            final option = options.elementAt(index);
                            return ListTile(
                              dense: true,
                              title: Text(option),
                              onTap: () => onSelected(option),
                            );
                          },
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),
              _SectionLabel('Хүйс / Gender'),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (
                        var index = 0;
                        index < HorseGender.values.length;
                        index++
                      )
                        Padding(
                          padding: EdgeInsets.only(
                            right: index == HorseGender.values.length - 1
                                ? 0
                                : 6,
                          ),
                          child: TamgaChoicePill(
                            label: HorseGender.values[index].displayName,
                            selected: _gender == HorseGender.values[index],
                            onTap: () => setState(
                              () => _gender = HorseGender.values[index],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              _SectionLabel('Нас / Age (optional)'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final age in AnimalAge.values)
                    FilterChip(
                      label: Text(age.displayName),
                      selected: _ages.contains(age),
                      visualDensity: VisualDensity.compact,
                      onSelected: (selected) => setState(
                        () => selected ? _ages.add(age) : _ages.remove(age),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              _SectionLabel('Үүлдэр / Breed (optional)'),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (
                        var index = 0;
                        index < HorseBreed.values.length;
                        index++
                      )
                        Padding(
                          padding: EdgeInsets.only(
                            right: index == HorseBreed.values.length - 1
                                ? 0
                                : 6,
                          ),
                          child: TamgaChoicePill(
                            label: HorseBreed.values[index].displayName,
                            selected: _breed == HorseBreed.values[index],
                            onTap: () => setState(
                              () => _breed = HorseBreed.values[index],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: _SectionLabel('Малын тоо / Count')),
                  IconButton.outlined(
                    tooltip: 'Багасгах',
                    onPressed: _lostCount > 1
                        ? () => setState(() => _lostCount--)
                        : null,
                    icon: const Icon(Icons.remove),
                  ),
                  SizedBox(
                    width: 40,
                    child: Text(
                      '$_lostCount',
                      textAlign: TextAlign.center,
                      style: TamgaTypography.title3(weight: FontWeight.w700),
                    ),
                  ),
                  IconButton.outlined(
                    tooltip: 'Нэмэх',
                    onPressed: _lostCount < 99
                        ? () => setState(() => _lostCount++)
                        : null,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _SectionLabel('Хайх радиус / Search radius'),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final radius in const [5.0, 10.0, 30.0])
                        Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: TamgaChoicePill(
                            label: '${radius.toStringAsFixed(0)} км',
                            selected: _searchRadiusKm == radius,
                            onTap: () =>
                                setState(() => _searchRadiusKm = radius),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Card 2: Тамга, им, зүг (marks) ─────────────────────
        _FormSectionCard(
          title: 'Тамга, им, зүг',
          subtitle: 'Аймгийн зарын стандарт таних шинж',
          icon: Icons.branding_watermark_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _earMarkController,
                maxLength: 120,
                decoration: const InputDecoration(
                  labelText: 'Им, тамганы тайлбар / Ear mark or brand',
                  // Hide the default Material counter — it overlaps the
                  // single-line input content; maxLength still enforces.
                  counterText: '',
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickTamgaImage,
                      icon: const Icon(Icons.branding_watermark_outlined),
                      label: Text(
                        _tamgaImage == null
                            ? 'Тамганы зураг / Brand stamp photo'
                            : 'Тамганы зураг солих',
                      ),
                    ),
                  ),
                  if (_tamgaImage != null) ...[
                    const SizedBox(width: 8),
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(
                            TamgaSpacing.cornerRadiusSmall,
                          ),
                          child: Image.file(
                            File(_tamgaImage!.path),
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          right: -6,
                          top: -6,
                          child: GestureDetector(
                            onTap: () => setState(() => _tamgaImage = null),
                            child: Container(
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              padding: const EdgeInsets.all(2),
                              child: const Icon(
                                Icons.close,
                                size: 12,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 20),
              _SectionLabel('Хөдөлсөн зүг / Likely direction (optional)'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final direction in TravelDirection.values)
                    TamgaChoicePill(
                      label: direction.displayName,
                      selected: _direction == direction,
                      onTap: () => setState(() => _direction = direction),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Card 3: Нууц тэмдэг + зураг + тайлбар ──────────────
        _FormSectionCard(
          title: 'Таних дэлгэрэнгүй',
          subtitle: 'Нууц тэмдэг, зураг, тайлбар',
          icon: Icons.photo_library_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _privateDetailController,
                maxLength: 200,
                decoration: const InputDecoration(
                  labelText:
                      'Нууц баталгаажуулах тэмдэг / Private mark (optional)',
                  counterText: '',
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Зөвхөн танд харагдана. Олсон гэж мэдээлсэн хүнээс энэ тэмдгийг асууж баталгаажуулна уу.',
                style: TamgaTypography.footnote(color: colors.onSurfaceVariant),
              ),
              const SizedBox(height: 16),

              // ── Photo grid with live thumbnails ───────────────
              _SectionLabel('Таних зураг / Identifying photos'),
              const SizedBox(height: 8),
              _PhotoGrid(
                photos: _photos,
                onAdd: _pickPhoto,
                onRemove: (index) => setState(() => _photos.removeAt(index)),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _descriptionController,
                minLines: 4,
                maxLines: 6,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: 'Таних дэлгэрэнгүй / Detailed identifier',
                  hintText: 'Дор хаяж 20 тэмдэгт. / At least 20 characters.',
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Зар эхлээд таны төхөөрөмжид хадгалагдана. Сүлжээ орсны дараа эзэмшигчийн мэдээлэлтэйгээр синк хийнэ.',
                style: TamgaTypography.footnote(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(height: TamgaSpacing.lg),

        // ── Card 4: Холбоо барих ───────────────────────────────
        _FormSectionCard(
          title: 'Холбоо барих',
          subtitle: 'Олсон хүн тантай хэрхэн холбогдох вэ',
          icon: Icons.phone_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Холбоо барих утас / Contact phone (optional)',
                  hintText: '+976 99XX XX XX',
                ),
              ),
              // Transparent Material keeps the ListTile ink under its own
              // Material ancestor (the section card paints a background).
              Material(
                type: MaterialType.transparency,
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Утсаа зар дээр нийтлэх'),
                  subtitle: const Text(
                    'Нийтэд харагдах бөгөөд хэн ч холбогдож болно',
                  ),
                  value: _sharePhone,
                  onChanged: (value) => setState(() => _sharePhone = value),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLastSeenStep(BuildContext context) {
    final colors = TamgaColors.of(context);
    return Column(
      key: const ValueKey('last-seen'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TitleBlock(
          title: 'Сүүлд үзэгдсэн газар',
          subtitle: 'Choose the last-seen place and time',
        ),
        const SizedBox(height: 24),
        DropdownButtonFormField<String>(
          initialValue: _aimag,
          decoration: const InputDecoration(labelText: 'Аймаг / Aimag'),
          items: kAimagList
              .map(
                (value) => DropdownMenuItem(value: value, child: Text(value)),
              )
              .toList(),
          onChanged: (value) => setState(() => _aimag = value),
        ),
        const SizedBox(height: 12),
        TextFormField(
          initialValue: _sum,
          decoration: const InputDecoration(labelText: 'Сум / Sum'),
          onChanged: (value) => _sum = value,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _bagController,
          decoration: const InputDecoration(labelText: 'Баг / Bag (optional)'),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _placeController,
          decoration: const InputDecoration(
            labelText: 'Газрын нэр / Place name (optional)',
          ),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _latController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(labelText: 'Latitude'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextFormField(
                controller: _lngController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(labelText: 'Longitude'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _useCurrentLocation,
          icon: const Icon(Icons.my_location_outlined),
          label: const Text('Одоогийн байршил ашиглах / Use current location'),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Огноо / Date'),
                subtitle: Text(_formatDate(_lastSeenAt)),
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: _pickDate,
              ),
            ),
            Expanded(
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Цаг / Time'),
                subtitle: Text(_formatTime(_lastSeenAt)),
                trailing: const Icon(Icons.schedule_outlined),
                onTap: _pickTime,
              ),
            ),
          ],
        ),
        Text(
          'Одоогийн GPS бол зөвхөн туслах хэрэгсэл. Байршлын pin-ийг та өөрөө баталгаажуулна.',
          style: TamgaTypography.footnote(color: colors.onSurfaceVariant),
        ),
      ],
    );
  }

  Widget _buildReviewStep(BuildContext context) {
    final photoLabel = _photos.isEmpty ? 'Зураггүй' : '${_photos.length} зураг';
    return Column(
      key: const ValueKey('review'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TitleBlock(
          title: 'Шалгаж баталгаажуулах',
          subtitle: 'Review before saving offline',
        ),
        const SizedBox(height: 24),
        _ReviewRow('Төрөл', _animalType.displayName),
        _ReviewRow(
          'Нэр',
          _animalNameController.text.trim().isEmpty
              ? 'Гараар таних мэдээлэл'
              : _animalNameController.text.trim(),
        ),
        _ReviewRow(
          'Зүс',
          _coatController.text.trim().isEmpty
              ? '—'
              : _coatController.text.trim(),
        ),
        _ReviewRow('Хүйс', _gender?.displayName ?? '—'),
        _ReviewRow(
          'Нас',
          _ages.isEmpty ? '—' : _ages.map((a) => a.displayName).join(', '),
        ),
        _ReviewRow('Үүлдэр', _breed?.displayName ?? '—'),
        _ReviewRow('Тоо', '$_lostCount'),
        _ReviewRow('Хайх радиус', '${_searchRadiusKm.toStringAsFixed(0)} км'),
        _ReviewRow('Хөдөлсөн зүг', _direction?.displayName ?? '—'),
        _ReviewRow('Тамга зураг', _tamgaImage == null ? '—' : 'Нэмсэн'),
        _ReviewRow(
          'Нууц тэмдэг',
          _privateDetailController.text.trim().isEmpty ? '—' : 'Бүртгэсэн',
        ),
        _ReviewRow(
          'Утас',
          !_sharePhone || _phoneController.text.trim().isEmpty
              ? 'Нийтэлдэггүй'
              : _phoneController.text.trim(),
        ),
        _ReviewRow('Байршил', '${_aimag ?? ''}, ${_sum ?? ''}'),
        _ReviewRow('Сүүлд үзэгдсэн', _formatDateTime(_lastSeenAt)),
        _ReviewRow('Таних зураг', photoLabel),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Text(
            'Нууцлал: Зар сүлжээтэй болж амжилттай синк хийх хүртэл нийтэд харагдахгүй. Утасны дугаар энэ урсгалд шаардахгүй.',
          ),
        ),
      ],
    );
  }

  Future<void> _continue() async {
    setState(() => _errorMessage = null);
    if (_step < 2) {
      if (!_validateCurrentStep()) return;
      setState(() => _step++);
      return;
    }
    await _submit();
  }

  LostHorseReportDraft _buildDraft() {
    return LostHorseReportDraft(
      horseId: _selectedHorseId,
      horseName: _animalNameController.text,
      animalType: _animalType,
      ages: _ages.toList(),
      gender: _gender,
      breed: _breed,
      coatColor: _coatController.text,
      earMarkDescription: _earMarkController.text,
      tamgaImagePath: _tamgaImage?.path,
      identificationDescription: _descriptionController.text,
      photoPaths: _photos.map((photo) => photo.path).toList(),
      lostCount: _lostCount,
      searchRadiusKm: _searchRadiusKm,
      travelDirection: _direction,
      privateVerificationDetail: _privateDetailController.text,
      lastSeenLat: double.tryParse(_latController.text),
      lastSeenLng: double.tryParse(_lngController.text),
      lastSeenAt: _lastSeenAt,
      locationAimag: _aimag,
      locationSum: _sum,
      locationBag: _bagController.text,
      locationName: _placeController.text,
      contactPhone: _phoneController.text,
      sharePhone: _sharePhone,
    );
  }

  bool _validateCurrentStep() {
    if (_step == 0) {
      final errors = _buildDraft()
          .validate()
          .where(
            (error) =>
                error.contains('таних') || error.toLowerCase().contains('утас'),
          )
          .toList();
      if (errors.isNotEmpty) {
        setState(() => _errorMessage = errors.first);
        return false;
      }
    }
    if (_step == 1 && (_aimag == null || (_sum?.trim().isEmpty ?? true))) {
      setState(
        () => _errorMessage =
            'Аймаг, сумыг сонгоно уу. / Select an aimag and sum.',
      );
      return false;
    }
    if (_step == 1 &&
        (double.tryParse(_latController.text) == null ||
            double.tryParse(_lngController.text) == null)) {
      setState(
        () => _errorMessage =
            'Сүүлд үзэгдсэн pin-ээ сонгоно уу. / Choose a last-seen pin.',
      );
      return false;
    }
    return true;
  }

  Future<void> _submit() async {
    final userId = currentSupabaseUserId();
    if (userId == null) {
      setState(
        () => _errorMessage =
            'Нэвтэрсний дараа зар хадгална уу. / Sign in to save a report.',
      );
      return;
    }
    final validationErrors = _buildDraft().validate();
    if (validationErrors.isNotEmpty) {
      setState(() => _errorMessage = validationErrors.first);
      return;
    }
    final share = PublicLostHorseShareService.create();
    final phone = _phoneController.text.trim();
    final report = LostHorseReport(
      id: const Uuid().v4(),
      horseId: _selectedHorseId,
      ownerId: userId,
      horseName: _animalNameController.text.trim().isEmpty
          ? null
          : _animalNameController.text.trim(),
      description: _descriptionController.text.trim(),
      lastSeenLat: double.parse(_latController.text),
      lastSeenLng: double.parse(_lngController.text),
      lastSeenAt: _lastSeenAt,
      searchRadiusKm: _searchRadiusKm,
      locationAimag: _aimag,
      locationSum: _sum?.trim(),
      locationBag: _bagController.text.trim().isEmpty
          ? null
          : _bagController.text.trim(),
      locationName: _placeController.text.trim().isEmpty
          ? null
          : _placeController.text.trim(),
      animalType: _animalType,
      ages: _ages.toList(),
      gender: _gender,
      breed: _breed,
      coatColor: _coatController.text.trim().isEmpty
          ? null
          : _coatController.text.trim(),
      lostCount: _lostCount,
      earMarkDescription: _earMarkController.text.trim().isEmpty
          ? null
          : _earMarkController.text.trim(),
      tamgaImageUrl: _tamgaImage?.path,
      privateVerificationDetail: _privateDetailController.text.trim().isEmpty
          ? null
          : _privateDetailController.text.trim(),
      travelDirection: _direction,
      contactPhone: phone.isEmpty ? null : phone,
      publicContactMode: _sharePhone && phone.isNotEmpty ? 'phone' : 'none',
      publicTokenHash: share.tokenHash,
      photoUrls: _photos.map((photo) => photo.path).toList(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      pricingTier: LostHorsePricingTier.free,
    );

    await PublicLostHorseShareService.saveToken(report.id, share.token);

    setState(() => _isSubmitting = true);
    final result = await ref
        .read(lostHorseRepositoryProvider)
        .createReport(
          report,
          localMediaPaths: _photos.map((photo) => photo.path).toList(),
        );
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    result.when(
      onSuccess: (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Зар хадгалагдлаа. Синк хүлээгдэж байна.'),
          ),
        );
        context.pop();
      },
      onFailure: (error) => setState(() => _errorMessage = error.message),
    );
  }

  Future<void> _pickPhoto() async {
    final photo = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (photo != null && mounted) setState(() => _photos.add(photo));
  }

  Future<void> _pickTamgaImage() async {
    final photo = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (photo != null && mounted) setState(() => _tamgaImage = photo);
  }

  Future<void> _useCurrentLocation() async {
    final position = ref.read(currentPositionProvider).valueOrNull;
    if (position == null) {
      setState(
        () => _errorMessage = 'GPS олдсонгүй. Координатыг гараар оруулна уу.',
      );
      return;
    }
    _setPosition(position);
  }

  void _setPosition(Position position) {
    _latController.text = position.latitude.toStringAsFixed(6);
    _lngController.text = position.longitude.toStringAsFixed(6);
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 3650)),
      lastDate: DateTime.now().add(const Duration(minutes: 5)),
      initialDate: _lastSeenAt,
    );
    if (picked != null) setState(() => _lastSeenAt = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_lastSeenAt),
    );
    if (picked != null) {
      setState(
        () => _lastSeenAt = DateTime(
          _lastSeenAt.year,
          _lastSeenAt.month,
          _lastSeenAt.day,
          picked.hour,
          picked.minute,
        ),
      );
    }
  }

  String _formatDate(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  String _formatTime(DateTime date) =>
      '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

  String _formatDateTime(DateTime date) =>
      '${_formatDate(date)} ${_formatTime(date)}';
}

// ── Photo grid ─────────────────────────────────────────────────────────

/// Editable thumbnail grid for identifying photos — each tile can be
/// removed; the leading tile adds a new photo.
class _PhotoGrid extends StatelessWidget {
  const _PhotoGrid({
    required this.photos,
    required this.onAdd,
    required this.onRemove,
  });

  final List<XFile> photos;
  final VoidCallback onAdd;
  final ValueChanged<int> onRemove;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    const tileSize = 84.0;
    const gap = 8.0;

    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: [
        // Add tile
        InkWell(
          onTap: onAdd,
          borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
          child: Container(
            width: tileSize,
            height: tileSize,
            decoration: BoxDecoration(
              color: colors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(
                TamgaSpacing.cornerRadiusSmall,
              ),
              border: Border.all(color: colors.outline),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_a_photo_outlined, color: colors.primary),
                const SizedBox(height: 4),
                Text(
                  photos.isEmpty ? 'Зураг нэмэх' : 'Нэмэх',
                  style: TamgaTypography.caption1(
                    color: colors.primary,
                    weight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
        for (var index = 0; index < photos.length; index++)
          Stack(
            clipBehavior: Clip.none,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(
                  TamgaSpacing.cornerRadiusSmall,
                ),
                child: Image.file(
                  File(photos[index].path),
                  width: tileSize,
                  height: tileSize,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                right: -5,
                top: -5,
                child: GestureDetector(
                  onTap: () => onRemove(index),
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    padding: const EdgeInsets.all(3),
                    child: const Icon(
                      Icons.close,
                      size: 13,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }
}

// ── Form section card ─────────────────────────────────────────────────

/// Themed card grouping a set of related fields with a title + icon.
class _FormSectionCard extends StatelessWidget {
  const _FormSectionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return TamgaCard(
      padding: const EdgeInsets.all(TamgaSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: colors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
                child: Icon(icon, size: 18, color: colors.primary),
              ),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TamgaTypography.title3(weight: FontWeight.w700),
                    ),
                    Text(
                      subtitle,
                      style: TamgaTypography.caption1(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.lg),
          child,
        ],
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.color});
  final int step;
  final Color color;

  static const _labels = ['Таних мэдээлэл', 'Сүүлд үзэгдсэн газар', 'Шалгах'];

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        TamgaSpacing.xl,
        TamgaSpacing.md,
        TamgaSpacing.xl,
        TamgaSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step dots (onboarding-style) — consistent multi-step language
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_labels.length, (index) {
              final isActive = index == step;
              final isDone = index < step;
              return AnimatedContainer(
                duration: reduceMotion
                    ? Duration.zero
                    : TamgaMotion.durationNormal,
                margin: const EdgeInsets.symmetric(horizontal: TamgaSpacing.xs),
                width: isActive ? 10 : 8,
                height: isActive ? 10 : 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDone
                      ? color
                      : isActive
                      ? color
                      : colors.outline,
                ),
              );
            }),
          ),
          const SizedBox(height: TamgaSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'Алхам ${step + 1} / ${_labels.length}',
                style: TamgaTypography.caption1(
                  color: colors.onSurfaceVariant,
                  weight: FontWeight.w600,
                ),
              ),
              Flexible(
                child: Text(
                  _labels[step],
                  textAlign: TextAlign.end,
                  style: TamgaTypography.caption1(
                    color: colors.onSurface,
                    weight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TitleBlock extends StatelessWidget {
  const _TitleBlock({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(title, style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 4),
      Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
    ],
  );
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;
  @override
  Widget build(BuildContext context) =>
      Text(label, style: Theme.of(context).textTheme.labelLarge);
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    title: Text(label, style: Theme.of(context).textTheme.labelMedium),
    subtitle: Text(value),
  );
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => MaterialBanner(
    content: Text(message),
    leading: const Icon(Icons.info_outline),
    actions: const [SizedBox.shrink()],
  );
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({
    required this.label,
    required this.isBusy,
    this.onPressed,
  });
  final String label;
  final bool isBusy;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        border: Border(
          top: BorderSide(color: colors.outlineVariant.withValues(alpha: .6)),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          TamgaSpacing.xl,
          TamgaSpacing.md,
          TamgaSpacing.xl,
          TamgaSpacing.md,
        ),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: FilledButton(
            onPressed: onPressed,
            style: FilledButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(
                  TamgaSpacing.cornerRadiusSmall,
                ),
              ),
            ),
            child: isBusy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(label),
          ),
        ),
      ),
    );
  }
}
