import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Жин хүртээмжит (infinite scroll) загварын төлөв.
///
/// Энэ нь нэг жагсаалтын одоогийн нөхцөл байдлыг хадгална:
/// - Аль хэдийн ачаалсан элементүүд
/// - Дараагийн хуудас байгаа эсэх
/// - Ачааллаж байгаа эсэх
/// - Алдааны мэдээлэл
class PaginationState<T> {
  /// Анхны хоосон төлөв.
  const PaginationState({
    this.items = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.error,
    this.currentPage = 0,
  });

  /// Энэ хуудасны элементүүд.
  final List<T> items;

  /// Ачааллаж байгаа эсэх.
  final bool isLoading;

  /// Дараагийн хуудас байгаа эсэх.
  final bool hasMore;

  /// Алдааны мэдээлэл (байвал).
  final Object? error;

  /// Одоогийн хуудасны дугаар (0-ээс эхэлнэ).
  final int currentPage;

  /// Төлөв шинэчлэх.
  PaginationState<T> copyWith({
    List<T>? items,
    bool? isLoading,
    bool? hasMore,
    Object? error,
    int? currentPage,
    bool clearError = false,
  }) {
    return PaginationState<T>(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
      currentPage: currentPage ?? this.currentPage,
    );
  }

  /// Эхлээд байгаа эсэх (ямар ч элемент ачаалагдаагүй).
  bool get isEmpty => items.isEmpty && !isLoading;

  /// Алдаатай эсэх.
  bool get hasError => error != null;
}

/// Жин хүртээмжин (infinite scroll) загварыг удирдах StateNotifier.
///
/// Хэрэлэгч scroll хийхэд `loadMore()` дуудаж, дараагийн хуудсыг ачаална.
/// Анхны ачаалалт болон шинэчлэлтийг `loadInitial()` эсвэл `refresh()` ашиглана.
///
/// Энгийн ашиглалт:
/// ```dart
/// final provider = StateNotifierProvider<PaginationNotifier<Horse>, PaginationState<Horse>>((ref) {
///   final repo = ref.watch(horsesRepositoryProvider).requireValue;
///   return PaginationNotifier<Horse>(
///     fetchPage: (page, pageSize) async {
///       final result = await repo.fetchHorsesPaginated(page: page, limit: pageSize);
///       return result.getOrThrow().items;
///     },
///   )..loadInitial();
/// });
/// ```
class PaginationNotifier<T> extends StateNotifier<PaginationState<T>> {
  /// Шинэ PaginationNotifier үүсгэх.
  PaginationNotifier({required this.fetchPage, this.pageSize = 20})
    : super(PaginationState<T>());

  /// Хуудас татах функц — (page, pageSize) -> `List<T>`.
  final Future<List<T>> Function(int page, int pageSize) fetchPage;

  /// Хуудас бүрийн элементийн тоо.
  final int pageSize;

  /// Эхний хуудсыг ачаалах (төлөвийг дахин тохируулна).
  Future<void> loadInitial() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final items = await fetchPage(0, pageSize);
      state = state.copyWith(
        items: items,
        isLoading: false,
        hasMore: items.length >= pageSize,
        currentPage: 0,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  /// Дараагийн хуудсыг ачаалах (элементүүдийг нэмнэ).
  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;
    state = state.copyWith(isLoading: true);
    try {
      final nextPage = state.currentPage + 1;
      final items = await fetchPage(nextPage, pageSize);
      state = state.copyWith(
        items: [...state.items, ...items],
        isLoading: false,
        hasMore: items.length >= pageSize,
        currentPage: nextPage,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e);
    }
  }

  /// Дахин ачаалах — эхний хуудаснаас эхэлнэ.
  Future<void> refresh() => loadInitial();
}
