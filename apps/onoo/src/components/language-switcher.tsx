"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentLang = searchParams.get("lang") || "mn";

  const toggleLanguage = () => {
    const newLang = currentLang === "mn" ? "en" : "mn";
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", newLang);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage}>
      {currentLang === "mn" ? "🇬🇧 EN" : "🇲🇳 MN"}
    </Button>
  );
}
