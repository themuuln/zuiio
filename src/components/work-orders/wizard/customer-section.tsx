"use client";

import { Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerForm } from "@/components/customers/customer-form";
import { Typography } from "@/components/ui/typography";
import { useWizardContext } from "./wizard-context";

export function CustomerSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  if (ctx.isRestoringFromDraft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            {t("customer")}
            <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-none" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="size-4" />
          {t("customer")}
          <span className="text-destructive">*</span>
          {ctx.selectedCustomer && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {[ctx.selectedCustomer.first_name, ctx.selectedCustomer.last_name]
                .filter(Boolean)
                .join(" ")}
              {ctx.selectedCustomer.phone && ` · ${ctx.selectedCustomer.phone}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ctx.selectedCustomer ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-950/10 p-4">
            <div className="flex items-center gap-3">
              <User className="size-5 text-green-600" />
              <div>
                <span className="font-medium">
                  {[
                    ctx.selectedCustomer.first_name,
                    ctx.selectedCustomer.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {ctx.selectedCustomer.phone && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {ctx.selectedCustomer.phone}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  ctx.setSelectedCustomer(null);
                  ctx.setSelectedVehicle(null);
                }}
              >
                <User className="size-4" />
                {t("change")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SearchInput
              placeholder={t("searchByNameOrPhone")}
              loading={ctx.customerSearching}
              onSearch={ctx.setCustomerSearch}
              debounceMs={400}
            />
            {ctx.customerSearch && ctx.customers.length > 0 && (
              <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
                {ctx.customers.map((c) => (
                  <Button
                    variant="ghost"
                    key={c.id}
                    onClick={() => ctx.handleSelectCustomer(c)}
                    className="w-full justify-start gap-3 p-3 min-h-[52px] h-auto"
                  >
                    <User className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="font-medium">
                        {[c.first_name, c.last_name]
                          .filter(Boolean)
                          .join(" ") || t("noName")}
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
            {!ctx.showQuickCustomer ? (
              <Button
                variant="outline"
                onClick={() => ctx.setShowQuickCustomer(true)}
                className="w-full justify-start gap-2 border-dashed p-3 min-h-[48px] h-auto"
              >
                <Plus className="size-4" />
                {t("quickCreateCustomer")}
              </Button>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/20 mt-2">
                <Typography.Text className="text-sm font-semibold mb-3 block">
                  Quick Add Customer
                </Typography.Text>
                <CustomerForm
                  mode="quick"
                  onSuccess={(customer) => {
                    ctx.handleSelectCustomer(customer);
                    ctx.setShowQuickCustomer(false);
                  }}
                  onCancel={() => ctx.setShowQuickCustomer(false)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
