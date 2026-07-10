"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useExcelExport } from "@/hooks/use-excel-export";
import type { ExportColumn } from "@/lib/export";
import { cn } from "@/lib/utils";
import { reportServerError } from "@/lib/sentry-report-server";

interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  sheetName?: string;
  title?: string;
  label?: string;
  disabled?: boolean;
  buttonSize?: ComponentProps<typeof Button>["size"];
  className?: string;
}

export function ExportButton<T>({
  data,
  columns,
  filename,
  sheetName,
  title,
  label = "Export Excel",
  disabled,
  buttonSize = "sm",
  className,
}: ExportButtonProps<T>) {
  const { exportToExcel, isExporting } = useExcelExport();
  const t = useTranslations("common");

  const handleClick = async () => {
    try {
      await exportToExcel({
        data,
        columns,
        filename,
        sheetName,
        title,
      });
      toast.success(t("exportSuccess", { label }));
    } catch {
      reportServerError("Unexpected error");
      toast.error(t("exportFailed", { label }));
    }
  };

  return (
    <Button
      variant="outline"
      size={buttonSize}
      className={cn(className)}
      onClick={handleClick}
      disabled={disabled || isExporting || !data?.length}
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
