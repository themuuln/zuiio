"use client";

import { Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QuickCreateCustomerDrawer } from "@/components/customers/quick-create-customer-drawer";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { PickerDrawer } from "@/components/ui/picker-drawer";
import { useCustomers } from "@/lib/queries/use-customers";
import type { Customer } from "@/lib/types";

interface CustomerPickerDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerPickerDrawer({
  orgId,
  open,
  onOpenChange,
  onSelect,
}: CustomerPickerDrawerProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const t = useTranslations("workOrderDetail");

  // Search customers via React Query
  const { data: customers = [], isFetching } = useCustomers(
    customerSearch ? orgId : undefined,
    customerSearch,
  );

  const handleSearch = (q: string) => {
    setCustomerSearch(q);
  };

  const initials = (c: Customer) => {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
    if (!name) return "\u2014";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0]?.[0]}${parts[1]?.[0]}`
      : name.slice(0, 2);
  };

  const hasSearched = customerSearch.length > 0;
  const noResults = hasSearched && !isFetching && customers.length === 0;

  return (
    <PickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t("selectCustomer")}
      size="2xl"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <SearchInput
            id="customer-picker-search"
            placeholder={t("searchByNameOrPhone")}
            loading={isFetching}
            onSearch={handleSearch}
            debounceMs={400}
            focusShortcut={false}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setQuickCreateOpen(true)}
            title={t("quickCreateCustomer")}
            className="shrink-0"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Search results */}
        {hasSearched && customers.length > 0 && (
          <div className="flex flex-col gap-0.5 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {customers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors min-h-[48px]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {initials(c)}
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-sm block truncate">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                      t("newCustomer")}
                  </span>
                  <span className="text-xs text-muted-foreground block truncate">
                    {c.phone || "\u00A0"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {noResults && (
          <div className="flex flex-col items-center gap-1 py-4 text-center">
            <User className="size-6 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">
              {t("noCustomersFound")}
            </span>
          </div>
        )}

        {/* Divider */}
        {hasSearched && customers.length > 0 && (
          <div className="border-t border-border" />
        )}

        {/* Nested quick create drawer */}
        <QuickCreateCustomerDrawer
          open={quickCreateOpen}
          onOpenChange={setQuickCreateOpen}
          orgId={orgId}
          onCreated={(customer) => {
            onSelect(customer);
            onOpenChange(false);
          }}
        />
      </div>
    </PickerDrawer>
  );
}
