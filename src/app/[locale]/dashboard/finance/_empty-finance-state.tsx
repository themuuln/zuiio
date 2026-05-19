"use client";

import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyFinanceState() {
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <DollarSign className="size-8 text-muted-foreground" />
        </div>
        <div className="max-w-md text-center">
          <h3 className="text-lg font-semibold">No financial data yet</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Complete work orders with services and parts to see your revenue
            breakdown, financial KPIs, and transaction history.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
