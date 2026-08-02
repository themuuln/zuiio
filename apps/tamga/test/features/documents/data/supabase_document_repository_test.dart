import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:tamga/src/features/documents/data/document_repository.dart';
import 'package:tamga/src/features/documents/data/supabase_document_repository.dart';
import 'package:tamga/src/features/documents/domain/document_record.dart';

// ── Mocks ───────────────────────────────────────────────────────────────

class MockSupabaseClient extends Mock implements SupabaseClient {}

class MockSupabaseStorageClient extends Mock implements SupabaseStorageClient {}

class MockStorageFileApi extends Mock implements StorageFileApi {}

// ── Query chain fakes ───────────────────────────────────────────────────
//
// PostgrestFilterBuilder / SupabaseQueryBuilder implement Future<T>, so
// mocktail's thenReturn cannot be used on the terminal link of a chain.
// These fakes model the chain with real method bodies; the terminal await
// resolves to the configured rows via an explicit `then` override.

class _FakeQueryBuilder extends Fake implements SupabaseQueryBuilder {
  _FakeQueryBuilder({this.rows = const [], this.singleRow})
    : capture = _FakeQueryCapture();

  /// Rows yielded when a chain built from this builder is awaited directly.
  final List<Map<String, dynamic>> rows;

  /// Row yielded by the `maybeSingle` terminal of a chain.
  final Map<String, dynamic>? singleRow;

  final _FakeQueryCapture capture;

  _FakeFilter _newFilter() {
    final filter = _FakeFilter(rows: rows, singleRow: singleRow);
    capture.lastFilter = filter;
    return filter;
  }

  @override
  _FakeFilter select([String columns = '*']) => _newFilter();

  @override
  _FakeFilter insert(Object values, {bool defaultToNull = true}) {
    capture.lastInsert = values;
    return _newFilter();
  }

  @override
  _FakeFilter upsert(
    Object values, {
    String? onConflict,
    bool ignoreDuplicates = false,
    bool defaultToNull = true,
  }) {
    capture.lastUpsert = values;
    return _newFilter();
  }

  @override
  _FakeFilter update(Map values) {
    capture.lastUpdate = values;
    return _newFilter();
  }

  @override
  _FakeFilter delete() {
    capture.lastDelete = true;
    return _newFilter();
  }

  Object? get lastInsert => capture.lastInsert;
  Object? get lastUpsert => capture.lastUpsert;
  Map<dynamic, dynamic>? get lastUpdate => capture.lastUpdate;
  bool get lastDelete => capture.lastDelete;
  _FakeFilter? get lastFilter => capture.lastFilter;
}

class _FakeQueryCapture {
  Object? lastInsert;
  Object? lastUpsert;
  Map<dynamic, dynamic>? lastUpdate;
  bool lastDelete = false;
  _FakeFilter? lastFilter;
}

class _FakeFilter extends Fake
    implements PostgrestFilterBuilder<PostgrestList> {
  _FakeFilter({required this.rows, this.singleRow});

  final List<Map<String, dynamic>> rows;
  final Map<String, dynamic>? singleRow;

  final List<(String, Object)> eqCalls = [];

  @override
  _FakeFilter eq(String column, Object value) {
    eqCalls.add((column, value));
    return this;
  }

  @override
  _FakeFilter order(
    String column, {
    bool ascending = false,
    bool nullsFirst = false,
    String? referencedTable,
  }) => this;

  @override
  _FakeMaybeSingle maybeSingle() => _FakeMaybeSingle(singleRow);

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestList) onValue, {
    Function? onError,
  }) => Future<PostgrestList>.value(rows).then(onValue, onError: onError);
}

class _FakeMaybeSingle extends Fake
    implements PostgrestTransformBuilder<PostgrestMap?> {
  _FakeMaybeSingle(this.row);

  final Map<String, dynamic>? row;

  @override
  Future<R> then<R>(
    FutureOr<R> Function(PostgrestMap?) onValue, {
    Function? onError,
  }) => Future<PostgrestMap?>.value(row).then(onValue, onError: onError);
}

