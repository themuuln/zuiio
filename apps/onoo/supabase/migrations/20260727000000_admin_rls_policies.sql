-- Admin RLS policies for core entity CRUD
-- ============================================================================
-- Adds INSERT, UPDATE, DELETE policies for teams, leagues, players, seasons,
-- competitions, games, venues, products, orders, and sports tables.
-- Uses existing membership-based auth: users with 'owner' or 'admin' role on
-- the relevant org or league scope are granted write access.
-- ============================================================================

-- ── Helper: is_org_admin ─────────────────────────────────────────────────
-- Returns true if the current user has owner/admin role on the given org.
CREATE OR REPLACE FUNCTION private.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.scope_type = 'org'
      and m.scope_id = p_org_id
      and m.role in ('owner', 'admin')
  );
$$;

-- ── Helper: is_admin_on_scope ────────────────────────────────────────────
-- Returns true if the current user has owner/admin role on the given scope
-- (org, league, or team). Uses SECURITY DEFINER to avoid RLS recursion
-- when called from memberships policies.
CREATE OR REPLACE FUNCTION private.is_admin_on_scope(
  p_scope_type public.membership_scope,
  p_scope_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid())
      and m.scope_type = p_scope_type
      and m.scope_id = p_scope_id
      and m.role in ('owner', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_admin_on_scope TO authenticated;

-- ── LEAGUES (org-scoped) ─────────────────────────────────────────────────
CREATE POLICY "admin_insert_leagues" ON public.leagues
  FOR INSERT WITH CHECK (private.is_org_admin(organization_id));

CREATE POLICY "admin_update_leagues" ON public.leagues
  FOR UPDATE USING (private.is_org_admin(organization_id));

CREATE POLICY "admin_delete_leagues" ON public.leagues
  FOR DELETE USING (private.is_org_admin(organization_id));

-- ── TEAMS (league-scoped) ────────────────────────────────────────────────
CREATE POLICY "admin_insert_teams" ON public.teams
  FOR INSERT WITH CHECK (public.is_league_admin(league_id));

CREATE POLICY "admin_update_teams" ON public.teams
  FOR UPDATE USING (public.is_league_admin(league_id));

CREATE POLICY "admin_delete_teams" ON public.teams
  FOR DELETE USING (public.is_league_admin(league_id));

-- ── SEASONS (league-scoped) ──────────────────────────────────────────────
CREATE POLICY "admin_insert_seasons" ON public.seasons
  FOR INSERT WITH CHECK (public.is_league_admin(league_id));

CREATE POLICY "admin_update_seasons" ON public.seasons
  FOR UPDATE USING (public.is_league_admin(league_id));

CREATE POLICY "admin_delete_seasons" ON public.seasons
  FOR DELETE USING (public.is_league_admin(league_id));

-- ── COMPETITIONS (season → league scoped) ────────────────────────────────
CREATE POLICY "admin_insert_competitions" ON public.competitions
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.seasons s
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where s.id = season_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

CREATE POLICY "admin_update_competitions" ON public.competitions
  FOR UPDATE USING (
    exists (
      select 1 from public.seasons s
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where s.id = season_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_competitions" ON public.competitions
  FOR DELETE USING (
    exists (
      select 1 from public.seasons s
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where s.id = season_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

-- ── GAMES (competition → season → league scoped) ─────────────────────────
CREATE POLICY "admin_insert_games" ON public.games
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.competitions c
      join public.seasons s on s.id = c.season_id
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where c.id = competition_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

CREATE POLICY "admin_update_games" ON public.games
  FOR UPDATE USING (
    exists (
      select 1 from public.competitions c
      join public.seasons s on s.id = c.season_id
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where c.id = competition_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_games" ON public.games
  FOR DELETE USING (
    exists (
      select 1 from public.competitions c
      join public.seasons s on s.id = c.season_id
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where c.id = competition_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

-- ── TEAM_SEASONS (competition → season → league scoped) ──────────────────
CREATE POLICY "admin_insert_team_seasons" ON public.team_seasons
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.competitions c
      join public.seasons s on s.id = c.season_id
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where c.id = competition_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

CREATE POLICY "admin_update_team_seasons" ON public.team_seasons
  FOR UPDATE USING (
    exists (
      select 1 from public.competitions c
      join public.seasons s on s.id = c.season_id
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where c.id = competition_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_team_seasons" ON public.team_seasons
  FOR DELETE USING (
    exists (
      select 1 from public.competitions c
      join public.seasons s on s.id = c.season_id
      join public.memberships m on m.scope_type = 'league' and m.scope_id = s.league_id
      where c.id = competition_id
        and m.user_id = (select auth.uid())
        and m.role = 'admin'
    )
  );

-- ── PLAYERS (system-wide — any org admin) ────────────────────────────────
CREATE POLICY "admin_insert_players" ON public.players
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_update_players" ON public.players
  FOR UPDATE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_delete_players" ON public.players
  FOR DELETE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

-- ── VENUES (system-wide — any org admin) ─────────────────────────────────
CREATE POLICY "admin_insert_venues" ON public.venues
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_update_venues" ON public.venues
  FOR UPDATE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_delete_venues" ON public.venues
  FOR DELETE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

-- ── PRODUCTS (system-wide — any org admin) ───────────────────────────────
CREATE POLICY "admin_insert_products" ON public.products
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_update_products" ON public.products
  FOR UPDATE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_delete_products" ON public.products
  FOR DELETE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

-- ── ORDERS (system-wide — any org admin) ─────────────────────────────────
CREATE POLICY "admin_insert_orders" ON public.orders
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_update_orders" ON public.orders
  FOR UPDATE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_delete_orders" ON public.orders
  FOR DELETE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

-- ── SPORTS (system-wide — any org admin) ─────────────────────────────────
CREATE POLICY "admin_insert_sports" ON public.sports
  FOR INSERT WITH CHECK (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_update_sports" ON public.sports
  FOR UPDATE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

CREATE POLICY "admin_delete_sports" ON public.sports
  FOR DELETE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.role in ('owner', 'admin')
    )
  );

-- ── ORGANIZATIONS (self-scoped — must check org membership) ──────────────
CREATE POLICY "admin_update_organizations" ON public.organizations
  FOR UPDATE USING (
    exists (
      select 1 from public.memberships m
      where m.user_id = (select auth.uid())
        and m.scope_type = 'org'
        and m.scope_id = organizations.id
        and m.role in ('owner', 'admin')
    )
  );

-- ── MEMBERSHIPS (scoped — prevent privilege escalation) ──────────────────
-- Uses SECURITY DEFINER helper to avoid RLS recursion on memberships reads.
CREATE POLICY "admin_insert_memberships" ON public.memberships
  FOR INSERT WITH CHECK (
    private.is_admin_on_scope(scope_type, scope_id)
  );

CREATE POLICY "admin_update_memberships" ON public.memberships
  FOR UPDATE USING (
    private.is_admin_on_scope(scope_type, scope_id)
  );

CREATE POLICY "admin_delete_memberships" ON public.memberships
  FOR DELETE USING (
    private.is_admin_on_scope(scope_type, scope_id)
  );

CREATE POLICY "admin_read_memberships" ON public.memberships
  FOR SELECT USING (
    private.is_admin_on_scope(scope_type, scope_id)
  );
