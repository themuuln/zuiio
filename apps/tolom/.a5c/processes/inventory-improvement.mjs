/**
 * @process inventory-improvement
 * @description Quick targeted inventory improvements for TOLOM — real-time stock balances,
 *   part detail page, work-order integration, inventory reports, and UI polish.
 *   Designed as compact vertical slices with per-phase npm run build verification.
 * @inputs { phase?: number, skipPhases?: number[] }
 * @outputs { success: boolean, completedPhases: array, buildPassing: boolean }
 *
 * @agent general-purpose
 * @agent codebase-analyzer
 * @agent codebase-pattern-finder
 * @agent slice-verifier
 * @skill supabase
 * @skill supabase-postgres-best-practices
 * @skill frontend-design
 * @skill shadcn
 * @skill web-design-guidelines
 *
 * @references
 * - supabase/migrations/00008_inventory_control.sql — Current inventory schema
 * - supabase/migrations/20260514100000_materialize_inventory_balances.sql — Current balances view
 * - src/lib/services/inventory-service.ts — Server-side inventory functions
 * - src/lib/queries/use-inventory.ts — React Query hooks
 * - src/app/[locale]/dashboard/inventory/ — Inventory pages
 * - specializations/web-development/nextjs-fullstack-app.js — Next.js patterns
 * - specializations/domains/business/logistics/inventory-optimization.js — Inventory optimization patterns
 * - processes/shared/tdd-triplet.js — TDD verification pattern
 */

import pkg from "@a5c-ai/babysitter-sdk";
const { defineTask } = pkg;

export async function process(inputs, ctx) {
  const { phase, skipPhases = [] } = inputs || {};
  const completedPhases = [];
  let buildPassing = true;

  const phases = [
    {
      id: "real-time-balances",
      title: "Real-Time Inventory Balances",
      description:
        "Replace the 5-min cron-refreshed materialized view with a PostgreSQL trigger function that updates inventory_balances in real-time on every movement insert/update/delete.",
    },
    {
      id: "part-detail-page",
      title: "Part Detail Page",
      description:
        "Create a dedicated /parts/[partId] page with stock history timeline, movement list, threshold editing, purchase price tracking, and edit form — replacing inline-only modal editing.",
    },
    {
      id: "work-order-integration",
      title: "Work Order Inventory Integration",
      description:
        "Auto-deduct parts from inventory when a work order is marked complete or parts are used. Create inventory_movements for each part consumed and update balances in real-time.",
    },
    {
      id: "inventory-reports",
      title: "Inventory Reports",
      description:
        "Build stock turnover, slow-moving/dead stock identification, and usage trend widgets shown inside the inventory page and reports dashboard.",
    },
    {
      id: "ui-polish",
      title: "UI & UX Polish",
      description:
        "Improved movement recording form, bulk threshold editing, alert-to-PO workflow refinement, better empty/loading/error states, and consistent action patterns.",
    },
  ];

  const phaseList = phase
    ? phases.filter((p) => p.id === `phase-${phase}`)
    : phases;
  const activePhases = phaseList.filter(
    (p) => !skipPhases.includes(phases.indexOf(p) + 1),
  );

  for (const [idx, p] of activePhases.entries()) {
    ctx.log(
      "info",
      `Starting phase ${idx + 1}/${activePhases.length}: ${p.title}`,
    );

    // Breakpoint before each phase
    if (idx > 0) {
      const approval = await ctx.breakpoint({
        question: `Proceed to phase ${idx + 1}: ${p.title}?`,
        title: `Phase ${idx + 1} — ${p.title}`,
        context: {
          phase: p.id,
          description: p.description,
          completedPhases: completedPhases.map((c) => c.phase),
        },
        expert: "product-owner",
        tags: ["progress-gate"],
      });
      if (!approval.approved) {
        ctx.log(
          "warn",
          `Phase ${idx + 1} skipped by user: ${approval.response}`,
        );
        completedPhases.push({
          phase: p.id,
          status: "skipped",
          reason: approval.response || "User declined",
        });
        continue;
      }
    }

    const result = await ctx.task(executePhaseTask, {
      phase: p,
      phaseIndex: idx + 1,
      totalPhases: activePhases.length,
    });

    if (result.status === "completed") {
      completedPhases.push({
        phase: p.id,
        status: "completed",
        summary: result.summary,
      });
      buildPassing = result.buildPassing && buildPassing;
    } else {
      completedPhases.push({
        phase: p.id,
        status: "failed",
        error: result.error,
      });
      buildPassing = false;

      // Ask whether to continue
      const continueApproval = await ctx.breakpoint({
        question: `Phase ${idx + 1} (${p.title}) failed. Continue to next phase?`,
        title: `Phase ${idx + 1} Failed`,
        context: { error: result.error },
        expert: "developer",
        tags: ["failure-gate"],
      });
      if (!continueApproval.approved) {
        ctx.log("warn", "Stopping after phase failure per user request");
        break;
      }
    }
  }

  ctx.log("info", "Inventory improvement process complete");

  return {
    success:
      buildPassing && completedPhases.every((c) => c.status === "completed"),
    completedPhases,
    buildPassing,
    metadata: {
      processId: "inventory-improvement",
      duration: ctx.now() - ctx.startTime,
      phasesAttempted: activePhases.length,
      phasesCompleted: completedPhases.filter((c) => c.status === "completed")
        .length,
    },
  };
}

