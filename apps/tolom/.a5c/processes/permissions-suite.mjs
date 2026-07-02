/**
 * @process permissions-suite
 * @description Complete permissions & RBAC suite for TOLOM — fix permission_action enum, backfill existing orgs,
 *   define PLAN_FEATURES mapping, wire feature_flags into API and sidebar, add role/permission CRUD APIs,
 *   build permission matrix UI, fix RLS policies, gate unguarded API routes, add feature toggle UI.
 * @inputs { }
 * @outputs { success: boolean, completedPhases: array, buildPassing: boolean }
 *
 * @agent general-purpose (execute each phase)
 * @skill supabase (migrations, RLS, types)
 * @skill next-best-practices (Next.js route patterns)
 * @skill uiux (UI for permission matrix and feature toggle)
 * @skill shadcn (UI components)
 * @skill react-doctor (React diagnostics)
 *
 * @references
 * - specializations/web-development/nextjs-fullstack-app.js - Next.js patterns
 * - specializations/web-development/postgresql-database-design.js - DB patterns
 * - specializations/web-development/rbac-implementation.js - RBAC patterns
 * - reference/ADVANCED_PATTERNS.md - Iterative convergence patterns
 * - reference/sdk.md - SDK API reference
 */

import pkg from "@a5c-ai/babysitter-sdk";
const { defineTask } = pkg;

////////////////////////////////////////
// Process exports
////////////////////////////////////////

