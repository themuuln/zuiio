"use client";

import { AlertTriangle, Plus, User } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import type { Customer } from "@/lib/types";

interface CustomerPickerModalProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerPickerModal({
  orgId,
  open,
  onOpenChange,
  onSelect,
}: CustomerPickerModalProps) {
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

  const handleSearch = (q: string) => {
    setCustomerSearch(q);
    if (!orgId || !q) {
      setCustomers([]);
      return;
    }
    setSearching(true);
    fetch(`/api/organizations/${orgId}/customers?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.data?.data ?? []))
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
          firstName: data.first_name.trim(),
          lastName: data.last_name?.trim() || null,
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
        onOpenChange(false);
      }
    } catch {
      setCreateError("Network error");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        initialFocus={() =>
          document.getElementById("customer-picker-search") ?? undefined
        }
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Select Customer
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 -mt-2">
          <SearchInput
            id="customer-picker-search"
            placeholder="Search by name or phone..."
            loading={searching}
            onSearch={handleSearch}
            debounceMs={400}
            focusShortcut={false}
          />

          {customerSearch && customers.length > 0 && (
            <div className="flex flex-col gap-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
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
                  <User className="size-5 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-sm">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                        "No name"}
                    </span>
                    {c.phone && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.phone}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!showQuick && (
            <Button
              variant="outline"
              onClick={() => setShowQuick(true)}
              className="w-full justify-start gap-2 border-dashed"
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
              <Field data-invalid={!!form.formState.errors.first_name}>
                <FieldContent>
                  <Input
                    placeholder="e.g. Bat"
                    aria-invalid={!!form.formState.errors.first_name}
                    className="h-11"
                    {...inputProps("firstName")}
                    {...form.register("first_name")}
                    autoFocus
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
                  />
                </FieldContent>
              </Field>
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
      </DialogContent>
    </Dialog>
  );
}
