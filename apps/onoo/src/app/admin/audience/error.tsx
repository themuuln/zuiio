"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-destructive text-xl">
            Алдаа гарлаа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Уучлаарай, системд алдаа гарлаа. Дахин оролдох эсвэл админ хэсэгт
            буцаж орно уу.
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}

          <details className="group text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Дэлгэрэнгүй мэдээлэл
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>

          <div className="flex gap-3">
            <Button onClick={() => reset()} variant="default">
              Дахин оролдох
            </Button>
            <Button onClick={() => router.push("/admin")} variant="outline">
              Админ хэсэг рүү буцах
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
