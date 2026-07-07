# @zuiio/export

Server + client export utilities for tabular entity data. Generates download `Response` objects or browser-side blobs in four formats.

Core types: `ExportColumn { header, key }`, `ExportFormat = "csv" | "xlsx" | "docx" | "pdf"`, plus exported `formatExtensions` and `formatMimeTypes` lookup maps.

## Formats

| Format | Library | Server functions | Client functions |
|--------|---------|------------------|------------------|
| CSV | _(none)_ | `toCsv` | `downloadCSV`, `downloadBlob` |
| XLSX | `exceljs` ★ | `toXlsx`, `toXlsxMultiSheet` | `downloadExcel`, `toExcelBuffer<T>` |
| DOCX | `docx` | `toDocx`, `toDocxMultiSection` | — |
| PDF | `pdf-lib` + `@pdf-lib/fontkit` | `toPdfAsync`, `toPdfMultiSectionAsync` | — |

★ `exceljs` is a **peerDependency** — consumer must install it.
`excel.ts` uses dynamic `import("exceljs")` for tree-shaking; `xlsx.ts` uses a static import for the server path.

## serveEntityExport

Primary server entry point — call from a Next.js Route Handler or Server Action:

```ts
import { serveEntityExport } from "@zuiio/export";

export async function GET(req: Request) {
  const rows = await fetchRows();
  const columns = [{ header: "Name", key: "name" }];
  return serveEntityExport(rows, columns, "xlsx", "report");
  // 5th arg: title (shown in docx/pdf headings)
}
```

Returns `Response` with correct `Content-Type` + `Content-Disposition` headers. Returns `400` for unsupported formats.

## Dependencies

| Package | Role |
|---------|------|
| `exceljs` | XLSX generation (peer dep) |
| `docx` | DOCX generation (`Packer.toBuffer`) |
| `pdf-lib` | PDF generation, A4 portrait layout |
| `@pdf-lib/fontkit` | Custom Roboto font embedding in PDF |

CSV has no runtime deps — pure string escaping with formula-injection protection.

## Source files

```
types.ts   — ExportColumn, ExportFormat, extension/MIME maps
serve.ts   — serveEntityExport (server Response builder)
csv.ts     — toCsv, downloadCSV, downloadBlob
xlsx.ts    — toXlsx, toXlsxMultiSheet (static exceljs import)
docx.ts    — toDocx, toDocxMultiSection
pdf.ts     — toPdfAsync, toPdfMultiSectionAsync
excel.ts   — toExcelBuffer<T>, downloadExcel (dynamic exceljs import)
index.ts   — barrel re-export
```
