/**
 * @process feature/qr-clock-in
 * @description QR scan + phone identity verification for mechanic clock-in/out.
 *   Admin registers mechanic's phone, then clock-in requires scanning a QR with the registered phone.
 * @skill supabase specializations/web-development/skills/supabase/SKILL.md
 * @skill supabase-postgres-best-practices specializations/web-development/skills/supabase-postgres-best-practices/SKILL.md
 * @skill next-best-practices specializations/web-development/skills/next-best-practices/SKILL.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function process(inputs, ctx) {
  const startTime = ctx.now();
  ctx.log("info", "Starting QR Clock-In feature implementation");

  // ── Phase 1: DB Migration ──────────────────────────────────────────────
  ctx.log("info", "Phase 1: Creating database migration");

  const phase1Confirm = await ctx.breakpoint({
    question: `Phase 1: Create database migration with:
• mechanic_devices table (links a phone device to a mechanic)
• clock_in_tokens table (short-lived single-use QR tokens)
• RPC functions: register_device, verify_clock_token, generate_clock_token
• RLS policies for both tables

Proceed with Phase 1?`,
    title: "Phase 1 — DB Migration",
    expert: "owner",
    tags: ["db", "migration"],
  });
  if (!phase1Confirm.approved) {
    ctx.log("error", "Phase 1 rejected by user");
    return { success: false, reason: "Phase 1 rejected" };
  }

  const dbMigration = await ctx.task(createDbMigrationTask, {});
  ctx.log("info", `DB migration created: ${dbMigration.migrationFile}`);

  const typeGeneration = await ctx.task(generateTypesTask, {});
  ctx.log(
    "info",
    `Types regenerated: ${typeGeneration.success ? "OK" : "FAILED"}`,
  );

  const phase1Build = await ctx.task(verifyBuildTask, {});
  ctx.log(
    "info",
    `Build check Phase 1: ${phase1Build.passes ? "PASSED" : "FAILED"}`,
  );

  if (!phase1Build.passes) {
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: phase1Build.errors,
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
  }

  // ── Phase 2: QR Token Service + Clock-in extension ────────────────────
  ctx.log("info", "Phase 2: Creating QR token service and extending clock-in");

  const phase2Confirm = await ctx.breakpoint({
    question: `Phase 2: Create server-side services:
• qr-token-service.ts — generateClockToken(), verifyClockToken()
• Extend time-tracking-service.ts with QR-aware clockIn/clockOut
• Public API routes for QR-based clock-in flow

Proceed with Phase 2?`,
    title: "Phase 2 — Services",
    expert: "owner",
    tags: ["services", "api"],
  });
  if (!phase2Confirm.approved) {
    ctx.log("error", "Phase 2 rejected");
    return { success: false, reason: "Phase 2 rejected" };
  }

  const qrService = await ctx.task(createQrTokenServiceTask, {});
  ctx.log("info", `QR service created: ${qrService.files}`);

  const clockInExtension = await ctx.task(extendClockInServiceTask, {});
  ctx.log("info", `Clock-in service extended`);

  const phase2Build = await ctx.task(verifyBuildTask, {});
  ctx.log(
    "info",
    `Build check Phase 2: ${phase2Build.passes ? "PASSED" : "FAILED"}`,
  );
  if (!phase2Build.passes) {
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: phase2Build.errors,
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
  }

  // ── Phase 3: Phone Scanner Page ────────────────────────────────────────
  ctx.log("info", "Phase 3: Creating phone scanner page");

  const phase3Confirm = await ctx.breakpoint({
    question: `Phase 3: Create mobile web scanner page:
• /clock/scan page — camera viewfinder + QR scanning via html5-qrcode
• Device registration confirmation flow
• Install html5-qrcode dependency

Proceed with Phase 3?`,
    title: "Phase 3 — Phone UI",
    expert: "owner",
    tags: ["ui", "mobile"],
  });
  if (!phase3Confirm.approved) {
    ctx.log("error", "Phase 3 rejected");
    return { success: false, reason: "Phase 3 rejected" };
  }

  const phonePage = await ctx.task(createPhoneScannerPageTask, {});
  ctx.log("info", `Phone scanner page created: ${phonePage.files}`);

  const phase3Build = await ctx.task(verifyBuildTask, {});
  ctx.log(
    "info",
    `Build check Phase 3: ${phase3Build.passes ? "PASSED" : "FAILED"}`,
  );
  if (!phase3Build.passes) {
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: phase3Build.errors,
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
  }

  // ── Phase 4: Tablet QR Display Component ──────────────────────────────
  ctx.log("info", "Phase 4: Creating tablet QR display component");

  const phase4Confirm = await ctx.breakpoint({
    question: `Phase 4: Create QR display for the shop tablet:
• QR display component on Bay View toolbar
• Realtime subscription for clock-in confirmation
• Integration with Mechanic Dashboard ClockInOutButton
• Auto-refresh QR every 45s

Proceed with Phase 4?`,
    title: "Phase 4 — Tablet UI",
    expert: "owner",
    tags: ["ui", "realtime"],
  });
  if (!phase4Confirm.approved) {
    ctx.log("error", "Phase 4 rejected");
    return { success: false, reason: "Phase 4 rejected" };
  }

  const tabletQr = await ctx.task(createTabletQrDisplayTask, {});
  ctx.log("info", `Tablet QR display created: ${tabletQr.files}`);

  const phase4Build = await ctx.task(verifyBuildTask, {});
  ctx.log(
    "info",
    `Build check Phase 4: ${phase4Build.passes ? "PASSED" : "FAILED"}`,
  );
  if (!phase4Build.passes) {
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: phase4Build.errors,
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
  }

  // ── Phase 5: Admin Device Registration ────────────────────────────────
  ctx.log("info", "Phase 5: Creating admin device registration UI");

  const phase5Confirm = await ctx.breakpoint({
    question: `Phase 5: Create admin device registration:
• Admin settings page section for managing mechanic devices
• Registration flow: admin picks mechanic → generates QR/link → mechanic scans
• Device management: list registered devices, revoke lost phone
• i18n strings in mn.json + en.json

Proceed with Phase 5?`,
    title: "Phase 5 — Admin UI",
    expert: "owner",
    tags: ["admin", "settings"],
  });
  if (!phase5Confirm.approved) {
    ctx.log("error", "Phase 5 rejected");
    return { success: false, reason: "Phase 5 rejected" };
  }

  const adminUi = await ctx.task(createAdminDeviceRegistrationTask, {});
  ctx.log("info", `Admin UI created: ${adminUi.files}`);

  const phase5Build = await ctx.task(verifyBuildTask, {});
  ctx.log(
    "info",
    `Build check Phase 5: ${phase5Build.passes ? "PASSED" : "FAILED"}`,
  );
  if (!phase5Build.passes) {
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: phase5Build.errors,
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
  }

  // ── Phase 6: Tests ────────────────────────────────────────────────────
  ctx.log("info", "Phase 6: Writing tests");

  const phase6Confirm = await ctx.breakpoint({
    question: `Phase 6: Write tests:
• time-tracking-service test extensions for QR flow
• QR token service unit tests
• RPC function verification via supabase_execute_sql

Proceed with Phase 6?`,
    title: "Phase 6 — Tests",
    expert: "owner",
    tags: ["testing"],
  });
  if (!phase6Confirm.approved) {
    ctx.log("error", "Phase 6 rejected");
    return { success: false, reason: "Phase 6 rejected" };
  }

  const tests = await ctx.task(writeTestsTask, {});
  ctx.log("info", `Tests written: ${tests.count}`);

  const testRun = await ctx.task(runTestsTask, {});
  ctx.log("info", `Tests pass: ${testRun.passes ? "ALL PASSED" : "FAILED"}`);

  if (!testRun.passes) {
    const fixTests = await ctx.task(fixTestErrorsTask, {
      errors: testRun.errors,
    });
    ctx.log("info", `Test fixes applied: ${fixTests.fixes}`);
  }

  // ── Final Quality Gate ────────────────────────────────────────────────
  ctx.log("info", "Final quality gate: full build + lint check");

  const finalBuild = await ctx.task(verifyBuildTask, {});
  ctx.log(
    "info",
    `Final build check: ${finalBuild.passes ? "PASSED" : "FAILED"}`,
  );

  if (!finalBuild.passes) {
    const finalFix = await ctx.task(fixBuildErrorsTask, {
      errors: finalBuild.errors,
    });
    ctx.log("info", `Final fixes applied: ${finalFix.fixes}`);

    const retryBuild = await ctx.task(verifyBuildTask, {});
    if (!retryBuild.passes) {
      ctx.log(
        "error",
        "Final build still failing — manual intervention needed",
      );
      return {
        success: false,
        summary: { finalBuildPasses: false },
        duration: ctx.now() - startTime,
      };
    }
  }

  const lintCheck = await ctx.task(runLintTask, {});
  ctx.log("info", `Lint check: ${lintCheck.passes ? "PASSED" : "FAILED"}`);

  return {
    success: finalBuild.passes && testRun.passes,
    summary: {
      dbMigration: true,
      qrService: true,
      clockInExtended: true,
      phoneScannerPage: true,
      tabletQrDisplay: true,
      adminDeviceRegistration: true,
      testsWritten: tests.count,
      testsPass: testRun.passes,
      lintPass: lintCheck.passes,
      buildPass: finalBuild.passes,
    },
    duration: ctx.now() - startTime,
    metadata: {
      processId: "feature/qr-clock-in",
      timestamp: startTime,
    },
  };
}

// ── Phase 1: DB Migration ──────────────────────────────────────────────────

export const createDbMigrationTask = defineTask(
  "create-db-migration",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create DB migration for mechanic devices + clock-in tokens",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Database Engineer",
        task: "Create Supabase migration for QR clock-in feature",
        context: {
          project:
            "TOLOM — auto repair SaaS. Next.js 16 + Supabase + PostgreSQL.",
          migrationDir: "supabase/migrations/",
          existingTables: [
            "mechanic_time_logs (id, organization_id, mechanic_id, clock_in, clock_out, date, notes, created_at)",
            "organizations (id, settings JSONB with bay_view_pin_hash)",
          ],
        },
        instructions: [
          "Read src/app/api/organizations/[id]/me/time/clock-in/route.ts to understand existing clock-in API",
          "Read src/lib/services/time-tracking-service.ts for the existing service pattern",
          "Read supabase/migrations/20260522000000_mechanic_time_logs.sql for the existing time_logs schema and RLS patterns",
          "Read supabase/migrations/00007_org_selector_bay_view_pin.sql for crypt() usage patterns",
          "Create a new migration file supabase/migrations/20260601000000_mechanic_devices.sql with:",
          "",
          "1. Table: mechanic_devices",
          "   - id uuid PK",
          "   - mechanic_id uuid NOT NULL REFERENCES auth.users(id)",
          "   - organization_id uuid NOT NULL REFERENCES organizations(id)",
          "   - device_name text (optional, e.g. 'Boldoo's iPhone')",
          "   - device_fingerprint text NOT NULL (a unique device identifier)",
          "   - last_used_at timestamptz",
          "   - created_at timestamptz DEFAULT now()",
          "   - revoked_at timestamptz (null = active)",
          "   - UNIQUE(mechanic_id) — one active device per mechanic",
          "   - Unique index on device_fingerprint where revoked_at IS NULL",
          "",
          "2. Table: clock_in_tokens",
          "   - id uuid PK",
          "   - organization_id uuid NOT NULL REFERENCES organizations(id)",
          "   - mechanic_id uuid (null until claimed — references auth.users)",
          "   - session_id uuid NOT NULL DEFAULT gen_random_uuid()",
          "   - token_hash text NOT NULL (SHA-256 of raw token for lookup)",
          "   - action_type text NOT NULL CHECK (action_type IN ('clock_in', 'clock_out', 'register_device'))",
          "   - expires_at timestamptz NOT NULL (default now() + interval '60 seconds')",
          "   - claimed_at timestamptz (null = not yet used — single use)",
          "   - created_at timestamptz DEFAULT now()",
          "   - Index on token_hash for fast lookup",
          "   - Index on (organization_id, expires_at) for cleanup",
          "",
          "3. RPC: generate_clock_token(org_id uuid, action_type text) returns json",
          "   - Generates a random token (gen_random_uuid() text)",
          "   - Stores SHA-256 hash + expires_at (60s from now)",
          "   - Returns { raw_token, session_id, expires_at }",
          "",
          "4. RPC: verify_clock_token(raw_token text, mechanic_id uuid) returns json",
          "   - Looks up by SHA-256 hash",
          "   - Validates: exists, not expired, not claimed, mechanic matches",
          "   - Sets claimed_at = now()",
          "   - Returns { valid: boolean, session_id, action_type }",
          "",
          "5. RPC: register_mechanic_device(org_id uuid, registration_token text) returns json",
          "   - Looks up clock_in_tokens where action_type = 'register_device'",
          "   - Creates mechanic_devices row for the calling auth.uid()",
          "   - Returns { success: boolean, device_id }",
          "",
          "6. RLS on mechanic_devices:",
          "   - SELECT: organization members (org RLS via get_user_organization_id())",
          "   - INSERT: authenticated users only (mechanic registers own device)",
          "   - UPDATE: org admins only (revoke device)",
          "",
          "7. RLS on clock_in_tokens:",
          "   - SELECT: organization members",
          "   - INSERT: authenticated users with org membership",
          "   - UPDATE: system (via RPC, not direct)",
          "",
          "8. Enable pgcrypto extension if not already enabled (for gen_random_uuid, digest)",
          "",
          "IMPORTANT: Use 'extensions.crypt' and 'extensions.gen_salt' for any password hashing,",
          "and 'extensions.digest' for SHA-256 hashing, to match the project convention.",
          "Follow the existing RLS pattern from other migrations (get_user_organization_id()).",
          "Use today's date 2026-06-01 for the migration filename.",
        ],
        outputFormat:
          "JSON with: { migrationFile: string, sqlContent: string, tablesCreated: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          migrationFile: { type: "string" },
          sqlContent: { type: "string" },
          tablesCreated: { type: "array", items: { type: "string" } },
        },
        required: ["migrationFile", "sqlContent", "tablesCreated"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["db", "migration", "supabase"],
  }),
);

// ── Generate Types ─────────────────────────────────────────────────────────

export const generateTypesTask = defineTask(
  "generate-types",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Regenerate TypeScript types after migration",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "TypeScript Developer",
        task: "Regenerate database types and ensure type imports are correct",
        context: { project: "TOLOM" },
        instructions: [
          "Run `supabase gen types typescript --linked > src/lib/database.types.ts` to regenerate types",
          "Check if src/lib/types/index.ts or src/lib/types/core.ts need new type aliases for mechanic_devices and clock_in_tokens",
          "Add type exports: MechanicDevice = Tables<'mechanic_devices'>, ClockInToken = Tables<'clock_in_tokens'> to src/lib/types/core.ts",
          "Also add TablesInsert types: MechanicDeviceInsert, ClockInTokenInsert",
          "Run `npm run build` afterward to verify no type errors from regeneration",
          "If there are build errors, fix type references in the affected files",
        ],
        outputFormat:
          "JSON with { success: boolean, typesAdded: string[], errors: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          typesAdded: { type: "array", items: { type: "string" } },
          errors: { type: "array", items: { type: "string" } },
        },
        required: ["success", "typesAdded", "errors"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["typescript", "types", "supabase"],
  }),
);

// ── Phase 2: QR Token Service ──────────────────────────────────────────────

export const createQrTokenServiceTask = defineTask(
  "create-qr-token-service",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create QR token service",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Backend Developer",
        task: "Create the QR token service layer",
        context: {
          project: "TOLOM",
          serviceDir: "src/lib/services/",
          existingService: "src/lib/services/time-tracking-service.ts",
        },
        instructions: [
          "Read src/lib/services/time-tracking-service.ts for the existing service patterns",
          "Read src/lib/api-handler.ts for route handler patterns",
          "Read src/lib/supabase/server.ts for createClient pattern",
          "Read src/lib/cache/keys.ts for revalidation tag patterns",

          "Create src/lib/services/qr-token-service.ts with:",
          "",
          "1. generateClockToken(orgId, mechanicId, actionType):",
          "   - Calls the generate_clock_token RPC via supabase.rpc()",
          "   - Returns { rawToken, sessionId, expiresAt }",
          "   - The raw token is the value the QR code will encode",
          "",
          "2. verifyAndClaimClockToken(rawToken, mechanicId):",
          "   - Calls the verify_clock_token RPC via supabase.rpc()",
          "   - Returns { valid, sessionId, actionType }",
          "",
          "3. registerDevice(orgId):",
          "   - Calls register_mechanic_device RPC",
          "   - Returns { success, deviceId }",
          "",
          "4. getRegisteredDevices(orgId, mechanicId?):",
          "   - Queries mechanic_devices table (server-side, not RPC)",
          "   - Returns list of registered devices with status",
          "",
          "5. revokeDevice(deviceId):",
          "   - Updates mechanic_devices SET revoked_at = now()",
          "   - Admin-only — checks role before executing",
          "",
          "Follow the exact patterns from time-tracking-service.ts:",
          "- Use createClient() from @/lib/supabase/server",
          "- Add revalidateTag for cache invalidation",
          "- Export TypeScript interfaces for the return types",
          "- Proper error handling with typed errors",
        ],
        outputFormat: "JSON with { files: string[], serviceExports: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" } },
          serviceExports: { type: "array", items: { type: "string" } },
        },
        required: ["files", "serviceExports"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["services", "api"],
  }),
);

export const extendClockInServiceTask = defineTask(
  "extend-clock-in-service",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Extend clock-in service for QR verification",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Backend Developer",
        task: "Extend existing clock-in/out flow to support QR-based identity verification",
        context: {
          project: "TOLOM",
          existingRoutes: [
            "src/app/api/organizations/[id]/me/time/clock-in/route.ts",
            "src/app/api/organizations/[id]/me/time/clock-out/route.ts",
            "src/app/api/organizations/[id]/me/time/status/route.ts",
          ],
        },
        instructions: [
          "Read the existing clock-in and clock-out API routes",
          "Read src/lib/services/time-tracking-service.ts",
          "Read src/lib/api-handler.ts for the route handler pattern",
          "",
          "Create a new API route: src/app/api/organizations/[id]/clock/qr/route.ts",
          "POST /api/organizations/[id]/clock/qr — Generate a QR token for clock-in/out",
          "  - Requires auth (mechanic session)",
          "  - Body: { actionType: 'clock_in' | 'clock_out' }",
          "  - Returns: { data: { rawToken, sessionId, expiresAt } }",
          "",
          "Create: src/app/api/organizations/[id]/clock/verify/route.ts",
          "POST /api/organizations/[id]/clock/verify — Verify QR scan from phone",
          "  - Requires auth (phone session)",
          "  - Body: { rawToken }",
          "  - Calls verifyAndClaimClockToken, then clockIn/clockOut",
          "  - Returns: { data: { success, actionType, timestamp } }",
          "",
          "Create: src/app/api/organizations/[id]/clock/register-device/route.ts",
          "POST — Register device from phone after scanning registration QR",
          "  - Requires auth (phone session)",
          "  - Body: { registrationToken, deviceName }",
          "  - Returns: { data: { deviceId } }",
          "",
          "Create: src/app/api/organizations/[id]/clock/devices/route.ts",
          "GET — List registered devices (admin view)",
          "DELETE — Revoke a device (admin: body: { deviceId })",
          "",
          "Create: src/app/api/organizations/[id]/clock/generate-registration/route.ts",
          "POST — Admin generates a device registration QR for a mechanic",
          "  - Body: { mechanicId }",
          "  - Returns: { data: { rawToken, sessionId, expiresAt } }",
          "",
          "Follow the existing api-handler.ts pattern for all routes:",
          "- Use createRouteHandler() wrapper",
          "- Return ApiResponse<T> format",
          "- Add rate limiting for clock-in/out mutations",
        ],
        outputFormat: "JSON with { routesCreated: string[], routes: object[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          routesCreated: { type: "array", items: { type: "string" } },
          routes: { type: "array" },
        },
        required: ["routesCreated", "routes"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["api", "routes", "clock-in"],
  }),
);

// ── Phase 3: Phone Scanner Page ────────────────────────────────────────────

export const createPhoneScannerPageTask = defineTask(
  "create-phone-scanner-page",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create phone scanner page",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Create the mobile web scanner page for QR clock-in",
        context: {
          project: "TOLOM — Next.js 16 + shadcn/ui + Tailwind",
          existingComponents: "src/components/ui/",
          hasCameraApi: true,
        },
        instructions: [
          "Read src/app/[locale]/layout.tsx to understand the layout structure",
          "Read src/components/ui/ for available UI components",
          "Read src/lib/utils.ts for cn() helper",
          "Read src/messages/en.json and src/messages/mn.json for i18n patterns",
          "",
          "1. Install qrcode and html5-qrcode:",
          "   npm install qrcode html5-qrcode",
          "",
          "2. Create the scanner page at:",
          "   src/app/[locale]/clock/page.tsx",
          "   src/app/[locale]/clock/layout.tsx",
          "",
          "3. The scanner page should:",
          "   - Show a camera viewfinder (via html5-qrcode's Html5Qrcode)",
          "   - Auto-start camera on page load",
          "   - When a QR is scanned, extract the raw token",
          "   - Display a confirmation dialog: 'Clock in as [mechanic name]?'",
          "   - On confirm: POST to /api/organizations/[id]/clock/verify",
          "   - On success: show '✓ Clocked in at 08:32'",
          "   - On error: show error message, allow retry scan",
          "",
          "4. The page MUST:",
          "   - Be fully responsive (mobile-first, max-w-sm centered)",
          "   - Show a manual fallback: input field to type the token",
          "   - Handle camera permission denial gracefully",
          "   - Show a loading state while camera initializes",
          "   - Clean up camera resources on unmount",
          "",
          "5. i18n: Add keys to both messages/en.json and messages/mn.json:",
          "   clock.pageTitle, clock.scanInstructions, clock.confirmClockIn,",
          "   clock.confirmAs, clock.cancel, clock.success, clock.error,",
          "   clock.cameraPermission, clock.manualEntry, clock.enterToken,",
          "   clock.submit, clock.scanning, clock.clockedInAt, clock.clockedOutAt",
          "",
          "6. Create a reusable hook:",
          "   src/lib/hooks/use-qr-scanner.ts — wraps html5-qrcode with React lifecycle",
          "   Returns: { startScanning, stopScanning, isScanning, error }",
        ],
        outputFormat: "JSON with { files: string[], pagePath: string }",
      },
      outputSchema: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" } },
          pagePath: { type: "string" },
        },
        required: ["files", "pagePath"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["ui", "mobile", "camera"],
  }),
);

// ── Phase 4: Tablet QR Display ────────────────────────────────────────────

export const createTabletQrDisplayTask = defineTask(
  "create-tablet-qr-display",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create tablet QR display component",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Create the QR display component for the shop tablet",
        context: {
          project: "TOLOM",
          bayViewPath: "src/components/bay-view-v2/",
          mechanicPagePath: "src/app/[locale]/dashboard/mechanic/page.tsx",
          toolbarLocation:
            "BayViewV2Client toolbar (around line 260 in bay-view-v2-client.tsx)",
        },
        instructions: [
          "Read src/components/bay-view-v2/bay-view-v2-client.tsx thoroughly — especially the toolbar with action buttons (around line 260-360)",
          "Read src/app/[locale]/dashboard/mechanic/page.tsx — especially the ClockInOutButton component and handleClockToggle",
          "Read src/lib/hooks/use-realtime.ts for the Realtime subscription pattern",
          "Read src/lib/supabase/client.ts for createClient pattern",
          "",
          "1. Create src/components/bay-view-v2/qr-clock-display.tsx:",
          "   - A modal/dialog that shows when mechanic taps 'Clock In'",
          "   - Shows a large QR code generated from qrcode library (canvas)",
          "   - The QR encodes: { token: rawToken, sessionId } as JSON",
          "   - Auto-refreshes QR every 45 seconds (new token each time)",
          "   - Shows 'Scan with your phone' + instructions in Mongolian",
          "   - Subscribes to Realtime channel: clock_in_confirmations:{sessionId}",
          "   - On Realtime confirmation: show '✓ [Name] clocked in at HH:MM'",
          "   - Has a countdown timer showing when QR will refresh",
          "   - Auto-closes on success after 3 seconds",
          "   - Has a manual close/cancel button",
          "   - Props: open, onOpenChange, mechanicName, mechanicId, orgId",
          "",
          "2. Integrate into BayViewV2Client:",
          "   - Add QR clock state management (useState for dialog open)",
          "   - Add QR clock dialog to the toolbar similar to existing dialogs",
          "   - Show it when mechanic taps clock in (or from a toolbar button)",
          "",
          "3. Integrate into Mechanic Dashboard:",
          "   - Modify ClockInOutButton onClick in mechanic/page.tsx",
          "   - When clicked: show QR dialog instead of direct API call",
          "   - The QR flow replaces direct POST for non-admin mechanics",
          "",
          "4. For qrcode generation (server-side):",
          "   - Use qrcode package's toDataURL() which returns a base64 PNG",
          "   - Or use the canvas API directly in the component",
          "   - QR content: JSON.stringify({ t: rawToken, s: sessionId })",
          "",
          "5. Realtime subscription:",
          "   - Table: clock_in_confirmations (or use a dedicated Realtime channel)",
          "   - Filter: `session_id=eq.${sessionId}`",
          "   - On event: check if claimed_at is set → success",
          "   - Alternative: use a separate Postgres channel with broadcast",
        ],
        outputFormat: "JSON with { files: string[], components: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" } },
          components: { type: "array", items: { type: "string" } },
        },
        required: ["files", "components"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["ui", "realtime", "qrcode"],
  }),
);

// ── Phase 5: Admin Device Registration ────────────────────────────────────

export const createAdminDeviceRegistrationTask = defineTask(
  "create-admin-device-registration",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create admin device registration UI",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Create admin device registration UI for linking mechanic phones",
        context: {
          project: "TOLOM",
          adminSettingsPath: "src/app/[locale]/dashboard/organization/",
          existingPatterns: [
            "src/components/bay-view-v2/mechanic-registration-dialog.tsx",
            "src/components/bay-view-v2/pin-settings-dialog.tsx",
          ],
        },
        instructions: [
          "Read src/components/bay-view-v2/mechanic-registration-dialog.tsx for dialog patterns",
          "Read src/components/bay-view-v2/pin-settings-dialog.tsx for settings dialog patterns",
          "Read src/app/[locale]/dashboard/organization/ directory structure for where to add settings",
          "",
          "1. Create src/components/bay-view-v2/device-registration-dialog.tsx:",
          "   - Admin-triggered dialog to register a mechanic's phone",
          "   - Dropdown to select a mechanic (from org members with mechanic role)",
          "   - 'Generate Registration QR' button",
          "   - Shows QR code (via qrcode.toDataURL) on a card",
          "   - Instructions in Mongolian: 'Ask Boldoo to scan this QR with their phone'",
          "   - QR expires after 5 minutes (show countdown)",
          "   - On expiry: auto-generate new QR or allow manual refresh",
          "   - On success (mechanic scanned): show '✓ Boldoo's iPhone registered'",
          "   - Supports device name input: 'Boldoo's iPhone' (optional)",
          "",
          "2. Admin Device Management section:",
          "   - Page/section at /dashboard/organization/devices",
          "   - Table listing: Mechanic name, Device name, Last used, Status",
          "   - Revoke button (with confirmation dialog)",
          "   - Show 'No devices registered' empty state",
          "   - Show registration QR button per mechanic",
          "",
          "3. Cache keys:",
          "   - Add mechanicDevices key to src/lib/cache/keys.ts",
          "",
          "4. i18n: Add keys to both locales:",
          "   deviceRegistration.title, deviceRegistration.selectMechanic,",
          "   deviceRegistration.generateQr, deviceRegistration.instructions,",
          "   deviceRegistration.expiresIn, deviceRegistration.refresh,",
          "   deviceRegistration.success, deviceRegistration.deviceName,",
          "   deviceRegistration.optional, deviceManagement.title,",
          "   deviceManagement.noDevices, deviceManagement.revoke,",
          "   deviceManagement.revokeConfirm, deviceManagement.revoked,",
          "   deviceManagement.lastUsed, deviceManagement.status, deviceManagement.active,",
          "   deviceManagement.revoked_status",
        ],
        outputFormat: "JSON with { files: string[], keysAdded: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          files: { type: "array", items: { type: "string" } },
          keysAdded: { type: "array", items: { type: "string" } },
        },
        required: ["files", "keysAdded"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["admin", "ui", "settings"],
  }),
);

// ── Phase 6: Tests ────────────────────────────────────────────────────────

export const writeTestsTask = defineTask("write-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Write tests for QR clock-in feature",
  agent: {
    name: "general-purpose",
    prompt: {
      role: "QA Engineer",
      task: "Write tests for the QR clock-in feature",
      context: { project: "TOLOM" },
      instructions: [
        "Read src/lib/services/time-tracking-service.test.ts for the existing test patterns",
        "Read src/test/mocks/supabase.ts for mock client patterns",
        "Read src/test/setup-tests.ts for test setup",
        "",
        "Extend src/lib/services/time-tracking-service.test.ts:",
        "- Add test for QR-based clockIn flow",
        "- Add test for QR-based clockOut flow",
        "",
        "Create src/lib/services/qr-token-service.test.ts:",
        "- Test generateClockToken generates valid token",
        "- Test verifyAndClaimClockToken validates correctly",
        "- Test expired token is rejected",
        "- Test claimed token cannot be reused",
        "- Test registerDevice creates device record",
        "- Test getRegisteredDevices returns device list",
        "- Test revokeDevice marks as revoked",
        "",
        "Create src/components/bay-view-v2/device-registration-dialog.test.tsx:",
        "- Test dialog renders with mechanic list",
        "- Test QR generation button works",
        "- Test success state renders",
        "",
        "Use vi.mock for all external dependencies.",
        "Follow the same patterns as existing tests (vi.fn(), makeBuilder helper, etc).",
        "Do NOT test Realtime subscriptions (hard to mock reliably).",
      ],
      outputFormat:
        "JSON with { count: number, testFiles: string[], testNames: string[] }",
    },
    outputSchema: {
      type: "object",
      properties: {
        count: { type: "number" },
        testFiles: { type: "array", items: { type: "string" } },
        testNames: { type: "array", items: { type: "string" } },
      },
      required: ["count", "testFiles"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ["testing"],
}));

// ── Shared: Build / Lint / Test verification ──────────────────────────────

export const verifyBuildTask = defineTask("verify-build", (args, taskCtx) => ({
  kind: "shell",
  title: "Verify npm build passes",
  shell: {
    command: "npm run build 2>&1",
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ["build", "verify"],
}));

export const fixBuildErrorsTask = defineTask(
  "fix-build-errors",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Fix build errors",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Developer",
        task: "Fix build errors from the output",
        context: { errors: args.errors || [] },
        instructions: [
          "Read the build errors carefully",
          "Identify each failing file",
          "Fix type errors, import errors, and syntax errors",
          "Do not change business logic — only fix compilation errors",
          "Run npm run build again to verify fixes",
        ],
        outputFormat: "JSON with { fixes: number, fixedFiles: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          fixes: { type: "number" },
          fixedFiles: { type: "array", items: { type: "string" } },
        },
        required: ["fixes", "fixedFiles"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["fix", "build"],
  }),
);

export const runTestsTask = defineTask("run-tests", (args, taskCtx) => ({
  kind: "shell",
  title: "Run test suite",
  shell: {
    command: "npm run test 2>&1",
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ["test", "verify"],
}));

export const fixTestErrorsTask = defineTask(
  "fix-test-errors",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Fix failing tests",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Developer",
        task: "Fix failing tests",
        context: { errors: args.errors || [] },
        instructions: [
          "Read the test failure output carefully",
          "Identify each failing test",
          "Fix assertions, mocks, and test setup",
          "Do not change implementation — only fix tests",
          "Run npm run test to verify fixes",
        ],
        outputFormat: "JSON with { fixes: number, fixedTests: string[] }",
      },
      outputSchema: {
        type: "object",
        properties: {
          fixes: { type: "number" },
          fixedTests: { type: "array", items: { type: "string" } },
        },
        required: ["fixes", "fixedTests"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ["test", "fix"],
  }),
);

export const runLintTask = defineTask("run-lint", (args, taskCtx) => ({
  kind: "shell",
  title: "Run linter",
  shell: {
    command: "npm run lint 2>&1",
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ["lint", "verify"],
}));
