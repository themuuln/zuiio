"use client";

import { useEffect, useMemo, useState } from "react";

type FacebookStatus = {
  connected: boolean;
  pageName?: string;
  pageId?: string;
};

export function FacebookConnector() {
  const [status, setStatus] = useState<FacebookStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const statusClass = useMemo(() => {
    return `text-xs ${status.connected ? "text-green" : "text-text-muted"}`;
  }, [status.connected]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/facebook/status", { cache: "no-store" });
      if (!response.ok) {
        setStatus({ connected: false });
        return;
      }
      const data = (await response.json()) as FacebookStatus;
      setStatus(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const params = new URLSearchParams(window.location.search);
    const fb = params.get("fb");
    const msg = params.get("message");

    if (fb === "connected") {
      setMessage(msg ?? "Facebook page connected.");
    }

    if (fb === "error") {
      setMessage(msg ? `Facebook connection failed: ${msg}` : "Facebook connection failed.");
    }

    if (fb) {
      params.delete("fb");
      params.delete("message");
      const next = params.toString();
      const newUrl = next ? `${window.location.pathname}?${next}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/facebook/disconnect", { method: "POST" });
      await loadStatus();
      setMessage("Facebook page disconnected.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className={statusClass}>
        {loading ? "Checking Facebook connection..." : status.connected ? `Connected: ${status.pageName}` : "Not connected"}
      </div>

      {message ? <div className="text-[11px] text-text-muted leading-tight">{message}</div> : null}

      <div className="flex flex-col gap-1">
        <a className="inline-block text-center no-underline p-1.5 px-2.5 border border-border rounded-md bg-surface-2 text-text text-xs cursor-pointer transition-all hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60" href="/api/facebook/connect">
          {status.connected ? "Reconnect Facebook Page" : "Connect Facebook Page"}
        </a>
        {status.connected ? (
          <button className="p-1.5 px-2.5 border border-border rounded-md bg-transparent text-text-muted text-xs cursor-pointer transition-all hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60" onClick={disconnect} disabled={disconnecting}>
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : null}
      </div>

      {status.connected ? (
        <a
          className="inline-block text-center no-underline p-1.5 px-2.5 border border-border rounded-md bg-surface-2 text-text text-xs cursor-pointer transition-all hover:border-accent hover:bg-accent/10"
          href="/facebook/menu"
        >
          Manage Persistent Menu
        </a>
      ) : null}
    </div>
  );
}
