import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../horses/application/horses_providers.dart';
import '../../health/application/health_providers.dart';
import '../../market/application/market_providers.dart';
import '../domain/herd_analytics.dart';
import '../domain/health_analytics.dart';
import '../domain/financial_analytics.dart';
import '../domain/breeding_analytics.dart';

// ── Supabase client ──────────────────────────────────────────

SupabaseClient get _supabase => Supabase.instance.client;

// ── Client-side providers (existing) ─────────────────────────

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

// ── RPC-based providers (server-side aggregation) ─────────────

/// Эрүүл мэндийн аналитик (RPC).
///
/// Серверийн талд тооцоологдсон эрүүл мэндийн мэдээлэл.
final healthAnalyticsRpcProvider = FutureProvider<Map<String, dynamic>>((
  ref,
) async {
  final userId = _supabase.auth.currentUser?.id;
  if (userId == null) return {};
  final response = await _supabase.rpc(
    'get_health_analytics',
    params: {'p_user_id': userId},
  );
  return Map<String, dynamic>.from(response as Map);
});

/// Санхүүгийн аналитик (RPC).
///
/// Серверийн талд тооцоологдсон санхүүгийн мэдээлэл.
final financialAnalyticsRpcProvider = FutureProvider<Map<String, dynamic>>((
  ref,
) async {
  final userId = _supabase.auth.currentUser?.id;
  if (userId == null) return {};
  final response = await _supabase.rpc(
    'get_financial_analytics',
    params: {'p_user_id': userId},
  );
  return Map<String, dynamic>.from(response as Map);
});

/// Үржүүлгийн аналитик provider (Breeder+ түвшин).
///
/// Серверийн талд тооцоологдсон үржүүлгийн мэдээлэл.
final breedingAnalyticsProvider = FutureProvider<BreedingAnalytics>((
  ref,
) async {
  final userId = _supabase.auth.currentUser?.id;
  if (userId == null) return BreedingAnalytics.empty;
  final response = await _supabase.rpc(
    'get_breeding_analytics',
    params: {'p_user_id': userId},
  );
  return BreedingAnalytics.fromJson(Map<String, dynamic>.from(response as Map));
});