// ───────────────────────────────────────────────────────────────
// Phase Execution Task
// ───────────────────────────────────────────────────────────────

export const executePhaseTask = defineTask(
  "execute-inventory-phase",
  (args, taskCtx) => ({
    kind: "agent",
    title: `Phase ${args.phaseIndex}: ${args.phase.title}`,
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Full-stack developer",
        task: `Execute phase ${args.phaseIndex}/${args.totalPhases}: ${args.phase.title}`,
        context: {
          phaseId: args.phase.id,
          description: args.phase.description,
          repoRoot: "/Users/themuuln/coding/personal/tolom/tolom",
          projectProfile:
            "TOLOM auto repair SaaS — Next.js 16, Supabase, shadcn/ui, React Query, Zustand",
          conventions: {
            importConvention:
              "Import types from @/lib/types, never from @/lib/database.types",
            apiPattern:
              "All API routes use api-handler.ts wrapper with ApiResponse<T>",
            queryPattern:
              "React Query hooks in src/lib/queries/, services in src/lib/services/",
            uiRules:
              "Use shadcn components, semantic color tokens, gap-* over space-y-*, size-* over w-* h-*",
            i18n: "Update both mn.json and en.json for any UI string change",
            branchNaming: "feat/phase2/<module>-<description>",
          },
        },
        instructions: [
          `You are executing phase ${args.phaseIndex}: ${args.phase.title}`,
          "",
          ...getPhaseInstructions(args.phase.id),
          "",
          "=== General Instructions ===",
          "1. Read the affected files first before making changes",
          "2. Apply changes — write new files, edit existing ones",
          "3. After implementation, run: npm run lint && npm run build",
          "4. If build fails, diagnose and fix until it passes",
          "5. If TypeScript regeneration needed, run: supabase gen types typescript --linked > src/lib/database.types.ts",
          "6. Update both i18n files (mn.json + en.json) for any user-visible strings",
          "7. Run the tests: npm run test if phase affects service files with tests",
          "8. Return structured result with { status: 'completed'|'failed', summary: string, buildPassing: boolean, error?: string }",
          "9. Keep the scope TIGHT — this is a quick targeted win, not a full redesign",
        ],
        outputFormat: "JSON",
      },
      outputSchema: {
        type: "object",
        required: ["status", "summary", "buildPassing"],
        properties: {
          status: { type: "string", enum: ["completed", "failed"] },
          summary: { type: "string" },
          buildPassing: { type: "boolean" },
          error: { type: "string" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["inventory", "implementation", `phase-${args.phase.id}`],
  }),
);

// ───────────────────────────────────────────────────────────────
// Phase-specific instructions
// ───────────────────────────────────────────────────────────────

function getPhaseInstructions(phaseId) {
  switch (phaseId) {
    case "real-time-balances":
      return [
        "GOAL: Replace the 5-min cron-refreshed materialized view (inventory_balances) with a real-time mechanism.",
        "",
        "Current state:",
        "- supabase/migrations/20260514100000_materialize_inventory_balances.sql creates the materialized view and schedules a cron job to refresh every 5 minutes",
        "- inventory_balances is computed: SUM(quantity) grouped by part_id, with adjustments for movement direction",
        "",
        "What to do:",
        "1. CREATE a new migration file: supabase migration new realtime_inventory_balances",
        "2. In the migration:",
        "   a. Drop the existing cron schedule (cron.unschedule)",
        "   b. Create or replace a function refresh_inventory_balance(part_id uuid) that recalculates and upserts the balance for a single part",
        "   c. Create a trigger on inventory_movements (AFTER INSERT/UPDATE/DELETE) that calls refresh_inventory_balance(NEW.part_id or OLD.part_id)",
        "   d. Keep the materialized view as the backing table but make it a regular table, or create a new table inventory_balances_realtime that mirrors the current structure",
        "   e. Add proper indexes",
        "3. Apply the migration using supabase_execute_sql MCP",
        "4. Regenerate TypeScript types",
        "5. Update the inventory service if needed (src/lib/services/inventory-service.ts)",
        "6. Verify: npm run lint && npm run build passes",
        "7. Return structured result",
      ];

    case "part-detail-page":
      return [
        "GOAL: Create a dedicated part detail/edit page so users aren't stuck editing parts only via an inline modal in the parts table.",
        "",
        "Current state:",
        "- Parts are listed in a table on inventory page with inline edit modal (parts-tab.tsx)",
        "- No dedicated detail page, no stock history, no movement timeline",
        "- Editing is via a modal with PartForm component",
        "",
        "What to do:",
        "1. Create a new page route: src/app/[locale]/dashboard/inventory/parts/[partId]/page.tsx",
        "2. Create supporting sub-components as _-prefixed files in the same directory:",
        "   - _header.tsx — Part name, status badge, quick stats (on hand, price, category)",
        "   - _stock-history.tsx — Timeline of inventory movements for this part (reuse MovementRow from movements-tab)",
        "   - _threshold-card.tsx — Current threshold with inline edit",
        "   - _details-form.tsx — Edit form for part details (reuse parts from PartForm)",
        '3. The page should be a client component ("use client") using React Query to fetch part data',
        "4. Add a link from the parts table rows to this detail page (replace the pencil icon or add it alongside)",
        "5. Update i18n: add keys to both src/messages/mn.json and src/messages/en.json ",
        "6. Add loading, error, and empty states",
        "7. Verify: npm run lint && npm run build passes",
        "8. Return structured result",
      ];

    case "work-order-integration":
      return [
        "GOAL: Auto-deduct parts from inventory when a work order is completed.",
        "",
        "Current state:",
        "- Work orders have line items (parts tab in the work order wizard)",
        "- But completing a work order does NOT create inventory_movements for the parts used",
        "- This means stock levels don't decrease when parts are consumed in a job",
        "",
        "What to do:",
        "1. Read the work order completion logic in src/lib/services/work-order-service.ts",
        "2. In the work order 'completed' or 'finalized' status transition:",
        "   a. Query all parts/line items associated with the work order",
        "   b. For each part, create an inventory_movement with movement_type='sale', reference_type='work_order', reference_id=work_order_id",
        "   c. Use the same createMovement logic from inventory-service.ts",
        "3. Make sure this runs in a transaction or uses proper error handling — if stock deduction fails, the work order completion should be atomic or at least logged",
        "4. Handle partial usage: if a line item only uses some of the quantity, deduct only the used quantity",
        "5. Add the inventory revalidation keys to the work order mutation's onSuccess",
        "6. Update hooks in src/lib/queries/use-work-orders.ts as needed",
        "7. Verify: npm run lint && npm run build passes",
        "8. Run the relevant tests: npm run test",
        "9. Return structured result",
      ];

    case "inventory-reports":
      return [
        "GOAL: Add basic inventory analytics — usage trends, stock turnover, slow-moving/dead stock identification.",
        "",
        "Current state:",
        "- src/app/[locale]/dashboard/inventory/valuation/ has a basic valuation page",
        "- No usage trends, turnover, or aging reports",
        "",
        "What to do:",
        "1. Create server-side query functions in src/lib/services/inventory-service.ts (or a new inventory-reports-service.ts):",
        "   a. getInventoryTurnover(orgId, months=12) — COGS / average inventory value over period",
        "   b. getUsageTrends(orgId, months=6) — Monthly usage by part category, top 10 most-used parts",
        "   c. getSlowMovingStock(orgId, thresholdDays=90) — Parts with no movement in N days",
        "2. Create React Query hooks in src/lib/queries/use-inventory.ts",
        "3. Add a small reports section to the inventory page (below the tabs, or as a new tab):",
        "   - Quick stats cards: total SKUs, total stock value, turnover rate",
        "   - A 'slow movers' widget: small list of parts not used in 90+ days",
        "   - A usage trend mini-chart (use shadcn Chart component if available, otherwise simple bar)",
        "4. Update i18n files with new keys",
        "5. Keep it TIGHT — this is a targeted win, not a full BI dashboard. 1-2 widgets is enough.",
        "6. Verify: npm run lint && npm run build passes",
        "7. Return structured result",
      ];

    case "ui-polish":
      return [
        "GOAL: Fix usability friction points — better movement recording, bulk operations, alert-to-PO UX.",
        "",
        "Current state:",
        "- Movement recording is via a slide-over or modal, could be smoother",
        "- Thresholds are edited inline per-part (clunky for bulk changes)",
        "- Alert page shows shortage items but doesn't link well to creating POs",
        "- Search/sort on global catalog works but UX could improve",
        "",
        "What to do:",
        "1. Fix the Movement recording flow (movements-tab.tsx):",
        "   - Add movement type as a quick-select filter chip at top",
        "   - Make the 'Record Movement' form show validation errors inline",
        "   - Show the current balance for the selected part BEFORE recording the movement",
        "2. Improve threshold editing on parts-tab.tsx:",
        "   - Add a 'Set Default Threshold' button that applies to all parts without individual thresholds",
        "   - Show a quick summary: 'X parts have no threshold set' with a link to set defaults",
        "3. Improve Alerts → PO flow:",
        "   - When clicking 'Create PO' from alerts page, pre-fill the PO with the out-of-stock/low-stock items",
        "   - Add a 'Select All' checkbox on alerts to create a bulk PO",
        "4. General UI consistency:",
        "   - Ensure all inventory pages use the same Button component patterns (no raw buttons)",
        "   - Check dark mode rendering of badges and status colors",
        "   - Add loading skeleton for the inventory page main content (not just table)",
        "5. Update i18n files as needed",
        "6. Verify: npm run lint && npm run build passes",
        "7. Return structured result",
      ];

    default:
      return [`Execute phase: ${phaseId}`];
  }
}
