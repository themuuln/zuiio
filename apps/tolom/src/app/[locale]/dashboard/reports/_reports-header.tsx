import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface ReportsHeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  refreshing: boolean;
  t: (key: string) => string;
}

export function ReportsHeader({
  title,
  subtitle,
  onRefresh,
  refreshing,
  t,
}: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {title}
        </Typography.H1>
        <Typography.Muted className="text-sm text-muted-foreground">
          {subtitle}
        </Typography.Muted>
      </div>
      <Button
        variant="outline"
        size="sm"
        aria-label={t("refresh")}
        onClick={onRefresh}
        disabled={refreshing}
      >
        <RefreshCw
          className={`mr-1.5 size-3.5 ${refreshing ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {t("refresh")}
      </Button>
    </div>
  );
}
