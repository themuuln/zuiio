import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/theme/design_tokens.dart';

/// Screen 4: Морь нэмэх — Horse profile form.
///
/// Design: clean form with dashed photo upload, bottom-border inputs,
/// tappable row fields (breed/color), gender toggle pills,
/// horizontal scroll year picker.
class HorseEntryPage extends StatefulWidget {
  const HorseEntryPage({
    required this.onBack,
    required this.onContinue,
    required this.onSkip,
    this.initialName,
    this.initialGender,
    this.initialCoat,
    this.initialBirthYear,
    super.key,
  });

  final VoidCallback onBack;
  final void Function(String name, String gender, String coat, int birthYear)
  onContinue;
  final VoidCallback onSkip;
  final String? initialName;
  final String? initialGender;
  final String? initialCoat;
  final int? initialBirthYear;

  @override
  State<HorseEntryPage> createState() => _HorseEntryPageState();
}

class _HorseEntryPageState extends State<HorseEntryPage> {
  late final TextEditingController _nameController;
  String? _selectedGender;
  String? _selectedCoat;
  String? _selectedBreed;
  int? _selectedBirthYear;
  XFile? _pickedImage;
  final _picker = ImagePicker();

  static const _coats = [
    'Хүрэн',
    'Халтар',
    'Хээр',
    'Саарал',
    'Улаан',
    'Алаг',
    'Бор',
    'Хар',
    'Шарга',
    'Соёмбо',
    'Хулан',
    'Цагаан',
    'Тоодог',
    'Булан',
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialName ?? '');
    _selectedGender = widget.initialGender;
    _selectedCoat = widget.initialCoat;
    _selectedBirthYear = widget.initialBirthYear;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  bool get _canContinue =>
      _nameController.text.trim().isNotEmpty &&
      _selectedGender != null &&
      _selectedCoat != null;

