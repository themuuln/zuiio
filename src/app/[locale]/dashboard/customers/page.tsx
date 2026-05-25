"use client";

import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { CustomerDetailDrawer } from "@/components/customer-detail-drawer";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExportColumn } from "@/lib/export";
import { usePageHeader } from "@/hooks/use-page-header";
import { useCustomers } from "@/lib/queries/use-customers";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { columns } from "./_columns";
import type { CustomerRow } from "./_columns";

export default function CustomersPage() {
  const t = useTranslations("customers");
  const now = useClientNow();
  const [search, setSearch] = useState("");
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const { setNewCustomerDialogOpen } = usePageHeader();

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
    isLoading: orgLoading,
    isError: orgError,
  } = useCurrentOrg();

  const {
    data: rawCustomers,
    isLoading: customersLoading,
    isFetching: customersFetching,
    isError,
    error,
    refetch,
  } = useCustomers(org?.orgId, search);
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];

  const { registerTab, setOpen } = useRightSidebar();

  useEffect(() => {
    if (!rawCustomers) return;

    const now = new Date();
    const newThisMonth = customers.filter(
      (c) =>
        c.created_at &&
        new Date(c.created_at).getMonth() === now.getMonth() &&
        new Date(c.created_at).getFullYear() === now.getFullYear(),
    ).length;

    registerTab(
      "stats",
      "Stats",
      <StatusSummary
        title="Overview"
        items={[
          { label: "Total Customers", count: customers.length },
          { label: "New This Month", count: newThisMonth },
        ]}
      />,
    );

    const recent = [...customers]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        primary:
          [c.first_name, c.last_name].filter(Boolean).join(" ") ||
          c.phone ||
          "Unknown",
        secondary: c.phone,
      }));

    registerTab(
      "recent",
      "Recent",
      <RecentList items={recent} title="Recent Customers" />,
    );

    setOpen(true);
  }, [rawCustomers, customers, registerTab, setOpen]);

  const isFirstLoad = !customers && !search;
  const showLoadingScreen = orgLoading || (customersLoading && isFirstLoad);

  // ── Loading state ──────────────────────────────────────────

  if (showLoadingScreen) {
    return (
      <div className="tablet-touch flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || orgError) {
    return (
      <div className="tablet-touch flex flex-col gap-6">
        <p className="text-destructive">
          {error?.message ?? t("noOrganization")}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="tablet-touch flex flex-col gap-6 tablet:gap-6 tablet:px-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setNewCustomerDialogOpen(true)} size="lg">
          <Plus className="size-4" />
          {t("addCustomer")}
        </Button>
      </div>

      <ListToolbar
        search={{
          placeholder: t("searchPlaceholder"),
          value: search,
          onChange: setSearch,
          loading: customersFetching,
        }}
        stats={
          <span>
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <ExportButton
            data={customers}
            columns={exportColumns}
            filename={`customers-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Customers"
          />
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
              columns={columns}
              data={customers}
              getRowId={(row) => row.id}
              pageSize={20}
              onRowClick={(row) => setDetailCustomerId(row.id)}
            />
          )}
        </CardContent>
      </Card>

      <CustomerDetailDrawer
        customerId={detailCustomerId}
        open={detailCustomerId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailCustomerId(null);
        }}
      />
    </div>
  );
}
