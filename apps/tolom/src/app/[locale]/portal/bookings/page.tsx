"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  pending: {
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent",
  },
  confirmed: {
    variant: "default",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent",
  },
  completed: {
    variant: "secondary",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent",
  },
  cancelled: {
    variant: "outline",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface PortalBooking {
  id: string;
  status: string;
  scheduled_at: string;
  time_slot?: string;
  service?: string;
  vehicle: {
    plate_number: string;
    make: string;
    model: string;
  } | null;
}

export default function PortalBookingsPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const {
    data: bookings,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "bookings", "list"],
    queryFn: async () => {
      const res = await fetch("/api/portal/bookings", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadBookings"));
      const json = await res.json();
      return (json.data ?? []) as PortalBooking[];
    },
    enabled: !!customer,
  });

  if (authLoading || isPending) {
    return <PageShellSkeleton cards={3} title={t("portal.bookings")} />;
  }

  if (error) {
    return (
      <PageErrorState
        description={error.message}
        onRetry={() => refetch()}
        className="min-h-[260px]"
      />
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Typography.H1 className="text-xl font-semibold">
          {t("portal.bookings")}
        </Typography.H1>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Calendar className="size-10 text-muted-foreground/50" />
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("portal.noBookings")}
            </Typography.Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Typography.H1 className="text-xl font-semibold">
        {t("portal.bookings")}
      </Typography.H1>

      <div className="flex flex-col gap-3">
        {bookings.map((booking: PortalBooking) => {
          const config = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
          const label = STATUS_LABELS[booking.status] ?? booking.status;
          const vehicle = booking.vehicle;

          return (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {vehicle ? `${vehicle.plate_number}` : "\u2014"}
                      </span>
                      <Badge
                        variant={config.variant}
                        className={config.className}
                      >
                        {label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>
                        {new Date(booking.scheduled_at).toLocaleDateString()}
                      </span>
                      {booking.time_slot && <span>{booking.time_slot}</span>}
                      {booking.service && <span>{booking.service}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
