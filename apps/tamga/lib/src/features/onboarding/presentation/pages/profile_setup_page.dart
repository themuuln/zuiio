import 'package:flutter/material.dart';

/// Screen 3: Хувийн мэдээлэл.
///
/// Display name (required), region/aimag dropdown (21 aimags), phone (optional).
class ProfileSetupPage extends StatefulWidget {
  const ProfileSetupPage({
    required this.onContinue,
    this.initialDisplayName,
    this.initialRegion,
    this.initialPhone,
    super.key,
  });

  final void Function(String displayName, String? region, String? phone)
  onContinue;
  final String? initialDisplayName;
  final String? initialRegion;
  final String? initialPhone;

  @override
  State<ProfileSetupPage> createState() => _ProfileSetupPageState();
}

class _ProfileSetupPageState extends State<ProfileSetupPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  String? _selectedRegion;

  static const _aimags = [
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
    'Хэнтий',
    'Хөвсгөл',
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: widget.initialDisplayName ?? '',
    );
    _phoneController = TextEditingController(text: widget.initialPhone ?? '');
    _selectedRegion = widget.initialRegion;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    widget.onContinue(
      _nameController.text.trim(),
      _selectedRegion,
      _phoneController.text.trim().isEmpty
          ? null
          : _phoneController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 32),

            _StepLabel(step: '3/5', label: 'Хувийн мэдээлэл'),

            const SizedBox(height: 16),

            Text(
              'Таны тухай\nмэдээлэл оруулна уу',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),

            const SizedBox(height: 8),

            Text(
              'Хэрэглэгчийн нэр нь бусад хэрэглэгчдэд харагдана.',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),

            const SizedBox(height: 28),

            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Display name
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Нэр',
                        hintText: 'Таны нэр',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                      textCapitalization: TextCapitalization.words,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Нэр оруулна уу';
                        }
                        if (value.trim().length > 50) {
                          return 'Нэр 50 тэмдэгтээс хэтрэхгүй';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    // Region dropdown
                    DropdownButtonFormField<String>(
                      initialValue: _selectedRegion,
                      decoration: const InputDecoration(
                        labelText: 'Аймаг / Хот',
                        hintText: 'Аймаг сонгоно уу',
                        prefixIcon: Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(),
                      ),
                      items: _aimags
                          .map(
                            (a) => DropdownMenuItem(value: a, child: Text(a)),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setState(() => _selectedRegion = value),
                    ),

                    const SizedBox(height: 20),

                    // Phone number (optional)
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Утасны дугаар (заавал биш)',
                        hintText: '99112233',
                        prefixIcon: Icon(Icons.phone_outlined),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.phone,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return null; // optional
                        }
                        final cleaned = value.replaceAll(RegExp(r'[\s\-]'), '');
                        if (cleaned.length < 8) {
                          return 'Утасны дугаар хэтэрхий богино';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Continue button
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: FilledButton(
                    onPressed: _submit,
                    child: const Text(
                      'ҮРГЭЛЖЛҮҮЛЭХ',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepLabel extends StatelessWidget {
  const _StepLabel({required this.step, required this.label});

  final String step;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            step,
            style: theme.textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onPrimaryContainer,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: theme.textTheme.labelLarge?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
