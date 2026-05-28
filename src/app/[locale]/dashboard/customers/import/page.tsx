"use client";

import {
  AlertCircle,
  ArrowLeft,
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
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { Typography } from "@/components/ui/typography";

type PreviewRow = Record<string, string>;

type ImportState =
  | { status: "idle" }
  | { status: "preview"; filename: string; headers: string[]; rows: PreviewRow[]; totalRows: number }
  | { status: "importing"; total: number; current: number }
  | { status: "done"; imported: number; errors: { row: number; message: string }[] }
  | { status: "error"; message: string };

const CSV_TEMPLATE = [
  "firstName,lastName,phone,email,address,notes,type,source",
  "Bat,Erdene,99112233,bat@example.com,UB city,,individual,referral",
  "Sarantuya,Bold,88112233,sara@example.com,,VIP customer,individual,website",
].join("\n");

function parsePreview(content: string): {
  headers: string[];
  rows: PreviewRow[];
  totalLines: number;
} {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [], totalLines: 0 };

  const headers = parseCsvLine(lines[0]);
  const dataLines = lines.slice(1).filter((l) => l.trim());

  const rows: PreviewRow[] = [];
  for (let i = 0; i < Math.min(5, dataLines.length); i++) {
    const values = parseCsvLine(dataLines[i]);
    const row: PreviewRow = {};
    for (let j = 0; j < headers.length && j < values.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row);
  }

  return { headers, rows, totalLines: dataLines.length };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

interface PreviewData {
  filename: string;
  headers: string[];
  rows: PreviewRow[];
  totalRows: number;
}

function PreviewCard({
  state,
  preview,
  onImport,
  onCancel,
}: {
  state: ImportState;
  preview: PreviewData;
  onImport: () => void;
  onCancel: () => void;
}) {
  const isImporting = state.status === "importing";
  const isPreview = state.status === "preview";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" />
          {isPreview
            ? preview.filename
            : `Importing... ${isImporting ? state.current : 0} of ${preview.totalRows}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Typography.Muted className="text-sm text-muted-foreground">
            {preview.totalRows} row
            {preview.totalRows !== 1 ? "s" : ""} found
            {isPreview && " — showing first 5"}
          </Typography.Muted>
          {isPreview && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={onImport}>
                <Upload className="size-4" />
                Import {preview.totalRows} Customer
                {preview.totalRows !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>

        {isImporting && (
          <Progress value={(state.current / preview.totalRows) * 100} className="h-2" />
        )}

        {preview.rows.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row, i) => (
                  <TableRow key={`item-${i}`}>
                    {preview.headers.map((header) => (
                      <TableCell key={header} className="max-w-48 truncate">
                        {row[header] ?? ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportCustomersPage() {
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId ?? null;
  const t = useTranslations("customers");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ status: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const fileContentRef = useRef<string>("");
  const previewRef = useRef<{
    filename: string;
    headers: string[];
    rows: PreviewRow[];
    totalRows: number;
  } | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        toast.error("Only .csv files are accepted");
        return;
      }

      const content = await file.text();
      if (!content.trim()) {
        toast.error("CSV file is empty");
        return;
      }

      fileContentRef.current = content;
      const { headers, rows, totalLines } = parsePreview(content);

      if (headers.length === 0) {
        toast.error("CSV file has no valid headers");
        return;
      }

      previewRef.current = {
        filename: file.name,
        headers,
        rows,
        totalRows: totalLines,
      };

      setState({
        status: "preview",
        filename: file.name,
        headers,
        rows,
        totalRows: totalLines,
      });
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      handleFile(event.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handlePicker = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(event.target.files?.[0]);
    },
    [handleFile],
  );

  const handleImport = useCallback(async () => {
    if (!orgId || !previewRef.current) return;

    const total = previewRef.current.totalRows;
    const filename = previewRef.current.filename;

    setState({ status: "importing", total, current: 0 });

    try {
      const formData = new FormData();
      const blob = new Blob([fileContentRef.current], { type: "text/csv" });
      formData.append("file", blob, filename);

      const res = await fetch(`/api/organizations/${orgId}/customers/import`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.error) {
        setState({ status: "error", message: json.error.message });
        return;
      }

      const result = json.data as {
        imported: number;
        errors: { row: number; message: string }[];
      };

      setState({
        status: "done",
        imported: result.imported,
        errors: result.errors,
      });

      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} customers`);
      }
    } catch {
      setState({ status: "error", message: "Failed to import customers" });
      toast.error("Failed to import customers");
    }
  }, [orgId]);

  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const resetImport = useCallback(() => {
    setState({ status: "idle" });
    fileContentRef.current = "";
    previewRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  if (orgQuery.isLoading) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (orgQuery.error || !orgId) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <Breadcrumb
          items={[
            { label: t("title"), href: "/dashboard/customers" },
            { label: "Import" },
          ]}
        />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <Typography.Text className="text-sm text-destructive">
              {orgQuery.error?.message ?? "No organization found"}
            </Typography.Text>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: t("title"), href: "/dashboard/customers" },
          { label: "Import" },
        ]}
      />

      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/customers" />}
          variant="ghost"
          size="icon-xs"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">Import Customers</Typography.H1>
          <Typography.Muted className="text-sm text-muted-foreground">
            Upload a CSV file to create customers in bulk
          </Typography.Muted>
        </div>
      </div>

      {state.status === "idle" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="csv-file-input"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
              >
                <Upload className="size-10 text-muted-foreground/50" />
                <div className="text-center">
                  <Typography.Text className="font-medium">
                    Drag and drop a CSV file here, or click to browse
                  </Typography.Text>
                  <Typography.Muted className="mt-1 text-sm text-muted-foreground">
                    Only .csv files with customer data are accepted
                  </Typography.Muted>
                </div>
              </label>
              <input
                id="csv-file-input"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handlePicker}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="size-4" />
              Download Sample CSV Template
            </Button>
          </div>
        </>
      )}

      {previewRef.current &&
        (state.status === "preview" || state.status === "importing") && (
          <PreviewCard
            state={state}
            preview={previewRef.current}
            onImport={handleImport}
            onCancel={resetImport}
          />
        )}

      {state.status === "importing" && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="size-5 animate-spin text-primary" />
            <Typography.Muted className="text-sm text-muted-foreground">
              Processing {state.total} customer{state.total !== 1 ? "s" : ""}...
            </Typography.Muted>
          </CardContent>
        </Card>
      )}

      {state.status === "done" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-5 text-primary" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Typography.Text className="text-lg font-semibold">
                Successfully imported {state.imported} customer
                {state.imported !== 1 ? "s" : ""}
              </Typography.Text>

              {state.errors.length > 0 && (
                <div>
                  <Typography.H3 className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="size-4" />
                    {state.errors.length} error{state.errors.length !== 1 ? "s" : ""}
                  </Typography.H3>
                  <div className="max-h-48 overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.errors.map((err, i) => (
                          <TableRow key={`item-${i}`}>
                            <TableCell className="font-mono text-xs">
                              {err.row}
                            </TableCell>
                            <TableCell className="text-sm">{err.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              render={<Link href="/dashboard/customers" />}
              variant="outline"
            >
              Back to Customers
            </Button>
            <Button onClick={resetImport}>Import Another File</Button>
          </div>
        </>
      )}

      {state.status === "error" && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <XCircle className="size-5" />
              Import Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Typography.Text className="text-sm text-destructive">{state.message}</Typography.Text>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetImport}>
                Try Again
              </Button>
              <Button
                render={<Link href="/dashboard/customers" />}
                variant="ghost"
              >
                Back to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
