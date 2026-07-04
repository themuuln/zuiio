import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../error/result.dart';

/// Creates a [FutureProvider] that fetches a [Result]<[List]<[T]>> from a
/// repository and unwraps it via [Result.getOrThrow].
///
/// The [watchRepo] callback receives a [Ref] and returns a [Future] that
/// resolves to a repository. The [fetchFn] receives the repository and
/// returns a [Future]<[Result]<[List]<[T]>>>.
///
/// ## Usage
///
/// For `FutureProvider<R>` repositories:
/// ```dart
/// final myProvider = createListProvider(
///   (ref) => ref.watch(myRepoProvider.future),
///   (repo) => repo.fetchAll(),
/// );
/// ```
///
/// For synchronous `Provider<R>` repositories:
/// ```dart
/// final myProvider = createListProvider(
///   (ref) async => ref.watch(myRepoProvider),
///   (repo) => repo.fetchAll(),
/// );
/// ```
FutureProvider<List<T>> createListProvider<T, R>(
  Future<R> Function(Ref ref) watchRepo,
  Future<Result<List<T>>> Function(R repo) fetchFn,
) {
  return FutureProvider<List<T>>((ref) async {
    final repo = await watchRepo(ref);
    final result = await fetchFn(repo);
    return result.getOrThrow();
  });
}

/// Creates a [FutureProvider.family] that fetches a [Result]<[List]<[T]>> from
/// a repository with an argument [A] and unwraps via [Result.getOrThrow].
///
/// The [watchRepo] callback receives a [Ref] and returns a [Future] that
/// resolves to a repository. The [fetchFn] receives the repository and the
/// family argument, and returns a [Future]<[Result]<[List]<[T]>>>.
///
/// ## Usage
///
/// For `FutureProvider<R>` repositories:
/// ```dart
/// final myProvider = createListFamilyProvider(
///   (ref) => ref.watch(myRepoProvider.future),
///   (repo, arg) => repo.fetchByArg(arg),
/// );
/// ```
///
/// For synchronous `Provider<R>` repositories:
/// ```dart
/// final myProvider = createListFamilyProvider(
///   (ref) async => ref.watch(myRepoProvider),
///   (repo, arg) => repo.fetchByArg(arg),
/// );
/// ```
FutureProviderFamily<List<T>, A> createListFamilyProvider<T, R, A>(
  Future<R> Function(Ref ref) watchRepo,
  Future<Result<List<T>>> Function(R repo, A arg) fetchFn,
) {
  return FutureProviderFamily<List<T>, A>((ref, arg) async {
    final repo = await watchRepo(ref);
    final result = await fetchFn(repo, arg);
    return result.getOrThrow();
  });
}
