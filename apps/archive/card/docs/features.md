# Features — 18+ Adult Party Night App

## Core Features

### Instant Room Creation
- One tap → room live in under 2 seconds
- Auto-generated 4-letter room code (memorable, no numbers)
- QR code displayed full-screen for easy scanning
- Shareable link: `friday.app/FROG`
- Room auto-expires after 24h of inactivity
- **New**: Host sets the "vibe tier" when creating room (Spicy / Wild / After Dark)

### Guest Join (Zero Friction)
- No app install required for guests
- No account, no email, no password
- Visit link or scan QR → type a display name → in the lobby
- Works on any mobile browser (iOS Safari, Chrome, Firefox)
- PWA installable on home screen for repeat users
- Age verification prompt (tap "I am 18+") before entering room with Wild/After Dark content

### Live Lobby
- Real-time player list — see who joins as they join
- Player avatars (auto-assigned emoji or color)
- Host badge shown clearly
- Room code pinned at top for latecomers
- "Waiting for players..." state with animated dots
- Kick player option (host only)
- **New**: Vibe tier indicator shown in lobby (🟢 Spicy / 🟠 Wild / 🔥 After Dark)

### Game Picker
- Shown before every game starts
- All players vote simultaneously — swipe right to pick, left to skip
- First game everyone agrees on wins (Tinder-style matching)
- Timer: 30 seconds to vote, most-voted wins on timeout
- Shows which games are available in current tier
- **New**: Party games promoted first, UNO shown as "Classic" option

### In-Game Features
- Each player sees only their own hand (card games) or the shared question (party games)
- Turn indicator (whose turn it is, with timer)
- Action animations and reveal effects
- "It's your turn" haptic + visual alert
- Quick reaction emojis (😂 🔥 😤 👀 🥵 🫣) — tap to react
- **New (Party Games)**: Large question/card display, vote buttons, suspense timer

### Scoreboard
- Shows after every round
- Running total across all rounds in the session
- Winner highlighted with animation
- "Play Again" and "Different Game" options
- Session summary at the end: rounds played, total time, biggest win
- **New**: Drink counter (optional, honor system)

### Built-in Rules
- Tap "?" anywhere during a game → full rules sheet slides up
- Rules are specific to the current house rule configuration
- **New**: Content warnings for After Dark cards shown before reveal

### House Rules
- Per-game toggles before starting
- **New**: Vibe tier override (host can adjust mid-session)
- **New**: Drinking config (on/off, sip vs shot, max per round)
- Saved per host for future sessions

### Latecomer Join
- Players can join a room mid-game
- Joined as spectator first — watch the current round
- Auto-dealt in on next round (card games)
- Jump into party games immediately (no rounds in party games)
- No disruption to the current game

### Spectator Mode
- Join a room without playing
- Watch all cards face-up (spectator privilege)
- React with emojis
- **New**: Can vote in party games (results shown separately)

---

## Host Features

### Room Management
- Pause game (host only)
- Remove a player mid-game
- Transfer host role to another player
- Change house rules and vibe tier between rounds
- End session early
- **New**: Skip current question/card (party games)
- **New**: Set drinking limits (max drinks per player)

### Persistent Group (v2)
- Save a group of friends by name (e.g. "Friday Crew")
- One-tap "Friday tonight?" notification sent to the group
- Group members get push notification with join link
- Group stats: total sessions, most played game, all-time winner, most controversial takes

### Game History (v2)
- Log of past sessions: date, who played, what was played, who won
- Filterable by player or game
- Shareable session recap card (image, for stories/messages)
- **New**: "Best moments" highlight reel (most controversial vote, wildest truth)

---

## Party Game Features (18+ Focus)

### Shared Content Engine
All party games use a unified content database with:
- Category filtering (e.g. "Sex & Dating", "Embarrassing Moments", "Fantasy")
- Vibe tier filtering (Spicy / Wild / After Dark)
- Skip card (any player can request skip, host confirms)
- Content flagging (tap to report offensive content)
- Smart shuffle (recently seen cards deprioritized)

