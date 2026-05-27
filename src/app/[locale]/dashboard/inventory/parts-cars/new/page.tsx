"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreatePartsCar } from "@/lib/queries/use-inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/lib/i18n/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useState } from "react";

export default function NewPartsCarPage() {
  const t = useTranslations("inventory");
  const { push } = useRouter();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const create = useCreatePartsCar(orgId);
  const [saving, setSaving] = useState(false);
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      const car = await create.mutateAsync({
        make: form.get("make") as string,
        model: form.get("model") as string,
        year: form.get("year") ? Number(form.get("year")) : undefined,
        vin: (form.get("vin") as string)?.toUpperCase() || undefined,
        license_plate: (form.get("license_plate") as string) || undefined,
        purchase_cost: form.get("purchase_cost")
          ? Number(form.get("purchase_cost"))
          : 0,
        arrival_date: arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: (form.get("notes") as string) || undefined,
      });
      toast.success("Машин бүртгэгдлээ");
      push(`/dashboard/inventory/parts-cars/${car.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Амжилтгүй боллоо");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-xs"
          render={<Link href="/dashboard/inventory/parts-cars" />}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Шинэ задаргааны машин
          </h1>
          <p className="text-muted-foreground">
            Хятадаас ирсэн машины мэдээллийг бүртгэх
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Машины мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="make">
                  Үйлдвэрлэгч <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="make"
                  name="make"
                  required
                  placeholder="Toyota, Honda"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="model">
                  Модель <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="model"
                  name="model"
                  required
                  placeholder="Camry, Civic"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="year">Он</FieldLabel>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min={1980}
                  max={2030}
                  placeholder="2018"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="arrival_date">Ирсэн огноо</FieldLabel>
                <DatePicker
                  value={arrivalDate}
                  onChange={(date) => date && setArrivalDate(date)}
                  placeholder="Огноо сонгох"
                  fromYear={2020}
                  toYear={2026}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="vin">VIN</FieldLabel>
                <Input
                  id="vin"
                  name="vin"
                  placeholder="1HGCM82633A004352"
                  className="font-mono tracking-wider uppercase"
                  onChange={(e) => {
                    e.currentTarget.value = e.currentTarget.value.toUpperCase();
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="license_plate">Хятадын дугаар</FieldLabel>
                <Input
                  id="license_plate"
                  name="license_plate"
                  placeholder="Хятадын дугаар"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="purchase_cost">
                Худалдан авалтын үнэ
              </FieldLabel>
              <Input
                id="purchase_cost"
                name="purchase_cost"
                type="number"
                min={0}
                step={10000}
                placeholder="12,000,000"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Тэмдэглэл</FieldLabel>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Машины тухай нэмэлт мэдээлэл..."
                rows={3}
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                render={<Link href="/dashboard/inventory/parts-cars" />}
              >
                Буцах
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  "Бүртгэх"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
