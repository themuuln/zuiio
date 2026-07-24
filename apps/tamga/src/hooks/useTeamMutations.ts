import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TeamRole } from "./useTeams";

// ── Create Team ──────────────────────────────────────────────────

interface CreateTeamInput {
  name: string;
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }: CreateTeamInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Нэвтрээгүй байна");

      // Create the team
      const { data: team, error: teamErr } = await supabase
        .from("teams")
        .insert({ name, owner_user_id: user.id })
        .select()
        .single();

      if (teamErr) throw teamErr;

      // Add owner as first member
      const { error: memberErr } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "owner" });

      if (memberErr) throw memberErr;

      // Log activity
      await supabase.from("team_activity_log").insert({
        team_id: team.id,
        user_id: user.id,
        action: "team_created",
        details: { team_name: name },
      });

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

// ── Invite Member ────────────────────────────────────────────────

interface InviteMemberInput {
  teamId: string;
  contact: string; // phone or email
  role: TeamRole;
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, contact, role }: InviteMemberInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Нэвтрээгүй байна");

      // Resolve contact to user UUID via RPC
      const { data: invitedUserId, error: rpcErr } = await supabase.rpc(
        "lookup_user_by_contact",
        { contact },
      );

      if (rpcErr) throw rpcErr;
      if (!invitedUserId) {
        throw new Error("Хэрэглэгч олдсонгүй. Утас эсвэл и-мэйл шалгана уу.");
      }

      // Prevent self-invitation
      if (invitedUserId === user.id) {
        throw new Error("Өөрийгөө урих боломжгүй");
      }

      // Check for existing pending invitation
      const { data: existing } = await supabase
        .from("team_invitations")
        .select("id")
        .eq("team_id", teamId)
        .eq("invited_user_id", invitedUserId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        throw new Error("Энэ хэрэглэгч аль хэдийн уригдсан байна");
      }

      // Fetch team name for the invitation record
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      // Create invitation
      const { data: invitation, error: invErr } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          team_name: team?.name ?? "",
          invited_user_id: invitedUserId,
          invited_by_user_id: user.id,
          role,
        })
        .select()
        .single();

      if (invErr) throw invErr;

      // Log activity
      await supabase.from("team_activity_log").insert({
        team_id: teamId,
        user_id: user.id,
        action: "member_invited",
        details: { invited_user_id: invitedUserId, role },
      });

      return invitation;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["teamActivity", variables.teamId],
      });
    },
  });
}

// ── Remove Member ────────────────────────────────────────────────

interface RemoveMemberInput {
  teamId: string;
  memberId: string;
  userId: string;
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, memberId, userId }: RemoveMemberInput) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      await supabase.from("team_activity_log").insert({
        team_id: teamId,
        user_id: userId,
        action: "member_removed",
        details: { removed_member_id: memberId },
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["teamMembers", variables.teamId],
      });
      queryClient.invalidateQueries({
        queryKey: ["teamActivity", variables.teamId],
      });
    },
  });
}

// ── Update Member Role ───────────────────────────────────────────

interface UpdateRoleInput {
  memberId: string;
  role: TeamRole;
  teamId: string;
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: UpdateRoleInput) => {
      const { error } = await supabase
        .from("team_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["teamMembers", variables.teamId],
      });
    },
  });
}

// ── Accept / Decline Invitation ──────────────────────────────────

interface RespondInvitationInput {
  invitationId: string;
  teamId: string;
  status: "accepted" | "declined";
}

export function useRespondInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invitationId,
      teamId,
      status,
    }: RespondInvitationInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Нэвтрээгүй байна");

      // Update invitation status
      const { error } = await supabase
        .from("team_invitations")
        .update({ status })
        .eq("id", invitationId);

      if (error) throw error;

      // If accepted, add as team member
      if (status === "accepted") {
        // Fetch invitation to get role
        const { data: invitation } = await supabase
          .from("team_invitations")
          .select("role")
          .eq("id", invitationId)
          .single();

        const { error: memberErr } = await supabase
          .from("team_members")
          .insert({
            team_id: teamId,
            user_id: user.id,
            role: invitation?.role ?? "viewer",
          });

        if (memberErr) throw memberErr;

        await supabase.from("team_activity_log").insert({
          team_id: teamId,
          user_id: user.id,
          action: "member_joined",
          details: { role: invitation?.role },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teamInvitations"] });
    },
  });
}