import "server-only";

import { after } from "next/server";
import { createServiceClient, type ServiceClient } from "@/lib/supabase";

export type TraceStatus = "ok" | "error" | "filtered";

export interface TraceInput {
  traceId: string;
  organizationId?: string | null;
  channel: string;
  channelChatId?: string | null;
  channelUserId?: string | null;
  requestText?: string | null;
  responseText?: string | null;
  toolCalls?: unknown[];
  timings?: Record<string, number>;
  status: TraceStatus;
  error?: string | null;
  requestId?: string | null;
  deploymentId?: string | null;
}

export interface TraceLogger {
  traceId: string;
  startMs: number;
  log: (level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) => void;
  set: (patch: Partial<TraceInput>) => void;
  error: (err: unknown) => void;
  flush: () => void;
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Create a per-request trace logger.
 * - Structured JSON to Vercel logs (always)
 * - Persistent row in gateway_traces via after() (never blocks response)
 *
 * DX: Vercel dashboard shows JSON, `pnpm logs` tails, dashboard /dashboard/traces reads DB.
 */
export function createTraceLogger(input: {
  traceId: string;
  organizationId?: string | null;
  channel: string;
  channelChatId?: string | null;
  channelUserId?: string | null;
  requestText?: string | null;
  requestId?: string | null;
  deploymentId?: string | null;
}): TraceLogger {
  const startMs = Date.now();
  let data: TraceInput = {
    traceId: input.traceId,
    organizationId: input.organizationId ?? null,
    channel: input.channel,
    channelChatId: input.channelChatId ?? null,
    channelUserId: input.channelUserId ?? null,
    requestText: input.requestText ?? null,
    responseText: null,
    toolCalls: [],
    timings: {},
    status: "ok",
    error: null,
    requestId: input.requestId ?? null,
    deploymentId: input.deploymentId ?? null,
  };

  function log(level: "info" | "warn" | "error", message: string, extra?: Record<string, unknown>) {
    const payload = {
      level,
      traceId: data.traceId,
      channel: data.channel,
      orgId: data.organizationId,
      msg: message,
      ...(extra ? extra : {}),
      elapsedMs: Date.now() - startMs,
    };
    // Vercel parses JSON lines — keep single line, no truncation
    const line = safeJson(payload);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  function set(patch: Partial<TraceInput>) {
    data = { ...data, ...patch };
  }

  function error(err: unknown) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : safeJson(err);
    data.status = "error";
    data.error = msg.slice(0, 2000);
    log("error", msg, { error: data.error });
  }

  function flush() {
    const row = {
      trace_id: data.traceId,
      organization_id: data.organizationId || null,
      channel: data.channel,
      channel_chat_id: data.channelChatId || null,
      channel_user_id: data.channelUserId || null,
      request_text: data.requestText ? data.requestText.slice(0, 4000) : null,
      response_text: data.responseText ? data.responseText.slice(0, 4000) : null,
      tool_calls: data.toolCalls ?? [],
      timings: data.timings ?? {},
      status: data.status,
      error: data.error ? data.error.slice(0, 2000) : null,
      request_id: data.requestId || null,
      deployment_id: data.deploymentId || null,
    };

    const doInsert = async () => {
      try {
        if (row.timings && typeof row.timings === "object" && !("total" in (row.timings as Record<string, unknown>))) {
          (row.timings as Record<string, unknown>).total = Date.now() - startMs;
        }
        const sb: ServiceClient = createServiceClient();
        const { error: dbErr } = await sb.from("gateway_traces").insert(row as never);
        if (dbErr) {
          console.warn(safeJson({ level: "warn", traceId: data.traceId, msg: "trace insert failed", error: dbErr.message }));
        }
      } catch (e) {
        console.warn(safeJson({ level: "warn", traceId: data.traceId, msg: "trace after() failed", error: String(e) }));
      }
    };

    try {
      after(doInsert);
    } catch {
      // Not in Next.js request scope (tests) — fire and forget
      doInsert().catch(() => {});
    }

    log("info", "trace flush", { status: data.status, toolCalls: data.toolCalls?.length ?? 0 });
  }

  log("info", "trace start", { requestText: data.requestText?.slice(0, 120) });

  return { traceId: data.traceId, startMs, log, set, error, flush };
}
export function generateTraceId(): string {
	try {
		const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
		if (g.crypto?.randomUUID) return g.crypto.randomUUID();
	} catch {}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
