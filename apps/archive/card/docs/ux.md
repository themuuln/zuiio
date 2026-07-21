# UX & User Flows — 18+ Adult Party Night App

## Design Principles

1. **Speed over depth** — every screen should have one obvious action
2. **No dead ends** — always a way back, always a next step shown
3. **Delight in the details** — card animations, reveal suspense, confetti on spicy moments
4. **Phone-first layout** — all tap targets 44px+, thumb-reachable, comfortable to hold with one hand (drink in the other)
5. **Low cognitive load** — no menus inside menus, no settings during gameplay
6. **Moody aesthetic** — deep purples, neons, dark mode default — it's a Friday night app, not a work tool
7. **Content-appropriate UI** — Spicy tier uses playful colors, After Dark uses darker/sultrier tones

---

## Core User Flows

### Flow 1: Host Creates a Room (with Vibe Selection)

```
Open app
  └── Home screen: "Create Room" (big, centered button)
        └── Vibe picker: select content tier
              ├── 🟢 Spicy (FREE) — flirty, cheeky, mild drinking
              ├── 🟠 Wild ($2.99) — raunchy, heavy drinking
              └── 🔥 After Dark ($2.99) — explicit, no limits
                    └── Room created instantly
                          └── Lobby screen with vibe indicator
                                ├── QR code (full width, scannable)
                                ├── Room code: BOND (large, copyable)
                                ├── Vibe badge: 🟢 Spicy / 🟠 Wild / 🔥 After Dark
                                ├── Share link button
                                └── Player list (empty → fills as people join)
```

**Time target**: Under 5 seconds from open to shareable room.

---

### Flow 2: Guest Joins via QR

```
Scan QR code (camera app or native scanner)
  └── Browser opens: friday.app/BOND
        ├── If room is Wild/After Dark: "This room has 18+ content. Are you 18+?"
        │     └── [Yes, I'm 18+] → proceed
        │     └── [No] → redirect to homepage
        └── "What's your name?" (single text input, autofocus)
              └── Tap "Join"
                    └── Lobby — see other players, see vibe badge, wait for host
```

**Time target**: Under 15 seconds from scan to lobby.

---

### Flow 3: Guest Joins via Code

```
Visit friday.app (or open app)
  └── "Join a room" tab
        └── Type 4-letter code (large keypad, letter-only)
              └── If Wild/After Dark room → 18+ confirmation
                    └── "What's your name?"
                          └── Lobby
```

---

### Flow 4: Pick a Game (Party Games Prioritized)

```
Lobby (all players joined)
  └── Host taps "Pick a Game"
        └── Game Picker opens for all players simultaneously
              ├── PARTY GAMES shown first:
              │     ├── 🎯 Truth or Dare
              │     ├── 🫣 Never Have I Ever
              │     └── 🔥 Hot Takes / Most Likely To
              ├── CLASSIC GAMES shown second:
              │     └── 🃏 UNO
              └── Swipe right = want to play, swipe left = skip
                    └── Match found → "Everyone wants Truth or Dare!" → Start
                          (No match in 30s → "Most popular: Truth or Dare" → host confirms)
```

---

### Flow 5: Playing a Party Game (e.g. Truth or Dare)

```
Game starts
  └── "Who goes first?" — random player selected
        └── Active player sees: "🤔 Choose your path"
              ├── 💬 TRUTH → draws a truth card
              └── 💪 DARE → draws a dare card
                    └── Card revealed to ALL players simultaneously (with suspense animation)
                          ├── If After Dark card: brief content warning → confirm reveal
                          └── Active player completes or passes
                                ├── Complete → applause animation → next player's turn
                                └── Pass → drinks or takes penalty → next player's turn
                                      └── Drinking prompt: tap "🍺 Drink taken" to record (honor system)
                                            └── "⭐ Next!" button → rotate to next player
```

**Party game UI pattern (shared across all party games):**
- Large card/question in center of screen
- Timer bar (configurable: 15-60s per action)
- Reaction buttons at bottom: 😂 🔥 🫣 🥵
- "Skip Card" button (any player can request, host approves)
- "Done / Next" button to advance
- Drink counter in corner

---

### Flow 6: Playing Never Have I Ever

```
Game starts
  └── Card appears: "Never have I ever... sent a text to the wrong person"
        └── All players tap "I HAVE" if they've done it
              ├── Live counter: "3 have done this" (anonymous at first)
              └── After 5 seconds → reveal WHO tapped
                    └── Gasps/laughter → drinking prompt for those who did it
                          └── "Next card" button
```

---

### Flow 7: Playing Hot Takes / Most Likely To

