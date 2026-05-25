"use client";

import {
  Building2,
  Car,
  ChevronRight,
  Clock,
  Plus,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { CustomerDetailDrawer } from "@/components/customer-detail-drawer";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/lib/types";
import type { ExportColumn } from "@/lib/export";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useCustomers } from "@/lib/queries/use-customers";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { NewCustomerDialog } from "@/components/new-customer-dialog";
import { useSearchParams } from "next/navigation";

interface CustomerWithVehicleCount extends Customer {
  vehicle_count?: number;
}

function getCustomerDisplayName(
  customer: CustomerWithVehicleCount,
  t?: (key: string, params?: Record<string, string | number | Date>) => string,
) {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.company_name ||
    customer.contact_person ||
    customer.full_name ||
    customer.phone ||
    (t?.("noContactInfo") ?? "No name")
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const t = useTranslations("customers");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead className="hidden sm:table-cell">{t("contact")}</TableHead>
          <TableHead className="text-center">{t("vehicles")}</TableHead>
          <TableHead className="hidden md:table-cell">{t("totalVisits")}</TableHead>
          <TableHead className="hidden lg:table-cell">{t("lastVisit")}</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={`row-${i}`}>
            <TableCell>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="mx-auto h-5 w-8 rounded-full" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-8" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="size-4" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function formatDate(
  dateString: string | null,
  t: (key: string, params?: Record<string, string | number | Date>) => string,
  now?: Date,
) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const reference = now ?? new Date();
  const diff = reference.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t("today");
  if (days === 1) return t("yesterday");
  if (days < 7) return t("daysAgo", { days });
  if (days < 30) return t("weeksAgo", { weeks: Math.floor(days / 7) });
  return date.toLocaleDateString();
}

export default function CustomersPage() {
  const t = useTranslations("customers");
  const now = useClientNow();
  const [search, setSearch] = useState("");
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Auto-open dialog when navigated from quick-create action
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setNewDialogOpen(true);
      // Clean URL so next click re-triggers
      replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams, replace]);

  const handleNewDialogOpenChange = useCallback((open: boolean) => {
    setNewDialogOpen(open);
  }, [setNewDialogOpen]);

  const exportColumns: ExportColumn<CustomerWithVehicleCount>[] = useMemo(
    () => [
      {
        key: "first_name",
        label: "Name",
        value: (c) => getCustomerDisplayName(c),
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
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
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

  if (showLoadingScreen) {
    return (
      <div className="tablet-touch flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <SearchInput placeholder={t("searchPlaceholder")} loading disabled />
        <Card>
          <CardContent className="p-0">
            <TableSkeleton />
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {(customers ?? []).length}{" "}
            {t("name").toLowerCase()}
            {(customers ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setNewDialogOpen(true)} size="lg">
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
            {(customers ?? []).length}{" "}
            {t("name").toLowerCase()}
            {(customers ?? []).length !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <ExportButton
            data={customers ?? []}
            columns={exportColumns}
            filename={`customers-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Customers"
          />
        }
      />

      <Card className="py-0">
        <CardContent className="p-0">
          {(customers ?? []).length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>{t("noCustomers")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => setNewDialogOpen(true)}
                  variant="outline"
                >
                  {t("addFirstCustomer")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("contact")}
                  </TableHead>
                  <TableHead className="text-center">{t("vehicles")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("totalVisits")}</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("lastVisit")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => {
                  const lastVisit = formatDate(customer.last_visit_at, t, now);
                  return (
                    <TableRow
                      key={customer.id}
                      className="h-16 cursor-pointer"
                      onClick={() => setDetailCustomerId(customer.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
                            {customer.type === "company" ? (
                              <Building2 className="size-4 text-muted-foreground/70" />
                            ) : (
                              <User className="size-4 text-muted-foreground/70" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {getCustomerDisplayName(customer, t)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {customer.type}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="min-w-0 max-w-44">
                          {customer.phone ? (
                            <p className="truncate text-sm">{customer.phone}</p>
                          ) : customer.email ? (
                            <p className="truncate text-sm text-muted-foreground">
                              {customer.email}
                            </p>
                          ) : (
                            <span className="text-sm text-muted-foreground/50">
                              &mdash;
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1 tabular-nums">
                          <Car className="size-3 text-muted-foreground/60" />
                          {customer.vehicle_count ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm tabular-nums">
                          {customer.total_visits}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lastVisit ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-3.5 shrink-0 text-muted-foreground/50" />
                            <span>{lastVisit}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">
                            {t("never")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="size-4 text-muted-foreground/40" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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

      <NewCustomerDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
      />
    </div>
  );
}
