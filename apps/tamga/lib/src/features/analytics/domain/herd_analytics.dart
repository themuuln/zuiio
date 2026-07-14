import '../../../shared/domain/horse.dart';

/// Насны интервал.
class AgeBucket {
  const AgeBucket({required this.label, required this.count});
  final String label;
  final int count;
}

/// Сүргийн аналитикийн домэйн модел.
///
/// Морьдын мэдээллээр нийт тоо, насны хуваарилалт, хүйсээр
/// хуваарилалт, үүлдэр/өнгөөр бүлэглэлтийг тооцоолно.
class HerdAnalytics {
  HerdAnalytics({required this.horses})
      : totalHorses = horses.length,
        ageDistribution = _computeAgeDistribution(horses),
        genderSplit = _computeGenderSplit(horses),
        breedBreakdown = _computeBreedBreakdown(horses);

  /// Бүх морьдын жагсаалт.
  final List<Horse> horses;

  /// Нийт морины тоо.
  final int totalHorses;

  /// Насны хуваарилалт (bucket label -> тоо).
  final List<AgeBucket> ageDistribution;

  /// Хүйсээр хуваарилалт (HorseGender -> тоо).
  final Map<HorseGender, int> genderSplit;

  /// Үүлдэр/өнгөөр хуваарилалт (coat -> тоо).
  final Map<String, int> breedBreakdown;

  /// Хоосон аналитик.
  static final empty = HerdAnalytics(horses: []);

  // ── Тооцоолол ─────────────────────────────────────────────────

  static List<AgeBucket> _computeAgeDistribution(List<Horse> horses) {
    if (horses.isEmpty) return [];

    final now = DateTime.now();
    final currentYear = now.year;

    final buckets = <String, int>{};
    for (final horse in horses) {
      final age = currentYear - horse.birthYear;
      final label = _ageBucketLabel(age);
      buckets[label] = (buckets[label] ?? 0) + 1;
    }

    // Тогтмол дарааллаар эрэмбэлэх
    final orderedLabels = _orderedAgeBuckets();
    return orderedLabels
        .where((l) => buckets.containsKey(l))
        .map((l) => AgeBucket(label: l, count: buckets[l]!))
        .toList();
  }

  static String _ageBucketLabel(int age) {
    if (age <= 1) return '0-1';
    if (age <= 3) return '2-3';
    if (age <= 5) return '4-5';
    if (age <= 8) return '6-8';
    if (age <= 12) return '9-12';
    return '13+';
  }

  static List<String> _orderedAgeBuckets() {
    return ['0-1', '2-3', '4-5', '6-8', '9-12', '13+'];
  }

  static Map<HorseGender, int> _computeGenderSplit(List<Horse> horses) {
    final split = <HorseGender, int>{
      HorseGender.stallion: 0,
      HorseGender.mare: 0,
      HorseGender.gelding: 0,
      HorseGender.foal: 0,
    };
    for (final horse in horses) {
      split[horse.gender] = (split[horse.gender] ?? 0) + 1;
    }
    return split;
  }

  static Map<String, int> _computeBreedBreakdown(List<Horse> horses) {
    final breakdown = <String, int>{};
    for (final horse in horses) {
      final coat = horse.coat.isEmpty ? 'Тодорхойгүй' : horse.coat;
      breakdown[coat] = (breakdown[coat] ?? 0) + 1;
    }
    return breakdown;
  }
}
