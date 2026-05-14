"use client";

import { ArrowLeft, Building2, Car, Pencil, Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import type { ExportColumn } from "@/lib/export";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/lib/i18n/navigation";

type CustomerType = "individual" | "company";

interface CustomerVehicleSummary {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
}

interface CustomerDetailResponse {
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

interface CustomerFormState {
  type: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: CustomerFormState = {
  type: "individual",
  firstName: "",
  lastName: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function getCustomerDisplayName(customer: CustomerDetailResponse) {
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

export default function CustomerDetailPage() {
  const t = useTranslations("customers");
  const commonT = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null);

  const vehicleExportColumns: ExportColumn<CustomerVehicleSummary>[] = [
    { key: "plate_number", label: "Plate" },
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year" },
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);

  const syncForm = useCallback((nextCustomer: CustomerDetailResponse) => {
    setForm({
      type: nextCustomer.type,
      firstName: nextCustomer.first_name ?? "",
      lastName: nextCustomer.last_name ?? "",
      companyName: nextCustomer.company_name ?? "",
      contactPerson: nextCustomer.contact_person ?? "",
      phone: nextCustomer.phone ?? "",
      email: nextCustomer.email ?? "",
      address: nextCustomer.address ?? "",
      notes: nextCustomer.notes ?? "",
    });
  }, []);

  const fetchCustomer = useCallback(async () => {
    if (!orgId || !customerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
      );
      const json = await response.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setCustomer(json.data);
      syncForm(json.data);
    } catch {
      setError(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [customerId, orgId, syncForm, t]);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        const nextOrgId = data?.organizationId ?? data?.data?.organizationId;
        if (!nextOrgId) {
          setError(t("noOrganization"));
          return;
        }

        setOrgId(nextOrgId);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (orgId) {
      void fetchCustomer();
    }
  }, [fetchCustomer, orgId]);

  const handleSave = async () => {
    if (!orgId || !customerId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const json = await response.json();

      if (json.error) {
        toast.error(json.error.message);
        setError(json.error.message);
        return;
      }

      const nextCustomer = {
        ...(customer as CustomerDetailResponse),
        ...json.data,
      };

      setCustomer(nextCustomer);
      syncForm(nextCustomer);
      setEditing(false);
      toast.success("Customer updated");
    } catch {
      toast.error(t("failedToSave"));
      setError(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[34rem] w-full" />
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          render={<Link href="/dashboard/customers" />}
          variant="ghost"
          className="w-fit"
        >
          <ArrowLeft className="size-4" />
          {commonT("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => void fetchCustomer()} variant="outline">
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const customerName = getCustomerDisplayName(customer);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: t("title"), href: "/dashboard/customers" },
          { label: customerName },
        ]}
      />
      <div className="flex items-center gap-4">
        <Button
          render={<Link href="/dashboard/customers" />}
          variant="ghost"
          size="icon"
          aria-label={commonT("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{customerName}</h1>
          <p className="text-sm text-muted-foreground">
            Added {new Date(customer.created_at).toLocaleDateString()}
          </p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            {commonT("edit")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              {saving ? commonT("saving") : commonT("save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                syncForm(customer);
                setEditing(false);
              }}
            >
              <X className="size-4" />
              {commonT("cancel")}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="type"
                >
                  {t("type")}
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as CustomerType,
                    }))
                  }
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                >
                  <option value="individual">{t("individual")}</option>
                  <option value="company">{t("company")}</option>
                </select>
              </div>

              {form.type === "company" ? (
                <>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="companyName"
                    >
                      {t("companyName")}
                    </label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          companyName: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="contactPerson"
                    >
                      {t("contactPerson")}
                    </label>
                    <Input
                      id="contactPerson"
                      value={form.contactPerson}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          contactPerson: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="firstName"
                    >
                      {t("firstName")}
                    </label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="lastName"
                    >
                      {t("lastName")}
                    </label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="phone"
                >
                  {t("phone")}
                </label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="email"
                >
                  {t("email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="address"
                >
                  {t("address")}
                </label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="notes"
                >
                  {t("notes")}
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("phone")}
                </p>
                <p className="text-sm font-medium">{customer.phone || "—"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("email")}
                </p>
                <p className="text-sm font-medium">{customer.email || "—"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("type")}
                </p>
                <p className="text-sm font-medium capitalize">
                  {customer.type}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("contactPerson")}
                </p>
                <p className="text-sm font-medium">
                  {customer.contact_person || customer.first_name || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("address")}
                </p>
                <p className="text-sm font-medium">{customer.address || "—"}</p>
              </div>
              {customer.type === "company" && (
                <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                  <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-3.5" />
                    Company account
                  </p>
                  <p className="text-sm font-medium">
                    {customer.company_name || "Unnamed company"}
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("notes")}
                </p>
                <p className="whitespace-pre-wrap text-sm font-medium">
                  {customer.notes || "—"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {t("vehicles")} ({customer.vehicles.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <ExportButton
                data={customer.vehicles}
                columns={vehicleExportColumns}
                filename={`customer-${customer.id.slice(0, 8)}-vehicles.xlsx`}
                sheetName="Vehicles"
                label="Export"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/vehicles/new?customerId=${customer.id}`)
                }
              >
                <Car className="size-4" />
                {t("addVehicle")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customer.vehicles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("noVehicles")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {customer.vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/vehicles/${vehicle.id}`)
                  }
                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                >
                  <Car className="size-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{vehicle.plate_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {[vehicle.year, vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  </div>
                  <ArrowLeft className="size-4 rotate-180 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