export async function process(inputs, ctx) {
  const completedPhases = [];
  let buildPassing = true;

  const phases = [
    {
      id: "fix-permission-action-enum",
      title: "Fix permission_action enum + backfill existing orgs",
    },
    {
      id: "plan-features-mapping",
      title: "Define PLAN_FEATURES mapping",
    },
    {
      id: "feature-flags-api-and-sidebar-gating",
      title: "Feature flags API + sidebar gating",
    },
    {
      id: "role-permission-crud-apis",
      title: "Role/Permission CRUD APIs",
    },
    {
      id: "permission-matrix-ui",
      title: "Permission matrix UI",
    },
    {
      id: "rls-policy-fixes",
      title: "RLS policy fixes for admin tables",
    },
    {
      id: "permission-gating-api-routes",
      title: "Permission gating on unguarded API routes",
    },
    {
      id: "feature-toggle-ui",
      title: "Feature toggle UI for org owners",
    },
    {
      id: "quality-gate",
      title: "Final quality gate — build, lint, test",
    },
  ];

  for (const [idx, p] of phases.entries()) {
    ctx.log("info", `Starting phase ${idx + 1}/${phases.length}: ${p.title}`);

    const result = await ctx.task(executePhaseTask, {
      phase: p,
      phaseIndex: idx + 1,
      totalPhases: phases.length,
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
      role: "Full-stack developer implementing permissions & RBAC suite",
      task: `Implement phase "${args.phase.title}" (phase ${args.phaseIndex}/${args.totalPhases}) of the TOLOM permissions suite.`,
      context: {
        phase: args.phase,
        phaseIndex: args.phaseIndex,
        totalPhases: args.totalPhases,
        projectRoot: "/Users/themuuln/coding/personal/tolom/tolom",
        supabaseProjectId: "tlqvnwfhqclsfutkbqxn",
        stack:
          "Next.js 16 App Router, Supabase (PostgreSQL + Auth), TypeScript, tailwind, shadcn/ui, React Query, Zustand",
        currentMigrationDir:
          "/Users/themuuln/coding/personal/tolom/tolom/supabase/migrations",
      },
      instructions: [
        "PROJECT ROOT is /Users/themuuln/coding/personal/tolom/tolom. Always use absolute paths when referencing files.",
        "SUPABASE: linked project is 'tlqvnwfhqclsfutkbqxn'. Use MCP tool supabase_tolom_execute_sql (NOT supabase_execute_sql) to run SQL. Migration files go in supabase/migrations/ with supabase migration new <name>.",
        "After any migration, ALWAYS regenerate types: use supabase_tolom_generate_typescript_types MCP tool, then run npm run build to verify.",
        "Always import types from @/lib/types, never from @/lib/database.types directly.",
        "Always update both src/messages/mn.json and src/messages/en.json for any new UI strings.",
        "Run npm run build at the end of each phase to verify no regressions.",
        "Use existing shadcn components from src/components/ui/ — never build from primitives when a shadcn component exists.",
        "For all agent/skill tasks within this phase, delegate to subagents for complex sub-work.",
        "Return structured JSON output with status, changes, and build results.",
      ],
      phaseSpecific: {
        "fix-permission-action-enum": {
          description:
            "Add 'write' and 'invite' to permission_action enum, then backfill all existing orgs with latest permission sets by re-running seed_org_permissions() and seed_org_role_permissions() for each org.",
          steps: [
            "1. Run ALTER TYPE permission_action ADD VALUE 'write' and ADD VALUE 'invite' (if not already present).",
            "2. Create a migration that iterates all existing orgs and calls seed_org_permissions(org.id) and seed_org_role_permissions(org.id) to backfill permissions.",
            "3. Regenerate TypeScript types and run npm run build.",
          ],
        },
        "plan-features-mapping": {
          description:
            "Create src/lib/plan-features.ts defining which feature keys each plan tier unlocks.",
          steps: [
            "1. Create src/lib/plan-features.ts with a PLAN_FEATURES map: starter, pro, business, enterprise → string[] of feature flags.",
            "2. Export helper isPlanFeatureEnabled(planType, feature) and getPlanFeatures(planType).",
            "3. Regenerate types and build.",
          ],
        },
        "feature-flags-api-and-sidebar-gating": {
          description:
            "Create API endpoints for feature_flags, then integrate into useNavigation() so sidebar hides features disabled by plan or org toggle.",
          steps: [
            "1. Create GET/PATCH /api/organizations/[id]/features route for reading/toggling feature_flags.",
            "2. Create src/hooks/use-available-features.ts that combines plan features + org feature flags + role.",
            "3. Update hooks/use-navigation.ts to use useAvailableFeatures() to filter nav groups.",
            "4. Update useCurrentUserRole() to also expose plan info.",
            "5. Build and verify.",
          ],
        },
        "role-permission-crud-apis": {
          description:
            "Create full CRUD API routes for roles and permissions management.",
          steps: [
            "1. Add POST /api/organizations/[id]/roles - create custom role.",
            "2. Add PATCH /api/organizations/[id]/roles/[roleId] - update role name/description.",
            "3. Add DELETE /api/organizations/[id]/roles/[roleId] - soft delete role.",
            "4. Add GET /api/organizations/[id]/roles/[roleId]/permissions - list role's permissions.",
            "5. Add PUT /api/organizations/[id]/roles/[roleId]/permissions - set role's permissions.",
            "6. Add GET /api/organizations/[id]/permissions - list all available permissions for the org.",
            "7. All routes gated behind minimumRole: 'Org Owner'.",
            "8. Build and verify.",
          ],
        },
        "permission-matrix-ui": {
          description:
            "Build a visual permission matrix UI on the roles page that shows resources × actions with toggle checkboxes.",
          steps: [
            "1. Redesign src/app/[locale]/dashboard/organization/roles/page.tsx to show a permission matrix per role.",
            "2. Toggling a permission checkbox calls PUT /api/organizations/[id]/roles/[roleId]/permissions.",
            "3. Add ability to create custom roles with a 'Create Role' button and dialog.",
            "4. Add ability to edit role name/description inline or in a sheet.",
            "5. Update i18n messages (mn.json + en.json).",
            "6. Build and verify.",
          ],
        },
        "rls-policy-fixes": {
          description:
            "Fix RLS policies on roles, permissions, role_permissions, organization_settings, and feature_flags to require minimum role level.",
          steps: [
            "1. Create a helper function is_org_admin() or is_minimum_role(min_role_name) that checks the user's role in their org.",
            "2. Update RLS policies on roles table: only Managers+ can insert/update/delete, all can select.",
            "3. Update RLS policies on permissions table: only Org Owners can insert/update/delete.",
            "4. Update RLS policies on role_permissions table: only Org Owners can insert/delete.",
            "5. Update RLS policies on organization_settings: only Org Owners can update, all can select.",
            "6. Update RLS policies on feature_flags: only Org Owners can insert/update/delete, all can select.",
            "7. Regenerate types and build.",
          ],
        },
        "permission-gating-api-routes": {
          description:
            "Add permission gating to all unguarded API routes by adding requiredPermission or minimumRole to createRouteHandler calls.",
          steps: [
            "1. Audit all API routes in src/app/api/organizations/[id]/ that lack minimumRole/requiredPermission.",
            "2. Add appropriate gating to each. Use these permissions where applicable:",
            "   - branches: members.read/members.update",
            "   - services/services/[id]: services.read/services.update/services.create",
            "   - suppliers: inventory.read/inventory.update",
            "   - vehicle-models: settings.read/settings.update",
            "   - inventory/* (parts, movements, purchase-orders, parts-cars, suppliers, thresholds, alerts, reports): inventory.read/inventory.update",
            "   - expenses: expenses.read/expenses.create",
            "   - expense-categories: settings.read/settings.update",
            "   - commission-rules: settings.read/settings.update",
            "   - diagnosis-labels: settings.read/settings.update",
            "   - clock/*: settings.read",
            "   - service-reminders: settings.read",
            "   - theme: settings.update",
            "   - organizations/[id] PATCH: settings.update",
            "   - roles: members.read/members.update",
            "   - users: members.read/members.update",
            "   - price-rules: settings.update",
            "3. Seed the new permission resources into seed_org_permissions().",
            "4. Build and verify.",
          ],
        },
        "feature-toggle-ui": {
          description:
            "Add a 'Features' section to the settings page where org owners can toggle features on/off per-plan limits.",
          steps: [
            "1. Add a 'Features' section to SETTINGS_SECTIONS in _settings-sections.ts.",
            "2. Create _feature-flags-section.tsx showing all features grouped by plan tier with toggle switches.",
            "3. Locked features (not in current plan) show a badge 'Available on Pro' with an upgrade link.",
            "4. Toggling calls PATCH /api/organizations/[id]/features.",
            "5. Update i18n messages.",
            "6. Build and verify.",
          ],
        },
        "quality-gate": {
          description: "Final verification: build, lint, test. Fix any issues.",
          steps: [
            "1. Run npm run validate (tsc + biome check).",
            "2. Run npm run test.",
            "3. Run npm run build (production build).",
            "4. If any step fails, fix and re-run until green.",
          ],
        },
      },
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
