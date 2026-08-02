import 'package:flutter/material.dart';

import 'package:tamga/l10n/generated/app_localizations.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/tamga_badge.dart';
import '../../../../core/widgets/tamga_status_chip.dart';
import '../../domain/market_listing.dart';

/// Badge widget for VIP, Promoted, and Verified listings.
///
/// Shows a styled badge with appropriate color and icon based on
/// the listing's boost/VIP/verification status.
class ListingBadge extends StatelessWidget {
  const ListingBadge({required this.listing, super.key, this.compact = false});

  final MarketListing listing;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Lost-report conflict is a safety signal — highest priority.
    if (listing.lostReportConflict) {
      return _BadgeChip(
        label: AppLocalizations.of(context)!.marketLostReportConflictTitle,
        bgColor: theme.colorScheme.errorContainer,
        fgColor: theme.colorScheme.onErrorContainer,
        icon: Icons.warning_amber_rounded,
        compact: compact,
      );
    }

    // Determine badge to show (VIP > Boost > Verified)
    if (listing.isVip) {
      return _BadgeChip(
        label: listing.vipLevel.label,
        bgColor: theme.colorScheme.primaryContainer,
        fgColor: theme.colorScheme.onPrimaryContainer,
        icon: Icons.workspace_premium,
        compact: compact,
      );
    }
    if (listing.isBoosted) {
      return _BadgeChip(
        label: listing.boostLevel.label,
        bgColor: theme.colorScheme.tertiaryContainer,
        fgColor: theme.colorScheme.onTertiaryContainer,
        icon: Icons.rocket_launch,
        compact: compact,
      );
    }
    if (listing.isSellerVerified) {
      return _BadgeChip(
        label: 'Баталгаатай',
        bgColor: theme.colorScheme.tertiary.withValues(alpha: 0.15),
        fgColor: theme.colorScheme.tertiary,
        icon: Icons.verified_outlined,
        compact: compact,
      );
    }
    return const SizedBox.shrink();
  }
}

/// Seller badge widget (Дэлгүүр badge).
class SellerBadge extends StatelessWidget {
  const SellerBadge({required this.listing, super.key, this.compact = false});

  final MarketListing listing;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (!listing.hasSellerBadge) return const SizedBox.shrink();

    return _BadgeChip(
      label: listing.sellerBadge.label,
      bgColor: theme.colorScheme.secondaryContainer,
      fgColor: theme.colorScheme.onSecondaryContainer,
      icon: Icons.store,
      compact: compact,
    );
  }
}

class _BadgeChip extends StatelessWidget {
  const _BadgeChip({
    required this.label,
    required this.bgColor,
    required this.fgColor,
    required this.icon,
    this.compact = false,
  });

  final String label;
  final Color bgColor;
  final Color fgColor;
  final IconData icon;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return TamgaColorChip(
      label: label,
      color: fgColor,
      size: compact ? TamgaBadgeSize.small : TamgaBadgeSize.medium,
      icon: icon,
    );
  }
}

/// Compact badge overlay for listing cards (positioned top-right).
class ListingBadgeOverlay extends StatelessWidget {
  const ListingBadgeOverlay({required this.listing, super.key});

  final MarketListing listing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Only show if listing has any badge
    if (!listing.isVip &&
        !listing.isBoosted &&
        !listing.hasSellerBadge &&
        !listing.isSellerVerified &&
        !listing.lostReportConflict) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: AppSpacing.sm,
      right: AppSpacing.sm,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (listing.lostReportConflict)
            _BadgeChip(
              label: AppLocalizations.of(
                context,
              )!.marketLostReportConflictTitle,
              bgColor: theme.colorScheme.errorContainer,
              fgColor: theme.colorScheme.onErrorContainer,
              icon: Icons.warning_amber_rounded,
              compact: true,
            ),
          if (listing.lostReportConflict &&
              (listing.isVip || listing.isBoosted))
            const SizedBox(height: AppSpacing.xs),
          if (listing.isVip)
            _BadgeChip(
              label: listing.vipLevel.label,
              bgColor: theme.colorScheme.primaryContainer,
              fgColor: theme.colorScheme.onPrimaryContainer,
              icon: Icons.workspace_premium,
              compact: true,
            ),
          if (listing.isVip && listing.isBoosted)
            const SizedBox(height: AppSpacing.xs),
          if (listing.isBoosted)
            _BadgeChip(
              label: listing.boostLevel.label,
              bgColor: theme.colorScheme.tertiaryContainer,
              fgColor: theme.colorScheme.onTertiaryContainer,
              icon: Icons.rocket_launch,
              compact: true,
            ),
          if ((listing.isVip || listing.isBoosted) && listing.hasSellerBadge)
            const SizedBox(height: AppSpacing.xs),
          if (listing.hasSellerBadge)
            _BadgeChip(
              label: listing.sellerBadge.label,
              bgColor: theme.colorScheme.secondaryContainer,
              fgColor: theme.colorScheme.onSecondaryContainer,
              icon: Icons.store,
              compact: true,
            ),
          if (!listing.isVip &&
              !listing.isBoosted &&
              !listing.hasSellerBadge &&
              listing.isSellerVerified)
            _BadgeChip(
              label: 'Баталгаатай',
              bgColor: theme.colorScheme.tertiary.withValues(alpha: 0.15),
              fgColor: theme.colorScheme.tertiary,
              icon: Icons.verified_outlined,
              compact: true,
            ),
        ],
      ),
    );
  }
}
