"use client";

import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  /** URL of the export endpoint */
  href: string;
  /** Suggested filename for the download */
  filename: string;
}

export function ExportButton({ href, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(href);
      if (!response.ok) {
        console.error("Export failed", response.status, response.statusText);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
    >
      <DownloadSimple className="size-4" />
      {isExporting ? "Экспортлож байна..." : "CSV экспорт"}
    </Button>
  );
}
