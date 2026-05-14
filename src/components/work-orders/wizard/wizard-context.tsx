"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Customer, ServiceCatalog, Vehicle } from "@/lib/types";

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
  current_jobs?: number;
}

interface LastVisitInfo {
  services: {
    service_catalog_id: string | null;
    service_name: string;
    unit_price: number;
    quantity: number;
  }[];
  parts: {
    part_name: string;
    part_number: string | null;
    unit_price: number;
    quantity: number;
  }[];
  mechanic_id: string | null;
  notes: string | null;
}

interface WizardState {
  orgId: string | null;
  loading: boolean;
  saving: boolean;

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

  catalog: ServiceCatalog[];
  serviceLines: ServiceLine[];
  priceHistory: Record<
    string,
    { last_price: number; last_make?: string; last_model?: string }
  >;
  serviceSearch: string;

  partLines: PartLine[];
  partHistory: Record<string, number>;

  mechanics: MechanicOption[];
  selectedMechanic: string;

  description: string;

  lastVisitData: LastVisitInfo | null;
  lastVisitLoading: boolean;
  showLastVisitSuggestions: boolean;

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
  handleSelectVehicle: (v: Vehicle) => Promise<void>;
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
  setPartLines: React.Dispatch<React.SetStateAction<PartLine[]>>;

  setSelectedMechanic: (v: string) => void;
  setDescription: (v: string) => void;

  setShowLastVisitSuggestions: (v: boolean) => void;
  addAllFromLastVisit: () => void;

  handleCreate: () => Promise<void>;
}

