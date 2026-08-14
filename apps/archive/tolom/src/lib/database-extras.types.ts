// ── Supplementary types that can't be auto-generated ───────────
// database.types.ts covers all table Row/Insert/Update types.
// This file holds only manual types like CustomerPortalData that
// don't correspond to a single DB table Row.

// (ServiceRecommendationInsert and ServiceCompletionDatumInsert removed —
//  use TablesInsert from @/lib/database.types instead. Regenerated
//  database.types.ts now covers these tables.)

// ── Customer Portal types ──────────────────────────────────

export interface CustomerPortalData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  portal_token: string;
  organization_id: string;
  total_visits: number;
  last_visit_at: string | null;
}
