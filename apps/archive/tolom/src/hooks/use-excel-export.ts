"use client";

import { useCallback, useState } from "react";
import type { ExportColumn } from "@/lib/export";

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = useCallback(
    async <T>(options: {
      data: T[];
      columns: ExportColumn<T>[];
      filename?: string;
      sheetName?: string;
      title?: string;
    }) => {
      const { data, columns, filename, sheetName, title } = options;
      setIsExporting(true);

      try {
        const transformedData: Record<string, unknown>[] = data.map((row) => {
          const newRow: Record<string, unknown> = {};
          for (const col of columns) {
            newRow[col.key as string] = col.value
              ? col.value(row)
              : (row as Record<string, unknown>)[col.key as string];
          }
          return newRow;
        });

        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columns: columns.map((c) => ({
              key: c.key as string,
              label: c.label,
              format: c.format,
            })),
            data: transformedData,
            filename,
            sheetName,
            title,
          }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: { message: "Export failed" } }));
          throw new Error(err.error?.message ?? "Export failed");
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          filename ?? `export-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportToExcel, isExporting };
}
