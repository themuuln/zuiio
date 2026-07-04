import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../core/theme/design_tokens.dart';
import 'app_colors.dart';
import 'app_components.dart';
import 'app_typography.dart';

/// Tamga design system — iOS minimal theme.
/// Transforms Material 3 widgets into an iOS-inspired interface:
/// flat surfaces, hairline separators, system fonts, warm amber accent,
/// generous whitespace. No elevation, no shadows, no visual noise.
///
/// ## Usage
/// ```dart
/// MaterialApp(
///   theme: AppTheme.light(),
///   darkTheme: AppTheme.dark(),
///   themeMode: ThemeMode.system,
/// );
/// ```
abstract final class AppTheme {
  /// Creates the full light theme with our oklch-derived design tokens.
  static ThemeData light() {
    final colorScheme = AppColors.materialScheme();
    final tc = TamgaColors.light;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: tc.surface,
      extensions: const [TamgaColors.light],
      textTheme: AppTypography.googleFontsTextTheme(),
      primaryTextTheme: AppTypography.googleFontsTextTheme(),
      appBarTheme: AppComponents.appBarTheme(tc),
      navigationBarTheme: AppComponents.navigationBarTheme(tc),
      tabBarTheme: AppComponents.tabBarTheme(tc),
      cardTheme: AppComponents.cardTheme(tc),
      filledButtonTheme: AppComponents.filledButtonTheme(tc),
      outlinedButtonTheme: AppComponents.outlinedButtonTheme(tc),
      textButtonTheme: AppComponents.textButtonTheme(tc),
      inputDecorationTheme: AppComponents.inputDecorationTheme(tc),
      chipTheme: AppComponents.chipTheme(tc),
      bottomSheetTheme: AppComponents.bottomSheetTheme(tc),
      dialogTheme: AppComponents.dialogTheme(tc),
      snackBarTheme: AppComponents.snackBarTheme(tc),
      switchTheme: AppComponents.switchTheme(tc),
      listTileTheme: AppComponents.listTileTheme(tc),
      dividerTheme: AppComponents.dividerTheme(tc),
      dividerColor: tc.outline,
      progressIndicatorTheme: AppComponents.progressIndicatorTheme(tc),
      floatingActionButtonTheme: AppComponents.floatingActionButtonTheme(tc),
      iconButtonTheme: AppComponents.iconButtonTheme(tc),
      datePickerTheme: AppComponents.datePickerTheme(tc),
      dropdownMenuTheme: AppComponents.dropdownMenuTheme(tc),
      popupMenuTheme: AppComponents.popupMenuTheme(tc),
      drawerTheme: AppComponents.drawerTheme(tc),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      focusColor: Colors.transparent,
      canvasColor: tc.surface,
      disabledColor: tc.onSurfaceVariant,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  /// Creates the full dark theme with our oklch-derived design tokens.
  static ThemeData dark() {
    final colorScheme = AppColors.darkMaterialScheme();
    final tc = TamgaColors.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: tc.surfaceContainer,
      extensions: const [TamgaColors.dark],
      textTheme: AppTypography.googleFontsTextTheme().apply(
        bodyColor: tc.onSurface,
        displayColor: tc.onSurface,
      ),
      primaryTextTheme: AppTypography.googleFontsTextTheme().apply(
        bodyColor: tc.onSurface,
        displayColor: tc.onSurface,
      ),
      appBarTheme: AppComponents.appBarTheme(tc),
      navigationBarTheme: AppComponents.navigationBarTheme(tc),
      tabBarTheme: AppComponents.tabBarTheme(tc),
      cardTheme: AppComponents.cardTheme(tc),
      filledButtonTheme: AppComponents.filledButtonTheme(tc),
      outlinedButtonTheme: AppComponents.outlinedButtonTheme(tc),
      textButtonTheme: AppComponents.textButtonTheme(tc),
      inputDecorationTheme: AppComponents.inputDecorationTheme(tc),
      chipTheme: AppComponents.chipTheme(tc),
      bottomSheetTheme: AppComponents.bottomSheetTheme(tc),
      dialogTheme: AppComponents.dialogTheme(tc),
      snackBarTheme: AppComponents.snackBarTheme(tc),
      switchTheme: AppComponents.switchTheme(tc),
      listTileTheme: AppComponents.listTileTheme(tc),
      dividerTheme: AppComponents.dividerTheme(tc),
      dividerColor: tc.outline,
      progressIndicatorTheme: AppComponents.progressIndicatorTheme(tc),
      floatingActionButtonTheme: AppComponents.floatingActionButtonTheme(tc),
      iconButtonTheme: AppComponents.iconButtonTheme(tc),
      datePickerTheme: AppComponents.datePickerTheme(tc),
      dropdownMenuTheme: AppComponents.dropdownMenuTheme(tc),
      popupMenuTheme: AppComponents.popupMenuTheme(tc),
      drawerTheme: AppComponents.drawerTheme(tc),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      focusColor: Colors.transparent,
      canvasColor: tc.surface,
      disabledColor: tc.onSurfaceVariant,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}
