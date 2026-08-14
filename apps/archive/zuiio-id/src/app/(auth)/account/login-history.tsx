"use client";

import { useCallback, useEffect, useState } from "react";

interface LoginAttempt {
  id: string;
  identifier: string;
  success: boolean;
  ip_address: string | null;
  attempted_at: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Одоо";
  if (diffMin < 60) return `${diffMin} минутын өмнө`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} цагийн өмнө`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} өдрийн өмнө`;
}

export function LoginHistory() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/login-history");
      if (res.ok) {
        const data = (await res.json()) as { attempts: LoginAttempt[] };
        setAttempts(data.attempts ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm text-muted-foreground">Ачаалж байна…</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Нэвтрэх түүх олдсонгүй.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {attempts.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-2 rounded-full ${
                  a.success ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-foreground">
                {a.success ? "Амжилттай" : "Амжилтгүй"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {a.ip_address ?? "IP мэдээлэлгүй"} · {timeAgo(a.attempted_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
