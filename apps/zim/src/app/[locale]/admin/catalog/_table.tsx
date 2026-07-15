"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMnt } from "@/lib/format";
import {
  clearRepricingFlagAction,
  syncCatalogAction,
  togglePackageAction,
} from "./actions";

interface Row {
  id: string;
  providerPackageId: string;
  name: string;
  regionName: string;
  costUsd: number;
  retailMnt: number | null;
  isEnabled: boolean;
  isArchived: boolean;
  needsRepricing: boolean;
}

export function CatalogTable({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const sync = () =>
    startTransition(async () => {
      const result = await syncCatalogAction();
      setSyncMessage(
        `Synced: +${result.inserted} new, ${result.updated} updated, ${result.archived} archived` +
          (result.repriced.length
            ? `, ${result.repriced.length} cost changes`
            : ""),
      );
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Catalog</h1>
        <Button onClick={sync} disabled={pending}>
          {pending ? "Syncing…" : "Sync from provider"}
        </Button>
      </div>
      {syncMessage && (
        <p className="rounded-lg bg-muted p-2 text-sm">{syncMessage}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Region</TableHead>
            <TableHead className="text-right">Cost USD</TableHead>
            <TableHead className="text-right">Retail ₮</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={row.isArchived ? "opacity-50" : undefined}
            >
              <TableCell>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.providerPackageId}
                </p>
              </TableCell>
              <TableCell>{row.regionName}</TableCell>
              <TableCell className="text-right">
                ${row.costUsd.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.retailMnt !== null ? formatMnt(row.retailMnt) : "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {row.isArchived && (
                    <Badge variant="secondary">archived</Badge>
                  )}
                  {row.needsRepricing && (
                    <button
                      type="button"
                      title="Provider cost changed — click to acknowledge"
                      onClick={() =>
                        startTransition(() => clearRepricingFlagAction(row.id))
                      }
                    >
                      <Badge variant="destructive">repricing</Badge>
                    </button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {!row.isArchived && (
                  <Button
                    size="sm"
                    variant={row.isEnabled ? "outline" : "default"}
                    disabled={pending}
                    onClick={() =>
                      startTransition(() =>
                        togglePackageAction(row.id, !row.isEnabled),
                      )
                    }
                  >
                    {row.isEnabled ? "Disable" : "Enable"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No packages — run a sync
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