```
Game starts
  └── Mode: Hot Takes
        └── Statement: "Pineapple belongs on pizza"
              └── All players tap 👍 Agree or 👎 Disagree (anonymous)
                    └── 3-2-1 countdown → reveal split
                          ├── "4 agreed, 2 disagreed"
                          └── Reveal WHO voted what
                                └── Minority drinks → "Next statement"

  ── OR ──

  └── Mode: Most Likely To
        └── "Who is most likely to hook up with someone tonight?"
              └── All players select a player (anonymous)
                    └── 3-2-1 countdown → reveal target
                          └── Voted player drinks → "Next round"
```

---

### Flow 8: Playing UNO (Adult Reskin)

```
Game starts (dark theme, cocktail-themed card backs)
  └── Each player sees their hand (cards face-down to others)
        └── Turn indicator: "Jake's turn" (everyone sees)
              └── Active player: tap a card to play
                    ├── Valid? → card played, animation, next turn
                    ├── Invalid? → card shakes, stays in hand
                    └── No valid card? → tap "Draw"
                          └── Drew a playable card? → option to play immediately
                                └── Repeat until someone empties hand
                                      └── Drinking variant: Draw 2 = drink 2 sips, Wild = everyone drinks
                                            └── Round ends → scoreboard → Play Again / Different Game
```

---

## New Screens (Party Games)

| Screen | Route | Description |
|---|---|---|
| Party Game | `/[code]/party` | Shared screen for Truth or Dare, NHIE, Hot Takes, WYR |
| Truth or Dare | `/[code]/party/tod` | Truth/dare picker, card reveal, completion flow |
| Never Have I Ever | `/[code]/party/nhie` | Statement display, tap-to-confess, reveal flow |
| Hot Takes | `/[code]/party/hottakes` | Voting, countdown, results reveal |

## Modified Screens (Adult Re-theme)

| Screen | Changes |
|---|---|
| Home | Vibe tier selector before room creation, darker aesthetic |
| Lobby | Vibe badge, player count shows "X of Y are 18+ confirmed", drink counter |
| Game Picker | Party games shown first, UNO as "Classic" |
| UNO Game | Darker card backs, cocktail action cards, drinking variant toggles |
| Scoreboard | Drink counter alongside score |

---

## Key UI Moments (Party Game Focus)

### Vibe Tier Badge
- Shown in lobby and during gameplay
- 🟢 Spicy = playful green, "Spicy" label
- 🟠 Wild = amber/orange, "Wild" label  
- 🔥 After Dark = deep red with flame icon
- Helps set expectations and builds FOMO for paid tiers

### Card Reveal Animation
- After Dark cards: slow flip with red glow
- Pause before reveal (half-second suspense)
- Confirm button for After Dark content: "This card contains explicit content. Show it?"
- Regular cards: smooth flip, no friction

### Truth or Dare Pick Screen
- Two large buttons filling the screen: 🟣 Truth / 🔴 Dare
- Background subtly shifts color based on pick
- Fun animation on selection (card flies in)

### Voting Countdown (Hot Takes / NHIE)
- "3... 2... 1..." countdown before reveal
- Creates suspense and group anticipation
- Reveal with animation (votes fly in one by one)

### Drinking Prompt
- After a drink action: "🍺 [Player] drinks!" toast
- Tap to confirm: "Drank it!" (honor system counter)
- Running drink tally shown in corner

### Age Gate
- Full-screen overlay on Wild/After Dark rooms
- "This room has 18+ content. Please confirm you are 18 or older."
- Two buttons: "Yes, I'm 18+" / "No, take me back"
- Stored in session storage (doesn't re-ask during same session)

---

## Empty States (Adult Focus)

| State | Message |
|---|---|
| Lobby, no players yet | "Share the code above — the more, the merrier (and spicier)" |
| Game Picker, no matches | "No matches yet — keep swiping! Find your Friday night vibe." |
| No After Dark content | "Want to turn up the heat? Unlock After Dark packs for the full experience." |
| No drinking configured | "Sober mode on? Games are still 🔥 without the booze." |

---

## Error States

| Error | Handling |
|---|---|
| Room not found | "This room has expired. Time for a new Friday night?" → Create new room |
| Room full | "This room is full. Ask the host to upgrade for more slots." |
| Connection lost | Banner: "Reconnecting..." → auto-rejoin on reconnect |
| Turn timeout | Auto-pass in party games, auto-draw in card games |
| After Dark content not purchased | Host sees: "This card is 🔥 After Dark. Unlock the full pack?" → purchase prompt |
