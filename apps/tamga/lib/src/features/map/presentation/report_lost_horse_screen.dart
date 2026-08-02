import 'package:uuid/uuid.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../horses/application/horses_providers.dart';
import '../application/map_providers.dart';
import '../domain/animal_enums.dart';
import '../domain/lost_horse_report.dart';
import '../domain/mongolian_locations.dart';
import '../domain/report_form_state.dart';

/// Three-step, free, offline-first horse/livestock recovery report wizard.
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
  final _descriptionController = TextEditingController();
  final _bagController = TextEditingController();
  final _placeController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();
  final _picker = ImagePicker();

  int _step = 0;
  String? _selectedHorseId;
  AnimalType _animalType = AnimalType.horse;
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

  Widget _buildIdentityStep(
    BuildContext context,
    AsyncValue<dynamic> horsesAsync,
  ) {
    return Column(
      key: const ValueKey('identity'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TitleBlock(
          title: 'Амьтнаа таних мэдээлэл',
          subtitle: 'Identify the horse or livestock',
        ),
        const SizedBox(height: 24),
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
            onChanged: (value) => setState(() => _selectedHorseId = value),
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
                for (var index = 0; index < AnimalType.values.length; index++)
                  Padding(
                    padding: EdgeInsets.only(
                      right: index == AnimalType.values.length - 1 ? 0 : 6,
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
        TextFormField(
          controller: _coatController,
          decoration: const InputDecoration(
            labelText: 'Зүс / Coat color (optional)',
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _earMarkController,
          maxLength: 120,
          decoration: const InputDecoration(
            labelText: 'Им, тамганы тайлбар / Ear mark or brand',
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _pickPhoto,
          icon: const Icon(Icons.add_a_photo_outlined),
          label: Text(
            _photos.isEmpty
                ? 'Таних зураг нэмэх / Add identifying photo'
                : '${_photos.length} зураг сонгосон / photos selected',
          ),
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
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildLastSeenStep(BuildContext context) {
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
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Сүүлд үзэгдсэн огноо / Last seen'),
          subtitle: Text(_formatDate(_lastSeenAt)),
          trailing: const Icon(Icons.calendar_today_outlined),
          onTap: _pickDate,
        ),
        Text(
          'Одоогийн GPS бол зөвхөн туслах хэрэгсэл. Байршлын pin-ийг та өөрөө баталгаажуулна.',
          style: Theme.of(context).textTheme.bodySmall,
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
        _ReviewRow('Байршил', '${_aimag ?? ''}, ${_sum ?? ''}'),
        _ReviewRow('Сүүлд үзэгдсэн', _formatDate(_lastSeenAt)),
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
      coatColor: _coatController.text,
      earMarkDescription: _earMarkController.text,
      identificationDescription: _descriptionController.text,
      photoPaths: _photos.map((photo) => photo.path).toList(),
      lastSeenLat: double.tryParse(_latController.text),
      lastSeenLng: double.tryParse(_lngController.text),
      lastSeenAt: _lastSeenAt,
      locationAimag: _aimag,
      locationSum: _sum,
      locationBag: _bagController.text,
      locationName: _placeController.text,
    );
  }

  bool _validateCurrentStep() {
    if (_step == 0) {
      final errors = _buildDraft()
          .validate()
          .where((error) => error.contains('таних'))
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
      locationAimag: _aimag,
      locationSum: _sum?.trim(),
      locationBag: _bagController.text.trim().isEmpty
          ? null
          : _bagController.text.trim(),
      locationName: _placeController.text.trim().isEmpty
          ? null
          : _placeController.text.trim(),
      animalType: _animalType,
      coatColor: _coatController.text.trim().isEmpty
          ? null
          : _coatController.text.trim(),
      earMarkDescription: _earMarkController.text.trim().isEmpty
          ? null
          : _earMarkController.text.trim(),
      photoUrls: _photos.map((photo) => photo.path).toList(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      pricingTier: LostHorsePricingTier.free,
    );

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

  String _formatDate(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.color});
  final int step;
  final Color color;

  static const _labels = ['Таних мэдээлэл', 'Сүүлд үзэгдсэн газар', 'Шалгах'];

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
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
          Row(
            children: List.generate(
              _labels.length,
              (index) => Expanded(
                child: Container(
                  height: 5,
                  margin: EdgeInsets.only(
                    right: index == _labels.length - 1 ? 0 : TamgaSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: index <= step ? color : color.withValues(alpha: .16),
                    borderRadius: BorderRadius.circular(
                      TamgaSpacing.cornerRadiusPill,
                    ),
                  ),
                ),
              ),
            ),
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