type WizardContextType = WizardState & WizardActions;

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizardContext() {
  const ctx = useContext(WizardContext);
  if (!ctx)
    throw new Error("useWizardContext must be used within WizardProvider");
  return ctx;
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickFirstName, setQuickFirstName] = useState("");
  const [quickLastName, setQuickLastName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [customerSearching, setCustomerSearching] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(
    null,
  );

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
  const [vehicleCreateError, setVehicleCreateError] = useState<string | null>(
    null,
  );

  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [priceHistory, setPriceHistory] = useState<
    Record<
      string,
      { last_price: number; last_make?: string; last_model?: string }
    >
  >({});
  const [serviceSearch, setServiceSearch] = useState("");

  const [partLines, setPartLines] = useState<PartLine[]>([]);
  const [partHistory, setPartHistory] = useState<Record<string, number>>({});

  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState("");

  const [description, setDescription] = useState("");

  const [lastVisitData, setLastVisitData] = useState<LastVisitInfo | null>(
    null,
  );
  const [lastVisitLoading, setLastVisitLoading] = useState(false);
  const [showLastVisitSuggestions, setShowLastVisitSuggestions] =
    useState(false);

  const servicesTotal = serviceLines.reduce((s, l) => s + l.final_price, 0);
  const partsTotal = partLines.reduce((s, l) => s + l.final_price, 0);
  const grandTotal = servicesTotal + partsTotal;
  const isFormValid = !!selectedCustomer && !!selectedVehicle && !saving;

  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setCustomerSearch("");
      setShowQuickCustomer(false);
      setLastVisitData(null);
      setShowLastVisitSuggestions(false);
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
        setCustomerCreateError(
          json.error.message ?? "Failed to create customer",
        );
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

  const handleSelectVehicle = useCallback(
    async (vehicle: Vehicle) => {
      setSelectedVehicle(vehicle);
      setVehicleSearch("");
      setShowQuickVehicle(false);
      setLastVisitData(null);
      setShowLastVisitSuggestions(false);

      if (!orgId || !vehicle.id) return;

      const supabase = createClient();

      if (!selectedCustomer) {
        const { data: ownerData } = await supabase
          .from("vehicle_owners")
          .select("customers(*)")
          .eq("organization_id", orgId)
          .eq("vehicle_id", vehicle.id)
          .is("owned_until", null)
          .limit(1)
          .maybeSingle();
        const customer = ownerData?.customers as Customer | null | undefined;
        if (customer) setSelectedCustomer(customer);
      }

      setLastVisitLoading(true);
      try {
        const { data: workOrders } = await supabase
          .from("work_orders")
          .select("id, mechanic_id")
          .eq("organization_id", orgId)
          .eq("vehicle_id", vehicle.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);

        const workOrder = workOrders?.[0];
        if (!workOrder) return;

        const [servicesResult, partsResult] = await Promise.all([
          supabase
            .from("work_order_services")
            .select("service_catalog_id, service_name, unit_price, quantity")
            .eq("work_order_id", workOrder.id),
          supabase
            .from("work_order_parts")
            .select("part_name, part_number, unit_price, quantity")
            .eq("work_order_id", workOrder.id),
        ]);

        const data: LastVisitInfo = {
          services: (servicesResult.data ?? []).map((service) => ({
            service_catalog_id: service.service_catalog_id,
            service_name: service.service_name,
            unit_price: Number(service.unit_price),
            quantity: Number(service.quantity),
          })),
          parts: (partsResult.data ?? []).map((part) => ({
            part_name: part.part_name,
            part_number: part.part_number,
            unit_price: Number(part.unit_price),
            quantity: Number(part.quantity),
          })),
          mechanic_id: workOrder.mechanic_id,
          notes: null,
        };
        setLastVisitData(data);
        if (data.services.length > 0 || data.parts.length > 0) {
          setShowLastVisitSuggestions(true);
        }
      } finally {
        setLastVisitLoading(false);
      }
    },
    [orgId, selectedCustomer],
  );

  const addAllFromLastVisit = useCallback(() => {
    if (!lastVisitData) return;
    for (const svc of lastVisitData.services) {
      if (
        !serviceLines.find(
          (s) =>
            s.service_catalog_id === svc.service_catalog_id &&
            svc.service_catalog_id,
        )
      ) {
        if (svc.service_name) {
          setServiceLines((prev) => [
            ...prev,
            {
              service_catalog_id: svc.service_catalog_id,
              name: svc.service_name,
              base_price: svc.unit_price,
              quantity: svc.quantity,
              discount_amount_mnt: 0,
              discount_percent: 0,
              final_price: svc.unit_price * svc.quantity,
              last_price: svc.unit_price,
            },
          ]);
        }
      }
    }
    for (const part of lastVisitData.parts) {
      setPartLines((prev) => [
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
    }
    if (lastVisitData.mechanic_id) {
      setSelectedMechanic(lastVisitData.mechanic_id);
    }
    setShowLastVisitSuggestions(false);
  }, [lastVisitData, serviceLines]);

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
        void handleSelectVehicle(json.data);
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
    (idx: number) =>
      setServiceLines((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

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
        if (
          field === "part_name" &&
          typeof value === "string" &&
          value.trim()
        ) {
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
        await fetch(
          `/api/organizations/${orgId}/work-orders/${woId}/services`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(svc),
          },
        );
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

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) {
          setOrgId(id);
          Promise.all([
            fetch(`/api/organizations/${id}/services`).then((r) => r.json()),
            fetch(`/api/organizations/${id}/reports?type=mechanics`).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/price-history`).then((r) =>
              r.json(),
            ),
            fetch(`/api/organizations/${id}/work-orders`).then((r) => r.json()),
          ]).then(([catJson, mechJson, priceJson, workOrdersJson]) => {
            if (catJson.data) setCatalog(catJson.data);
            const mechanicsList = mechJson.data;
            if (Array.isArray(mechanicsList)) {
              const activeWorkOrders = (workOrdersJson.data ?? []).filter(
                (wo: { status: string }) =>
                  [
                    "New",
                    "Diagnosing",
                    "In Progress",
                    "Ready for Pickup",
                  ].includes(wo.status),
              );
              setMechanics(
                mechanicsList.map(
                  (mechanic: { id: string; full_name: string | null }) => ({
                    id: mechanic.id,
                    fullName: mechanic.full_name ?? null,
                    email: "",
                    current_jobs: activeWorkOrders.filter(
                      (wo: { mechanic_id: string | null }) =>
                        wo.mechanic_id === mechanic.id,
                    ).length,
                  }),
                ),
              );
            }
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

  useEffect(() => {
    if (!orgId || !customerSearch) {
      if (!customerSearch) setCustomers([]);
      return;
    }
    setCustomerSearching(true);
    const supabase = createClient();
    Promise.all([
      fetch(
        `/api/organizations/${orgId}/customers?q=${encodeURIComponent(customerSearch)}`,
      ).then((r) => r.json()),
      supabase
        .from("vehicles")
        .select("vehicle_owners!inner(customers(*))")
        .eq("organization_id", orgId)
        .ilike("plate_number", `%${customerSearch}%`)
        .is("deleted_at", null)
        .is("vehicle_owners.owned_until", null)
        .limit(5),
    ])
      .then(([customerJson, plateResult]) => {
        const customerMap = new Map<string, Customer>();
        for (const customer of customerJson.data ?? []) {
          customerMap.set(customer.id, customer);
        }
        for (const row of plateResult.data ?? []) {
          const owners = row.vehicle_owners as unknown as { customers?: Customer | Customer[] }[];
          const ownerCustomer = owners?.[0]?.customers;
          const customer = Array.isArray(ownerCustomer) ? ownerCustomer[0] : ownerCustomer;
          if (customer) customerMap.set(customer.id, customer);
        }
        setCustomers(Array.from(customerMap.values()));
      })
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

  const customerRef = useRef<HTMLDivElement>(null);

  const value: WizardContextType = {
    orgId,
    loading,
    saving,
    customerSearch,
    customers,
    selectedCustomer,
    showQuickCustomer,
    quickFirstName,
    quickLastName,
    quickPhone,
    customerSearching,
    creatingCustomer,
    customerCreateError,
    vehicleSearch,
    vehicles,
    selectedVehicle,
    showQuickVehicle,
    quickPlate,
    quickMake,
    quickModel,
    quickYear,
    vehicleSearching,
    creatingVehicle,
    vehicleCreateError,
    catalog,
    serviceLines,
    priceHistory,
    serviceSearch,
    partLines,
    partHistory,
    mechanics,
    selectedMechanic,
    description,
    lastVisitData,
    lastVisitLoading,
    showLastVisitSuggestions,
    servicesTotal,
    partsTotal,
    grandTotal,
    isFormValid,

    setCustomerSearch,
    setSelectedCustomer: (c) => {
      setSelectedCustomer(c);
      if (!c) {
        setVehicles([]);
        setSelectedVehicle(null);
        setLastVisitData(null);
        setShowLastVisitSuggestions(false);
      }
    },
    setShowQuickCustomer,
    setQuickFirstName,
    setQuickLastName,
    setQuickPhone,
    handleSelectCustomer,
    handleQuickCreateCustomer,

    setVehicleSearch,
    setSelectedVehicle,
    handleSelectVehicle,
    setShowQuickVehicle,
    setQuickPlate,
    setQuickMake,
    setQuickModel,
    setQuickYear,
    handleQuickCreateVehicle,

    setServiceSearch,
    addService,
    updateService,
    removeService,

    addPart,
    updatePart,
    removePart,
    setPartLines,

    setSelectedMechanic,
    setDescription,
    setShowLastVisitSuggestions,
    addAllFromLastVisit,

    handleCreate,
  };

  (value as unknown as Record<string, unknown>).customerRef = customerRef;

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
