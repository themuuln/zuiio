import 'package:flutter/material.dart';
import '../../core/theme/design_tokens.dart';
import 'app_spacing.dart';

/// iOS-minimal component themes for Material widgets.
/// Each section shadows a specific Material widget and overrides M3 defaults
/// with iOS design conventions: flat surfaces, hairline separators, warm amber
/// accent, minimal elevation.
///
/// All methods accept a [TamgaColors] parameter so both light and dark themes
/// share a single definition.
abstract final class AppComponents {
  // ── Card ────────────────────────────────────────────────────────────

  static CardThemeData cardTheme(TamgaColors tc) {
    return CardThemeData(
      elevation: 0,
      shadowColor: Colors.transparent,
      color: tc.surfaceContainerLow,
      surfaceTintColor: Colors.transparent,
      clipBehavior: Clip.none,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      margin: EdgeInsets.zero,
    );
  }

  // ── AppBar ──────────────────────────────────────────────────────────

  static AppBarTheme appBarTheme(TamgaColors tc) {
    return AppBarTheme(
      elevation: 0,
      shadowColor: Colors.transparent,
      scrolledUnderElevation: 0,
      backgroundColor: tc.surface,
      foregroundColor: tc.onSurface,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      titleSpacing: AppSpacing.lg,
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: tc.onSurface,
        letterSpacing: -0.41,
      ),
      iconTheme: IconThemeData(color: tc.primary, size: 24),
      actionsIconTheme: IconThemeData(color: tc.primary, size: 24),
    );
  }

  // ── Bottom Navigation ───────────────────────────────────────────────

  static NavigationBarThemeData navigationBarTheme(TamgaColors tc) {
    return NavigationBarThemeData(
      elevation: 0,
      shadowColor: Colors.transparent,
      backgroundColor: tc.surface,
      surfaceTintColor: Colors.transparent,
      indicatorColor: Colors.transparent,
      height: 50,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: tc.primary,
            letterSpacing: 0.07,
          );
        }
        return TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w400,
          color: tc.onSurfaceVariant,
          letterSpacing: 0.07,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return IconThemeData(size: 24, color: tc.primary);
        }
        return IconThemeData(size: 24, color: tc.onSurfaceVariant);
      }),
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      indicatorShape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      overlayColor: WidgetStateProperty.resolveWith((_) => Colors.transparent),
    );
  }

  // ── Drawer ──────────────────────────────────────────────────────────

  static DrawerThemeData drawerTheme(TamgaColors tc) {
    return DrawerThemeData(
      backgroundColor: tc.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: const RoundedRectangleBorder(),
    );
  }

  // ── Tab Bar ─────────────────────────────────────────────────────────

  static TabBarThemeData tabBarTheme(TamgaColors tc) {
    return TabBarThemeData(
      labelColor: tc.primary,
      unselectedLabelColor: tc.onSurfaceVariant,
      labelStyle: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.15,
      ),
      unselectedLabelStyle: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.15,
      ),
      indicatorColor: tc.primary,
      indicatorSize: TabBarIndicatorSize.label,
      dividerColor: tc.outlineVariant,
      dividerHeight: AppSpacing.hairline,
      splashFactory: NoSplash.splashFactory,
      overlayColor: WidgetStateProperty.resolveWith((_) => Colors.transparent),
    );
  }

  // ── Filled Button ───────────────────────────────────────────────────

  static FilledButtonThemeData filledButtonTheme(TamgaColors tc) {
    return FilledButtonThemeData(
      style: FilledButton.styleFrom(
        elevation: 0,
        shadowColor: Colors.transparent,
        backgroundColor: tc.primary,
        foregroundColor: tc.onPrimary,
        disabledBackgroundColor: tc.surfaceContainerHigh,
        disabledForegroundColor: tc.onSurfaceVariant,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xxl,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.41,
        ),
      ),
    );
  }

  // ── Outlined Button ─────────────────────────────────────────────────

  static OutlinedButtonThemeData outlinedButtonTheme(TamgaColors tc) {
    return OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        elevation: 0,
        shadowColor: Colors.transparent,
        backgroundColor: Colors.transparent,
        foregroundColor: tc.primary,
        side: BorderSide(color: tc.outline, width: 1),
        disabledForegroundColor: tc.onSurfaceVariant,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xxl,
          vertical: AppSpacing.md,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.41,
        ),
      ),
    );
  }

  // ── Text Button ─────────────────────────────────────────────────────

  static TextButtonThemeData textButtonTheme(TamgaColors tc) {
    return TextButtonThemeData(
      style: TextButton.styleFrom(
        elevation: 0,
        shadowColor: Colors.transparent,
        backgroundColor: Colors.transparent,
        foregroundColor: tc.primary,
        disabledForegroundColor: tc.onSurfaceVariant,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.41,
        ),
      ),
    );
  }

  // ── Input ───────────────────────────────────────────────────────────

  static InputDecorationTheme inputDecorationTheme(TamgaColors tc) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      borderSide: BorderSide(color: tc.outline),
    );
    final focusedBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      borderSide: BorderSide(color: tc.primary, width: 1.5),
    );
    final errorBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      borderSide: BorderSide(color: tc.error, width: 1),
    );
    final focusedErrorBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      borderSide: BorderSide(color: tc.error, width: 1.5),
    );

    return InputDecorationTheme(
      filled: true,
      fillColor: tc.surfaceContainerHigh,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      border: border,
      enabledBorder: border,
      focusedBorder: focusedBorder,
      errorBorder: errorBorder,
      focusedErrorBorder: focusedErrorBorder,
      disabledBorder: border,
      labelStyle: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: tc.onSurfaceVariant,
        letterSpacing: -0.32,
      ),
      hintStyle: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: tc.onSurfaceVariant,
        letterSpacing: -0.32,
      ),
      floatingLabelStyle: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: tc.primary,
        letterSpacing: -0.08,
      ),
      errorStyle: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: tc.error,
        letterSpacing: -0.08,
      ),
      prefixIconColor: tc.onSurfaceVariant,
      suffixIconColor: tc.onSurfaceVariant,
    );
  }

  // ── Chip ────────────────────────────────────────────────────────────

  static ChipThemeData chipTheme(TamgaColors tc) {
    return ChipThemeData(
      elevation: 0,
      pressElevation: 0,
      shadowColor: Colors.transparent,
      selectedShadowColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      color: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return tc.primaryContainer;
        }
        return tc.surfaceContainerHigh;
      }),
      labelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: tc.onSurface,
        letterSpacing: -0.15,
      ),
      secondaryLabelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: tc.primary,
        letterSpacing: -0.15,
      ),
      side: BorderSide(color: tc.outline, width: 1),
      backgroundColor: Colors.transparent,
      selectedColor: tc.primaryContainer,
      disabledColor: tc.surfaceContainerHigh,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadiusPill),
      ),
    );
  }

  // ── Bottom Sheet ────────────────────────────────────────────────────

  static BottomSheetThemeData bottomSheetTheme(TamgaColors tc) {
    return BottomSheetThemeData(
      backgroundColor: tc.surfaceContainerLow,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shadowColor: Colors.transparent,
      showDragHandle: true,
      dragHandleSize: const Size(36, 5),
      dragHandleColor: tc.onSurfaceVariant,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.cornerRadius),
          topRight: Radius.circular(AppSpacing.cornerRadius),
        ),
      ),
      clipBehavior: Clip.antiAlias,
      modalBackgroundColor: tc.surfaceContainerLow,
      modalElevation: 0,
    );
  }

  // ── Dialog ──────────────────────────────────────────────────────────

  static DialogThemeData dialogTheme(TamgaColors tc) {
    return DialogThemeData(
      backgroundColor: tc.surfaceContainer,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: tc.onSurface,
        letterSpacing: -0.41,
      ),
      contentTextStyle: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: tc.onSurfaceVariant,
        letterSpacing: -0.08,
      ),
    );
  }

  // ── SnackBar ────────────────────────────────────────────────────────

  static SnackBarThemeData snackBarTheme(TamgaColors tc) {
    return SnackBarThemeData(
      backgroundColor: tc.surfaceContainerHigh,
      contentTextStyle: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: tc.onSurface,
        letterSpacing: -0.24,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      behavior: SnackBarBehavior.floating,
      elevation: 0,
      actionTextColor: tc.primary,
    );
  }

  // ── Switch ──────────────────────────────────────────────────────────

  static SwitchThemeData switchTheme(TamgaColors tc) {
    return SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        return tc.surface;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return tc.primary;
        }
        return tc.surfaceContainerHighest;
      }),
      trackOutlineColor: WidgetStateProperty.resolveWith((_) {
        return Colors.transparent;
      }),
      overlayColor: WidgetStateProperty.resolveWith((_) {
        return Colors.transparent;
      }),
    );
  }

  // ── ListTile ────────────────────────────────────────────────────────

  static ListTileThemeData listTileTheme(TamgaColors tc) {
    return ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: 0,
      ),
      minVerticalPadding: AppSpacing.md,
      dense: false,
      shape: const RoundedRectangleBorder(),
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w400,
        color: tc.onSurface,
        letterSpacing: -0.41,
      ),
      subtitleTextStyle: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: tc.onSurfaceVariant,
        letterSpacing: -0.24,
      ),
      leadingAndTrailingTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w400,
        color: tc.onSurface,
        letterSpacing: -0.41,
      ),
      iconColor: tc.primary,
      textColor: tc.onSurface,
      selectedColor: tc.primary,
      tileColor: Colors.transparent,
      selectedTileColor: tc.surfaceContainerHigh,
      horizontalTitleGap: AppSpacing.md,
      minLeadingWidth: 24,
    );
  }

  // ── Divider ─────────────────────────────────────────────────────────

  static DividerThemeData dividerTheme(TamgaColors tc) {
    return DividerThemeData(
      color: tc.outline,
      thickness: AppSpacing.hairline,
      space: 0,
      indent: AppSpacing.lg,
      endIndent: 0,
    );
  }

  // ── Progress Indicator ──────────────────────────────────────────────

  static ProgressIndicatorThemeData progressIndicatorTheme(TamgaColors tc) {
    return ProgressIndicatorThemeData(
      color: tc.primary,
      linearTrackColor: tc.outline,
      circularTrackColor: tc.outline,
    );
  }

  // ── FAB ─────────────────────────────────────────────────────────────

  static FloatingActionButtonThemeData floatingActionButtonTheme(
    TamgaColors tc,
  ) {
    return FloatingActionButtonThemeData(
      backgroundColor: tc.primary,
      foregroundColor: tc.onPrimary,
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      highlightElevation: 0,
      disabledElevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
      ),
      extendedPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xl,
        vertical: AppSpacing.md,
      ),
      extendedTextStyle: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.24,
      ),
      iconSize: 20,
    );
  }

  // ── Icon Button ─────────────────────────────────────────────────────

  static IconButtonThemeData iconButtonTheme(TamgaColors tc) {
    return IconButtonThemeData(
      style: IconButton.styleFrom(
        backgroundColor: Colors.transparent,
        foregroundColor: tc.primary,
        disabledForegroundColor: tc.onSurfaceVariant,
        elevation: 0,
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.all(AppSpacing.sm),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
      ),
    );
  }

  // ── Date Picker ─────────────────────────────────────────────────────

  static DatePickerThemeData datePickerTheme(TamgaColors tc) {
    return DatePickerThemeData(
      backgroundColor: tc.surfaceContainerLow,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      headerBackgroundColor: tc.primary,
      headerForegroundColor: tc.onPrimary,
      dayForegroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return tc.onPrimary;
        }
        return tc.onSurface;
      }),
      dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return tc.primary;
        }
        return Colors.transparent;
      }),
      dayOverlayColor: WidgetStateProperty.resolveWith((_) {
        return Colors.transparent;
      }),
      todayForegroundColor: WidgetStateProperty.resolveWith((_) {
        return tc.primary;
      }),
      todayBackgroundColor: WidgetStateProperty.resolveWith((_) {
        return Colors.transparent;
      }),
      todayBorder: BorderSide(color: tc.primary, width: 1),
      yearForegroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return tc.onPrimary;
        }
        return tc.onSurface;
      }),
      yearBackgroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return tc.primary;
        }
        return Colors.transparent;
      }),
      confirmButtonStyle: TextButton.styleFrom(foregroundColor: tc.primary),
      cancelButtonStyle: TextButton.styleFrom(
        foregroundColor: tc.onSurfaceVariant,
      ),
    );
  }

  // ── Dropdown Menu ───────────────────────────────────────────────────

  static DropdownMenuThemeData dropdownMenuTheme(TamgaColors tc) {
    return DropdownMenuThemeData(
      inputDecorationTheme: inputDecorationTheme(tc),
      menuStyle: MenuStyle(
        backgroundColor: WidgetStateProperty.all(tc.surfaceContainerLow),
        surfaceTintColor: WidgetStateProperty.all(Colors.transparent),
        elevation: WidgetStateProperty.all(0),
        shadowColor: WidgetStateProperty.all(Colors.transparent),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
            side: BorderSide(color: tc.outline, width: 0.5),
          ),
        ),
      ),
    );
  }

  // ── Popup Menu ──────────────────────────────────────────────────────

  static PopupMenuThemeData popupMenuTheme(TamgaColors tc) {
    return PopupMenuThemeData(
      color: tc.surfaceContainerLow,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        side: BorderSide(color: tc.outline, width: 0.5),
      ),
      textStyle: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: tc.onSurface,
        letterSpacing: -0.32,
      ),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: tc.primary,
            letterSpacing: -0.32,
          );
        }
        return TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: tc.onSurface,
          letterSpacing: -0.32,
        );
      }),
    );
  }
}
