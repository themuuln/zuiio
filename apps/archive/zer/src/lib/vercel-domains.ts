import { capture } from "@zuiio/capture";

/**
 * Server-side Vercel domains client.
 *
 * Custom-domain activation is fully self-service: once an org proves DNS
 * ownership (TXT), the app attaches the domain to the Zer Vercel project
 * programmatically — no manual ops. The project id and API token come
 * from server-only env vars; when they are missing the client reports
 * "unconfigured" instead of failing the whole flow.
 */

export const VERCEL_EDGE_IP = "76.76.21.21";
export const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

const VERCEL_API = "https://api.vercel.com";

type VercelConfig = { token: string; projectId: string };

function getConfig(): VercelConfig | null {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) return null;
  return { token, projectId };
}

async function vercelFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; json?: unknown }> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, status: 0 };
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => undefined)) as unknown;
  return { ok: res.ok, status: res.status, json };
}

export type DomainAttachResult =
  | { configured: false }
  | { configured: true; attached: true; alreadyPresent: boolean }
  | { configured: true; attached: false; error: string };

/**
 * Attaches a domain to the Zer Vercel project. Idempotent: Vercel answers
 * 400 when the domain is already on the project, which we treat as success.
 */
export async function attachDomainToVercel(
  domain: string,
): Promise<DomainAttachResult> {
  const cfg = getConfig();
  if (!cfg) return { configured: false };

  try {
    const { ok, status, json } = await vercelFetch(
      `/v9/projects/${cfg.projectId}/domains`,
      {
        method: "POST",
        body: JSON.stringify({ name: domain }),
      },
    );
    if (ok) return { configured: true, attached: true, alreadyPresent: false };
    // 400: already attached (Vercel's documented behaviour)
    if (status === 400) {
      return { configured: true, attached: true, alreadyPresent: true };
    }
    const message =
      json && typeof json === "object" && "error" in json
        ? String((json as { error: { message?: string } }).error?.message ?? "")
        : "";
    capture(`vercel attach failed: ${status} ${message}`, {
      context: "vercel-domains:attach",
    });
    return {
      configured: true,
      attached: false,
      error: message || `Vercel API ${status}`,
    };
  } catch (err) {
    capture(err, { context: "vercel-domains:attach" });
    return { configured: true, attached: false, error: "network error" };
  }
}

export type VercelDomainStatus =
  | { configured: false }
  | { configured: true; present: boolean; verified: boolean; error?: string };

/** Reads Vercel's own verification state for a domain on the project. */
export async function getVercelDomainStatus(
  domain: string,
): Promise<VercelDomainStatus> {
  const cfg = getConfig();
  if (!cfg) return { configured: false };

  try {
    const { ok, status, json } = await vercelFetch(
      `/v9/projects/${cfg.projectId}/domains/${encodeURIComponent(domain)}`,
    );
    if (!ok) {
      // 404 = not attached; anything else is an infra problem.
      if (status === 404)
        return { configured: true, present: false, verified: false };
      return {
        configured: true,
        present: false,
        verified: false,
        error: `Vercel API ${status}`,
      };
    }
    const body = json as { verified?: boolean } | undefined;
    return {
      configured: true,
      present: true,
      verified: body?.verified === true,
    };
  } catch (err) {
    capture(err, { context: "vercel-domains:status" });
    return {
      configured: true,
      present: false,
      verified: false,
      error: "network error",
    };
  }
}

export type DomainDetachResult =
  | { configured: false }
  | { configured: true; detached: boolean; error?: string };

/** Removes a domain from the Zer Vercel project (org changed its domain). */
export async function detachDomainFromVercel(
  domain: string,
): Promise<DomainDetachResult> {
  const cfg = getConfig();
  if (!cfg) return { configured: false };

  try {
    const { ok, status } = await vercelFetch(
      `/v9/projects/${cfg.projectId}/domains/${encodeURIComponent(domain)}`,
      { method: "DELETE" },
    );
    // 404 means it was already gone — success either way.
    return {
      configured: true,
      detached: ok || status === 404,
      error: ok || status === 404 ? undefined : `Vercel API ${status}`,
    };
  } catch (err) {
    capture(err, { context: "vercel-domains:detach" });
    return { configured: true, detached: false, error: "network error" };
  }
}

export type DnsRecord =
  | { kind: "apex"; type: "A"; name: string; value: string }
  | { kind: "subdomain"; type: "CNAME"; name: string; value: string };

/** The DNS record the org must publish so Vercel serves the domain. */
export function dnsRecordFor(domain: string): DnsRecord {
  const dots = domain.split(".").length - 1;
  if (dots <= 1 && !domain.startsWith("www.")) {
    return { kind: "apex", type: "A", name: "@", value: VERCEL_EDGE_IP };
  }
  return {
    kind: "subdomain",
    type: "CNAME",
    name: domain.split(".")[0],
    value: VERCEL_CNAME_TARGET,
  };
}
