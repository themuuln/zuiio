/// Морины эзэмшил шилжүүлэх дэлгэц.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/widgets.dart';
import '../domain/horse_transfer.dart';

/// Морины эзэмшил шилжүүлэх дэлгэц.
class HorseTransferScreen extends ConsumerStatefulWidget {
  const HorseTransferScreen({
    required this.horseId,
    required this.horseName,
    super.key,
  });

  /// Морины ID.
  final String horseId;

  /// Морины нэр.
  final String horseName;

  @override
  ConsumerState<HorseTransferScreen> createState() =>
      _HorseTransferScreenState();
}

class _HorseTransferScreenState extends ConsumerState<HorseTransferScreen> {
  final _formKey = GlobalKey<FormState>();
  final _toOwnerNameController = TextEditingController();
  final _priceController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime _transferDate = DateTime.now();
  bool _isLoading = false;

  @override
  void dispose() {
    _toOwnerNameController.dispose();
    _priceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitTransfer() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final transfer = HorseTransfer(
        id: const Uuid().v4(),
        horseId: widget.horseId,
        fromOwnerId: 'current-user', // TODO: Get from auth
        fromOwnerName: 'Одоогийн эзэн',
        toOwnerId: 'new-owner', // TODO: Get from user input
        toOwnerName: _toOwnerNameController.text.trim(),
        transferDate: _transferDate,
        price: double.tryParse(_priceController.text),
        notes: _notesController.text.trim(),
      );

      // TODO: Save to repository
      // await repository.createTransfer(transfer);

      if (mounted) {
        TamgaToast.showSuccess(context, 'Шилжүүлэг амжилттай бүртгэгдлээ');
        Navigator.of(context).pop(transfer);
      }
    } catch (e) {
      if (mounted) {
        TamgaToast.showError(context, 'Алдаа: $e');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Эзэмшил шилжүүлэх')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // морийн мэдээлэл
              Card(
                child: ListTile(
                  leading: const Icon(Icons.pets),
                  title: Text(widget.horseName),
                  subtitle: const Text('Шилжүүлэх морь'),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),

              // шинэ эзний нэр
              TextFormField(
                controller: _toOwnerNameController,
                decoration: const InputDecoration(
                  labelText: 'Шинэ эзний нэр',
                  hintText: 'Жишээ: Бат',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Шинэ эзний нэрээ оруулна уу';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.lg),

              // шилжүүлсэн огноо
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.calendar_today),
                title: const Text('Шилжүүлсэн огноо'),
                subtitle: Text(
                  '${_transferDate.year}-${_transferDate.month.toString().padLeft(2, '0')}-${_transferDate.day.toString().padLeft(2, '0')}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _transferDate,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    setState(() => _transferDate = date);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.lg),

              // үнэ (хэрэв борлуулалт бол)
              TextFormField(
                controller: _priceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Үнэ (₮) (заавал биш)',
                  hintText: 'Жишээ: 500000',
                  prefixIcon: Icon(Icons.payments_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // нэмэлт тэмдэглэл
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Нэмэлт тэмдэглэл (заавал биш)',
                  hintText: 'Шилжүүлгийн талаар нэмэлт мэдээлэл...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),

              // илгээх товч
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isLoading ? null : _submitTransfer,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Шилжүүлэх'),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // анхааруулга
              Card(
                color: theme.colorScheme.errorContainer,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Row(
                    children: [
                      Icon(
                        Icons.warning_amber_outlined,
                        color: theme.colorScheme.onErrorContainer,
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Text(
                          'Шилжүүлэг бүртгэгдсэний дараа цуцалж болохгүй. Нэмэлт мэдээллийг шалгаад илгээнэ үү.',
                          style: TextStyle(
                            color: theme.colorScheme.onErrorContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
