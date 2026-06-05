import { Car, CheckCircle2, HistoryIcon, User, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Typography } from "@/components/ui/typography";
import { formatMNT } from "@/lib/utils";
import {
  formatDate,
  formatTime,
  type LookupResult,
  type ServiceHistoryEntry,
} from "./_vehicle-registration-schema";

const STATUS_COLORS: Record<string, string> = {
  Completed: "bg-green-500",
  "Ready for Pickup": "bg-green-400",
  "In Progress": "bg-amber-500",
  Diagnosing: "bg-blue-500",
  New: "bg-slate-400",
  Cancelled: "bg-red-400",
};

function ServiceTimelineEntry({
  entry,
  isLast,
}: {
  entry: ServiceHistoryEntry;
  isLast: boolean;
}) {
  const dotColor = STATUS_COLORS[entry.status] ?? "bg-slate-400";

  return (
    <div key={entry.work_order_id} className="relative flex gap-3 pb-4">
      {!isLast && (
        <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-border" />
      )}

      <div className="relative z-10 mt-1 shrink-0">
        <div
          className={`size-5 ${dotColor} ring-2 ring-background flex items-center justify-center`}
        >
          {entry.status === "Completed" ? (
            <CheckCircle2 className="size-3 text-white" />
          ) : (
            <div className="size-2 bg-white" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold capitalize">
            {entry.status}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(entry.created_at)} {formatTime(entry.created_at)}
          </span>
        </div>

        {entry.complaint && (
          <Typography.Muted className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {entry.complaint}
          </Typography.Muted>
        )}

        {entry.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.services.map((s) => (
              <span
                key={`${s.name}-${s.price}`}
                className="inline-flex items-center gap-1 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                <Wrench className="size-3" />
                {s.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {entry.total > 0 && (
            <span className="font-medium text-foreground/80">
              {formatMNT(entry.total)}
            </span>
          )}
          {entry.mechanic_name && (
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {entry.mechanic_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceTimeline({
  history,
}: {
  history: LookupResult["serviceHistory"];
}) {
  const t = useTranslations("bayView");
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
        <HistoryIcon className="size-10 mb-2" />
        <Typography.Text className="text-sm">
          {t("noServiceHistory")}
        </Typography.Text>
        <Typography.Text className="text-xs mt-1">
          {t("serviceRecordsHere")}
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {history.map((entry, idx) => (
        <ServiceTimelineEntry
          key={entry.work_order_id}
          entry={entry}
          isLast={idx === history.length - 1}
        />
      ))}
    </div>
  );
}

export function TimelinePanel({
  lookupResult,
  lookupDone,
}: {
  lookupResult: LookupResult;
  lookupDone: boolean;
}) {
  const t = useTranslations("bayView");
  const { vehicle, customer, serviceHistory } = lookupResult;

  return (
    <div className="w-full lg:w-[360px] shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center size-8 bg-amber-500/10">
          <HistoryIcon className="size-4 text-amber-500" />
        </div>
        <span className="text-sm font-semibold">{t("serviceTimeline")}</span>
        {serviceHistory.length > 0 && (
          <span className="bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {serviceHistory.length}
          </span>
        )}
      </div>

      {lookupDone ? (
        <ScrollArea className="max-h-[420px] pr-1">
          {vehicle && (
            <div className="mb-4 bg-muted/30 border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">
                    {vehicle.plate_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.make} {vehicle.model}
                    {vehicle.year ? ` · ${vehicle.year}` : ""}
                  </div>
                </div>
                {vehicle.color && (
                  <div
                    className="size-5 border border-border"
                    style={{
                      backgroundColor: vehicle.color.toLowerCase(),
                    }}
                    title={vehicle.color}
                  />
                )}
              </div>
              {customer && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground border-t border-border/40 pt-2">
                  <User className="size-3" />
                  {[customer.first_name, customer.last_name]
                    .filter(Boolean)
                    .join(" ") || t("unknown")}{" "}
                  · {customer.phone}
                </div>
              )}
            </div>
          )}
          <ServiceTimeline history={serviceHistory} />
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
          <Car className="size-12 mb-3" />
          <Typography.Text className="text-sm font-medium">
            {t("enterPlateAbove")}
          </Typography.Text>
          <Typography.Text className="text-xs mt-1">
            {t("timelineWillAppear")}
          </Typography.Text>
        </div>
      )}
    </div>
  );
}
