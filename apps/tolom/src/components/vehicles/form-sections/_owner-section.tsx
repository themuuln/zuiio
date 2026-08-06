"use client";

import { Plus, User } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { CustomerForm } from "@/components/customers/customer-form";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Typography } from "@/components/ui/typography";
import type { Customer } from "@/lib/types";
import type { CommonT, VehicleFormApi, VehicleFormT } from "./_types";

// ── Helpers ──────────────────────────────────────────────────

export function getCustomerLabel(
  customer: Customer,
  fallback = "Unnamed customer",
) {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.company_name ||
    customer.contact_person ||
    customer.full_name ||
    customer.phone ||
    fallback
  );
}

// ── Component ────────────────────────────────────────────────

type OwnerSectionProps = {
  form: VehicleFormApi;
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  customerSearch: string;
  setCustomerSearch: Dispatch<SetStateAction<string>>;
  customerResults: Customer[];
  customerSearching: boolean;
  showQuickCustomer: boolean;
  setShowQuickCustomer: Dispatch<SetStateAction<boolean>>;
  t: VehicleFormT;
  commonT: CommonT;
};

export function OwnerSection({
  form,
  selectedCustomer,
  setSelectedCustomer,
  customerSearch,
  setCustomerSearch,
  customerResults,
  customerSearching,
  showQuickCustomer,
  setShowQuickCustomer,
  t,
  commonT,
}: OwnerSectionProps) {
  return (
    <Card
      className={
        "animate-fade-in" +
        " " +
        (form.formState.errors.root
          ? "border-destructive/50 bg-destructive/5"
          : "border-border")
      }
    >
      <CardHeader className="py-4">
        <CardTitle className="text-base flex items-center justify-between">
          {t("ownerCustomer")}
          {selectedCustomer && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {getCustomerLabel(selectedCustomer, t("unnamedCustomer"))}
              {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
                {getCustomerLabel(selectedCustomer, t("unnamedCustomer"))}
                {selectedCustomer.phone && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {selectedCustomer.phone}
                  </span>
                )}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                {commonT("change")}
              </Button>
            </ItemActions>
          </Item>
        ) : (
          <div className="flex flex-col gap-3">
            {!showQuickCustomer && (
              <>
                <SearchInput
                  placeholder={t("searchPlaceholder")}
                  loading={customerSearching}
                  onSearch={setCustomerSearch}
                  debounceMs={400}
                />
                {customerSearch && customerResults.length > 0 && (
                  <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                    {customerResults.map((c) => (
                      <Button
                        variant="ghost"
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="w-full justify-start gap-3 p-3 min-h-[52px] h-auto"
                      >
                        <User className="size-5 shrink-0 text-muted-foreground" />
                        <div>
                          <span className="font-medium">
                            {getCustomerLabel(c, t("unnamedCustomer"))}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickCustomer(true)}
                  className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
                >
                  <Plus className="size-4" />
                  {t("quickAddCustomer")}
                </Button>
              </>
            )}

            {/* Inline customer quick registration form */}
            {showQuickCustomer && (
              <div className="border rounded-lg p-4 bg-muted/20 mt-2">
                <Typography.Text className="text-sm font-semibold mb-3 block">
                  {t("quickAddCustomerTitle")}
                </Typography.Text>
                <CustomerForm
                  mode="quick"
                  disableFormWrapper
                  onSuccess={(cust) => {
                    setSelectedCustomer(cust);
                    setShowQuickCustomer(false);
                  }}
                  onCancel={() => setShowQuickCustomer(false)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
