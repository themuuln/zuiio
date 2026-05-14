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
import { useMemo, useState } from "react";
import { CustomerDetailDrawer } from "@/components/customer-detail-drawer";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/lib/database.types";
import type { ExportColumn } from "@/lib/export";
import { Link } from "@/lib/i18n/navigation";
import { useCustomers } from "@/lib/queries/use-customers";
import { useCurrentOrg } from "@/lib/queries/use-organization";

interface CustomerWithVehicleCount extends Customer {
  vehicle_count?: number;
}

function getCustomerDisplayName(customer: CustomerWithVehicleCount) {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.company_name ||
    customer.contact_person ||
    customer.full_name ||
    customer.phone ||
    "No name"
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead className="hidden sm:table-cell">Contact</TableHead>
          <TableHead className="text-center">Vehicles</TableHead>
          <TableHead className="hidden md:table-cell">Visits</TableHead>
          <TableHead className="hidden lg:table-cell">Last Visit</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="space-y-1.5">
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

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function CustomersPage() {
  const t = useTranslations("customers");
  const [search, setSearch] = useState("");
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);

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
    data: customers,
    isLoading: customersLoading,
    isFetching: customersFetching,
    isError,
    error,
    refetch,
  } = useCustomers(org?.orgId, search);

  const isFirstLoad = !customers && !search;
  const showLoadingScreen = orgLoading || (customersLoading && isFirstLoad);

  if (showLoadingScreen) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-8 tablet:px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <SearchInput placeholder="Search customers..." loading disabled />
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
      <div className="flex flex-col gap-6">
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
    <div className="flex flex-col gap-6 tablet:gap-8 tablet:px-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {(customers ?? []).length} customer
            {(customers ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/dashboard/customers/new" />} size="lg">
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
            {(customers ?? []).length} customer
            {(customers ?? []).length !== 1 ? "s" : ""}
          </span>
        }
        actions={
          <ExportButton
            data={customers ?? []}
            columns={exportColumns}
            filename={`customers-${new Date().toISOString().split("T")[0]}.xlsx`}
            sheetName="Customers"
          />
        }
      />

      <Card className="py-0">
        <CardContent className="p-0">
          {(customers ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-4">
              <Users className="size-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">{t("noCustomers")}</p>
              <Button
                render={<Link href="/dashboard/customers/new" />}
                variant="outline"
              >
                {t("addFirstCustomer")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="text-center">Vehicles</TableHead>
                  <TableHead className="hidden md:table-cell">Visits</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last Visit
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => {
                  const lastVisit = formatDate(customer.last_visit_at);
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
                              {getCustomerDisplayName(customer)}
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
                        <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                          <Car className="mr-1 size-3 text-muted-foreground/60" />
                          {customer.vehicle_count ?? 0}
                        </span>
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
                            Never
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
    </div>
  );
}
