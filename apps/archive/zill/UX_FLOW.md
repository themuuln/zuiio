# Zill UX — Interactive Self-Selection Model

## Core Insight

**Equal split is wrong ~60% of the time.** In real Mongolian group meals:
- Someone doesn't drink → shouldn't pay for alcohol
- Someone ordered the expensive steak → should pay more
- Shared appetizers → split equally among those who ate
- Birthday person → excluded from everything
- "I only had water" → should pay minimal

The payer shouldn't be the one tracking all this. **Each person knows what they consumed.** Let them self-select.

### Architecture Philosophy

**Lightweight-to-the-bone.** No auth. No accounts. No database users table. The app is a PWA shell that syncs via Supabase anonymous sessions. Identity is a name + emoji stored in localStorage. Cross-device memory comes from optional phone number sync — tap "Миний утасны дугаар" once, and all your splits, preferences, and streaks follow you across devices via a phone-number-keyed lookup. No passwords. No email verification. No OAuth.

### User Identity Model (LIGHTWEIGHT)

**No auth. No accounts.** Identity is local-first:

| Layer | How | Persists |
|-------|-----|----------|
| Device identity | Name + emoji in localStorage | This device only |
| Phone sync (optional) | Phone number key → Supabase lookup | Cross-device |
| Preferences | Stored by phone number or device ID | Follows user |
| Split history | Keyed to participant name in each split | Per-split, not per-user |

**How it works**:
1. First open: enter your name, pick an emoji avatar → saved to localStorage
2. That name+emoji auto-fills when you're added to future splits as a participant
3. Tap "Миний утасны дугаар" once → enter phone number → all your device-local data syncs to Supabase keyed by phone
4. Open Zill on another device → enter same phone number → preferences, streaks, history follow
5. **No verification code. No password.** Phone number is just a lookup key — not auth.

**Why no auth**: In Mongolian social context, the link is shared in a private Messenger group. You already know who's at the table. Auth would kill the one-tap PWA viral advantage. Identity mistakes are solved socially ("би биш, Ганаа байна") not technically.

### Psychology Foundation

This flow is designed around five behavioral principles that make Zill habit-forming:

| Principle | How it manifests | Why it works |
|-----------|-----------------|--------------|
| **IKEA Effect** | Each person selects their own items | Effort invested → ownership felt → higher satisfaction |
| **Goal-Gradient** | "2/4 хүн сонгосон" live counter | People accelerate as they approach completion |
| **Zeigarnik Effect** | "Төлөөгүй 22,000₮" nags at memory | Uncompleted tasks create tension → return to resolve |
| **Peak-End Rule** | Delightful animation when all confirm + satisfying zero-debt screen | People judge the experience by its peak and its end |
| **Default Effect** | Shared items pre-selected, preferences remembered | Friction reduction → higher completion rate |

---

## The Full Flow

### Phase 0: Home Screen (2 paths)

```
┌─────────────────────────────────┐
│  Zill                           │
│                                 │
│  🔥 5 дараалсан сарлааг         │  ← streak (gamification)
│     хуваалаа!                   │
│                                 │
│  ┌─────────────────────────────┐│
│  │  🧾 Шинэ сарлага            ││  ← main CTA: OCR + itemize
│  │  Баримтаа зургаа авахуул   ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  ⚡ Тэнцүү хуваах           ││  ← fast path: one-tap equal split
│  │  Нийт дүнгээ оруулаад яв   ││     for the 40% simple cases
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  💸 Зөвхөн өр тэмдэглэх    ││  ← IOU mode: "би чамд өгсөн"
│  │  Нэг хүн, нэг дүн          ││
│  └─────────────────────────────┘│
│                                 │
│  📋 Идэвхтэй сарлагууд (3)      │  ← active sessions
│  ├─ 🟡 Хангай (2/4 сонгосон)   │
│  ├─ 🟢 БД's (бүгд баталгаажуулсан)│
│  └─ 🔴 Наран (1 төлөөгүй)      │
│                                 │
│  📊 Миний түүх                  │
│  ├─ Нийт хуваасан: 47 сарлага  │
│  └─ Хамгийн их хамтардаг: Ганаа│
└─────────────────────────────────┘
```

**Psychology**: Offer all three entry modes immediately — Hick's Law says limit to 3 options for fastest decision. The active-sessions list creates Zeigarnik tension (unfinished splits pull you back).

