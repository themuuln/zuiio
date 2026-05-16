"use client";

import { Plus, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import { usePartsCars } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatMNT } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  arrived: "bg-blue-100 text-blue-700",
  disassembling: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  arrived: "Ирсэн",
  disassembling: "Задалж байна",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};

export default function PartsCarsListPage() {
  const t = useTranslations("inventory");
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: cars = [], isLoading } = usePartsCars(orgId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return cars;
    const q = search.toLowerCase();
    return cars.filter(
      (c) =>
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.vin ?? "").toLowerCase().includes(q) ||
        (c.license_plate ?? "").toLowerCase().includes(q),
    );
  }, [cars, search]);

  if (!orgId) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Задаргааны машин
        </h1>
        <p className="text-muted-foreground">
          Хятадаас ирсэн задаргааны машинуудын бүртгэл
        </p>
      </div>

      <ListToolbar
        search={{
          placeholder: "Машин, VIN, улсын дугаараар хайх...",
          value: search,
          onChange: setSearch,
        }}
        stats={<span>{filtered.length} машин</span>}
        actions={
          <Button size="lg" render={<Link href="/dashboard/inventory/parts-cars/new" />}>
            <Plus className="size-4" />
            Шинэ машин
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Truck className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Задаргааны машин байхгүй</p>
            <Button variant="outline" render={<Link href="/dashboard/inventory/parts-cars/new" />}>
              Шинэ машин бүртгэх
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((car) => (
            <Link
              key={car.id}
              href={`/dashboard/inventory/parts-cars/${car.id}`}
            >
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {car.make} {car.model}
                      </p>
                      {car.year && (
                        <p className="text-sm text-muted-foreground">
                          {car.year}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[car.status] ?? ""}`}
                    >
                      {STATUS_LABELS[car.status] ?? car.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {car.vin && (
                      <p className="text-muted-foreground font-mono text-xs truncate">
                        VIN: {car.vin}
                      </p>
                    )}
                    {car.license_plate && (
                      <p className="text-muted-foreground font-mono text-xs">
                        {car.license_plate}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Өртөг:{" "}
                      <span className="font-semibold text-foreground">
                        {formatMNT(car.purchase_cost)}
                      </span>
                    </p>
                    {car.status === "completed" && (
                      <>
                        <p className="text-muted-foreground">
                          Сэлбэг:{" "}
                          <span className="font-semibold text-foreground">
                            {car.total_parts_actual} ширхэг
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Үнэлгээ:{" "}
                          <span className="font-semibold text-green-600">
                            {formatMNT(car.total_estimated_value)}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Ашиг:{" "}
                          <span
                            className={`font-semibold ${
                              car.total_estimated_value - car.purchase_cost > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatMNT(
                              car.total_estimated_value - car.purchase_cost,
                            )}
                          </span>
                        </p>
                      </>
                    )}
                    {car.status === "disassembling" && (
                      <p className="text-xs text-amber-600 font-medium">
                        ● Задалж байна
                      </p>
                    )}
                    {car.status === "arrived" && (
                      <p className="text-xs text-blue-600 font-medium">
                        ● Задлаагүй
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
