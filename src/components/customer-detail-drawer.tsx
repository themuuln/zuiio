"use client";

import {
  ArrowLeft,
  Building2,
  Car,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/lib/i18n/navigation";

type CustomerType = "individual" | "company";

interface CustomerVehicleSummary {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
}

interface CustomerDetailData {
  id: string;
  type: CustomerType;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  vehicles: CustomerVehicleSummary[];
}

interface Props {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDisplayName(customer: CustomerDetailData) {
  if (customer.type === "company") {
    return (
      customer.company_name || customer.contact_person || "Unnamed company"
    );
  }
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.full_name ||
    customer.phone ||
    "Unnamed customer"
  );
}

export function CustomerDetailDrawer({
  customerId,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("customers");
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Resolve org ID on first open
  useEffect(() => {
    if (!open || orgId) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) setOrgId(id);
      })
      .catch(() => {});
  }, [open, orgId]);

  const fetchCustomer = useCallback(async () => {
    if (!customerId || !orgId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error.message ?? "Failed to load customer");
      } else {
        setCustomer(json.data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [customerId, orgId]);

  useEffect(() => {
    if (open && customerId && orgId) void fetchCustomer();
  }, [open, customerId, orgId, fetchCustomer]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setCustomer(null);
      setError(null);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                {loading ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <User className="size-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base">
                  {loading ? (
                    <span className="text-muted-foreground/60">
                      Loading...
                    </span>
                  ) : customer ? (
                    <span className="truncate block">
                      {getDisplayName(customer)}
                    </span>
                  ) : (
                    t("title")
                  )}
                </SheetTitle>
                {customer && (
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="capitalize">{customer.type}</span>
                    <span className="text-muted-foreground/30">&middot;</span>
                    <span>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1.5 hover:bg-muted transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchCustomer()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content — scrollable body */}
        {!loading && !error && customer && (
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-3">
            {/* Contact section */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </span>

              {customer.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 shrink-0 rounded-md bg-muted/60">
                    <Phone className="size-3.5 text-muted-foreground/70" />
                  </div>
                  <span className="text-sm">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 shrink-0 rounded-md bg-muted/60">
                    <Mail className="size-3.5 text-muted-foreground/70" />
                  </div>
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 shrink-0 rounded-md bg-muted/60">
                    <MapPin className="size-3.5 text-muted-foreground/70" />
                  </div>
                  <span className="text-sm">{customer.address}</span>
                </div>
              )}
              {customer.type === "company" && (
                <div className="flex items-center gap-2.5 pt-1.5 border-t border-border/50">
                  <div className="flex items-center justify-center size-6 shrink-0 rounded-md bg-muted/60">
                    <Building2 className="size-3.5 text-muted-foreground/70" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      {customer.company_name}
                    </span>
                    {customer.contact_person && (
                      <span className="text-xs text-muted-foreground block">
                        Contact: {customer.contact_person}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {!customer.phone &&
                !customer.email &&
                !customer.address && (
                  <p className="text-xs text-muted-foreground/60 italic">
                    No contact information
                  </p>
                )}
            </section>

            {/* Notes section */}
            {customer.notes && (
              <section className="rounded-lg border border-border/60 bg-card/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </span>
                <p className="mt-1.5 text-sm whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </section>
            )}

            {/* Vehicles section */}
            <section className="rounded-lg border border-border/60 bg-card/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center justify-center size-5 shrink-0 rounded-md bg-muted/60">
                  <Car className="size-3 text-muted-foreground/70" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Vehicles
                </span>
                {customer.vehicles.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {customer.vehicles.length}
                  </span>
                )}
              </div>
              {customer.vehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic py-2">
                  No vehicles registered
                </p>
              ) : (
                <div className="space-y-1.5">
                  {customer.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center gap-2.5 rounded-md bg-muted/40 p-2.5 border border-border/50"
                    >
                      <Car className="size-4 shrink-0 text-muted-foreground/50" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {vehicle.plate_number}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {[vehicle.year, vehicle.make, vehicle.model]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Footer */}
        {customer && !loading && (
          <div className="shrink-0 border-t border-border p-3">
            <Button
              className="w-full h-9 text-sm"
              render={<Link href={`/dashboard/customers/${customer.id}`} />}
            >
              <ArrowLeft className="size-4 rotate-180" />
              View full profile
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
