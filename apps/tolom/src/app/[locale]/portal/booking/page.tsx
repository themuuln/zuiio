"use client";

import { Car } from "lucide-react";
import { useState } from "react";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";

function PortalBookingSuccess() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg items-center justify-center p-8">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-5 py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/20">
            <Car className="size-8 text-green-400" />
          </div>
          <div className="text-center">
            <Typography.H2 className="text-lg font-semibold">
              Booking Request Sent!
            </Typography.H2>
            <Typography.Muted className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              The shop will contact you to confirm your appointment.
            </Typography.Muted>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PortalBookingPage() {
  const { customer, loading } = usePortalAuth();
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (submitted) {
    return <PortalBookingSuccess />;
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <Typography.H1 className="text-xl font-semibold mb-6">
        Book a Service
      </Typography.H1>
      <Typography.Muted className="text-sm text-muted-foreground mb-6">
        Request an appointment and we will contact you to confirm.
      </Typography.Muted>
      <BookingRequestForm
        token=""
        apiEndpoint="/api/portal/bookings"
        initialName={
          customer
            ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
            : undefined
        }
        initialPhone={customer?.phone ?? undefined}
        onSuccess={() => setSubmitted(true)}
      />
    </div>
  );
}
