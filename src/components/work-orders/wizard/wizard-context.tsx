"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Customer, ServiceCatalog, Vehicle } from "@/lib/types";

// ── Line Item Types ──

export interface ServiceLine {
  service_catalog_id: string | null;
  name: string;
  base_price: number;
  quantity: number;
  discount_amount_mnt: number;
  discount_percent: number;
  final_price: number;
  last_price?: number;
}

export interface PartLine {
  part_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  final_price: number;
  last_price?: number;
}

export interface MechanicOption {
  id: string;
  fullName: string | null;
  email: string;
}

// ── Context Shape ──

interface WizardState {
  orgId: string | null;
  loading: boolean;
  saving: boolean;

  // Customer
  customerSearch: string;
  customers: Customer[];
  selectedCustomer: Customer | null;
  showQuickCustomer: boolean;
  quickFirstName: string;
  quickLastName: string;
  quickPhone: string;
  customerSearching: boolean;
  creatingCustomer: boolean;
  customerCreateError: string | null;

  // Vehicle
  vehicleSearch: string;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  showQuickVehicle: boolean;
  quickPlate: string;
  quickMake: string;
  quickModel: string;
  quickYear: string;
  vehicleSearching: boolean;
  creatingVehicle: boolean;
  vehicleCreateError: string | null;

  // Services
  catalog: ServiceCatalog[];
  serviceLines: ServiceLine[];
  priceHistory: Record<string, { last_price: number; last_make?: string; last_model?: string }>;
  serviceSearch: string;

  // Parts
  partLines: PartLine[];
  partHistory: Record<string, number>;

  // Mechanic
  mechanics: MechanicOption[];
  selectedMechanic: string;

  // Notes
  description: string;

  // Computed
  servicesTotal: number;
  partsTotal: number;
  grandTotal: number;
  isFormValid: boolean;
}

interface WizardActions {
  setCustomerSearch: (v: string) => void;
  setSelectedCustomer: (c: Customer | null) => void;
  setShowQuickCustomer: (v: boolean) => void;
  setQuickFirstName: (v: string) => void;
  setQuickLastName: (v: string) => void;
  setQuickPhone: (v: string) => void;
  handleSelectCustomer: (c: Customer) => void;
  handleQuickCreateCustomer: () => Promise<void>;

  setVehicleSearch: (v: string) => void;
  setSelectedVehicle: (v: Vehicle | null) => void;
  setShowQuickVehicle: (v: boolean) => void;
  setQuickPlate: (v: string) => void;
  setQuickMake: (v: string) => void;
  setQuickModel: (v: string) => void;
  setQuickYear: (v: string) => void;
  handleQuickCreateVehicle: () => Promise<void>;

  setServiceSearch: (v: string) => void;
  addService: (svc: ServiceCatalog) => void;
  updateService: (
    idx: number,
    field: keyof ServiceLine,
    value: number | string,
  ) => void;
  removeService: (idx: number) => void;

  addPart: () => void;
  updatePart: (
    idx: number,
    field: keyof PartLine,
    value: string | number,
  ) => void;
  removePart: (idx: number) => void;

  setSelectedMechanic: (v: string) => void;
  setDescription: (v: string) => void;

  handleCreate: () => Promise<void>;
}

type WizardContextType = WizardState & WizardActions;

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizardContext() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizardContext must be used within WizardProvider");
  return ctx;
}

