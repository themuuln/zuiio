/// Мал эмнэлгийн холболтын дэлгэц.
///
/// Хэрэглэгч аймгаар мал эмч нарыг үзэх, мэргэжлээр шүүх,
/// профайлыг харах, захиалга хийх боломжтой.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/vet_directory_providers.dart';
import '../domain/vet_profile.dart';
import '../domain/service_provider_type.dart';

/// Мал эмнэлгийн холболтын дэлгэц.
class VetConnectScreen extends ConsumerStatefulWidget {
  const VetConnectScreen({super.key});

  @override
  ConsumerState<VetConnectScreen> createState() => _VetConnectScreenState();
}

class _VetConnectScreenState extends ConsumerState<VetConnectScreen> {
  String? _selectedAimag;
  String? _selectedSpecialization;

  final _aimags = [
    'Бүгд / All',
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

  final _specializations = [
    'Бүгд / All',
    'general',
    'dentistry',
    'reproduction',
    'surgery',
    'internal',
  ];

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);

    final filter = VetFilter(
      aimag: _selectedAimag,
      specialization: _selectedSpecialization,
    );

    final profilesAsync = ref.watch(filteredVetProfilesProvider(filter));

    return Scaffold(
      appBar: AppBar(title: const Text('Мал эмч / Vet Connect')),
      body: Column(
        children: [
          // ── Шүүлтүүр / Filters ──
          Container(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Аймгаар шүүх
                Text(
                  'Аймгаар шүүх / Filter by Aimag',
                  style: TamgaTypography.subheadline(
                    weight: FontWeight.w600,
                    color: tc.onSurface,
                  ),
                ),
                const SizedBox(height: TamgaSpacing.sm),
                SizedBox(
                  height: 44,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _aimags.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(width: TamgaSpacing.sm),
                    itemBuilder: (context, index) {
                      final aimag = _aimags[index];
                      final isSelected =
                          (aimag == 'Бүгд / All' && _selectedAimag == null) ||
                          _selectedAimag == aimag;
                      return TamgaChoicePill(
                        label: aimag,
                        selected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedAimag = aimag == 'Бүгд / All'
                                ? null
                                : aimag;
                          });
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: TamgaSpacing.md),
                // Мэргэжлээр шүүх
                Text(
                  'Мэргэжлээр шүүх / Filter by Specialization',
                  style: TamgaTypography.subheadline(
                    weight: FontWeight.w600,
                    color: tc.onSurface,
                  ),
                ),
                const SizedBox(height: TamgaSpacing.sm),
                SizedBox(
                  height: 44,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _specializations.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(width: TamgaSpacing.sm),
                    itemBuilder: (context, index) {
                      final spec = _specializations[index];
                      final isSelected =
                          (spec == 'Бүгд / All' &&
                              _selectedSpecialization == null) ||
                          _selectedSpecialization == spec;
                      return TamgaChoicePill(
                        label: _specializationLabel(spec),
                        selected: isSelected,
                        onTap: () {
                          setState(() {
                            _selectedSpecialization = spec == 'Бүгд / All'
                                ? null
                                : spec;
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // ── Мал эмч нарын жагсаалт / Vet List ──
          Expanded(
            child: profilesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => TamgaErrorWidget(
                message: 'Мал эмч ачаалахад алдаа гарлаа',
                onRetry: () =>
                    ref.invalidate(filteredVetProfilesProvider(filter)),
              ),
              data: (profiles) {
                if (profiles.isEmpty) {
                  return EmptyState(
                    icon: Icons.local_hospital_outlined,
                    title: 'Мал эмч олдсонгүй / No Vets Found',
                    description:
                        'Сонгосон аймаг болон мэргэжлээр мал эмч байхгүй байна.'
                        ' Шүүлтүүрээ өөрчилнө үү.',
                  );
                }

                return ListView.separated(
                  padding: AppSpacing.screenPadding,
                  itemCount: profiles.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: TamgaSpacing.md),
                  itemBuilder: (context, index) {
                    return _VetProfileCard(
                      profile: profiles[index],
                      onBook: () {
                        context.push(
                          '/services/booking',
                          extra: {
                            'providerType': ServiceProviderType.vet,
                            'providerId': profiles[index].providerId,
                          },
                        );
                      },
                      onViewProfile: () {
                        _showVetProfileDialog(context, profiles[index]);
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _specializationLabel(String spec) {
    switch (spec) {
      case 'general':
        return 'Ерөнхий / General';
      case 'dentistry':
        return 'Шүд / Dentistry';
      case 'reproduction':
        return 'Үржил / Reproduction';
      case 'surgery':
        return 'Мэс засал / Surgery';
      case 'internal':
        return 'Дотоод / Internal Medicine';
      default:
        return spec;
    }
  }

  void _showVetProfileDialog(BuildContext context, VetProfile profile) {
    final tc = TamgaColors.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (ctx, scrollController) {
            return Padding(
              padding: AppSpacing.screenPadding,
              child: ListView(
                controller: scrollController,
                children: [
                  // Профайлын гарчиг
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: tc.outlineVariant,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.xxl),
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: tc.primaryContainer,
                    child: Icon(
                      Icons.person,
                      size: 40,
                      color: tc.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(height: TamgaSpacing.lg),
                  Text(
                    'Мал эмч / Veterinarian',
                    style: TamgaTypography.title3(
                      weight: FontWeight.w700,
                      color: tc.onSurface,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: TamgaSpacing.lg),

                  // Мэргэжил
                  if (profile.specialization.isNotEmpty) ...[
                    TamgaInfoRow(
                      icon: Icons.medical_services_outlined,
                      label: 'Мэргэжил / Specialization',
                      value: profile.specialization
                          .map(_specializationLabel)
                          .join(', '),
                    ),
                  ],

                  // Лиценз
                  if (profile.licenseNumber != null) ...[
                    TamgaInfoRow(
                      icon: Icons.badge_outlined,
                      label: 'Лиценз / License',
                      value: profile.licenseNumber!,
                    ),
                  ],

                  // Боловсрол
                  if (profile.education != null) ...[
                    TamgaInfoRow(
                      icon: Icons.school_outlined,
                      label: 'Боловсрол / Education',
                      value: profile.education!,
                    ),
                  ],

                  // Ажлын туршлага
                  if (profile.experienceYears != null) ...[
                    TamgaInfoRow(
                      icon: Icons.work_outline,
                      label: 'Туршлага / Experience',
                      value: '${profile.experienceYears} жил / years',
                    ),
                  ],

                  // Зөвлөгөөний хураамж
                  if (profile.consultationFee != null) ...[
                    TamgaInfoRow(
                      icon: Icons.attach_money,
                      label: 'Зөвлөгөөний хураамж / Fee',
                      value: '${profile.consultationFee}₮',
                    ),
                  ],

                  // Аялалын нэмэгдэл
                  if (profile.travelSurcharge != null) ...[
                    TamgaInfoRow(
                      icon: Icons.directions_car_outlined,
                      label: 'Аялалын нэмэгдэл / Travel Surcharge',
                      value: '${profile.travelSurcharge}₮',
                    ),
                  ],

                  const SizedBox(height: TamgaSpacing.xxl),

                  // Захиалах товч
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton.icon(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        if (context.mounted) {
                          context.push(
                            '/services/booking',
                            extra: {
                              'providerType': ServiceProviderType.vet,
                              'providerId': profile.providerId,
                            },
                          );
                        }
                      },
                      icon: const Icon(Icons.calendar_today),
                      label: const Text('Цаг захиалах / Book Appointment'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

/// Мал эмчийн профайлын карт.
class _VetProfileCard extends StatelessWidget {
  const _VetProfileCard({
    required this.profile,
    required this.onBook,
    required this.onViewProfile,
  });

  final VetProfile profile;
  final VoidCallback onBook;
  final VoidCallback onViewProfile;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    return TamgaCard(
      onTap: onViewProfile,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: tc.primaryContainer,
                child: Icon(Icons.person, color: tc.onPrimaryContainer),
              ),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Мал эмч / Veterinarian',
                      style: TamgaTypography.body(
                        weight: FontWeight.w600,
                        color: tc.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (profile.specialization.isNotEmpty)
                      Text(
                        profile.specialization
                            .map(_specializationLabel)
                            .join(', '),
                        style: TamgaTypography.caption1(
                          color: tc.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              if (profile.consultationFee != null)
                Text(
                  '${profile.consultationFee}₮',
                  style: TamgaTypography.body(
                    weight: FontWeight.w700,
                    color: tc.primary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.md),
          Row(
            children: [
              if (profile.experienceYears != null) ...[
                Icon(Icons.work_outline, size: 16, color: tc.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  '${profile.experienceYears} жил',
                  style: TamgaTypography.caption2(color: tc.onSurfaceVariant),
                ),
                const SizedBox(width: TamgaSpacing.lg),
              ],
              if (profile.licenseNumber != null) ...[
                Icon(Icons.verified_outlined, size: 16, color: tc.tertiary),
                const SizedBox(width: 4),
                Text(
                  'Лицензтэй / Licensed',
                  style: TamgaTypography.caption2(color: tc.tertiary),
                ),
              ],
            ],
          ),
          const SizedBox(height: TamgaSpacing.md),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onBook,
              child: const Text('Цаг захиалах / Book'),
            ),
          ),
        ],
      ),
    );
  }
}

String _specializationLabel(String spec) {
  switch (spec) {
    case 'general':
      return 'Ерөнхий / General';
    case 'dentistry':
      return 'Шүд / Dentistry';
    case 'reproduction':
      return 'Үржил / Reproduction';
    case 'surgery':
      return 'Мэс засал / Surgery';
    case 'internal':
      return 'Дотоод / Internal Medicine';
    default:
      return spec;
  }
}
