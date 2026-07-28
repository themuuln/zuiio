## Task: shared-types
Update BoxScoreRow type and data layer with new FIBA fields
- src/app/lib/shared.ts — add plus_minus, fouls_committed, fouls_drawn, is_starter, dnp_reason to BoxScoreRow; add GameDetailStats, PeriodScoreRow, ScoringCheckpointRow, GameSummaryRow types and helpers
- src/app/lib/data.ts — add getGameDetailStats(gameId) function querying v_public_team_game_stats, v_public_game_summary, v_public_game_period_scores, v_public_game_scoring_checkpoints; update getPlayerGameLog to include new fields
- No components, no page files

## Task: game-detail-ui
Update game detail page with FIBA box score layout
- src/app/games/[id]/page.tsx — update BoxScoreSection: FIBA column order (MIN, FG, 2P, 3P, FT, OREB, DREB, REB, AST, STL, BLK, TOV, PF, C, D, +/-), DNP rows at bottom with em-dash stats, starter badge; update calculateTeamTotals → use v_public_team_game_stats; update TeamComparison with BLK, PF, FG%, OREB, DREB, team_reb; add GameFlowStats, PeriodScoreTable, ScoringCheckpointTable sections
- No new component files (inline or co-located)

## Task: leader-player-surfaces
Update leader tabs, game log, shooting profile, player page
- src/app/leaders/components/leader-tabs.tsx — add new CATEGORIES: fg_pct, two_pt_pct, three_pt_pct, ft_pct, mpg, eff, plus_minus, fouls_drawn, pf; add isEligible and sort direction to CategoryConfig; append new keys to localStorage order
- src/app/players/[id]/components/hero-card.tsx — no changes to hero strip (keep PPG/RPG/APG/SPG/BPG)
- Player game log: update to show plus_minus from row (not team score diff), add PF/C/D columns, filter DNP rows
- Shooting profile: add 2P M/A (%) row

## Task: hide-event-only-data
Remove fabricated shot chart fallback and LineupAnalysis stub
- src/app/players/[id]/components/shot-chart.tsx — remove fallback heatmap rendering when hasZoneData=false; keep efficiency grid; show PublicEmptyState with "Шидэлтийн байршил бүртгэгдээгүй" when no zone data
- src/app/teams/[slug]/analytics/page.tsx — remove LineupAnalysis section import and rendering
- src/app/teams/[slug]/analytics/components/lineup-analysis.tsx — delete file
- Any test files referencing LineupAnalysis — update/remove

## Constraints
- Tasks can be run in parallel
- shared-types must apply first if run sequentially
- Do NOT run build, lint, or full test suite (will be done at end)
- Each task: read files fully before editing; minimal changes
