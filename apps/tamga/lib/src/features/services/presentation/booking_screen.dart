/// Үйлчилгээний захиалгын дэлгэц.
///
/// Хэрэглэгч үйлчилгээний төрөл, огноо, морь(д), байршил сонгон
/// захиалга үүсгэх боломжтой.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../application/booking_providers.dart';
import '../domain/service_provider_type.dart';

/// Үйлчилгээний захиалгын дэлгэц.
class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key, this.providerType, this.providerId});

  /// Урьдчилан сонгосон үйлчилгээ үзүүлэгчийн төрөл.
  final ServiceProviderType? providerType;

  /// Урьдчилан сонгосон үйлчилгээ үзүүлэгчийн ID.
  final String? providerId;

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  final _formKey = GlobalKey<FormState>();

  late ServiceProviderType _selectedType;
  late String _serviceType;
  late DateTime _bookingDate;
  final _horseIds = <String>[];
  final _locationAimagController = TextEditingController();
  final _locationSumController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();

  final _aimags = [
    'Архангай',
    'Баян-Өлгий',
    'Баянхонгор',
    'Булган',
    'Говь-Алтай',
    'Говьсүмбэр',
    'Дархан-Уул',
    'Дорноговь',
    'Дорнод',
    'Дундговь',
    'Завхан',
    'Орхон',
    'Өвөрхангай',
    'Өмнөговь',
    'Сүхбаатар',
    'Сэлэнгэ',
    'Төв',
    'Увс',
    'Ховд',
    'Хөвсгөл',
    'Хэнтий',
  ];

  @override
  void initState() {
    super.initState();
    _selectedType = widget.providerType ?? ServiceProviderType.photographer;
    _serviceType = _selectedType == ServiceProviderType.photographer
        ? 'photo_session'
        : 'consultation';
    _bookingDate = DateTime.now().add(const Duration(days: 1));
  }

  @override
  void dispose() {
    _locationAimagController.dispose();
    _locationSumController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _bookingDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Огноо сонгох / Select Date',
    );
    if (picked != null) {
      setState(() => _bookingDate = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final authValue = ref.read(authStateProvider);
    final authState = authValue.valueOrNull;
    final userId = authState?.userId;
    if (userId == null) {
      TamgaToast.showError(context, 'Нэвтрэх шаардлагатай / Login required');
      return;
    }

    final pricing = _calculatePricing();
    await ref
        .read(createBookingProvider.notifier)
        .createBooking(
          userId: userId,
          providerId: widget.providerId,
          providerType: _selectedType,
          serviceType: _serviceType,
          horseIds: _horseIds,
          locationAimag: _locationAimagController.text,
          locationSum: _locationSumController.text,
          address: _addressController.text,
          bookingDate: _bookingDate,
          totalAmount: pricing,
          notes: _notesController.text,
        );
  }

  int _calculatePricing() {
    // Үндсэн үнэ: consultationFee (30000) + perHorseFee (15000) + travelSurcharge (10000)
    const consultationFee = 30000;
    const perHorseFee = 15000;
    const travelSurcharge = 10000;
    final horseCount = _horseIds.isEmpty ? 1 : _horseIds.length;
    return consultationFee + (horseCount * perHorseFee) + travelSurcharge;
  }

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    final createState = ref.watch(createBookingProvider);
    final pricing = _calculatePricing();

    // ── Захиалгын төлөвийн өөрчлөлтийг сонсох / Listen to booking state changes ──
    ref.listen<CreateBookingState>(createBookingProvider, (previous, next) {
      if (!mounted) return;
      if (previous == CreateBookingState.submitting &&
          next == CreateBookingState.success) {
        TamgaToast.showSuccess(
          context,
          'Захиалга амжилттай үүсгэгдлээ / Booking created successfully',
        );
        ref.read(createBookingProvider.notifier).reset();
      } else if (previous == CreateBookingState.submitting &&
          next == CreateBookingState.error) {
        final notifier = ref.read(createBookingProvider.notifier);
        TamgaToast.showError(
          context,
          'Алдаа гарлаа / Error: ${notifier.errorMessage ?? 'Unknown error'}',
        );
        ref.read(createBookingProvider.notifier).reset();
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Захиалга / Booking')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: AppSpacing.screenPadding,
          children: [
            // ── Үйлчилгээний төрөл / Service Type ──
            Text(
              'Үйлчилгээний төрөл / Service Type',
              style: TamgaTypography.callout(
                weight: FontWeight.w600,
                color: tc.onSurface,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            SegmentedButton<ServiceProviderType>(
              segments: const [
                ButtonSegment(
                  value: ServiceProviderType.photographer,
                  label: Text('Гэрэл зурагчин'),
                  icon: Icon(Icons.camera_alt_outlined),
                ),
                ButtonSegment(
                  value: ServiceProviderType.vet,
                  label: Text('Мал эмнэлэг'),
                  icon: Icon(Icons.local_hospital_outlined),
                ),
              ],
              selected: {_selectedType},
              onSelectionChanged: (selected) {
                setState(() {
                  _selectedType = selected.first;
                  _serviceType =
                      _selectedType == ServiceProviderType.photographer
                      ? 'photo_session'
                      : 'consultation';
                });
              },
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Үйлчилгээний дэд төрөл / Sub Service Type ──
            Text(
              'Үйлчилгээний дэлгэрэнгүй / Service Detail',
              style: TamgaTypography.callout(
                weight: FontWeight.w600,
                color: tc.onSurface,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _serviceType,
              decoration: InputDecoration(
                labelText: 'Үйлчилгээний төрөл / Service Type',
                border: const OutlineInputBorder(),
              ),
              items: _selectedType == ServiceProviderType.photographer
                  ? const [
                      DropdownMenuItem(
                        value: 'photo_session',
                        child: Text('Гэрэл зураг авалт / Photo Session'),
                      ),
                      DropdownMenuItem(
                        value: 'video_session',
                        child: Text('Видео бичлэг / Video Session'),
                      ),
                      DropdownMenuItem(
                        value: 'drone_session',
                        child: Text('Дроны бичлэг / Drone Session'),
                      ),
                    ]
                  : const [
                      DropdownMenuItem(
                        value: 'consultation',
                        child: Text('Ерөнхий зөвлөгөө / General Consultation'),
                      ),
                      DropdownMenuItem(
                        value: 'vaccination',
                        child: Text('Вакцинжуулалт / Vaccination'),
                      ),
                      DropdownMenuItem(
                        value: 'treatment',
                        child: Text('Эмчилгээ / Treatment'),
                      ),
                      DropdownMenuItem(
                        value: 'surgery',
                        child: Text('Мэс засал / Surgery'),
                      ),
                      DropdownMenuItem(
                        value: 'dental',
                        child: Text('Шүд эмчилгээ / Dental Care'),
                      ),
                    ],
              onChanged: (value) {
                if (value != null) setState(() => _serviceType = value);
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Үйлчилгээний төрөл сонгоно уу';
                }
                return null;
              },
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Морьдын тоо / Horse Count ──
            Text(
              'Морьдын тоо / Number of Horses',
              style: TamgaTypography.callout(
                weight: FontWeight.w600,
                color: tc.onSurface,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            Row(
              children: [
                IconButton(
                  onPressed: () {
                    if (_horseIds.isNotEmpty) {
                      setState(() => _horseIds.removeLast());
                    }
                  },
                  tooltip: 'Морь хасах',
                  icon: const Icon(Icons.remove_circle_outline),
                ),
                Text(
                  '${_horseIds.length}',
                  style: TamgaTypography.headline(
                    fontSize: 18,
                    color: tc.onSurface,
                  ),
                ),
                IconButton(
                  onPressed: () {
                    if (_horseIds.length < 10) {
                      setState(
                        () => _horseIds.add('horse-${_horseIds.length + 1}'),
                      );
                    }
                  },
                  tooltip: 'Морь нэмэх',
                  icon: const Icon(Icons.add_circle_outline),
                ),
              ],
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Огноо / Date ──
            Text(
              'Огноо / Date',
              style: TamgaTypography.callout(
                weight: FontWeight.w600,
                color: tc.onSurface,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            InkWell(
              onTap: _pickDate,
              child: Container(
                padding: const EdgeInsets.all(TamgaSpacing.md),
                decoration: BoxDecoration(
                  border: Border.all(color: tc.outline),
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadiusSmall,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today),
                    const SizedBox(width: TamgaSpacing.md),
                    Text(
                      '${_bookingDate.year}-${_bookingDate.month.toString().padLeft(2, '0')}-${_bookingDate.day.toString().padLeft(2, '0')}',
                      style: TamgaTypography.body(color: tc.onSurface),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Байршил / Location ──
            Text(
              'Байршил / Location',
              style: TamgaTypography.callout(
                weight: FontWeight.w600,
                color: tc.onSurface,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _locationAimagController.text.isEmpty
                  ? null
                  : _locationAimagController.text,
              decoration: InputDecoration(
                labelText: 'Аймаг / Aimag',
                border: const OutlineInputBorder(),
              ),
              items: _aimags
                  .map((a) => DropdownMenuItem(value: a, child: Text(a)))
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  _locationAimagController.text = value;
                }
              },
            ),
            const SizedBox(height: TamgaSpacing.md),
            TextFormField(
              controller: _locationSumController,
              decoration: InputDecoration(
                labelText: 'Сум / Sum (optional)',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: TamgaSpacing.md),
            TextFormField(
              controller: _addressController,
              decoration: InputDecoration(
                labelText: 'Дэлгэрэнгүй хаяг / Address (optional)',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Үнийн мэдээлэл / Pricing ──
            Text(
              'Үнийн мэдээлэл / Pricing',
              style: TamgaTypography.callout(
                weight: FontWeight.w600,
                color: tc.onSurface,
              ),
            ),
            const SizedBox(height: TamgaSpacing.sm),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(TamgaSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _PricingRow(
                      title: 'Зөвлөгөөний хураамж / Consultation Fee',
                      amount: 30000,
                    ),
                    const Divider(),
                    _PricingRow(
                      title:
                          'Морь тус бүрийн нэмэлт төлбөр'
                          ' / Per Horse Fee x${_horseIds.isEmpty ? 1 : _horseIds.length}',
                      amount:
                          15000 * (_horseIds.isEmpty ? 1 : _horseIds.length),
                    ),
                    const Divider(),
                    _PricingRow(
                      title: 'Аялалын нэмэгдэл / Travel Surcharge',
                      amount: 10000,
                    ),
                    const Divider(),
                    _PricingRow(
                      title: 'Нийт / Total',
                      amount: pricing,
                      isTotal: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Тэмдэглэл / Notes ──
            TextFormField(
              controller: _notesController,
              decoration: InputDecoration(
                labelText: 'Тэмдэглэл / Notes (optional)',
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: TamgaSpacing.xxl),

            // ── Submit ──
            SizedBox(
              width: double.infinity,
              height: 48,
              child: LoadingButton(
                isLoading: createState == CreateBookingState.submitting,
                onPressed: _submit,
                child: const Text('Захиалах / Book Now'),
              ),
            ),
            const SizedBox(height: TamgaSpacing.lg),
          ],
        ),
      ),
    );
  }
}

/// Үнийн мөр.
class _PricingRow extends StatelessWidget {
  const _PricingRow({
    required this.title,
    required this.amount,
    this.isTotal = false,
  });

  final String title;
  final int amount;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: isTotal ? 16 : 14,
                fontWeight: isTotal ? FontWeight.w700 : FontWeight.w400,
                color: tc.onSurface,
              ),
            ),
          ),
          Text(
            '$amount₮',
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.w700 : FontWeight.w600,
              color: isTotal ? tc.primary : tc.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}
