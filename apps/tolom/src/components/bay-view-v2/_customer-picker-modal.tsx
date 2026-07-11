"use client";

import { AlertTriangle, Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useCustomers } from "@/lib/queries/use-customers";
import { reportServerError } from "@/lib/sentry-report-server";
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
  const [showQuick, setShowQuick] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const t = useTranslations("workOrderDetail");

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

  // Search customers via React Query
  const { data: customers = [], isFetching } = useCustomers(
    customerSearch ? orgId : undefined,
    customerSearch,
  );

  const handleSearch = (q: string) => {
    setCustomerSearch(q);
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
    } catch (error) {
      reportServerError("Unexpected error", error);
      setCreateError("Network error");
    }
  });

  const initials = (c: Customer) => {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
    if (!name) return "\u2014";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0]![0]}${parts[1]![0]}`
      : name.slice(0, 2);
  };

  const hasSearched = customerSearch.length > 0;
  const noResults = hasSearched && !isFetching && customers.length === 0;

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
            {t("selectCustomer")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <SearchInput
            id="customer-picker-search"
            placeholder={t("searchByNameOrPhone")}
            loading={isFetching}
            onSearch={handleSearch}
            debounceMs={400}
            focusShortcut={false}
          />

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
                    {c.phone && (
                      <span className="text-xs text-muted-foreground">
                        {c.phone}
                      </span>
                    )}
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

          {/* Quick create */}
          {!showQuick && (
            <Button
              variant="outline"
              onClick={() => setShowQuick(true)}
              className="w-full justify-start gap-2"
            >
              <Plus className="size-4" />
              {t("quickCreateCustomer")}
            </Button>
          )}

          {showQuick && (
            <form
              className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20"
              onSubmit={handleQuickCreate}
            >
              <Typography.Text className="text-sm font-medium">
                {t("newCustomer")}
              </Typography.Text>
              <Field data-invalid={!!form.formState.errors.first_name}>
                <FieldContent>
                  <Input
                    placeholder={t("firstNamePlaceholder")}
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
                    placeholder={t("lastNamePlaceholder")}
                    className="h-11"
                    {...inputProps("lastName")}
                    {...form.register("last_name")}
                  />
                </FieldContent>
              </Field>
              <Field data-invalid={!!form.formState.errors.phone}>
                <FieldContent>
                  <Input
                    placeholder={t("phonePlaceholder")}
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
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    form.formState.isSubmitting ||
                    !form.watch("first_name").trim()
                  }
                >
                  {form.formState.isSubmitting ? "..." : t("createAndSelect")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
