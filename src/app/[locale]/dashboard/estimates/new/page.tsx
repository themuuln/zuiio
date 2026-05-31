"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { CustomerSelect } from "@/components/work-orders/customer-select";
import { VehicleSelect } from "@/components/work-orders/vehicle-select";
import type { Customer, Vehicle } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────

type ItemType = "service" | "part" | "custom";

interface QuoteLine {
  id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  line_total: number;
}

let lineIdCounter = 0;
function newLineId() {
  return `line_${++lineIdCounter}_${Date.now()}`;
}

function calculateLineTotal(line: {
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
}): number {
  const gross = line.unit_price * line.quantity;
  const pctDisc = gross * (line.discount_percentage / 100);
  const flatDisc = line.discount_amount;
  return Math.max(gross - pctDisc - flatDisc, 0);
}

// ── Form Schema ────────────────────────────────────────────────

const quoteSchema = z.object({
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type QuoteValues = z.infer<typeof quoteSchema>;

// ── Main Component ─────────────────────────────────────────────

export default function NewEstimatePage() {
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId ?? "";
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [services, setServices] = useState<
    { id: string; name: string; default_price: number }[]
  >([]);
  const [searchingServices, setSearchingServices] = useState(false);

  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { notes: "", terms: "" },
  });

  // ── Item management ────────────────────────────────────────

  const addServiceLine = (svc: {
    id: string;
    name: string;
    default_price: number;
  }) => {
    setLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        item_type: "service",
        description: svc.name,
        quantity: 1,
        unit_price: Number(svc.default_price),
        discount_amount: 0,
        discount_percentage: 0,
        line_total: Number(svc.default_price),
      },
    ]);
  };

  const addPartLine = (part: {
    id: string;
    part_name: string;
    unit_price: number;
  }) => {
    setLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        item_type: "part",
        description: part.part_name,
        quantity: 1,
        unit_price: Number(part.unit_price),
        discount_amount: 0,
        discount_percentage: 0,
        line_total: Number(part.unit_price),
      },
    ]);
  };

  const addCustomLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: newLineId(),
        item_type: "custom",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        discount_percentage: 0,
        line_total: 0,
      },
    ]);
  };

  const updateLine = (id: string, updates: Partial<QuoteLine>) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        const updated = { ...line, ...updates };
        updated.line_total = calculateLineTotal(updated);
        return updated;
      }),
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  // ── Service catalog search ─────────────────────────────────

  const searchServices = (q: string) => {
    setServiceSearch(q);
    if (!q || q.length < 2) {
      setServices([]);
      return;
    }
    setSearchingServices(true);
    fetch(`/api/organizations/${orgId}/services?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? []))
      .catch(() => setServices([]))
      .finally(() => setSearchingServices(false));
  };

  // ── Totals ──────────────────────────────────────────────────

  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const quoteDiscountAmount = 0; // Could add quote-level discount input
  const quoteDiscountPercent = 0;
  const discountTotal =
    quoteDiscountAmount + subtotal * (quoteDiscountPercent / 100);
  const grandTotal = Math.max(subtotal - discountTotal, 0);

  // ── Submit ──────────────────────────────────────────────────

  const handleSave = async (status: string = "draft") => {
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!vehicle) {
      toast.error("Please select a vehicle");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setSaving(true);
    try {
      const data = form.getValues();
      const res = await fetch(`/api/organizations/${orgId}/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          notes: data.notes || undefined,
          terms: data.terms || undefined,
          status,
          items: lines.map((l) => ({
            item_type: l.item_type,
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount_amount: l.discount_amount,
            discount_percentage: l.discount_percentage,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success("Quote created!");
      router.push(`/dashboard/estimates/${json.data.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create quote",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Parts catalog search (inline) ──────────────────────────

  const [partSearch, setPartSearch] = useState("");
  const [parts, setParts] = useState<
    { id: string; part_name: string; unit_price: number }[]
  >([]);
  const [searchingParts, setSearchingParts] = useState(false);

  const searchParts = (q: string) => {
    setPartSearch(q);
    if (!q || q.length < 2) {
      setParts([]);
      return;
    }
    setSearchingParts(true);
    fetch(`/api/organizations/${orgId}/inventory?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setParts(d.data ?? []))
      .catch(() => setParts([]))
      .finally(() => setSearchingParts(false));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <Typography.H2>Create Quote</Typography.H2>
        <Typography.Text className="text-muted-foreground">
          Build a quote with services and parts. When approved, convert it to a
          work order.
        </Typography.Text>
      </div>

      {/* Customer & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomerSelect
          orgId={orgId}
          selectedCustomer={customer}
          onSelect={setCustomer}
          onClear={() => setCustomer(null)}
        />
        <VehicleSelect
          orgId={orgId}
          customerId={customer?.id ?? null}
          selectedVehicle={vehicle}
          onSelect={setVehicle}
          onClear={() => setVehicle(null)}
        />
      </div>

      {/* Add items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Line Items</span>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger>
                  <Button variant="outline" size="sm">
                    <Plus className="size-4" />
                    Add Service
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Add Service</SheetTitle>
                    <SheetDescription>
                      Search the service catalog
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-3">
                    <SearchInput
                      placeholder="Search services..."
                      onSearch={searchServices}
                      loading={searchingServices}
                      debounceMs={400}
                    />
                    <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                      {services.map((svc) => (
                        <Button
                          key={svc.id}
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto"
                          onClick={() => {
                            addServiceLine(svc);
                            setServiceSearch("");
                            setServices([]);
                          }}
                        >
                          <span className="font-medium">{svc.name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            ₮{Number(svc.default_price).toLocaleString()}
                          </span>
                        </Button>
                      ))}
                      {serviceSearch &&
                        services.length === 0 &&
                        !searchingServices && (
                          <Typography.Text className="text-sm text-muted-foreground p-4 text-center">
                            No services found
                          </Typography.Text>
                        )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet>
                <SheetTrigger>
                  <Button variant="outline" size="sm">
                    <Plus className="size-4" />
                    Add Part
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Add Part</SheetTitle>
                    <SheetDescription>
                      Search the parts catalog
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 space-y-3">
                    <SearchInput
                      placeholder="Search parts..."
                      onSearch={searchParts}
                      loading={searchingParts}
                      debounceMs={400}
                    />
                    <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                      {parts.map((part) => (
                        <Button
                          key={part.id}
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto"
                          onClick={() => {
                            addPartLine(part);
                            setPartSearch("");
                            setParts([]);
                          }}
                        >
                          <span className="font-medium">{part.part_name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            ₮{Number(part.unit_price).toLocaleString()}
                          </span>
                        </Button>
                      ))}
                      {partSearch && parts.length === 0 && !searchingParts && (
                        <Typography.Text className="text-sm text-muted-foreground p-4 text-center">
                          No parts found
                        </Typography.Text>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="sm" onClick={addCustomLine}>
                <Plus className="size-4" />
                Custom
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <Typography.Text className="text-sm text-muted-foreground text-center py-8 block">
              No items yet. Add services, parts, or custom line items above.
            </Typography.Text>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">Disc %</div>
                <div className="col-span-1 text-right">Disc ₮</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 items-center rounded-lg border p-2"
                >
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div className="col-span-3">
                    {line.item_type === "custom" ? (
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.id, { description: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Typography.Text className="text-sm truncate block">
                        {line.description}
                      </Typography.Text>
                    )}
                    {line.item_type !== "custom" && (
                      <Typography.Text className="text-xs text-muted-foreground">
                        {line.item_type}
                      </Typography.Text>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.id, {
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(line.id, {
                          unit_price: Math.max(
                            0,
                            parseInt(e.target.value) || 0,
                          ),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={line.discount_percentage}
                      onChange={(e) =>
                        updateLine(line.id, {
                          discount_percentage: Math.max(
                            0,
                            Math.min(100, parseInt(e.target.value) || 0),
                          ),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={line.discount_amount}
                      onChange={(e) =>
                        updateLine(line.id, {
                          discount_amount: Math.max(
                            0,
                            parseInt(e.target.value) || 0,
                          ),
                        })
                      }
                      className="h-8 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm font-medium">
                    ₮{line.line_total.toLocaleString()}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => removeLine(line.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2 ml-auto w-full max-w-xs">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">₮{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total</span>
              <span className="font-mono">₮{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Notes</FieldLabel>
          <FieldContent>
            <Textarea
              placeholder="Customer-facing notes..."
              rows={3}
              {...form.register("notes")}
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Terms & Conditions</FieldLabel>
          <FieldContent>
            <Textarea
              placeholder="Payment terms, warranty info..."
              rows={3}
              {...form.register("terms")}
            />
          </FieldContent>
        </Field>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave("draft")}
          disabled={saving || lines.length === 0}
        >
          {saving ? "Saving..." : "Save as Draft"}
        </Button>
        <Button
          onClick={() => handleSave("draft")}
          disabled={saving || lines.length === 0}
        >
          {saving ? "Saving..." : "Create Quote"}
        </Button>
      </div>
    </div>
  );
}
