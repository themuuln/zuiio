import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tamga/src/core/error/app_exception.dart';
import 'package:tamga/src/core/error/result.dart';
import 'package:tamga/src/features/documents/application/document_providers.dart';
import 'package:tamga/src/features/documents/data/document_repository.dart';
import 'package:tamga/src/features/documents/domain/document_record.dart';

class MockDocumentRepository extends Mock implements DocumentRepository {}

/// Helper to create a minimal DocumentRecord with defaults.
DocumentRecord _createDoc({
  String id = 'd1',
  String horseId = 'horse-1',
  String ownerId = 'owner-1',
  DocumentType docType = DocumentType.vetCert,
  String title = 'Вакцин гэрчилгээ',
}) {
  final now = DateTime(2026, 6, 1);
  return DocumentRecord(
    id: id,
    horseId: horseId,
    ownerId: ownerId,
    docType: docType,
    title: title,
    storagePath: '$horseId/$id.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    createdAt: now,
    updatedAt: now,
  );
}

void main() {
  late MockDocumentRepository mockRepository;

  setUp(() {
    mockRepository = MockDocumentRepository();
  });

  ProviderContainer containerWith() {
    return ProviderContainer(
      overrides: [documentRepositoryProvider.overrideWithValue(mockRepository)],
    );
  }

  group('documentsForHorseProvider', () {
    test('caches results and recomputes after invalidation', () async {
      var calls = 0;
      when(() => mockRepository.getDocumentsForHorse('horse-1')).thenAnswer((
        _,
      ) async {
        calls++;
        return Result.ok([_createDoc()]);
      });

      final container = containerWith();
      addTearDown(container.dispose);

      await container.read(documentsForHorseProvider('horse-1').future);
      expect(calls, 1);

      // Second read is served from cache.
      await container.read(documentsForHorseProvider('horse-1').future);
      expect(calls, 1);

      // Invalidation forces the repository to be read again.
      container.invalidate(documentsForHorseProvider('horse-1'));
      await container.read(documentsForHorseProvider('horse-1').future);
      expect(calls, 2);
    });

    test('returns documents per horse and scopes family arguments', () async {
      final docs = [_createDoc(id: 'd1'), _createDoc(id: 'd2')];
      when(
        () => mockRepository.getDocumentsForHorse('horse-1'),
      ).thenAnswer((_) async => Result.ok(docs));
      when(() => mockRepository.getDocumentsForHorse('horse-2')).thenAnswer(
        (_) async => Result.ok([_createDoc(id: 'd3', horseId: 'horse-2')]),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        documentsForHorseProvider('horse-1').future,
      );
      expect(result, hasLength(2));
      expect(result.map((d) => d.id), ['d1', 'd2']);

      final other = await container.read(
        documentsForHorseProvider('horse-2').future,
      );
      expect(other.single.id, 'd3');
      expect(other.single.horseId, 'horse-2');
    });

    test('rethrows repository failure via getOrThrow', () async {
      when(() => mockRepository.getDocumentsForHorse('horse-1')).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'LOCAL_READ_ERROR', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(documentsForHorseProvider('horse-1').future),
        throwsA(isA<AppException>()),
      );
    });
  });

  group('documentsByTypeProvider', () {
    test('filters by doc type with no horse id', () async {
      when(
        () => mockRepository.getDocumentsByType(
          docType: DocumentType.vetCert,
          horseId: null,
        ),
      ).thenAnswer((_) async => Result.ok([_createDoc()]));

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        documentsByTypeProvider((
          docType: DocumentType.vetCert,
          horseId: null,
        )).future,
      );

      expect(result.single.docType, DocumentType.vetCert);
    });

    test('passes horseId through to the repository', () async {
      when(
        () => mockRepository.getDocumentsByType(
          docType: DocumentType.insurance,
          horseId: 'horse-1',
        ),
      ).thenAnswer(
        (_) async =>
            Result.ok([_createDoc(id: 'd9', docType: DocumentType.insurance)]),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      final result = await container.read(
        documentsByTypeProvider((
          docType: DocumentType.insurance,
          horseId: 'horse-1',
        )).future,
      );

      expect(result.single.id, 'd9');
      expect(result.single.horseId, 'horse-1');
    });

    test('rethrows repository failure via getOrThrow', () async {
      when(
        () => mockRepository.getDocumentsByType(
          docType: DocumentType.vetCert,
          horseId: null,
        ),
      ).thenAnswer(
        (_) async => Result.fail(
          const AppException(code: 'LOCAL_READ_ERROR', message: 'Алдаа'),
        ),
      );

      final container = containerWith();
      addTearDown(container.dispose);

      expect(
        () => container.read(
          documentsByTypeProvider((
            docType: DocumentType.vetCert,
            horseId: null,
          )).future,
        ),
        throwsA(isA<AppException>()),
      );
    });
  });

  group('mutation providers', () {
    test(
      'uploadDocumentProvider and deleteDocumentProvider resolve to the repository',
      () {
        final container = containerWith();
        addTearDown(container.dispose);

        expect(container.read(uploadDocumentProvider), same(mockRepository));
        expect(container.read(deleteDocumentProvider), same(mockRepository));
      },
    );
  });
}
