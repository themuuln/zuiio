# Schema Recovery Record

**Recorded:** 2026-07-10  
**Phase:** 0A — Schema recovery  
**Decision:** Build a clean, reviewed V2 baseline; do not extend the divergent prototype history.

## Evidence

The hosted `onoo` Supabase project was inspected on 2026-07-10 with the Supabase MCP `list_tables` and `get_advisors` tools.

| Category | Observed state |
| --- | --- |
| Hosted tables | 22 public tables; all have RLS enabled |
| Hosted data | Fixture scale: 3 games, no rows in `stat_events`, derived stat tables, or standings |
| Git migrations | `001`–`004`, then `008` and `009` |
| Hosted-only history | RLS, rollups, and duplicate `apply_derived_stats` RPCs (`005`–`007`) have no reviewed Git source |
| Untracked privileged functions | `apply_derived_stats` (two signatures), `game_league_id`, `is_game_scorekeeper`, `is_league_admin`, `refresh_season_player_stats`, `refresh_standings` |
| Security advisories | `audit_log` is RLS-enabled without a policy; all listed privileged functions are executable by `anon` and `authenticated` |

The current schema also uses the obsolete V1 lifecycle:

```text
scheduled → live → final → verified → official
```

## Recovery choice

The hosted project is a disposable prototype, not a source of production records. V2 therefore starts from a clean, reviewable baseline rather than trying to reconstruct untracked and duplicated migration history.

The V2 baseline will:

1. Preserve the useful registry, game, roster, membership, event, projection, and audit entities.
2. Replace the lifecycle with `scheduled`, `live_provisional`, `final_pending_review`, `league_verified`, `official`, `cancelled`, and `postponed`.
3. Add rulesets, evidence-backed source submissions, revisions, corrections, durable tracker sessions, player aliases, and merge history.
4. Remove public execution of privileged functions and expose only audited command functions.
5. Publish approved data only through `security_invoker` views.
6. Defer follows, push tokens, and athlete claims because they are outside the web-first paid-pilot scope.

## Cutover contract

This is a **new-environment baseline**, not an in-place destructive migration for the existing prototype database. Before it is connected to a paid pilot:

- apply the V2 baseline to a clean Supabase project;
- seed only pilot reference data;
- generate database types from that project;
- exercise role-matrix and state-transition tests;
- compare the deployed schema with this migration set; and
- record the migration checksums below.

The existing hosted prototype remains untouched until a rehearsed cutover proves the new environment.

## Checksums

| Artifact | SHA-256 | Recorded after clean reset |
| --- | --- | --- |
| V2 baseline migration | Pending | No |
| V2 authorization migration | Pending | No |
| V2 publication views migration | Pending | No |
| V2 pilot seed | Pending | No |

## Security follow-up

The current hosted project reports the following security risks. They are intentionally not patched in place because V2 cuts over to a clean environment; the V2 migration set removes their public reachability.

- `public.audit_log` has no RLS policy.
- `public.apply_derived_stats` is exposed with two conflicting `SECURITY DEFINER` signatures.
- `game_league_id`, `is_game_scorekeeper`, `is_league_admin`, `refresh_season_player_stats`, and `refresh_standings` are public `SECURITY DEFINER` functions.
- Supabase Auth leaked-password protection is disabled; enable it in the V2 project before pilot accounts are provisioned.
