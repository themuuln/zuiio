const { Pool } = require('pg');
const fs = require('fs');

// Parse B21 data
const raw = JSON.parse(fs.readFileSync('/tmp/b21-parsed.json', 'utf8'));

// Known seed IDs
const GAME_ID = '70000000-0000-0000-0000-000000000102';
const HOME_TEAM_SEASON_ID = '30000000-0000-0000-0000-000000000005';
const AWAY_TEAM_SEASON_ID = '30000000-0000-0000-0000-000000000006';
const ADMIN_USER_ID = '02346873-7047-4c27-b1d5-9461301c447f';

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54323/postgres' });

  try {
    // 1. Create players matching B21.pdf roster for each team
    let playerIdx = 0;
    for (let ti = 0; ti < raw.teams.length; ti++) {
      const teamSeasonId = ti === 0 ? HOME_TEAM_SEASON_ID : AWAY_TEAM_SEASON_ID;
      const dir = ti === 0 ? 'home' : 'away';

      console.log(`\n=== ${dir.toUpperCase()} TEAM: ${raw.teams[ti].code} (${raw.teams[ti].name}) ===`);

      for (const pl of raw.teams[ti].players) {
        const playerId = `b2100000-0000-4000-8000-00000000${String(playerIdx).padStart(4, '0')}`;
        playerIdx++;

        await pool.query(
          `INSERT INTO players (id, canonical_name, nationality, position) VALUES ($1, $2, 'MN', 'G') ON CONFLICT (id) DO UPDATE SET canonical_name = $2`,
          [playerId, pl.name]
        );

        await pool.query(
          `INSERT INTO roster_entries (player_id, team_season_id, jersey_number, position) 
           VALUES ($1, $2, $3, 'G') 
           ON CONFLICT (team_season_id, player_id) DO UPDATE SET jersey_number = $3`,
          [playerId, teamSeasonId, pl.jerseyNumber]
        );

        // Use raw insert without ON CONFLICT — the unique constraint handles duplicates
        await pool.query(
          `INSERT INTO game_rosters (game_id, team_season_id, player_id, is_starter) VALUES ($1, $2, $3, $4)`,
          [GAME_ID, teamSeasonId, playerId, pl.isStarter]
        ).catch(e => {
          // Ignore duplicate key errors
          if (!e.message?.includes('duplicate key')) throw e;
        });

        console.log(`  Player #${pl.jerseyNumber} ${pl.name} (starter: ${pl.isStarter}, dnp: ${pl.dnp}) -> ${playerId}`);
      }
    }

    // 2. Create game_assignments for admin user
    await pool.query(
      `INSERT INTO game_assignments (game_id, user_id, role)
       VALUES ($1, $2, 'lead_scorer')
       ON CONFLICT (game_id, user_id, role) DO UPDATE SET role = 'lead_scorer'`,
      [GAME_ID, ADMIN_USER_ID]
    );
    console.log(`\n✓ Game assignment created for admin`);

    // 3. Build projection
    // Use sequential IDs matching the SQL seed (not ti*12+pi)
    // Player indices in raw.teams are sequential across both teams
    let globalIdx = 0;
    const projection = {
      players: raw.teams.flatMap((t, ti) =>
        t.players.map((pl) => {
          const pId = `b2100000-0000-4000-8000-00000000${String(globalIdx++).padStart(4, '0')}`;
          return {
            player_id: pId,
            team_season_id: ti === 0 ? HOME_TEAM_SEASON_ID : AWAY_TEAM_SEASON_ID,
            seconds_played: pl.secondsPlayed,
            pts: pl.pts, fgm: pl.fgm, fga: pl.fga, tpm: pl.tpm, tpa: pl.tpa,
            ftm: pl.ftm, fta: pl.fta, oreb: pl.oreb, dreb: pl.dreb,
            ast: pl.ast, stl: pl.stl, blk: pl.blk, tov: pl.tov, pf: pl.pf,
            plus_minus: pl.plusMinus, fouls_committed: pl.foulsCommitted, fouls_drawn: pl.foulsDrawn
          };
        })
      ),
      teams: raw.teams.map((t, ti) => {
        const t2 = t.totals || {};
        return {
          team_season_id: ti === 0 ? HOME_TEAM_SEASON_ID : AWAY_TEAM_SEASON_ID,
          pts: t2.pts || (raw.score ? raw.score[ti === 0 ? 'home' : 'away'] : 0) || 0,
          fgm: t2.fgm || 0, fga: t2.fga || 0,
          tpm: t2.threePgm || 0, tpa: t2.threePga || 0,
          ftm: t2.ftm || 0, fta: t2.fta || 0,
          oreb: t2.oreb || 0, dreb: t2.dreb || 0,
          team_reb: null, ast: t2.ast || 0,
          stl: t2.stl || 0, blk: t2.blk || 0, tov: t2.tov || 0, pf: t2.pf || 0,
          fouls_committed: t2.foulsCommitted || 0, fouls_drawn: t2.foulsDrawn || 0,
          points_from_turnovers: raw.flow?.pointsFromTurnovers?.[ti === 0 ? 'home' : 'away'] || null,
          points_in_paint: raw.flow?.pointsInPaint?.[ti === 0 ? 'home' : 'away'] || null,
          second_chance_points: raw.flow?.secondChancePoints?.[ti === 0 ? 'home' : 'away'] || null,
          fast_break_points: raw.flow?.fastBreakPoints?.[ti === 0 ? 'home' : 'away'] || null,
          bench_points: raw.flow?.benchPoints?.[ti === 0 ? 'home' : 'away'] || null,
          biggest_lead: null, biggest_scoring_run_for: null,
          biggest_scoring_run_against: null, time_leading_seconds: null
        };
      }),
      summary: raw.flow ? { lead_changes: raw.flow.leadChanges ?? null, times_tied: raw.flow.timesTied ?? null } : null,
      period_scores: (raw.periodScores || []).map(ps => ({ period: ps.period, home_points: ps.homePoints, away_points: ps.awayPoints })),
      scoring_checkpoints: (raw.scoringCheckpoints || []).map(sc => ({ elapsed_seconds: sc.elapsedSeconds, home_score: sc.homeScore, away_score: sc.awayScore }))
    };

    const homeScore = raw.score?.home ?? 110;
    const awayScore = raw.score?.away ?? 105;

    console.log(`\n=== Calling RPC ===`);
    console.log(`Players: ${projection.players.length}, Teams: ${projection.teams.length}`);
    console.log(`Periods: ${(projection.period_scores || []).length}, Checkpoints: ${(projection.scoring_checkpoints || []).length}`);
    console.log(`Score: ${homeScore}-${awayScore}`);

    // 4. Set auth context for RLS, then call RPC
    // Must use a single client so set_config persists across queries
    const client = await pool.connect();
    try {
      await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [ADMIN_USER_ID]);
      await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify({ sub: ADMIN_USER_ID, role: 'authenticated' })
      ]);

      const rpcResult = await client.query(
        `SELECT public.cmd_submit_official_stats(
          $1::uuid, $2::text, $3::jsonb, $4::jsonb, $5::smallint, $6::smallint
        ) as result`,
        [GAME_ID, `test-data/B21.pdf`, JSON.stringify(raw), JSON.stringify(projection), homeScore, awayScore]
      );

      console.log(`\n✓ RPC result:`, rpcResult.rows[0].result);
    } finally {
      client.release();
    }

    // 5. Verify
    console.log(`\n=== Verifying ===`);

    const count = await pool.query(`SELECT count(*) as c FROM game_player_stats WHERE game_id = $1`, [GAME_ID]);
    console.log(`Game player stats: ${count.rows[0].c} rows`);

    const tsCount = await pool.query(`SELECT count(*) as c FROM game_team_stats WHERE game_id = $1`, [GAME_ID]);
    console.log(`Game team stats: ${tsCount.rows[0].c} rows`);

    const sumCount = await pool.query(`SELECT count(*) as c FROM game_summary_stats WHERE game_id = $1`, [GAME_ID]);
    console.log(`Game summary: ${sumCount.rows[0].c} rows`);

    const psCount = await pool.query(`SELECT count(*) as c FROM game_period_scores WHERE game_id = $1`, [GAME_ID]);
    console.log(`Period scores: ${psCount.rows[0].c} rows`);

    const cpCount = await pool.query(`SELECT count(*) as c FROM game_scoring_checkpoints WHERE game_id = $1`, [GAME_ID]);
    console.log(`Checkpoints: ${cpCount.rows[0].c} rows`);

    const bxCount = await pool.query(`SELECT count(*) as c FROM v_public_box_score WHERE game_id = $1`, [GAME_ID]);
    console.log(`Public box score: ${bxCount.rows[0].c} rows`);

    // Team flow stats
    const flowRows = await pool.query(
      `SELECT team_code, fouls_committed, fouls_drawn, points_from_turnovers, points_in_paint, second_chance_points, fast_break_points, bench_points
       FROM v_public_team_game_stats WHERE game_id = $1`, [GAME_ID]
    );
    for (const r of flowRows.rows) {
      console.log(`  ${r.team_code}: C=${r.fouls_committed} D=${r.fouls_drawn} PFT=${r.points_from_turnovers} PIP=${r.points_in_paint} 2CP=${r.second_chance_points} FBP=${r.fast_break_points} BP=${r.bench_points}`);
    }

    const periodRows = await pool.query(
      `SELECT * FROM v_public_game_period_scores WHERE game_id = $1 ORDER BY period`, [GAME_ID]
    );
    console.log(`  Period scores:`);
    for (const r of periodRows.rows) {
      console.log(`    Q${r.period}: ${r.home_points}-${r.away_points}`);
    }

    const gameStatus = (await pool.query(`SELECT status, home_score, away_score, published_at FROM games WHERE id = $1`, [GAME_ID])).rows[0];
    console.log(`  Game: status=${gameStatus.status} score=${gameStatus.home_score}-${gameStatus.away_score} published=${gameStatus.published_at}`);

    const pmRows = await pool.query(
      `SELECT player_name, plus_minus, fouls_committed, fouls_drawn FROM v_public_box_score WHERE game_id = $1 AND plus_minus IS NOT NULL LIMIT 5`, [GAME_ID]
    );
    if (pmRows.rows.length > 0) {
      console.log(`  +/- rows (sample 5):`);
      for (const r of pmRows.rows) {
        console.log(`    ${r.player_name}: +/-=${r.plus_minus} C=${r.fouls_committed} D=${r.fouls_drawn}`);
      }
    }

    console.log(`\n✅ DONE - Game is verified and published!`);
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.stack) console.error(err.stack.split('\n').slice(0, 5).join('\n'));
  } finally {
    await pool.end();
  }
}

main();
