"use client";

import { Database, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface DataExportSectionProps {
  orgId: string;
}

export function DataExportSection({ orgId }: DataExportSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-0.5 bg-blue-400/40" />
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Download className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Export All Data</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Download all your organization data as JSON.
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Includes customers, vehicles, work orders, inventory, invoices, and
            settings.
          </p>
          <div className="mt-4">
            <ExportDataButton orgId={orgId} />
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-0.5 bg-emerald-400/40" />
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <Database className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Database Backup</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Back up from the command line.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Local backup</p>
              <code className="mt-0.5 block text-xs font-mono text-foreground">
                ./scripts/backup.sh
              </code>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Remote backup</p>
              <code className="mt-0.5 block text-xs font-mono text-foreground">
                ./scripts/backup.sh --remote
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExportDataButton({ orgId }: { orgId: string }) {
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
      toast.success("Data exported successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={exporting || !orgId}
        className="w-full"
      >
        {exporting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Exporting…
          </>
        ) : (
          <>
            <Download className="mr-2 size-4" />
            Export Data
          </>
        )}
      </Button>
      {exportError && (
        <p className="text-xs text-destructive">{exportError}</p>
      )}
    </div>
  );
}
