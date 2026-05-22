"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useCreatePartsCar } from "@/lib/queries/use-inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/inventory/parts-cars" />}>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Марк *</Label>
                <Input
                  id="make"
                  name="make"
                  required
                  placeholder="Toyota, Honda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Модел *</Label>
                <Input
                  id="model"
                  name="model"
                  required
                  placeholder="Camry, Civic"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Он</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min={1980}
                  max={2030}
                  placeholder="2018"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_date">Ирсэн огноо</Label>
                <DatePicker
                  value={arrivalDate}
                  onChange={(date) => date && setArrivalDate(date)}
                  placeholder="Огноо сонгох"
                  fromYear={2020}
                  toYear={2026}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vin">VIN дугаар</Label>
                <Input
                  id="vin"
                  name="vin"
                  placeholder="1HGCM82633A004352"
                  className="font-mono tracking-wider uppercase"
                  onChange={(e) => {
                    e.currentTarget.value = e.currentTarget.value.toUpperCase();
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_plate">Улсын дугаар</Label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  placeholder="Хятадын дугаар"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_cost">Аврах үнө (₮)</Label>
              <Input
                id="purchase_cost"
                name="purchase_cost"
                type="number"
                min={0}
                step={10000}
                placeholder="12,000,000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Тэмдэглэл</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Машины тухай нэмэлт мэдээлэл..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" render={<Link href="/dashboard/inventory/parts-cars" />}>
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