---

### Phase 1: Create Expense (OCR or manual)

> ⚠️ **Technical dependency**: Mongolian receipt OCR is non-trivial. Thermal paper, Cyrillic Mongolian, inconsistent formatting. Before building this UI, validate OCR feasibility with Google Cloud Vision (has Mongolian support) or a custom fine-tuned model on real Mongolian receipts. Fallback: manual entry with smart autocomplete from your item history.

**User enters receipt items (not just total):**

```
┌─────────────────────────────────┐
│  Хангай Ресторан                │
│  2026-05-26                     │
│                                 │
│  [✅ хуваалцах] Хуушуур 8,000₮ │  ← tap tag to toggle
│  [👤 хувийн]     Цуйван  12,000₮│     shared / individual
│  [🍺 архи]       Шар айраг 25,000₮│   ← alcohol tag → auto-uncheck
│  [✅ хуваалцах]  Салад   10,000₮│     for non-drinkers later
│  [👤 хувийн]     Ус       3,000₮│
│  [🧑‍🍳 үйлчилгээ] Үйлчилгээ 5,000₮│  ← always shared, all participants
│                                 │
│  ──────────────────────────     │
│  НИЙТ:               63,000₮  │
│                                 │
│  👤 Төлсөн: Баяр                │
│     [+ өөр төлөгч нэмэх]       │  ← multi-payer support
│  👥 Хүмүүс:                    │
│     📱 Оюунаа   📱 Ганаа        │
│     📱 Золбоо   [+ нэмэх]      │
│                                 │
│  [ ⚡ Тэнцүү хуваах ]  [ ✏️ Засах ]  [ 📨 Хуваалцах → ]
└─────────────────────────────────┘
```

**Tag system per item:**
- **Shared (✅ хуваалцах)** — split equally among all who select it. Default for this restaurant's past items.
- **Individual (👤 хувийн)** — assigned to one person. Default for single-portion items.
- **Alcohol (🍺 архи)** — auto-untoggled for people flagged as non-drinkers. Respects dietary preferences.
- **Service charge (🧑‍🍳 үйлчилгээ)** — always split among all participants. Cannot be unselected.

**Unselected item rule**: If an individual item is not claimed by anyone, **the payer absorbs it by default** (they were there, they can dispute). The payer sees a flag on the review screen: "⚠️ 1 зүйл сонгогдоогүй: Ус 3,000₮" and can reassign. This prevents the perverse incentive where the payer tags everything "shared" to offload costs — tagging something "individual" means you take responsibility if nobody picks it.

**Psychology**: Default Effect — tags pre-fill based on item type and past behavior for this restaurant. The payer's cognitive load drops with each auto-filled tag. The "Тэнцүү хуваах" button is always visible as the escape hatch (respects Hick's Law — don't force complex flow on simple cases).

---

### Phase 2: Generate Share Link

User taps "📨 Хуваалцах" → creates session → generates unique link.

```
                        ┌───────────────────────────────┐
   Session Created      │                               │
       online           │  📨 "Зилл: Хангай Ресторан   │
   ┌───────────────┐    │     Нийт: 63,000₮            │
   │ Supabase      │    │     Төлсөн: Баяр             │
   │ Realtime      │    │                               │
   └───────┬───────┘    │     Юу идсэнээ сонго 👇       │
           │            │     zill.mn/s/7kxp2q9n        │
   Push notification    │                               │
   to all participants  │     [ 📋 Хуулах ]  [ 📲 share ]│
   (if they have app)   └───────────────────────────────┘
```

Two distribution paths:
1. **App installed**: deep link `zill://split/7kxp2q9n` + push notification with collapsed preview
2. **No app**: web link `zill.mn/s/7kxp2q9n` → PWA-capable landing page

**Psychology**: Fogg Model (B=MAT) — maximize Ability by removing app-install barrier. Maximize Prompt via share sheet integration. Motivation is built in (you owe someone money and want to be fair).

**Session properties:**
- Auto-expires after 7 days of inactivity (sends reminder at day 3, day 6)
- Payer can "resurrect" an expired session from history
- **Per-participant item locking**: once a participant confirms, their selected items lock. Payer can still edit items that NOBODY has confirmed yet. If payer edits an item someone already confirmed → all affected participants get notified "сонголтоо шалгана уу" and must re-confirm.
- **Delete/cancel**: payer can delete a split at any time from the "..." menu. Deleted splits notify all participants and disappear.

