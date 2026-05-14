"use client";

import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/search-input";
import { useWizardContext } from "./wizard-context";
import { useTranslations } from "next-intl";

export function CustomerSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="size-4" />
          {t("customer")}
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
                  {[ctx.selectedCustomer.first_name, ctx.selectedCustomer.last_name]
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => ctx.setSelectedCustomer(null)}
            >
              {t("change")}
            </Button>
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
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => ctx.handleSelectCustomer(c)}
                    className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 min-h-[52px]"
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
                  </button>
                ))}
              </div>
            )}
            {!ctx.showQuickCustomer && (
              <button
                type="button"
                onClick={() => ctx.setShowQuickCustomer(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:bg-muted/30 min-h-[48px]"
              >
                <Plus className="size-4" />
                {t("quickCreateCustomer")}
              </button>
            )}
            {ctx.showQuickCustomer && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20">
                <p className="text-sm font-medium">{t("newCustomer")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="First name *"
                    value={ctx.quickFirstName}
                    onChange={(e) => ctx.setQuickFirstName(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Last name"
                    value={ctx.quickLastName}
                    onChange={(e) => ctx.setQuickLastName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Input
                  placeholder="Phone"
                  value={ctx.quickPhone}
                  onChange={(e) => ctx.setQuickPhone(e.target.value)}
                  className="h-11"
                />
                {ctx.customerCreateError && (
                  <p className="text-sm text-destructive">{ctx.customerCreateError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      ctx.setShowQuickCustomer(false);
                      ctx.setQuickFirstName("");
                      ctx.setQuickLastName("");
                      ctx.setQuickPhone("");
                    }}
                  >
                    {t("cancel")}
                    
                  </Button>
                  <Button
                    size="sm"
                    disabled={ctx.creatingCustomer || !ctx.quickFirstName.trim()}
                    onClick={ctx.handleQuickCreateCustomer}
                  >
                    {ctx.creatingCustomer ? t("creating") : t("createAndSelectCustomer")}
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
