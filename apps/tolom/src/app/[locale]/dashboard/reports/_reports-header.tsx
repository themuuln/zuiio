import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { ListPageShell } from "@/components/list-page-shell";
import { Button } from "@/components/ui/button";

interface ReportsHeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  refreshing: boolean;
  t: (key: string) => string;
  children?: ReactNode;
}

export function ReportsHeader({
  title,
  subtitle,
  onRefresh,
  refreshing,
  t,
  children,
}: ReportsHeaderProps) {
  return (
    <ListPageShell
      title={title}
      description={subtitle}
      headerAction={
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
      }
    >
      {children}
    </ListPageShell>
  );
}
