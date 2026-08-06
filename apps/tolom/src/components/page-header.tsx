"use client";

import {
  CalendarPlus,
  Car,
  ClipboardList,
  Cog,
  DollarSign,
  Keyboard,
  Package,
  Plus,
  SearchIcon,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isEditingActive } from "@/components/search-input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigation } from "@/hooks/use-navigation";
import { usePageHeader } from "@/hooks/use-page-header";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { useGlobalSearch } from "@/lib/queries/use-global-search";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export interface PageTab {
  value: string;
  label: string;
}

interface PageHeaderProps {
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  actions?: React.ReactNode;
}

// ── Breadcrumb helpers ───────────────────────────────
// Maps work order status values to i18n key suffixes (camelCase, no spaces).
const WO_STATUS_KEY: Record<string, string> = {
  New: "statusNew",
  Diagnosing: "statusDiagnosing",
  "In Progress": "statusInProgress",
  "Ready for Pickup": "statusReadyForPickup",
  Completed: "statusCompleted",
  Cancelled: "statusCancelled",
};

const NAV_LABEL_KEYS: Record<string, string> = {
  dashboard: "nav.dashboard",
  "work-orders": "nav.workOrders",
  customers: "nav.customers",
  vehicles: "nav.vehicles",
  inventory: "nav.inventory",
  "bay-view": "nav.bayView",
  reports: "nav.reports",
  services: "nav.services",
  "service-reminders": "nav.serviceReminders",
  appointments: "nav.appointments",
  estimates: "nav.estimates",
  expenses: "nav.expenses",
  finance: "nav.finance",
  "vehicle-models": "nav.vehicleModels",
  organization: "nav.settings",
  settings: "nav.settings",
  admin: "nav.admin",
  mechanic: "nav.mechanic",
  "mechanic-performance": "nav.mechanicPerformance",
  payroll: "nav.payroll",
  "eod-close": "nav.endOfDay",
  "cash-register": "nav.cashRegister",
  "parts-cars": "nav.partsCars",
  "purchase-orders": "nav.purchaseOrders",
  suppliers: "nav.suppliers",
  movements: "nav.movements",
  alerts: "nav.alerts",
  valuation: "nav.valuation",
  guide: "nav.guide",
};

