export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: "currency" | "date" | "number" | "string";
  width?: number;
  value?: (row: T) => string | number | Date | null | undefined;
}
