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
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type LastVisitInfo,
  type MechanicOption,
  fetchVehiclePartPrice,
  fetchVehicleServicePrice,
  useCreateCustomer,
  useCreateVehicle,
  useCreateWorkOrder,
  useCustomerSearch,
  useCustomersByPlate,
  useMechanicsWithJobCount,
  usePriceHistory,
  useServiceCatalog,
  useVehicleLastVisit,
  useVehicleSearch,
} from "@/lib/queries/use-wizard-data";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
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
  customerCreateConflict: boolean;

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
  handleDiscardDraft: () => void;
  handleRestoreDraft: () => void;
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
  const [quickFirstName, setQuickFirstName] = useState("");
  const [quickLastName, setQuickLastName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(
    null,
  );
  const [customerCreateConflict, setCustomerCreateConflict] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showQuickVehicle, setShowQuickVehicle] = useState(false);
  const [quickPlate, setQuickPlate] = useState("");
  const [quickMake, setQuickMake] = useState("");
  const [quickModel, setQuickModel] = useState("");
  const [quickYear, setQuickYear] = useState("");
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
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
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
  }, [preselectedCustomer]);

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

  useEffect(() => {
    if (preselectedVehicle && !selectedVehicle) {
      handleSelectVehicle(preselectedVehicle);
    }
  }, [preselectedVehicle]);

  const { data: catalogData, isInitialLoading: catalogLoading } =
    useServiceCatalog(orgId);
  const { data: partsCatalogData, isInitialLoading: partsCatalogLoading } =
    usePartsCatalog(orgId);
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

  const createCustomerMutation = useCreateCustomer(orgId);
  const createVehicleMutation = useCreateVehicle(orgId);
  const createWorkOrderMutation = useCreateWorkOrder(orgId);

  const loading =
    profileLoading ||
    catalogLoading ||
    partsCatalogLoading ||
    mechanicsLoading ||
    priceHistoryLoading;
  const saving = createWorkOrderMutation.isPending;
  const customerSearching = customerSearchFetching || plateSearchFetching;
  const creatingCustomer = createCustomerMutation.isPending;
  const vehicleSearching = vehicleSearchFetching;
  const creatingVehicle = createVehicleMutation.isPending;

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
      setShowDraftBanner(true);
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

  // 4. Fetch draft customer entity once user clicks Restore
  const { data: draftRestoredCustomer } = useQuery({
    queryKey: ["draft-customer", orgId, draftData?.selectedCustomerId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${draftData!.selectedCustomerId}`,
      );
      const json = await res.json();
      return json.data as Customer;
    },
    enabled: !!orgId && !!draftData?.selectedCustomerId && draftRestored,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (draftRestoredCustomer) {
      setSelectedCustomer(draftRestoredCustomer);
    }
  }, [draftRestoredCustomer]);

  // 5. Fetch draft vehicle entity once user clicks Restore
  const { data: draftRestoredVehicle } = useQuery({
    queryKey: ["draft-vehicle", orgId, draftData?.selectedVehicleId],
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/vehicles/${draftData!.selectedVehicleId}`,
      );
      const json = await res.json();
      return json.data as Vehicle;
    },
    enabled: !!orgId && !!draftData?.selectedVehicleId && draftRestored,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (draftRestoredVehicle) {
      setSelectedVehicle(draftRestoredVehicle);
    }
  }, [draftRestoredVehicle]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setShowQuickCustomer(false);
    setLastVisitData(null);
    setShowLastVisitSuggestions(false);
  }, []);

  const handleQuickCreateCustomer = async () => {
    if (!orgId || !quickFirstName.trim()) {
      setCustomerCreateError("First name is required");
      return;
    }
    setCustomerCreateError(null);
    setCustomerCreateConflict(false);
    try {
      const customer = await createCustomerMutation.mutateAsync({
        first_name: quickFirstName.trim(),
        last_name: quickLastName.trim() || null,
        phone: quickPhone.trim() || null,
      });
      handleSelectCustomer(customer);
      setQuickFirstName("");
      setQuickLastName("");
      setQuickPhone("");
      setShowQuickCustomer(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create customer";
      const code =
        err instanceof Error ? (err as { code?: string }).code : undefined;
      if (code === "CONFLICT") {
        setCustomerCreateConflict(true);
        setCustomerCreateError(
          "This phone number belongs to an existing customer. Search for them instead.",
        );
      } else {
        setCustomerCreateConflict(false);
        setCustomerCreateError(message);
      }
    }
  };

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

  const handleQuickCreateVehicle = async () => {
    if (!orgId || !quickPlate.trim()) {
      setVehicleCreateError("Plate number is required");
      return;
    }
    setVehicleCreateError(null);
    try {
      const vehicle = await createVehicleMutation.mutateAsync({
        plate_number: quickPlate.trim().toUpperCase(),
        make: quickMake.trim() || "Unknown",
        model: quickModel.trim() || "Unknown",
        year: quickYear ? parseInt(quickYear, 10) : null,
        customer_id: selectedCustomer?.id ?? null,
      });
      void handleSelectVehicle(vehicle);
      setQuickPlate("");
      setQuickMake("");
      setQuickModel("");
      setQuickYear("");
      setShowQuickVehicle(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create vehicle";
      setVehicleCreateError(message);
    }
  };

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

  const addPartFromCatalog = useCallback((part: PartsCatalogItem) => {
    const price = part.default_price ?? 0;
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
  }, []);

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
          push(`/dashboard/work-orders/${data.id}`);
        },
        onError: (err) => {
          toast.error(err?.message ?? "Failed to create work order");
        },
      },
    );
  };

  const handleDiscardDraft = useCallback(() => {
    if (!orgId) return;
    try {
      localStorage.removeItem(DRAFT_KEY(orgId));
    } catch {
      /* ignore */
    }
    setDraftData(null);
    setShowDraftBanner(false);
    setDraftRestored(false);
  }, [orgId]);

  const handleRestoreDraft = useCallback(() => {
    if (!draftData) return;
    setComplaint(draftData.complaint ?? "");
    setDiagnosisLabelId(draftData.diagnosisLabelId ?? "");
    setDescription(draftData.description ?? "");
    setSelectedMechanic(draftData.selectedMechanicId ?? "");
    if (draftData.serviceLines?.length) setServiceLines(draftData.serviceLines);
    if (draftData.partLines?.length) setPartLines(draftData.partLines);
    setShowDraftBanner(false);
    setDraftRestored(true);
  }, [draftData]);

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
    customerCreateConflict,
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
      if (!c) {
        setVehicles([]);
        setSelectedVehicle(null);
        setLastVisitData(null);
        setShowLastVisitSuggestions(false);
      }
    },
    setShowQuickCustomer: (v) => {
      setShowQuickCustomer(v);
      if (!v) {
        setCustomerCreateError(null);
        setCustomerCreateConflict(false);
      }
    },
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
    handleDiscardDraft,
    handleRestoreDraft,
  };

  (value as unknown as Record<string, unknown>).customerRef = customerRef;

  return (
    <>
      {showDraftBanner && draftData && (
        <div className="max-w-3xl mx-auto mb-4 px-1">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <Clock className="size-4 shrink-0 text-amber-600" />
            <p className="flex-1 text-amber-800">
              Unsaved draft found from{" "}
              {format(draftData.savedAt, "MMM d, HH:mm")}.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleDiscardDraft}>
                Discard
              </Button>
              <Button size="sm" onClick={handleRestoreDraft}>
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}
      <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
    </>
  );
}
