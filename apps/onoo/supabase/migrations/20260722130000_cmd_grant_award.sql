-- ============================================================================
-- cmd_grant_award — SECURITY DEFINER function for granting league awards
-- ============================================================================

-- Helper: check if auth user can manage competitions for awarding
create or replace function private.user_can_manage_competition(p_competition_id uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.competitions c
    join public.seasons s on s.id = c.season_id
    join public.memberships m on (
      (m.scope_type = 'league' and m.scope_id = s.league_id)
      or (m.scope_type = 'org' and m.scope_id = (select l.organization_id from public.leagues l where l.id = s.league_id))
    )
    where c.id = p_competition_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'manager')
  );
$$;

-- Grant award — only managers/admins/owners of the competition's league/org may grant
create or replace function public.cmd_grant_award(
  p_competition_id uuid,
  p_award_type text,
  p_player_id uuid,
  p_period_start date default null,
  p_period_end date default null,
  p_note text default null
) returns jsonb language plpgsql security definer
set search_path = '' as $$
declare
  v_award public.awards;
begin
  -- 1. Authorize
  if not private.user_can_manage_competition(p_competition_id) then
    raise exception 'ONOO_NOT_AUTHORIZED';
  end if;

  -- 2. Validate award type
  if p_award_type not in ('player_of_week', 'mvp', 'top_scorer') then
    raise exception 'ONOO_INVALID_AWARD_TYPE: must be player_of_week, mvp, or top_scorer';
  end if;

  -- 3. Insert award
  insert into public.awards (competition_id, award_type, period_start, period_end, player_id, granted_by, note)
  values (p_competition_id, p_award_type, p_period_start, p_period_end, p_player_id, (select auth.uid()), p_note)
  returning * into v_award;

  -- 4. Write audit
  perform private.write_audit('grant_award', 'award', v_award.id, jsonb_build_object(
    'competition_id', p_competition_id,
    'award_type', p_award_type,
    'player_id', p_player_id
  ));

  -- 5. Return created award
  return jsonb_build_object(
    'id', v_award.id,
    'competition_id', v_award.competition_id,
    'award_type', v_award.award_type,
    'period_start', v_award.period_start,
    'period_end', v_award.period_end,
    'player_id', v_award.player_id,
    'granted_by', v_award.granted_by,
    'granted_at', v_award.granted_at,
    'note', v_award.note
  );
end;
$$;

grant execute on function public.cmd_grant_award(uuid, text, uuid, date, date, text) to authenticated;
