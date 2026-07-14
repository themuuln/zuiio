import 'package:flutter/material.dart';

/// Screen 4: Удам мод — нэг дороос.
///
/// Showcases the pedigree tree feature. If horse was entered, asks for
/// parent names. If skipped, shows a sample tree preview.
class PedigreePreviewPage extends StatefulWidget {
  const PedigreePreviewPage({
    required this.onContinue,
    required this.onSkip,
    this.horseName,
    this.hasHorseEntry = false,
    this.sireName,
    this.damName,
    super.key,
  });

  final void Function(String? sire, String? dam) onContinue;
  final VoidCallback onSkip;
  final String? horseName;
  final bool hasHorseEntry;
  final String? sireName;
  final String? damName;

  @override
  State<PedigreePreviewPage> createState() => _PedigreePreviewPageState();
}

class _PedigreePreviewPageState extends State<PedigreePreviewPage> {
  late final TextEditingController _sireController;
  late final TextEditingController _damController;

  @override
  void initState() {
    super.initState();
    _sireController = TextEditingController(text: widget.sireName ?? '');
    _damController = TextEditingController(text: widget.damName ?? '');
  }

  @override
  void dispose() {
    _sireController.dispose();
    _damController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 32),

          _StepLabel(step: '4/5', label: 'Удам судар'),

          const SizedBox(height: 16),

          Text(
            'Удам мод — нэг дороос',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 28),

          // Pedigree tree preview illustration
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Sample tree visualization
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer.withValues(
                        alpha: 0.2,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      children: [
                        Text('🐎', style: TextStyle(fontSize: 48)),
                        const SizedBox(height: 12),
                        Text(
                          widget.hasHorseEntry
                              ? '«${widget.horseName}»-ны удам мод'
                              : 'Жишээ удам мод',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Mini tree preview
                        _MiniPedigreePreview(
                          centerName: widget.hasHorseEntry
                              ? widget.horseName!
                              : 'Пужийн удам',
                          sireName: _sireController.text.isNotEmpty
                              ? _sireController.text
                              : 'Хан Хүлэг',
                          damName: _damController.text.isNotEmpty
                              ? _damController.text
                              : 'Цагаан Салхи',
                        ),

                        const SizedBox(height: 16),

                        Text(
                          'Хуруугаараа томруулж, гүйлгэж үзэх боломжтой.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Parent name fields (only if horse was entered)
                  if (widget.hasHorseEntry) ...[
                    Text(
                      'Эцэг эхийг нь мэдэх үү?',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _sireController,
                      decoration: const InputDecoration(
                        labelText: 'Эцэг (Азарга)',
                        hintText: 'Эцэгийн нэр',
                        prefixIcon: Icon(Icons.male),
                        border: OutlineInputBorder(),
                      ),
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _damController,
                      decoration: const InputDecoration(
                        labelText: 'Эх (Гүү)',
                        hintText: 'Эхийн нэр',
                        prefixIcon: Icon(Icons.female),
                        border: OutlineInputBorder(),
                      ),
                      textCapitalization: TextCapitalization.words,
                    ),
                  ] else ...[
                    // Sample tree description
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(
                              Icons.account_tree_outlined,
                              color: theme.colorScheme.primary,
                              size: 32,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                'Морь нэмсний дараа удам модыг автоматаар үүсгэж харуулна.',
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Buttons
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: FilledButton(
                      onPressed: () {
                        widget.onContinue(
                          _sireController.text.trim().isEmpty
                              ? null
                              : _sireController.text.trim(),
                          _damController.text.trim().isEmpty
                              ? null
                              : _damController.text.trim(),
                        );
                      },
                      child: const Text(
                        'ҮРГЭЛЖЛҮҮЛЭХ',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: TextButton(
                      onPressed: widget.onSkip,
                      child: Text(
                        'Алгасах',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Mini visual representation of a 2-generation pedigree tree.
class _MiniPedigreePreview extends StatelessWidget {
  const _MiniPedigreePreview({
    required this.centerName,
    required this.sireName,
    required this.damName,
  });

  final String centerName;
  final String sireName;
  final String damName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        // Parents row
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _MiniNode(
              label: sireName,
              color: theme.colorScheme.tertiary,
              icon: '♂',
            ),
            const SizedBox(width: 24),
            _MiniNode(
              label: damName,
              color: theme.colorScheme.secondary,
              icon: '♀',
            ),
          ],
        ),
        // Connecting lines
        SizedBox(
          width: 120,
          child: Row(
            children: [
              const Expanded(child: Divider(thickness: 2)),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
              const Expanded(child: Divider(thickness: 2)),
            ],
          ),
        ),
        // Child (center) node
        _MiniNode(
          label: centerName,
          color: theme.colorScheme.primary,
          icon: '🐎',
          isLarge: true,
        ),
      ],
    );
  }
}

class _MiniNode extends StatelessWidget {
  const _MiniNode({
    required this.label,
    required this.color,
    required this.icon,
    this.isLarge = false,
  });

  final String label;
  final Color color;
  final String icon;
  final bool isLarge;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isLarge ? 20 : 12,
        vertical: isLarge ? 12 : 8,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(isLarge ? 16 : 12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: TextStyle(fontSize: isLarge ? 20 : 14)),
          const SizedBox(width: 6),
          Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w600,
              color: color.withValues(alpha: 0.9),
            ),
          ),
        ],
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
