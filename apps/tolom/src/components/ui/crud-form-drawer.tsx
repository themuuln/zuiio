/**
 * 📦 CrudFormDrawer — standardized form drawer for create/edit flows.
 *
 * Replaces the ~100-line per-module `*FormDialog` components with a single
 * wrapper that handles: DetailDrawer shell, useForm + zodResolver, submit
 * handler with try/catch, and Cancel + Submit buttons.
 *
 * The `children` render prop receives the react-hook-form instance
 * so callers can render custom fields.
 *
 * @example
 * <CrudFormDrawer
 *   open={open}
 *   onOpenChange={setOpen}
 *   mode={editingLabel ? "edit" : "create"}
 *   title={{ create: "Add Label", edit: "Edit Label" }}
 *   formId="label-form"
 *   schema={diagnosisLabelSchema}
 *   defaultValues={editingLabel ? mapToForm(editingLabel) : emptyDefaults}
 *   onSubmit={async (data) => {
 *     if (editingLabel) {
 *       await update.mutateAsync({ id: editingLabel.id, body: toUpdateBody(data) });
 *     } else {
 *       await create.mutateAsync(toCreateBody(data));
 *     }
 *   }}
 *   isPending={create.isPending || update.isPending}
 * >
 *   {(form) => (
 *     <FieldGroup>
 *       <Field>
 *         <FieldLabel>Name *</FieldLabel>
 *         <FieldContent>
 *           <Input {...form.register("name")} />
 *           {form.formState.errors.name && (
 *             <FieldError>{form.formState.errors.name.message}</FieldError>
 *           )}
 *         </FieldContent>
 *       </Field>
 *     </FieldGroup>
 *   )}
 * </CrudFormDrawer>
 */

"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect } from "react";
import type { Resolver, UseFormReturn } from "react-hook-form";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { reportServerError } from "@/lib/sentry-report-server";

// ── Props ──────────────────────────────────────────────────────

type CrudFormDrawerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

interface CrudFormDrawerProps<T extends Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: { create: string; edit: string };
  formId: string;
  schema: ZodType<T>;
  defaultValues: T;
  /** Called on valid submit. The component wraps this in try/catch and handles toasts. */
  onSubmit: (data: T) => Promise<void>;
  /** Mutation pending state — disables the submit button and shows spinner. */
  isPending?: boolean;
  size?: CrudFormDrawerSize;
  /** Cancel button label (default: "Cancel"). */
  cancelLabel?: string;
  /** Submit button labels. */
  submitLabel?: { create: string; edit: string };
  /** Extra class on the form element. */
  formClassName?: string;
  /** Render prop — receives the react-hook-form instance. */
  children: (form: UseFormReturn<T>) => ReactNode;
}

// ── Component ──────────────────────────────────────────────────

export function CrudFormDrawer<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  mode,
  title,
  formId,
  schema,
  defaultValues,
  onSubmit,
  isPending = false,
  size = "md",
  cancelLabel = "Cancel",
  submitLabel = { create: "Create", edit: "Save" },
  formClassName,
  children,
}: CrudFormDrawerProps<T>) {
  // zodResolver with Zod v4 + generic T requires casts — the runtime types are correct
  const resolver = zodResolver(
    schema as unknown as Parameters<typeof zodResolver>[0],
  ) as unknown as Resolver<T>;

  // UseFormReturn generic mismatch with T extends Record<string, unknown> — cast at call site.
  // The form is always initialized with the correct T via defaultValues + schema.
  const rawForm = useForm<Record<string, unknown>>({
    resolver: resolver as Resolver<Record<string, unknown>>,
    defaultValues: defaultValues as Record<string, unknown>,
  });
  const form = rawForm as unknown as UseFormReturn<T>;

  // Reset form when defaultValues change (e.g. switching between create/edit)
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = useCallback(
    form.handleSubmit(async (data) => {
      try {
        await onSubmit(data);
        onOpenChange(false);
      } catch (err) {
        reportServerError("CrudFormDrawer submit failed", err);
        // Error handling is done by the caller's mutateAsync + toast pattern
        // or by the useOrgMutation hook's built-in error toasts.
      }
    }),
    [],
  );

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size={size}>
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          {mode === "edit" ? title.edit : title.create}
        </DetailDrawer.Title>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <form
          id={formId}
          onSubmit={handleSubmit}
          className={["flex flex-col gap-4", formClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {children(form)}
        </form>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions justify="end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            disabled={isPending || form.formState.isSubmitting}
          >
            {(isPending || form.formState.isSubmitting) && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {mode === "edit" ? submitLabel.edit : submitLabel.create}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
