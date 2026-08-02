import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/storage/cloud/media_storage_providers.dart';
import '../../../core/storage/cloud/media_storage_service.dart';
import '../../../core/storage/cloud/media_storage_router.dart';
import '../../../core/sync/connection_status.dart';
import '../../../app/supabase_bootstrap.dart';
import '../../map/application/lost_horse_providers.dart';
import '../../map/domain/lost_horse_report.dart';
import '../../map/domain/map_enums.dart';
import '../../map/presentation/lost_horse_detail_screen.dart';
import '../../shared/presentation/offline_save_feedback.dart';
import '../../horses/domain/horse_record.dart';
import '../application/market_providers.dart';
import '../application/market_notifications.dart';
import '../application/verification_providers.dart';
import '../domain/market_listing.dart';

// ══════════════════════════════════════════════════════════════════
// CreateListingScreen — Create or edit a marketplace listing
// ══════════════════════════════════════════════════════════════════

class CreateListingScreen extends ConsumerStatefulWidget {
  const CreateListingScreen({super.key, this.listing});

  /// If provided, the screen runs in edit mode with all fields pre-filled.
  final MarketListing? listing;

  bool get isEditMode => listing != null;

  @override
  ConsumerState<CreateListingScreen> createState() =>
      _CreateListingScreenState();
}