  void _submit() {
    if (!_canContinue) return;
    final year = _selectedBirthYear ?? DateTime.now().year;
    widget.onContinue(
      _nameController.text.trim(),
      _selectedGender!,
      _selectedCoat!,
      year,
    );
  }

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Column(
      children: [
        // ── Header ──
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.page,
            AppSpacing.lg,
            0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [

              // Title
              Text(
                'Морь нэмэх',
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w600,
                  color: tc.onSurface,
                  letterSpacing: 0.37,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Эхний морьоо бүртгүүлэх',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                  color: tc.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),

        // ── Form ──
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.xxl,
              AppSpacing.lg,
              AppSpacing.xxl * 4 + AppSpacing.xs,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photo upload
                GestureDetector(
                  onTap: _showImagePicker,
                  child: _pickedImage != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(
                            AppSpacing.cornerRadius,
                          ),
                          child: Image.file(
                            File(_pickedImage!.path),
                            width: double.infinity,
                            height: 160,
                            fit: BoxFit.cover,
                          ),
                        )
                      : Container(
                          width: double.infinity,
                          height: 160,
                          decoration: BoxDecoration(
                            color: tc.secondary.withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(
                              AppSpacing.cornerRadius,
                            ),
                            border: Border.all(color: tc.outline, width: 1),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.photo_camera_outlined,
                                size: 24,
                                color: tc.onSurfaceVariant,
                              ),
                              const SizedBox(height: AppSpacing.sm),
                              Text(
                                'Зураг нэмэх',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                  color: tc.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
                const SizedBox(height: AppSpacing.xxl),

                // Name field (bottom border only)
                Text(
                  'Нэр',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: tc.onSurface,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                TextField(
                  controller: _nameController,
                  onChanged: (_) => setState(() {}),
                  style: TextStyle(fontSize: 17, color: tc.onSurface),
                  decoration: InputDecoration(
                    hintText: 'Морины нэр',
                    hintStyle: TextStyle(
                      color: tc.onSurfaceVariant,
                      fontSize: 17,
                    ),
                    border: UnderlineInputBorder(
                      borderSide: BorderSide(color: tc.outline),
                    ),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: tc.outline),
                    ),
                    focusedBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: tc.primary, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Breed field (tappable row)
                _FormRow(
                  label: 'Угсаа',
                  value: _selectedBreed ?? 'Сонгох',
                  onTap: () => _showBreedPicker(context),
                ),
                const SizedBox(height: AppSpacing.xs),

                // Color field (tappable row)
                _FormRow(
                  label: 'Өнгө',
                  value: _selectedCoat ?? 'Сонгох',
                  onTap: () => _showCoatPicker(context),
                ),
                const SizedBox(height: AppSpacing.xl),

                // Gender toggle
                Text(
                  'Хүйс',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    color: tc.onSurface,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    _GenderPill(
                      label: 'Эр',
                      isSelected: _selectedGender == 'stallion',
                      onTap: () => setState(() => _selectedGender = 'stallion'),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    _GenderPill(
                      label: 'Эм',
                      isSelected: _selectedGender == 'mare',
                      onTap: () => setState(() => _selectedGender = 'mare'),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxl),

                // Birth year (horizontal scroll pills)
                Text(
                  'Төрсөн он',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    color: tc.onSurface,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: 15,
                    separatorBuilder: (_, _) =>
                        const SizedBox(width: AppSpacing.md),
                    itemBuilder: (context, index) {
                      final year = DateTime.now().year - index;
                      final isSelected = year == _selectedBirthYear;
                      return _YearPill(
                        year: year,
                        isSelected: isSelected,
                        onTap: () => setState(() => _selectedBirthYear = year),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── Bottom actions — back + continue ──
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.sm,
              AppSpacing.lg,
              AppSpacing.lg,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 48,
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: widget.onBack,
                        icon: Icon(Icons.chevron_left, color: tc.primary),
                        style: IconButton.styleFrom(
                          backgroundColor: tc.surfaceContainerLow,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: FilledButton(
                          onPressed: _canContinue ? _submit : null,
                          child: const Text(
                            'Үргэлжлүүлэх',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: TextButton(
                    onPressed: widget.onSkip,
                    child: Text(
                      'Алгасах — дараа оруулна',
                      style: TextStyle(
                        fontSize: 17,
                        color: tc.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        ],
      );
  }
  void _showBreedPicker(BuildContext context) {
    final tc = TamgaColors.of(context);
    final breeds = [
      'Монгол адуу',
      'Адын элдэв',
      'Морин уралдаан',
      'Ачааны морь',
      'Үржүүлгийн морь',
      'Бусад',
    ];
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: const Text(
                'Угсаа сонгох',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: breeds.map((breed) {
                  return ListTile(
                    title: Text(breed),
                    trailing: breed == _selectedBreed
                        ? Icon(Icons.check, color: tc.primary)
                        : null,
                    onTap: () {
                      setState(() => _selectedBreed = breed);
                      Navigator.pop(context);
                    },
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImagePicker() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Камера'),
                onTap: () async {
                  Navigator.pop(context);
                  final image = await _picker.pickImage(
                    source: ImageSource.camera,
                    maxWidth: 1024,
                    maxHeight: 1024,
                    imageQuality: 85,
                  );
                  if (image != null && mounted) {
                    setState(() => _pickedImage = image);
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Зургийн сан'),
                onTap: () async {
                  Navigator.pop(context);
                  final image = await _picker.pickImage(
                    source: ImageSource.gallery,
                    maxWidth: 1024,
                    maxHeight: 1024,
                    imageQuality: 85,
                  );
                  if (image != null && mounted) {
                    setState(() => _pickedImage = image);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCoatPicker(BuildContext context) {
    final tc = TamgaColors.of(context);
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: const Text(
                'Өнгө сонгох',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
              ),
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: _coats.map((coat) {
                  return ListTile(
                    title: Text(coat),
                    trailing: coat == _selectedCoat
                        ? Icon(Icons.check, color: tc.primary)
                        : null,
                    onTap: () {
                      setState(() => _selectedCoat = coat);
                      Navigator.pop(context);
                    },
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tappable row field with label, value, and chevron.
class _FormRow extends StatelessWidget {
  const _FormRow({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: tc.outline, width: AppSpacing.hairline),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: tc.onSurface,
              ),
            ),
            Row(
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w400,
                    color: tc.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Icon(Icons.chevron_right, size: 20, color: tc.onSurfaceVariant),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Gender toggle pill (Эр/Эм).
class _GenderPill extends StatelessWidget {
  const _GenderPill({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 64,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: isSelected ? tc.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isSelected ? tc.primary : tc.outline,
            width: 1,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : tc.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

/// Year selection pill.
class _YearPill extends StatelessWidget {
  const _YearPill({
    required this.year,
    required this.isSelected,
    required this.onTap,
  });

  final int year;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isSelected ? tc.primary : tc.outline,
            width: 1,
          ),
        ),
        child: Text(
          year.toString(),
          style: TextStyle(
            fontSize: 15,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected ? tc.primary : tc.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
