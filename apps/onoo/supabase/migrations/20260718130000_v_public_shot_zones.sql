-- Shot-zone aggregation view for public player pages.
--
-- Derives made/attempted counts per half-court zone from shot events recorded
-- in stat_events.payload. The tracker does not capture shot coordinates yet
-- (see docs/gaps.md: "schema exists, capture pending"), so this view returns
-- zero rows until a shot-location event type is seeded and emitted. It is built
-- forward-compatible: the moment payloads carry {x, y, made} for shot events,
-- the heatmap populates with no further code changes.
--
-- Zone keys match components/court-heatmap.tsx DEFAULT_SHOT_ZONES ids so the
-- frontend maps rows to SVG geometry by id. Court geometry (same file):
--   COURT_WIDTH = 600, COURT_HEIGHT = 550; basket center at (300, 60).
-- Ensure stat_events has deleted_at column (may be missing on clean schema)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='stat_events' AND column_name='deleted_at') THEN
    ALTER TABLE public.stat_events ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

--   paint: x in [172, 428], y in [22, 208]
--   mid-left: x in [22, 170], y in [22, 300]
--   mid-right: x in [430, 578], y in [22, 300]
--   mid-top: x in [170, 430], y in [210, 310]
--   three-left: x in [22, 170], y in [312, 530]
--   three-right: x in [430, 578], y in [312, 530]
--   three-top: x in [170, 430], y in [312, 530]
create or replace view public.v_public_shot_zones
with (security_invoker = true) as
select
  player_id,
  team_season_id,
  competition_id,
  zone_key,
  made,
  attempted
from (
  select
    p.id as player_id,
    se.team_season_id,
    ts.competition_id,
    case
      when (se.payload->>'x')::numeric between 172 and 428
        and (se.payload->>'y')::numeric between 22 and 208
        then 'paint'
      when (se.payload->>'x')::numeric between 22 and 170
        and (se.payload->>'y')::numeric between 22 and 300
        then 'mid-left'
      when (se.payload->>'x')::numeric between 430 and 578
        and (se.payload->>'y')::numeric between 22 and 300
        then 'mid-right'
      when (se.payload->>'x')::numeric between 170 and 430
        and (se.payload->>'y')::numeric between 210 and 310
        then 'mid-top'
      when (se.payload->>'x')::numeric between 22 and 170
        and (se.payload->>'y')::numeric between 312 and 530
        then 'three-left'
      when (se.payload->>'x')::numeric between 430 and 578
        and (se.payload->>'y')::numeric between 312 and 530
        then 'three-right'
      when (se.payload->>'x')::numeric between 170 and 430
        and (se.payload->>'y')::numeric between 312 and 530
        then 'three-top'
      else null
    end as zone_key,
    count(*) filter (
      where (se.payload->>'made')::boolean is true
    )::integer as made,
    count(*)::integer as attempted
  from public.stat_events se
  join public.players p on p.id = se.player_id
  left join public.team_seasons ts on ts.id = se.team_season_id
  join public.games g on g.id = se.game_id
    and g.status in ('league_verified', 'official')
  join public.game_revisions gr on gr.game_id = g.id
    and gr.revision_number = g.current_revision_number
    and gr.state = 'approved'
  where se.deleted_at is null
    and se.superseded_by is null
    -- Only events that actually carry shot coordinates.
    and (se.payload->>'x') ~ '^-?\d+(\.\d+)?$'
    and (se.payload->>'y') ~ '^-?\d+(\.\d+)?$'
  group by p.id, se.team_season_id, ts.competition_id,
    case
      when (se.payload->>'x')::numeric between 172 and 428
        and (se.payload->>'y')::numeric between 22 and 208
        then 'paint'
      when (se.payload->>'x')::numeric between 22 and 170
        and (se.payload->>'y')::numeric between 22 and 300
        then 'mid-left'
      when (se.payload->>'x')::numeric between 430 and 578
        and (se.payload->>'y')::numeric between 22 and 300
        then 'mid-right'
      when (se.payload->>'x')::numeric between 170 and 430
        and (se.payload->>'y')::numeric between 210 and 310
        then 'mid-top'
      when (se.payload->>'x')::numeric between 22 and 170
        and (se.payload->>'y')::numeric between 312 and 530
        then 'three-left'
      when (se.payload->>'x')::numeric between 430 and 578
        and (se.payload->>'y')::numeric between 312 and 530
        then 'three-right'
      when (se.payload->>'x')::numeric between 170 and 430
        and (se.payload->>'y')::numeric between 312 and 530
        then 'three-top'
      else null
    end
) z
where z.zone_key is not null;

grant select on public.v_public_shot_zones to anon, authenticated;
