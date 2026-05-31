"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  type GlobalPart,
  type GlobalService,
  useGlobalPartsCatalog,
  useGlobalServiceCatalog,
} from "@/lib/queries/use-global-catalog";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
import {
  fetchVehiclePartPrice,
  fetchVehicleServicePrice,
  type LastVisitInfo,
  type MechanicOption,
  useCreateWorkOrder,
  useCustomerSearch,
  useCustomersByPlate,
  useMechanicsWithJobCount,
  usePriceHistory,
  useServiceCatalog,
  useVehicleLastVisit,
  useVehicleSearch,
} from "@/lib/queries/use-wizard-data";

import type {
  Customer,
  PartsCatalogItem,
  ServiceCatalog,
  Vehicle,
} from "@/lib/types";

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

interface WizardDraft {
  selectedCustomerId: string | null;
  selectedVehicleId: string | null;
  complaint: string;
  diagnosisLabelId: string | null;
  description: string;
  selectedMechanicId: string | null;
  serviceLines: ServiceLine[];
  partLines: PartLine[];
  savedAt: number;
}
const DRAFT_KEY = (orgId: string) => `wizard-draft-${orgId}`;

interface WizardState {
  orgId: string | null;
  loading: boolean;
  saving: boolean;
  isRestoringFromDraft: boolean;

  customerSearch: string;
  customers: Customer[];
  selectedCustomer: Customer | null;
  showQuickCustomer: boolean;
  customerSearching: boolean;

  vehicleSearch: string;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  showQuickVehicle: boolean;
  vehicleSearching: boolean;

  catalog: ServiceCatalog[];
  globalServices: GlobalService[];
  globalParts: GlobalPart[];
  serviceLines: ServiceLine[];
  priceHistory: Record<
    string,
    { last_price: number; last_make?: string; last_model?: string }
  >;
  /** Vehicle-contextualized prices — last price for THIS vehicle's make/model */
  vehicleServicePrices: Record<string, number>;
  vehiclePartPrices: Record<string, number>;
  serviceSearch: string;

  partsCatalog: PartsCatalogItem[];
  partSearch: string;
  partLines: PartLine[];
  partHistory: Record<string, number>;

  mechanics: MechanicOption[];
  selectedMechanic: string;

  description: string;
  complaint: string;
  diagnosisLabelId: string;

  lastVisitData: LastVisitInfo | null;
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
  handleSelectCustomer: (c: Customer) => void;

  setVehicleSearch: (v: string) => void;
  setSelectedVehicle: (v: Vehicle | null) => void;
  handleSelectVehicle: (v: Vehicle) => Promise<void>;
  setShowQuickVehicle: (v: boolean) => void;

  setServiceSearch: (v: string) => void;
  addService: (svc: ServiceCatalog) => void;
  updateService: (
    idx: number,
    field: keyof ServiceLine,
    value: number | string,
  ) => void;
  removeService: (idx: number) => void;

  setPartSearch: (v: string) => void;
  addPartFromCatalog: (part: PartsCatalogItem) => void;
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
  setComplaint: (v: string) => void;
  setDiagnosisLabelId: (v: string) => void;

  setShowLastVisitSuggestions: (v: boolean) => void;
  addAllFromLastVisit: () => void;

  handleCreate: () => Promise<void>;
  // handleDiscardDraft: () => void; // draft feature hidden
  // handleRestoreDraft: () => void; // draft feature hidden
}

type WizardContextType = WizardState & WizardActions;

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizardContext() {
  const ctx = useContext(WizardContext);
  if (!ctx)
    throw new Error("useWizardContext must be used within WizardProvider");
  return ctx;
}

interface WizardProviderProps {
  children: ReactNode;
  onCreated?: () => void;
}

