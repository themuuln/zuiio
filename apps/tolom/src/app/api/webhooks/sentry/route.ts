/**
 * Sentry Alert Webhook → GitHub Actions bridge
 *
 * Receives Sentry alert webhooks and dispatches them as
 * repository_dispatch events so the sentry-auto-fix workflow
 * can pick them up and attempt automated fixes.
 *
 * Setup in Sentry:
 *   1. Settings → Alerts → Create Alert
 *   2. Add action: "Webhook" → URL: https://your-domain.com/api/webhooks/sentry
 *   3. Save
 *
 * Environment variables required:
 *   GITHUB_TOKEN (or PERSONAL_ACCESS_TOKEN) with repo scope
 */

import { type NextRequest, NextResponse } from "next/server";

interface SentryAlertPayload {
  id?: string;
  project?: string;
  project_name?: string;
  project_slug?: string;
  url?: string;
  message?: string;
  event?: {
    event_id?: string;
    level?: string;
    title?: string;
    culprit?: string;
    metadata?: Record<string, unknown>;
    tags?: Array<{ key: string; value: string }>;
    exception?: Array<{
      type?: string;
      value?: string;
      stacktrace?: {
        frames?: Array<{
          filename?: string;
          lineno?: number;
          function?: string;
        }>;
      };
    }>;
  };
  triggered_rule?: string;
  triggered_rule_id?: string;
}

export async function POST(request: NextRequest) {
  // Parse the Sentry webhook payload
  let payload: SentryAlertPayload;
  try {
    payload = (await request.json()) as SentryAlertPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract issue details
  const issueId = payload.id || payload.event?.event_id;
  const title =
    payload.event?.title || payload.message || "Unknown Sentry error";
  const culprit = payload.event?.culprit || "";
  const level = payload.event?.level || "error";

  if (!issueId) {
    return NextResponse.json({ error: "Missing issue ID" }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo =
    process.env.GITHUB_REPOSITORY || process.env.VERCEL_GIT_REPO_SLUG;

  if (!githubToken || !repo) {
    // No GitHub token configured — log and return
    console.warn(
      "sentry-webhook: GITHUB_TOKEN or repo not configured; skipping dispatch",
      { issueId, title },
    );
    return NextResponse.json({ received: true, dispatched: false });
  }

  // Resolve owner/repo from Vercel env or default
  const owner = process.env.VERCEL_GIT_COMMIT_ORG || "themuuln";
  const fullRepo =
    process.env.GITHUB_REPOSITORY || `${owner}/${repo || "tolom"}`;

  // Dispatch to GitHub Actions
  const response = await fetch(
    `https://api.github.com/repos/${fullRepo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "sentry-webhook-tolom",
      },
      body: JSON.stringify({
        event_type: "sentry-issue",
        client_payload: {
          issue_id: issueId,
          title: `[${level}] ${title}`,
          culprit,
          level,
          url:
            payload.url ||
            `https://${process.env.SENTRY_ORG || "themuuln"}.sentry.io/issues/${issueId}/`,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("sentry-webhook: GitHub dispatch failed", {
      status: response.status,
      error: errorText,
    });
    return NextResponse.json(
      { error: "Failed to dispatch to GitHub" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    received: true,
    dispatched: true,
    issue_id: issueId,
  });
}
