import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';

import '../theme/design_tokens.dart';

// ── Composition ─────────────────────────────────────────────────────────
//
// TamgaCombobox
// ├── TamgaComboboxChips          (multi-select only)
// │   ├── TamgaComboboxChip
// │   └── TamgaComboboxChipsInput
// ├── TamgaComboboxInput          (single-select / filter input)
// └── TamgaComboboxContent
//     ├── TamgaComboboxEmpty
//     └── TamgaComboboxList
//         └── TamgaComboboxItem
//
// ── Example ─────────────────────────────────────────────────────────────
//
// ```dart
// TamgaCombobox<String>(
//   items: ['Нэр', 'Зүс', 'Төрсөн он'],
//   value: _selected,
//   onSelected: (v) => setState(() => _selected = v),
//   itemBuilder: (item) => TamgaComboboxItem(value: item, child: Text(item)),
//   child: TamgaComboboxInput(placeholder: 'Сонгоно уу...'),
//   content: TamgaComboboxContent(
//     emptyBuilder: (ctx) => const TamgaComboboxEmpty(text: 'Олдсонгүй'),
//     listBuilder: (ctx, items) => TamgaComboboxList(children: items),
//   ),
// );
// ```

/// InheritedNotifier that shares combobox state to children.
class _ComboboxScope<T>
    extends InheritedNotifier<ValueNotifier<_ComboboxState<T>>> {
  const _ComboboxScope({required super.child, required super.notifier});
}

/// Internal mutable state for the combobox.
class _ComboboxState<T> {
  _ComboboxState({
    required this.items,
    required this.selected,
    required this.isOpen,
    required this.query,
    required this.focusedIndex,
    required this.isMultiple,
  });

  final List<T> items;
  final Set<T> selected;
  final bool isOpen;
  final String query;
  final int focusedIndex;
  final bool isMultiple;

  List<T> get filtered {
    if (query.isEmpty) return items;
    return items.where((item) {
      return item.toString().toLowerCase().contains(query.toLowerCase());
    }).toList();
  }
}

// ── Root Widget ─────────────────────────────────────────────────────────

/// A composable autocomplete combobox following shadcn/base-ui patterns.
///
/// Supports single and multi-select, filtering, custom items, and
/// accessibility.
class TamgaCombobox<T> extends StatefulWidget {
  const TamgaCombobox({
    super.key,
    required this.items,
    this.value,
    this.onSelected,
    this.onChanged,
    this.multiple = false,
    this.values = const [],
    this.onValuesChanged,
    this.itemBuilder,
    this.itemToString,
    this.placeholder,
    this.enabled = true,
    this.showClear = false,
    this.autoHighlight = false,
    this.decoration,
    this.popoverConstraints,
    this.maxContentHeight = 300,
    this.filterFn,
    this.onAddNew,
    this.addNewLabel,
    this.searchable = false,
  });

  /// All available items.
  final List<T> items;

  /// Currently selected value (single-select mode).
  final T? value;

  /// Called when a single item is selected or cleared.
  final ValueChanged<T?>? onSelected;

  /// Called when the text input changes (for external state).
  final ValueChanged<String>? onChanged;

  /// Enable multi-select mode.
  final bool multiple;

  /// Currently selected values (multi-select mode).
  final List<T> values;

  /// Called when multi-select values change.
  final ValueChanged<List<T>>? onValuesChanged;

  /// Custom item widget builder. If null, uses `item.toString()`.
  final Widget Function(T item)? itemBuilder;

  /// Convert item to display string for filtering and chips.
  final String Function(T item)? itemToString;

  /// Placeholder text for the input.
  final String? placeholder;

  /// Whether the combobox is interactive.
  final bool enabled;

  /// Show a clear button when a value is selected.
  final bool showClear;

  /// Automatically highlight the first filtered item.
  final bool autoHighlight;

  /// Input decoration override.
  final InputDecoration? decoration;

