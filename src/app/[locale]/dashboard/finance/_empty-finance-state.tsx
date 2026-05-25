"use client";

import { DollarSign } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyFinanceState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <DollarSign />
        </EmptyMedia>
        <EmptyTitle>No financial data yet</EmptyTitle>
        <EmptyDescription>
          Complete work orders with services and parts to see your revenue
          breakdown, financial KPIs, and transaction history.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
