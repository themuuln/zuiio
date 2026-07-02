/**
 * @process tolom-ux-improvements
 * @description Execute all P0 + P1 UX improvements across TOLOM pages as defined in PRACTICAL.md.
 *   Groups fixes by page category into vertical slices, each verified by next build.
 * @inputs { phase?: number, skipPhases?: number[] }
 * @outputs { success: boolean, completedPhases: array, buildPassing: boolean }
 *
 * @agent codebase-locator
 * @agent codebase-analyzer
 * @agent codebase-pattern-finder
 * @agent general-purpose
 * @skill uiux
 * @skill frontend-design
 * @skill web-design-guidelines
 * @skill diagnose
 * @skill shadcn
 *
 * @references
 * - PRACTICAL.md - Full UX improvement plan
 * - specializations/web-development/nextjs-fullstack-app.js - Next.js patterns
 * - specializations/web-development/react-app-development.js - React patterns
 * - specializations/ux-ui-design/pixel-perfect-implementation.js - UI quality
 */

import pkg from "@a5c-ai/babysitter-sdk";
const { defineTask } = pkg;

export async function process(inputs, ctx) {
  const { phase, skipPhases = [] } = inputs || {};
  const completedPhases = [];
  let buildPassing = true;

  const phases = [
    {
      id: "bay-view",
      title: "Bay View UX fixes",
      items: [1, 2, 4, 5, 9, 12, 13, 14, 15, 17],
    },
    {
      id: "dashboard",
      title: "Dashboard UX fixes",
      items: [27, 28, 29, 30, 31, 32],
    },
    {
      id: "work-orders",
      title: "Work Orders UX fixes",
      items: [33, 36, 37, 39, 40, 42],
    },
    { id: "customers", title: "Customers UX fixes", items: [44, 45] },
    { id: "inventory", title: "Inventory UX fixes", items: [48, 50] },
    { id: "services", title: "Services Catalog UX fixes", items: [51, 52] },
    { id: "finance", title: "Finance UX fixes", items: [54, 56, 57] },
    { id: "eod-close", title: "EOD Close UX fixes", items: [58, 61] },
    {
      id: "organization",
      title: "Organization/Settings UX fixes",
      items: [62, 63, 65, 66],
    },
    { id: "reports", title: "Reports UX fixes", items: [68, 69] },
    { id: "portal", title: "Customer Portal UX fixes", items: [72, 73] },
    {
      id: "landing",
      title: "Landing/Marketing UX fixes",
      items: [18, 19, 21, 22],
    },
    { id: "auth", title: "Auth UX fixes", items: [24, 25, 26] },
    {
      id: "cross-cutting",
      title: "Cross-cutting UX fixes",
      items: [75, 76, 78, 79],
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

    const result = await ctx.task(executePhaseTask, {
      phase: p,
      phaseIndex: idx + 1,
      totalPhases: activePhases.length,
    });

    if (result.status === "completed") {
      completedPhases.push({
        phase: p.id,
        status: "completed",
        items: p.items,
      });
      buildPassing = result.buildPassing && buildPassing;
    }

    ctx.log("info", `Phase ${idx + 1} result: ${result.status}`);
  }

  return {
    success: completedPhases.length === activePhases.length,
    completedPhases,
    buildPassing,
  };
}

// ── Phase Execution Task ────────────────────────────────────────

const executePhaseTask = defineTask("execute-phase", (args, taskCtx) => ({
  kind: "agent",
  title: `Execute phase: ${args.phase.title}`,
  agent: {
    name: "general-purpose",
    prompt: {
      role: "Frontend developer implementing UX improvements",
      task: `Implement UX fix items ${args.phase.items.join(", ")} for the ${args.phase.title} phase.`,
      context: {
        phase: args.phase,
        phaseIndex: args.phaseIndex,
        totalPhases: args.totalPhases,
        referenceDoc: "PRACTICAL.md",
        description: args.phase.description || "",
        fixes: args.phase.items
          .map((id) => getFixDescription(id))
          .filter(Boolean),
      },
      instructions: [
        "Read PRACTICAL.md for the full description of each fix item.",
        "Implement all fix items for this phase in the codebase.",
        "Use existing skills and agents as needed (uiux, frontend-design, codebase-analyzer).",
        "For each fix: read the relevant file(s), make the change, verify with LSP diagnostics.",
        'After implementing all fixes in this phase, run "npm run build" to verify the build passes.',
        "The build MUST pass for the phase to be considered complete.",
        "If the build fails, diagnose and fix the error, then rebuild. Do not move to the next phase.",
        "Keep changes focused — only touch files related to the fix items in this phase.",
        "Return structured JSON output with status and build results.",
      ],
      outputFormat: "JSON",
      outputSchema: {
        type: "object",
        required: ["status", "buildPassing", "changes"],
        properties: {
          status: { type: "string", enum: ["completed", "failed"] },
          buildPassing: { type: "boolean" },
          changes: { type: "array", items: { type: "string" } },
          buildError: { type: "string" },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ── Fix descriptions lookup ─────────────────────────────────────

function getFixDescription(id) {
  const map = {
    1: "Add global search bar filtering bays by plate, make, model, customer, mechanic, status.",
    2: "Add dropdown chevron on bay card status badge showing all allowed transitions (non-linear).",
    4: "Pause 30s polling when dialog/drawer open or form dirty.",
    5: "Show numbered bay buttons on hover over queue items for one-click assignment.",
    9: 'Show queue always, add separate "My Queue" filter instead of hiding queue in My Jobs mode.',
    12: "Add up/down trend arrows with delta vs yesterday/last period on KPI cards.",
    13: "Sort queue descending by wait time, escalate red at 60+ min.",
    14: 'Allow marking Ready without post-service form, add "Pending data" badge.',
    15: "Use text-only CSS plate on cards instead of full SVG Soyombo rendering.",
    17: "Unify completion flow: mechanic page should also use pickup dialog.",
    18: "Add lightweight previews or video thumbnails to landing page feature grid.",
    19: 'Replace global stats with social proof ("Trusted by X shops").',
    21: "Add badges for Mongolian payment integration, SMS, license plate support.",
    22: 'Add annual billing toggle with "Save 20%" badge on pricing page.',
    24: 'Add "Keep me signed in" checkbox on login page extending session cookie.',
    25: "Add fuzzy search/filter to Select Organization screen.",
    26: 'Add "Didn\'t receive it? Resend" link to forgot password flow.',
    27: "Sync period filter to URL query params so it survives navigation.",
    28: "Display comparison data as trend direction + delta on KPI cards.",
    29: "Reorder dashboard: charts above recent work orders table.",
    30: "Expand daily timeline to horizontal strip instead of sidebar column.",
    31: "Always show full dashboard when active orders exist, mask revenue KPIs instead of hiding.",
    32: 'Add "+ Work Order" inline card or FAB on dashboard.',
    33: "Add inline status bar with counts above work orders table.",
    36: "Add inline status stepper on mobile card view.",
    37: "Make export use visible columns only (remove loss_reason).",
    39: "Remove sidebar tabs that duplicate visible page content.",
    40: "Port optimistic UI pattern from drawer to work order detail page.",
    42: 'Add "Repeat from last order" button to copy services/parts from last WO for vehicle.',
    44: 'Make last_visit_at column sortable, add "Not visited in 3+ months" filter chip.',
    45: "Fuzzy-check phone/email on customer creation to prevent duplicates.",
    48: "Show low-stock warning inline on parts search dropdown in WO drawer.",
    50: "Add movement type filter chip (Sale, Adjustment, Damage, Transfer).",
    51: "Make service catalog cards editable inline (click name/price → becomes input).",
    52: "Add category sidebar/filter to services catalog.",
    54: 'Show date range in period bar: "This Week (Mon 5/25 – Sun 5/31)".',
    56: "Add OVERDUE badge + color-coded row backgrounds to invoice list.",
    57: "Limit default period to Past Year, force custom range for beyond.",
    58: "Add print-friendly CSS view or PDF download for EOD report.",
    61: 'Move low stock to "Pending Items" section in EOD close.',
    62: "Add role dropdown per member in organization members list.",
    63: 'Add "Upgrade" CTA on subscription page → pricing page with pre-selected tier.',
    65: "Add settings search bar.",
    66: "Apply theme changes in real-time with reset option.",
    68: 'Add "vs last period / vs YoY" comparison column to reports.',
    69: "Style EOD report with card/KPI patterns instead of raw rows.",
    72: "Add realtime subscription for live status updates on portal.",
    73: 'Add "Download PDF" button per completed WO on portal.',
    75: "Centralize polling into shared hook with pause-when-interacting.",
    76: 'Implement soft-delete + toast with "Undo" action.',
    78: "Apply hasLoadedOnce pattern across all pages to prevent skeleton flash.",
    79: "Replace technical error messages with human-readable versions.",
  };
  return map[id] || `Fix item #${id}`;
}
