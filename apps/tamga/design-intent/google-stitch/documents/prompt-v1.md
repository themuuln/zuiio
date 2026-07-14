<!-- Layout: Document Vault -->
Design a document management section for a mobile horse management app.

Include:
- Horse documents list screen categorized by type with FAB to add
- Document upload bottom sheet with type selection and file picker

Interactions:
- Document type filter tabs
- Tap document to preview/download
- FAB opens upload sheet
- Long-press for delete option

Style: warm earthy palette, orange (#F06A2E) FAB and accents, file-type color coding, iOS grouped list, system font

Optimize for mobile, file type icons, document preview, download functionality

---

<!-- Component: Horse Documents Screen -->
Design a horse documents vault screen for mobile.

Include:
- Back arrow + "Баримтууд" (Documents) title, horse name subtitle
- Document type tabs (horizontal scroll): "Бүгд" (All) | "Эмчилгээ" (Medical) | "Бүртгэл" (Registration) | "Гэрчилгээ" (Certificate) | "Бусад" (Other)
- Document cards in vertical list:
  - File type icon (PDF=red, image=blue, doc=orange, 24dp)
  - Document title (Headline)
  - Type badge (colored pill)
  - Date uploaded (Caption, muted)
  - File size (Caption, muted)
  - Trailing: download icon, more options (⋯)
- Grouped by type when "All" tab active, with section headers
- Empty state: folder illustration + "Баримт алга" (No documents yet)
- Orange FAB: "+" for adding document

Style: file management feel, warm background, color-coded file icons, clean list layout, section headers, system font

Optimize for mobile, file type filtering, document preview modal, download to device

---

<!-- Component: Upload Document Sheet -->
Design a document upload bottom sheet for mobile.

Include:
- Grab handle at top (centered, gray)
- "Баримт нэмэх" (Add Document) title in Headline
- Document type selector: dropdown or chips — "Эмчилгээ" (Medical) | "Бүртгэл" (Registration) | "Гэрчилгээ" (Certificate) | "Бусад" (Other)
- Title input: "Баримтын нэр" (Document Title)
- File picker area: dashed border box with upload icon, "Файл сонгох" (Select File) label
  - Supported formats note: "PDF, JPG, PNG — Дээд хэмжээ: 10MB"
- Preview of selected file (thumbnail + filename + size)
- "Хадгалах" (Save) primary button — full-width, orange
- "Цуцлах" (Cancel) text button above

Style: iOS bottom sheet, warm background, orange upload area accent, clean form inputs, system font

Optimize for mobile, drag to dismiss, file picker integration, upload progress indicator
