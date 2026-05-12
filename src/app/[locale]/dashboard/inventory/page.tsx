"use client";

import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Package,
  Pencil,
  Plus,
  Truck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────

type Tab = "parts" | "movements" | "suppliers" | "purchase-orders";

type Part = {
  id: string;
  name: string;
  part_number: string | null;
  category: string | null;
  description: string | null;
  unit: string;
  default_price: number | null;
  is_active: boolean;
};

type Balance = {
  part_id: string;
  part_name: string;
  part_number: string | null;
  category: string | null;
  unit: string;
  default_price: number | null;
  quantity_on_hand: number;
};

type Movement = {
  id: string;
  part_id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number | null;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
};

type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
};

type PurchaseOrder = {
  id: string;
  order_number: string;
  supplier: { name: string } | null;
  status: string;
  order_date: string;
  expected_at: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
};

type POItem = {
  id: string;
  part_id: string;
  part_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
};

// ── Movement labels ───────────────────────────────────────────

const MOVEMENT_LABELS: Record<string, string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  return: "Return",
  waste: "Waste",
};

const MOVEMENT_COLORS: Record<string, string> = {
  purchase: "text-green-600 bg-green-50",
  sale: "text-red-600 bg-red-50",
  adjustment: "text-blue-600 bg-blue-50",
  transfer_in: "text-purple-600 bg-purple-50",
  transfer_out: "text-purple-600 bg-purple-50",
  return: "text-amber-600 bg-amber-50",
  waste: "text-gray-600 bg-gray-50",
};

const PO_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  ordered: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partial: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: "parts", label: "Parts & Stock", icon: Package },
  { key: "movements", label: "Movements", icon: ClipboardList },
  { key: "suppliers", label: "Suppliers", icon: Building2 },
  { key: "purchase-orders", label: "Purchase Orders", icon: Truck },
];

// ── Helpers ───────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("mn-MN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMNT(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("mn-MN").format(n);
}

