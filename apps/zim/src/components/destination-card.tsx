import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { DestinationDto } from "@/lib/catalog";
import { countryFlag, formatMnt } from "@/lib/format";

export function DestinationCard({ dest }: { dest: DestinationDto }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const name = locale === "mn" ? dest.nameMn : dest.nameEn;

  return (
    <Link href={`/destinations/${dest.slug}`} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="text-3xl">{countryFlag(dest.countryCode)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">
              {t("packages", { count: dest.packageCount })}
            </p>
          </div>
          {dest.fromPriceMnt !== null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("from")}</p>
              <p className="font-semibold">{formatMnt(dest.fromPriceMnt)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