// ── Helpers ──────────────────────────────────────────────────────────────

Map<String, dynamic> documentRow({
  String id = 'doc-1',
  String horseId = 'horse-1',
  String ownerId = 'owner-1',
  String docType = 'vet_cert',
  String title = 'Эмчийн гэрчилгээ',
  String storagePath = 'horse-1/doc-1.pdf',
  int? fileSize = 1024,
  String? mimeType = 'application/pdf',
  String createdAt = '2026-01-01T00:00:00.000',
  String updatedAt = '2026-01-02T00:00:00.000',
}) {
  return {
    'id': id,
    'horse_id': horseId,
    'owner_id': ownerId,
    'doc_type': docType,
    'title': title,
    'storage_path': storagePath,
    'file_size': fileSize,
    'mime_type': mimeType,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };
}

void main() {
  late MockSupabaseClient mockClient;
  late SupabaseDocumentRepository repository;

  setUp(() {
    mockClient = MockSupabaseClient();
    repository = SupabaseDocumentRepository(client: mockClient);
  });

  group('SupabaseDocumentRepository implements DocumentRepository', () {
    test('class exists and implements DocumentRepository', () {
      expect(repository, isA<DocumentRepository>());
    });
  });

  group('uploadDocument', () {
    test(
      'returns SUPABASE_NOT_CONFIGURED when Supabase client is null',
      () async {
        final repo = SupabaseDocumentRepository(client: null);

        final result = await repo.uploadDocument(
          file: File('/tmp/test.pdf'),
          horseId: 'horse-1',
          docType: DocumentType.vetCert,
          title: 'Гэрчилгээ',
        );

        expect(result.isFailure, isTrue);
        expect(result.error.code, 'SUPABASE_NOT_CONFIGURED');
      },
    );

    test('returns AUTH_REQUIRED without querying when no user session is '
        'resolvable', () async {
      // uploadDocument calls currentSupabaseUserId(), which reads the
      // global bootstrap (unconfigured under plain `flutter test`), so the
      // upload path is unreachable here.
      final result = await repository.uploadDocument(
        file: File('/tmp/test.pdf'),
        horseId: 'horse-1',
        docType: DocumentType.vetCert,
        title: 'Гэрчилгээ',
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'AUTH_REQUIRED');
      verifyNever(() => mockClient.from('documents'));
      verifyNever(() => mockClient.storage);
    });
  });

  group('deleteDocument', () {
    test(
      'removes the file from storage and deletes the row on success',
      () async {
        final qb = _FakeQueryBuilder(
          singleRow: {'id': 'doc-1', 'storage_path': 'horse-1/doc-1.pdf'},
        );
        when(() => mockClient.from('documents')).thenAnswer((_) => qb);

        final mockStorage = MockSupabaseStorageClient();
        final fileApi = MockStorageFileApi();
        when(() => mockClient.storage).thenReturn(mockStorage);
        when(() => mockStorage.from('documents')).thenReturn(fileApi);
        when(
          () => fileApi.remove(['horse-1/doc-1.pdf']),
        ).thenAnswer((_) async => <FileObject>[]);

        final result = await repository.deleteDocument('doc-1');

        expect(result.isSuccess, isTrue);
        expect(qb.lastDelete, isTrue);
        expect(qb.lastFilter!.eqCalls, contains(('id', 'doc-1')));
        verify(() => fileApi.remove(['horse-1/doc-1.pdf'])).called(1);
      },
    );

    test('returns DOCUMENT_NOT_FOUND when the row is missing', () async {
      final qb = _FakeQueryBuilder(singleRow: null);
      when(() => mockClient.from('documents')).thenAnswer((_) => qb);
      final mockStorage = MockSupabaseStorageClient();
      when(() => mockClient.storage).thenReturn(mockStorage);

      final result = await repository.deleteDocument('doc-missing');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'DOCUMENT_NOT_FOUND');
      // Storage is never touched when the row is missing.
      verifyNever(() => mockClient.storage);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('documents'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.deleteDocument('doc-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });

  group('getDocumentsForHorse', () {
    test('maps rows to DocumentRecord field-by-field on success', () async {
      final qb = _FakeQueryBuilder(
        rows: [
          documentRow(
            id: 'doc-1',
            docType: 'vet_cert',
            title: 'Эмчийн гэрчилгээ',
            storagePath: 'horse-1/doc-1.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
          ),
          documentRow(
            id: 'doc-2',
            docType: 'insurance',
            title: 'Даатгал',
            storagePath: 'horse-1/doc-2.png',
          ),
        ],
      );
      when(() => mockClient.from('documents')).thenAnswer((_) => qb);

      final result = await repository.getDocumentsForHorse('horse-1');

      expect(result.isSuccess, isTrue);
      final documents = result.value;
      expect(documents, hasLength(2));

      expect(documents[0].id, 'doc-1');
      expect(documents[0].horseId, 'horse-1');
      expect(documents[0].ownerId, 'owner-1');
      expect(documents[0].docType, DocumentType.vetCert);
      expect(documents[0].title, 'Эмчийн гэрчилгээ');
      expect(documents[0].storagePath, 'horse-1/doc-1.pdf');
      expect(documents[0].fileSize, 2048);
      expect(documents[0].mimeType, 'application/pdf');
      expect(documents[0].createdAt, DateTime(2026, 1, 1));
      expect(documents[0].updatedAt, DateTime(2026, 1, 2));

      expect(documents[1].docType, DocumentType.insurance);
      expect(documents[1].title, 'Даатгал');

      expect(qb.lastFilter!.eqCalls, contains(('horse_id', 'horse-1')));
    });

    test('returns empty list for empty rows', () async {
      final qb = _FakeQueryBuilder(rows: const []);
      when(() => mockClient.from('documents')).thenAnswer((_) => qb);

      final result = await repository.getDocumentsForHorse('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseDocumentRepository(client: null);

      final result = await repo.getDocumentsForHorse('horse-1');

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('documents'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.getDocumentsForHorse('horse-1');

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });

  group('getDocumentsByType', () {
    test('filters by doc_type and horse_id when horseId is provided', () async {
      final qb = _FakeQueryBuilder(rows: [documentRow(id: 'doc-1')]);
      when(() => mockClient.from('documents')).thenAnswer((_) => qb);

      final result = await repository.getDocumentsByType(
        docType: DocumentType.vetCert,
        horseId: 'horse-1',
      );

      expect(result.isSuccess, isTrue);
      expect(result.value, hasLength(1));
      expect(result.value.single.docType, DocumentType.vetCert);
      expect(qb.lastFilter!.eqCalls, contains(('doc_type', 'vetCert')));
      expect(qb.lastFilter!.eqCalls, contains(('horse_id', 'horse-1')));
    });

    test('filters only by doc_type when horseId is null', () async {
      final qb = _FakeQueryBuilder(
        rows: [documentRow(id: 'doc-1', docType: 'insurance')],
      );
      when(() => mockClient.from('documents')).thenAnswer((_) => qb);

      final result = await repository.getDocumentsByType(
        docType: DocumentType.insurance,
      );

      expect(result.isSuccess, isTrue);
      expect(result.value.single.docType, DocumentType.insurance);
      expect(qb.lastFilter!.eqCalls, contains(('doc_type', 'insurance')));
      expect(
        qb.lastFilter!.eqCalls.where((call) => call.$1 == 'horse_id'),
        isEmpty,
      );
    });

    test('returns empty list when Supabase client is null', () async {
      final repo = SupabaseDocumentRepository(client: null);

      final result = await repo.getDocumentsByType(docType: DocumentType.other);

      expect(result.isSuccess, isTrue);
      expect(result.value, isEmpty);
    });

    test('returns failure when the query throws', () async {
      when(
        () => mockClient.from('documents'),
      ).thenThrow(Exception('Network error'));

      final result = await repository.getDocumentsByType(
        docType: DocumentType.vetCert,
      );

      expect(result.isFailure, isTrue);
      expect(result.error.code, 'UNKNOWN_ERROR');
    });
  });
}