  /// Constraints for the dropdown popover.
  final BoxConstraints? popoverConstraints;

  /// Maximum height of the dropdown content.
  final double maxContentHeight;

  /// Custom filter function. If null, uses substring match.
  final bool Function(T item, String query)? filterFn;

  /// Called when the user clicks "Add new" with a query that matches no items.
  /// The callback receives the raw query string. After adding, the caller
  /// should update [items] and set [value] / [values] accordingly.
  final ValueChanged<String>? onAddNew;

  /// Label template for the "Add new" row. Use `{query}` as placeholder.
  final String? addNewLabel;

  /// Whether the dropdown is searchable via a filter input.
  /// When true, a search field appears at the top of the dropdown
  /// allowing the user to type and filter items.
  final bool searchable;

  @override
  State<TamgaCombobox<T>> createState() => _TamgaComboboxState<T>();
}

class _TamgaComboboxState<T> extends State<TamgaCombobox<T>> {
  final LayerLink _layerLink = LayerLink();
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();
  OverlayEntry? _overlayEntry;
  bool _isOpen = false;
  int _focusedIndex = -1;
  late List<T> _selectedValues;
  String _query = '';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _selectedValues = List.from(widget.values);
    _updateControllerText();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(TamgaCombobox<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value) _updateControllerText();
    if (widget.values != oldWidget.values) {
      _selectedValues = List.from(widget.values);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _scrollController.dispose();
    _removeOverlay();
    super.dispose();
  }

  // ── Text helpers ──

  String _itemToString(T item) {
    return widget.itemToString?.call(item) ?? item.toString();
  }

  void _updateControllerText() {
    if (!widget.multiple && widget.value != null) {
      _controller.text = _itemToString(widget.value as T);
    } else {
      _controller.text = '';
    }
  }

  // ── Filtering ──

  List<T> get _filteredItems {
    if (_query.isEmpty) return widget.items;
    return widget.items.where((item) {
      if (widget.filterFn != null) return widget.filterFn!(item, _query);
      return _itemToString(item).toLowerCase().contains(_query.toLowerCase());
    }).toList();
  }

  // ── Selection ──

  void _selectItem(T item) {
    if (widget.multiple) {
      final isSelected = _selectedValues.contains(item);
      setState(() {
        if (isSelected) {
          _selectedValues.remove(item);
        } else {
          _selectedValues.add(item);
        }
      });
      widget.onValuesChanged?.call(List.from(_selectedValues));
      // Don't close in multi-select; clear query for next search
      _query = '';
      _controller.clear();
      _updateOverlay();
    } else {
      final isSame = widget.value == item;
      final newValue = isSame ? null : item;
      widget.onSelected?.call(newValue);
      _controller.text = isSame ? '' : _itemToString(item);
      _close();
      _focusNode.unfocus();
    }
  }

  void _clearSelection() {
    if (widget.multiple) {
      _selectedValues.clear();
      widget.onValuesChanged?.call([]);
    } else {
      widget.onSelected?.call(null);
    }
    _controller.clear();
    _query = '';
    _updateOverlay();
  }

  // ── Focus ──

  void _onFocusChange() {
    if (_focusNode.hasFocus && !_isOpen) {
      _open();
    }
  }

  // ── Open / Close ──

  void _open() {
    if (_isOpen || !widget.enabled) return;
    _isOpen = true;
    _focusedIndex = widget.autoHighlight ? 0 : -1;
    _overlayEntry = _buildOverlay();
    Overlay.of(context).insert(_overlayEntry!);
  }

