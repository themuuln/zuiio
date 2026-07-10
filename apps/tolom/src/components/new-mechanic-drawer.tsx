"use client";

import { CheckCircle, Copy, Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";

interface Role {
  id: string;
  name: string;
}

interface CreatedMechanic {
  email: string;
  identifier?: string;
  password: string;
  fullName: string;
}

type NewMechanicSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ── Reducer for form state ────────────────────────────────
interface FormState {
  identifier: string;
  password: string;
  fullName: string;
  selectedRoleId: string;
  sending: boolean;
  errors: Record<string, string>;
  createdMechanic: CreatedMechanic | null;
}

type FormAction =
  | {
      type: "SET_FIELD";
      field: "identifier" | "password" | "fullName";
      value: string;
    }
  | { type: "SET_SELECTED_ROLE"; roleId: string }
  | { type: "SET_SENDING"; sending: boolean }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "CLEAR_ERROR"; field: string }
  | { type: "SET_CREATED"; mechanic: CreatedMechanic | null }
  | { type: "RESET" };

const INITIAL_FORM_STATE: FormState = {
  identifier: "",
  password: "",
  fullName: "",
  selectedRoleId: "",
  sending: false,
  errors: {},
  createdMechanic: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_SELECTED_ROLE":
      return { ...state, selectedRoleId: action.roleId };
    case "SET_SENDING":
      return { ...state, sending: action.sending };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "CLEAR_ERROR":
      return { ...state, errors: { ...state.errors, [action.field]: "" } };
    case "SET_CREATED":
      return { ...state, createdMechanic: action.mechanic };
    case "RESET":
      return { ...INITIAL_FORM_STATE };
    default:
      return state;
  }
}

