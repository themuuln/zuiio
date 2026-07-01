/** Column definition for tabular data export. */
export interface ExportColumn {
  header: string;
  key: string;
}

/** Supported export formats. */
export type ExportFormat = "csv" | "xlsx" | "docx" | "pdf";

/** File extension for each format. */
export const formatExtensions: Record<ExportFormat, string> = {
  csv: ".csv",
  xlsx: ".xlsx",
  docx: ".docx",
  pdf: ".pdf",
};

/** MIME type for each format. */
export const formatMimeTypes: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};
