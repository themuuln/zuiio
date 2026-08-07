"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ErrorReportActionsProps {
  reportId: string;
}

export function ErrorReportActions({ reportId }: ErrorReportActionsProps) {
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status: "resolved" | "dismissed") {
    setUpdating(true);
    try {
      const res = await fetch(`/admin/api/error-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(
          status === "resolved" ? "Зассан гэж тэмдэглэлээ" : "Үл хэрэгсэх",
        );
        // Force page refresh to update the list
        window.location.reload();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Алдаа гарлаа");
      }
    } catch {
      toast.error("Сүлжээний алдаа");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex gap-1">
      <Button
        size="xs"
        variant="outline"
        disabled={updating}
        onClick={() => updateStatus("resolved")}
      >
        Зассан
      </Button>
      <Button
        size="xs"
        variant="ghost"
        disabled={updating}
        onClick={() => updateStatus("dismissed")}
      >
        Үл хэрэгсэх
      </Button>
    </div>
  );
}