**Link security (lightweight):**
- IDs are **UUIDv4** (e.g., `7kxp2q9n-4f3a-...`), not sequential. Unguessable.
- Optional toggle on create: "🔒 Зөвхөн уригдсан хүмүүс" (invite-only). When on, only the named participants can open the link. Others see "Та энэ сарлагад уригдаагүй байна." Off by default.
- Link never contains payer-sensitive data — just a session ID.

---

### Phase 3: Each Person Opens the Link

> **Payer skips this phase.** The payer's own selections are auto-filled from Phase 1 tags: shared items pre-checked, individual items assigned to payer. Payer sees their selection screen immediately after Phase 2 (same UI as Phase 3b but with "Та төлөгч" badge and no identity select).

**Step 3a: Identity selection (non-payer participants)**

```
┌─────────────────────────────────┐
│  Хангай Ресторан                │
│  Огноо: 2026-05-26             │
│  Төлсөн: Баяр                  │
│                                 │
│  🔵 Чи хэн бэ?                  │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 📱 Оюунаа                    ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 📱 Ганаа                     ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 📱 Золбоо                    ││
│  └─────────────────────────────┘│
│                                 │
│  2/4 хүн сонголтоо хийсэн       │  ← Goal-Gradient: triggers
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │     social proof + FOMO
└─────────────────────────────────┘
```

**After tapping a name → quick confirmation (anti-mistake):**

```
┌─────────────────────────────────┐
│                                 │
│  📱 Чи Оюунаа мөн үү?           │
│                                 │
│  [ ✅ Тийм, би байнаа ]        │
│  [ 🔙 Буруу хүн ]              │
│                                 │
└─────────────────────────────────┘
```

No PIN. No auth. Just a one-tap "yes that's me" — catches the most common mistake (someone fat-fingers the wrong name next to theirs) without adding friction.

**Step 3b: Item selection**

```
┌─────────────────────────────────┐
│  Сайн уу, Оюунаа! 👋            │
│                                 │
│  Чи юу идсэнээ сонго:          │
│                                 │
│  [✅] Хуушуур (хос)   8,000₮  │  ← pre-selected: shared item
│  [  ] Цуйван          12,000₮  │
│  [  ] Шар айраг х5    25,000₮  │  ← grayed out: non-drinker
│  [✅] Салад           10,000₮  │     (respects preference)
│  [  ] Ус               3,000₮  │
│  [🔒] Үйлчилгээ        5,000₮  │  ← locked: always split
│                                 │
│  ──────────────────────────     │
│                               │
│  Таны дүн:         9,000₮     │  ← live calculation, no rounding
│  (Салад ½ = 5,000 +           │     yet (rounding is Phase 5)
│   Үйлчилгээ ¼ = 1,250 +       │
│   Хуушуур ¼ = 2,000)          │
│                               │
│  ──────────────────────────     │
│  Миний сонголт:                 │
│  ☑️ Хуушуур (хос)             │
│  ☑️ Салад                       │
│  ☑️ Үйлчилгээ                   │
│                               │
│  [ 🧂 Хадгалах ]  [ ✅ Баталгаажуулах ]
│  (дараа үргэлжлүүлэх)  (дуусгах)      │
└─────────────────────────────────┘
```

**Key behaviors:**
- **Shared items pre-selected** (Default Effect) — user unchecks what they didn't eat
- **Non-drinker flag respected** — alcohol items grayed out with label "та архи уухгүй"
- **Service charge locked** — always included, can't uncheck
- **"Хадгалах" saves progress**, "Баталгаажуулах" submits final
- Selected items summarized at bottom (Commitment-Consistency: seeing your own list reinforces the choice)

**Psychology**: Commitment-Consistency chain — selecting identity → seeing pre-filled items → adjusting → confirming. Each micro-commitment makes the next one easier. The IKEA Effect kicks in: "I built this split myself, it's fair."

---

### Phase 3c: Privacy Model

**Default: selections are PRIVATE.** Nobody sees what anyone else selected until everyone has confirmed.

```
┌─────────────────────────────────┐
│  🔒 Сонголтууд нууц             │
│                                 │
│  2/4 хүн баталгаажуулсан        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                 │
│  Бүгд дууссаны дараа дүн гарна │
│                                 │
│  (Session creator: Баяр can    │
│   toggle privacy per session)   │
└─────────────────────────────────┘
```

