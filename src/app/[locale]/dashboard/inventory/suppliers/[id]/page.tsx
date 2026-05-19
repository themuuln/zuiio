"use client";

import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/lib/i18n/navigation";
import { useSuppliers, useUpdateSupplier } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export default function EditSupplierPage() {
  const t = useTranslations("inventory");
  const params = useParams();
  const { push, back } = useRouter();
  const supplierId = params.id as string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: suppliers = [], isLoading } = useSuppliers(orgId);
  const updateSupplier = useUpdateSupplier(orgId);

  const supplier = suppliers.find((s) => s.id === supplierId);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContactPerson(supplier.contact_person ?? "");
      setPhone(supplier.phone ?? "");
      setEmail(supplier.email ?? "");
      setAddress(supplier.address ?? "");
      setTaxId(supplier.tax_id ?? "");
      setPaymentTerms(supplier.payment_terms ?? "");
      setNotes(supplier.notes ?? "");
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      await updateSupplier.mutateAsync({
        id: supplierId,
        body: {
          name: name.trim(),
          contact_person: contactPerson || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          tax_id: taxId || undefined,
          payment_terms: paymentTerms || undefined,
          notes: notes || undefined,
        },
      });
      toast.success(t("supplierUpdated"));
      push("/dashboard/inventory/suppliers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToUpdate"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <Button variant="ghost" onClick={() => back()} className="w-fit">
          <ArrowLeft className="size-4" /> {t("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{t("supplierNotFound")}</p>
            <Button
              onClick={() => push("/dashboard/inventory/suppliers")}
            >
              {t("backToList")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => back()}
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("editSupplier")}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="h-11"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">{t("contactPerson")}</Label>
                <Input
                  id="contact_person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder={t("contactPersonPlaceholder")}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_id">{t("taxId")}</Label>
                <Input
                  id="tax_id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder={t("taxIdPlaceholder")}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">{t("paymentTerms")}</Label>
                <Input
                  id="payment_terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder={t("paymentTermsPlaceholder")}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => back()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={updateSupplier.isPending}>
            {updateSupplier.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
