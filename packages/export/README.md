# @zuiio/export — Entity Data Export

Server-side tabular data export to CSV, XLSX, DOCX, and PDF. Returns `Response` objects ready for route handlers, or raw buffers for custom pipelines.

## Formats

| Format | Library | Functions |
|---|---|---|
| CSV | _(none — pure string)_ | `toCsv`, `downloadCSV`, `downloadBlob` |
| XLSX | `exceljs` | `toXlsx`, `toXlsxMultiSheet` |
| DOCX | `docx` | `toDocx`, `toDocxMultiSection` |
| PDF | `pdf-lib` + `@pdf-lib/fontkit` | `toPdfAsync`, `toPdfMultiSectionAsync` |
| Excel (typed) | `exceljs` | `toExcelBuffer`, `downloadExcel` |

## `serveEntityExport` — Quick start

One function, four formats. Drop this into any Next.js route handler:

```ts
import { serveEntityExport } from "@zuiio/export";
import type { ExportColumn } from "@zuiio/export";

const columns: ExportColumn[] = [
  { header: "Name",  key: "name" },
  { header: "Phone", key: "phone" },
  { header: "Total", key: "total" },
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "xlsx";
  const rows = await fetchCustomerRows(); // your data source

  return serveEntityExport(rows, columns, format, "customers", "Customer Report");
}
```

`serveEntityExport(rows, columns, format, filename, title?)` handles headers (`Content-Type`, `Content-Disposition`) and returns a download-ready `Response`.

## Module map

| Module | Key exports |
|---|---|
| `types.ts` | `ExportColumn`, `ExportFormat`, `formatExtensions`, `formatMimeTypes` |
| `serve.ts` | `serveEntityExport` |
| `csv.ts` | `toCsv`, `downloadCSV`, `downloadBlob` |
| `xlsx.ts` | `toXlsx`, `toXlsxMultiSheet` |
| `excel.ts` | `toExcelBuffer`, `downloadExcel`, `ExcelOptions` |
| `docx.ts` | `toDocx`, `toDocxMultiSection` |
| `pdf.ts` | `toPdfAsync`, `toPdfMultiSectionAsync` |
