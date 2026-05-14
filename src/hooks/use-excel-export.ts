"use client";

import { useState, useCallback } from "react";
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
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columns: columns.map((c) => ({
              key: c.key as string,
              label: c.label,
              format: c.format,
            })),
            data: data as Record<string, unknown>[],
            filename,
            sheetName,
            title,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: "Export failed" } }));
          throw new Error(err.error?.message ?? "Export failed");
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename ?? `export-${new Date().toISOString().split("T")[0]}.xlsx`;
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
