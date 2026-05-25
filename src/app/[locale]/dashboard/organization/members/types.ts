import type { OrgInvite } from "@/lib/types";

export interface InviteWithEmail extends OrgInvite {
  organization_name?: string;
  inviter_name?: string | null;
}
