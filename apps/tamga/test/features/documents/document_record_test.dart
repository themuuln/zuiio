import 'package:flutter_test/flutter_test.dart';
import 'package:tamga/src/features/documents/domain/document_record.dart';

void main() {
  group('DocumentRecord', () {
    test('serialization round-trip (toJson/fromJson)', () {
      final now = DateTime.now();
      final doc = DocumentRecord(
        id: 'test-doc-1',
        horseId: 'horse-1',
        ownerId: 'owner-1',
        docType: DocumentType.vetCert,
        title: '2024 онд хийсэн вакцин',
        storagePath: 'horse-1/test-doc-1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        createdAt: now,
        updatedAt: now,
      );

      final json = doc.toJson();
      final restored = DocumentRecord.fromJson(json);

      expect(restored.id, doc.id);
      expect(restored.horseId, doc.horseId);
      expect(restored.ownerId, doc.ownerId);
      expect(restored.docType, doc.docType);
      expect(restored.title, doc.title);
      expect(restored.storagePath, doc.storagePath);
      expect(restored.fileSize, doc.fileSize);
      expect(restored.mimeType, doc.mimeType);
    });

    test('serialization round-trip (toSupabaseJson/fromSupabaseJson)', () {
      final now = DateTime.now();
      final doc = DocumentRecord(
        id: 'test-doc-2',
        horseId: 'horse-2',
        ownerId: 'owner-2',
        docType: DocumentType.insurance,
        title: 'Даатгалын гэрчилгээ',
        storagePath: 'horse-2/test-doc-2.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        createdAt: now,
        updatedAt: now,
      );

      final json = doc.toSupabaseJson();
      final restored = DocumentRecord.fromSupabaseJson(json);

      expect(restored.id, doc.id);
      expect(restored.horseId, doc.horseId);
      expect(restored.ownerId, doc.ownerId);
      expect(restored.docType, doc.docType);
      expect(restored.title, doc.title);
      expect(restored.storagePath, doc.storagePath);
      expect(restored.fileSize, doc.fileSize);
      expect(restored.mimeType, doc.mimeType);
    });

    test('copyWith creates new instance with overrides', () {
      final doc = DocumentRecord(
        id: 'test-doc-3',
        horseId: 'horse-3',
        ownerId: 'owner-3',
        docType: DocumentType.registration,
        title: 'Бүртгэлийн баримт',
        storagePath: 'horse-3/test-doc-3.pdf',
        createdAt: DateTime(2024),
        updatedAt: DateTime(2024),
      );

      final updated = doc.copyWith(title: 'Шинэ нэр', fileSize: 512);

      expect(updated.title, 'Шинэ нэр');
      expect(updated.fileSize, 512);
      expect(updated.id, doc.id); // unchanged
      expect(updated.docType, doc.docType); // unchanged
    });

    test('equality works correctly', () {
      final now = DateTime(2024);
      final doc1 = DocumentRecord(
        id: 'same-id',
        horseId: 'horse-1',
        ownerId: 'owner-1',
        docType: DocumentType.microchip,
        title: 'Микрочип',
        storagePath: 'path',
        createdAt: now,
        updatedAt: now,
      );
      final doc2 = DocumentRecord(
        id: 'same-id',
        horseId: 'horse-1',
        ownerId: 'owner-1',
        docType: DocumentType.microchip,
        title: 'Микрочип',
        storagePath: 'path',
        createdAt: now,
        updatedAt: now,
      );
      final doc3 = doc1.copyWith(title: 'Өөр нэр');

      expect(doc1, equals(doc2));
      expect(doc1, isNot(equals(doc3)));
    });
  });

  group('DocumentType', () {
    test('fromString returns correct type', () {
      // camelCase (Dart enum names)
      expect(DocumentType.fromString('vetCert'), DocumentType.vetCert);
      expect(DocumentType.fromString('insurance'), DocumentType.insurance);
      expect(
        DocumentType.fromString('registration'),
        DocumentType.registration,
      );
      expect(DocumentType.fromString('microchip'), DocumentType.microchip);
      expect(DocumentType.fromString('other'), DocumentType.other);
      expect(DocumentType.fromString('unknown'), DocumentType.other);

      // snake_case (Supabase values)
      expect(DocumentType.fromString('vet_cert'), DocumentType.vetCert);
      expect(DocumentType.fromString('insurance'), DocumentType.insurance);
      expect(
        DocumentType.fromString('registration'),
        DocumentType.registration,
      );
      expect(DocumentType.fromString('microchip'), DocumentType.microchip);
    });

    test('labelMn returns Mongolian text', () {
      expect(DocumentType.vetCert.labelMn, 'Эмчийн гэрчилгээ');
      expect(DocumentType.insurance.labelMn, 'Даатгал');
      expect(DocumentType.registration.labelMn, 'Бүртгэлийн баримт');
      expect(DocumentType.microchip.labelMn, 'Микрочип');
      expect(DocumentType.other.labelMn, 'Бусад');
    });

    test('labelEn returns English text', () {
      expect(DocumentType.vetCert.labelEn, 'Vet Certificate');
      expect(DocumentType.insurance.labelEn, 'Insurance');
      expect(DocumentType.registration.labelEn, 'Registration');
      expect(DocumentType.microchip.labelEn, 'Microchip');
      expect(DocumentType.other.labelEn, 'Other');
    });
  });
}
