"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrantInfo, SessionInfo } from "./actions";
import { getGrants, getSessions } from "./actions";

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Тодорхойлогдоогүй төхөөрөмж";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Mobile") || ua.includes("Android")) return "Мобайл";
  return ua.slice(0, 40);
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

export function SessionManager() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [grants, setGrants] = useState<GrantInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [s, g] = await Promise.all([getSessions(), getGrants()]);
    setSessions(s);
    setGrants(g);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active sessions */}
      {sessions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-foreground">
            Идэвхитай суултууд
          </h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} onRevoked={refresh} />
            ))}
          </div>
        </div>
      )}

      {/* Connected products */}
      {grants.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-foreground">
            Холбогдсон бүтээгдэхүүд
          </h2>
          <div className="space-y-2">
            {grants.map((g) => (
              <GrantRow key={g.id} grant={g} onRevoked={refresh} />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && grants.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Нэмэлт мэдээлэл байхгүй.
        </p>
      )}
    </div>
  );
}

function SessionRow({
  session,
  onRevoked,
}: {
  session: SessionInfo;
  onRevoked: () => void;
}) {
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    await fetch("/api/account/revoke-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: session.id }),
    });
    onRevoked();
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${session.is_current ? "border-success/30 bg-success/5" : "border-border bg-card"}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          {parseUserAgent(session.user_agent)}
          {session.is_current && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-success">
              <span className="inline-block size-1.5 rounded-full bg-success" />
              (одоо)
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {timeAgo(session.updated_at)}
          {session.ip_address ? ` · ${session.ip_address}` : ""}
          {session.aal ? ` · AAL${session.aal}` : ""}
        </p>
      </div>
      {!session.is_current && (
        <button
          type="button"
          onClick={handleRevoke}
          disabled={revoking}
          className="ml-2 shrink-0 text-xs text-destructive hover:underline disabled:opacity-50"
        >
          {revoking ? "Устгаж байна..." : "Устгах"}
        </button>
      )}
    </div>
  );
}

function GrantRow({
  grant,
  onRevoked,
}: {
  grant: GrantInfo;
  onRevoked: () => void;
}) {
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    const res = await fetch("/api/account/revoke-grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: grant.client_id }),
    });
    if (res.ok) onRevoked();
    else setRevoking(false);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{grant.client_name}</p>
        <p className="text-xs text-muted-foreground">
          {grant.scopes} · {timeAgo(grant.created_at)}
        </p>
      </div>
      <button
        type="button"
        onClick={handleRevoke}
        disabled={revoking}
        className="ml-2 shrink-0 text-xs text-destructive hover:underline disabled:opacity-50"
      >
        {revoking ? "Устгаж байна..." : "Холболт устгах"}
      </button>
    </div>
  );
}
