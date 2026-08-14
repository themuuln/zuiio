"use client";

import { Envelope, Trash, UserPlus, Users } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { assignUserBranch } from "@/app/(dashboard)/settings/branches/actions";
import { updateUserRole } from "@/app/(dashboard)/settings/roles/actions";
import {
  inviteMember,
  removeMember,
} from "@/app/(dashboard)/settings/users/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

interface Member {
  id: string;
  full_name: string | null;
  role: string | null;
  role_id: string | null;
  branch_id: string | null;
  email: string;
}

interface Role {
  id: string;
  name: string;
  is_system_role: boolean;
}

interface BranchOption {
  id: string;
  name: string;
}

interface MembersClientProps {
  members: Member[];
  roles: Role[];
  branches: BranchOption[];
  currentUserId: string;
  canManageRole: boolean;
  canManageBranches: boolean;
  canInvite: boolean;
  canRemove: boolean;
}

export function MembersClient({
  members,
  roles,
  branches,
  currentUserId,
  canManageRole,
  canManageBranches,
  canInvite,
  canRemove,
}: MembersClientProps) {
  const [changing, setChanging] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePending, setInvitePending] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const handleRoleChange = async (profileId: string, roleId: string | null) => {
    setChanging(profileId);
    const result = await updateUserRole(profileId, roleId);
    setChanging(null);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleBranchChange = async (
    profileId: string,
    branchId: string | null,
  ) => {
    setChanging(profileId);
    const result = await assignUserBranch(profileId, branchId);
    setChanging(null);
    if (result && "error" in result) {
      toast.error(result.error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setInvitePending(true);
    const formData = new FormData();
    formData.append("email", inviteEmail.trim());
    const result = await inviteMember(formData);
    setInvitePending(false);

    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Урилга амжилттай илгээгдлээ.");
      setInviteOpen(false);
      setInviteEmail("");
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;

    const formData = new FormData();
    formData.append("profile_id", removeTarget.id);
    const result = await removeMember(formData);

    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Гишүүнийг хассан.");
      setRemoveTarget(null);
    }
  };

  return (
    <>
      {/* Invite dialog */}
      {canInvite && (
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger>
            <div className="flex items-center justify-between px-6 py-4">
              <div />
              <Button>
                <UserPlus className="size-4" />
                Гишүүн урих
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Гишүүн урих</DialogTitle>
              <DialogDescription>
                Урих хэрэглэгчийн и-мэйл хаягийг оруулна уу. Урилгатай и-мэйл
                илгээгдэх болно.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !invitePending) {
                    handleInvite();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Болих
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || invitePending}
              >
                {invitePending ? "Илгээж байна..." : "Урих"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Users className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Гишүүд олдсонгүй
          </p>
          <p className="text-xs text-muted-foreground/60">
            Энэ байгууллагад хэрэглэгч бүртгэгдээгүй байна.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {members.map((member) => {
            const roleName =
              roles.find((r) => r.id === member.role_id)?.name ?? member.role;

            return (
              <div
                key={member.id}
                className={`flex items-center justify-between px-6 py-4 ${
                  member.id === currentUserId ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {member.full_name?.charAt(0)?.toUpperCase() ?? (
                      <Envelope className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {member.full_name ?? "Нэргүй"}
                      </span>
                      {member.id === currentUserId && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] leading-relaxed"
                        >
                          Та
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {member.email || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canManageRole && member.id !== currentUserId ? (
                    <NativeSelect
                      value={member.role_id ?? ""}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value || null)
                      }
                      disabled={changing === member.id}
                      className="w-36"
                    >
                      <option value="">Үүрэг сонгох</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : (
                    <Badge variant="outline">{roleName ?? "Гишүүн"}</Badge>
                  )}

                  {/* Branch assignment */}
                  {canManageBranches && member.id !== currentUserId && (
                    <NativeSelect
                      value={member.branch_id ?? ""}
                      onChange={(e) =>
                        handleBranchChange(member.id, e.target.value || null)
                      }
                      disabled={changing === member.id}
                      className="w-40"
                    >
                      <option value="">Бүх салбар</option>
                      {branches.map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.name}
                        </option>
                      ))}
                    </NativeSelect>
                  )}

                  {canRemove && member.id !== currentUserId && (
                    <AlertDialog
                      open={removeTarget?.id === member.id}
                      onOpenChange={(open) => {
                        if (!open) setRemoveTarget(null);
                      }}
                    >
                      <AlertDialogTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveTarget(member)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Гишүүн хасах</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              Та{" "}
                              <strong>
                                {member.full_name ?? member.email}
                              </strong>
                              -г байгууллагаас хасах гэж байна.
                            </p>
                            <p>
                              Энэ хэрэглэгч байгууллагын бүх өгөгдөлд хандах
                              боломжгүй болно. Энэ үйлдлийг буцаах боломжгүй.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Буцах</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRemove}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Хасах
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
