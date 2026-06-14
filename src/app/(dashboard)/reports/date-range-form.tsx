"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRouteDate } from "@/lib/format";

export function DateRangeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? formatRouteDate();
  const to = searchParams.get("to") ?? formatRouteDate();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newFrom = formData.get("from") as string;
    const newTo = formData.get("to") as string;

    const params = new URLSearchParams();
    if (newFrom) params.set("from", newFrom);
    if (newTo) params.set("to", newTo);

    router.push(`/reports?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="from">Эхлэх огноо</Label>
        <Input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          className="h-8 w-40 max-w-full"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="to">Дуусах огноо</Label>
        <Input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          className="h-8 w-40 max-w-full"
        />
      </div>
      <Button type="submit" size="sm">
        Харах
      </Button>
    </form>
  );
}
