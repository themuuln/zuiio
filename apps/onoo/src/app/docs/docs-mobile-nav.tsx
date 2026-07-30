"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DOCS_NAV } from "./docs-nav";

export function DocsMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const flatNavItems = DOCS_NAV.flatMap((g) => g.items);
  const currentLabel =
    flatNavItems.find((i) => i.href === pathname)?.label ?? "";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm lg:hidden">
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">Баримт бичиг</p>
        <p className="text-xs text-muted-foreground">
          Хэсгээс сонгож шууд шилжинэ.
        </p>
      </div>
      <Select value={pathname} onValueChange={(v) => v && router.push(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Хэсэг сонгох">{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DOCS_NAV.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.items.map((item) => (
                <SelectItem key={item.href} value={item.href}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
