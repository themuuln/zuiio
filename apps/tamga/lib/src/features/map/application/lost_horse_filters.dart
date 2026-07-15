import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/animal_enums.dart';
import '../domain/map_enums.dart';
import '../domain/lost_horse_report.dart';
import 'lost_horse_providers.dart';

/// Filter state for the ActiveReportsScreen.
///
/// Each field is nullable; null means "no filter" (show all).
/// Filters combine with AND logic.
class LostHorseFilterState {
  const LostHorseFilterState({
    this.aimag,
    this.animalType,
    this.coatColor,
    this.status,
  });

  /// Filter by aimag (locationAimag).
  final String? aimag;

  /// Filter by animal type.
  final AnimalType? animalType;

  /// Filter by coat color.
  final String? coatColor;

  /// Filter by report status.
  final LostHorseStatus? status;

  /// Whether any filter is active.
  bool get hasAnyFilter =>
      aimag != null ||
      animalType != null ||
      coatColor != null ||
      status != null;

  /// Number of active filters.
  int get activeCount =>
      (aimag != null ? 1 : 0) +
      (animalType != null ? 1 : 0) +
      (coatColor != null ? 1 : 0) +
      (status != null ? 1 : 0);

  LostHorseFilterState copyWith({
    String? aimag,
    AnimalType? animalType,
    String? coatColor,
    LostHorseStatus? status,
    bool clearAimag = false,
    bool clearAnimalType = false,
    bool clearCoatColor = false,
    bool clearStatus = false,
  }) {
    return LostHorseFilterState(
      aimag: clearAimag ? null : aimag ?? this.aimag,
      animalType: clearAnimalType ? null : animalType ?? this.animalType,
      coatColor: clearCoatColor ? null : coatColor ?? this.coatColor,
      status: clearStatus ? null : status ?? this.status,
    );
  }

  /// Returns a new state with all filters cleared.
  LostHorseFilterState get cleared => const LostHorseFilterState();

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LostHorseFilterState &&
          runtimeType == other.runtimeType &&
          aimag == other.aimag &&
          animalType == other.animalType &&
          coatColor == other.coatColor &&
          status == other.status;

  @override
  int get hashCode =>
      aimag.hashCode ^
      animalType.hashCode ^
      coatColor.hashCode ^
      status.hashCode;
}

/// [StateNotifier] managing the current filter state.
class LostHorseFilterNotifier extends StateNotifier<LostHorseFilterState> {
  LostHorseFilterNotifier() : super(const LostHorseFilterState());

  void setAimag(String? value) {
    state = state.copyWith(aimag: value, clearAimag: value == null);
  }

  void setAnimalType(AnimalType? value) {
    state = state.copyWith(animalType: value, clearAnimalType: value == null);
  }

  void setCoatColor(String? value) {
    state = state.copyWith(coatColor: value, clearCoatColor: value == null);
  }

  void setStatus(LostHorseStatus? value) {
    state = state.copyWith(status: value, clearStatus: value == null);
  }

  void clearAll() {
    state = const LostHorseFilterState();
  }
}

/// Provider for filter state.
final lostHorseFilterProvider =
    StateNotifierProvider<LostHorseFilterNotifier, LostHorseFilterState>((ref) {
      return LostHorseFilterNotifier();
    });

/// A list of all Mongolian aimags (21 + Улаанбаатар).
///
/// Matches the list in [RegionSelectionPage._regions].
const List<String> kAimags = [
  'Улаанбаатар',
  'Төв',
  'Хэнтий',
  'Булган',
  'Сэлэнгэ',
  'Дархан-Уул',
  'Орхон',
  'Архангай',
  'Өвөрхангай',
  'Баянхонгор',
  'Говь-Алтай',
  'Ховд',
  'Увс',
  'Завхан',
  'Дундговь',
  'Говьсүмбэр',
  'Дорнод',
  'Хамын',
  'Сүхбаатар',
  'Дорноговь',
  'Өмнөговь',
];

/// Derives a filtered, recency-sorted list of reports from the active stream
/// based on the current filter state.
final filteredActiveLostHorsesProvider =
    Provider.autoDispose<AsyncValue<List<LostHorseReport>>>((ref) {
      final reportsAsync = ref.watch(activeLostHorsesStreamProvider);
      final filter = ref.watch(lostHorseFilterProvider);

      return reportsAsync.whenData((reports) {
        var filtered = reports.where((r) {
          if (filter.aimag != null && r.locationAimag != filter.aimag) {
            return false;
          }
          if (filter.animalType != null && r.animalType != filter.animalType) {
            return false;
          }
          if (filter.coatColor != null && r.coatColor != filter.coatColor) {
            return false;
          }
          if (filter.status != null && r.status != filter.status) {
            return false;
          }
          return true;
        }).toList();

        // Sort by recency (newest first).
        filtered.sort((a, b) => b.lastSeenAt.compareTo(a.lastSeenAt));

        return filtered;
      });
    });
