"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EsimRow } from "@/lib/supabase/types";

export function EsimCard({ esim }: { esim: EsimRow }) {
  const t = useTranslations("order");
  const [copied, setCopied] = useState(false);
  if (!esim.lpa_string) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(esim.lpa_string as string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-5">
        <div className="rounded-xl border bg-white p-4">
          <QRCodeSVG value={esim.lpa_string} size={220} />
        </div>

        <div className="w-full">
          <p className="mb-1 text-xs text-muted-foreground">{t("lpaLabel")}</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
              {esim.lpa_string}
            </code>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
          {esim.iccid && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("iccid")}: {esim.iccid}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
