"use client";

import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/lib/i18n/navigation";

type CustomerType = "individual" | "company";

type CustomerFormState = {
  type: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const initialForm: CustomerFormState = {
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

export default function NewCustomerPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormState>(initialForm);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        const nextOrgId = data?.organizationId ?? data?.data?.organizationId;
        if (!nextOrgId) {
          setError("No organization found");
          return;
        }

        setOrgId(nextOrgId);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orgId) {
      setError("No organization found");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();

      if (json.error) {
        toast.error(json.error.message);
        setError(json.error.message);
        return;
      }

      toast.success("Customer created");
      router.replace(`/dashboard/customers/${json.data.id}`);
    } catch {
      toast.error("Failed to create customer");
      setError("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Customers", href: "/dashboard/customers" },
          { label: "New Customer" },
        ]}
      />
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/dashboard/customers" />}
          variant="ghost"
          size="icon"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Customer</h1>
          <p className="text-sm text-muted-foreground">
            Create a customer record before check-in or invoicing.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="type"
                >
                  Customer type
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
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Customer type"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>

              {form.type === "company" ? (
                <>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="companyName"
                    >
                      Company name
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
                      placeholder="Fleet Co."
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="contactPerson"
                    >
                      Contact person
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
                      placeholder="B. Batbold"
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
                      First name
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
                      placeholder="Bat"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="lastName"
                    >
                      Last name
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
                      placeholder="Erdene"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="phone"
                >
                  Phone
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
                  placeholder="99112233"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="email"
                >
                  Email
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
                  placeholder="customer@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="address"
                >
                  Address
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
                  placeholder="Ulaanbaatar"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="notes"
                >
                  Notes
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
                  rows={3}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Preferred contact time, fleet details, or special notes"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
              <Button
                render={<Link href="/dashboard/customers" />}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {saving ? "Creating..." : "Create customer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
