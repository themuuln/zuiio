"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TransfersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          Error loading transfers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {error.message || "Something went wrong loading stock transfers."}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
}
