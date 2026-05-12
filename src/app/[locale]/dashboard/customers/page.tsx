"use client";

import { Phone, Plus, Users } from "lucide-react";
import { useState } from "react";
import { ListToolbar } from "@/components/list-toolbar";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer } from "@/lib/database.types";
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

function CustomerRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border p-4">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");

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

  const loading = orgLoading || (customersLoading && !customers);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <SearchInput placeholder="Search customers..." loading disabled />
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <CustomerRowSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || orgError) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-destructive">
          {error?.message ?? "No organization found"}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            {(customers ?? []).length} customer
            {(customers ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/dashboard/customers/new" />} size="lg">
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <ListToolbar
        search={{
          placeholder: "Search by name, phone, or email...",
          value: search,
          onChange: setSearch,
          loading: customersFetching,
        }}
        stats={
          <span>
            {(customers ?? []).length} customer{(customers ?? []).length !== 1 ? "s" : ""}
          </span>
        }
      />

      <Card>
        <CardContent className="p-0">
          {(customers ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-4">
              <Users className="size-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No customers found</p>
              <Button
                render={<Link href="/dashboard/customers/new" />}
                variant="outline"
              >
                Add your first customer
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {customers?.map((customer) => {
                return (
                  <Link
                    key={customer.id}
                    href={`/dashboard/customers/${customer.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 min-h-[72px]"
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-base font-medium">
                        {getCustomerDisplayName(customer)}
                      </span>
                      {customer.phone && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="size-3.5" />
                          {customer.phone}
                        </span>
                      )}
                      {!customer.phone && customer.email && (
                        <span className="text-sm text-muted-foreground">
                          {customer.email}
                        </span>
                      )}
                    </div>
                    {customer.vehicle_count !== undefined && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="text-base font-semibold tabular-nums">
                          {customer.vehicle_count ?? 0}
                        </span>
                        <span className="hidden sm:inline">
                          vehicle
                          {customer.vehicle_count !== 1 ? "s" : ""}
                        </span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
