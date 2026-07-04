import 'package:flutter/material.dart';
import '../theme/design_tokens.dart';

/// Circular avatar for users or horses.
///
/// Displays an image, initials, or a placeholder icon.
///
/// ## Usage
/// ```dart
/// TamgaAvatar(name: 'Temuulen', imageUrl: user.avatarUrl, size: 48)
/// TamgaAvatar(name: 'Mor', size: 32, placeholder: Icons.pets)
/// ```
class TamgaAvatar extends StatelessWidget {
  const TamgaAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 48,
    this.placeholder,
    this.backgroundColor,
    this.textColor,
    this.border,
  });

  final String name;
  final String? imageUrl;
  final double size;
  final IconData? placeholder;
  final Color? backgroundColor;
  final Color? textColor;
  final BoxBorder? border;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final bgColor = backgroundColor ?? colors.primary.withValues(alpha: 0.15);
    final fgColor = textColor ?? colors.primary;

    final fontSize = size * 0.38;
    final iconSize = size * 0.45;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: bgColor,
        border: border,
        image: imageUrl != null
            ? DecorationImage(image: NetworkImage(imageUrl!), fit: BoxFit.cover)
            : null,
      ),
      child: imageUrl != null
          ? null // image covers the container
          : Center(
              child: placeholder != null
                  ? Icon(placeholder, size: iconSize, color: fgColor)
                  : Text(
                      _initials,
                      style: TextStyle(
                        fontSize: fontSize,
                        fontWeight: FontWeight.w600,
                        color: fgColor,
                      ),
                    ),
            ),
    );
  }
}

/// Stacked avatars for co-ownership or group display.
class TamgaAvatarStack extends StatelessWidget {
  const TamgaAvatarStack({
    super.key,
    required this.avatars,
    this.size = 32,
    this.maxVisible = 3,
    this.spacing = -8,
  });

  final List<TamgaAvatar> avatars;
  final double size;
  final int maxVisible;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final colors = TamgaColors.of(context);
    final visible = avatars.take(maxVisible).toList();
    final remaining = avatars.length - maxVisible;

    return SizedBox(
      width: size + (visible.length - 1) * (size + spacing).abs(),
      height: size,
      child: Stack(
        children: [
          for (var i = 0; i < visible.length; i++)
            Positioned(
              left: i * (size + spacing).abs(),
              child: TamgaAvatar(
                name: visible[i].name,
                imageUrl: visible[i].imageUrl,
                size: size,
                border: Border.all(color: colors.surface, width: 2),
              ),
            ),
          if (remaining > 0)
            Positioned(
              left: visible.length * (size + spacing).abs(),
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: colors.surfaceContainerHigh,
                  border: Border.all(color: colors.surface, width: 2),
                ),
                child: Center(
                  child: Text(
                    '+$remaining',
                    style: TextStyle(
                      fontSize: size * 0.32,
                      fontWeight: FontWeight.w600,
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
