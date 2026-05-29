"use client";

import { Check, Clock, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { formatCurrency } from "@/lib/utils";
import { useWizardContext } from "./wizard-context";
import { Typography } from "@/components/ui/typography";
import { PartForm } from "@/components/inventory/part-form";

export function PartsSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");
  const [showQuickPart, setShowQuickPart] = useState(false);

  const filteredParts = ctx.partSearch
    ? ctx.partsCatalog.filter(
        (p) =>
          p.name.toLowerCase().includes(ctx.partSearch.toLowerCase()) ||
          (p.part_number &&
            p.part_number
              .toLowerCase()
              .includes(ctx.partSearch.toLowerCase())) ||
          (p.category &&
            p.category.toLowerCase().includes(ctx.partSearch.toLowerCase())),
      )
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("parts")}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={ctx.addPart}
          className="min-h-[var(--ui-touch-target)]"
        >
          <Plus className="size-4" /> {t("addPart")}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* From last visit parts */}
        {ctx.showLastVisitSuggestions &&
          (ctx.lastVisitData?.parts.length ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="size-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {t("fromLastVisitParts")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto min-h-[var(--ui-touch-target)]"
                  onClick={ctx.addAllFromLastVisit}
                >
                  <Check className="size-3.5 mr-1" />
                  {t("addAll")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ctx.lastVisitData?.parts.map((part, i) => (
                  <Button
                    key={part.part_name ?? `lvpart-${i}`}
                    variant="outline"
                    onClick={() => {
                      ctx.setPartLines((prev) => [
                        ...prev,
                        {
                          part_name: part.part_name,
                          part_number: part.part_number ?? "",
                          quantity: part.quantity,
                          unit_price: part.unit_price,
                          final_price: part.unit_price * part.quantity,
                          last_price: part.unit_price,
                        },
                      ]);
                    }}
                    data-slot="touch-target"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm border-amber-200 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-900/30"
                  >
                    <span className="font-medium">{part.part_name}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(part.unit_price)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Parts catalog search */}
        <SearchInput
          placeholder={t("searchPartsToAdd")}
          loading={false}
          onSearch={ctx.setPartSearch}
          debounceMs={300}
        />
        {ctx.partSearch && (
          <div className="flex flex-col gap-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {/* Org-level parts */}
            {filteredParts.slice(0, 12).map((part) => {
              const isAdded = ctx.partLines.some(
                (p) =>
                  p.part_name.toLowerCase() === part.name.toLowerCase() &&
                  part.name,
              );
              return (
                <Button
                  variant="ghost"
                  key={part.id}
                  onClick={() => {
                    if (!isAdded) {
                      ctx.addPartFromCatalog(part);
                    }
                  }}
                  disabled={isAdded}
                  className={`w-full justify-between p-3 min-h-[48px] h-auto ${
                    isAdded ? "opacity-40" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{part.name}</span>
                    {part.part_number && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        #{part.part_number}
                      </span>
                    )}
                    {part.category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {part.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(part.default_price ?? 0)}
                    </span>
                  </div>
                </Button>
              );
            })}
            {/* Global catalog suggestions (if not in org catalog) */}
            {ctx.globalParts
              .filter(
                (p) =>
                  !ctx.partsCatalog.some(
                    (c) => c.name.toLowerCase() === p.name.toLowerCase(),
                  ) &&
                  (p.name
                    .toLowerCase()
                    .includes(ctx.partSearch.toLowerCase()) ||
                    (p.part_number &&
                      p.part_number
                        .toLowerCase()
                        .includes(ctx.partSearch.toLowerCase())) ||
                    (p.category &&
                      p.category
                        .toLowerCase()
                        .includes(ctx.partSearch.toLowerCase()))),
              )
              .slice(0, 6)
              .map((part) => (
                <Button
                  variant="ghost"
                  key={`global-${part.id}`}
                  onClick={() => {
                    // Add as custom part (from global reference)
                    ctx.setPartLines((prev) => [
                      ...prev,
                      {
                        part_name: part.name,
                        part_number: part.part_number ?? "",
                        quantity: 1,
                        unit_price: 0,
                        final_price: 0,
                      },
                    ]);
                    ctx.setPartSearch("");
                  }}
                  className="w-full justify-between p-3 min-h-[48px] h-auto border-dashed border border-muted-foreground/20"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{part.name}</span>
                    {part.part_number && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        #{part.part_number}
                      </span>
                    )}
                    {part.category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {part.category}
                      </span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground italic">
                      global
                    </span>
                  </div>
                </Button>
              ))}
            {filteredParts.length === 0 &&
              ctx.globalParts.filter(
                (p) =>
                  p.name.toLowerCase().includes(ctx.partSearch.toLowerCase()) ||
                  (p.part_number &&
                    p.part_number
                      .toLowerCase()
                      .includes(ctx.partSearch.toLowerCase())) ||
                  (p.category &&
                    p.category
                      .toLowerCase()
                      .includes(ctx.partSearch.toLowerCase())),
              ).length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  {t("noPartsMatch")}
                </div>
              )}
          </div>
        )}

        {!showQuickPart ? (
          <Button
            variant="outline"
            onClick={() => setShowQuickPart(true)}
            className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
          >
            <Plus className="size-4" />
            Quick Create Part
          </Button>
        ) : (
          <div className="border rounded-lg p-4 bg-muted/20 mt-2">
            <Typography.Text className="text-sm font-semibold mb-3 block">
              New Part
            </Typography.Text>
            <PartForm
              mode="quick"
              onSuccess={(part) => {
                ctx.addPartFromCatalog(part);
                setShowQuickPart(false);
              }}
              onCancel={() => setShowQuickPart(false)}
            />
          </div>
        )}

        {ctx.partLines.length === 0 && !ctx.showLastVisitSuggestions ? (
          <Typography.Muted className="text-sm text-muted-foreground text-center py-3">
            {t("noPartsAdded")}
          </Typography.Muted>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {ctx.partLines.map((part, idx) => {
                const pname = part.part_name.toLowerCase();
                const vehiclePrice = ctx.vehiclePartPrices[pname];
                const partLast = part.part_name
                  ? (vehiclePrice ?? ctx.partHistory[pname])
                  : undefined;
                return (
                  <div
                    key={part.part_number || part.part_name || `wpart-${idx}`}
                    className="flex flex-wrap items-center gap-2 p-3 hover:bg-muted/20"
                  >
                    <div className="flex-1 min-w-[140px]">
                      <Input
                        value={part.part_name}
                        onChange={(e) =>
                          ctx.updatePart(idx, "part_name", e.target.value)
                        }
                        className="h-11"
                        placeholder={t("partName")}
                        aria-label="Part name"
                      />
                      {partLast && (
                        <Typography.Text
                          className={`mt-1 text-[11px] ${part.unit_price <= partLast ? "text-green-600" : "text-amber-600"}`}
                        >
                          {part.unit_price <= partLast ? "✓ " : "↑ "}
                          {t("lastSoldShort", {
                            price: formatCurrency(partLast),
                          })}
                        </Typography.Text>
                      )}
                    </div>
                    <NumericKeypad
                      value={part.quantity}
                      onChange={(val) =>
                        ctx.updatePart(idx, "quantity", Math.round(val) || 1)
                      }
                    >
                      <Input
                        value={part.quantity}
                        className="w-16 h-11 text-center cursor-pointer"
                        min={1}
                        aria-label="Quantity"
                      />
                    </NumericKeypad>
                    <NumericKeypad
                      value={part.unit_price}
                      onChange={(val) => ctx.updatePart(idx, "unit_price", val)}
                    >
                      <Input
                        value={part.unit_price || ""}
                        className="w-28 h-11 cursor-pointer"
                        placeholder={t("unitPrice")}
                        aria-label="Unit price"
                      />
                    </NumericKeypad>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(part.final_price)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => ctx.removePart(idx)}
                      data-slot="touch-target"
                      className="min-w-[44px]"
                      aria-label="Remove part"
                    >
                      <Trash2 className="size-5 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
