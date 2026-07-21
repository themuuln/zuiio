"use client";

import { Building2, Globe, Plus, Upload, User, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { ExportButton } from "@/components/export-button";
import { type FilterChip, FilterChips } from "@/components/filter-chips";
import { ListPageShell } from "@/components/list-page-shell";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useClientNow } from "@/hooks/use-client-now";
import { usePageHeader } from "@/hooks/use-page-header";
import type { ExportColumn } from "@/lib/export";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { useCustomers, useSharedCustomers } from "@/lib/queries/use-customers";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import type { CustomerRow } from "./_columns";
import { CustomerDetailPanel } from "./_customer-detail-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { columns, sharedColumns } from "./_columns";

export default function CustomersPage() {
  const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
  const isMobile = useIsMobile();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const now = useClientNow();
  const { search, setSearch, view, setView } = useTableFilters("customers", {
    view: "my",
  });
  const { setNewCustomerDialogOpen, setDetailCustomerId } = usePageHeader();
  const [inactiveFilter, setInactiveFilter] = useState(false);
  const activeView = view === "shared" ? "shared" : "my";

  const exportColumns: ExportColumn<CustomerRow>[] = useMemo(
    () => [
      {
        key: "first_name",
        label: "Name",
        value: (c) =>
          [c.first_name, c.last_name].filter(Boolean).join(" ") ||
          c.company_name ||
          c.phone ||
          "No name",
      },
      { key: "type", label: "Type" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "vehicle_count", label: "Vehicles" },
      { key: "total_visits", label: "Visits" },
      { key: "last_visit_at", label: "Last Visit", format: "date" },
    ],
    [],
  );

  const {
    data: org,
    isPending: orgLoading,
    isError: orgError,
  } = useCurrentOrg();
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const {
    data: rawCustomers,
    isPending: customersLoading,
    isFetching: customersFetching,
    isError,
    error,
    refetch,
  } = useCustomers(org?.orgId, activeView === "my" ? search : "", branchFilter);

  const { data: rawSharedCustomers, isFetching: sharedFetching } =
    useSharedCustomers(org?.orgId, activeView === "shared" ? search : "");

  const rawCustomersForView =
    activeView === "my"
      ? Array.isArray(rawCustomers)
        ? rawCustomers
        : []
      : Array.isArray(rawSharedCustomers)
        ? rawSharedCustomers
        : [];
  const activeFetching =
    activeView === "my" ? customersFetching : sharedFetching;

  // Apply "Not visited in 3+ months" filter client-side
  const threeMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  }, []);

  const inactiveCount = useMemo(
    () =>
      rawCustomersForView.filter(
        (c) => !c.last_visit_at || new Date(c.last_visit_at) < threeMonthsAgo,
      ).length,
    [rawCustomersForView, threeMonthsAgo],
  );

  const customers = inactiveFilter
    ? rawCustomersForView.filter(
        (c) => !c.last_visit_at || new Date(c.last_visit_at) < threeMonthsAgo,
      )
    : rawCustomersForView;

  const inactiveChip: FilterChip = {
    key: "inactive",
    label: "Not visited in 3+ months",
    active: inactiveFilter,
    onClick: () => setInactiveFilter((v) => !v),
    count: inactiveFilter ? undefined : inactiveCount,
  };

  const isFirstLoad = rawCustomers === undefined && !search;
  const showLoadingScreen = orgLoading || (customersLoading && isFirstLoad);

  const displayError =
    isError || orgError ? (error?.message ?? t("noOrganization")) : null;

  return (
    <ListPageShell
      title={t("title")}
      description={
        customers.length
          ? `${customers.length} customer${customers.length !== 1 ? "s" : ""}`
          : undefined
      }
      loading={showLoadingScreen}
      error={displayError}
      onRetry={refetch}
      headerAction={
        <Button onClick={() => setNewCustomerDialogOpen(true)} size="default">
          <Plus className="size-4" />
          {t("addCustomer")}
        </Button>
      }
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <ToggleGroup
            multiple={false}
            value={[activeView]}
            onValueChange={(value) => {
              if (value.length > 0) setView(value[0]);
            }}
            spacing={1}
          >
            <ToggleGroupItem value="my">
              <Users className="size-3.5" />
              My Customers
            </ToggleGroupItem>
            <ToggleGroupItem value="shared">
              <Globe className="size-3.5" />
              Shared
            </ToggleGroupItem>
          </ToggleGroup>

          <ListToolbar
            search={{
              placeholder:
                activeView === "my"
                  ? t("searchPlaceholder")
                  : "Search shared customers...",
              value: search,
              onChange: setSearch,
              loading: activeFetching,
              resultLabel: customers.length
                ? `${customers.length} result${customers.length === 1 ? "" : "s"}`
                : undefined,
              emptyLabel: search ? `No matches for "${search}"` : undefined,
            }}
            filters={<FilterChips items={[inactiveChip]} />}
            stats={
              <span>
                {customers.length} customer{customers.length !== 1 ? "s" : ""}
              </span>
            }
            actions={
              activeView === "my" ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" render={<Link href={"/dashboard/customers/import"} />}>
                    <Upload className="size-4" />
                    {t("importCustomers")}
                  </Button>
                  <ExportButton
                    data={customers}
                    columns={exportColumns}
                    filename={`customers-${now.toISOString().split("T")[0]}.xlsx`}
                    sheetName="Customers"
                  />
                </div>
              ) : undefined
            }
          />

          <Card className="py-0">
            <CardContent className="p-0">
              {customers.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyTitle>{t("noCustomers")}</EmptyTitle>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      onClick={() => setNewCustomerDialogOpen(true)}
                      variant="outline"
                    >
                      {t("addFirstCustomer")}
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <DataTable
                  columns={activeView === "shared" ? sharedColumns : columns}
                  data={customers}
                  getRowId={(row) => row.id}
                  pageSize={20}
                  onRowClick={(row) => {
                    if (isMobile) {
                      setDetailCustomerId(row.id);
                    } else {
                      setSelectedCustomerId(
                        row.id === selectedCustomerId ? null : row.id,
                      );
                    }
                  }}
                  renderMobileCard={(customer) => {
                    const displayName =
                      [customer.first_name, customer.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      customer.company_name ||
                      customer.phone ||
                      "No name";
                    const lastVisit = customer.last_visit_at
                      ? (() => {
                          const lastVisitAt = customer.last_visit_at;
                          if (!lastVisitAt) return null;
                          const diff = Math.floor(
                            (Date.now() - new Date(lastVisitAt).getTime()) /
                              (1000 * 60 * 60 * 24),
                          );
                          if (diff === 0) return "Today";
                          if (diff === 1) return "Yesterday";
                          return `${diff} days ago`;
                        })()
                      : null;
                    return (
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                            {customer.type === "company" ? (
                              <Building2 className="size-4 text-muted-foreground/70" />
                            ) : (
                              <User className="size-4 text-muted-foreground/70" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium truncate block">
                              {displayName}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {customer.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                          <span>{customer.phone || customer.email || "—"}</span>
                          <div className="flex items-center gap-3">
                            <span>
                              {customer.vehicle_count ?? 0} vehicle
                              {customer.vehicle_count !== 1 ? "s" : ""}
                            </span>
                            {lastVisit && (
                              <>
                                <span>·</span>
                                <span>{lastVisit}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {selectedCustomerId && !isMobile && org?.orgId && (
          <div className="w-[440px] shrink-0 lg:w-[520px]">
            <CustomerDetailPanel
              customerId={selectedCustomerId}
              orgId={org.orgId}
              onClose={() => setSelectedCustomerId(null)}
            />
          </div>
        )}
      </div>
    </ListPageShell>
  );
}

export { CustomersPage };
