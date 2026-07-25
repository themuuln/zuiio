"use client";

import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StatusSubscribeForm() {
  const t = useTranslations("status") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
        <CheckCircle className="size-4" />
        {t("subscribed")}
      </div>
    );
  }

  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (email) setSubscribed(true);
      }}
    >
      <Input
        type="email"
        placeholder={t("subscribePlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" size="sm">
        {t("subscribeButton")}
      </Button>
    </form>
  );
}
