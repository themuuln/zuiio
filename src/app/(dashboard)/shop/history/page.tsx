"use client";

import { ClockCounterClockwise } from "@phosphor-icons/react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-lg font-semibold">Борлуулалтын түүх</h1>
      <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClockCounterClockwise className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Борлуулалт байхгүй</EmptyTitle>
          <EmptyDescription>
            Борлуулалт хийгдсэний дараа энд харагдах болно.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
