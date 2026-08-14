"use client";

import {
  DownloadSimple,
  FileCsv,
  FileDoc,
  FilePdf,
  FileXls,
} from "@phosphor-icons/react/dist/ssr";
import { capture } from "@zuiio/capture";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "@/lib/export";
import { formatExtensions } from "@/lib/export";

interface ExportButtonProps {
  /** Base URL of the export endpoint (without format param) */
  href: string;
  /** Base filename without extension (e.g., "report-2026-01-01-to-2026-01-31") */
  filename: string;
}

const formatOptions: {
  format: ExportFormat;
  label: string;
  icon: ReactNode;
}[] = [
  { format: "csv", label: "CSV", icon: <FileCsv className="size-4" /> },
  {
    format: "xlsx",
    label: "Excel (XLSX)",
    icon: <FileXls className="size-4" />,
  },
  {
    format: "docx",
    label: "Word (DOCX)",
    icon: <FileDoc className="size-4" />,
  },
  { format: "pdf", label: "PDF", icon: <FilePdf className="size-4" /> },
];

export function ExportButton({ href, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  // Strip any existing extension from filename
  const baseName = filename.replace(/\.\w+$/, "");

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);
    try {
      const separator = href.includes("?") ? "&" : "?";
      const url = `${href}${separator}format=${format}`;
      const response = await fetch(url);
      if (!response.ok) {
        capture(
          new Error(`Export failed: ${response.status} ${response.statusText}`),
          { context: "export button" },
        );
        toast.error("Экспорт хийхэд алдаа гарлаа.");
        return;
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${baseName}${formatExtensions[format]}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      capture(error, { context: "export button" });
      toast.error("Экспорт хийхэд алдаа гарлаа.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" disabled={isExporting !== null}>
            <DownloadSimple className="size-4" />
            {isExporting !== null ? "Татаж байна..." : "Экспорт"}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {formatOptions.map(({ format, label, icon }) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting !== null}
          >
            {icon}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
