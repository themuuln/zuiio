"use client";

import { AlertTriangle, Plus, User } from "lucide-react";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/types";

interface CustomerSelectProps {
  orgId: string;
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
}

export function CustomerSelect({
  orgId,
  selectedCustomer,
  onSelect,
  onClear,
}: CustomerSelectProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [quickFirstName, setQuickFirstName] = useState("");
  const [quickLastName, setQuickLastName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Search customers
  const handleSearch = (q: string) => {
    setCustomerSearch(q);
    if (!orgId || !q) {
      setCustomers([]);
      return;
    }
    setSearching(true);
    fetch(
      `/api/organizations/${orgId}/customers?q=${encodeURIComponent(q)}`,
    )
      .then((r) => r.json())
      .then((d) => setCustomers(d.data ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setSearching(false));
  };

  // Quick create
  const handleQuickCreate = async () => {
    if (!orgId || !quickFirstName.trim()) {
      setCreateError("First name is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: quickFirstName.trim(),
          last_name: quickLastName.trim() || null,
          phone: quickPhone.trim() || null,
          type: "individual",
        }),
      });
      const json = await res.json();
      if (json.error) {
        if (json.error.code === "CONFLICT") {
          setCreateError(
            "This phone number belongs to an existing customer. Search for them instead.",
          );
        } else {
          setCreateError(json.error.message ?? "Failed to create customer");
        }
      } else if (json.data) {
        onSelect(json.data);
        setQuickFirstName("");
        setQuickLastName("");
        setQuickPhone("");
        setShowQuick(false);
      }
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="size-4" />
          Customer
          {selectedCustomer && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {[selectedCustomer.first_name, selectedCustomer.last_name]
                .filter(Boolean)
                .join(" ")}
              {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
            <div className="flex items-center gap-3">
              <User className="size-5 text-green-600" />
              <div>
                <span className="font-medium">
                  {[selectedCustomer.first_name, selectedCustomer.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {selectedCustomer.phone && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {selectedCustomer.phone}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Change
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SearchInput
              placeholder="Search by name or phone..."
              loading={searching}
              onSearch={handleSearch}
              debounceMs={400}
            />
            {customerSearch && customers.length > 0 && (
              <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                {customers.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 min-h-[48px]"
                  >
                    <User className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="font-medium">
                        {[c.first_name, c.last_name]
                          .filter(Boolean)
                          .join(" ") || "No name"}
                      </span>
                      {c.phone && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!showQuick && (
              <button
                type="button"
                onClick={() => setShowQuick(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:bg-muted/30 min-h-[48px]"
              >
                <Plus className="size-4" />
                Quick create customer
              </button>
            )}
            {showQuick && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
                <p className="text-sm font-medium">New Customer</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="First name *"
                    value={quickFirstName}
                    onChange={(e) => setQuickFirstName(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Last name"
                    value={quickLastName}
                    onChange={(e) => setQuickLastName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Input
                  placeholder="Phone"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="h-11"
                />
                {createError && createError.includes("belongs to") ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>{createError}</span>
                  </div>
                ) : createError ? (
                  <p className="text-sm text-destructive">{createError}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuick(false);
                      setCreateError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={creating || !quickFirstName.trim()}
                    onClick={handleQuickCreate}
                  >
                    {creating ? "Creating..." : "Create & Select"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