// ── Success view (sub-component) ──────────────────────────
function MechanicCredentialsView({
  createdMechanic,
  open,
  onOpenChange,
}: {
  createdMechanic: CreatedMechanic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("mechanic");
  const copyCredentials = () => {
    const loginUser = createdMechanic.identifier || createdMechanic.email;
    const text = `${t("credentialUsernameLabel")}: ${loginUser}\n${t("credentialPasswordLabel")}: ${createdMechanic.password}`;
    navigator.clipboard.writeText(text);
    toast.dismiss();
    toast.success(t("credentialsCopied"));
  };

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="2xl">
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="size-4 text-emerald-500" />
          {t("credentialsTitle")}
        </DrawerTitle>
        <DrawerDescription>{t("credentialsDescription")}</DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-1 flex-col gap-6 px-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <Typography.Muted className="text-xs">
                {t("credentialUsernameLabel")}
              </Typography.Muted>
              <Typography.Text className="font-medium">
                {createdMechanic.identifier || createdMechanic.email}
              </Typography.Text>
            </div>
            <div>
              <Typography.Muted className="text-xs">
                {t("credentialPasswordLabel")}
              </Typography.Muted>
              <Typography.Text className="font-mono font-medium">
                {createdMechanic.password}
              </Typography.Text>
            </div>
            {createdMechanic.fullName && (
              <div>
                <Typography.Muted className="text-xs">
                  {t("credentialNameLabel")}
                </Typography.Muted>
                <Typography.Text className="font-medium">
                  {createdMechanic.fullName}
                </Typography.Text>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button type="button" onClick={copyCredentials} className="gap-2">
            <Copy className="size-4" />
            {t("copyCredentials")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("done")}
          </Button>
        </div>
      </div>
    </DetailDrawer>
  );
}

export function NewMechanicSheet({
  open,
  onOpenChange,
}: NewMechanicSheetProps) {
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const t = useTranslations("mechanic");

  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM_STATE);
  // Roles are API data, kept separate from form state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch roles when sheet opens
  useEffect(() => {
    if (!open || !orgId) return;

    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const res = await fetch(`/api/organizations/${orgId}/roles`);
        const body = await res.json();
        const list: Role[] = body.data ?? [];
        setRoles(list);
        // Default to "Mechanic" role, fallback to first role
        const mechanic = list.find(
          (r: Role) => r.name.toLowerCase() === "mechanic",
        );
        dispatch({
          type: "SET_SELECTED_ROLE",
          roleId: mechanic?.id ?? list[0]?.id ?? "",
        });
      } catch {
        toast.error(t("failedToLoadRoles"));
      }
      setRolesLoading(false);
    };

    loadRoles();
  }, [open, orgId, t]);

  // Reset form on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dispatch({ type: "RESET" });
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) {
      newErrors.fullName = t("validation.fullNameRequired");
    }
    if (!form.identifier.trim()) {
      newErrors.identifier = t("validation.identifierRequired");
    }
    if (!form.password) {
      newErrors.password = t("validation.passwordRequired");
    } else if (form.password.length < 8) {
      newErrors.password = t("validation.passwordMinLength");
    }
    if (!form.selectedRoleId) {
      newErrors.roleId = t("validation.roleRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      dispatch({ type: "SET_ERRORS", errors: newErrors });
      return;
    }
    dispatch({ type: "SET_ERRORS", errors: {} });

    if (!orgId) return;

    dispatch({ type: "SET_SENDING", sending: true });
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.identifier.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          roleId: form.selectedRoleId,
        }),
      });
      const body = await res.json();

      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? t("failedToAdd"));
      }

      dispatch({ type: "SET_CREATED", mechanic: body.data });
      toast.dismiss();
      toast.success(t("mechanicAdded"));
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("failedToAdd"));
    }
    dispatch({ type: "SET_SENDING", sending: false });
  };

  // Show success state with credentials
  if (form.createdMechanic) {
    return (
      <MechanicCredentialsView
        createdMechanic={form.createdMechanic}
        open={open}
        onOpenChange={handleOpenChange}
      />
    );
  }

  // Show form
  return (
    <DetailDrawer open={open} onOpenChange={handleOpenChange} size="2xl">
      <DrawerHeader>
        <DrawerTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" />
          {t("formTitle")}
        </DrawerTitle>
        <DrawerDescription>{t("formDescription")}</DrawerDescription>
      </DrawerHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-6 px-4 pb-6"
      >
        <div className="flex flex-col gap-5">
          <Field data-invalid={!!form.errors.fullName}>
            <FieldLabel htmlFor="mechanic-fullname">
              {t("fullNameLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="mechanic-fullname"
                type="text"
                value={form.fullName}
                onChange={(e) => {
                  dispatch({
                    type: "SET_FIELD",
                    field: "fullName",
                    value: e.target.value,
                  });
                  if (form.errors.fullName)
                    dispatch({ type: "CLEAR_ERROR", field: "fullName" });
                }}
                placeholder={t("fullNamePlaceholder")}
              />
              {form.errors.fullName && (
                <FieldError>{form.errors.fullName}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field data-invalid={!!form.errors.identifier}>
            <FieldLabel htmlFor="mechanic-identifier">
              {t("identifierLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="mechanic-identifier"
                type="text"
                value={form.identifier}
                onChange={(e) => {
                  dispatch({
                    type: "SET_FIELD",
                    field: "identifier",
                    value: e.target.value,
                  });
                  if (form.errors.identifier)
                    dispatch({ type: "CLEAR_ERROR", field: "identifier" });
                }}
                placeholder={t("identifierPlaceholder")}
              />
              {form.errors.identifier && (
                <FieldError>{form.errors.identifier}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field data-invalid={!!form.errors.password}>
            <FieldLabel htmlFor="mechanic-password">
              {t("passwordLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                id="mechanic-password"
                type="password"
                value={form.password}
                onChange={(e) => {
                  dispatch({
                    type: "SET_FIELD",
                    field: "password",
                    value: e.target.value,
                  });
                  if (form.errors.password)
                    dispatch({ type: "CLEAR_ERROR", field: "password" });
                }}
                placeholder={t("passwordPlaceholder")}
              />
              {form.errors.password && (
                <FieldError>{form.errors.password}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field data-invalid={!!form.errors.roleId}>
            <FieldLabel htmlFor="mechanic-role">
              {t("roleLabel")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Select
                value={form.selectedRoleId}
                onValueChange={() => {}}
                disabled
              >
                <SelectTrigger id="mechanic-role" className="w-full">
                  <SelectValue
                    placeholder={
                      rolesLoading
                        ? t("loading")
                        : roles.length === 0
                          ? t("noRolesAvailable")
                          : undefined
                    }
                  >
                    {form.selectedRoleId
                      ? roles.find((r) => r.id === form.selectedRoleId)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.errors.roleId && (
                <FieldError>{form.errors.roleId}</FieldError>
              )}
            </FieldContent>
          </Field>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button type="submit" disabled={form.sending}>
            {form.sending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 size-4" />
            )}
            {t("formTitle")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </DetailDrawer>
  );
}