### Truth or Dare
- 400+ truths and 200+ dares across Spicy/Wild/After Dark tiers
- Player picks Truth or Dare → card revealed to ALL simultaneously (no reading alone)
- Categories: Spicy Secrets, Relationship Questions, Fantasies, Physical Challenges, Social Dares, Drinking Challenges
- Pass mechanic: configurable (drink, penalty point, silly task)
- After Dark tier: explicit sexual truths, wild dares (intimate, revealing clothing, public acts)
- Truth categories: "What's your biggest fantasy?", "Have you ever cheated?", "Who in this room would you...?"
- Dare categories: "Do your best striptease for 15 seconds", "Text your ex", "Take a body shot off someone"

### Never Have I Ever
- 400+ statements across all tiers
- Players tap if they HAVE done it → everyone sees who did (anonymized count first, then reveal)
- Categories: Sex & Dating, Travel Misadventures, Illegal Stuff (minor), Embarrassing Moments, Food Crimes, Tech Confessions
- After Dark tier: explicit sexual experiences, fetish confessions
- Drinking variant: Drink if you've done it
- Smart shuffle: prioritizes cards nobody has done (more interesting reveals)

### Hot Takes / Most Likely To
- 300+ prompts across all tiers
- Two modes:
  - **Hot Takes**: Agree/Disagree vote → reveal split → debate timer
  - **Most Likely To**: "Who is most likely to..." → anonymous vote → reveal target
- After Dark tier: Sexually charged takes, relationship hot takes
- Drinking variant: Minority drinks (Hot Takes), Voted player drinks (Most Likely To)

### Would You Rather (Phase 2)
- 300+ dilemmas
- Vote simultaneously → reveal split → discussion timer
- After Dark tier: Sexually explicit dilemmas
- Drinking variant: Minority vote drinks
- Categories: Spicy, Wild, Philosophical, After Dark

### Paranoia / Truth or Drink (Phase 2)
- Target player selected → others submit anonymous questions → target answers or drinks
- 200+ question prompts for inspiration
- Questions go through a "taste filter" (configurable intensity)

### You Laugh, You Drink (Phase 2)
- 150+ challenge cards (impressions, faces, jokes, accents)
- 30-second timer per challenge
- Target must stay stone-faced or drink

### Drunk, Stoned or Stupid (Phase 2)
- 200+ toxic trait cards
- Judge reads the card → group assigns to someone → judge confirms
- First to 7 cards loses (drinks the "loser shot")

### Socials / Drinking Card Game (Phase 2)
- Digital version of the classic drinking card game
- Each card flip triggers an action
- Auto-calculates and tracks drinks

### Spin the Bottle (Phase 3)
- Virtual bottle spin → selects pair → action card drawn
- 100+ action cards (configurable intensity)
- From mild (truth question) to explicit (dares for the pair)

---

## Drinking Engine (Cross-Game Feature)

### Actions
- **Sip**: One drink of your beverage
- **Shot**: Finish your current drink
- **Assign**: Choose someone to drink (or split among multiple people)
- **Waterfall**: Everyone drinks until the person to their right stops
- **Group shot**: Everyone takes a shot
- **Custom**: Host-configurable actions

### Configuration
- Sip vs shot mode (toggle)
- Max drinks per round (safety)
- "Play dry" mode (replaces drinking with penalty points)
- Drink tracking (honor system, players tap to record)

### Safety
- Configurable drink limits per player
- Host can disable drinking for specific players
- "Play dry" always available as a room setting
- Water break reminders every 30 minutes
- No drink shaming — "it's always ok to pass"

---

## Notification Features (v2)

- "Friday tonight?" group ping
- "Your turn" in-game push notification (if app is backgrounded)
- "Game starting in 2 minutes" lobby countdown alert
- Weekly nudge: "You haven't played in 2 weeks — Friday plans?"

---

## Accessibility & Safety

- High contrast mode
- Large text option
- **Age gate**: All guests must confirm 18+ to enter rooms with Wild/After Dark content
- **Content warnings**: After Dark cards show a brief warning before content is revealed
- **Flag system**: Any player can flag offensive content (removed from rotation after 3 flags)
- **Block list**: Hosts can block specific content categories
- **Report player**: Report inappropriate behavior in-game
- Screen reader support for hand and game state
- Haptic feedback for turns and wins
