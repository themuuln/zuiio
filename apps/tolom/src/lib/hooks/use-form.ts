/**
 * React Hook Form + Zod + shadcn/ui integration.
 *
 * Usage:
 *   const form = useForm({ resolver: zodResolver(schema), defaultValues: ... });
 *   <Field>
 *     <FieldLabel>Name</FieldLabel>
 *     <Input {...form.register("name")} />
 *     <FieldError />
 *   </Field>
 */

import { zodResolver } from "@hookform/resolvers/zod";
import type {
  FieldError,
  FieldErrors,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { useForm as useRHFForm } from "react-hook-form";

export { zodResolver };

// ── Re-exports ───────────────────────────────────────────────

export type { FieldError, FieldErrors, UseFormProps, UseFormReturn };
export { useRHFForm as useForm };
