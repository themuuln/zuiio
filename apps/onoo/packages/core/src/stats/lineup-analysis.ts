export interface LineupEvent {
  gameId: string;
  period: number;
  clockSeconds: number;
  playerIn?: string;
  playerOut?: string;
}

export interface LineupPeriod {
  playerIds: string[];
  seconds: number;
  ptsScored: number;
  ptsAllowed: number;
}

/** Parse substitution events into on-court player periods */
export function computeLineups(events: LineupEvent[]): LineupPeriod[] {
  const court: string[] = [];
  const lineupMap = new Map<
    string,
    { seconds: number; ptsScored: number; ptsAllowed: number }
  >();
  let lastClock = 2400; // assume 40 min game

  for (const evt of events) {
    const elapsed = lastClock - evt.clockSeconds;
    if (court.length > 0 && elapsed > 0) {
      const key = [...court].sort().join(",");
      const entry = lineupMap.get(key) ?? {
        seconds: 0,
        ptsScored: 0,
        ptsAllowed: 0,
      };
      entry.seconds += elapsed;
      lineupMap.set(key, entry);
    }

    if (evt.playerIn && !court.includes(evt.playerIn)) court.push(evt.playerIn);
    if (evt.playerOut) {
      const idx = court.indexOf(evt.playerOut);
      if (idx >= 0) court.splice(idx, 1);
    }
    lastClock = evt.clockSeconds;
  }

  return Array.from(lineupMap.entries()).map(([key, val]) => ({
    playerIds: key.split(","),
    seconds: val.seconds,
    ptsScored: val.ptsScored,
    ptsAllowed: val.ptsAllowed,
  }));
}
