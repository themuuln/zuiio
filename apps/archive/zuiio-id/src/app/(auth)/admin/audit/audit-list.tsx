"use client";

import { useState } from "react";

const EVENT_LABELS: Record<string, string> = {
  consent_approved: "Зөвшөөрөл өгсөн",
  consent_denied: "Зөвшөөрөл татгалзсан",
  grant_revoked: "Эрх цуцалсан",
  session_revoked: "Сесси цуцалсан",
  mfa_enrolled: "MFA нэмсэн",
  mfa_unenrolled: "MFA хассан",
  mfa_verified: "MFA баталгаажуулсан",
  oauth_error: "OAuth алдаа",
};

interface AuditEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  client_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
}

export function AuditLogList({ events }: { events: AuditEvent[] }) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? events.filter((e) => e.event_type === filter)
    : events;

  return (
    <div className="flex flex-col gap-4">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <option value="">Бүх төрөл</option>
        {Object.entries(EVENT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="flex items-start justify-between rounded-lg border border-border px-3 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {EVENT_LABELS[e.event_type] ?? e.event_type}
              </span>
              <span className="text-xs text-muted-foreground">
                {e.ip_address ?? "—"} · {e.user_id?.slice(0, 8) ?? "—"}
              </span>
            </div>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {new Date(e.occurred_at).toLocaleString("mn-MN")}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Аудит үйлдэл олдсонгүй.
          </p>
        )}
      </div>
    </div>
  );
}
