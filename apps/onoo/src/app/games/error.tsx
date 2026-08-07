"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function GamesError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Алдаа гарлаа</EmptyTitle>
          <EmptyDescription>
            Тоглолтын мэдээллийг ачаалахад алдаа гарлаа. Дахин оролдоно уу.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>Дахин оролдох</Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