**Why private by default**: Removes social embarrassment. Оюунаа can quietly uncheck the expensive steak without Ганаа knowing. The payer sees aggregated totals only — not individual line items — until all confirm.

**Session-level privacy toggle** (payer sets when creating):
- `🔒 Нууц` (default) — selections hidden until all confirm. Then reveal simultaneously with celebration animation.
- `👁 Нээлттэй` — real-time visible. Good for close friend groups who joke about what each person ordered.

---

### Phase 4: Payer Review Gate (NEW)

After all participants confirm (or at any point, the payer can check):

```
┌─────────────────────────────────┐
│  👀 Баяр, шалгах цаг            │
│                                 │
│  3/4 хүн баталгаажуулсан        │
│  (Золбоо хараахан сонгоогүй)   │
│                                 │
│  📊 Нийт дүн:      63,000₮    │
│  📊 Сонгогдсон:     54,750₮    │  ← if unlocked, payer can
│  📊 Үлдэгдэл:        8,250₮    │     see who claimed what
│                                 │
│  ┌─────────────────────────────┐│
│  │ Золбоо руу сануулах         ││  ← one-tap nudge (not nag)
│  │ "Захисан байна ш дээ 😄"    ││     friendly emoji
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ Бүгдийг нээх                ││  ← override: payer can unlock
│  │ (бүгд баталгаажаагүй ч     ││     if waiting too long
│  │  одоо хуйлрах)              ││
│  └─────────────────────────────┘│
│                                 │
│  [ 🔙 Буцах ]  [ ⏳ Хүлээх ]
└─────────────────────────────────┘
```

