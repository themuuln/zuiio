/**
 * @process rbac-system
 * @description Build a full RBAC system for TOLOM: seed 5 roles (Super Admin, Org Owner, Manager, Mechanic, Guest),
 *   add middleware role checks, create admin UI for role management, build guest invoice portal,
 *   add permission-based access control at the application layer.
 * @inputs { orgId?: string, skipMigration?: boolean }
 * @outputs { success: boolean, completedPhases: array, buildPassing: boolean }
 *
 * @agent general-purpose (execute each phase)
 * @skill supabase (migrations, RLS, types)
 * @skill next-best-practices (Next.js route patterns)
 * @skill uiux (UI for role management page)
 * @skill shadcn (UI components)
 * @skill web-design-guidelines (accessibility)
 *
 * @references
 * - specializations/web-development/nextjs-fullstack-app.js - Next.js patterns
 * - specializations/web-development/postgresql-database-design.js - DB patterns
 * - reference/ADVANCED_PATTERNS.md - Iterative convergence patterns
 * - reference/sdk.md - SDK API reference
 */

import pkg from "@a5c-ai/babysitter-sdk";
const { defineTask } = pkg;

////////////////////////////////////////
// Process exports
////////////////////////////////////////

export async function process(inputs, ctx) {
  const { skipMigration = false } = inputs || {};
  const completedPhases = [];
  let buildPassing = true;

  const phases = [
    { id: "rename-admin-to-org-owner", title: "Rename Admin → Org Owner" },
    { id: "seed-manager-and-guest-roles", title: "Seed Manager & Guest roles" },
    { id: "middleware-role-checks", title: "Add role checks to middleware" },
    {
      id: "guest-invoice-portal",
      title: "Build guest invoice portal",
    },
    {
      id: "org-roles-management-ui",
      title: "Build org roles management UI",
    },
    {
      id: "permission-system-seed",
      title: "Seed permissions & RLS policies",
    },
    {
      id: "app-layer-permission-checks",
      title: "Add app-layer permission checks",
    },
    { id: "quality-gate", title: "Final build verification" },
  ];

  for (const [idx, p] of phases.entries()) {
    ctx.log("info", `Starting phase ${idx + 1}/${phases.length}: ${p.title}`);

    const result = await ctx.task(executePhaseTask, {
      phase: p,
      phaseIndex: idx + 1,
      totalPhases: phases.length,
      skipMigration,
    });

    if (result.status === "completed") {
      completedPhases.push({
        phase: p.id,
        status: "completed",
      });
      buildPassing = result.buildPassing !== false && buildPassing;
    } else {
      ctx.log(
        "error",
        `Phase ${p.id} failed: ${result.error || "unknown error"}`,
      );
      return {
        success: false,
        completedPhases,
        buildPassing: false,
        failedPhase: p.id,
        error: result.error,
      };
    }

    ctx.log("info", `Phase ${idx + 1} result: ${result.status}`);
  }

  return {
    success: completedPhases.length === phases.length,
    completedPhases,
    buildPassing,
  };
}

////////////////////////////////////////
// Phase Execution Task
////////////////////////////////////////

const executePhaseTask = defineTask("execute-phase", (args, taskCtx) => ({
  kind: "agent",
  title: `Execute phase: ${args.phase.title}`,
  agent: {
    name: "general-purpose",
    prompt: {
      role: "Full-stack developer implementing RBAC system",
      task: `Implement phase "${args.phase.title}" (phase ${args.phaseIndex}/${args.totalPhases}) of the TOLOM RBAC system.`,
      context: {
        phase: args.phase,
        phaseIndex: args.phaseIndex,
        totalPhases: args.totalPhases,
        skipMigration: args.skipMigration,
        // Project context for the agent to understand the codebase
        projectRoot: "/Users/themuuln/coding/personal/tolom/tolom",
        supabaseProjectId: "tlqvnwfhqclsfutkbqxn",
        stack:
          "Next.js 16 App Router, Supabase (PostgreSQL + Auth), TypeScript, tailwind, shadcn/ui, React Query, Zustand",
        roleHierarchy: [
          {
            name: "Super Admin",
            description:
              "Cross-org platform admin (you). Managed via super_admins table.",
            baseRole: null,
          },
          {
            name: "Org Owner",
            description:
              "Org owner — full access to everything in their org. Renamed from 'Admin'.",
            baseRole: null,
          },
          {
            name: "Manager",
            description:
              "Can manage day-to-day ops, view reports, approve discounts.",
            baseRole: null,
          },
          {
            name: "Mechanic",
            description:
              "Can work on assigned jobs, view their own performance.",
            baseRole: null,
          },
          {
            name: "Guest",
            description:
              "External — can only view their own invoices via token-based portal.",
            baseRole: null,
          },
        ],
      },
      instructions: [
        "PROJECT ROOT is /Users/themuuln/coding/personal/tolom/tolom. Always use absolute paths when referencing files.",
        "SUPABASE: linked project is 'tlqvnwfhqclsfutkbqxn'. Use MCP tool supabase-tolom_execute_sql (NOT supabase_execute_sql) to run SQL. Migration files go in supabase/migrations/ with supabase migration new <name>.",
        "After any migration, ALWAYS regenerate types: use supabase-tolom_generate_typescript_types MCP tool, then run npm run build to verify.",
        "Always import types from @/lib/types, never from @/lib/database.types directly.",
        "Always update both src/messages/mn.json and src/messages/en.json for any new UI strings.",
        "Run npm run build at the end of each phase to verify no regressions.",
        "Use existing shadcn components from src/components/ui/ — never build from primitives when a shadcn component exists.",
        "For all agent/skill tasks within this phase, delegate to subagents for complex sub-work.",
        "Return structured JSON output with status, changes, and build results.",
      ],
      outputFormat: "JSON",
      outputSchema: {
        type: "object",
        required: ["status", "changes"],
        properties: {
          status: { type: "string", enum: ["completed", "failed"] },
          buildPassing: { type: "boolean" },
          changes: { type: "array", items: { type: "string" } },
          error: { type: "string" },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
