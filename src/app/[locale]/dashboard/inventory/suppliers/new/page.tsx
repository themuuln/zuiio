"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/lib/i18n/navigation";
import { useCreateSupplier } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";

export default function NewSupplierPage() {
  const t = useTranslations("inventory");
  const { push, back } = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const createSupplier = useCreateSupplier(orgId);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      await createSupplier.mutateAsync({
        name: name.trim(),
        contact_person: contactPerson || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        tax_id: taxId || undefined,
        payment_terms: paymentTerms || undefined,
        notes: notes || undefined,
      });
      toast.success(t("supplierCreated"));
      push("/dashboard/inventory/suppliers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToCreate"));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => back()}
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("newSupplier")}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="name">
                {t("name")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="h-11"
              required />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="contact_person">
                  {t("contactPerson")}
                </FieldLabel>
                <Input id="contact_person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder={t("contactPersonPlaceholder")}
                className="h-11" />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">
                  {t("phone")}
                </FieldLabel>
                <Input id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className="h-11" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="email">
                {t("email")}
              </FieldLabel>
              <Input id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="h-11" />
            </Field>
            <Field>
              <FieldLabel htmlFor="address">
                {t("address")}
              </FieldLabel>
              <Input id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("addressPlaceholder")}
              className="h-11" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="tax_id">
                  {t("taxIdPlaceholder")}
                </FieldLabel>
                <Input id="tax_id"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder={t("taxIdPlaceholder")}
                className="h-11" />
              </Field>
              <Field>
                <FieldLabel htmlFor="payment_terms">
                  {t("paymentTermsPlaceholder")}
                </FieldLabel>
                <Input id="payment_terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder={t("paymentTermsPlaceholder")}
                className="h-11" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="notes">
                {t("notes")}
              </FieldLabel>
              <Input id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="h-11" />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => back()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={createSupplier.isPending}>
            {createSupplier.isPending ? t("saving") : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