**Payer powers:**
- See aggregated status (who's done, who's pending)
- Send a gentle nudge (one-tap, pre-written friendly message)
- Force-unlock if someone is unreachable ("Бүгдийг нээх")
- Dispute an individual selection only AFTER all confirm (via the final screen, not here — payer doesn't micromanage)

**Psychology**: Nudge Theory — reminder is friendly ("захиа" = casual), not demanding. The payer has control (Reciprocity: I paid, I get to review), but the design discourages micromanagement by hiding individual selections until the end.

---

### Phase 5: Logic Engine (Auto)

When all confirm (or payer force-unlocks) — this runs automatically, no UI:

```
Total: 63,000₮ (Payer: Баяр)

Items self-selected (shared items divided among selectors):
  Оюунаа → Цуйван 12,000₮ + Салад (selected by 2) 5,000₮ +
            Үйлчилгээ (all 4) 1,250₮ = 18,250₮
  Ганаа   → Хуушуур (selected by 2) 4,000₮ +
            Шар айраг (selected by 2) 12,500₮ +
            Үйлчилгээ (all 4) 1,250₮ = 17,750₮
  Золбоо  → Хуушуур (selected by 2) 4,000₮ +
            Шар айраг (selected by 2) 12,500₮ +
            Үйлчилгээ (all 4) 1,250₮ = 17,750₮
  Баяр    → Ус 3,000₮ + Салад (selected by 2) 5,000₮ +
            Үйлчилгээ (all 4) 1,250₮ = 9,250₮
                                          ──────
  Total confirmed:                        63,000₮ ✓
```

**Shared item rule**: Split equally among **selectors** for that item, not all participants. If only 1 person selects a shared item → they get 100%. If 3 people select → each gets ⅓.

---

### Phase 5.5: Reveal & Celebrate (Peak-End Rule)

```
┌─────────────────────────────────┐
│      ✨                         │
│   ┌─────────────────────────┐   │
│   │    🎉 БҮГД БЭЛЭН!       │   │  ← Mongolian-themed
│   │  Хангай Ресторан        │   │     micro-animation
│   │  сарлага хуваагдлаа     │   │
│   └─────────────────────────┘   │
│                                 │
│  (1 sec delay — animation)      │
│                                 │
│  ← transitions to Phase 6 →     │
└─────────────────────────────────┘
```

**Psychology**: Peak-End Rule — the confirmation moment is the "peak" of the experience. A 1-second celebration animation with Mongolian design motifs (ger patterns, blue sky motif) makes the moment memorable. This tiny delight is disproportionate to its implementation cost — it's what people remember and tell friends about.

---

### Phase 6: Rounding & Settlement

**Step 6a: Rounding**

```
┌─────────────────────────────────┐
│  Хуйлрах — дугуйлах             │
│                                 │
│  ┌─────────┬────────┬──────────┐│
│  │  Яг     │ 500₮   │ 1,000₮  ││  ← tap rounding unit
│  └─────────┴────────┴──────────┘│
│                                 │
│  Оюунаа:  18,250₮ →  18,000₮  │
│  Ганаа:   17,750₮ →  18,000₮  │  ← all rounded
│  Золбоо:  17,750₮ →  18,000₮  │
│  Баяр:     9,250₮ →   9,000₮  │
│                                 │
│  Зөрүү: 0₮ (тэнцсэн!)          │  ← when it naturally balances
│  Эсвэл: +250₮ (илүү — Баярт)   │  ← rounding surplus goes to payer
│  Эсвэл: -250₮ (дутуу — Баяр    │  ← rounding deficit: payer absorbs
│               нөхнө)             │     (cultural norm: payer = host)
│                                 │
│  [ 🔙 Буцах ]  [ ✅ Хуйлрах ]
└─────────────────────────────────┘
```

Default rounding: 500₮ (matches Mongolian cash reality — 500₮ is the smallest practical note).

**Undo window**: After tapping "✅ Хуйлрах", a 2-minute undo banner appears:

```
┌─────────────────────────────────┐
│  ⚠️ Хуйлралт хийгдлээ           │
│  [ ↩️ Буцаах (1:42)]           │  ← countdown timer
│                                 │
│  (Автоматаар хаагдана)          │
└─────────────────────────────────┘
```

After 2 minutes or first person marks paid → undo disappears. This prevents fat-finger rounding errors without adding persistent UI clutter.

**Step 6b: Multi-payer settlement**

If multiple payers:
```
│  Баяр төлсөн:  45,000₮          │
│  Ганаа төлсөн:  18,000₮          │
│                                 │
│  Оюунаа → Баярт:  12,000₮      │
│  Оюунаа → Ганаад:   6,000₮      │
│  Ганаа  → Баярт:   5,500₮      │
│  Золбоо → Баярт:  13,000₮      │
│  Золбоо → Ганаад:   5,000₮      │
│                                 │
│  Net: Оюунаа: 18,000₮ (2 төлөгч рүү) │
```

---

### Phase 7: Final View & Settlement

```
┌─────────────────────────────────┐
│  Хангай Ресторан                │
│  2026-05-26 · 63,000₮          │
│                                 │
│  📱 Оюунаа → Баярт             │
│     18,000₮                     │
│     [  ❌ Төлөөгүй  ]          │  ← tap to mark paid
│     [ 💳 QR харуулах ]         │  ← show payer's bank QR
│                                 │
│  📱 Ганаа → Баярт              │
│     18,000₮                     │
│     [  ✅ Төлсөн  ]             │  ← visual confirmation
│     Төлсөн: өчигдөр 14:23      │
│                                 │
│  📱 Золбоо → Баярт             │
│     18,000₮                     │
│     [  ❌ Төлөөгүй  ]          │
│                                 │
│  📱 Баяр (таны акк)             │
│     Төлөх дүнгүй                 │
│                                 │
│  ──────────────────────────     │
│  2/3 төлсөн · 1 үлдсэн         │  ← Goal-Gradient on settlement too
│  Нийт үлдэгдэл: 18,000₮        │
│                                 │
│  [ 📨 Сануулах ]   [ 📊 Дэлгэрэнгүй ]  [ 🧾 Хаах ]
│     (Золбоо руу)
└─────────────────────────────────┘
```

**Settlement actions:**
- **Tap a person row** → expand to show breakdown (which items they claimed)
- **"Төлөөгүй" tap** → mark as paid (both payer and debtor can do this)
- **"💳 Шилжүүлэх"** → opens options:
  - **Утасны дугаараар**: Mongolian banks (Хаан, Голомт, Хас) support phone-number transfers. If payer saved their phone number, Zill shows the transfer flow with payer's phone number — no bank account exposure.
  - **QR код**: Fallback for banks requiring account number QR. **Shown on-demand per person, not globally.** Only the person who taps it sees it.
- **"Сануулах"** → one-tap gentle reminder with pre-written message: "Захисан байна ш дээ 😄"
- **Partial payment**: Tap "Төлөөгүй" → enter partial amount → status becomes 🟡 "Хэсэгчилсэн 10,000/18,000₮"

**Psychology**: The settlement screen is the "end" of the Peak-End Rule. The ✅ paid markers create social proof that others have paid. The "2/3 төлсөн" counter triggers Goal-Gradient for the remaining debtor. The gentle nudge ("захиа") prevents the payer from having to send an awkward personal message — the app handles it.

---

### Phase 8: Lifecycle & Follow-up

```
┌─────────────────────────────────┐
│  🧾 Сарлага дууслаа!            │
│                                 │
│  Таны статистик:                │
│  ├─ Энэ сард: 3 сарлага        │
│  └─ Өмнөхтэй харьцуулахад:     │
│     дундаас бага 💪             │
│                                 │
│  [ 📊 Бүрэн тайлан ]           │
│  [ 🏠 Нүүр хуудас ]            │
└─────────────────────────────────┘
```

**Post-settlement lifecycle:**
- Closed splits move to "Дууссан" archive
- Stats update (streak counter, monthly average spend, most-shared-with friend)
- Auto-suggests: "Ганаатай дахиад сарлага хийх үү?" (peer comparison, frequency pattern)
- 7 days after settlement: if any debts unpaid, final auto-reminder

**Psychology**: The stats feed the Endowment Effect — the more history you accumulate, the more invested you become in the app. Streak counters (🔥) create loss aversion around breaking your streak.

---

## Confirmation-Change Flow (NEW)

### Before final confirmation ("Баталгаажуулах" NOT yet pressed)

```
User has saved selections but hasn't confirmed:
  → Can freely add/remove items
  → "Хадгалах" auto-saves every change (no explicit save button needed)
  → If they close the page, selections persist
  → Reopening the link restores their last saved state
```

### After confirmation but before payer locks

```
User already confirmed ("Баталгаажуулсан") but payer hasn't locked yet:
  → See their confirmed selections (read-only with "Буцаах" button)
  → "Буцаах" = un-confirm → can re-edit → re-confirm
  → Payer gets notified: "Оюунаа сонголтоо өөрчиллөө"
```

### After payer locks (all confirmed + payer finalized)

```
Locked means: payer clicked "Хуйлрах" (Phase 6)
  → All selections are frozen
  → No changes possible
  → Disputes go through direct message (design choice: app doesn't mediate post-lock disputes)
```

### Payer can force-unlock at any time

```
From Phase 4 (review gate):
  → "Бүгдийг нээх" = unlock and finalize
  → All participants notified: "Баяр сарлагыг хаасан"
  → Missing person's items remain unselected (payer absorbs their share)
```

---

## Edge Case Handling (Updated)

### 1. ShareFood equivalent — "I didn't eat anything"

```
User selects NO items → amounts to service charge only
→ "Зөвхөн үйлчилгээний төлбөр: 1,250₮"
→ If user explicitly opts out of service charge too: "0₮ — та энэ сарлагад оролцоогүй"
   (requires payer approval in review gate)
```

### 2. Same item claimed by multiple people

```
Two people claim "Цуйван 12,000₮" (individual item)
→ System flags on payer review screen: "⚠️ Цуйванг 2 хүн сонгосон"
→ Payer resolves: [Ганаа] [Золбоо] [Хоёулаа]
   - Assign to one person → they get 100%
   - "Хоёулаа" → 6,000₮ each (auto-split equally between selectors)

For shared items: automatic — split among selectors. No conflict.
```

### 3. Shared items (platters, shared dishes)

```
Item marked "✅ хуваалцах":
→ Pre-selected for all participants (Default Effect)
→ Each person can uncheck: "Би идээгүй"
→ Split equally among remaining selectors
→ If nobody selects: item cost goes to payer (they ordered it and can dispute)
→ If 1 person selects: that person gets 100% (fair — they ate the whole thing)
```

### 4. Someone joins late

```
After link was shared, add person:
  Payer → "Шинэ хүн нэмэх" → enters name/phone
  → New person gets the link
  → Previous selections preserved
  → New person selects from scratch
  → Shared items auto-recalculated (service charge now split N+1 ways)
  → All previous selectors notified: "Шинэ хүн нэмэгдлээ. Таны дүн өөрчлөгдсөн эсэхийг шалгана уу"
```

### 5. Multiple payers

```
Two people paid (Баяр paid food 45,000₮, Ганаа paid drinks 18,000₮)
→ Two separate payer columns
→ Each person owes both payers
→ Settlement screen shows amounts per payer
→ "Net simplification" toggle: if A owes B 12,000 and B owes A 5,500 → net: A owes B 6,500
   (default: ON — show simplified)
```

### 6. Non-drinkers / dietary restrictions

```
Per-person preference flags (set once, remembered across sessions):
  🍺 Согтууруулах уухгүй   → auto-unticks alcohol items
  🥩 Мах идэхгүй           → auto-unticks meat items
  🥛 Цагаан хоол            → auto-unticks non-vegetarian items
  🔇 Бүх зүйлд оролцоно     → default — no restrictions

On selection screen:
  Grayed-out items show: "Та архи уухгүй гэж тэмдэглэсэн"
  Override toggle: [  ] "Би энэ удаа оролцоно" (treats a friend)
```

### 7. Partial payments

```
Real life: "I'll send 10,000₮ now, 8,000₮ tomorrow."
→ Tap "Төлөөгүй" on a person row
→ Enter amount: 10,000₮
→ Status: 🟡 "10,000/18,000₮"
→ Remaining: 8,000₮ shown below
→ Re-tap to add more until fully paid → turns ✅
```

No complex installment tracking. Just subtract from total. Simple arithmetic in localStorage/Supabase.

### 8. Tips & service charge

```
Үйлчилгээ 5,000₮ → always split equally among ALL participants
→ Locked — cannot be unchecked by participants (only payer can adjust on create/edit)
→ Payer can adjust percentage during creation: 5%, 10%, 15%, custom
→ "Үйлчилгээний хураамжийг оролцогчид тэнцүү хуваана" label makes it transparent
```

### 9. "I paid for you" (зээлэх / IOU)

```
Simple mode from home screen: "💸 Зөвхөн өр тэмдэглэх"
→ Not a group expense
→ One-direction debt: "Би 20,000₮ төлсөн. Чи надад өгнө."
→ Shows in personal debt list (separate from group splits)
→ Can convert to group split later: "Сарлага болгох" → adds more people
```

### 10. Offline / bad network

```
PWA with offline support:
→ Link opens cached PWA shell
→ Selections saved to local storage → synced when back online
→ Payer creating a split: drafts saved locally, uploaded when online
→ Conflict resolution: server timestamp wins for race conditions

Status indicator:
  🟢 Онлайн — real-time updates active
  🟡 Офлайн — changes saved, will sync when connected
  🔴 Синк хийгдээгүй — check connection

Supabase Realtime auto-reconnects on network restore.
```

### 11. Session expiry & resurrection

```
7-day lifecycle:
  Day 0: Created. Link shared. Participants start selecting.
  Day 1-2: Normal activity period.
  Day 3: If any unconfirmed → auto-reminder to payer: "Золбоо сонгоогүй байна. Сануулах уу?"
  Day 6: If still unconfirmed → auto-reminder to all: "6 хоног боллоо. Сарлага автоматаар хаагдана"
  Day 7: Session auto-closes with current selections + notification to all.

Payer can:
  → "Хугацааг сунгах" (extend by 7 days)
  → "Хүчээр хаах" (close now with current selections)
  → From history: "Дахин нээх" (resurrect a closed session — rare but supported)

Expired sessions show in history with ⏰ icon.
```

---

## Technical Architecture for Share Links

```
┌──────────────────────────────────────────────────┐
│  Share Link: https://zill.mn/s/{id}              │
│                                                  │
│  App Installed?                                  │
│       ├── Yes → zill://split/{id}                │
│       │        → Deep link opens app             │
│       │        → Push notification (faster)      │
│       │        → Shows selection UI              │
│       │        → Offline-capable (local storage) │
│       │                                          │
│       └── No  → PWA landing page                 │
│                → Service worker caches shell      │
│                → Responsive, lightweight (<100KB) │
│                → "Select what you ate" UI         │
│                → "App татаж авах" smart banner   │
│                → Data synced via Supabase         │
│                                                  │
│  Tech: Supabase Realtime (Postgres)              │
│  - Selections update in real-time                │
│  - All participants see progress                 │
│  - "3/4 хүн сонгосон" live counter               │
│  - Offline queue → sync on reconnect             │
│                                                  │
│  Database design (conceptual):                   │
│  ┌─ splits ─────────────────────────────────┐   │
│  │ id, payer_id, total, status, created_at   │   │
│  │ privacy_mode, rounding_unit               │   │
│  └───────────────────────────────────────────┘   │
│  ┌─ split_items ──────────────────────────────┐  │
│  │ id, split_id, name, amount, tag (shared/    │  │
│  │ individual/alcohol/service)                 │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─ split_selections ─────────────────────────┐  │
│  │ id, item_id, user_id, selected (bool),     │  │
│  │ confirmed (bool), updated_at               │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─ split_payers ─────────────────────────────┐  │
│  │ id, split_id, user_id, amount_paid         │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─ user_preferences ─────────────────────────┐  │
│  │ user_id, non_drinker, vegetarian, etc.     │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Habit Loop (Psychology Summary)

```
        ┌──────────────────────────────────────┐
        │          ZILL HABIT LOOP             │
        │                                      │
        │    🔔 TRIGGER                        │
        │    ├─ External: push notification    │
        │    │  "Захисан байна ш дээ 😄"       │
        │    ├─ External: friend shares link   │
        │    │  "zill.mn/s/x1y2z3"            │
        │    └─ Internal: after group meal     │
        │       "бид хуваах ёстой"             │
        │           │                          │
        │           ▼                          │
        │    🎯 ACTION (simple, fast)          │
        │    ├─ Tap link                       │
        │    ├─ Select who you are (1 tap)     │
        │    └─ Check/uncheck items (2-5 taps) │
        │           │                          │
        │           ▼                          │
        │    🎁 REWARD (variable)              │
        │    ├─ Immediate: live calculation    │
        │    │  "Миний дүн: 18,000₮"          │
        │    ├─ Variable: celebration reveal   │
        │    │  "🎉 БҮГД БЭЛЭН!"              │
        │    ├─ Social: everyone's paid ✅     │
        │    └─ Long-term: streak counter 🔥   │
        │                                      │
        │    🔄 INVESTMENT (deepens habit)     │
        │    ├─ Preference memory              │
        │    │  "always vegetarian"            │
        │    ├─ Split history & stats          │
        │    │  "47 сарлага, хамгийн их Ганаа" │
        │    └─ Social graph                   │
        │       "frequent group" suggests      │
        └──────────────────────────────────────┘
```

**Fogg Model (B=MAT) applied to every step:**

| Step | Motivation | Ability | Prompt |
|------|-----------|---------|--------|
| Open link | You owe money / want fairness | No app needed (PWA) | Friend's message / push |
| Select identity | I want to be fair | One tap on your name | "Чи хэн бэ?" |
| Select items | Accuracy = fairness | Pre-selected defaults, uncheck what's wrong | Live calculation |
| Confirm | Ownership (I built this split) | One tap | "Баталгаажуулах" |
| Pay | Social obligation + ✅ from others | Bank QR in-app | Gentle reminder "Захиа" |
| Return | Streak, unfinished debts, habit | Home screen lists active splits | Push notification |

---

## Summary: What This Solves

| Problem | Old approach | New approach | Psychology |
|---------|-------------|-------------|------------|
| Payer does all work | Payer enters everything + assigns | Payer just enters items, each person self-selects | IKEA Effect + Default Effect |
| "I didn't eat that" | Awkward social correction | Silent uncheck, private by default | Privacy removes social cost |
| Equal split unfairness | Everyone pays same | Pay for what you consumed | Loss Aversion (don't lose fairness) |
| Social embarrassment | "Чи яагаад төлөөгүй юм?" | Private selection + gentle nudge from app | Nudge Theory (not personal) |
| Receipt accuracy | OCR → manual verification | OCR → itemized → each person verifies their share | Distributed verification |
| Viral growth | App-to-app only | PWA link works for everyone, app suggested after | Fogg Model (maximize Ability) |
| Multiple payers | Impossible | Supported via multi-payer columns + net simplification | Real-world accuracy |
| Dietary / alcohol | Not handled | Preference flags: auto-untoggle + override toggle | Default Effect + opt-out freedom |
| Session goes stale | Link dies | 7-day lifecycle with reminders, resurrection from history | Zeigarnik Effect (unfinished pulls back) |
| Nobody reminds | Payer has to text | App sends "Захиа" nudge, streak shows unpaid count | Nudge Theory + Goal-Gradient |
| Forgettable experience | Done → forget | Celebration animation + streak + stats | Peak-End Rule |
