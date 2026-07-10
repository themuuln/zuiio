"use client";

import { Database, Download, Loader2 } from "lucide-react";
import { reportServerError } from "@/lib/sentry-report-server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { SettingsBlock } from "./_settings-layout";

interface DataExportSectionProps {
  orgId: string;
}

export function DataExportSection({ orgId }: DataExportSectionProps) {
  return (
    <SettingsBlock className="sm:grid sm:grid-cols-2 sm:gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Download className="size-4 text-muted-foreground" />
          <Typography.Text className="text-sm font-medium">
            Export All Data
          </Typography.Text>
        </div>
        <Typography.Muted className="text-xs text-muted-foreground">
          Download all your organization data as JSON. Includes customers,
          vehicles, work orders, inventory, invoices, and settings.
        </Typography.Muted>
        <ExportDataButton orgId={orgId} />
      </div>

      <Separator className="sm:hidden" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          <Typography.Text className="text-sm font-medium">
            Database Backup
          </Typography.Text>
        </div>
        <Typography.Muted className="text-xs text-muted-foreground">
          Back up from the command line.
        </Typography.Muted>
        <div className="flex flex-col gap-1.5">
          <div className="rounded-md bg-muted/40 px-2.5 py-2">
            <Typography.Muted className="text-[11px] text-muted-foreground">
              Local backup
            </Typography.Muted>
            <code className="mt-0.5 block font-mono text-xs text-foreground">
              ./scripts/backup.sh
            </code>
          </div>
          <div className="rounded-md bg-muted/40 px-2.5 py-2">
            <Typography.Muted className="text-[11px] text-muted-foreground">
              Remote backup
            </Typography.Muted>
            <code className="mt-0.5 block font-mono text-xs text-foreground">
              ./scripts/backup.sh --remote
            </code>
          </div>
        </div>
      </div>
    </SettingsBlock>
  );
}

function ExportDataButton({ orgId }: { orgId: string }) {
  const t = useTranslations("settings");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!orgId) return;
    setExporting(true);
    setExportError(null);

    try {
      const response = await fetch(`/api/organizations/${orgId}/export`);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message ?? "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tolom-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch (err) {
    reportServerError("Unexpected error", err);
      const message = err instanceof Error ? err.message : "Export failed";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting || !orgId}
        className="w-fit"
      >
        {exporting ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Exporting…
          </>
        ) : (
          <>
            <Download className="mr-2 size-3.5" />
            Export Data
          </>
        )}
      </Button>
      {exportError ? (
        <Typography.Text className="text-xs text-destructive">
          {exportError}
        </Typography.Text>
      ) : null}
    </div>
  );
}
