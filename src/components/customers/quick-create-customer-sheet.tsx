"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCustomer } from "@/lib/queries/use-wizard-data";
import type { Customer } from "@/lib/types";

function formatPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

type QuickCreateCustomerSheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the newly created customer after successful creation */
  onCreated?: (customer: Customer) => void;
  orgId: string;
};

export function QuickCreateCustomerSheet({
  open,
  onOpenChange,
  onCreated,
  orgId,
}: QuickCreateCustomerSheetProps) {
  const createCustomerMutation = useCreateCustomer(orgId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const lastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 8;
  const canSubmit =
    !createCustomerMutation.isPending && firstName.trim() && phoneValid;

  const reset = useCallback(() => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setCompany("");
    setEmail("");
    setNotes("");
    setError(null);
    setConflict(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setConflict(false);

    try {
      const customer = await createCustomerMutation.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onCreated?.(customer);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create customer";
      const code = (err as { code?: string }).code;
      setConflict(code === "CUSTOMER_EXISTS");
      setError(message);
    }
  }, [
    canSubmit,
    createCustomerMutation,
    firstName,
    lastName,
    phone,
    onCreated,
    reset,
    onOpenChange,
  ]);

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New customer</SheetTitle>
        </SheetHeader>

        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                First name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Bat"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11"
                autoFocus
                autoComplete="given-name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lastNameRef.current?.focus();
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Last name
              </label>
              <Input
                ref={lastNameRef}
                placeholder="e.g. Erdene"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11"
                autoComplete="family-name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    phoneRef.current?.focus();
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Phone <span className="text-destructive">*</span>
            </label>
            <Input
              ref={phoneRef}
              placeholder="e.g. 99112233"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="h-11"
              inputMode="tel"
              autoComplete="tel"
              type="tel"
            />
            {!phoneValid && phoneDigits.length > 0 && (
              <p className="mt-1 text-xs text-destructive">Must be 8 digits</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Company
              </label>
              <Input
                placeholder="Optional"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-11"
                autoComplete="organization"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Email
              </label>
              <Input
                placeholder="Optional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                inputMode="email"
                autoComplete="email"
                type="email"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Notes
            </label>
            <Textarea
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {conflict ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>{error}</span>
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createCustomerMutation.isPending
                ? "Creating..."
                : "Create customer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
