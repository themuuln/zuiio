/**
 * @process feature/eod-close-ritual
 * @description End-of-day close ritual — a dedicated owner-facing daily review page with revenue, jobs, payments, low stock, best mechanic, biggest issue, close-day button, streak counter, and printable report.
 * @skill nextjs-fullstack-app specializations/web-development/nextjs-fullstack-app.js
 * @skill react-development specializations/web-development/react-app-development.js
 * @skill shadcn specializations/web-development/skills/shadcn/SKILL.md
 * @skill postgresql-database-design specializations/web-development/postgresql-database-design.js
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent gsd-executor methodologies/gsd/agents/gsd-executor/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function process(inputs, ctx) {
  const { orgId } = inputs;
  const startTime = ctx.now();

  ctx.log("info", `Starting EOD close ritual for org: ${orgId}`);

  // ════════════════════════════════════════════════════════════════
  // PHASE 1: Extend getEndOfDaySummary service
  //   - Add payment method breakdown (cash/card/bank_transfer)
  //   - Add open jobs count
  //   - Add unpaid invoices count + total
  //   - Add best mechanic (highest revenue)
  //   - Add biggest issue (longest-open high-priority job)
  // ════════════════════════════════════════════════════════════════
  ctx.log("info", "Phase 1: Extending EOD summary service");
  const extendedService = await ctx.task(extendEodServiceTask, { orgId });
  ctx.log("info", `EOD service extended: ${extendedService.fieldsAdded}`);

  // ════════════════════════════════════════════════════════════════
  // PHASE 2: Create day-close tracking
  //   - Add day_close_logs table migration
  //   - Create API endpoint (POST) to close the day
  //   - Create streak counter logic
  // ════════════════════════════════════════════════════════════════
  ctx.log("info", "Phase 2: Creating day-close tracking");
  const dayCloseTracking = await ctx.task(createDayCloseTrackingTask, {
    orgId,
  });
  ctx.log(
    "info",
    `Day-close tracking created: streak=${dayCloseTracking.streakEnabled}`,
  );

  // ════════════════════════════════════════════════════════════════
  // PHASE 3: Build EOD close ritual page
  //   - Create /dashboard/eod-close page
  //   - Show: Revenue, Completed jobs, Open jobs
  //   - Cash/card/bank totals, Unpaid invoices
  //   - Low stock alert, Best mechanic, Biggest issue
  //   - Close day button with streak badge
  //   - Printable format via CSS @media print
  // ════════════════════════════════════════════════════════════════
  ctx.log("info", "Phase 3: Building EOD close ritual page");
  const eodPage = await ctx.task(buildEodClosePageTask, { orgId });
  ctx.log("info", `EOD page built: ${eodPage.pagePath}`);

  // ════════════════════════════════════════════════════════════════
  // PHASE 4: Add navigation links
  //   - Link from dashboard sidebar
  //   - Add i18n strings for both mn.json and en.json
  // ════════════════════════════════════════════════════════════════
  ctx.log("info", "Phase 4: Adding navigation and i18n");
  const navI18n = await ctx.task(addNavigationAndI18nTask, { orgId });
  ctx.log("info", `Navigation and i18n added`);

  // ════════════════════════════════════════════════════════════════
  // QUALITY GATE: Verify build
  // ════════════════════════════════════════════════════════════════
  ctx.log("info", "Quality gate: verifying build");
  let buildCheck = await ctx.task(verifyBuildTask, {});
  ctx.log("info", `Build check: ${buildCheck.passes ? "PASSED" : "FAILED"}`);

  if (!buildCheck.passes) {
    ctx.log(
      "warn",
      `Build failed with ${buildCheck.errors?.length ?? 0} errors, attempting fix`,
    );
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: buildCheck.errors ?? [],
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
    buildCheck = await ctx.task(verifyBuildTask, {});
    ctx.log(
      "info",
      `Re-check build: ${buildCheck.passes ? "PASSED" : "FAILED"}`,
    );
  }

  return {
    success: true,
    summary: {
      eodServiceExtended: true,
      dayCloseTrackingCreated: true,
      eodClosePageBuilt: true,
      navigationAndI18nAdded: true,
      buildPasses: buildCheck.passes,
    },
    duration: ctx.now() - startTime,
    metadata: {
      processId: "feature/eod-close-ritual",
      timestamp: startTime,
    },
  };
}

// ════════════════════════════════════════════════════════════════
// PHASE 1 TASK: Extend EOD summary service
// ════════════════════════════════════════════════════════════════

const extendEodServiceTask = defineTask(
  "extend-eod-service",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Extend EOD summary service",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Full-stack developer — TOLOM backend",
        task: "Extend the EOD summary service to include payment method breakdown, open jobs, unpaid invoices, best mechanic, and biggest issue.",
        context: {
          orgId: args.orgId,
          filesToModify: [
            "src/lib/types/service-params.ts",
            "src/lib/services/report-service.ts",
            "src/lib/queries/use-reports.ts",
          ],
        },
        instructions: [
          "1. In `src/lib/types/service-params.ts`, extend `EndOfDaySummary` with:",
          "   - `open_work_orders: number`",
          "   - `payment_breakdown: { cash: number; card: number; bank_transfer: number; other: number }`",
          "   - `unpaid_invoices: { count: number; total: number }`",
          "   - `best_mechanic: { id: string; name: string; revenue: number; jobs: number } | null`",
          "   - `biggest_issue: { description: string; work_order_id: string; customer: string; days_open: number } | null`",

          "2. In `src/lib/services/report-service.ts`, extend `getEndOfDaySummary()`:",
          "   - Query `work_orders` with status != 'Completed' AND != 'Cancelled' for `open_work_orders` count",
          "   - Query `payments` table (joined to work_orders completed today) grouping by `payment_method` for cash/card/bank_transfer breakdown",
          "   - Query `invoices` with status IN ('sent', 'overdue', 'draft') for `unpaid_invoices`",
          "   - Sort mechanics by total_revenue descending for `best_mechanic` (first entry)",
          "   - Query work_orders with status != 'Completed' AND != 'Cancelled', ordered by created_at ASC, pick oldest for `biggest_issue`",

          "3. In `src/lib/queries/use-reports.ts`, update `useReport` hook query key",
          "   - Add enabled conditions so EOD fetches work with the new fields",

          "4. Use Supabase MCP tools for any database queries",

          "5. Verify build passes after changes",
        ],
        outputFormat: "JSON with summary of changes made",
      },
      outputSchema: {
        type: "object",
        required: ["fieldsAdded", "servicePatched"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
);

// ════════════════════════════════════════════════════════════════
// PHASE 2 TASK: Create day-close tracking
// ════════════════════════════════════════════════════════════════

const createDayCloseTrackingTask = defineTask(
  "create-day-close-tracking",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create day-close tracking system",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Full-stack developer — TOLOM database + API",
        task: "Create day-close tracking with streak counter for the EOD close ritual.",
        context: { orgId: args.orgId },
        instructions: [
          "1. Create a Supabase migration `supabase/migrations/<timestamp>_day_close_logs.sql`:",
          "   - Table `day_close_logs`: id (uuid PK), organization_id (FK), closed_by (FK→profiles), closed_at (timestamptz), date (date, the business date being closed), summary (jsonb snapshot of EOD data), created_at, created_by",
          "   - Enable RLS with policy: organization_id matches",
          "   - Add unique constraint on (organization_id, date)",
          "",
          "2. Apply the migration via MCP supabase_apply_migration, then regenerate types via MCP supabase_generate_typescript_types",
          "",
          "3. Create `src/lib/services/day-close-service.ts`:",
          "   - `closeDay(orgId, userId, date)`: Insert day_close_logs row, return { success, streak }",
          "   - `getCloseStreak(orgId)`: Count consecutive days closed (query day_close_logs ordered by date DESC, count until a gap)",
          "   - `getDayCloseStatus(orgId, date)`: Check if today is already closed",
          "",
          "4. Add API route `POST /api/organizations/[id]/day-close`:",
          "   - Uses `createRouteHandler` wrapper",
          "   - Body: { date: string }",
          "   - Calls closeDay(), returns { data: { closed: true, streak: number } }",
          "",
          "5. Add API route `GET /api/organizations/[id]/day-close?date=<date>`:",
          "   - Returns { data: { isClosed: boolean, streak: number } }",
          "",
          "6. Verify build passes",
        ],
        outputFormat: "JSON with migration details and API endpoints",
      },
      outputSchema: {
        type: "object",
        required: ["streakEnabled", "migrationApplied"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
);

// ════════════════════════════════════════════════════════════════
// PHASE 3 TASK: Build EOD close ritual page
// ════════════════════════════════════════════════════════════════

const buildEodClosePageTask = defineTask(
  "build-eod-close-page",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Build EOD close ritual page",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend developer — TOLOM Next.js 16 + shadcn/ui + Tailwind",
        task: "Build the end-of-day close ritual page with all KPIs, close button, streak badge, and printable format.",
        context: { orgId: args.orgId },
        instructions: [
          "Create `src/app/[locale]/dashboard/eod-close/page.tsx` — a dedicated 'End of Day Close' ritual page.",

          "The page fetches from:",
          "- `GET /api/organizations/[orgId]/reports?type=eod&date=<today>` (extended EOD data)",
          "- `GET /api/organizations/[orgId]/day-close?date=<today>` (streak + close status)",

          "Layout — a clean, single-scroll page optimized for print (use @media print CSS):",
          "",
          "1. **Header** — 'End of Day Summary' title, today's date, streak badge (🔥 N-day streak), Print button, Close Day button (only if not already closed)",

          "2. **Revenue Section** — Large prominent total revenue + payment method breakdown:",
          "   - Total Revenue (large number)",
          "   - Cash | Card | Bank Transfer | Other (horizontal bar or grid of mini-cards showing amounts)",

          "3. **Jobs Section** — Two columns:",
          "   - Completed Today (number + check icon)",
          "   - Open Jobs (number, clickable → links to /dashboard/work-orders)",

          "4. **Unpaid Invoices** — Card showing count + total amount, with link to invoices page",

          "5. **Low Stock Alert** — Reuse `LowStockCard` component from `@/app/[locale]/dashboard/_low-stock-card`",

          "6. **Best Mechanic** — Card showing mechanic name, revenue generated today, jobs completed. With a small crown/trophy icon.",

          "7. **Biggest Issue** — Card showing the oldest open job: customer name, description, days open. If none, show 'No outstanding issues 🎉'",

          "8. **Close Day Button** — Green prominent button 'Close Day ✓' (if not already closed) or 'Day Closed ✓' (if already closed).",
          "   - On click: POST to /api/organizations/[orgId]/day-close, then refetch",
          "   - Shows streak counter update on close",

          "9. **Printable Report** — CSS @media print rules: hide buttons, sidebar, nav; show clean report layout",

          "10. **Use shadcn components:** Button, Card, CardContent, Badge, Separator, Skeleton, Typography",
          "    - Use semantic tailwind tokens (bg-background, text-foreground, etc.)",
          "    - Use gap-* not space-y-*, size-* for equal w/h",

          "11. **Loading state:** Show skeleton cards while data loads",
          "12. **Empty state:** Handle no-data case gracefully",

          "13. **Use 'use client'** — this is an interactive page",
          "14. **Use `useTranslations()`** with t() for all strings",

          "Verify the page builds without errors.",
        ],
        outputFormat: "JSON with page structure summary and file paths",
      },
      outputSchema: {
        type: "object",
        required: ["pagePath", "pageCreated"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
);

// ════════════════════════════════════════════════════════════════
// PHASE 4 TASK: Add navigation and i18n
// ════════════════════════════════════════════════════════════════

const addNavigationAndI18nTask = defineTask(
  "add-navigation-i18n",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Add navigation and i18n strings",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend developer — TOLOM i18n + navigation",
        task: "Add sidebar navigation link and i18n strings for the EOD close page.",
        context: { orgId: args.orgId },
        instructions: [
          "1. Create `src/messages/en.json` entries for all EOD page strings:",
          "   - 'eodClose.title': 'End of Day Summary'",
          "   - 'eodClose.print': 'Print Report'",
          "   - 'eodClose.closeDay': 'Close Day'",
          "   - 'eodClose.dayClosed': 'Day Closed ✓'",
          "   - 'eodClose.streak': '{count}-day streak'",
          "   - 'eodClose.revenue': 'Total Revenue'",
          "   - 'eodClose.cash': 'Cash'",
          "   - 'eodClose.card': 'Card'",
          "   - 'eodClose.bankTransfer': 'Bank Transfer'",
          "   - 'eodClose.other': 'Other'",
          "   - 'eodClose.completedJobs': 'Completed Today'",
          "   - 'eodClose.openJobs': 'Open Jobs'",
          "   - 'eodClose.unpaidInvoices': 'Unpaid Invoices'",
          "   - 'eodClose.lowStock': 'Low Stock'",
          "   - 'eodClose.bestMechanic': 'Best Mechanic'",
          "   - 'eodClose.biggestIssue': 'Biggest Issue'",
          "   - 'eodClose.noIssues': 'No outstanding issues'",
          "",
          "2. Add same keys to `src/messages/mn.json` with Mongolian translations",
          "",
          "3. Find the sidebar/dashboard navigation config and add a link to /dashboard/eod-close",
          "   - Look for navigation config likely in src/lib/navigation.ts or similar",
          "   - Add entry with icon ClipboardList, label 'End of Day', href /dashboard/eod-close",
          "",
          "4. Verify build passes",
        ],
        outputFormat: "JSON with i18n keys added and navigation entry",
      },
      outputSchema: {
        type: "object",
        required: ["i18nKeysAdded", "navEntryAdded"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
);

// ════════════════════════════════════════════════════════════════
// QUALITY GATE TASKS
// ════════════════════════════════════════════════════════════════

const verifyBuildTask = defineTask("verify-build", (args, taskCtx) => ({
  kind: "shell",
  title: "Verify TypeScript build",
  shell: {
    command: "pnpm run build 2>&1 | tail -30",
    workingDirectory: "/Users/themuuln/coding/personal/tolom/tolom",
    timeoutMs: 60000,
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const fixBuildErrorsTask = defineTask("fix-build-errors", (args, taskCtx) => ({
  kind: "agent",
  title: "Fix build errors",
  agent: {
    name: "general-purpose",
    prompt: {
      role: "Developer",
      task: "Fix the following build errors in the TOLOM repo.",
      context: { errors: args.errors },
      instructions: [
        "Analyze each build error",
        "Fix the type issues, missing imports, or incorrect references",
        "Return list of fixes applied",
      ],
      outputFormat: "JSON with fixes array",
    },
    outputSchema: {
      type: "object",
      required: ["fixes"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
