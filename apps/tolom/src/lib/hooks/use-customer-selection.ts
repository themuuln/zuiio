"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useCustomerSearch,
  useCustomersByPlate,
} from "@/lib/queries/use-wizard-data";
import type { Customer } from "@/lib/types";

export function useCustomerSelection(orgId: string | undefined) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);

  const { data: customerSearchResults, isFetching: customerSearchFetching } =
    useCustomerSearch(orgId, customerSearch);
  const { data: plateSearchResults, isFetching: plateSearchFetching } =
    useCustomersByPlate(orgId, customerSearch);

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

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setShowQuickCustomer(false);
  }, []);

  return {
    customerSearch,
    setCustomerSearch,
    customers,
    setCustomers,
    selectedCustomer,
    setSelectedCustomer,
    showQuickCustomer,
    setShowQuickCustomer,
    customerSearching: customerSearchFetching || plateSearchFetching,
    handleSelectCustomer,
  } as const;
}
