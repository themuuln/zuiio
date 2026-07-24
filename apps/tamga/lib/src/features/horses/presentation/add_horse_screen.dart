import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../../core/features/feature_gate.dart';
import '../../../core/storage/cloud/media_storage_router.dart';
import '../../../core/storage/cloud/media_storage_service.dart';
import '../../../core/storage/cloud/supabase_media_storage.dart';
import '../../../core/storage/cloud/r2_media_storage.dart';
import '../../../core/sync/connection_status.dart';
import '../../payments/presentation/widgets/paywall_widget.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../application/horses_providers.dart';
import '../domain/horse_record.dart';
import '../../../shared/domain/horse_breed_lineage.dart';
import '../../../shared/domain/horse_coat_color.dart';

/// Full-screen form for adding a new horse with validation.
class AddHorseScreen extends ConsumerStatefulWidget {
  const AddHorseScreen({super.key});

  @override
  ConsumerState<AddHorseScreen> createState() => _AddHorseScreenState();
}

class _AddHorseScreenState extends ConsumerState<AddHorseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _relationController = TextEditingController();
  final _coatController = TextEditingController();
  final _birthYearController = TextEditingController();
  final _awardCountController = TextEditingController(text: '0');
  final _offspringCountController = TextEditingController(text: '0');
  final _rootIdController = TextEditingController();
  final _notesController = TextEditingController();
  final _regionController = TextEditingController();
  final _sumController = TextEditingController();
  final _tamgaBrandClanController = TextEditingController();
  final _tamgaBrandGenerationController = TextEditingController();

  MongolianBreedLineage? _selectedBreedLineage;
  MongolianCoatColor? _selectedCoatColor;

  HorseGender _gender = HorseGender.gelding;
  bool _isOwnedByHousehold = true;
  bool _isSaving = false;
  File? _photoFile;
  final _imagePicker = ImagePicker();
  String? _selectedSireId;
  String? _selectedDamId;

  @override
  void dispose() {
    _nameController.dispose();
    _relationController.dispose();
    _coatController.dispose();
    _birthYearController.dispose();
    _awardCountController.dispose();
    _offspringCountController.dispose();
    _rootIdController.dispose();
    _notesController.dispose();
    _regionController.dispose();
    _sumController.dispose();
    _tamgaBrandClanController.dispose();
    _tamgaBrandGenerationController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 90,
    );
    if (picked != null) {
      setState(() {
        _photoFile = File(picked.path);
      });
    }
  }

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Морь нэмэх'),
        leading: IconButton(
          onPressed: () => Navigator.of(ctx).pop(),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Header ──
            Text(
              'Шинэ морийн мэдээлэл',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Заавар талбаруудыг бөглөнө үү.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── Photo picker ──
            Text(
              'Зураг',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            GestureDetector(
              onTap: _pickPhoto,
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.colorScheme.outline.withValues(alpha: 0.5),
                  ),
                ),
                child: _photoFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(_photoFile!, fit: BoxFit.cover),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.add_a_photo_outlined,
                            size: 36,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'Зураг нэмэх',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── Name (required) ──
            TextFormField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Нэр *',
                hintText: 'Жишээ: Хан Хүлэг',
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Нэр заавал оруулна уу';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Relation label ──
            TextFormField(
              controller: _relationController,
              decoration: const InputDecoration(
                labelText: 'Харилцаа',
                hintText: 'Жишээ: Root азарга, Хүү, Охин',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Coat color ──
            TextFormField(
              controller: _coatController,
              decoration: const InputDecoration(
                labelText: 'Зүс',
                hintText: 'Жишээ: Хээр, Цагаан, Бор',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Birth year (required) ──
            TextFormField(
              controller: _birthYearController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Төрсөн он *',
                hintText: 'Жишээ: 2020',
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Төрсөн он заавал оруулна уу';
                }
                final year = int.tryParse(val.trim());
                if (year == null || year < 1900 || year > DateTime.now().year) {
                  return 'Зөв оруулна уу (1900-${DateTime.now().year})';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Gender dropdown ──
            DropdownButtonFormField<HorseGender>(
              initialValue: _gender,
              decoration: const InputDecoration(labelText: 'Хүйс'),
              items: [
                for (final gender in HorseGender.values)
                  DropdownMenuItem(
                    value: gender,
                    child: Text(gender.displayName),
                  ),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _gender = val;
                  });
                }
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Awards + Offspring row ──
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _awardCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Шагнал'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: TextFormField(
                    controller: _offspringCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Үр төл'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Ownership toggle ──
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isOwnedByHousehold,
              title: const Text('Өрхийн бүртгэлтэй'),
              subtitle: Text(
                _isOwnedByHousehold
                    ? 'Өрхийн морийн жагсаалтад оруулна'
                    : 'Гаднах морийн жагсаалтад оруулна',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              onChanged: (val) {
                setState(() {
                  _isOwnedByHousehold = val;
                });
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Lineage root ──
            TextFormField(
              controller: _rootIdController,
              decoration: const InputDecoration(
                labelText: 'Lineage root id',
                hintText: 'khan-khuleg',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Notes ──
            TextFormField(
              controller: _notesController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Тэмдэглэл',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
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
            TextFormField(
              controller: _regionController,
              decoration: const InputDecoration(
                labelText: 'Аймаг',
                hintText: 'Жишээ: Хэнтий',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Sum ──
            TextFormField(
              controller: _sumController,
              decoration: const InputDecoration(
                labelText: 'Сум',
                hintText: 'Жишээ: Галшар',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Tamga brand clan ──
            TextFormField(
              controller: _tamgaBrandClanController,
              decoration: const InputDecoration(labelText: 'Тамга бүлгийн нэр'),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Tamga brand generation ──
            TextFormField(
              controller: _tamgaBrandGenerationController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Тамга үеийн дугаар',
                hintText: 'Жишээ: 1',
              ),
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
            const SizedBox(height: AppSpacing.xxl),

            // ── Save button ──
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Хадгалах'),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    // ── Tier gate: check horse limit ──────────────────────────────
    final currentHorses = ref.read(horsesProvider).valueOrNull ?? [];
    final gate = ref.read(horseCreationGateProvider(currentHorses.length));
    if (gate is GateDenied && context.mounted) {
      await PaywallWidget.show(context, denied: gate);
      return;
    }

    setState(() => _isSaving = true);

    final name = _nameController.text.trim();
    final relationLabel = _relationController.text.trim();
    final coat = _coatController.text.trim();
    final birthYear = int.parse(_birthYearController.text.trim());
    final awardCount = int.tryParse(_awardCountController.text.trim()) ?? 0;
    final offspringCount =
        int.tryParse(_offspringCountController.text.trim()) ?? 0;

    final horse = HorseRecord(
      id: 'horse-${DateTime.now().millisecondsSinceEpoch}',
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
    );

    // Upload photo if picked
    List<String> photoUrls = [];
    if (_photoFile != null && context.mounted) {
      try {
        final userId = currentSupabaseUserId() ?? 'anonymous';
        final storage = MediaStorageRouter(
          supabase: SupabaseMediaStorage(),
          r2: R2MediaStorage(
            signingEndpoint: 'https://r2-signer.tamga.workers.dev',
            publicDomain: 'https://videos.tamga.mn',
          ),
        );
        final path = MediaStorageRouter.horsePhotoPath(
          horseId: horse.id,
          userId: userId,
        );
        final result = await storage.upload(
          file: _photoFile!,
          path: path,
          category: MediaCategory.photo,
        );
        result.when(
          onSuccess: (uploadResult) => photoUrls = [uploadResult.url],
          onFailure: (_) {},
        );
      } catch (_) {
        // Photo upload failed — continue without photo
      }
    }

    // Save locally
    final finalHorse = photoUrls.isNotEmpty
        ? horse.copyWith(photoUrls: photoUrls)
        : horse;
    final repo = await ref.read(horsesRepositoryProvider.future);
    await repo.saveHorse(finalHorse);
    ref.invalidate(horsesProvider);

    // Show offline-aware save feedback
    if (mounted) {
      showOfflineAwareSaveFeedback(context, ConnectionMonitor.instance.current);
    }

    if (!mounted) return;
    setState(() => _isSaving = false);

    // Return the saved horse to the calling screen
    Navigator.of(context).pop(finalHorse);
  }
}
