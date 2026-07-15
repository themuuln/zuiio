"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMnt } from "@/lib/format";
import { deactivateRuleAction, upsertRuleAction } from "./actions";

interface Rule {
  id: string;
  scope: "global" | "region" | "package";
  target: string;
  markupPercent: number;
  note: string | null;
}

interface PreviewRow {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  costUsd: number;
  costMnt: number;
  markupPercent: number;
  retailMnt: number;
  marginMnt: number;
  minMarginApplied: boolean;
}

interface Option {
  id: string;
  name: string;
}

export function PricingManager({
  rules,
  preview,
  regionOptions,
  packageOptions,
  settings,
}: {
  rules: Rule[];
  preview: PreviewRow[];
  regionOptions: Option[];
  packageOptions: Option[];
  settings: { fxRate: number; minMarginPercent: number; roundingStep: number };
}) {
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState<"global" | "region" | "package">("region");
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  const previewSelected = useMemo(
    () => preview.find((p) => p.id === selectedPackage) ?? preview[0],
    [preview, selectedPackage],
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Pricing rules</h1>
      <p className="text-sm text-muted-foreground">
        FX: 1 USD = {settings.fxRate.toLocaleString()}₮ · min margin{" "}
        {settings.minMarginPercent}% · prices rounded up to ₮
        {settings.roundingStep}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 font-medium">Active rules</p>
            <div className="flex flex-col gap-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
                >
                  <span>
                    <Badge
                      variant={
                        rule.scope === "global" ? "default" : "secondary"
                      }
                    >
                      {rule.scope}
                    </Badge>{" "}
                    {rule.target} → <strong>+{rule.markupPercent}%</strong>
                    {rule.note && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {rule.note}
                      </span>
                    )}
                  </span>
                  {rule.scope !== "global" && (
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => deactivateRuleAction(rule.id))
                      }
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="mb-3 font-medium">New rule</p>
            <form
              action={(formData) =>
                startTransition(() => upsertRuleAction(formData))
              }
              className="flex flex-col gap-3"
            >
              <div className="flex gap-2">
                {(["global", "region", "package"] as const).map((s) => (
                  <label
                    key={s}
                    className={`cursor-pointer rounded-full px-3 py-1 text-sm ${scope === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={s}
                      checked={scope === s}
                      onChange={() => setScope(s)}
                      className="sr-only"
                    />
                    {s}
                  </label>
                ))}
              </div>

              {scope === "region" && (
                <select
                  name="regionId"
                  required
                  className="h-9 rounded-lg border bg-background px-2 text-sm"
                >
                  {regionOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
              {scope === "package" && (
                <select
                  name="packageId"
                  required
                  className="h-9 rounded-lg border bg-background px-2 text-sm"
                >
                  {packageOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="markupPercent">Markup %</Label>
                <Input
                  id="markupPercent"
                  name="markupPercent"
                  type="number"
                  step="0.5"
                  min="0"
                  max="500"
                  required
                  placeholder="20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note">Note</Label>
                <Input id="note" name="note" placeholder="optional" />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save rule"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Saving replaces the previous active rule for the same target.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {previewSelected && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 font-medium">Price preview</p>
            <select
              value={previewSelected.id}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="mb-3 h-9 w-full max-w-md rounded-lg border bg-background px-2 text-sm"
            >
              {preview.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.regionName} — {p.name}
                </option>
              ))}
            </select>
            <p className="text-sm">
              ${previewSelected.costUsd.toFixed(2)} →{" "}
              {formatMnt(previewSelected.costMnt)} cost → +
              {previewSelected.markupPercent}% markup
              {previewSelected.minMarginApplied &&
                ` → min-margin floor ${settings.minMarginPercent}%`}{" "}
              → round ↑ ₮{settings.roundingStep} ={" "}
              <strong className="text-base">
                {formatMnt(previewSelected.retailMnt)}
              </strong>{" "}
              <span className="text-muted-foreground">
                (margin {formatMnt(previewSelected.marginMnt)})
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Markup</TableHead>
            <TableHead className="text-right">Retail</TableHead>
            <TableHead className="text-right">Margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {row.regionName} — {row.name}
              </TableCell>
              <TableCell className="text-right">
                ${row.costUsd.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                +{row.markupPercent}%
                {row.minMarginApplied && (
                  <Badge variant="secondary" className="ml-1">
                    floor
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMnt(row.retailMnt)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatMnt(row.marginMnt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
