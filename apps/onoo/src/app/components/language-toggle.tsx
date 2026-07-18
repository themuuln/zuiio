"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang") ?? "mn";
  const isEn = currentLang === "en";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (isEn) {
      params.delete("lang");
    } else {
      params.set("lang", "en");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-label={isEn ? "Монгол хэл рүү шилжүүлэх" : "Switch to English"}
      className="gap-1.5"
    >
      <span aria-hidden="true">{isEn ? "🇬🇧" : "🇲🇳"}</span>
      <span className="hidden sm:inline">{isEn ? "EN" : "MN"}</span>
    </Button>
  );
}
