import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../horses/application/horses_providers.dart';
import '../../health/application/health_providers.dart';
import '../../market/application/market_providers.dart';
import '../domain/herd_analytics.dart';
import '../domain/health_analytics.dart';
import '../domain/financial_analytics.dart';

/// Сүргийн аналитик provider.
///
/// Морьдын мэдээллээр HerdAnalytics-ийг тооцоолно.
final herdAnalyticsProvider = FutureProvider<HerdAnalytics>((ref) async {
  final horses = await ref.watch(horsesProvider.future);
  if (horses.isEmpty) return HerdAnalytics.empty;
  return HerdAnalytics(horses: horses);
});

/// Эрүүл мэндийн аналитик provider.
///
/// Эрүүл мэндийн бүртгэлээр HealthAnalytics-ийг тооцоолно.
final healthAnalyticsProvider = FutureProvider<HealthAnalytics>((ref) async {
  final horsesFuture = ref.watch(horsesProvider.future);
  final repoFuture = ref.watch(healthRepositoryProvider.future);

  final horses = await horsesFuture;
  final repo = await repoFuture;

  final result = await repo.fetchAll();
  final healthLogs = result.getOrThrow();

  return HealthAnalytics(healthLogs: healthLogs, totalHorses: horses.length);
});

/// Санхүүгийн аналитик provider.
///
/// Зах зээлийн заруудаар FinancialAnalytics-ийг тооцоолно.
final financialAnalyticsProvider = FutureProvider<FinancialAnalytics>((
  ref,
) async {
  final listings = await ref.watch(marketListingsProvider.future);
  if (listings.isEmpty) return FinancialAnalytics.empty;
  return FinancialAnalytics(listings: listings);
});