  void _close() {
    if (!_isOpen) return;
    _isOpen = false;
    _query = '';
    _controller.clear();
    _updateControllerText();
    _removeOverlay();
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _updateOverlay() {
    _overlayEntry?.markNeedsBuild();
  }

  // ── Keyboard ──

  int get _maxFocusIndex {
    final filtered = _filteredItems;
    final canAdd =
        widget.onAddNew != null && _query.isNotEmpty && filtered.isEmpty;
    return filtered.length + (canAdd ? 0 : -1); // last selectable index
  }

  KeyEventResult _onKeyEvent(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final filtered = _filteredItems;
    final canAdd =
        widget.onAddNew != null && _query.isNotEmpty && filtered.isEmpty;
    switch (event.logicalKey) {
      case LogicalKeyboardKey.arrowDown:
        if (!_isOpen) {
          _open();
          return KeyEventResult.handled;
        }
        setState(() {
          _focusedIndex = (_focusedIndex + 1).clamp(0, _maxFocusIndex);
        });
        _scrollToFocused();
        _updateOverlay();
        return KeyEventResult.handled;
      case LogicalKeyboardKey.arrowUp:
        setState(() {
          _focusedIndex = (_focusedIndex - 1).clamp(0, _maxFocusIndex);
        });
        _scrollToFocused();
        _updateOverlay();
        return KeyEventResult.handled;
      case LogicalKeyboardKey.enter:
        if (_isOpen && _focusedIndex >= 0) {
          // "Add new" row is at index == filtered.length
          if (canAdd && _focusedIndex == filtered.length) {
            widget.onAddNew!(_query);
            _close();
            _focusNode.unfocus();
            return KeyEventResult.handled;
          }
          if (_focusedIndex < filtered.length) {
            _selectItem(filtered[_focusedIndex]);
            return KeyEventResult.handled;
          }
        }
        return KeyEventResult.ignored;
      case LogicalKeyboardKey.escape:
        _close();
        _focusNode.unfocus();
        return KeyEventResult.handled;
      default:
        return KeyEventResult.ignored;
    }
  }

  void _scrollToFocused() {
    if (_focusedIndex < 0) return;
    final targetOffset = _focusedIndex * 44.0; // approximate item height
    if (targetOffset < _scrollController.offset) {
      _scrollController.jumpTo(targetOffset);
    } else if (targetOffset + 44 >
        _scrollController.offset + widget.maxContentHeight) {
      _scrollController.jumpTo(targetOffset + 44 - widget.maxContentHeight);
    }
  }

  // ── Overlay ──

  OverlayEntry _buildOverlay() {
    return OverlayEntry(
      builder: (context) => _ComboboxPopover<T>(
        layerLink: _layerLink,
        onClose: _close,
        maxHeight: widget.maxContentHeight,
        constraints: widget.popoverConstraints,
        child: _ComboboxScope<T>(
          notifier: ValueNotifier(
            _ComboboxState<T>(
              items: widget.items,
              selected: Set.from(
                widget.multiple
                    ? _selectedValues
                    : (widget.value != null ? [widget.value as T] : []),
              ),
              isOpen: _isOpen,
              query: _query,
              focusedIndex: _focusedIndex,
              isMultiple: widget.multiple,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Content slot — render via builder
              if (widget.multiple || widget.searchable)
                Padding(
                  padding: const EdgeInsets.all(TamgaSpacing.sm),
                  child: _buildFilterInput(),
                ),
              ConstrainedBox(
                constraints: BoxConstraints(maxHeight: widget.maxContentHeight),
                child: _buildItemList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterInput() {
    return TextField(
      controller: _controller,
      autofocus: true,
      decoration: InputDecoration(
        hintText:
            widget.placeholder ??
            AppLocalizations.of(context)!.comboboxSearchHint,
        hintStyle: TamgaTypography.body(
          color: TamgaColors.of(context).onSurfaceVariant,
        ),
        prefixIcon: Icon(
          Icons.search,
          size: 18,
          color: TamgaColors.of(context).onSurfaceVariant,
        ),
        isDense: true,
        border: InputBorder.none,
      ),
      onChanged: (q) {
        _query = q;
        widget.onChanged?.call(q);
        setState(() => _focusedIndex = widget.autoHighlight ? 0 : -1);
        _updateOverlay();
      },
    );
  }

  Widget _buildItemList() {
    final filtered = _filteredItems;
    final colors = TamgaColors.of(context);
    final canAdd =
        widget.onAddNew != null && _query.isNotEmpty && filtered.isEmpty;

    if (filtered.isEmpty && !canAdd) {
      return Padding(
        padding: const EdgeInsets.all(TamgaSpacing.lg),
        child: Center(
          child: Text(
            AppLocalizations.of(context)!.comboboxEmptyText,
            style: TamgaTypography.body(color: colors.onSurfaceVariant),
          ),
        ),
      );
    }

    final itemCount = filtered.length + (canAdd ? 1 : 0);

    return ListView.builder(
      controller: _scrollController,
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(vertical: TamgaSpacing.xs),
      itemCount: itemCount,
      itemBuilder: (ctx, i) {
        // "Add new" row at the end
        if (canAdd && i == filtered.length) {
          final label =
              (widget.addNewLabel ?? AppLocalizations.of(ctx)!.comboboxAddNew)
                  .replaceAll('{query}', _query);
          return _ComboboxAddNewRow(
            label: label,
            isFocused: i == _focusedIndex,
            onTap: () {
              widget.onAddNew!(_query);
              _close();
              _focusNode.unfocus();
            },
          );
        }

        final item = filtered[i];
        final isSelected = widget.multiple
            ? _selectedValues.contains(item)
            : widget.value == item;
        final isFocused = i == _focusedIndex;

        return _ComboboxItemWidget<T>(
          item: item,
          isSelected: isSelected,
          isFocused: isFocused,
          isMultiple: widget.multiple,
          onTap: () => _selectItem(item),
          child: widget.itemBuilder != null
              ? widget.itemBuilder!(item)
              : Text(
                  _itemToString(item),
                  style: TamgaTypography.body(color: colors.onSurface),
                  overflow: TextOverflow.ellipsis,
                ),
        );
      },
    );
  }

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final hasValue = widget.multiple
        ? _selectedValues.isNotEmpty
        : widget.value != null;

    return CompositedTransformTarget(
      link: _layerLink,
      child: GestureDetector(
        onTap: widget.enabled
            ? () {
                if (_isOpen) {
                  _close();
                } else {
                  _focusNode.requestFocus();
                }
              }
            : null,
        child: Focus(
          focusNode: _focusNode,
          onKeyEvent: _onKeyEvent,
          child: widget.multiple
              ? _buildChipsInput(colors, hasValue)
              : _buildSingleInput(colors, hasValue),
        ),
      ),
    );
  }

  // ── Single-select input ──

  Widget _buildSingleInput(TamgaColors colors, bool hasValue) {
    return TextField(
      controller: _controller,
      focusNode: _focusNode,
      enabled: widget.enabled,
      readOnly: true,
      onTap: widget.enabled
          ? () {
              if (_isOpen) {
                _close();
              } else {
                _open();
              }
            }
          : null,
      style: TamgaTypography.body(color: colors.onSurface),
      decoration:
          (widget.decoration ??
                  InputDecoration(
                    hintText:
                        widget.placeholder ??
                        AppLocalizations.of(context)!.comboboxSearchHint,
                    hintStyle: TamgaTypography.body(
                      color: colors.onSurfaceVariant,
                    ),
                    filled: true,
                    fillColor: colors.surfaceContainerHigh,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: TamgaSpacing.md,
                      vertical: TamgaSpacing.sm,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(color: colors.outline),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(color: colors.outline),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(color: colors.primary, width: 1.5),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(
                        color: colors.outline.withAlpha(128),
                      ),
                    ),
                    suffixIcon: _buildSuffixIcon(colors, hasValue),
                  ))
              .copyWith(enabled: widget.enabled),
    );
  }

  // ── Multi-select chips input ──

  Widget _buildChipsInput(TamgaColors colors, bool hasValue) {
    return InputDecorator(
      decoration:
          (widget.decoration ??
                  InputDecoration(
                    hintText: _selectedValues.isEmpty
                        ? (widget.placeholder ??
                              AppLocalizations.of(context)!.comboboxSearchHint)
                        : null,
                    hintStyle: TamgaTypography.body(
                      color: colors.onSurfaceVariant,
                    ),
                    filled: true,
                    fillColor: colors.surfaceContainerHigh,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: TamgaSpacing.sm,
                      vertical: TamgaSpacing.xs,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(color: colors.outline),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(color: colors.outline),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        TamgaSpacing.cornerRadius,
                      ),
                      borderSide: BorderSide(color: colors.primary, width: 1.5),
                    ),
                  ))
              .copyWith(enabled: widget.enabled),
      child: Wrap(
        spacing: TamgaSpacing.xs,
        runSpacing: TamgaSpacing.xs,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          ..._selectedValues.map(
            (item) => _Chip(
              label: _itemToString(item),
              onRemove: widget.enabled ? () => _selectItem(item) : null,
            ),
          ),
          ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 80, maxHeight: 32),
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              enabled: widget.enabled,
              style: TamgaTypography.body(color: colors.onSurface),
              decoration: InputDecoration(
                hintText: _selectedValues.isEmpty
                    ? (widget.placeholder ??
                          AppLocalizations.of(context)!.comboboxSearchHint)
                    : '',
                hintStyle: TamgaTypography.body(color: colors.onSurfaceVariant),
                isDense: true,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: TamgaSpacing.xs,
                  vertical: TamgaSpacing.xs,
                ),
              ),
              onChanged: (q) {
                _query = q;
                widget.onChanged?.call(q);
                if (q.isNotEmpty && !_isOpen) _open();
                if (q.isEmpty && _isOpen) _close();
                setState(() => _focusedIndex = widget.autoHighlight ? 0 : -1);
                _updateOverlay();
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Suffix icon (clear + chevron) ──

  Widget? _buildSuffixIcon(TamgaColors colors, bool hasValue) {
    if (widget.showClear && hasValue) {
      return IconButton(
        icon: Icon(Icons.close, size: 18, color: colors.onSurfaceVariant),
        onPressed: _clearSelection,
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
      );
    }
    return Padding(
      padding: const EdgeInsets.only(right: TamgaSpacing.sm),
      child: Icon(
        _isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
        size: 20,
        color: colors.onSurfaceVariant,
      ),
    );
  }
}

// ── Popover ─────────────────────────────────────────────────────────────

class _ComboboxPopover<T> extends StatelessWidget {
  const _ComboboxPopover({
    required this.layerLink,
    required this.onClose,
    required this.child,
    this.maxHeight = 300,
    this.constraints,
  });

  final LayerLink layerLink;
  final VoidCallback onClose;
  final Widget child;
  final double maxHeight;
  final BoxConstraints? constraints;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Stack(
      children: [
        // Tap outside to close
        Positioned.fill(
          child: GestureDetector(
            onTap: onClose,
            behavior: HitTestBehavior.translucent,
          ),
        ),
        // Dropdown
        Positioned(
          width: constraints?.maxWidth ?? double.infinity,
          child: CompositedTransformFollower(
            link: layerLink,
            showWhenUnlinked: false,
            offset: const Offset(0, 4),
            child: Material(
              elevation: 4,
              borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadius),
              color: colors.surface,
              shadowColor: colors.shadow,
              child: Container(
                constraints: BoxConstraints(maxHeight: maxHeight),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadius,
                  ),
                  border: Border.all(color: colors.outline),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(
                    TamgaSpacing.cornerRadius,
                  ),
                  child: child,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Item Widget ─────────────────────────────────────────────────────────

class _ComboboxItemWidget<T> extends StatefulWidget {
  const _ComboboxItemWidget({
    required this.item,
    required this.isSelected,
    required this.isFocused,
    required this.isMultiple,
    required this.onTap,
    required this.child,
  });

  final T item;
  final bool isSelected;
  final bool isFocused;
  final bool isMultiple;
  final VoidCallback onTap;
  final Widget child;

  @override
  State<_ComboboxItemWidget<T>> createState() => _ComboboxItemWidgetState<T>();
}

class _ComboboxItemWidgetState<T> extends State<_ComboboxItemWidget<T>> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isHighlighted = widget.isFocused || _isHovered;

    Color bgColor;
    if (widget.isSelected) {
      bgColor = colors.primaryContainer;
    } else if (isHighlighted) {
      bgColor = colors.surfaceContainerHigh;
    } else {
      bgColor = colors.surface;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: TamgaSpacing.md),
          color: bgColor,
          child: Row(
            children: [
              if (widget.isMultiple)
                Padding(
                  padding: const EdgeInsets.only(right: TamgaSpacing.sm),
                  child: Icon(
                    widget.isSelected
                        ? Icons.check_box
                        : Icons.check_box_outline_blank,
                    size: 20,
                    color: widget.isSelected
                        ? colors.primary
                        : colors.onSurfaceVariant,
                  ),
                ),
              Expanded(child: widget.child),
              if (!widget.isMultiple && widget.isSelected)
                Icon(Icons.check, size: 18, color: colors.primary),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Chip ────────────────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  const _Chip({required this.label, this.onRemove});

  final String label;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);

    return Container(
      height: 28,
      padding: const EdgeInsets.symmetric(horizontal: TamgaSpacing.sm),
      decoration: BoxDecoration(
        color: colors.primaryContainer,
        borderRadius: BorderRadius.circular(TamgaSpacing.cornerRadiusSmall),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TamgaTypography.caption1(color: colors.onPrimaryContainer),
          ),
          if (onRemove != null) ...[
            const SizedBox(width: TamgaSpacing.xs),
            GestureDetector(
              onTap: onRemove,
              child: Icon(
                Icons.close,
                size: 14,
                color: colors.onPrimaryContainer,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Add new row ─────────────────────────────────────────────────────────

class _ComboboxAddNewRow extends StatefulWidget {
  const _ComboboxAddNewRow({
    required this.label,
    required this.isFocused,
    required this.onTap,
  });

  final String label;
  final bool isFocused;
  final VoidCallback onTap;

  @override
  State<_ComboboxAddNewRow> createState() => _ComboboxAddNewRowState();
}

class _ComboboxAddNewRowState extends State<_ComboboxAddNewRow> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final isHighlighted = widget.isFocused || _isHovered;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: TamgaSpacing.md),
          color: isHighlighted ? colors.surfaceContainerHigh : colors.surface,
          child: Row(
            children: [
              Icon(Icons.add, size: 18, color: colors.primary),
              const SizedBox(width: TamgaSpacing.sm),
              Expanded(
                child: Text(
                  widget.label,
                  style: TamgaTypography.body(
                    color: colors.primary,
                    weight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Public sub-widgets (composable API) ─────────────────────────────────

/// Empty state shown when no items match the filter.
class TamgaComboboxEmpty extends StatelessWidget {
  const TamgaComboboxEmpty({super.key, this.text});

  final String? text;

  @override
  Widget build(BuildContext context) {
    final effectiveText =
        text ?? AppLocalizations.of(context)!.comboboxEmptyText;
    return Padding(
      padding: const EdgeInsets.all(TamgaSpacing.lg),
      child: Center(
        child: Text(
          effectiveText,
          style: TamgaTypography.body(
            color: TamgaColors.of(context).onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

/// A single selectable item in the combobox dropdown.
class TamgaComboboxItem<T> extends StatelessWidget {
  const TamgaComboboxItem({
    super.key,
    required this.value,
    required this.child,
  });

  final T value;
  final Widget child;

  @override
  Widget build(BuildContext context) => child;
}
