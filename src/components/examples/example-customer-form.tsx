/**
 * Example: Customer creation form using React Hook Form + Zod + shadcn.
 *
 * This is a reference pattern — copy and adapt for each form in TOLOM.
 * Demonstrates:
 * - Zod schema with Mongolian-specific validators
 * - react-hook-form with zodResolver
 * - shadcn Field components for layout + error display
 * - Server action integration with error mapping
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { inputProps } from "@/lib/form-ux";
import {
  isValidMongolianPhone,
  normalizeMongolianPhone,
} from "@/lib/form-validation";

// ── Schema ───────────────────────────────────────────────────

const customerSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .refine(
      (val) => isValidMongolianPhone(val),
      "Enter a valid Mongolian phone number (8 digits)",
    ),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  company_name: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// ── Component ────────────────────────────────────────────────

export function ExampleCustomerForm() {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      company_name: "",
      address: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // Normalize phone before sending to server
    const normalized = {
      ...data,
      phone: normalizeMongolianPhone(data.phone),
    };

    // Call your server action here
    // const result = await createCustomer(normalized);
    console.log("Submit:", normalized);
  });

  return (
    <form onSubmit={onSubmit} className="max-w-md">
      <FieldGroup>
        {/* Full Name — required */}
        <Field data-invalid={!!form.formState.errors.full_name}>
          <FieldLabel>Full Name</FieldLabel>
          <FieldContent>
            <Input
              placeholder="Бат-Эрдэнэ"
              aria-invalid={!!form.formState.errors.full_name}
              {...form.register("full_name")}
            />
            <FieldDescription>
              Customer's legal or business name
            </FieldDescription>
            {form.formState.errors.full_name && (
              <FieldError>{form.formState.errors.full_name.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Phone — required, Mongolian format */}
        <Field data-invalid={!!form.formState.errors.phone}>
          <FieldLabel>Phone</FieldLabel>
          <FieldContent>
            <Input
              placeholder="99112233"
              aria-invalid={!!form.formState.errors.phone}
              {...inputProps("phone")}
              {...form.register("phone")}
            />
            <FieldDescription>8-digit Mongolian number</FieldDescription>
            {form.formState.errors.phone && (
              <FieldError>{form.formState.errors.phone.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Email — optional */}
        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel>Email</FieldLabel>
          <FieldContent>
            <Input
              placeholder="optional@example.com"
              aria-invalid={!!form.formState.errors.email}
              {...inputProps("email")}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <FieldError>{form.formState.errors.email.message}</FieldError>
            )}
          </FieldContent>
        </Field>

        {/* Company — optional */}
        <Field>
          <FieldLabel>Company</FieldLabel>
          <FieldContent>
            <Input
              placeholder="Optional company name"
              {...inputProps("companyName")}
              {...form.register("company_name")}
            />
          </FieldContent>
        </Field>

        {/* Address — optional */}
        <Field>
          <FieldLabel>Address</FieldLabel>
          <FieldContent>
            <Input
              placeholder="Optional address"
              {...inputProps("address")}
              {...form.register("address")}
            />
          </FieldContent>
        </Field>

        {/* Submit */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Create Customer"}
        </Button>
      </FieldGroup>
    </form>
  );
}
