"use client";

import { Car } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BookingRequestForm } from "@/components/booking/booking-request-form";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

function BookingSuccess({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center p-8">
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
              {message ||
                "The shop will contact you shortly to confirm your appointment."}
            </Typography.Muted>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<"form" | "submitted">("form");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setPageState("submitted");
  };

  if (pageState === "submitted") {
    return <BookingSuccess message={successMessage ?? undefined} />;
  }

  return (
    <div className="mx-auto max-w-lg p-4 md:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Car className="size-6 text-primary" />
        </div>
        <Typography.H1 className="text-xl font-semibold">
          Book a Service
        </Typography.H1>
        <Typography.Muted className="text-sm text-muted-foreground mt-1">
          Fill out the form below and the shop will contact you to confirm.
        </Typography.Muted>
      </div>

      <BookingRequestForm token={token} onSuccess={handleSuccess} />
    </div>
  );
}
