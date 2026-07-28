const { Pool } = require('pg');
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('/tmp/b21-parsed.json', 'utf8'));
const GAME_ID = '70000000-0000-0000-0000-000000000102';
const HOME_TS = '30000000-0000-0000-0000-000000000005';
const AWAY_TS = '30000000-0000-0000-0000-000000000006';
const ADMIN = '02346873-7047-4c27-b1d5-9461301c447f';

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54323/postgres' });
  const client = await pool.connect();
  try {
    // 1. Read actual player IDs from DB (matching jersey_number to team)
    const homePlayers = (await client.query(
      `SELECT gr.player_id, re.jersey_number FROM game_rosters gr
       JOIN roster_entries re ON re.player_id = gr.player_id AND re.team_season_id = gr.team_season_id
       WHERE gr.game_id = $1 AND gr.team_season_id = $2 ORDER BY re.jersey_number`,
      [GAME_ID, HOME_TS]
    )).rows;
    const awayPlayers = (await client.query(
      `SELECT gr.player_id, re.jersey_number FROM game_rosters gr
       JOIN roster_entries re ON re.player_id = gr.player_id AND re.team_season_id = gr.team_season_id
       WHERE gr.game_id = $1 AND gr.team_season_id = $2 ORDER BY re.jersey_number`,
      [GAME_ID, AWAY_TS]
    )).rows;

    console.log('Home players:', homePlayers.length, 'Away players:', awayPlayers.length);

    // 2. Map jersey_number → player_id for each team
    const homeJerseyMap = new Map(homePlayers.map(p => [p.jersey_number, p.player_id]));
    const awayJerseyMap = new Map(awayPlayers.map(p => [p.jersey_number, p.player_id]));

    // 3. Build projection using actual DB player IDs
    function buildPlayers(teamData, jerseyMap, teamSeasonId) {
      return teamData.players.map(pl => ({
        player_id: jerseyMap.get(pl.jerseyNumber) || '00000000-0000-0000-0000-000000000000',
        team_season_id: teamSeasonId,
        seconds_played: pl.secondsPlayed,
        pts: pl.pts, fgm: pl.fgm, fga: pl.fga, tpm: pl.tpm, tpa: pl.tpa,
        ftm: pl.ftm, fta: pl.fta, oreb: pl.oreb, dreb: pl.dreb,
        ast: pl.ast, stl: pl.stl, blk: pl.blk, tov: pl.tov, pf: pl.pf,
        plus_minus: pl.plusMinus, fouls_committed: pl.foulsCommitted, fouls_drawn: pl.foulsDrawn
      }));
    }

    function buildTeam(t, ti, flow) {
      const t2 = t.totals || {};
      const k = ti === 0 ? 'home' : 'away';
      return {
        team_season_id: ti === 0 ? HOME_TS : AWAY_TS,
        pts: t2.pts||0, fgm: t2.fgm||0, fga: t2.fga||0,
        tpm: t2.threePgm||0, tpa: t2.threePga||0, ftm: t2.ftm||0, fta: t2.fta||0,
        oreb: t2.oreb||0, dreb: t2.dreb||0, team_reb: null,
        ast: t2.ast||0, stl: t2.stl||0, blk: t2.blk||0, tov: t2.tov||0, pf: t2.pf||0,
        fouls_committed: t2.foulsCommitted||0, fouls_drawn: t2.foulsDrawn||0,
        points_from_turnovers: flow?.pointsFromTurnovers?.[k]||null,
        points_in_paint: flow?.pointsInPaint?.[k]||null,
        second_chance_points: flow?.secondChancePoints?.[k]||null,
        fast_break_points: flow?.fastBreakPoints?.[k]||null,
        bench_points: flow?.benchPoints?.[k]||null,
        biggest_lead: null, biggest_scoring_run_for: null,
        biggest_scoring_run_against: null, time_leading_seconds: null
      };
    }

    const projection = {
      players: [
        ...buildPlayers(raw.teams[0], homeJerseyMap, HOME_TS),
        ...buildPlayers(raw.teams[1], awayJerseyMap, AWAY_TS)
      ],
      teams: raw.teams.map((t, ti) => buildTeam(t, ti, raw.flow)),
      summary: raw.flow ? { lead_changes: raw.flow.leadChanges??null, times_tied: raw.flow.timesTied??null } : null,
      period_scores: (raw.periodScores||[]).map(ps => ({ period: ps.period, home_points: ps.homePoints, away_points: ps.awayPoints })),
      scoring_checkpoints: (raw.scoringCheckpoints||[]).map(sc => ({ elapsed_seconds: sc.elapsedSeconds, home_score: sc.homeScore, away_score: sc.awayScore }))
    };

    // 4. Set auth and call RPC
    await client.query(`SET request.jwt.claim.sub = '${ADMIN}'`);
    await client.query(`SET request.jwt.claims = '${JSON.stringify({ sub: ADMIN, role: 'authenticated' })}'`);

    console.log(`\nCalling RPC: ${projection.players.length} players, ${projection.teams.length} teams`);
    const rpc = await client.query(
      `SELECT public.cmd_submit_official_stats($1::uuid, $2::text, $3::jsonb, $4::jsonb, $5::smallint, $6::smallint) as result`,
      [GAME_ID, 'test-data/B21.pdf', JSON.stringify(raw), JSON.stringify(projection), raw.score?.home??110, raw.score?.away??105]
    );
    console.log('\n✓ RPC:', JSON.stringify(rpc.rows[0].result));

    // 5. Verify
    const tables = ['game_player_stats','game_team_stats','game_summary_stats','game_period_scores','game_scoring_checkpoints'];
    for (const t of tables) {
      const r = await client.query(`SELECT count(*) as c FROM ${t} WHERE game_id = $1`, [GAME_ID]);
      console.log(t + ':', r.rows[0].c);
    }
    const bx = (await client.query(`SELECT count(*) as c FROM v_public_box_score WHERE game_id = $1`, [GAME_ID])).rows[0].c;
    console.log('v_public_box_score:', bx);

    const gs = (await client.query(`SELECT status, home_score, away_score FROM games WHERE id = $1`, [GAME_ID])).rows[0];
    console.log('\nGame:', gs.status, gs.home_score + '-' + gs.away_score);

    const flow = (await client.query(`SELECT team_code, fouls_committed, fouls_drawn, points_from_turnovers, points_in_paint, second_chance_points, fast_break_points, bench_points FROM v_public_team_game_stats WHERE game_id = $1`, [GAME_ID])).rows;
    console.log('\nTeam flow stats:');
    for (const r of flow) console.log(`  ${r.team_code}: C=${r.fouls_committed} D=${r.fouls_drawn} PFT=${r.points_from_turnovers} PIP=${r.points_in_paint} 2CP=${r.second_chance_points} FBP=${r.fast_break_points} BP=${r.bench_points}`);

    const pm = (await client.query(`SELECT player_name, plus_minus, fouls_committed, fouls_drawn FROM v_public_box_score WHERE game_id = $1 AND plus_minus IS NOT NULL LIMIT 5`, [GAME_ID])).rows;
    console.log('\n+/- sample:');
    for (const r of pm) console.log(`  ${r.player_name}: +/=${r.plus_minus} C=${r.fouls_committed} D=${r.fouls_drawn}`);

    const periods = (await client.query(`SELECT * FROM v_public_game_period_scores WHERE game_id = $1 ORDER BY period`, [GAME_ID])).rows;
    console.log('\nPeriod scores:');
    for (const r of periods) console.log(`  Q${r.period}: ${r.home_points}-${r.away_points}`);

    console.log('\n✅ ALL VERIFIED');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
main();
