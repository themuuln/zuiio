"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function BillingToggle({
  monthly,
  yearly,
  savePercent,
}: {
  monthly: string;
  yearly: string;
  savePercent: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const annual = searchParams.get("billing") === "annual";

  const setAnnual = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("billing", "annual");
    else params.delete("billing");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <span className={cn("text-sm", !annual && "font-semibold")}>
        {monthly}
      </span>
      <Switch checked={annual} onCheckedChange={setAnnual} />
      <span className={cn("text-sm", annual && "font-semibold")}>{yearly}</span>
      <Badge variant="outline" className="text-xs">
        {savePercent}
      </Badge>
    </div>
  );
}
