"use client";

import { AlertTriangle, Plus, User } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
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
  const [createError, setCreateError] = useState<string | null>(null);

  const customerQuickSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
  });

  type CustomerQuickValues = z.infer<typeof customerQuickSchema>;

  const form = useForm<CustomerQuickValues>({
    resolver: zodResolver(customerQuickSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
    },
  });

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

  const handleQuickCreate = form.handleSubmit(async (data) => {
    if (!orgId) return;
    setCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.first_name.trim(),
          last_name: data.last_name?.trim() || null,
          phone: data.phone?.trim() || null,
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
        form.reset();
        setShowQuick(false);
      }
    } catch {
      setCreateError("Network error");
    }
  });

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
          <Item
            variant="outline"
            className="border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4"
          >
            <ItemMedia
              variant="icon"
              className="[&_svg]:size-5 [&_svg]:text-green-600"
            >
              <User />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {[selectedCustomer.first_name, selectedCustomer.last_name]
                  .filter(Boolean)
                  .join(" ")}
                {selectedCustomer.phone && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {selectedCustomer.phone}
                  </span>
                )}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="sm" onClick={onClear}>
                Change
              </Button>
            </ItemActions>
          </Item>
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
                onSubmit={handleQuickCreate}
              >
                <Typography.Text className="text-sm font-medium">
                  New Customer
                </Typography.Text>
                <div className="grid grid-cols-2 gap-3">
                  <Field data-invalid={!!form.formState.errors.first_name}>
                    <FieldContent>
                      <Input
                        placeholder="e.g. Bat"
                        aria-invalid={!!form.formState.errors.first_name}
                        className="h-11"
                        {...inputProps("firstName")}
                        {...form.register("first_name")}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const formEl = e.currentTarget.closest("form");
                            if (formEl) {
                              const inputs = formEl.querySelectorAll("input");
                              inputs[1]?.focus();
                            }
                          }
                        }}
                      />
                      {form.formState.errors.first_name && (
                        <FieldError>
                          {form.formState.errors.first_name.message}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldContent>
                      <Input
                        placeholder="e.g. Erdene"
                        className="h-11"
                        {...inputProps("lastName")}
                        {...form.register("last_name")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const formEl = e.currentTarget.closest("form");
                            if (formEl) {
                              const inputs = formEl.querySelectorAll("input");
                              inputs[2]?.focus();
                            }
                          }
                        }}
                      />
                    </FieldContent>
                  </Field>
                </div>
                <Field data-invalid={!!form.formState.errors.phone}>
                  <FieldContent>
                    <Input
                      placeholder="e.g. 99112233"
                      type="tel"
                      className="h-11"
                      aria-invalid={!!form.formState.errors.phone}
                      {...inputProps("phone")}
                      {...form.register("phone", {
                        onChange: (e) => {
                          e.target.value = formatMongolianPhone(e.target.value);
                        },
                      })}
                    />
                    {form.formState.errors.phone && (
                      <FieldError>
                        {form.formState.errors.phone.message}
                      </FieldError>
                    )}
                  </FieldContent>
                </Field>
                {createError?.includes("belongs to") ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>{createError}</span>
                  </div>
                ) : createError ? (
                  <Typography.Text className="text-sm text-destructive">
                    {createError}
                  </Typography.Text>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowQuick(false);
                      setCreateError(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      form.formState.isSubmitting ||
                      !form.watch("first_name").trim()
                    }
                  >
                    {form.formState.isSubmitting
                      ? "Creating..."
                      : "Create & Select"}
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
