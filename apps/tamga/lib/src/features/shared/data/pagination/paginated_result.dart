/// Бүртгэлийн нэг хуудсыг илэрхийлсэн жин хүртээмжит төрөл.
///
/// Repository-үүдийн paginated fetch методуудаас буцаахдаа ашиглана:
/// ```dart
/// final result = await repository.fetchListingsPaginated(page: 0, limit: 20);
/// final paginated = result.getOrThrow();
/// print(paginated.items.length); // 20
/// print(paginated.totalCount);   // e.g. 150
/// ```
class PaginatedResult<T> {
  /// Нэг хуудасны үр дүн.
  const PaginatedResult({required this.items, required this.totalCount});

  /// Энэ хуудасны элементүүд.
  final List<T> items;

  /// Нийт элементийн тоо (бүх хуудсыг хамарсан).
  final int totalCount;

  /// Энэ хуудас дүүрсэн эсэх (items.length >= requested limit).
  bool get isFull => items.isNotEmpty; // Caller checks against pageSize
}