export function WizardProvider({ children, onCreated }: WizardProviderProps) {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId");
  const preselectedVehicleId = searchParams.get("vehicleId");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQuickVehicle, setShowQuickVehicle] = useState(false);

  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [globalServices, setGlobalServices] = useState<GlobalService[]>([]);
  const [globalParts, setGlobalParts] = useState<GlobalPart[]>([]);
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
  const [partsCatalog, setPartsCatalog] = useState<PartsCatalogItem[]>([]);
  const [partSearch, setPartSearch] = useState("");
  const [vehicleServicePrices, setVehicleServicePrices] = useState<
    Record<string, number>
  >({});
  const [vehiclePartPrices, setVehiclePartPrices] = useState<
    Record<string, number>
  >({});
  const vehiclePartsFetchedRef = useRef<Set<string>>(new Set());

  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState("");

  const [description, setDescription] = useState("");
  const [complaint, setComplaint] = useState("");
  const [diagnosisLabelId, setDiagnosisLabelId] = useState("");

  const [lastVisitData, setLastVisitData] = useState<LastVisitInfo | null>(
    null,
  );
  const [showLastVisitSuggestions, setShowLastVisitSuggestions] =
    useState(false);

  // ── Draft auto-save state ──────────────────────────────────────
  const [draftData, setDraftData] = useState<WizardDraft | null>(null);

  const [_draftRestored, setDraftRestored] = useState(false);
  const draftCheckedRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    staleTime: Infinity,
  });

  const orgId =
    (profile?.organizationId ?? profile?.data?.organizationId) || null;

  // Auto-select customer from URL param
  const { data: preselectedCustomer } = useQuery({
    queryKey: ["preselected-customer", orgId, preselectedCustomerId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${preselectedCustomerId}`,
      );
      const json = await res.json();
      return json.data as Customer;
    },
    enabled: !!orgId && !!preselectedCustomerId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (preselectedCustomer && !selectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
    }
  }, [preselectedCustomer, selectedCustomer]);

  // Auto-select vehicle from URL param
  const { data: preselectedVehicle } = useQuery({
    queryKey: ["preselected-vehicle", orgId, preselectedVehicleId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${preselectedVehicleId}`,
      );
      const json = await res.json();
      return json.data as Vehicle;
    },
    enabled: !!orgId && !!preselectedVehicleId,
    staleTime: 30_000,
  });

  const { data: catalogData, isInitialLoading: catalogLoading } =
    useServiceCatalog(orgId);
  const { data: partsCatalogData, isInitialLoading: partsCatalogLoading } =
    usePartsCatalog(orgId);
  const { data: globalServicesData } = useGlobalServiceCatalog();
  const { data: globalPartsData } = useGlobalPartsCatalog();
  const { data: mechanicsData, isInitialLoading: mechanicsLoading } =
    useMechanicsWithJobCount(orgId);
  const { data: priceHistoryData, isInitialLoading: priceHistoryLoading } =
    usePriceHistory(orgId);

  const { data: customerSearchResults, isFetching: customerSearchFetching } =
    useCustomerSearch(orgId, customerSearch);
  const { data: plateSearchResults, isFetching: plateSearchFetching } =
    useCustomersByPlate(orgId, customerSearch);

  const { data: vehicleSearchResults, isFetching: vehicleSearchFetching } =
    useVehicleSearch(orgId, selectedCustomer?.id, vehicleSearch);

  const { data: vehicleLastVisitData } = useVehicleLastVisit(
    orgId,
    selectedVehicle?.id,
  );

  const createWorkOrderMutation = useCreateWorkOrder(orgId);

  const loading =
    profileLoading ||
    catalogLoading ||
    partsCatalogLoading ||
    mechanicsLoading ||
    priceHistoryLoading;
  const saving = createWorkOrderMutation.isPending;
  const isRestoringFromDraft = false; // draft feature hidden
  const customerSearching = customerSearchFetching || plateSearchFetching;
  const vehicleSearching = vehicleSearchFetching;

  const servicesTotal = serviceLines.reduce((s, l) => s + l.final_price, 0);
  const partsTotal = partLines.reduce((s, l) => s + l.final_price, 0);
  const grandTotal = servicesTotal + partsTotal;
  const isFormValid = !!selectedCustomer && !!selectedVehicle && !saving;
  const hasUnsavedData =
    !!selectedCustomer ||
    !!selectedVehicle ||
    complaint !== "" ||
    diagnosisLabelId !== "" ||
    description !== "" ||
    selectedMechanic !== "" ||
    serviceLines.length > 0 ||
    partLines.length > 0;
  const hasUnsavedDataRef = useRef(hasUnsavedData);
  hasUnsavedDataRef.current = hasUnsavedData;

  useEffect(() => {
    if (catalogData) setCatalog(catalogData);
  }, [catalogData]);

  useEffect(() => {
    if (globalServicesData) setGlobalServices(globalServicesData);
  }, [globalServicesData]);

  useEffect(() => {
    if (globalPartsData) setGlobalParts(globalPartsData);
  }, [globalPartsData]);

  useEffect(() => {
    if (partsCatalogData) setPartsCatalog(partsCatalogData);
  }, [partsCatalogData]);

  useEffect(() => {
    if (mechanicsData) setMechanics(mechanicsData);
  }, [mechanicsData]);

  useEffect(() => {
    if (priceHistoryData) {
      setPriceHistory(priceHistoryData.services ?? {});
      setPartHistory(priceHistoryData.parts ?? {});
    }
  }, [priceHistoryData]);

  useEffect(() => {
    if (!customerSearch) {
      setCustomers([]);
      return;
    }
    const map = new Map<string, Customer>();
    for (const c of customerSearchResults ?? []) map.set(c.id, c);
    for (const c of plateSearchResults ?? []) map.set(c.id, c);
    setCustomers(Array.from(map.values()));
  }, [customerSearchResults, plateSearchResults, customerSearch]);

  useEffect(() => {
    if (!vehicleSearch && !selectedCustomer) {
      setVehicles([]);
    } else {
      setVehicles(vehicleSearchResults ?? []);
    }
  }, [vehicleSearchResults, vehicleSearch, selectedCustomer]);

  const lastProcessedVehicleRef = useRef<string | null>(null);
  useEffect(() => {
    if (!vehicleLastVisitData || !selectedVehicle) return;
    if (lastProcessedVehicleRef.current === selectedVehicle.id) return;
    lastProcessedVehicleRef.current = selectedVehicle.id;

    if (!selectedCustomer && vehicleLastVisitData.owner) {
      setSelectedCustomer(vehicleLastVisitData.owner);
    }

    if (vehicleLastVisitData.lastVisit) {
      setLastVisitData(vehicleLastVisitData.lastVisit);
      if (
        vehicleLastVisitData.lastVisit.services.length > 0 ||
        vehicleLastVisitData.lastVisit.parts.length > 0
      ) {
        setShowLastVisitSuggestions(true);
      }
    }
  }, [vehicleLastVisitData, selectedVehicle, selectedCustomer]);

  // ── Draft auto-save effects ────────────────────────────────────

  // 1. Check for existing draft on mount
  useEffect(() => {
    if (!orgId || draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(orgId));
      if (!raw) return;
      const draft = JSON.parse(raw) as WizardDraft;
      if (!draft || typeof draft.savedAt !== "number") return;
      setDraftData(draft);
    } catch {
      // Invalid or inaccessible draft — ignore silently
    }
  }, [orgId]);

  // 2. Debounced auto-save on critical state changes
  useEffect(() => {
    if (!orgId) return;
    const draft: WizardDraft = {
      selectedCustomerId: selectedCustomer?.id ?? null,
      selectedVehicleId: selectedVehicle?.id ?? null,
      complaint,
      diagnosisLabelId,
      description,
      selectedMechanicId: selectedMechanic || null,
      serviceLines,
      partLines,
      savedAt: Date.now(),
    };
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(orgId), JSON.stringify(draft));
      } catch {
        // localStorage full or unavailable
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    orgId,
    selectedCustomer?.id,
    selectedVehicle?.id,
    complaint,
    diagnosisLabelId,
    description,
    selectedMechanic,
    serviceLines,
    partLines,
  ]);

  // 3. beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedDataRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ── Draft restore queries (hidden per user request) ─────────────
  // const { data: draftRestoredCustomer } = useQuery({ ... });
  // useEffect(() => { ... set customer from draft ... }, [draftRestoredCustomer]);
  // const { data: draftRestoredVehicle } = useQuery({ ... });
  // useEffect(() => { ... set vehicle from draft ... }, [draftRestoredVehicle]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setShowQuickCustomer(false);
    setLastVisitData(null);
    setShowLastVisitSuggestions(false);
  }, []);

  const handleSelectVehicle = useCallback(async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleSearch("");
    setShowQuickVehicle(false);
    setLastVisitData(null);
    setShowLastVisitSuggestions(false);
    setVehicleServicePrices({});
    setVehiclePartPrices({});
    vehiclePartsFetchedRef.current = new Set();
    lastProcessedVehicleRef.current = null;
  }, []);

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
      // Fetch vehicle-specific price for this service
      if (orgId && selectedVehicle?.make) {
        void fetchVehicleServicePrice(
          orgId,
          svc.id,
          selectedVehicle.make,
          selectedVehicle.model ?? undefined,
        ).then((vehiclePrice) => {
          if (vehiclePrice !== null) {
            setVehicleServicePrices((prev) => ({
              ...prev,
              [svc.id]: vehiclePrice,
            }));
            // Only update line if price differs from aggregate default
            if (vehiclePrice !== last) {
              setServiceLines((prev) => {
                const idx = prev.findIndex(
                  (s) => s.service_catalog_id === svc.id,
                );
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  base_price: vehiclePrice,
                  final_price: vehiclePrice * updated[idx].quantity,
                  last_price: vehiclePrice,
                };
                return updated;
              });
            }
          }
        });
      }
    },
    [serviceLines, priceHistory, orgId, selectedVehicle],
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

  const addPartFromCatalog = useCallback(
    (part: PartsCatalogItem) => {
      const price = part.default_price ?? 0;
      const pname = part.name.toLowerCase();
      // Optimistically use catalog price; upgrade to vehicle-specific if available
      setPartLines((prev) => [
        ...prev,
        {
          part_name: part.name,
          part_number: part.part_number ?? "",
          quantity: 1,
          unit_price: price,
          final_price: price,
          last_price: undefined,
        },
      ]);
      setPartSearch("");
      // Fetch vehicle-specific price in background and upgrade if found
      if (
        orgId &&
        selectedVehicle?.make &&
        !vehiclePartsFetchedRef.current.has(pname)
      ) {
        vehiclePartsFetchedRef.current.add(pname);
        void fetchVehiclePartPrice(
          orgId,
          part.name,
          selectedVehicle.make,
          selectedVehicle.model ?? undefined,
        ).then((vehiclePrice) => {
          if (vehiclePrice !== null) {
            setVehiclePartPrices((prev) => ({
              ...prev,
              [pname]: vehiclePrice,
            }));
            setPartLines((prev) => {
              // Find the most recently added part with this name (last in array)
              let idx = -1;
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].part_name.toLowerCase() === pname) {
                  idx = i;
                  break;
                }
              }
              if (idx === -1) return prev;
              const updated = [...prev];
              // Always upgrade to vehicle-specific price when adding from catalog
              updated[idx] = {
                ...updated[idx],
                unit_price: vehiclePrice,
                final_price: vehiclePrice * updated[idx].quantity,
                last_price: vehiclePrice,
              };
              return updated;
            });
          }
        });
      }
    },
    [orgId, selectedVehicle],
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
          const pname = value.trim().toLowerCase();
          const historyPrice = partHistory[pname];
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
      // Fetch vehicle-specific price for this part
      if (
        field === "part_name" &&
        typeof value === "string" &&
        value.trim() &&
        orgId &&
        selectedVehicle?.make &&
        !vehiclePartsFetchedRef.current.has(value.trim().toLowerCase())
      ) {
        const pname = value.trim().toLowerCase();
        vehiclePartsFetchedRef.current.add(pname);
        void fetchVehiclePartPrice(
          orgId,
          value.trim(),
          selectedVehicle.make,
          selectedVehicle.model ?? undefined,
        ).then((vehiclePrice) => {
          if (vehiclePrice !== null) {
            setVehiclePartPrices((prev) => ({
              ...prev,
              [pname]: vehiclePrice,
            }));
            setPartLines((prev) => {
              const idx = prev.findIndex(
                (p) => p.part_name.toLowerCase() === pname,
              );
              if (idx === -1) return prev;
              const updated = [...prev];
              if (updated[idx].unit_price === 0) {
                updated[idx].unit_price = vehiclePrice;
                updated[idx].final_price = vehiclePrice * updated[idx].quantity;
                updated[idx].last_price = vehiclePrice;
              }
              return updated;
            });
          }
        });
      }
    },
    [partHistory, orgId, selectedVehicle],
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

    const services = serviceLines.map((svc) => ({
      service_catalog_id: svc.service_catalog_id,
      service_name: svc.name,
      quantity: svc.quantity,
      unit_price: svc.base_price,
      discount_amount: svc.discount_amount_mnt,
      discount_percentage: svc.discount_percent,
    }));

    const parts = partLines.map((part) => ({
      part_name: part.part_name,
      part_number: part.part_number || null,
      quantity: part.quantity,
      unit_price: part.unit_price,
    }));

    createWorkOrderMutation.mutate(
      {
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        mechanic_id: selectedMechanic || null,
        notes: description || undefined,
        complaint: complaint || undefined,
        diagnosis_label_id: diagnosisLabelId || null,
        services,
        parts,
      },
      {
        onSuccess: (data) => {
          try {
            localStorage.removeItem(DRAFT_KEY(orgId));
          } catch {
            /* ignore */
          }
          toast.success("Work order created");
          onCreated?.();
          push(`/dashboard/work-orders/${data.id}`);
        },
        onError: (err) => {
          toast.error(err?.message ?? "Failed to create work order");
        },
      },
    );
  };

  const _handleDiscardDraft = useCallback(() => {
    if (!orgId) return;
    try {
      localStorage.removeItem(DRAFT_KEY(orgId));
    } catch {
      /* ignore */
    }
    setDraftData(null);
    setDraftRestored(false);
  }, [orgId]);

  const _handleRestoreDraft = useCallback(() => {
    if (!draftData) return;
    setComplaint(draftData.complaint ?? "");
    setDiagnosisLabelId(draftData.diagnosisLabelId ?? "");
    setDescription(draftData.description ?? "");
    setSelectedMechanic(draftData.selectedMechanicId ?? "");
    if (draftData.serviceLines?.length) setServiceLines(draftData.serviceLines);
    if (draftData.partLines?.length) setPartLines(draftData.partLines);
    setDraftRestored(true);
  }, [draftData]);

  const customerRef = useRef<HTMLDivElement>(null);

  const value: WizardContextType = {
    orgId,
    loading,
    saving,
    isRestoringFromDraft, // always false — draft feature hidden
    customerSearch,
    customers,
    selectedCustomer,
    showQuickCustomer,
    customerSearching,
    vehicleSearch,
    vehicles,
    selectedVehicle,
    showQuickVehicle,
    vehicleSearching,
    catalog,
    globalServices,
    globalParts,
    serviceLines,
    priceHistory,
    vehicleServicePrices,
    vehiclePartPrices,
    serviceSearch,
    partsCatalog,
    partSearch,
    partLines,
    partHistory,
    mechanics,
    selectedMechanic,
    description,
    complaint,
    diagnosisLabelId,
    lastVisitData,
    showLastVisitSuggestions,
    servicesTotal,
    partsTotal,
    grandTotal,
    isFormValid,

    setCustomerSearch,
    setSelectedCustomer: (c) => {
      setSelectedCustomer(c);
    },
    setShowQuickCustomer,
    handleSelectCustomer,

    setVehicleSearch,
    setSelectedVehicle,
    handleSelectVehicle,
    setShowQuickVehicle,

    setServiceSearch,
    addService,
    updateService,
    removeService,

    setPartSearch,
    addPartFromCatalog,
    addPart,
    updatePart,
    removePart,
    setPartLines,

    setSelectedMechanic,
    setDescription,
    setComplaint,
    setDiagnosisLabelId,
    setShowLastVisitSuggestions,
    addAllFromLastVisit,

    handleCreate,
    // handleDiscardDraft, // draft feature hidden
    // handleRestoreDraft, // draft feature hidden
  };

  (value as unknown as Record<string, unknown>).customerRef = customerRef;

  return (
    <>
      {/* TODO: restore draft feature — hidden per user request */}
      <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
    </>
  );
}
