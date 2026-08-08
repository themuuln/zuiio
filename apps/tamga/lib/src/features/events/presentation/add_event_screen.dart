import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:phosphoricons_flutter/phosphoricons_flutter.dart';
import 'package:tamga/l10n/generated/app_localizations.dart';

import '../../../app/supabase_bootstrap.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/storage/cloud/media_storage_service.dart';
import '../../../core/storage/cloud/supabase_media_storage.dart';
import '../../../core/widgets/widgets.dart';
import '../../../shared/domain/event.dart';
import 'widgets/event_location_picker.dart';

/// Event type options for the dropdown.
const List<EventType> kEventTypes = EventType.values;

/// Full-screen form for adding or editing an [Event].
///
/// Pass [horseId] and [horseName] to pre-associate the event with a horse.
/// Pass [initialEvent] to edit an existing event.
class AddEventScreen extends ConsumerStatefulWidget {
  const AddEventScreen({
    required this.horseId,
    required this.horseName,
    this.initialEvent,
    super.key,
  });

  final String horseId;
  final String horseName;
  final Event? initialEvent;

  @override
  ConsumerState<AddEventScreen> createState() => _AddEventScreenState();
}

class _AddEventScreenState extends ConsumerState<AddEventScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _resultController = TextEditingController();
  final _organizerNameController = TextEditingController();
  final _organizerPhoneController = TextEditingController();
  final _organizerEmailController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();
  final _picker = ImagePicker();

  EventType _selectedType = kEventTypes.first;
  DateTime _selectedDate = DateTime.now();
  bool _isSaving = false;
  bool _isFeatured = false;
  bool _registrationEnabled = false;
  double? _latitude;
  double? _longitude;

  // ── Photo state ─────────────────────────────────────────────
  final List<File> _localPhotos = [];
  final List<String> _uploadedUrls = [];
  bool _isUploading = false;
  double _uploadProgress = 0;

  bool get _isEditing => widget.initialEvent != null;

  @override
  void initState() {
    super.initState();
    final event = widget.initialEvent;
    if (event != null) {
      _titleController.text = event.title;
      _locationController.text = event.location ?? '';
      _resultController.text = event.result ?? '';
      _organizerNameController.text = event.organizerName ?? '';
      _organizerPhoneController.text = event.organizerPhone ?? '';
      _organizerEmailController.text = event.organizerEmail ?? '';
      _addressController.text = event.address ?? '';
      _notesController.text = event.notes ?? '';
      _selectedType = event.eventType;
      _selectedDate = event.date ?? DateTime.now();
      _isFeatured = event.isFeatured;
      _registrationEnabled = event.registrationEnabled;
      _latitude = event.latitude;
      _longitude = event.longitude;
      // Load existing photos
      if (event.photoUrls.isNotEmpty) {
        _uploadedUrls.addAll(event.photoUrls);
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _resultController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  // ── Image picking ───────────────────────────────────────────

  Future<void> _pickImage(ImageSource source) async {
    if (_localPhotos.length + _uploadedUrls.length >= 5) {
      TamgaToast.show(context, 'Дээд тал нь 5 зураг нэмэх боломжтой');
      return;
    }

    final xFile = await _picker.pickImage(
      source: source,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );

    if (xFile != null) {
      // Compress the image
      final compressed = await _compressImage(File(xFile.path));
      setState(() {
        _localPhotos.add(compressed ?? File(xFile.path));
      });
    }
  }

  Future<File?> _compressImage(File file) async {
    try {
      final dir = await getTemporaryDirectory();
      final targetPath =
          '${dir.path}/${DateTime.now().millisecondsSinceEpoch}.jpg';

      final result = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: 80,
        minWidth: 1024,
        minHeight: 1024,
        format: CompressFormat.jpeg,
      );

      if (result == null) return null;
      return File(result.path);
    } catch (_) {
      return null;
    }
  }

  void _removePhoto(int index) {
    setState(() {
      if (index < _localPhotos.length) {
        _localPhotos.removeAt(index);
      } else {
        final urlIndex = index - _localPhotos.length;
        _uploadedUrls.removeAt(urlIndex);
      }
    });
  }

  // ── Upload photos ───────────────────────────────────────────

  Future<List<String>> _uploadPhotos() async {
    if (_localPhotos.isEmpty) return _uploadedUrls;

    final userId = currentSupabaseUserId();
    if (userId == null) return _uploadedUrls;

    final storage = SupabaseMediaStorage();
    final uploaded = List<String>.from(_uploadedUrls);

    setState(() {
      _isUploading = true;
      _uploadProgress = 0;
    });

    try {
      for (var i = 0; i < _localPhotos.length; i++) {
        final file = _localPhotos[i];
        final path =
            'horse-photos/$userId/events/${DateTime.now().millisecondsSinceEpoch}.jpg';

        final result = await storage.upload(
          file: file,
          path: path,
          category: MediaCategory.photo,
        );

        result.when(
          onSuccess: (upload) => uploaded.add(upload.url),
          onFailure: (error) {
            TamgaToast.showError(
              context,
              'Зураг ачаалахад алдаа: ${error.message}',
            );
          },
        );

        setState(() {
          _uploadProgress = (i + 1) / _localPhotos.length;
        });
      }
    } finally {
      setState(() {
        _isUploading = false;
        _localPhotos.clear();
      });
    }

    return uploaded;
  }

  @override
  Widget build(BuildContext ctx) {
    final theme = Theme.of(ctx);
    final totalPhotos = _localPhotos.length + _uploadedUrls.length;
    final l10n = AppLocalizations.of(ctx)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Event засах' : 'Event нэмэх'),
        leading: IconButton(
          onPressed: () => Navigator.of(ctx).pop(),
          icon: const Icon(PhosphorIconsRegular.caretLeft),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            // ── Header ──
            Text(
              _isEditing ? 'Event мэдээлэл засах' : 'Шинэ event-ийн мэдээлэл',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Морь: ${widget.horseName}',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ── Event type (required) ──
            DropdownButtonFormField<EventType>(
              initialValue: _selectedType,
              decoration: InputDecoration(
                labelText: l10n.eventFormTypeLabel,
                hintText: 'Төрөл сонгоно уу',
              ),
              items: kEventTypes
                  .map(
                    (type) => DropdownMenuItem(
                      value: type,
                      child: Text(type.displayName),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _selectedType = value;
                  });
                }
              },
              validator: (val) {
                if (val == null) {
                  return 'Event төрөл заавал сонгоно уу';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Title (required) ──
            TextFormField(
              controller: _titleController,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Гарчиг *',
                hintText: 'Жишээ: Хаврын цом 2026',
              ),
              validator: (val) {
                if (val == null || val.trim().isEmpty) {
                  return 'Гарчиг заавал оруулна уу';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Date picker (required) ──
            InkWell(
              onTap: _pickDate,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.eventFormDateLabel,
                  hintText: 'Огноо сонгоно уу',
                  suffixIcon: Icon(PhosphorIconsRegular.calendarBlank),
                ),
                child: Text(_formatDate(_selectedDate)),
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Location ──
            TextFormField(
              controller: _locationController,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                labelText: l10n.eventFormLocationLabel,
                hintText: 'Жишээ: Баянхонгор аймаг',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Address ──
            TextFormField(
              controller: _addressController,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Хаяг',
                hintText: 'Дэлгэрэнгүй хаяг',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Location picker (MapLibre) ──
            EventLocationPicker(
              initialLatitude: _latitude,
              initialLongitude: _longitude,
              onLocationChanged: (lat, lng) {
                setState(() {
                  _latitude = lat;
                  _longitude = lng;
                });
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            // ─── Organizer fields ──
            Text('Зохион байгуулагч', style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),

            TextFormField(
              controller: _organizerNameController,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Зохион байгуулагчийн нэр',
                hintText: 'Нэр эсвэл байгууллага',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            TextFormField(
              controller: _organizerPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Утас',
                hintText: '+976 9911-2233',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            TextFormField(
              controller: _organizerEmailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'И-мэйл',
                hintText: 'example@email.com',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Result ──
            TextFormField(
              controller: _resultController,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Үр дүн',
                hintText: 'Жишээ: 1-р байр, Алтан медаль',
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Toggles ──
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isFeatured,
              title: const Text('Онцлох'),
              subtitle: Text(
                _isFeatured
                    ? 'Онцлох хэсэгт харагдана'
                    : 'Онцлох хэсэгт харагдахгүй',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _isFeatured = value;
                });
              },
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _registrationEnabled,
              title: const Text('Бүртгэл идэвхжүүлэх'),
              subtitle: Text(
                _registrationEnabled
                    ? 'Морь бүртгүүлэх боломжтой'
                    : 'Морь бүртгүүлэх боломжгүй',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _registrationEnabled = value;
                });
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ── Notes ──
            TextFormField(
              controller: _notesController,
              textCapitalization: TextCapitalization.sentences,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: l10n.eventDetailNotes,
                hintText: 'Нэмэлт мэдээлэл...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // ── Photos ──
            Text(l10n.eventFormPhotoLabel, style: theme.textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),

            // Photo grid
            if (totalPhotos > 0)
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: totalPhotos,
                  separatorBuilder: (_, _) =>
                      const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final isLocal = index < _localPhotos.length;
                    return Stack(
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              AppSpacing.cornerRadiusSmall,
                            ),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: isLocal
                              ? Image.file(
                                  _localPhotos[index],
                                  fit: BoxFit.cover,
                                )
                              : CachedNetworkImage(
                                  imageUrl:
                                      _uploadedUrls[index -
                                          _localPhotos.length],
                                  fit: BoxFit.cover,
                                  placeholder: (_, _) => Container(
                                    color: theme
                                        .colorScheme
                                        .surfaceContainerHighest,
                                    child: const Center(
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  ),
                                  errorWidget: (_, _, _) => Container(
                                    color: theme.colorScheme.errorContainer,
                                    child: Icon(
                                      PhosphorIconsRegular.warningCircle,
                                      color: theme.colorScheme.error,
                                    ),
                                  ),
                                ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () => _removePhoto(index),
                            child: Container(
                              decoration: BoxDecoration(
                                color: theme.colorScheme.error,
                                shape: BoxShape.circle,
                              ),
                              padding: const EdgeInsets.all(AppSpacing.xs),
                              child: Icon(
                                PhosphorIconsRegular.xCircle,
                                size: 14,
                                color: theme.colorScheme.onError,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

            // Upload progress
            if (_isUploading)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: Column(
                  children: [
                    LinearProgressIndicator(value: _uploadProgress),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Ачаалж байна... ${(_uploadProgress * 100).toInt()}%',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),

            const SizedBox(height: AppSpacing.sm),

            // Add photo buttons
            if (totalPhotos < 5 && !_isUploading)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(PhosphorIconsRegular.images),
                      label: Text(l10n.horseDetailPhotoGallery),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: const Icon(PhosphorIconsRegular.camera),
                      label: Text(l10n.horseDetailPhotoCamera),
                    ),
                  ),
                ],
              ),

            if (totalPhotos >= 5)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.xs),
                child: Text(
                  'Дээд тал нь 5 зураг',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.error,
                  ),
                ),
              ),
            const SizedBox(height: AppSpacing.xxl),

            // ── Actions ──
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isSaving ? null : () => Navigator.of(ctx).pop(),
                    child: Text(l10n.generalCancel),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: FilledButton(
                    onPressed: _isSaving || _isUploading ? null : _save,
                    child: _isSaving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_isEditing ? l10n.generalSave : 'Нэмэх'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    // Upload any remaining local photos
    final allUrls = await _uploadPhotos();
    if (!mounted) return;

    final existing = widget.initialEvent;
    final event = Event(
      id: existing?.id ?? 'event-${DateTime.now().millisecondsSinceEpoch}',
      title: _titleController.text.trim(),
      horseId: widget.horseId,
      horseName: widget.horseName,
      eventType: _selectedType,
      date: _selectedDate,
      location: _locationController.text.trim().isNotEmpty
          ? _locationController.text.trim()
          : null,
      latitude: _latitude,
      longitude: _longitude,
      result: _resultController.text.trim().isNotEmpty
          ? _resultController.text.trim()
          : null,
      organizerName: _organizerNameController.text.trim().isNotEmpty
          ? _organizerNameController.text.trim()
          : null,
      organizerPhone: _organizerPhoneController.text.trim().isNotEmpty
          ? _organizerPhoneController.text.trim()
          : null,
      organizerEmail: _organizerEmailController.text.trim().isNotEmpty
          ? _organizerEmailController.text.trim()
          : null,
      isFeatured: _isFeatured,
      registrationEnabled: _registrationEnabled,
      address: _addressController.text.trim().isNotEmpty
          ? _addressController.text.trim()
          : null,
      notes: _notesController.text.trim().isNotEmpty
          ? _notesController.text.trim()
          : null,
      photoUrls: allUrls,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    if (!mounted) return;
    Navigator.of(context).pop(event);
  }
}
