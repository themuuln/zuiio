import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  owner_user_id: string;
  horse_count: number;
  created_at: string;
  updated_at: string;
}

export type TeamRole = "owner" | "manager" | "vet" | "groom" | "viewer";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  permissions: string[];
  joined_at: string;
  updated_at: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  profiles: { name: string | null; phone: string | null } | null;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  team_name: string;
  invited_user_id: string;
  invited_by_user_id: string;
  role: TeamRole;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface TeamHorse {
  id: string;
  team_id: string;
  horse_id: string;
  added_by: string | null;
  added_at: string;
  horses: { name: string; gender: string; coat: string } | null;
}

export interface TeamActivityLog {
  id: string;
  team_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

// ── Queries ──────────────────────────────────────────────────────

/** All teams the current user belongs to */
export function useTeams(userId: string | undefined) {
  return useQuery({
    queryKey: ["teams", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Fetch teams where user is owner
      const { data: ownedTeams, error: ownedErr } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: false });

      if (ownedErr) throw ownedErr;

      // Fetch teams where user is a member (not owner)
      const { data: memberships, error: memberErr } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId);

      if (memberErr) throw memberErr;

      const memberTeamIds = (memberships ?? [])
        .map((m) => m.team_id)
        .filter((id) => !ownedTeams?.some((t) => t.id === id));

      if (memberTeamIds.length === 0) return (ownedTeams ?? []) as Team[];

      const { data: memberTeams, error: memberTeamErr } = await supabase
        .from("teams")
        .select("*")
        .in("id", memberTeamIds)
        .order("created_at", { ascending: false });

      if (memberTeamErr) throw memberTeamErr;

      return [...(ownedTeams ?? []), ...(memberTeams ?? [])] as Team[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Single team by id */
export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/** Members of a team with their profiles */
export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ["teamMembers", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("team_members")
        .select("*, profiles(name, phone)")
        .eq("team_id", teamId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as TeamMemberWithProfile[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Horses assigned to a team */
export function useTeamHorses(teamId: string | undefined) {
  return useQuery({
    queryKey: ["teamHorses", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("team_horses")
        .select("*, horses(name, gender, coat)")
        .eq("team_id", teamId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as TeamHorse[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Activity log for a team */
export function useTeamActivity(teamId: string | undefined) {
  return useQuery({
    queryKey: ["teamActivity", teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from("team_activity_log")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as TeamActivityLog[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Pending invitations for the current user */
export function usePendingInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ["teamInvitations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("invited_user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as TeamInvitation[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}