export function PageHeader({
  tabs,
  activeTab,
  onTabChange,
  actions,
}: PageHeaderProps) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { push } = useRouter();
  const { searchItems } = useNavigation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const { data: org } = useCurrentOrg();
  const globalSearch = useGlobalSearch(org?.orgId, searchQuery);
  const searchResults = globalSearch.data;
  const isSearching = searchQuery.trim().length >= 2;

  const {
    setNewCustomerDialogOpen,
    setNewVehicleDialogOpen,
    setNewExpenseSheetOpen,
    setNewWorkOrderSheetOpen,
    setNewSupplierSheetOpen,
    setNewPOSheetOpen,
    setNewAppointmentSheetOpen,
    setNewPartsCarSheetOpen,
  } = usePageHeader();

  const openSearch = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(true);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setSearchOpen(false);
      push(href);
    },
    [push],
  );

  const commandItems = useMemo(() => searchItems, [searchItems]);

  // ── Jump targets for global search hits ──
  const jumpToCustomers = useCallback(
    (term: string) => {
      setSearchOpen(false);
      push(`/dashboard/customers?customers-search=${encodeURIComponent(term)}`);
    },
    [push],
  );

  const jumpToVehicles = useCallback(
    (term: string) => {
      setSearchOpen(false);
      push(`/dashboard/vehicles?vehicles-search=${encodeURIComponent(term)}`);
    },
    [push],
  );

  const jumpToInventory = useCallback(
    (term: string) => {
      setSearchOpen(false);
      push(`/dashboard/inventory?q=${encodeURIComponent(term)}`);
    },
    [push],
  );

  const jumpToWorkOrder = useCallback(
    (id: string) => {
      setSearchOpen(false);
      push(`/dashboard/work-orders/${id}`);
    },
    [push],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setSearchOpen((open) => !open);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Global daily-action shortcuts: N = new work order, ? = shortcut help.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditingActive()) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNewWorkOrderSheetOpen(true);
      } else if (event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setNewWorkOrderSheetOpen]);

  const pathname = usePathname();

  const breadcrumbItems = useMemo(() => {
    const segments = pathname
      .split("/")
      .filter(Boolean)
      .filter((s) => s !== "dashboard")
      // Filter out locale segments (2-letter codes)
      .filter((s) => s.length !== 2 || s.includes("-"));
    if (segments.length === 0) return [];

    const items: { label: string; href: string }[] = [
      { label: t("nav.dashboard"), href: "/dashboard" },
    ];

    let currentPath = "/dashboard";
    for (const segment of segments) {
      currentPath = `${currentPath}/${segment}`;
      const labelKey = NAV_LABEL_KEYS[segment];
      if (labelKey) {
        items.push({ label: t(labelKey), href: currentPath });
      } else if (/^[0-9a-f]{8,}$/i.test(segment)) {
        // UUID segment (detail page) — show truncated ID, not a link
        items.push({
          label: `#${segment.slice(0, 8)}`,
          href: currentPath,
        });
      } else if (segment === "new") {
        items.push({ label: t("common.new"), href: currentPath });
      } else if (segment === "new-wo") {
        items.push({ label: t("workOrders.newWorkOrder"), href: currentPath });
      } else {
        // Fallback: capitalize and replace hyphens
        items.push({
          label:
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, " "),
          href: currentPath,
        });
      }
    }

    return items;
  }, [pathname, t]);

  const showBreadcrumb = breadcrumbItems.length > 1;

  return (
    <>
      <header className="sticky top-0 z-50 flex shrink-0 flex-col border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2 self-stretch">
            <SidebarTrigger className="-ml-1 rounded-xl" />
            {showBreadcrumb && (
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                  {breadcrumbItems.map((item, i) => (
                    <BreadcrumbItem key={item.href}>
                      {i < breadcrumbItems.length - 1 ? (
                        <>
                          <BreadcrumbLink render={<Link href={item.href} />}>
                            {item.label}
                          </BreadcrumbLink>
                          <BreadcrumbSeparator />
                        </>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full max-w-md justify-start gap-2 rounded-xl border-border/70 bg-muted/35 px-3 text-muted-foreground shadow-none"
              onClick={openSearch}
            >
              <SearchIcon className="size-3.5" />
              <span className="text-xs">{t("common.search")}</span>
              <kbd className="ml-auto inline-flex h-4 items-center gap-0.5 rounded-md border border-border/60 bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground/70">
                {"⌘"}K
              </kbd>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-xl lg:hidden"
              onClick={openSearch}
              aria-label={t("common.search")}
            >
              <SearchIcon className="size-4" />
            </Button>
            {actions && (
              <div className="flex items-center gap-1">{actions}</div>
            )}
            <QuickCreateHeader />
            <SettingsShortcut />
          </div>
        </div>

        {showBreadcrumb && (
          <div className="border-t border-border/40 px-4 py-1 md:hidden">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, i) => (
                  <BreadcrumbItem key={item.href}>
                    {i < breadcrumbItems.length - 1 ? (
                      <>
                        <BreadcrumbLink render={<Link href={item.href} />}>
                          {item.label}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {tabs && tabs.length > 0 && (
          <div className="border-t border-border/60 px-4 pt-1">
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList variant="line">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </header>

      <CommandDialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) setSearchQuery("");
        }}
        title={t("common.search")}
      >
        <Command shouldFilter={!isSearching}>
          <CommandInput
            placeholder={t("globalSearch.searchPrompt")}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            {isSearching ? (
              <>
                {searchResults?.customers.length ? (
                  <CommandGroup heading={t("globalSearch.customers")}>
                    {searchResults.customers.map((c) => (
                      <CommandItem
                        key={`customer-${c.id}`}
                        onSelect={() => jumpToCustomers(searchQuery)}
                      >
                        <Users className="size-4" />
                        <span>{c.name}</span>
                        {c.phone ? (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {c.phone}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {searchResults?.vehicles.length ? (
                  <CommandGroup heading={t("globalSearch.vehicles")}>
                    {searchResults.vehicles.map((v) => (
                      <CommandItem
                        key={`vehicle-${v.id}`}
                        onSelect={() =>
                          jumpToVehicles(v.plateNumber ?? searchQuery)
                        }
                      >
                        <Car className="size-4" />
                        <span>
                          {[v.make, v.model, v.plateNumber]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </span>
                        {v.ownerName ? (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {v.ownerName}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {searchResults?.workOrders.length ? (
                  <CommandGroup heading={t("globalSearch.workOrders")}>
                    {searchResults.workOrders.map((wo) => (
                      <CommandItem
                        key={`wo-${wo.id}`}
                        onSelect={() => jumpToWorkOrder(wo.id)}
                      >
                        <ClipboardList className="size-4" />
                        <span>
                          {[wo.plateNumber, wo.customerName]
                            .filter(Boolean)
                            .join(" · ") || `#${wo.id.slice(0, 8)}`}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {t(
                            `workOrders.${WO_STATUS_KEY[wo.status] ?? "statusNew"}`,
                          )}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {searchResults?.parts.length ? (
                  <CommandGroup heading={t("globalSearch.parts")}>
                    {searchResults.parts.map((p) => (
                      <CommandItem
                        key={`part-${p.id ?? p.partNumber ?? p.name}`}
                        onSelect={() => jumpToInventory(p.name ?? searchQuery)}
                      >
                        <Package className="size-4" />
                        <span>{p.name ?? "—"}</span>
                        {p.partNumber ? (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {p.partNumber}
                          </span>
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
              </>
            ) : (
              <>
                <CommandGroup heading={t("common.quickCreate")}>
                  {[
                    {
                      icon: ClipboardList,
                      label: t("dashboard.newWorkOrder"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewWorkOrderSheetOpen(true);
                      },
                    },
                    {
                      icon: UserPlus,
                      label: t("dashboard.newCustomer"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewCustomerDialogOpen(true);
                      },
                    },
                    {
                      icon: Car,
                      label: t("dashboard.newVehicle"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewVehicleDialogOpen(true);
                      },
                    },
                    {
                      icon: DollarSign,
                      label: t("expenses.addExpense"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewExpenseSheetOpen(true);
                      },
                    },
                    {
                      icon: Truck,
                      label: t("inventory.newSupplier"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewSupplierSheetOpen(true);
                      },
                    },
                    {
                      icon: Package,
                      label: t("inventory.newPurchaseOrder"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewPOSheetOpen(true);
                      },
                    },
                    {
                      icon: CalendarPlus,
                      label: t("appointments.newAppointment"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewAppointmentSheetOpen(true);
                      },
                    },
                    {
                      icon: Car,
                      label: t("partsCars.newCar"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setNewPartsCarSheetOpen(true);
                      },
                    },
                    {
                      icon: Keyboard,
                      label: t("shortcuts.title"),
                      onSelect: () => {
                        setSearchOpen(false);
                        setHelpOpen(true);
                      },
                    },
                  ].map((item, _i) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem key={item.label} onSelect={item.onSelect}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandGroup heading={t("nav.dashboard")}>
                  {commandItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <CommandItem
                        key={item.href}
                        onSelect={() => handleSelect(item.href)}
                      >
                        <Icon className="size-4" />
                        <span>{t(item.labelKey)}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Keyboard shortcut help overlay */}
      <CommandDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title={t("shortcuts.title")}
      >
        <Command>
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup heading={t("shortcuts.description")}>
              {[
                { keys: ["⌘", "K"], label: t("shortcuts.search") },
                { keys: ["⌘", "B"], label: t("shortcuts.toggleSidebar") },
                { keys: ["N"], label: t("shortcuts.newWorkOrder") },
                { keys: ["?"], label: t("shortcuts.help") },
              ].map((s) => (
                <CommandItem key={s.label} onSelect={() => setHelpOpen(false)}>
                  <span>{s.label}</span>
                  <span className="ml-auto flex items-center gap-0.5">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="inline-flex h-4 items-center rounded-md border border-border/60 bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground/70"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function SettingsShortcut() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const pathname = usePathname();
  const isActive = pathname === "/dashboard/settings";

  return (
    <>
      <Button
        variant={isActive ? "secondary" : "outline"}
        size="icon-md"
        className="hidden rounded-xl lg:inline-flex"
        render={<Link href="/dashboard/settings" />}
        nativeButton={false}
        aria-label={t("nav.settings")}
      >
        <Cog className="size-4" />
      </Button>
      <Button
        variant={isActive ? "secondary" : "outline"}
        size="icon-md"
        className="rounded-xl lg:hidden"
        render={<Link href="/dashboard/settings" />}
        nativeButton={false}
        aria-label={t("nav.settings")}
      >
        <Cog className="size-4" />
      </Button>
    </>
  );
}

function QuickCreateHeader() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const {
    setNewCustomerDialogOpen,
    setNewVehicleDialogOpen,
    setNewExpenseSheetOpen,
    setNewWorkOrderSheetOpen,
    setNewSupplierSheetOpen,
    setNewPOSheetOpen,
    setNewAppointmentSheetOpen,
    setNewPartsCarSheetOpen,
  } = usePageHeader();

  const commonActions = [
    {
      label: t("dashboard.newWorkOrder"),
      icon: ClipboardList,
      onClick: () => setNewWorkOrderSheetOpen(true),
    },
    {
      label: t("appointments.newAppointment"),
      icon: CalendarPlus,
      onClick: () => setNewAppointmentSheetOpen(true),
    },
  ];

  const moreGroups = [
    {
      label: t("common.operations"),
      items: [
        {
          label: t("dashboard.newCustomer"),
          icon: UserPlus,
          onClick: () => setNewCustomerDialogOpen(true),
        },
        {
          label: t("dashboard.newVehicle"),
          icon: Car,
          onClick: () => setNewVehicleDialogOpen(true),
        },
      ],
    },
    {
      label: t("common.financial"),
      items: [
        {
          label: t("expenses.addExpense"),
          icon: DollarSign,
          onClick: () => setNewExpenseSheetOpen(true),
        },
        {
          label: t("inventory.newPurchaseOrder"),
          icon: Package,
          onClick: () => setNewPOSheetOpen(true),
        },
      ],
    },
    {
      label: t("common.inventory"),
      items: [
        {
          label: t("inventory.newSupplier"),
          icon: Truck,
          onClick: () => setNewSupplierSheetOpen(true),
        },
        {
          label: t("partsCars.newCar"),
          icon: Car,
          onClick: () => setNewPartsCarSheetOpen(true),
        },
      ],
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {commonActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-muted-foreground"
            onClick={action.onClick}
          >
            <Icon className="size-4" />
            <span className="hidden lg:inline">{action.label}</span>
          </Button>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-xl text-muted-foreground"
              aria-label={t("common.create")}
            >
              <Plus className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          {moreGroups.map((group, gi) => (
            <DropdownMenuGroup key={gi}>
              {gi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.label} onClick={item.onClick}>
                    <Icon className="mr-2 size-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
