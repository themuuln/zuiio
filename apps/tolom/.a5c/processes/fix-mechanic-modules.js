/**
 * @process fix-mechanic-modules
 * @description Fix production readiness gaps in mechanic-performance and my-shift modules
 * @inputs { projectPath: string }
 * @outputs { success: boolean, modulesFixed: array, testsAdded: array }
 *
 * Phases:
 * 1. Migrate mechanic-performance from raw fetch to React Query
 * 2. Add error boundary + loading skeleton to mechanic-performance
 * 3. Write tests for mechanic-performance service layer
 * 4. Write tests for mechanic-performance API routes
 * 5. Write tests for my-shift API routes
 * 6. Verification gate: validate + test + build
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function process(inputs, ctx) {
  const { projectPath } = inputs;
  const startTime = ctx.now();
  const artifacts = [];
  const testsAdded = [];
  const modulesFixed = [];

  ctx.log("info", "Starting mechanic modules production readiness fix");

  // ============================================================================
  // PHASE 1: Migrate mechanic-performance to React Query
  // ============================================================================
  ctx.log("info", "Phase 1: Migrate mechanic-performance to React Query");

  const reactQueryMigration = await ctx.task(reactQueryMigrationTask, {
    projectPath,
    pagePath: "src/app/[locale]/dashboard/mechanic-performance/page.tsx",
    hooksPath: "src/lib/queries/use-mechanic-performance.ts",
    apiEndpoints: [
      "/api/organizations/{orgId}/reports?type=custom",
      "/api/organizations/{orgId}/mechanic-hours",
      "/api/organizations/{orgId}/mechanic-commissions",
    ],
    instructions: [
      "Read the current page.tsx to understand all data fetching (3 raw fetch calls with useState)",
      "Read use-mechanic-dashboard.ts for the existing React Query pattern in this project",
      "Read src/lib/queries/keys.ts for the query key factory pattern",
      "Create src/lib/queries/use-mechanic-performance.ts with 3 query hooks:",
      "  - useMechanicKpis(orgId, dateRange) - fetches /reports?type=custom",
      "  - useMechanicHours(orgId, dateRange) - fetches /mechanic-hours",
      "  - useMechanicCommissions(orgId, dateRange) - fetches /mechanic-commissions",
      "Each hook should use createOrgQuery factory like use-mechanic-dashboard.ts does",
      "Refactor page.tsx to use these hooks instead of raw fetch + useState",
      "Remove all useState for loading/error/data states that are replaced by React Query",
      "Keep the sorting logic, sidebar integration, and all UI components intact",
      "Add query keys to keys.ts following the mechanicKeys pattern",
      "Run lsp_diagnostics on all changed files to verify no type errors",
    ],
  });
  artifacts.push(...reactQueryMigration.artifacts);
  modulesFixed.push("mechanic-performance-react-query");

  // ============================================================================
  // PHASE 2: Add error boundary + loading skeleton
  // ============================================================================
  ctx.log(
    "info",
    "Phase 2: Add error boundary + loading skeleton to mechanic-performance",
  );

  const errorBoundary = await ctx.task(errorBoundaryTask, {
    projectPath,
    modulePath: "src/app/[locale]/dashboard/mechanic-performance",
    instructions: [
      "Read src/app/[locale]/dashboard/mechanic/error.tsx for the existing Sentry error boundary pattern",
      "Read src/app/[locale]/dashboard/mechanic/loading.tsx for the existing loading skeleton pattern",
      "Create src/app/[locale]/dashboard/mechanic-performance/error.tsx matching the mechanic module pattern",
      "Create src/app/[locale]/dashboard/mechanic-performance/loading.tsx matching the mechanic module pattern",
      "Run lsp_diagnostics on the new files",
    ],
  });
  artifacts.push(...errorBoundary.artifacts);
  modulesFixed.push("mechanic-performance-error-handling");

  // ============================================================================
  // PHASE 3: Tests for mechanic-performance service layer
  // ============================================================================
  ctx.log(
    "info",
    "Phase 3: Write tests for mechanic-performance service layer",
  );

  const serviceTests = await ctx.task(serviceTestsTask, {
    projectPath,
    testFile: "src/lib/services/report-service/mechanics.test.ts",
    sourceFile: "src/lib/services/report-service/mechanics.ts",
    instructions: [
      "Read src/lib/services/report-service/mechanics.ts to understand all exported functions",
      "Read src/lib/services/time-tracking-service.test.ts for the project testing pattern (mock Supabase client, vi.mock, createMockSupabaseClient)",
      "Read src/test/mocks/supabase.ts for the mock factory",
      "Create tests for getMechanicKpis - test with data, empty data, various work order states",
      "Create tests for getMechanicsList - test org filtering, branch filtering, empty results",
      "Create tests for getMechanicPerformanceTrend - test weekly/monthly trends, edge cases",
      "Each test should mock createClient and verify correct Supabase queries",
      "Run vitest to verify all tests pass",
    ],
  });
  artifacts.push(...serviceTests.artifacts);
  testsAdded.push("mechanics-service-tests");

  // ============================================================================
  // PHASE 4: Tests for mechanic-performance API routes
  // ============================================================================
  ctx.log("info", "Phase 4: Write tests for mechanic-performance API routes");

  const apiTests = await ctx.task(apiTestsTask, {
    projectPath,
    routes: [
      "src/app/api/organizations/[id]/mechanic-hours/route.ts",
      "src/app/api/organizations/[id]/mechanic-commissions/route.ts",
    ],
    instructions: [
      "Read both route files to understand request/response handling",
      "Read existing API route tests in the project for the testing pattern",
      "Create src/app/api/organizations/[id]/mechanic-hours/route.test.ts",
      "Create src/app/api/organizations/[id]/mechanic-commissions/route.test.ts",
      "Test happy path (valid dates, returns data)",
      "Test edge cases (missing params, invalid dates, empty results)",
      "Test auth (unauthorized requests)",
      "Run vitest to verify all tests pass",
    ],
  });
  artifacts.push(...apiTests.artifacts);
  testsAdded.push("mechanic-performance-api-tests");

  // ============================================================================
  // PHASE 5: Tests for my-shift API routes
  // ============================================================================
  ctx.log("info", "Phase 5: Write tests for my-shift API routes");

  const shiftApiTests = await ctx.task(shiftApiTestsTask, {
    projectPath,
    routes: [
      "src/app/api/organizations/[id]/me/time/clock-in/route.ts",
      "src/app/api/organizations/[id]/me/time/clock-out/route.ts",
      "src/app/api/organizations/[id]/me/time/status/route.ts",
    ],
    instructions: [
      "Read the 3 time tracking route files",
      "Read the existing time-tracking-service.test.ts for patterns",
      "Create src/app/api/organizations/[id]/me/time/clock-in/route.test.ts",
      "Create src/app/api/organizations/[id]/me/time/clock-out/route.test.ts",
      "Create src/app/api/organizations/[id]/me/time/status/route.test.ts",
      "Test clock-in: success, already clocked in, rate limit",
      "Test clock-out: success, not clocked in, rate limit",
      "Test status: clocked in, clocked out",
      "Run vitest to verify all tests pass",
    ],
  });
  artifacts.push(...shiftApiTests.artifacts);
  testsAdded.push("my-shift-api-tests");

  // ============================================================================
  // PHASE 6: Verification gate
  // ============================================================================
  ctx.log("info", "Phase 6: Verification gate");

  const verification = await ctx.task(verificationTask, {
    projectPath,
    instructions: [
      "Run npm run validate (tsc + biome) from the project root",
      "Run npm run test from the project root",
      "If any step fails, fix the issues and re-run",
      "Report final status: all tests pass, no type errors, no lint errors",
    ],
  });
  artifacts.push(...verification.artifacts);

  // ============================================================================
  // BREAKPOINT: Review before declaring done
  // ============================================================================
  const review = await ctx.breakpoint({
    question:
      "All phases complete. Modules fixed: mechanic-performance (React Query + error boundary + tests), my-shift (API route tests). Verify the changes look correct?",
    title: "Review Changes",
    context: {
      runId: ctx.runId,
      modulesFixed,
      testsAdded,
      verification: verification.result,
    },
    expert: "owner",
    tags: ["approval-gate"],
  });

  if (!review.approved) {
    ctx.log("info", `Review rejected: ${review.response || review.feedback}`);
    return {
      success: false,
      modulesFixed,
      testsAdded,
      artifacts,
      reason: review.response || review.feedback,
    };
  }

  return {
    success: true,
    modulesFixed,
    testsAdded,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: "fix-mechanic-modules", timestamp: startTime },
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const reactQueryMigrationTask = defineTask(
  "react-query-migration",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Migrate mechanic-performance to React Query",
    execution: { model: "claude-sonnet-4-20250514" },
    agent: {
      name: "general-purpose",
      prompt: {
        role: "React Query Migration Specialist",
        task: "Migrate mechanic-performance page from raw fetch to React Query hooks",
        context: args,
        instructions: args.instructions,
        outputFormat: "JSON with summary of changes",
      },
      outputSchema: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: { type: "string" },
          filesChanged: { type: "array" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["web", "react-query", "migration"],
  }),
);

export const errorBoundaryTask = defineTask(
  "error-boundary",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Add error boundary + loading skeleton",
    execution: { model: "claude-sonnet-4-20250514" },
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Next.js Error Handling Specialist",
        task: "Add error.tsx and loading.tsx to mechanic-performance module",
        context: args,
        instructions: args.instructions,
        outputFormat: "JSON with summary of changes",
      },
      outputSchema: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: { type: "string" },
          filesCreated: { type: "array" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["web", "nextjs", "error-handling"],
  }),
);

export const serviceTestsTask = defineTask(
  "service-tests",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Write mechanic service tests",
    execution: { model: "claude-sonnet-4-20250514" },
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Vitest Testing Specialist",
        task: "Write unit tests for mechanic service functions",
        context: args,
        instructions: args.instructions,
        outputFormat: "JSON with test summary",
      },
      outputSchema: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: { type: "string" },
          testFile: { type: "string" },
          testCount: { type: "number" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["web", "testing", "vitest"],
  }),
);

export const apiTestsTask = defineTask("api-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Write mechanic API route tests",
  execution: { model: "claude-sonnet-4-20250514" },
  agent: {
    name: "general-purpose",
    prompt: {
      role: "API Testing Specialist",
      task: "Write integration tests for mechanic API routes",
      context: args,
      instructions: args.instructions,
      outputFormat: "JSON with test summary",
    },
    outputSchema: {
      type: "object",
      required: ["summary"],
      properties: {
        summary: { type: "string" },
        testFiles: { type: "array" },
        testCount: { type: "number" },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ["web", "testing", "api"],
}));

export const shiftApiTestsTask = defineTask(
  "shift-api-tests",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Write my-shift API route tests",
    execution: { model: "claude-sonnet-4-20250514" },
    agent: {
      name: "general-purpose",
      prompt: {
        role: "API Testing Specialist",
        task: "Write integration tests for time tracking API routes",
        context: args,
        instructions: args.instructions,
        outputFormat: "JSON with test summary",
      },
      outputSchema: {
        type: "object",
        required: ["summary"],
        properties: {
          summary: { type: "string" },
          testFiles: { type: "array" },
          testCount: { type: "number" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["web", "testing", "api"],
  }),
);

export const verificationTask = defineTask("verification", (args, taskCtx) => ({
  kind: "shell",
  title: "Run validation and tests",
  shell: {
    commands: [
      { cmd: "npm run validate", cwd: args.projectPath, timeout: 120 },
      { cmd: "npm run test", cwd: args.projectPath, timeout: 120 },
    ],
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ["verification", "build", "test"],
}));
