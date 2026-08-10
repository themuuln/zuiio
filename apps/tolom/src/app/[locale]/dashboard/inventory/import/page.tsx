"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatePageHeader } from "@/components/ui/create-page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventoryKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";

type ImportState =
  | { status: "idle" }
  | {
      status: "preview";
      filename: string;
      headers: string[];
      rows: Record<string, string>[];
      totalRows: number;
    }
  | { status: "importing"; total: number; current: number }
  | {
      status: "done";
      imported: number;
      errors: { row: number; message: string }[];
    }
  | { status: "error"; message: string };

const CSV_TEMPLATE = [
  "name,name_mn,part_number,barcode,category,unit,default_price,purchase_price,location",
  "Oil Filter,Шүүр,OF-101,,Filters,piece,15000,8000,Warehouse A",
  "Brake Pad,Зогсоолын элээр,BP-202,,Brakes,set,45000,22000,Warehouse B",
].join("\n");

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function ImportPartsPage() {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ status: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (csvContent: string) => {
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: "text/csv" });
      formData.append("file", blob, "parts.csv");

      const res = await fetch(
        `/api/organizations/${orgId}/inventory/parts/import`,
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.all(orgId ?? ""),
      });
      setState({
        status: "done",
        imported: data.data?.imported ?? 0,
        errors: data.data?.errors ?? [],
      });
    },
    onError: (error) => {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    },
  });

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Only .csv files are accepted");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const headers = parseCsvLine(lines[0]);
      const rows: Record<string, string>[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        for (let j = 0; j < headers.length && j < values.length; j++) {
          row[headers[j]] = values[j];
        }
        rows.push(row);
      }
      setState({
        status: "preview",
        filename: file.name,
        headers,
        rows,
        totalRows: lines.length - 1,
      });
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleImport = () => {
    if (state.status !== "preview") return;
    setState({ status: "importing", total: state.totalRows, current: 0 });
    // Read the full file content and send it
    const input = fileInputRef.current;
    if (input?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importMutation.mutate(content);
      };
      reader.readAsText(input.files[0]);
    }
  };

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6">
      {/* Header */}
      <CreatePageHeader
        backHref="/dashboard/inventory"
        title={t("importParts")}
        subtitle={t("importPartsDescription")}
      />

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-4" />
            {t("downloadTemplate")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t("templateDescription")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "parts-template.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="size-4 mr-1" />
            {t("downloadCsvTemplate")}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {state.status === "idle" && (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Upload className="size-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium">{t("dragDropCsv")} or</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("browseFiles")}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {state.status === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              {state.filename}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {state.totalRows} part{state.totalRows !== 1 ? "s" : ""} found —
                showing first 5
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState({ status: "idle" })}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleImport}>
                  <Upload className="size-4 mr-1" />
                  Import {state.totalRows} Part
                  {state.totalRows !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {state.headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.rows.map((row, i) => (
                    <TableRow key={i}>
                      {state.headers.map((h) => (
                        <TableCell key={h} className="max-w-48 truncate">
                          {row[h] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Importing */}
      {state.status === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Importing parts...</p>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {state.status === "done" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {state.imported} part{state.imported !== 1 ? "s" : ""} imported
              </p>
              {state.errors.length > 0 && (
                <p className="text-sm text-destructive mt-1">
                  {state.errors.length} error
                  {state.errors.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {state.errors.length > 0 && (
              <div className="w-full max-w-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.errors.slice(0, 10).map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>{err.row}</TableCell>
                        <TableCell className="text-destructive text-xs">
                          {err.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setState({ status: "idle" });
                queryClient.invalidateQueries({
                  queryKey: inventoryKeys.all(orgId ?? ""),
                });
              }}
            >
              Import More
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {state.status === "error" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <XCircle className="size-10 text-destructive" />
            <p className="text-sm text-destructive">{state.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState({ status: "idle" })}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
