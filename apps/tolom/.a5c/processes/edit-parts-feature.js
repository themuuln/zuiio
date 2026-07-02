/**
 * @process feature/edit-parts-catalog
 * @description Add edit functionality for parts_catalog — mutation hook, edit button on table rows, PartForm update mode.
 * @skill react-query specializations/web-development/skills/react-query/SKILL.md
 * @skill shadcn specializations/web-development/skills/shadcn/SKILL.md
 * @skill react-development specializations/web-development/skills/react-development/SKILL.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function process(inputs, ctx) {
  const { orgId } = inputs;
  const startTime = ctx.now();

  ctx.log("info", `Starting edit parts feature for org: ${orgId}`);

  // Phase 1: Create useUpdatePart mutation hook
  ctx.log("info", "Phase 1: Creating useUpdatePart mutation hook");
  const mutationHook = await ctx.task(createMutationHookTask, { orgId });
  ctx.log("info", `Mutation hook created: ${mutationHook.hookName}`);

  // Phase 2: Add edit button to parts table
  ctx.log("info", "Phase 2: Adding edit button to parts table rows");
  const editUI = await ctx.task(addEditButtonTask, { orgId });
  ctx.log("info", `Edit button added: ${editUI.componentChanged}`);

  // Phase 3: Wire PartForm to support edit/update mode
  ctx.log("info", "Phase 3: Wiring PartForm for update mode");
  const partFormUpdate = await ctx.task(wirePartFormUpdateTask, { orgId });
  ctx.log("info", `PartForm update mode added`);

  // Quality gate: verify build
  ctx.log("info", "Quality gate: verifying build");
  const buildCheck = await ctx.task(verifyBuildTask, {});
  ctx.log("info", `Build check: ${buildCheck.passes ? "PASSED" : "FAILED"}`);

  if (!buildCheck.passes) {
    const fixBuild = await ctx.task(fixBuildErrorsTask, {
      errors: buildCheck.errors,
    });
    ctx.log("info", `Build fixes applied: ${fixBuild.fixes}`);
  }

  return {
    success: true,
    summary: {
      mutationHookCreated: true,
      editButtonAdded: true,
      partFormUpdateWired: true,
      buildPasses: buildCheck.passes,
    },
    duration: ctx.now() - startTime,
    metadata: {
      processId: "feature/edit-parts-catalog",
      timestamp: startTime,
    },
  };
}

// Phase 1: Create useUpdatePart hook
export const createMutationHookTask = defineTask(
  "create-update-part-hook",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Create useUpdatePart mutation hook",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Create a useUpdatePart React Query mutation hook in src/lib/queries/use-inventory.ts",
        context: {
          project: "TOLOM - auto repair SaaS Next.js app",
          orgId: args.orgId,
        },
        instructions: [
          "Read src/lib/queries/use-inventory.ts to understand existing patterns",
          "Read src/lib/queries/keys.ts to understand query key patterns",
          "Read src/lib/types/inventory.ts:43-53 for UpdatePartParams type",
          "Read src/lib/services/inventory-service.ts:199-221 for updatePart service",
          "Create a useUpdatePart mutation hook following the exact pattern of useUpdateSupplier",
          "The hook should call PATCH /api/organizations/${orgId}/inventory/parts/${partId}",
          "Invalidate partsCatalog and inventoryBalances query keys on success",
          "Include onMutate for optimistic update (cancel queries, snapshot, setQueryData)",
          "Include onError rollback using the snapshot context",
          "Export a selector hook for granular re-renders if needed",
          "Return the hook function and the mutation object",
        ],
        outputFormat: "JSON",
      },
      outputSchema: {
        type: "object",
        required: ["hookName", "code", "filePath"],
        properties: {
          hookName: { type: "string" },
          code: { type: "string" },
          filePath: { type: "string" },
          changes: { type: "array" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["feature", "react-query", "parts", "mutation"],
  }),
);

// Phase 2: Add edit button to parts table
export const addEditButtonTask = defineTask(
  "add-edit-button-parts-table",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Add edit button to parts table rows",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Add edit button/icon to each row in the parts catalog table",
        context: {
          project: "TOLOM - auto repair SaaS Next.js app",
          orgId: args.orgId,
        },
        instructions: [
          "Read src/app/[locale]/dashboard/inventory/_components/parts-tab.tsx fully",
          "Read src/components/inventory/part-form.tsx fully",
          "Read src/components/inventory/new-parts-car-sheet.tsx for sheet/modal patterns",
          "Read src/app/[locale]/dashboard/inventory/_components/suppliers-tab.tsx for the existing edit pattern reference (suppliers have an edit flow)",
          "Add a Pencil/Edit icon button on each parts table row (use the existing Pencil icon from lucide-react already imported)",
          "Add state: editingPart (or similar) to track which part is being edited",
          "Open the existing PartForm component in a modal/sheet when edit is clicked",
          "Pass the selected part data to PartForm as initialData/props",
          "Do NOT break the existing showAddPart flow for creating new parts",
        ],
        outputFormat: "JSON",
      },
      outputSchema: {
        type: "object",
        required: ["componentChanged", "code", "filePath"],
        properties: {
          componentChanged: { type: "string" },
          code: { type: "string" },
          filePath: { type: "string" },
          changes: { type: "array" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["feature", "ui", "parts", "table"],
  }),
);

// Phase 3: Wire PartForm for update mode
export const wirePartFormUpdateTask = defineTask(
  "wire-partform-update-mode",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Wire PartForm to support update mode",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Wire PartForm component to support both create and update modes",
        context: {
          project: "TOLOM - auto repair SaaS Next.js app",
          orgId: args.orgId,
        },
        instructions: [
          "Read and fully understand src/components/inventory/part-form.tsx",
          "Read src/app/[locale]/dashboard/inventory/_components/parts-tab.tsx (which uses PartForm)",
          "The PartForm currently only creates (always calls useCreatePart)",
          "Add an onUpdate prop or mode prop to PartForm that switches between create and update",
          "When in update mode: call the newly created useUpdatePart hook on submit instead of useCreatePart",
          "Pre-fill the form fields from initialData prop (already supported in the component)",
          "After successful update: close the modal and refetch the parts list",
          "Keep all existing create behavior unchanged",
          "Follow the same pattern used in suppliers-tab.tsx for switching between create/edit",
        ],
        outputFormat: "JSON",
      },
      outputSchema: {
        type: "object",
        required: ["changes", "filePaths"],
        properties: {
          changes: { type: "array" },
          filePaths: { type: "array" },
          summary: { type: "string" },
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["feature", "form", "parts", "mode"],
  }),
);

// Quality gate: verify build
export const verifyBuildTask = defineTask("verify-build", (_args, taskCtx) => ({
  kind: "shell",
  title: "Verify TypeScript compilation",
  command: "npx tsc --noEmit 2>&1",
  cwd: "/Users/themuuln/coding/personal/tolom/tolom",
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ["quality", "typescript", "build"],
}));

// Fix build errors if any
export const fixBuildErrorsTask = defineTask(
  "fix-build-errors",
  (args, taskCtx) => ({
    kind: "agent",
    title: "Fix TypeScript build errors",
    agent: {
      name: "general-purpose",
      prompt: {
        role: "Frontend Developer",
        task: "Fix TypeScript build errors from the build verification",
        context: { errors: args.errors },
        instructions: [
          "Analyze each TypeScript error from the build output",
          "Fix the root cause of each error in the relevant files",
          "Do not use any/* workarounds",
          "Verify each fix by re-running npx tsc --noEmit",
        ],
        outputFormat: "JSON",
      },
      outputSchema: {
        type: "object",
        required: ["fixes", "passes"],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ["quality", "typescript", "fix"],
  }),
);
