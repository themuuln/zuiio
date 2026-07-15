import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../auth/application/auth_providers.dart';
import '../application/race_providers.dart';
import '../domain/race.dart';

/// Уралдаан үүсгэх/засах дэлгэц.
///
/// - Шинэ уралдаан үүсгэх (`initialRace == null`)
/// - Одоо байгаа уралдааныг засах (`initialRace`-тай)
///
/// Шаардлагатай талбарууд:
/// - Нэр (name)
/// - Огноо (date)
/// - Байршил (location)
/// - Төрөл (type: naadam/regional/local)
/// - Оролцогчдын дээд тоо (maxEntries)
/// - Оролцооны төлбөр (entryFee)
/// - Тодорхойлолт (description)
/// - Шагналын хуваарилалт (prizeDistribution)
class RaceFormScreen extends ConsumerStatefulWidget {
  const RaceFormScreen({super.key, this.initialRace});

  /// Одоо байгаа уралдааныг засах бол `initialRace`-ийг дамжуулна.
  final Race? initialRace;

  /// Шинэ уралдаан үүсгэх үү?
  bool get isEditing => initialRace != null;

  @override
  ConsumerState<RaceFormScreen> createState() => _RaceFormScreenState();
}

class _RaceFormScreenState extends ConsumerState<RaceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _locationController;
  late final TextEditingController _maxEntriesController;
  late final TextEditingController _entryFeeController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _prizeDistributionController;

  DateTime? _selectedDate;
  RaceType _selectedType = RaceType.local;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final race = widget.initialRace;
    _nameController = TextEditingController(text: race?.name ?? '');
    _locationController = TextEditingController(text: race?.location ?? '');
    _maxEntriesController = TextEditingController(
      text: race?.maxEntries?.toString() ?? '',
    );
    _entryFeeController = TextEditingController(
      text: race?.entryFee.toString() ?? '0',
    );
    _descriptionController = TextEditingController(
      text: race?.description ?? '',
    );
    _prizeDistributionController = TextEditingController(
      text: race?.prizeDistribution ?? '',
    );
    _selectedDate = race?.date;
    _selectedType = race?.type ?? RaceType.local;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _maxEntriesController.dispose();
    _entryFeeController.dispose();
    _descriptionController.dispose();
    _prizeDistributionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now.add(const Duration(days: 7)),
      firstDate: now.subtract(const Duration(days: 30)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null && mounted) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final authState = ref.read(authStateProvider).valueOrNull;
      final userId = authState?.userId ?? '';

      final race =
          widget.initialRace ??
          Race(id: const Uuid().v4(), name: '', organizerId: userId);

      final updatedRace = race.copyWith(
        name: _nameController.text.trim(),
        location: _locationController.text.trim().isEmpty
            ? null
            : _locationController.text.trim(),
        date: _selectedDate,
        type: _selectedType,
        maxEntries: _maxEntriesController.text.trim().isEmpty
            ? null
            : int.tryParse(_maxEntriesController.text.trim()),
        entryFee: int.tryParse(_entryFeeController.text.trim()) ?? 0,
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        prizeDistribution: _prizeDistributionController.text.trim().isEmpty
            ? null
            : _prizeDistributionController.text.trim(),
      );

      final repository = ref.read(localRaceRepositoryProvider);
      final result = widget.isEditing
          ? await repository.update(updatedRace)
          : await repository.create(updatedRace);

      if (!context.mounted) return;

      result.when(
        onSuccess: (_) {
          ref.invalidate(racesProvider);
          TamgaToast.showSuccess(
            context,
            widget.isEditing
                ? 'Уралдаан амжилттай шинэчлэгдлээ'
                : 'Уралдаан амжилттай үүсгэгдлээ',
          );
          Navigator.of(context).pop(true);
        },
        onFailure: (error) {
          TamgaToast.showError(
            context,
            'Хадгалахад алдаа гарлаа: ${error.message}',
          );
        },
      );
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'Хадгалахад алдаа гарлаа: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEditing ? 'Уралдаан засах' : 'Уралдаан үүсгэх'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Хадгалах'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Name ──
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Уралдааны нэр *',
                hintText: 'Жишээ: Төв аймгийн наадам',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Нэр шаардлагатай' : null,
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Date ──
            InkWell(
              onTap: _pickDate,
              borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusSmall),
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Огноо *',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _selectedDate != null
                      ? '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}'
                      : 'Огноо сонгох',
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Location ──
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Байршил',
                hintText: 'Жишээ: Төв аймаг, Монгол',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Type ──
            DropdownButtonFormField<RaceType>(
              initialValue: _selectedType,
              decoration: const InputDecoration(
                labelText: 'Төрөл *',
                border: OutlineInputBorder(),
              ),
              items: RaceType.values.map((type) {
                return DropdownMenuItem(
                  value: type,
                  child: Text(type.displayName),
                );
              }).toList(),
              onChanged: (v) {
                if (v != null) setState(() => _selectedType = v);
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Max entries ──
            TextFormField(
              controller: _maxEntriesController,
              decoration: const InputDecoration(
                labelText: 'Оролцогчдын дээд тоо',
                hintText: 'Хоосон бол хязгааргүй',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Entry fee ──
            TextFormField(
              controller: _entryFeeController,
              decoration: const InputDecoration(
                labelText: 'Оролцооны төлбөр (₮)',
                hintText: '0',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Description ──
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Тодорхойлолт',
                hintText: 'Уралдааны дэлгэрэнгүй мэдээлэл',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Prize distribution ──
            TextFormField(
              controller: _prizeDistributionController,
              decoration: const InputDecoration(
                labelText: 'Шагналын хуваарилалт',
                hintText: '1-р байр: 500,000₮\n2-р байр: 300,000₮',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }
}
