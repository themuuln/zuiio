"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useExcelExport } from "@/hooks/use-excel-export";
import type { ExportColumn } from "@/lib/export";

interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  sheetName?: string;
  title?: string;
  label?: string;
  disabled?: boolean;
}

export function ExportButton<T>({
  data,
  columns,
  filename,
  sheetName,
  title,
  label = "Export Excel",
  disabled,
}: ExportButtonProps<T>) {
  const { exportToExcel, isExporting } = useExcelExport();

  const handleClick = async () => {
    try {
      await exportToExcel({
        data,
        columns,
        filename,
        sheetName,
        title,
      });
      toast.success(`${label} — file downloaded`);
    } catch {
      toast.error(`${label} failed. Please try again.`);
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleClick}
      disabled={disabled || isExporting || data.length === 0}
      className="h-12"
    >
      {isExporting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      {label}
    </Button>
  );
}
