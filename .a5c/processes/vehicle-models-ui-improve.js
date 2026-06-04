/**
 * @process vehicle-models-ui-improve
 * @description Improve vehicle-models page: extract form to DetailSheet, polish tree view, add delete dialog
 * @skill frontend-design specializations/ux-ui-design/skills/frontend-design/SKILL.md
 * @agent workflow-worker
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ── Phase 1: Create the vehicle model form sheet component ──

const createFormSheet = defineTask("create-form-sheet", (_args, taskCtx) => ({
  kind: "agent",
  title: "Create vehicle model form DetailSheet component",
  agent: {
    name: "workflow-worker",
    prompt: {
      role: "Frontend engineer",
      task: `Create a new file at src/app/[locale]/dashboard/vehicle-models/_vehicle-model-form-sheet.tsx

This component wraps the add/edit form for vehicle models in a DetailSheet (right-side slide-over panel).

Requirements:
1. Use the DetailSheet compound component from @/components/ui/detail-sheet with size="xl"
2. Use Field/FieldGroup/FieldLabel/FieldContent from @/components/ui/field for form layout
3. Use Input from @/components/ui/input and Select from @/components/ui/select (NOT native <select>)
4. Accept props: { mode: 'add' | 'edit', item?: VehicleModelItem | null, open: boolean, onOpenChange: (open: boolean) => void, orgId: string }
5. When mode='edit', pre-fill form from item prop (use prevItem pattern like _edit-service-sheet.tsx)
6. When mode='add', show empty form
7. Fields: make (required), model (required), generation, year_start, year_end, engine, body_type
8. Use Select component (not native <select>) for body_type with these options: sedan, suv, hatchback, coupe, wagon, pickup, van, minivan, convertible, crossover
9. Include optimistic mutations (add and update) using useMutation from @tanstack/react-query
10. Use vehicleModelKeys from @/lib/queries/keys for query invalidation
11. Use useCurrentOrg from @/lib/queries/use-organization for orgId
12. Use useTranslations("vehicleModels") and useTranslations("common") for i18n
13. Show toast on success (toast from sonner)
14. Footer with Cancel + Save buttons, loading spinner on save
15. Call onOpenChange(false) on successful save
16. Form fields layout: required fields (make, model) on one row, then an expandable "Add details" section (like the current page) for optional fields (generation, year_start, year_end, engine, body_type)
17. Use Button from @/components/ui/button
18. Use Loader2 from lucide-react for loading spinner

Reference the existing _edit-service-sheet.tsx pattern for the mutation and state reset approach.
Reference the existing vehicle-models/page.tsx for the VehicleModelItem type and bodyTypeOptions.

IMPORTANT: Actually create the file with complete, working code. Do not plan — implement.`,
      context: {
        projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
      },
      instructions: [
        "Read the existing _edit-service-sheet.tsx for pattern reference",
        "Read the existing vehicle-models/page.tsx for types and constants",
        "Create the new component file",
      ],
      outputFormat: "JSON",
    },
    outputSchema: {
      type: "object",
      required: ["result"],
      properties: { result: { type: "string" } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ── Phase 2: Refactor the page to use the sheet + improve tree view ──

const refactorPage = defineTask("refactor-page", (_args, taskCtx) => ({
  kind: "agent",
  title: "Refactor vehicle-models page to use DetailSheet and improve design",
  agent: {
    name: "workflow-worker",
    prompt: {
      role: "Frontend engineer",
      task: `Refactor src/app/[locale]/dashboard/vehicle-models/page.tsx to:

1. REPLACE the inline Card add/edit form with the new _vehicle-model-form-sheet component
   - Remove all inline form state (editForm, showDetails, resetForm)
   - Remove the add/edit form Card section entirely
   - Add state: formMode ('add' | 'edit'), formItem (VehicleModelItem | null), formOpen (boolean)
   - "Add" button opens sheet with mode='add'
   - "Edit" button on variant rows opens sheet with mode='edit' + the variant data

2. ADD AlertDialog for delete confirmation
   - Import AlertDialog components from @/components/ui/alert-dialog
   - State: deleteItem (VehicleModelItem | null)
   - Clicking delete on a variant sets deleteItem, opens the dialog
   - Dialog shows "Delete variant" title, confirmation text with the variant name
   - Confirm button calls deleteMutation.mutate(item.id)
   - Cancel button clears deleteItem

3. IMPROVE the tree view design:
   - Make rows more visually polished with better spacing and hover effects
   - Add subtle left border accent on make headers when expanded
   - Variant rows should show more info in a cleaner layout: show model as primary text, generation/engine/body_type/years as secondary metadata below
   - Add a small edit icon and delete icon (Pencil, Trash2 from lucide-react) that appear on hover
   - Use proper Badge components for body_type display
   - Keep the tree expand/collapse pattern but improve visual hierarchy

4. REMOVE the inline form code (editForm state, showDetails state, resetForm function, the entire Card section)

5. Keep all existing functionality: search, export, tree view, optimistic mutations

6. Follow TOLOM style rules: use gap- not space-y-, use semantic color tokens, use Badge for status labels

IMPORTANT: Actually write the complete refactored file. Do not plan — implement.`,
      context: {
        projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
      },
      instructions: [
        "Read the current page.tsx completely",
        "Read the new _vehicle-model-form-sheet.tsx",
        "Read the services page for AlertDialog pattern reference",
        "Rewrite the page.tsx with all improvements",
      ],
      outputFormat: "JSON",
    },
    outputSchema: {
      type: "object",
      required: ["result"],
      properties: { result: { type: "string" } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ── Phase 3: Add missing i18n keys ──

const addI18nKeys = defineTask("add-i18n-keys", (_args, taskCtx) => ({
  kind: "agent",
  title: "Add missing i18n keys for vehicle-models",
  agent: {
    name: "workflow-worker",
    prompt: {
      role: "Frontend engineer",
      task: `Add missing i18n keys to both src/messages/en.json and src/messages/mn.json under the "vehicleModels" section.

New keys needed:
- "deleteConfirmation": "Are you sure you want to delete this variant?" / "Энэ хувилбарыг устгахдаа итгэлтэй байна уу?"
- "deleteTitle": "Delete variant" / "Хувилбар устгах"
- "addVariant": "Add Variant" / "Хувилбар нэмэх"
- "details": "Details" / "Дэлгэрэнгүй"
- "years": "Years" / "Онууд"
- "noVariants": "No variants" / "Хувилбар байхгүй"

IMPORTANT: 
1. Read both en.json and mn.json first to find the exact location of the vehicleModels section
2. Add the new keys at the end of the vehicleModels object in both files
3. Keep existing keys unchanged
4. Actually write the files — do not plan`,
      context: {
        projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
      },
      instructions: [
        "Read both locale files to find vehicleModels section",
        "Add new keys at the end of the vehicleModels object",
      ],
      outputFormat: "JSON",
    },
    outputSchema: {
      type: "object",
      required: ["result"],
      properties: { result: { type: "string" } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ── Phase 4: Verify build ──

const verifyBuild = defineTask("verify-build", (_args, taskCtx) => ({
  kind: "shell",
  title: "Run type check and lint to verify changes compile",
  shell: {
    command:
      "cd /Users/themuuln/coding/personal/tolom/tolom && npm run validate",
    timeout: 120,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ── Phase 5: Fix any build errors ──

const fixBuildErrors = defineTask("fix-build-errors", (_args, taskCtx) => ({
  kind: "agent",
  title: "Fix any type errors or lint issues",
  agent: {
    name: "workflow-worker",
    prompt: {
      role: "Frontend engineer",
      task: `Read the build output from the previous verification step. If there are any TypeScript errors or Biome lint issues in the vehicle-models files or related locale files, fix them.

1. Read the build output to identify errors
2. Fix each error in the relevant source files
3. Re-run npm run validate to confirm all errors are resolved

IMPORTANT: Actually fix the errors by editing the source files. Do not just describe what needs to change.`,
      context: {
        projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
      },
      instructions: [
        "Read the build verification output",
        "Fix any errors found",
        "Re-run validation",
      ],
      outputFormat: "JSON",
    },
    outputSchema: {
      type: "object",
      required: ["result"],
      properties: { result: { type: "string" } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ── Process Definition ──

export async function process(_inputs, ctx) {
  // Phase 1: Create form sheet
  await ctx.task(createFormSheet, {
    projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
  });

  // Phase 2: Refactor page
  await ctx.task(refactorPage, {
    projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
  });

  // Phase 3: Add i18n keys
  await ctx.task(addI18nKeys, {
    projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
  });

  // Phase 4: Verify build
  const buildResult = await ctx.task(verifyBuild, {
    projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
  });

  // Phase 5: Fix errors if any
  if (buildResult && buildResult.hasErrors) {
    await ctx.task(fixBuildErrors, {
      projectPath: "/Users/themuuln/coding/personal/tolom/tolom",
    });
  }

  return { success: true, message: "Vehicle models UI improved successfully" };
}
