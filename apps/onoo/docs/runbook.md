# Onoo Game-Day Runbook

> For scorers, backup scorers, and league ops. Print this page and keep it courtside.

---

## Pre-game checklist (30 minutes before tip-off)

1. **Device charged** — minimum 50% battery; bring a power bank.
2. **Network check** — open the tracker page; confirm it loads and shows the game.
3. **Journal empty** — DevTools → Application → IndexedDB → `onoo-tracker` → `operations` should have 0 rows. If rows exist from a previous game, note them — they will replay on open.
4. **Roster confirmed** — both teams' rosters are visible in the tracker. If a player is missing, contact league ops before tip-off.
5. **Session opened** — tap "Тоглолт эхлүүлэх" to open a tracker session. The session ID appears in the header. **Write it down** on this runbook.
6. **Paper scoresheet printed** — open `/tracker/paper` on any device and print. Keep it on the scorer's table.

**Session ID:** ________________________

---

## During the game

### Normal flow

- Tap the event buttons as plays happen. Each tap persists to IndexedDB before attempting network send.
- **Check the event counter** after each tap — it should increment by 1. If it doesn't, the event is queued offline.
- **Check the queue depth indicator** in the header. If > 0, the device is offline or the server is slow. Events will replay when connectivity returns.

### Failure ladder

Follow this sequence when something goes wrong. **Do not skip steps.**

#### 1. App crash / tab killed

- **Reopen** `/tracker/<gameId>`. The tracker loads pending events from IndexedDB and replays them.
- Verify the event count matches what you recorded. If the queue depth is 0 and the count is correct, you're back.
- If the count is wrong, **check the paper scoresheet** and compare.

#### 2. Device dead / hardware failure

- **Hand off to the backup scorer** (see Handoff procedure below).
- If no backup device is available, switch to the **paper scoresheet** (see Paper fallback below).

#### 3. Network dead (Wi-Fi and cellular both down)

- **Keep tracking.** The IndexedDB journal stores every event locally.
- Watch the queue depth indicator — it will grow as you record events.
- When connectivity returns, events replay automatically in sequence order.
- The server deduplicates by `operation_id`, so re-accepted events are never double-counted.

#### 4. All tech dead (device + network)

- Switch to the **paper scoresheet** immediately.
- Record every event with time, period, player, and event type.
- After the game, enter events via the admin submission UI (Task 1.3).

### Handoff procedure

Use this when the lead scorer must transfer control to a backup.

1. Lead scorer: tap **"Гар шилжүүлэх"** in the tracker header.
2. Confirm the handoff in the dialog. The session becomes read-only on the lead scorer's device immediately.
3. Backup scorer: open `/tracker/<gameId>` on their device and tap **"Тоглолт эхлүүлэх"**.
4. A new session opens. The old session's pending ops continue to flush from the lead device.
5. **Verify:** the backup device shows the correct event count. The lead device shows a "Session superseded" notice.

> **Important:** The server accepts acked ops from superseded sessions but rejects NEW ops from them. This prevents double-tracking.

---

## Post-game

### If all events were tracked digitally

1. Tap **"Тоглолт дуусгах"** to transition the game to `final_pending_review`.
2. Verify the final score on screen matches the scoreboard.
3. The league official reviews and approves via the admin UI (Task 1.3).

### If paper scoresheet was used

1. Open the admin panel → **Submissions** tab for this game.
2. Create a new source submission with:
   - Source type: `paper`
   - Payload: the events from the paper scoresheet, in JSON format
3. Attach a photo of the paper scoresheet as evidence (if the evidence bucket is set up).
4. The submission enters the normal review pipeline.

### If there are rejected events

1. Open the tracker and check the **Rejected** section.
2. Each rejected event shows a reason (e.g., `ONOO_SEQUENCE_GAP`, `ONOO_NOT_AUTHORIZED`).
3. Fix the issue and re-record the event, or submit it as a source submission with the rejection reason noted.

---

## Paper scoresheet

Print the scoresheet at `/tracker/paper` before every game. Fields:

- **Game info:** date, teams, venue, period count
- **Per-period score grid:** one row per team, one column per period, plus total
- **Per-player tally rows:** one row per rostered player with columns for each stat category
- **Running total row** at the bottom

Fill in events as they happen using the tally marks. After the game, the paper scoresheet is the authoritative record if digital tracking failed.

---

## Quick reference: game status flow

```
scheduled → live_provisional → final_pending_review → league_verified → official
```

| Status | Meaning | Who sets it |
|---|---|---|
| `scheduled` | Game is planned, not started | League admin |
| `live_provisional` | Game in progress, results provisional | Tracker (auto on start) |
| `final_pending_review` | Game ended, awaiting league review | Tracker (auto on end) |
| `league_verified` | League has reviewed and approved | League admin |
| `official` | Final, locked | League admin |

---

## Quick reference: event types (pilot 5x5 ruleset)

| Category | Event types |
|---|---|
| Shot | `shot_2pt_made`, `shot_2pt_missed`, `shot_3pt_made`, `shot_3pt_missed`, `ft_made`, `ft_missed` |
| Rebound | `rebound_off`, `rebound_def`, `rebound_team` |
| Defense | `steal`, `block` |
| Offense | `turnover` |
| Foul | `foul_personal`, `foul_technical` |
| Admin | `substitution`, `timeout`, `period_start`, `period_end`, `game_start`, `game_end` |

---

## Quick reference: error codes

| Code | Meaning | Action |
|---|---|---|
| `ONOO_NOT_AUTHORIZED` | Caller lacks scorer role for this game | Check game assignment |
| `ONOO_INVALID_EVENT` | Game not in `live_provisional` status | Check game status |
| `ONOO_SESSION_REQUIRED` | Tracker session not found or inactive | Open a new session |
| `ONOO_SEQUENCE_GAP` | `local_seq` is not monotonic | Client-side ordering bug; reload the tracker |
| `ONOO_ROSTER_MISMATCH` | Player/team not in game roster | Verify roster before tracking |
| `ONOO_INVALID_EVENT` (ruleset) | Event type not in ruleset vocabulary | Check event type against ruleset |


---

## Тоглогч нууцлах (Player Takedown)

Тоглогчийг нууцлахын тулд: Admin → Тоглогч → тоглогчийг олоод "Нууц" сонгоно уу.
Нууцалсан тоглогчийн нэр болон зураг бүхий нийтэлсэн хуудсууд дээр нуулагдана.
Статистик нь үлдэж, эцсийн оноо нарийвчлал алдагдахгүй.
Нууцлалыг ахин "Нийтэд" болгон өөрчилж болно.