class _CreateListingScreenState extends ConsumerState<CreateListingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _locationController = TextEditingController();
  final _documentTagsController = TextEditingController();
  final _picker = ImagePicker();

  String? _selectedHorseId;
  MarketSaleType _saleType = MarketSaleType.sale;
  bool _showPreview = false;
  late bool _isEditMode;
  bool _verificationChecked = false;

  // ── Photo state ─────────────────────────────────────────────
  // Local files before upload
  final List<File> _localPhotos = [];
  // Uploaded URLs after sync
  final List<String> _uploadedUrls = [];
  bool _isUploading = false;
  double _uploadProgress = 0;

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.isEditMode;

    if (_isEditMode) {
      final listing = widget.listing!;
      _titleController.text = listing.title;
      _descriptionController.text = listing.description;
      _priceController.text = listing.priceAmount.toString();
      _locationController.text = listing.locationLabel;
      _documentTagsController.text = listing.documentTags.join(', ');
      _selectedHorseId = listing.horseId;
      _saleType = listing.saleType;
      _uploadedUrls.addAll(listing.mediaUrls);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    _documentTagsController.dispose();
    super.dispose();
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

  /// Шинэ зар үүсгэх үед худалдагчийн баталгаажуулалтыг шалгаж,
  /// баталгаажаагүй бол баталгаажуулах цонх харуулна.
  void _checkVerificationAndPrompt() {
    _verificationChecked = true;

    if (!_isEditMode) {
      // Асинхроноор баталгаажуулалтын төлөвийг шалгах
      Future.microtask(() async {
        if (!mounted) return;
        final userId = currentSupabaseUserId() ?? 'anonymous';
        final repository = await ref.read(
          verificationRepositoryProvider.future,
        );
        final result = await repository.fetchSellerVerificationSummary(userId);
        final summary = result.getOrThrow();

        if (!summary.isVerified && mounted) {
          _showVerificationPrompt();
        }
      });
    }
  }

  /// Баталгаажаагүй худалдагчид баталгаажуулах цонх харуулах.
  void _showVerificationPrompt() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.verified_user_outlined, size: 24),
            SizedBox(width: AppSpacing.sm),
            Expanded(child: Text('Баталгаажуулах шаардлагатай')),
          ],
        ),
        content: const Text(
          'Зар нийтлэхийн тулд утасны дугаараа баталгаажуулах шаардлагатай. '
          'Баталгаажсан худалдагчдын зарууд итгэл төгс байдаг.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              if (mounted) {
                Navigator.of(context).pop(); // Буцах
              }
            },
            child: const Text('Цуцлах'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              if (mounted) {
                context.push('/profile/verification');
              }
            },
            child: const Text('Баталгаажуулах'),
          ),
        ],
      ),
    );
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

  /// Move a photo left (swap with previous).
  void _movePhotoLeft(int index) {
    if (index <= 0) return;
    _swapPhotos(index, index - 1);
  }

  /// Move a photo right (swap with next).
  void _movePhotoRight(int index) {
    final total = _localPhotos.length + _uploadedUrls.length;
    if (index >= total - 1) return;
    _swapPhotos(index, index + 1);
  }

  /// Swap two photos by their combined index.
  void _swapPhotos(int a, int b) {
    final aIsLocal = a < _localPhotos.length;
    final bIsLocal = b < _localPhotos.length;

    setState(() {
      // Both are local
      if (aIsLocal && bIsLocal) {
        final temp = _localPhotos[a];
        _localPhotos[a] = _localPhotos[b];
        _localPhotos[b] = temp;
        return;
      }

      // Both are uploaded
      if (!aIsLocal && !bIsLocal) {
        final aUrlIdx = a - _localPhotos.length;
        final bUrlIdx = b - _localPhotos.length;
        final temp = _uploadedUrls[aUrlIdx];
        _uploadedUrls[aUrlIdx] = _uploadedUrls[bUrlIdx];
        _uploadedUrls[bUrlIdx] = temp;
        return;
      }

      // Mixed: one local, one uploaded — convert to single-list model
      final combined = <dynamic>[..._localPhotos, ..._uploadedUrls];
      final temp = combined[a];
      combined[a] = combined[b];
      combined[b] = temp;
      _localPhotos.clear();
      _uploadedUrls.clear();
      for (final item in combined) {
        if (item is File) {
          _localPhotos.add(item);
        } else if (item is String) {
          _uploadedUrls.add(item);
        }
      }
    });
  }

  // ── Upload photos ───────────────────────────────────────────

  Future<List<String>> _uploadPhotos() async {
    if (_localPhotos.isEmpty) return _uploadedUrls;

    final storage = ref.read(mediaStorageProvider);
    final userId = currentSupabaseUserId() ?? 'anonymous';
    final uploaded = List<String>.from(_uploadedUrls);

    setState(() {
      _isUploading = true;
      _uploadProgress = 0;
    });

    try {
      for (var i = 0; i < _localPhotos.length; i++) {
        final file = _localPhotos[i];
        final path = MediaStorageRouter.marketPhotoPath(userId: userId);

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
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(marketCatalogProvider);

    // Шинэ зар үүсгэх үед баталгаажуулалтыг шалгах
    if (!_isEditMode && !_verificationChecked) {
      _checkVerificationAndPrompt();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _showPreview
              ? 'Үзэх'
              : (_isEditMode ? 'Зар засах' : 'Шинэ зар нэмэх'),
        ),
        actions: [
          if (_showPreview)
            TextButton(
              onPressed: () => setState(() => _showPreview = false),
              child: const Text('Буцах'),
            ),
        ],
      ),
      body: catalogAsync.when(
        data: (catalog) {
          if (_showPreview) {
            return _buildPreview(catalog.horses);
          }
          return _buildForm(catalog.horses);
        },
        loading: () => SkeletonLoader(
          items: 4,
          itemBuilder: (ctx, i) => const SkeletonCardTile(),
        ),
        error: (e, _) => TamgaErrorWidget(
          message: 'Мэдээлэл ачаалахад алдаа гарлаа',
          onRetry: () => ref.invalidate(marketCatalogProvider),
        ),
      ),
    );
  }

  // ── Form ──────────────────────────────────────────────────────

  Widget _buildForm(List<HorseRecord> horses) {
    final theme = Theme.of(context);
    final totalPhotos = _localPhotos.length + _uploadedUrls.length;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          // ── Select horse ──────────────────────────────────
          Text('Морь сонгох', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<String>(
            initialValue: _selectedHorseId,
            decoration: const InputDecoration(
              labelText: 'Морь *',
              border: OutlineInputBorder(),
            ),
            items: horses
                .map(
                  (horse) => DropdownMenuItem(
                    value: horse.id,
                    child: Text('${horse.name} (${horse.coat})'),
                  ),
                )
                .toList(),
            onChanged: (value) => setState(() => _selectedHorseId = value),
            validator: (value) => value == null ? 'Морь сонгоно уу' : null,
          ),
          if (_activeReportForSelectedHorse(horses) != null) ...[
            const SizedBox(height: AppSpacing.sm),
            _LostReportWarningBanner(
              report: _activeReportForSelectedHorse(horses)!,
            ),
          ],
          const SizedBox(height: AppSpacing.lg),

          // ── Listing type ──────────────────────────────────
          Text('Зарын төрөл', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              for (final type in MarketSaleType.values)
                ChoiceChip(
                  label: Text(type.label),
                  selected: _saleType == type,
                  onSelected: (_) => setState(() => _saleType = type),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Title ─────────────────────────────────────────
          TextFormField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Гарчиг *',
              hintText: 'Жишээ: Алтан Шуурга — Хан хүлэгийн удам',
              border: OutlineInputBorder(),
            ),
            validator: (value) => (value == null || value.trim().isEmpty)
                ? 'Гарчиг шаардлагатай'
                : null,
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Price ─────────────────────────────────────────
          TextFormField(
            controller: _priceController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Үнэ (₮) *',
              hintText: 'Жишээ: 15000000',
              prefixText: '₮ ',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Үнэ шаардлагатай';
              }
              final price = int.tryParse(value.trim());
              if (price == null || price <= 0) {
                return 'Зөв үнэ оруулна уу';
              }
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Description ───────────────────────────────────
          TextFormField(
            controller: _descriptionController,
            minLines: 3,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Тайлбар *',
              hintText: 'Морины талаар дэлгэрэнгүй тайлбар...',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
            validator: (value) {
              if (value == null || value.trim().length < 20) {
                return 'Тайлбар хамгийн багадаа 20 тэмдэгт байх ёстой';
              }
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Location ──────────────────────────────────────
          TextFormField(
            controller: _locationController,
            decoration: const InputDecoration(
              labelText: 'Байршил (аймаг, сум) *',
              hintText: 'Жишээ: Архангай, Эрдэнэбулган',
              border: OutlineInputBorder(),
            ),
            validator: (value) => (value == null || value.trim().isEmpty)
                ? 'Байршил шаардлагатай'
                : null,
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Document tags ─────────────────────────────────
          TextFormField(
            controller: _documentTagsController,
            decoration: const InputDecoration(
              labelText: 'Бичиг баримт',
              hintText: 'Pedigree, Vaccination, Coggins',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // ── Photos ────────────────────────────────────────
          Text('Зургууд', style: theme.textTheme.titleMedium),
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
                            ? Image.file(_localPhotos[index], fit: BoxFit.cover)
                            : CachedNetworkImage(
                                imageUrl:
                                    _uploadedUrls[index - _localPhotos.length],
                                fit: BoxFit.cover,
                                placeholder: (_, _) => Container(
                                  color:
                                      theme.colorScheme.surfaceContainerHighest,
                                  child: const Center(
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                ),
                                errorWidget: (_, _, _) => Container(
                                  color: theme.colorScheme.errorContainer,
                                  child: Icon(
                                    Icons.error_outline,
                                    color: theme.colorScheme.error,
                                  ),
                                ),
                              ),
                      ),
                      // ── Reorder: move left ──
                      if (index > 0)
                        Positioned(
                          left: 2,
                          top: 2,
                          child: Tooltip(
                            message: 'Зөөх',
                            child: Semantics(
                              button: true,
                              label: 'Зөөх',
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: () => _movePhotoLeft(index),
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.surface.withValues(
                                      alpha: 0.85,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.chevron_left,
                                    size: 20,
                                    color: theme.colorScheme.onSurface,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      // ── Reorder: move right ──
                      if (index < totalPhotos - 1)
                        Positioned(
                          right: 2,
                          top: 2,
                          child: Tooltip(
                            message: 'Зөөх',
                            child: Semantics(
                              button: true,
                              label: 'Зөөх',
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: () => _movePhotoRight(index),
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.surface.withValues(
                                      alpha: 0.85,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.chevron_right,
                                    size: 20,
                                    color: theme.colorScheme.onSurface,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      // ── Remove button ──
                      Positioned(
                        right: 2,
                        bottom: 2,
                        child: Tooltip(
                          message: 'Устгах',
                          child: Semantics(
                            button: true,
                            label: 'Устгах',
                            child: GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onTap: () => _removePhoto(index),
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.error,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.close,
                                  size: 20,
                                  color: theme.colorScheme.onError,
                                ),
                              ),
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
                            color: theme.colorScheme.surface.withValues(
                              alpha: 0.75,
                            ),
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
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Галерээ'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: const Text('Камер'),
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

          // ── Action buttons ────────────────────────────────
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isUploading
                      ? null
                      : () {
                          if (_isEditMode) {
                            context.go('/market/my-listings');
                          } else {
                            Navigator.of(context).pop();
                          }
                        },
                  child: const Text('Цуцлах'),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: FilledButton(
                  onPressed: _isUploading
                      ? null
                      : () {
                          if (_formKey.currentState?.validate() ?? false) {
                            setState(() => _showPreview = true);
                          }
                        },
                  child: const Text('Үзэх'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Preview ───────────────────────────────────────────────────

  Widget _buildPreview(List<HorseRecord> horses) {
    final theme = Theme.of(context);
    final horse = horses.firstWhere(
      (h) => h.id == _selectedHorseId,
      orElse: () => horses.first,
    );
    final price = int.tryParse(_priceController.text.trim()) ?? 0;
    final tags = _documentTagsController.text
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    // Combine local + uploaded for preview
    final allPhotoUrls = [..._localPhotos.map((f) => f.path), ..._uploadedUrls];

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Preview header ──────────────────────────────────
        Card(
          child: Padding(
            padding: AppSpacing.cardPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.preview, color: theme.colorScheme.primary),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      'Зарын урьдчилсан үзэмж',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // ── Photo carousel preview ──────────────────────────
        if (allPhotoUrls.isNotEmpty)
          SizedBox(
            height: 200,
            child: PageView.builder(
              itemCount: allPhotoUrls.length,
              itemBuilder: (context, index) {
                final url = allPhotoUrls[index];
                final isLocal = index < _localPhotos.length;

                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(
                      AppSpacing.cornerRadius,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: isLocal
                      ? Image.file(File(url), fit: BoxFit.cover)
                      : CachedNetworkImage(
                          imageUrl: url,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) => Container(
                            color: theme.colorScheme.errorContainer,
                            child: Icon(
                              Icons.error_outline,
                              color: theme.colorScheme.error,
                            ),
                          ),
                        ),
                );
              },
            ),
          ),
        const SizedBox(height: AppSpacing.md),

        // ── Listing details ─────────────────────────────────
        Card(
          child: Padding(
            padding: AppSpacing.cardPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _titleController.text.trim(),
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${_formatPrice(price)} MNT • ${_locationController.text.trim()}',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                Text(_descriptionController.text.trim()),
                const SizedBox(height: AppSpacing.md),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xs,
                  children: [
                    _PreviewBadge(label: _saleType.label),
                    _PreviewBadge(label: 'Итгэл 0%'),
                    _PreviewBadge(label: horse.name),
                    for (final tag in tags) _PreviewBadge(label: tag),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // ── Submit buttons ──────────────────────────────────
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _showPreview = false),
                child: const Text('Буцах'),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: FilledButton.icon(
                onPressed: _isUploading ? null : _submitListing,
                icon: _isUploading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.publish),
                label: Text(
                  _isUploading
                      ? 'Ачаалж байна...'
                      : (_isEditMode ? 'Хадгалах' : 'Нийтлэх'),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Submit ────────────────────────────────────────────────────

  /// Active public recovery report for the currently selected horse, if any.
  LostHorseReport? _activeReportForSelectedHorse(List<HorseRecord> horses) {
    final selectedId = _selectedHorseId;
    if (selectedId == null) return null;
    final activeReports = ref.read(activeLostHorsesProvider);
    if (activeReports case AsyncData(value: final reports)) {
      return reports
          .where(
            (r) =>
                r.horseId == selectedId && r.status == LostHorseStatus.active,
          )
          .firstOrNull;
    }
    return null;
  }

  Future<void> _submitListing() async {
    final price = int.tryParse(_priceController.text.trim());
    if (price == null || price <= 0) return;
    if (_selectedHorseId == null) return;

    // Lost-report guard: refuse to list a horse that is publicly reported lost.
    // Server triggers enforce this too; the client check gives a friendly message.
    LostHorseReport? conflict;
    try {
      final reports = await ref.read(activeLostHorsesProvider.future);
      conflict = _selectedHorseId == null
          ? null
          : reports
                .where(
                  (r) =>
                      r.horseId == _selectedHorseId &&
                      r.status == LostHorseStatus.active,
                )
                .firstOrNull;
    } catch (_) {
      conflict = null; // offline/error — the server guard still enforces
    }
    if (conflict != null) {
      if (!mounted) return;
      await _showLostReportBlockedDialog(conflict);
      return;
    }

    // Upload any remaining local photos
    final allUrls = await _uploadPhotos();
    if (!mounted) return;

    final tags = _documentTagsController.text
        .split(',')
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toList();

    final now = DateTime.now();

    final MarketListing listing;
    if (_isEditMode) {
      // Update existing listing — preserve fields that shouldn't change
      final original = widget.listing!;
      listing = original.copyWith(
        horseId: _selectedHorseId!,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        priceAmount: price,
        saleType: _saleType,
        locationLabel: _locationController.text.trim(),
        documentTags: tags,
        mediaUrls: allUrls,
        updatedAt: now,
      );
    } else {
      listing = MarketListing(
        id: 'listing-${now.millisecondsSinceEpoch}',
        horseId: _selectedHorseId!,
        sellerId: currentSupabaseUserId() ?? 'anonymous',
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        priceAmount: price,
        currency: 'MNT',
        saleType: _saleType,
        status: MarketListingStatus.pendingVerification,
        locationLabel: _locationController.text.trim(),
        disciplineTags: const ['Marketplace'],
        documentTags: tags,
        mediaUrls: allUrls,
        isSellerVerified: false,
        createdAt: now,
        updatedAt: now,
      );
    }

    final repository = await ref.read(marketRepositoryProvider.future);
    final result = await repository.saveListing(listing);

    if (!mounted) return;

    result.when(
      onSuccess: (_) async {
        ref.invalidate(marketListingsProvider);
        ref.invalidate(marketCatalogProvider);
        ref.invalidate(myListingsProvider);

        // Trigger saved search matching for the new/updated listing
        try {
          final notifications = await ref.read(
            marketNotificationsProvider.future,
          );
          await notifications.triggerMatchingForListing(listing);
        } catch (e) {
          debugPrint('[CreateListing] Saved search matching error: $e');
        }

        if (mounted) {
          showOfflineAwareSaveFeedback(
            context,
            ConnectionMonitor.instance.current,
            onSavedMessage: _isEditMode
                ? 'Зар амжилттай хадгалагдлаа.'
                : 'Зар амжилттай нийтлэгдлээ. Баталгаажуулалт хүлээж байна.',
          );
        }
        if (!mounted) return;
        if (_isEditMode) {
          context.go('/market/my-listings');
        } else {
          context.go('/market');
        }
      },
      onFailure: (error) {
        if (!mounted) return;
        TamgaToast.showError(context, 'Алдаа: ${error.message}');
      },
    );
  }

  String _formatPrice(int value) {
    return value.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (match) => ',',
    );
  }

  /// Blocks submission with a bilingual explanation when the selected horse
  /// has an active public recovery report.
  Future<void> _showLostReportBlockedDialog(LostHorseReport report) async {
    final l10n = AppLocalizations.of(context)!;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded),
        title: Text(l10n.marketLostReportBlockedTitle),
        content: Text(l10n.marketLostReportBlockedBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(l10n.generalCancel),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => LostHorseDetailScreen(report: report),
                ),
              );
            },
            child: Text(l10n.marketLostReportView),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Lost-report warning banner (shown under the horse picker)
// ══════════════════════════════════════════════════════════════════

/// Inline warning shown in the create form when the selected horse has an
/// active public recovery report; submission is blocked in that case.
class _LostReportWarningBanner extends StatelessWidget {
  const _LostReportWarningBanner({required this.report});

  final LostHorseReport report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Container(
      padding: EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning_amber_rounded,
            size: 18,
            color: theme.colorScheme.onErrorContainer,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              l10n.marketLostReportConflictBody,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onErrorContainer,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Preview badge
// ══════════════════════════════════════════════════════════════════

class _PreviewBadge extends StatelessWidget {
  const _PreviewBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm + 2,
          vertical: AppSpacing.xs + 3,
        ),
        child: Text(label, style: theme.textTheme.labelLarge),
      ),
    );
  }
}
