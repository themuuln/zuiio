/// Морь нэмэх/засах дэлгэц (bottom sheet).
/// Owner stamp (тамга) хөрвүүлэх, зурах боломжтой.
library;

import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../market/application/market_providers.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import '../../../shared/domain/horse_breed_lineage.dart';
import '../../../shared/domain/horse_coat_color.dart';
import 'stamp_tracing_screen.dart';

/// Морь нэмэх/засах bottom sheet.
class HorseEditorSheet extends ConsumerStatefulWidget {
  const HorseEditorSheet({this.initialHorse, super.key});

  final HorseRecord? initialHorse;

  @override
  ConsumerState<HorseEditorSheet> createState() => _HorseEditorSheetState();
}

class _HorseEditorSheetState extends ConsumerState<HorseEditorSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _relationController;
  late final TextEditingController _coatController;
  late final TextEditingController _birthYearController;
  late final TextEditingController _awardCountController;
  late final TextEditingController _offspringCountController;
  late final TextEditingController _notesController;
  late final TextEditingController _rootIdController;
  String? _ownerStampSvg;
  bool _isStampLoading = false;
  late bool _isOwnedByHousehold;
  late HorseGender _gender;
  late final TextEditingController _regionController;
  late final TextEditingController _sumController;
  late final TextEditingController _tamgaBrandClanController;
  late final TextEditingController _tamgaBrandGenerationController;
  MongolianBreedLineage? _selectedBreedLineage;
  MongolianCoatColor? _selectedCoatColor;
  String? _selectedSireId;
  String? _selectedDamId;

  @override
  void initState() {
    super.initState();
    final horse = widget.initialHorse;
    _nameController = TextEditingController(text: horse?.name ?? '');
    _relationController = TextEditingController(
      text: horse?.relationLabel ?? '',
    );
    _coatController = TextEditingController(text: horse?.coat ?? '');
    _birthYearController = TextEditingController(
      text: horse?.birthYear.toString() ?? '',
    );
    _awardCountController = TextEditingController(
      text: horse?.awardCount.toString() ?? '0',
    );
    _offspringCountController = TextEditingController(
      text: horse?.offspringCount.toString() ?? '0',
    );
    _notesController = TextEditingController(text: horse?.notes ?? '');
    _rootIdController = TextEditingController(text: horse?.lineageRootId ?? '');
    _regionController = TextEditingController(text: horse?.region ?? '');
    _sumController = TextEditingController(text: horse?.sum ?? '');
    _tamgaBrandClanController = TextEditingController(
      text: horse?.tamgaBrandClan ?? '',
    );
    _tamgaBrandGenerationController = TextEditingController(
      text: horse?.tamgaBrandGeneration?.toString() ?? '',
    );
    _selectedBreedLineage = horse?.breedLineage;
    _selectedCoatColor = horse?.coatColor;
    _ownerStampSvg = horse?.ownerStampSvg;
    _isOwnedByHousehold = horse?.isOwnedByHousehold ?? true;
    _gender = horse?.gender ?? HorseGender.gelding;
    _selectedSireId = horse?.sireId;
    _selectedDamId = horse?.damId;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _relationController.dispose();
    _coatController.dispose();
    _birthYearController.dispose();
    _awardCountController.dispose();
    _offspringCountController.dispose();
    _notesController.dispose();
    _rootIdController.dispose();
    _regionController.dispose();
    _sumController.dispose();
    _tamgaBrandClanController.dispose();
    _tamgaBrandGenerationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.lg,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.initialHorse == null ? 'Морь нэмэх' : 'Морь засах',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: AppSpacing.lg),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Нэр'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _relationController,
              decoration: const InputDecoration(labelText: 'Relation label'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _coatController,
              decoration: const InputDecoration(labelText: 'Зүс'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _birthYearController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Төрсөн он'),
            ),
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<HorseGender>(
              initialValue: _gender,
              decoration: const InputDecoration(labelText: 'Хүйсийн ангилал'),
              items: [
                for (final gender in HorseGender.values)
                  DropdownMenuItem(
                    value: gender,
                    child: Text(gender.displayName),
                  ),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() => _gender = val);
                }
              },
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _awardCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Шагнал'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: TextField(
                    controller: _offspringCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Үр төл'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: _rootIdController,
              decoration: const InputDecoration(
                labelText: 'Lineage root id',
                hintText: 'khan-khuleg',
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isOwnedByHousehold,
              title: const Text('Өрхийн бүртгэлтэй'),
              onChanged: (val) {
                setState(() => _isOwnedByHousehold = val);
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Owner stamp (тамга) ──
            _buildStampSection(theme),
            const SizedBox(height: AppSpacing.md),

            // ── Breed lineage dropdown ──
            DropdownButtonFormField<MongolianBreedLineage>(
              initialValue: _selectedBreedLineage,
              decoration: const InputDecoration(labelText: 'Үүлдэр угсаа'),
              items: [
                for (final lineage in MongolianBreedLineage.values)
                  DropdownMenuItem(
                    value: lineage,
                    child: Text(lineage.displayName),
                  ),
              ],
              onChanged: (val) {
                setState(() => _selectedBreedLineage = val);
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Coat color dropdown ──
            DropdownButtonFormField<MongolianCoatColor>(
              initialValue: _selectedCoatColor,
              decoration: const InputDecoration(labelText: 'Зүсний өнгө'),
              items: [
                for (final color in MongolianCoatColor.values)
                  DropdownMenuItem(
                    value: color,
                    child: Text(color.displayName),
                  ),
              ],
              onChanged: (val) {
                setState(() => _selectedCoatColor = val);
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Region ──
            TextField(
              controller: _regionController,
              decoration: const InputDecoration(labelText: 'Аймаг'),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Sum ──
            TextField(
              controller: _sumController,
              decoration: const InputDecoration(labelText: 'Сум'),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Tamga brand clan ──
            TextField(
              controller: _tamgaBrandClanController,
              decoration: const InputDecoration(labelText: 'Тамга бүлгийн нэр'),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Tamga brand generation ──
            TextField(
              controller: _tamgaBrandGenerationController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Тамга үеийн дугаар',
              ),
            ),

            TextField(
              controller: _notesController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Тэмдэглэл'),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Sire (father) ──
            DropdownButtonFormField<String>(
              initialValue: _selectedSireId,
              decoration: const InputDecoration(labelText: 'Эцэг морь (Sire)'),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('— None —'),
                ),
                for (final h
                    in (ref.read(horsesProvider).valueOrNull ?? []).where(
                      (h) => h.gender == HorseGender.stallion,
                    ))
                  DropdownMenuItem<String>(value: h.id, child: Text(h.name)),
              ],
              onChanged: (val) => setState(() => _selectedSireId = val),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Dam (mother) ──
            DropdownButtonFormField<String>(
              initialValue: _selectedDamId,
              decoration: const InputDecoration(labelText: 'Эх морь (Dam)'),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('— None —'),
                ),
                for (final h
                    in (ref.read(horsesProvider).valueOrNull ?? []).where(
                      (h) => h.gender == HorseGender.mare,
                    ))
                  DropdownMenuItem<String>(value: h.id, child: Text(h.name)),
              ],
              onChanged: (val) => setState(() => _selectedDamId = val),
            ),
            const SizedBox(height: AppSpacing.lg),

            if (widget.initialHorse != null) ...[
              ref
                  .watch(digitalCertificateProvider(widget.initialHorse!.id))
                  .maybeWhen(
                    data: (cert) {
                      if (cert == null) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.md),
                          child: SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _issueCertificate(
                                context,
                                widget.initialHorse!,
                              ),
                              icon: const Icon(Icons.add_moderator),
                              label: const Text('Issue Digital Certificate'),
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                    orElse: () => const SizedBox.shrink(),
                  ),
            ],

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: FilledButton(
                    onPressed: _save,
                    child: const Text('Save'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Certificate ──

  Future<void> _issueCertificate(
    BuildContext context,
    HorseRecord horse,
  ) async {
    final repo = await ref.read(marketRepositoryProvider.future);
    final ownerId = horse.isOwnedByHousehold
        ? 'seller-tamga'
        : 'seller-external';
    await repo.issueCertificate(
      horseId: horse.id,
      ownerId: ownerId,
      issuer: 'Tamga Official Registrar',
    );
    ref.invalidate(digitalCertificateProvider(horse.id));
    if (!context.mounted) return;
    TamgaToast.showSuccess(
      context,
      'Digital Ownership cert issued for ${horse.name}!',
    );
  }

  // ── Save ──

  void _save() {
    final name = _nameController.text.trim();
    final relationLabel = _relationController.text.trim();
    final coat = _coatController.text.trim();
    final birthYear = int.tryParse(_birthYearController.text.trim());
    final awardCount = int.tryParse(_awardCountController.text.trim()) ?? 0;
    final offspringCount =
        int.tryParse(_offspringCountController.text.trim()) ?? 0;

    if (name.isEmpty ||
        relationLabel.isEmpty ||
        coat.isEmpty ||
        birthYear == null) {
      TamgaToast.show(context, 'Шаардлагатай талбаруудыг бөглөнө үү.');
      return;
    }

    final existing = widget.initialHorse;
    Navigator.of(context).pop(
      HorseRecord(
        id: existing?.id ?? 'horse-${DateTime.now().millisecondsSinceEpoch}',
        name: name,
        relationLabel: relationLabel,
        coat: coat,
        birthYear: birthYear,
        awardCount: awardCount,
        offspringCount: offspringCount,
        isOwnedByHousehold: _isOwnedByHousehold,
        notes: _notesController.text.trim(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        gender: _gender,
        lineageRootId: _rootIdController.text.trim().isEmpty
            ? null
            : _rootIdController.text.trim(),
        ownerStampSvg: _ownerStampSvg,
        coatColor: _selectedCoatColor,
        breedLineage: _selectedBreedLineage,
        region: _regionController.text.trim().isEmpty
            ? null
            : _regionController.text.trim(),
        sum: _sumController.text.trim().isEmpty
            ? null
            : _sumController.text.trim(),
        tamgaBrandClan: _tamgaBrandClanController.text.trim().isEmpty
            ? null
            : _tamgaBrandClanController.text.trim(),
        tamgaBrandGeneration: int.tryParse(
          _tamgaBrandGenerationController.text.trim(),
        ),
        sireId: _selectedSireId,
        damId: _selectedDamId,
      ),
    );
  }

  // ── Stamp section ──

  Widget _buildStampSection(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.verified, size: 20, color: colorScheme.onSurfaceVariant),
            const SizedBox(width: AppSpacing.sm),
            Text('Тамга (Ownership Stamp)', style: theme.textTheme.titleSmall),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),

        if (_ownerStampSvg != null && _ownerStampSvg!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              border: Border.all(color: colorScheme.outlineVariant),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                SvgPicture.string(
                  _ownerStampSvg!,
                  width: 64,
                  height: 64,
                  placeholderBuilder: (_) => const SizedBox(
                    width: 64,
                    height: 64,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Тамга байна',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'Шинэчлэх бол доорх товчийг дарна уу',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],

        // Action buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isStampLoading ? null : _pickAndConvertStamp,
                icon: _isStampLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.auto_awesome, size: 18),
                label: Text(
                  _isStampLoading ? 'Хөрвүүлж байна...' : 'AI-аар хөрвүүлэх',
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _traceStamp,
                icon: const Icon(Icons.brush, size: 18),
                label: const Text('Гар зурах'),
              ),
            ),
          ],
        ),

        if (_ownerStampSvg != null && _ownerStampSvg!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: TextButton.icon(
              onPressed: () {
                setState(() => _ownerStampSvg = null);
              },
              icon: const Icon(Icons.delete_outline, size: 18),
              label: const Text('Тамга устгах'),
            ),
          ),
        ],
      ],
    );
  }

  // ── Stamp pick & convert ──

  Future<void> _pickAndConvertStamp() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 90,
    );
    if (image == null) return;

    setState(() => _isStampLoading = true);

    try {
      final file = File(image.path);
      final res = await Supabase.instance.client.functions.invoke(
        'convert-stamp',
        body: {
          'image_base64': base64Encode(await file.readAsBytes()),
          'mime_type': image.mimeType ?? 'image/jpeg',
        },
      );

      if (res.status == 200 && res.data['svg'] != null) {
        setState(() => _ownerStampSvg = res.data['svg'] as String);
        if (mounted) {
          TamgaToast.showSuccess(context, 'Тамга амжилттай хөрвүүллээ!');
        }
      } else {
        throw Exception(res.data?['error'] ?? 'Хөрвүүлэхэд алдаа гарлаа');
      }
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'Алдаа: $e');
      }
    } finally {
      if (mounted) setState(() => _isStampLoading = false);
    }
  }

  // ── Stamp trace ──

  Future<void> _traceStamp() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 90,
    );
    if (image == null) return;
    if (!mounted) return;

    final svg = await StampTracingScreen.show(context, File(image.path));
    if (svg != null && mounted) {
      setState(() => _ownerStampSvg = svg);
      if (mounted) {
        TamgaToast.showSuccess(context, 'Тамга хадгалагдлаа!');
      }
    }
  }
}
