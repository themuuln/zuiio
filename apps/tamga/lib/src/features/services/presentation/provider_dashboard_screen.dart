/// Үйлчилгээ үзүүлэгчийн хяналтын самбар.
///
/// Үйлчилгээ үзүүлэгч (гэрэл зурагчин/мал эмч) ирээдүйн болон
/// өнгөрсөн захиалгуудаа харж, захиалгыг дуусгах боломжтой.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../../core/theme/design_tokens.dart';
import '../../../core/widgets/widgets.dart';
import '../application/provider_dashboard_providers.dart';
import '../application/services_providers.dart';
import '../domain/service_booking.dart';
import '../domain/service_booking_status.dart';
import '../domain/service_provider_type.dart';

/// Үйлчилгээ үзүүлэгчийн хяналтын самбар.
class ProviderDashboardScreen extends ConsumerStatefulWidget {
  const ProviderDashboardScreen({super.key});

  @override
  ConsumerState<ProviderDashboardScreen> createState() =>
      _ProviderDashboardScreenState();
}

class _ProviderDashboardScreenState
    extends ConsumerState<ProviderDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);
    final upcomingAsync = ref.watch(providerUpcomingBookingsProvider);
    final pastAsync = ref.watch(providerPastBookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Үйлчилгээний самбар / Provider Dashboard'),
      ),
      body: ListView(
        padding: AppSpacing.screenPadding,
        children: [
          // ── Үйлчилгээ үзүүлэгчийн статус ──
          _buildProviderStatusCard(tc),

          const SizedBox(height: TamgaSpacing.xxl),

          // ── Удахгүй болох захиалгууд / Upcoming ──
          Text(
            'Удахгүй болох / Upcoming Bookings',
            style: TamgaTypography.headline(
              fontSize: 18,
              weight: FontWeight.w700,
              color: tc.onSurface,
            ),
          ),
          const SizedBox(height: TamgaSpacing.md),
          upcomingAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(TamgaSpacing.xxl),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (error, _) => TamgaErrorWidget(
              message: 'Удахгүй болох захиалгуудыг ачаалахад алдаа гарлаа',
              onRetry: () => ref.invalidate(providerUpcomingBookingsProvider),
            ),
            data: (bookings) {
              if (bookings.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: TamgaSpacing.xxl),
                  child: InlineEmptyState(
                    icon: Icons.event_available_outlined,
                    title:
                        'Удахгүй болох захиалга байхгүй / No upcoming bookings',
                  ),
                );
              }
              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: bookings.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: TamgaSpacing.md),
                itemBuilder: (context, index) {
                  return _BookingCard(
                    booking: bookings[index],
                    isUpcoming: true,
                    onComplete: () => _completeBooking(bookings[index]),
                  );
                },
              );
            },
          ),

          const SizedBox(height: TamgaSpacing.xxl),

          // ── Өнгөрсөн захиалгууд / Past ──
          Text(
            'Өнгөрсөн / Past Bookings',
            style: TamgaTypography.headline(
              fontSize: 18,
              weight: FontWeight.w700,
              color: tc.onSurface,
            ),
          ),
          const SizedBox(height: TamgaSpacing.md),
          pastAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(TamgaSpacing.xxl),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (error, _) => TamgaErrorWidget(
              message: 'Өнгөрсөн захиалгуудыг ачаалахад алдаа гарлаа',
              onRetry: () => ref.invalidate(providerPastBookingsProvider),
            ),
            data: (bookings) {
              if (bookings.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: TamgaSpacing.xxl),
                  child: InlineEmptyState(
                    icon: Icons.history_outlined,
                    title: 'Өнгөрсөн захиалга байхгүй / No past bookings',
                  ),
                );
              }
              return ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: bookings.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: TamgaSpacing.md),
                itemBuilder: (context, index) {
                  return _BookingCard(
                    booking: bookings[index],
                    isUpcoming: false,
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildProviderStatusCard(TamgaColors tc) {
    final providerAsync = ref.watch(myServiceProviderProfileProvider);

    return providerAsync.when(
      loading: () => const SkeletonCard(height: 90),
      error: (error, _) => TamgaCard(
        child: Row(
          children: [
            Icon(Icons.error_outline, color: tc.error),
            const SizedBox(width: TamgaSpacing.md),
            Expanded(
              child: Text(
                'Профайл ачаалахад алдаа гарлаа',
                style: TamgaTypography.body(color: tc.error),
              ),
            ),
          ],
        ),
      ),
      data: (provider) {
        if (provider == null) {
          return TamgaCard(
            child: Row(
              children: [
                Icon(Icons.info_outline, color: tc.primary),
                const SizedBox(width: TamgaSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Үйлчилгээ үзүүлэгч биш / Not a Provider',
                        style: TamgaTypography.body(
                          weight: FontWeight.w600,
                          color: tc.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Та үйлчилгээ үзүүлэгчээр бүртгүүлээгүй байна.',
                        style: TamgaTypography.caption1(
                          color: tc.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }

        return TamgaCard(
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: tc.primaryContainer,
                child: Icon(
                  provider.providerType == ServiceProviderType.photographer
                      ? Icons.camera_alt
                      : Icons.local_hospital,
                  color: tc.onPrimaryContainer,
                ),
              ),
              const SizedBox(width: TamgaSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      provider.businessName ?? 'Миний профайл',
                      style: TamgaTypography.body(
                        weight: FontWeight.w600,
                        color: tc.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      provider.providerType.label,
                      style: TamgaTypography.caption1(
                        color: tc.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (provider.isVerified) Icon(Icons.verified, color: tc.tertiary),
            ],
          ),
        );
      },
    );
  }

  Future<void> _completeBooking(ServiceBooking booking) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Захиалгыг дуусгах / Complete Booking'),
        content: Text(
          'Энэ захиалгыг дууссан болгох уу?\n\n'
          'Mark this booking as completed?\n\n'
          'Огноо: ${booking.bookingDate.year}-${booking.bookingDate.month.toString().padLeft(2, '0')}-${booking.bookingDate.day.toString().padLeft(2, '0')}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Цуцлах / Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Дуусгах / Complete'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      // Invalidate to trigger a refresh - we use the FutureProvider.family
      // The actual completion is done in the booking itself via complete()
      final repository = await ref.read(
        serviceBookingRepositoryProvider.future,
      );
      final completed = booking.complete();
      final result = await repository.updateBooking(completed);

      result.when(
        onSuccess: (_) {
          if (mounted) {
            TamgaToast.showSuccess(
              context,
              'Захиалга амжилттай дуусгалаа / Booking completed',
            );
            ref.invalidate(providerUpcomingBookingsProvider);
            ref.invalidate(providerPastBookingsProvider);
          }
        },
        onFailure: (error) {
          if (mounted) {
            TamgaToast.showError(
              context,
              'Алдаа гарлаа / Error: ${error.message}',
            );
          }
        },
      );
    }
  }
}

/// Захиалгын карт.
class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
    required this.isUpcoming,
    this.onComplete,
  });

  final ServiceBooking booking;
  final bool isUpcoming;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    final tc = TamgaColors.of(context);

    final statusColor = switch (booking.status) {
      ServiceBookingStatus.pending => tc.primary,
      ServiceBookingStatus.confirmed => tc.tertiary,
      ServiceBookingStatus.completed => tc.onSurfaceVariant,
      ServiceBookingStatus.cancelled => tc.error,
    };

    final statusLabel = switch (booking.status) {
      ServiceBookingStatus.pending => 'Хүлээгдэж буй / Pending',
      ServiceBookingStatus.confirmed => 'Баталгаажсан / Confirmed',
      ServiceBookingStatus.completed => 'Дууссан / Completed',
      ServiceBookingStatus.cancelled => 'Цуцалсан / Cancelled',
    };

    return TamgaCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Төлөвийн badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  statusLabel,
                  style: TamgaTypography.caption2(
                    weight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
              const Spacer(),
              if (booking.totalAmount != null)
                Text(
                  '${booking.totalAmount}₮',
                  style: TamgaTypography.body(
                    weight: FontWeight.w700,
                    color: tc.primary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: TamgaSpacing.md),

          // Үйлчилгээний төрөл
          Text(
            '${booking.serviceType} (${booking.providerType.label})',
            style: TamgaTypography.body(
              weight: FontWeight.w600,
              color: tc.onSurface,
            ),
          ),
          const SizedBox(height: TamgaSpacing.sm),

          // Огноо
          Row(
            children: [
              Icon(Icons.calendar_today, size: 14, color: tc.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(
                '${booking.bookingDate.year}-${booking.bookingDate.month.toString().padLeft(2, '0')}-${booking.bookingDate.day.toString().padLeft(2, '0')}',
                style: TamgaTypography.caption1(color: tc.onSurfaceVariant),
              ),
              if (booking.locationAimag != null) ...[
                const SizedBox(width: TamgaSpacing.lg),
                Icon(Icons.location_on, size: 14, color: tc.onSurfaceVariant),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    booking.locationAimag!,
                    style: TamgaTypography.caption1(color: tc.onSurfaceVariant),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),

          // Морьдын тоо
          if (booking.horseIds.isNotEmpty) ...[
            const SizedBox(height: TamgaSpacing.sm),
            Row(
              children: [
                Icon(Icons.pets, size: 14, color: tc.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  '${booking.horseIds.length} морь(д)',
                  style: TamgaTypography.caption1(color: tc.onSurfaceVariant),
                ),
              ],
            ),
          ],

          // Тэмдэглэл
          if (booking.notes != null && booking.notes!.isNotEmpty) ...[
            const SizedBox(height: TamgaSpacing.sm),
            Text(
              booking.notes!,
              style: TamgaTypography.caption1(
                color: tc.onSurfaceVariant,
              ).copyWith(fontStyle: FontStyle.italic),
            ),
          ],

          // Дуусгах товч (зөвхөн ирээдүйн захиалгуудад)
          if (isUpcoming && onComplete != null) ...[
            const SizedBox(height: TamgaSpacing.md),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onComplete,
                icon: const Icon(Icons.check_circle_outline),
                label: const Text('Дуусгах / Mark Complete'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
