"use client";

import { CheckCircle, Copy, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { Typography } from "@/components/ui/typography";

interface Role {
  id: string;
  name: string;
}

interface CreatedMechanic {
  email: string;
  password: string;
  fullName: string;
}

type NewMechanicSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewMechanicSheet({
  open,
  onOpenChange,
}: NewMechanicSheetProps) {
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolesLoading, setRolesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [createdMechanic, setCreatedMechanic] =
    useState<CreatedMechanic | null>(null);

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
        setSelectedRoleId(mechanic?.id ?? list[0]?.id ?? "");
      } catch {
        toast.error("Failed to load roles");
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
  }, [open, orgId]);

  // Reset form on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setPassword("");
      setFullName("");
      setCreatedMechanic(null);
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !orgId || !selectedRoleId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          roleId: selectedRoleId,
        }),
      });
      const body = await res.json();

      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to add mechanic");
      }

      setCreatedMechanic(body.data);
      toast.success("Mechanic added successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add mechanic",
      );
    } finally {
      setSending(false);
    }
  };

  const copyCredentials = () => {
    if (!createdMechanic) return;
    const text = `Email: ${createdMechanic.email}\nPassword: ${createdMechanic.password}`;
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard");
  };

  // Show success state with credentials
  if (createdMechanic) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="size-4 text-emerald-500" />
              Mechanic Added
            </SheetTitle>
            <SheetDescription>
              Share these credentials with the mechanic. They can log in
              immediately.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 px-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <Typography.Muted className="text-xs">Email</Typography.Muted>
                  <Typography.Text className="font-medium">
                    {createdMechanic.email}
                  </Typography.Text>
                </div>
                <div>
                  <Typography.Muted className="text-xs">
                    Password
                  </Typography.Muted>
                  <Typography.Text className="font-mono font-medium">
                    {createdMechanic.password}
                  </Typography.Text>
                </div>
                {createdMechanic.fullName && (
                  <div>
                    <Typography.Muted className="text-xs">
                      Name
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
                Copy Credentials
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Show form
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" />
            Add Mechanic
          </SheetTitle>
          <SheetDescription>
            Create an account for a new mechanic. They&apos;ll receive their
            credentials to log in.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-6 px-4"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mechanic-fullname">Full Name</Label>
              <Input
                id="mechanic-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mechanic-email">Email address</Label>
              <Input
                id="mechanic-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mechanic@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mechanic-password">Password</Label>
              <Input
                id="mechanic-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mechanic-role">Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={(value) => value && setSelectedRoleId(value)}
                disabled={rolesLoading || roles.length === 0}
              >
                <SelectTrigger id="mechanic-role" className="w-full">
                  <SelectValue
                    placeholder={
                      rolesLoading
                        ? "Loading..."
                        : roles.length === 0
                          ? "No roles available"
                          : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              disabled={
                sending || !email.trim() || !password || !selectedRoleId
              }
            >
              {sending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 size-4" />
              )}
              Add Mechanic
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
