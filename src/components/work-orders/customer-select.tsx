"use client";

import { AlertTriangle, Plus, User } from "lucide-react";
import { useState } from "react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
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
    fetch(`/api/organizations/${orgId}/customers?q=${encodeURIComponent(q)}`)
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
                  <Button
                    variant="ghost"
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="w-full justify-start gap-3 p-3 min-h-[48px] h-auto"
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
                  </Button>
                ))}
              </div>
            )}
            {!showQuick && (
              <Button
                variant="outline"
                onClick={() => setShowQuick(true)}
                className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
              >
                <Plus className="size-4" />
                Quick create customer
              </Button>
            )}
            {showQuick && (
              <form
                className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuickCreate();
                }}
              >
                <p className="text-sm font-medium">New Customer</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="e.g. Bat"
                    value={quickFirstName}
                    onChange={(e) => setQuickFirstName(e.target.value)}
                    className="h-11"
                    {...inputProps("firstName")}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        // Focus last name
                        const form = e.currentTarget.closest("form");
                        if (form) {
                          const inputs = form.querySelectorAll("input");
                          inputs[1]?.focus();
                        }
                      }
                    }}
                  />
                  <Input
                    placeholder="e.g. Erdene"
                    value={quickLastName}
                    onChange={(e) => setQuickLastName(e.target.value)}
                    className="h-11"
                    {...inputProps("lastName")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        // Focus phone
                        const form = e.currentTarget.closest("form");
                        if (form) {
                          const inputs = form.querySelectorAll("input");
                          inputs[2]?.focus();
                        }
                      }
                    }}
                  />
                </div>
                <Input
                  placeholder="e.g. 99112233"
                  type="tel"
                  value={quickPhone}
                  onChange={(e) =>
                    setQuickPhone(formatMongolianPhone(e.target.value))
                  }
                  className="h-11"
                  {...inputProps("phone")}
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
                    type="button"
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
                    type="submit"
                    size="sm"
                    disabled={creating || !quickFirstName.trim()}
                  >
                    {creating ? "Creating..." : "Create & Select"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
