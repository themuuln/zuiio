import 'package:flutter/material.dart';
import 'package:fluttersdk_wind/fluttersdk_wind.dart' as wind;
import 'package:fluttersdk_wind/fluttersdk_wind.dart' show WindThemeData;

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';
import 'design_tokens.dart';

/// TamgaDesignSystem — единственная точка входа для всей системы дизайна.
///
/// Связывает воедино:
/// 1. **shadcn kit** — тема компонентов (ThemeData, цветовая схема)
/// 2. **Wind** — Tailwind-подобные утилитарные классы
/// 3. **Tamga tokens** — существующие цвета, типографика, отступы
///
/// ## Использование
/// ```dart
/// // В app.dart оберните приложение:
/// TamgaDesignSystem.wrapApp(
///   child: MaterialApp.router(...),
/// )
/// ```
class TamgaDesignSystem {
  TamgaDesignSystem._();

  /// Оборачивает приложение в WindTheme + shadcn overlay.
  static Widget wrapApp({required Widget child}) {
    return wind.WindTheme(data: buildWindThemeData(), child: child);
  }

  /// Создаёт Material ThemeData из токенов Tamga для shadcn и Material виджетов.
  static ThemeData buildThemeData(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final tamgaColors = isDark ? TamgaColors.dark : TamgaColors.light;
    final colorScheme = isDark
        ? AppColors.darkMaterialScheme()
        : AppColors.materialScheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: brightness,
      fontFamily: 'Inter',
      scaffoldBackgroundColor: tamgaColors.surface,
      dividerTheme: DividerThemeData(color: tamgaColors.border, thickness: 1),
      cardTheme: CardThemeData(
        color: tamgaColors.surfaceContainerLow,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: tamgaColors.surfaceContainerLow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cornerRadius),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: tamgaColors.onSurface,
          fontSize: FontSize.headline,
          fontWeight: FontWeight.w600,
        ),
      ),
      textTheme: AppTypography.textTheme(),
      extensions: [tamgaColors],
    );
  }

  /// Создаёт WindThemeData из токенов Tamga.
  static WindThemeData buildWindThemeData() {
    return WindThemeData(
      brightness: Brightness.light,
      colors: {
        'primary': MaterialColor(AppColors.primary.toARGB32(), {
          50: AppColors.primary50,
          100: AppColors.primary100,
          200: AppColors.primary200,
          300: AppColors.primary300,
          400: AppColors.primary400,
          500: AppColors.primary,
          600: AppColors.primary600,
          700: AppColors.primary700,
          800: AppColors.primary800,
          900: AppColors.primary900,
          950: AppColors.primary950,
        }),
        'success': MaterialColor(AppColors.success.toARGB32(), {
          50: AppColors.successLight,
          500: AppColors.success,
        }),
        'warning': MaterialColor(AppColors.warning.toARGB32(), {
          50: AppColors.warningLight,
          500: AppColors.warning,
        }),
        'danger': MaterialColor(AppColors.destructive.toARGB32(), {
          50: AppColors.dangerLight,
          500: AppColors.destructive,
        }),
      },
      fontFamilies: {'sans': 'Inter'},
      fontSizes: {
        'xs': FontSize.caption1,
        'sm': FontSize.footnote,
        'base': FontSize.body,
        'lg': FontSize.callout,
        'xl': FontSize.title3,
        '2xl': FontSize.title2,
        '3xl': FontSize.title1,
        '4xl': FontSize.largeTitle,
      },
      borderRadius: {
        'none': 0,
        'sm': AppSpacing.cornerRadiusSmall,
        'DEFAULT': AppSpacing.cornerRadius,
        'lg': AppSpacing.cornerRadius,
        'full': AppSpacing.cornerRadiusPill,
      },
      baseSpacingUnit: AppSpacing.xs, // 4dp grid
    );
  }
}

/// Расширение для доступа к TamgaColors из контекста темы.
extension TamgaThemeX on ThemeData {
  TamgaColors? get tamgaColors => extension<TamgaColors>();
}
