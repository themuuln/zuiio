# Game Library — 18+ Adult Party Night Focus

## Content Tier System

All party games use a **tiered content system** so the host can set the vibe:

| Tier | Tag | Vibe | Example Content |
|------|-----|------|----------------|
| 🟢 Spicy | `spicy` | Flirty, cheeky | "Have you ever sent a text you regretted?" |
| 🟠 Wild | `wild` | Raunchy, revealing | "Most scandalous place you've hooked up?" |
| 🔥 After Dark | `after-dark` | No limits, explicit | Paid pack — intended for close friend groups |

Free tier includes Spicy content. Wild is free but filtered. After Dark is a paid pack.

---

## Drinking Engine (Cross-Game Feature)

Every party game integrates with a shared drinking engine:
- **Drink**: Take a sip
- **Shot**: Finish a drink
- **Assign**: Choose someone to drink
- **Waterfall**: Everyone drinks until the person to your right stops
- **Group shot**: Everyone takes a shot together
- **Custom**: Host-configured (e.g. "loser does a keg stand")

Players can play "dry" too — drinking is replaced with penalty points or silly tasks.

---

## Party Games (Priority — Adult Focus)

### Truth or Dare ⭐ (Phase 1)
- **Players**: 3–20
- **Duration**: Open-ended
- **Mechanic**: Active player picks Truth or Dare → card revealed to all → complete or pass (drink/penalty)
- **Truth categories**: Spicy secrets, embarrassing stories, relationship questions, fantasies, regrets
- **Dare categories**: Physical challenges, social dares, embarrassing acts, drinking challenges
- **Content**: 400+ truths and 200+ dares across all tiers (Spicy, Wild, After Dark)
- **Pass mechanic**: Drink OR earn a penalty point (configurable)
- **End condition**: Play until bored or set round limit

### Never Have I Ever ⭐ (Phase 1)
- **Players**: 3–20
- **Duration**: Open-ended
- **Deck size**: 400+ statements across all tiers
- **Mechanic**: Statement shown → players tap if they HAVE done it → everyone sees who did
- **Content categories**: Sex & dating, travel adventures, illegal stuff (minor), embarrassing moments, food crimes, tech confessions
- **Drinking variant**: Drink if you have done it
- **End condition**: Play freely or set round limit

### Hot Takes / Most Likely To ⭐ (Phase 1)
- **Players**: 3–20
- **Duration**: 20–40 min
- **Two modes**:
  - **Hot Takes**: Controversial statement → everyone taps Agree/Disagree → reveal split → debate
  - **Most Likely To**: "Who is most likely to..." → everyone votes anonymously → reveal the target
- **Content**: 300+ prompts across all tiers
- **Drinking variant**: The person voted "Most Likely To" drinks
- **End condition**: Predetermined rounds, "Most Controversial Take" / "Most Voted Player" shown at end
- **Examples**: "Who is most likely to hook up with someone tonight?", "Pineapple belongs on pizza"

### Would You Rather (Phase 2)
- **Players**: 3–20
- **Duration**: Open-ended
- **Deck size**: 300+ dilemmas
- **Decks**: Spicy, Wild, Philosophical, After Dark (paid pack)
- **Mechanic**: Two options → everyone votes simultaneously → reveal split → 60s discussion
- **Drinking variant**: Losers (minority vote) drink
- **End condition**: Set round count or play freely

### Paranoia / Truth or Drink (Phase 2)
- **Players**: 3–12
- **Duration**: Open-ended
- **Mechanic**: A player is selected as target → others submit anonymous questions → target answers truthfully OR drinks
- **Content**: 200+ question prompts
- **Best for**: Close friend groups who want real revelations
- **Variant**: "Spill or Shot" — answer honestly or take a shot

### You Laugh, You Drink (Phase 2)
- **Players**: 4–12
- **Duration**: 15–30 min
- **Mechanic**: Active player draws a challenge card → 30 seconds to make their target laugh → if target laughs, target drinks. If target stays stone-faced, challenger drinks.
- **Challenge categories**: Impressions, stupid faces, dad jokes, physical comedy, accents
- **Content**: 150+ challenge cards

### Drunk, Stoned or Stupid (Phase 2)
- **Players**: 4–12
- **Duration**: 20–40 min
- **Mechanic**: One player is judge → draws a card describing a toxic trait → group decides who fits best → judge makes final call → that player gets the card
- **Content**: 200+ trait cards (e.g. "Has 20-minute conversations with Siri", "Always wants to play stupid card games")
- **End condition**: First player to collect 7 cards loses (and drinks)

### Socials / Drinking Card Game (Phase 2)
- **Players**: 3–12
- **Duration**: 15–25 min per round
- **Mechanic**: Cards dealt face-down in field → players flip one at a time → each card triggers a drinking action
- **Card mapping**: Ace = sip, 2-3 = sips, 4-8 = assign sips, 9 = everyone sips, 10 = thumb master, Jack = finish drink, Queen = someone finishes, King = waterfall, Joker = everyone finishes
- **Digital enhancement**: Auto-calculates sips, animations for each card type

### Spin the Bottle (Phase 3)
- **Players**: 4–16
- **Duration**: Open-ended
- **Mechanic**: Virtual bottle spin → selects two players → action card drawn (kiss, dare, drink, truth)
- **Content**: 100+ action cards for the pair
- **Vibe tier**: Configurable from mild to explicit

### Untested / Custom Game Mode (Phase 3)
- **Players**: 3–20
- **Mechanic**: Host writes their own questions/dares → game uses custom deck
- **Use case**: Inside jokes, group-specific content, recurring Friday night traditions

---

## Card Games (Keep but deprioritize)

### UNO ⭐ (Phase 1 — already built)
- Mature theme reskin: darker colors, cocktail imagery, no-holds-barred action names
- Drinking variant: Draw 2 = drink 2 sips, Wild = everyone drinks, Skip = skipped player drinks
- Keep the existing engine, add adult visual theme toggle

### Poker — Texas Hold'em (Phase 3+)
- Drinking variant: Chips replaced with drinks, bad beats = drink

### Blackjack (Phase 3+)
- With drinking mechanics: bust = drink, blackjack = dealer drinks

---

## Game Selection Logic

When Game Picker is used:
1. Filter games by player count (auto-remove games that don't fit)
2. Show remaining games as swipe cards
3. Collect votes for 30 seconds
4. If mutual match found → start that game
5. If no match → show top-voted game, host confirms

Games are tagged:
- `quick` — under 20 min
- `strategic` — requires thinking
- `drinking` — integrates drinking mechanics
- `question` — question/answer based
- `dare` — physical/social challenges
- `after-dark` — explicit content (requires unlock)
- `no-drink` — works well dry too
- `card-game` — traditional card game mechanics
- `team` — requires even teams
