"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function GameDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Алдаа гарлаа</EmptyTitle>
          <EmptyDescription>
            Тоглолтын дэлгэрэнгүй мэдээллийг ачаалахад алдаа гарлаа. Дахин
            оролдоно уу.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={reset}>Дахин оролдох</Button>
            <Button asChild variant="outline">
              <Link href="/games">← Тоглолтууд руу буцах</Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  );
}