function formatMNT(amount: number): string {
  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency: "MNT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Provider ──

export function WizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // #region State
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickFirstName, setQuickFirstName] = useState("");
  const [quickLastName, setQuickLastName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(null);

  // Vehicle
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQuickVehicle, setShowQuickVehicle] = useState(false);
  const [quickPlate, setQuickPlate] = useState("");
  const [quickMake, setQuickMake] = useState("");
  const [quickModel, setQuickModel] = useState("");
  const [quickYear, setQuickYear] = useState("");
  const [vehicleSearching, setVehicleSearching] = useState(false);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [vehicleCreateError, setVehicleCreateError] = useState<string | null>(null);

  // Services
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [priceHistory, setPriceHistory] = useState<
    Record<string, { last_price: number; last_make?: string; last_model?: string }>
  >({});
  const [serviceSearch, setServiceSearch] = useState("");

  // Parts
  const [partLines, setPartLines] = useState<PartLine[]>([]);
  const [partHistory, setPartHistory] = useState<Record<string, number>>({});

  // Mechanic
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState("");

  // Notes
  const [description, setDescription] = useState("");
  // #endregion

  // #region Computed
  const servicesTotal = serviceLines.reduce((s, l) => s + l.final_price, 0);
  const partsTotal = partLines.reduce((s, l) => s + l.final_price, 0);
  const grandTotal = servicesTotal + partsTotal;
  const isFormValid = !!selectedCustomer && !!selectedVehicle && !saving;
  // #endregion

  // #region Customer handlers
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setCustomerSearch("");
      setShowQuickCustomer(false);
      if (orgId) {
        fetch(`/api/organizations/${orgId}/vehicles?customer=${customer.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.data?.length > 0) {
              setVehicles(d.data);
              setVehicleSearch("");
            }
          })
          .catch(() => {});
      }
    },
    [orgId],
  );

  const handleQuickCreateCustomer = async () => {
    if (!orgId || !quickFirstName.trim()) {
      setCustomerCreateError("First name is required");
      return;
    }
    setCreatingCustomer(true);
    setCustomerCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: quickFirstName.trim(),
          last_name: quickLastName.trim() || null,
          phone: quickPhone.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setCustomerCreateError(json.error.message ?? "Failed to create customer");
      } else if (json.data) {
        handleSelectCustomer(json.data);
        setQuickFirstName("");
        setQuickLastName("");
        setQuickPhone("");
        setShowQuickCustomer(false);
      }
    } catch {
      setCustomerCreateError("Network error — please try again");
    } finally {
      setCreatingCustomer(false);
    }
  };
  // #endregion

  // #region Vehicle handlers
  const handleQuickCreateVehicle = async () => {
    if (!orgId || !quickPlate.trim()) {
      setVehicleCreateError("Plate number is required");
      return;
    }
    setCreatingVehicle(true);
    setVehicleCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate_number: quickPlate.trim().toUpperCase(),
          make: quickMake.trim() || "Unknown",
          model: quickModel.trim() || "Unknown",
          year: quickYear ? parseInt(quickYear, 10) : null,
          customer_id: selectedCustomer?.id ?? null,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setVehicleCreateError(json.error.message ?? "Failed to create vehicle");
      } else if (json.data) {
        setSelectedVehicle(json.data);
        setQuickPlate("");
        setQuickMake("");
        setQuickModel("");
        setQuickYear("");
        setShowQuickVehicle(false);
      }
    } catch {
      setVehicleCreateError("Network error — please try again");
    } finally {
      setCreatingVehicle(false);
    }
  };
  // #endregion

  // #region Service handlers
  const addService = useCallback(
    (svc: ServiceCatalog) => {
      if (serviceLines.find((s) => s.service_catalog_id === svc.id)) return;
      const history = priceHistory[svc.id];
      const last = history?.last_price ?? Number(svc.default_price);
      setServiceLines((prev) => [
        ...prev,
        {
          service_catalog_id: svc.id,
          name: svc.name,
          base_price: last,
          quantity: 1,
          discount_amount_mnt: 0,
          discount_percent: 0,
          final_price: last,
          last_price: history ? last : undefined,
        },
      ]);
    },
    [serviceLines, priceHistory],
  );

  const updateService = useCallback(
    (idx: number, field: keyof ServiceLine, value: number | string) => {
      setServiceLines((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        const s = updated[idx];
        const subtotal = Number(s.base_price) * Number(s.quantity);
        const discountMnt = Number(s.discount_amount_mnt);
        const discountPct = Number(s.discount_percent);
        updated[idx].final_price = Math.max(
          0,
          subtotal - discountMnt - (subtotal * discountPct) / 100,
        );
        return updated;
      });
    },
    [],
  );

  const removeService = useCallback(
    (idx: number) => setServiceLines((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );
  // #endregion

  // #region Part handlers
  const addPart = useCallback(() => {
    setPartLines((prev) => [
      ...prev,
      {
        part_name: "",
        part_number: "",
        quantity: 1,
        unit_price: 0,
        final_price: 0,
      },
    ]);
  }, []);

  const updatePart = useCallback(
    (idx: number, field: keyof PartLine, value: string | number) => {
      setPartLines((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        if (field === "part_name" && typeof value === "string" && value.trim()) {
          const historyPrice = partHistory[value.trim().toLowerCase()];
          if (historyPrice && updated[idx].unit_price === 0) {
            updated[idx].unit_price = historyPrice;
            updated[idx].last_price = historyPrice;
          }
        }
        if (field === "quantity" || field === "unit_price") {
          updated[idx].final_price =
            Number(updated[idx].quantity) * Number(updated[idx].unit_price);
        }
        return updated;
      });
    },
    [partHistory],
  );

  const removePart = useCallback(
    (idx: number) => setPartLines((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );
  // #endregion

  // #region Create work order
  const handleCreate = async () => {
    if (!orgId || !selectedCustomer || !selectedVehicle) {
      toast.error("Customer and vehicle are required");
      return;
    }
    setSaving(true);
    try {
      const woRes = await fetch(`/api/organizations/${orgId}/work-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          vehicle_id: selectedVehicle.id,
          description,
          mechanic_id: selectedMechanic || null,
        }),
      });
      const woJson = await woRes.json();
      if (woJson.error || !woJson.data) {
        toast.error(woJson.error?.message ?? "Failed to create work order");
        setSaving(false);
        return;
      }
      const woId = woJson.data.id;

      for (const svc of serviceLines) {
        await fetch(`/api/organizations/${orgId}/work-orders/${woId}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(svc),
        });
      }
      for (const part of partLines) {
        await fetch(`/api/organizations/${orgId}/work-orders/${woId}/parts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(part),
        });
      }
      toast.success("Work order created");
      router.push(`/dashboard/work-orders/${woId}`);
    } catch {
      toast.error("Failed to create work order");
    } finally {
      setSaving(false);
    }
  };
  // #endregion

  // #region Load initial data
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const orgId = d?.organizationId ?? d?.data?.organizationId;
        if (orgId) {
          setOrgId(orgId);
          Promise.all([
            fetch(`/api/organizations/${orgId}/services`).then((r) => r.json()),
            fetch(`/api/organizations/${orgId}/reports?type=mechanics`).then(
              (r) => r.json(),
            ),
            fetch(`/api/organizations/${orgId}/price-history`).then((r) =>
              r.json(),
            ),
          ]).then(([catJson, mechJson, priceJson]) => {
            if (catJson.data) setCatalog(catJson.data);
            if (mechJson.data?.mechanics)
              setMechanics(mechJson.data.mechanics);
            if (priceJson.data) {
              setPriceHistory(priceJson.data.services ?? {});
              setPartHistory(priceJson.data.parts ?? {});
            }
          });
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, []);
  // #endregion

  // #region Search effects
  useEffect(() => {
    if (!orgId || !customerSearch) {
      if (!customerSearch) setCustomers([]);
      return;
    }
    setCustomerSearching(true);
    fetch(
      `/api/organizations/${orgId}/customers?q=${encodeURIComponent(customerSearch)}`,
    )
      .then((r) => r.json())
      .then((d) => setCustomers(d.data ?? []))
      .finally(() => setCustomerSearching(false));
  }, [orgId, customerSearch]);

  useEffect(() => {
    if (!orgId || !vehicleSearch || vehicleSearch.length < 2) {
      if (!vehicleSearch && !selectedCustomer) setVehicles([]);
      return;
    }
    setVehicleSearching(true);
    const url = selectedCustomer
      ? `/api/organizations/${orgId}/vehicles?customer=${selectedCustomer.id}&plate=${encodeURIComponent(vehicleSearch)}`
      : `/api/organizations/${orgId}/vehicles?plate=${encodeURIComponent(vehicleSearch)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setVehicles(d.data ?? []))
      .finally(() => setVehicleSearching(false));
  }, [orgId, vehicleSearch, selectedCustomer]);
  // #endregion

  const customerRef = useRef<HTMLDivElement>(null);

  const value: WizardContextType = {
    // State
    orgId, loading, saving,
    customerSearch, customers, selectedCustomer, showQuickCustomer,
    quickFirstName, quickLastName, quickPhone,
    customerSearching, creatingCustomer, customerCreateError,
    vehicleSearch, vehicles, selectedVehicle, showQuickVehicle,
    quickPlate, quickMake, quickModel, quickYear,
    vehicleSearching, creatingVehicle, vehicleCreateError,
    catalog, serviceLines, priceHistory, serviceSearch,
    partLines, partHistory,
    mechanics, selectedMechanic, description,
    servicesTotal, partsTotal, grandTotal, isFormValid,

    // Actions — Customer
    setCustomerSearch,
    setSelectedCustomer: (c) => { setSelectedCustomer(c); if (!c) { setVehicles([]); setSelectedVehicle(null); } },
    setShowQuickCustomer,
    setQuickFirstName, setQuickLastName, setQuickPhone,
    handleSelectCustomer, handleQuickCreateCustomer,

    // Actions — Vehicle
    setVehicleSearch,
    setSelectedVehicle,
    setShowQuickVehicle,
    setQuickPlate, setQuickMake, setQuickModel, setQuickYear,
    handleQuickCreateVehicle,

    // Actions — Services
    setServiceSearch, addService, updateService, removeService,

    // Actions — Parts
    addPart, updatePart, removePart,

    // Actions — Misc
    setSelectedMechanic, setDescription,

    // Actions — Submit
    handleCreate,
  } as WizardContextType;

  // Attach ref to context
  (value as unknown as Record<string, unknown>).customerRef = customerRef;

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}