// ── Loading Skeleton ──────────────────────────────────────────

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function InventoryPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("parts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parts data
  const [parts, setParts] = useState<Part[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);

  // Movements
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementFilter, setMovementFilter] = useState("");

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [showAddPO, setShowAddPO] = useState(false);
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [poItems, setPoItems] = useState<Record<string, POItem[]>>({});
  const [loadingPOItems, setLoadingPOItems] = useState<string | null>(null);

  // Part thresholds
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");

  // ── Fetch org ID ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) setOrgId(id);
        else setError("No organization found");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch data ─────────────────────────────────────────────
  const fetchParts = useCallback(async () => {
    if (!orgId) return;
    try {
      const [partsRes, balancesRes, thresholdsRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/inventory?type=parts`),
        fetch(`/api/organizations/${orgId}/inventory?type=balances`),
        fetch(`/api/organizations/${orgId}/inventory?type=thresholds`),
      ]);
      const [partsJson, balancesJson, thresholdsJson] = await Promise.all([
        partsRes.json(),
        balancesRes.json(),
        thresholdsRes.json(),
      ]);
      if (!partsJson.error) setParts(partsJson.data ?? []);
      if (!balancesJson.error) setBalances(balancesJson.data ?? []);
      if (!thresholdsJson.error) {
        const map: Record<string, number> = {};
        for (const t of thresholdsJson.data ?? []) {
          map[t.part_id] = t.minimum_quantity;
        }
        setThresholds(map);
      }
    } catch {
      toast.error("Failed to load parts");
    }
  }, [orgId]);

  const fetchMovements = useCallback(async () => {
    if (!orgId) return;
    try {
      const url = `/api/organizations/${orgId}/inventory?type=movements${movementFilter ? `&movement_type=${movementFilter}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.error) setMovements(json.data ?? []);
    } catch {
      toast.error("Failed to load movements");
    }
  }, [orgId, movementFilter]);

  const fetchSuppliers = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=suppliers`);
      const json = await res.json();
      if (!json.error) setSuppliers(json.data ?? []);
    } catch {
      toast.error("Failed to load suppliers");
    }
  }, [orgId]);

  const fetchPOs = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=purchase-orders`);
      const json = await res.json();
      if (!json.error) setPurchaseOrders(json.data ?? []);
    } catch {
      toast.error("Failed to load purchase orders");
    }
  }, [orgId]);

  const fetchPOItems = useCallback(async (poId: string) => {
    setLoadingPOItems(poId);
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=purchase-order-items&po_id=${poId}`);
      const json = await res.json();
      if (!json.error) setPoItems((prev) => ({ ...prev, [poId]: json.data ?? [] }));
    } catch {
      toast.error("Failed to load PO items");
    } finally {
      setLoadingPOItems(null);
    }
  }, [orgId]);

  // Load data on orgId + tab changes
  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    const load = async () => {
      try {
        if (tab === "parts") await fetchParts();
        else if (tab === "movements") await fetchMovements();
        else if (tab === "suppliers") await fetchSuppliers();
        else if (tab === "purchase-orders") await fetchPOs();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId, tab, fetchParts, fetchMovements, fetchSuppliers, fetchPOs]);

  // ── Part CRUD ──────────────────────────────────────────────
  async function handleAddPart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=part`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          part_number: form.get("part_number") || undefined,
          category: form.get("category") || undefined,
          description: form.get("description") || undefined,
          unit: form.get("unit") || "piece",
          default_price: form.get("default_price") ? Number(form.get("default_price")) : undefined,
        }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error.message); return; }
      toast.success("Part created");
      setShowAddPart(false);
      fetchParts();
    } catch {
      toast.error("Failed to create part");
    }
  }

  // ── Movement ───────────────────────────────────────────────
  async function handleAddMovement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_id: form.get("part_id"),
          movement_type: form.get("movement_type"),
          quantity: Number(form.get("quantity")),
          unit_cost: form.get("unit_cost") ? Number(form.get("unit_cost")) : undefined,
          notes: form.get("notes") || undefined,
        }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error.message); return; }
      toast.success("Movement recorded");
      setShowAddMovement(false);
      fetchParts();
      fetchMovements();
    } catch {
      toast.error("Failed to record movement");
    }
  }

  // ── Supplier CRUD ──────────────────────────────────────────
  async function handleSaveSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      contact_person: form.get("contact_person") || undefined,
      phone: form.get("phone") || undefined,
      email: form.get("email") || undefined,
      address: form.get("address") || undefined,
      tax_id: form.get("tax_id") || undefined,
      notes: form.get("notes") || undefined,
    };

    try {
      if (editingSupplier) {
        const res = await fetch(
          `/api/organizations/${orgId}/inventory?type=supplier&id=${editingSupplier.id}`,
          { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
        );
        const json = await res.json();
        if (json.error) { toast.error(json.error.message); return; }
        toast.success("Supplier updated");
      } else {
        const res = await fetch(`/api/organizations/${orgId}/inventory?type=supplier`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.error) { toast.error(json.error.message); return; }
        toast.success("Supplier created");
      }
      setShowAddSupplier(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch {
      toast.error("Failed to save supplier");
    }
  }

  async function handleDeleteSupplier(id: string) {
    if (!confirm("Delete this supplier?")) return;
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/inventory?type=supplier&id=${id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) { toast.error(json.error.message); return; }
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch {
      toast.error("Failed to delete supplier");
    }
  }

  // ── Purchase Orders ────────────────────────────────────────
  async function handleCreatePO(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const items = [];
      const itemCount = Number(form.get("item_count") || 0);
      for (let i = 0; i < itemCount; i++) {
        const partId = form.get(`item_${i}_part_id`);
        if (!partId) continue;
        items.push({
          part_id: partId as string,
          quantity_ordered: Number(form.get(`item_${i}_qty`) || 1),
          unit_cost: Number(form.get(`item_${i}_cost`) || 0),
        });
      }
      if (!items.length) { toast.error("Add at least one item"); return; }

      const res = await fetch(`/api/organizations/${orgId}/inventory?type=purchase-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: form.get("supplier_id") || undefined,
          order_number: form.get("order_number"),
          notes: form.get("notes") || undefined,
          items,
        }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error.message); return; }
      toast.success("Purchase order created");
      setShowAddPO(false);
      fetchPOs();
    } catch {
      toast.error("Failed to create PO");
    }
  }

  async function handleReceivePO(poId: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=receive-po`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_id: poId }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error.message); return; }
      toast.success("PO received");
      fetchPOs();
      fetchParts();
    } catch {
      toast.error("Failed to receive PO");
    }
  }

  async function handleTogglePO(poId: string) {
    if (expandedPO === poId) {
      setExpandedPO(null);
    } else {
      setExpandedPO(poId);
      if (!poItems[poId]) fetchPOItems(poId);
    }
  }

  // ── Threshold ──────────────────────────────────────────────
  async function handleSaveThreshold(partId: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/inventory?type=threshold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part_id: partId, minimum_quantity: Number(thresholdValue) || 0 }),
      });
      const json = await res.json();
      if (json.error) { toast.error(json.error.message); return; }
      toast.success("Threshold saved");
      setThresholds((prev) => ({ ...prev, [partId]: Number(thresholdValue) || 0 }));
      setEditingThreshold(null);
    } catch {
      toast.error("Failed to save threshold");
    }
  }

  // ── Build balance map ──────────────────────────────────────
  const balanceMap = new Map<string, Balance>();
  for (const b of balances) {
    balanceMap.set(b.part_id, b);
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading && !orgId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <TableSkeleton />
      </div>
    );
  }

  if (error && !orgId) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Manage parts, stock, suppliers, and purchase orders</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors min-h-[48px] ${
                tab === t.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Parts & Stock ───────────────────────────────── */}
      {tab === "parts" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{parts.length} parts</p>
            <div className="flex gap-2">
              <Button size="lg" onClick={() => { setShowAddMovement(true); }}>
                <ClipboardList className="size-4" />
                Record Movement
              </Button>
              <Button size="lg" onClick={() => { setShowAddPart(true); }}>
                <Plus className="size-4" />
                Add Part
              </Button>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : parts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <Package className="size-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No parts in catalog</p>
                <Button variant="outline" onClick={() => setShowAddPart(true)}>
                  Add your first part
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Part #</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Default Price</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">On Hand</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.filter(p => p.is_active).map((part) => {
                      const bal = balanceMap.get(part.id);
                      const qty = bal?.quantity_on_hand ?? 0;
                      const min = thresholds[part.id] ?? 5;
                      const status =
                        qty <= 0
                          ? "out"
                          : qty < min
                            ? "low"
                            : "ok";
                      return (
                        <tr key={part.id} className="border-b border-border transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{part.name}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                            {part.part_number ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{part.category ?? "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {part.default_price ? `₮${formatMNT(part.default_price)}` : "—"}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                            status === "out" ? "text-red-600" : status === "low" ? "text-amber-600" : "text-green-600"
                          }`}>
                            {qty} {part.unit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              status === "out"
                                ? "bg-red-50 text-red-700"
                                : status === "low"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-green-50 text-green-700"
                            }`}>
                              {status === "out" && <AlertTriangle className="size-3" />}
                              {status === "out" ? "Out" : status === "low" ? "Low" : "In Stock"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {editingThreshold === part.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  value={thresholdValue}
                                  onChange={(e) => setThresholdValue(e.target.value)}
                                  className="h-8 w-16 text-center"
                                  min={0}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveThreshold(part.id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingThreshold(part.id);
                                  setThresholdValue(String(thresholds[part.id] ?? 5));
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                {thresholds[part.id] ?? 5}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Movements ──────────────────────────────────── */}
      {tab === "movements" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Recent stock movements</p>
            <div className="flex flex-wrap gap-2">
              {["", "purchase", "sale", "adjustment", "return", "waste"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMovementFilter(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    movementFilter === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t ? MOVEMENT_LABELS[t] ?? t : "All"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : movements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <ClipboardList className="size-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No movements recorded</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qty</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Unit Cost</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ref</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b border-border">
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(m.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${MOVEMENT_COLORS[m.movement_type] ?? ""}`}>
                            {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">{m.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {m.unit_cost ? `₮${formatMNT(m.unit_cost)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{m.reference_type ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                          {m.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Suppliers ──────────────────────────────────── */}
      {tab === "suppliers" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{suppliers.length} suppliers</p>
            <Button size="lg" onClick={() => { setShowAddSupplier(true); setEditingSupplier(null); }}>
              <Plus className="size-4" />
              Add Supplier
            </Button>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : suppliers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <Building2 className="size-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No suppliers</p>
                <Button variant="outline" onClick={() => { setShowAddSupplier(true); setEditingSupplier(null); }}>
                  Add your first supplier
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.filter(s => s.is_active).map((s) => (
                      <tr key={s.id} className="border-b border-border transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.contact_person ?? "—"}</td>
                        <td className="px-4 py-3">{s.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => { setEditingSupplier(s); setShowAddSupplier(true); }}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(s.id)}
                              className="p-1 text-destructive/70 hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Purchase Orders ────────────────────────────── */}
      {tab === "purchase-orders" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{purchaseOrders.length} orders</p>
            <Button size="lg" onClick={() => { setShowAddPO(true); }}>
              <Plus className="size-4" />
              Create PO
            </Button>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : purchaseOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16">
                <Truck className="size-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No purchase orders</p>
                <Button variant="outline" onClick={() => setShowAddPO(true)}>
                  Create your first PO
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {purchaseOrders.map((po) => (
                <Card key={po.id}>
                  <button
                    type="button"
                    onClick={() => handleTogglePO(po.id)}
                    className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{po.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {po.supplier?.name ?? "No supplier"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${PO_STATUS_COLORS[po.status] ?? ""}`}>
                      {PO_STATUS_LABELS[po.status] ?? po.status}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">₮{formatMNT(po.total_amount)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(po.created_at)}</span>
                  </button>

                  {expandedPO === po.id && (
                    <div className="border-t border-border px-6 py-4">
                      {loadingPOItems === po.id ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <div className="space-y-2">
                          {(poItems[po.id] ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No items</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Part</th>
                                  <th className="py-2 pr-4 text-right font-medium text-muted-foreground">Ordered</th>
                                  <th className="py-2 pr-4 text-right font-medium text-muted-foreground">Received</th>
                                  <th className="py-2 text-right font-medium text-muted-foreground">Unit Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(poItems[po.id] ?? []).map((item) => (
                                  <tr key={item.id} className="border-b border-border/50">
                                    <td className="py-2 pr-4">{item.part_name}</td>
                                    <td className="py-2 pr-4 text-right tabular-nums">{item.quantity_ordered}</td>
                                    <td className="py-2 pr-4 text-right tabular-nums">{item.quantity_received}</td>
                                    <td className="py-2 text-right tabular-nums">₮{formatMNT(item.unit_cost)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {po.status !== "received" && po.status !== "cancelled" && (
                            <div className="mt-3 flex justify-end">
                              <Button size="sm" onClick={() => handleReceivePO(po.id)}>
                                <Truck className="size-3" />
                                Receive Stock
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}

      {/* Add Part Modal */}
      {showAddPart && (
        <Modal title="Add Part" onClose={() => setShowAddPart(false)}>
          <form onSubmit={handleAddPart} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input name="name" required placeholder="Oil filter" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Part Number</label>
                <Input name="part_number" placeholder="OF-101" className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input name="category" placeholder="Filters" className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input name="description" placeholder="Optional description" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Input name="unit" defaultValue="piece" className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Price (₮)</label>
                <Input name="default_price" type="number" min="0" className="h-11" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddPart(false)}>Cancel</Button>
              <Button type="submit">Create Part</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Movement Modal */}
      {showAddMovement && (
        <Modal title="Record Stock Movement" onClose={() => setShowAddMovement(false)}>
          <form onSubmit={handleAddMovement} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Part *</label>
              <select
                name="part_id"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select part</option>
                {parts.filter(p => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.part_number ?? "no #"})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Movement Type *</label>
              <select
                name="movement_type"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Select type</option>
                <option value="purchase">Purchase (stock in)</option>
                <option value="sale">Sale (stock out)</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return to Supplier</option>
                <option value="waste">Waste / Damaged</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input name="quantity" type="number" required min="1" className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Cost (₮)</label>
                <Input name="unit_cost" type="number" min="0" className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input name="notes" placeholder="Optional notes" className="h-11" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddMovement(false)}>Cancel</Button>
              <Button type="submit">Record</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add/Edit Supplier Modal */}
      {showAddSupplier && (
        <Modal title={editingSupplier ? "Edit Supplier" : "Add Supplier"} onClose={() => { setShowAddSupplier(false); setEditingSupplier(null); }}>
          <form onSubmit={handleSaveSupplier} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input name="name" required defaultValue={editingSupplier?.name ?? ""} placeholder="ABC Auto Parts" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input name="contact_person" defaultValue={editingSupplier?.contact_person ?? ""} className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input name="phone" defaultValue={editingSupplier?.phone ?? ""} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" defaultValue={editingSupplier?.email ?? ""} className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input name="address" defaultValue={editingSupplier?.address ?? ""} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax ID</label>
                <Input name="tax_id" defaultValue={editingSupplier?.tax_id ?? ""} className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input name="notes" defaultValue={editingSupplier?.notes ?? ""} className="h-11" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowAddSupplier(false); setEditingSupplier(null); }}>Cancel</Button>
              <Button type="submit">{editingSupplier ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create PO Modal */}
      {showAddPO && (
        <Modal title="Create Purchase Order" onClose={() => setShowAddPO(false)}>
          <form onSubmit={handleCreatePO} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Number *</label>
                <Input name="order_number" required placeholder="PO-001" className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier</label>
                <select name="supplier_id" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="">No supplier</option>
                  {suppliers.filter(s => s.is_active).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input name="notes" placeholder="Optional notes" className="h-11" />
            </div>
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Items</p>
              </div>
              <POItemEditor parts={parts} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddPO(false)}>Cancel</Button>
              <Button type="submit">Create PO</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── PO Item Editor ───────────────────────────────────────────

function POItemEditor({ parts }: { parts: Part[] }) {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-3">
      <input type="hidden" name="item_count" value={count} />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-end gap-2 border-b border-border pb-2">
          <div className="flex-1 space-y-1">
            <span className="text-xs text-muted-foreground">Part</span>
            <select
              name={`item_${i}_part_id`}
              required
              className="h-9 w-full rounded border border-input bg-background px-2 text-sm"
            >
              <option value="">Select</option>
              {parts.filter(p => p.is_active).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="w-20 space-y-1">
            <span className="text-xs text-muted-foreground">Qty</span>
            <input
              type="number"
              name={`item_${i}_qty`}
              defaultValue={1}
              min={1}
              className="h-9 w-full rounded border border-input bg-background px-2 text-sm text-center"
            />
          </div>
          <div className="w-24 space-y-1">
            <span className="text-xs text-muted-foreground">Cost</span>
            <input
              type="number"
              name={`item_${i}_cost`}
              defaultValue={0}
              min={0}
              className="h-9 w-full rounded border border-input bg-background px-2 text-sm text-right"
            />
          </div>
          <button
            type="button"
            onClick={() => setCount((c) => c - 1)}
            className="mb-0.5 p-1 text-destructive/70 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <Plus className="size-3" />
        Add item
      </button>
    </div>
  );
}
