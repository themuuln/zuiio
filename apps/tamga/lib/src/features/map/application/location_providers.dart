import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Provider for sums (сум / district) filtered by the selected aimag.
///
/// Queries the `mongolian_locations` reference table in Supabase.
/// Returns an empty list when no aimag is selected or when no sums match.
final filteredSumsProvider =
    FutureProvider.family<List<String>, String?>((ref, aimag) async {
  if (aimag == null || aimag.isEmpty) return [];

  final client = Supabase.instance.client;
  final response = await client
      .from('mongolian_locations')
      .select('sum')
      .eq('aimag', aimag)
      .order('sum', ascending: true);

  return (response as List)
      .map((r) => r['sum'] as String)
      .toList();
});
