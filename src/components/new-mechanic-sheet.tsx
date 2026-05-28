"use client";

import { Loader2, MailPlus, UserPlus } from "lucide-react";
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

interface Role {
  id: string;
  name: string;
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolesLoading, setRolesLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
      setSelectedRoleId("");
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !orgId || !selectedRoleId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          roleId: selectedRoleId,
        }),
      });
      const body = await res.json();

      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to send invite");
      }

      toast.success("Mechanic invited successfully");
      handleOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite mechanic",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" />
            Add Mechanic
          </SheetTitle>
          <SheetDescription>
            Invite a mechanic to your organization. They&apos;ll receive an
            email with instructions to join.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-6 px-4"
        >
          <div className="flex flex-col gap-5">
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
              disabled={sending || !email.trim() || !selectedRoleId}
            >
              {sending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <MailPlus className="mr-2 size-4" />
              )}
              Send Invite
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
