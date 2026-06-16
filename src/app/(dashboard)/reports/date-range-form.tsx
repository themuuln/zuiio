"use client";

import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export function DateRangeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      return { from: new Date(from), to: new Date(to) };
    }
    const today = new Date();
    return { from: today, to: today };
  });

  const navigateToRange = useCallback(
    (r: DateRange | undefined) => {
      if (!r?.from || !r?.to) return;
      const params = new URLSearchParams();
      params.set("from", format(r.from, "yyyy-MM-dd"));
      params.set("to", format(r.to, "yyyy-MM-dd"));
      router.push(`/reports?${params.toString()}`);
    },
    [router],
  );

  const handleChange = (r: DateRange | undefined) => {
    setRange(r);
    if (r?.from && r?.to) {
      navigateToRange(r);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <DateRangePicker
        value={range}
        onChange={handleChange}
        placeholder="Огноо сонгох"
      />
    </div>
  );
}
