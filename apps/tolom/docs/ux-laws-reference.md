# UI/UX Laws, Principles & Heuristics — Reference

> Compiled from [lawsofux.com](https://lawsofux.com/), Nielsen Norman Group, IxDF, Figma, NN/g, and academic sources. Last updated: 2026-07-10.

1. [Cognitive Psychology Laws](#1-cognitive-psychology-laws)
2. [Gestalt Principles of Visual Perception](#2-gestalt-principles-of-visual-perception)
3. [Memory & Perception Effects](#3-memory--perception-effects)
4. [Decision & Behavioral Laws](#4-decision--behavioral-laws)
5. [Nielsen's 10 Usability Heuristics](#5-nielsens-10-usability-heuristics)
6. [Shneiderman's 8 Golden Rules](#6-shneidermans-8-golden-rules)
7. [Tognazzini's First Principles](#7-tognazzinis-first-principles)
8. [Norman's Design Principles](#8-normans-design-principles)
9. [Emotional Design — Three Levels](#9-emotional-design--three-levels)
10. [Cognitive Load Theory](#10-cognitive-load-theory)
11. [Response Time Thresholds](#11-response-time-thresholds)
12. [Cognitive Biases Catalog](#12-cognitive-biases-catalog)
13. [Persuasive Design & Ethics](#13-persuasive-design--ethics)
14. [Information Architecture Principles](#14-information-architecture-principles)
15. [Color, Typography & Perception](#15-color-typography--perception)
16. [Interaction Cost Framework](#16-interaction-cost-framework)
17. [Accessibility as UX](#17-accessibility-as-ux)
18. [Laws in Conflict](#18-laws-in-conflict)
19. [Applied Patterns](#19-applied-patterns)
20. [Quick Reference Card](#20-quick-reference-card)
21. [Cialdini's 6 Principles of Influence](#21-cialdinis-6-principles-of-influence)
22. [Perception & Attention Effects](#22-perception--attention-effects)
23. [Motivation & Behavior Theories](#23-motivation--behavior-theories)
24. [Social Psychology in Design](#24-social-psychology-in-design)
25. [Additional Decision & Judgment Biases](#25-additional-decision--judgment-biases)
26. [Additional Design-Specific Laws](#26-additional-design-specific-laws)
27. [Persuasion & Copywriting Principles](#27-persuasion--copywriting-principles)

---

## 1. Cognitive Psychology Laws

### Fitts's Law

> **Movement time to a target is logarithmic with distance and inversely logarithmic with size.**

**Formula:**

```
MT = a + b × log₂(2D / W)
```

Where `MT` = movement time, `D` = distance to target, `W` = target width, `a` and `b` are constants determined by the input device.

| Variant | Context | Key Insight |
|---------|---------|-------------|
| **Shannon formulation** | Modern version | `MT = a + b × log₂(D/W + 1)` — handles D=0 edge case |
| **Welford's model** | Better fit for small targets | Considers both width and distance as a ratio |
| **Touch variant** | Mobile/tablet | Fingers are imprecise → minimum 44×44pt target (Apple), 48×48dp (Material) |

**Practical application:**

- **Primary CTAs:** ≥48×48dp touch targets, placed near the user's current focus.
- **Navigation:** Top-left (Mac) or bottom (mobile) = "infinite" target bars via screen edges.
- **Forms:** Submit button directly below the last input field, not at the top.
- **Dense tables:** Row hover area extends the full row width.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| 16×16px icon button | 44×44pt minimum tap target | Too small to hit accurately |
| Submit button at top of form | Submit button below last field | Excessive distance from last interaction |
| Icon-only toolbar | Icon + text label | Ambiguous targets are slower (Fitts's Law + uncertainty) |

**Related:** Doherty Threshold (speed), Tesler's Law (push complexity to system to simplify interaction).

---

### Hick's Law (Hick-Hyman Law)

> **Decision time increases logarithmically with the number of choices.**

**Formula:**

```
RT = b × log₂(n + 1)
```

Where `RT` = reaction time, `n` = number of choices, `b` ≈ 150ms per bit of information (varies by person).

| Choices | Expected Decision Time (approx) |
|---------|--------------------------------|
| 3 | ~350ms |
| 5 | ~520ms |
| 10 | ~750ms |
| 20 | ~1.1s |
| 50 | ~1.5s |

**Critical refinement — depth vs. width:**

| Strategy | When It Works | When It Fails |
|----------|--------------|---------------|
| **Flat (wide)** | ≤7 top-level items, well-labeled | >9 items → scan time explodes |
| **Grouped (nested)** | Categories match mental models | Mismatched groupings force 2× decisions |
| **Contextual (smart)** | Surfacing relevant items dynamically | Complex state management |

Research shows: 58% faster time-to-first-click with grouped navigation vs. flat (card-sorting studies). But poor grouping is worse than flat — users make 2 decisions instead of 1.

**Practical application:**

- **Navigation:** 4–6 top-level items. Move rarely-used items to secondary menus.
- **Forms:** Break long forms into steps (3–5 fields per step).
- **Pricing:** 3 tiers (Good/Better/Best) is optimal. 5+ causes paralysis.
- **Settings:** Categorize into sections. Offer search for power users.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| 12-item flat nav bar | 5 items + "More" dropdown | Decision time grows logarithmically |
| 20-field registration form | 3-step progressive form | Each step is a manageable decision |
| 8 pricing tiers | 3 curated tiers + "Contact us" | Paradox of Choice amplifies Hick's |

**Related:** Miller's Law (memory limits), Paradox of Choice (too many options), Progressive Disclosure (hide complexity).

---

### Miller's Law

> **Working memory holds approximately 7 ± 2 items** (Miller, 1956).

**Modern refinement — Cowan's 4 ± 1:**

George Miller's original "7 ± 2" has been significantly revised. Nelson Cowan (2001) demonstrated the true capacity of working memory is closer to **4 ± 1 chunks**.

| Capacity | Original (Miller) | Revised (Cowan) | Design Implication |
|----------|-------------------|-----------------|-------------------|
| Items | 5–9 | 3–5 | Keep visible items per screen section ≤5 |
| Chunking | Group to fit 7 | Already chunked | Design for fewer than you think |

**Practical application:**

- **Phone numbers:** 555-1234 (2 chunks) vs. 5551234 (1 chunk) — both work, but grouping aids recall.
- **Navigation:** ≤5 top-level items. ≤3 items per visible group.
- **Tables:** 5–7 columns max before horizontal scrolling or column hiding.
- **Toasts/notifications:** Show 1 at a time, not a queue.
- **Dashboard widgets:** ≤5 key metrics above the fold.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| 15-item navigation menu | 5 items + overflow menu | Overwhelms working memory |
| 20-column data table | 5 key columns + expandable details | Can't hold it all in mind |
| Continuous scrolling feed | Paginated groups of 5–10 | No natural chunking boundaries |

**Related:** Hick's Law (decision load), Cognitive Load Theory (extraneous load), Progressive Disclosure (reveal on demand).

---

### Jakob's Law

> **Users spend most of their time on other sites. They prefer your site to work the same way as all the others.**

**Why it's fundamental:** Your product is 0.01% of a user's digital life. They arrive with established mental models from every other site they use.

**Practical application:**

| Pattern | Expected Location/Behavior | Deviation Cost |
|---------|--------------------------|----------------|
| Shopping cart | Top-right corner | High — users can't find it |
| Search bar | Top of page, horizontal | Medium — users look there first |
| Hamburger menu | Top-left or top-right on mobile | High — universal mobile convention |
| Form validation | Inline, below the field | High — modal validation feels alien |
| Close dialog | × button in top-right | Medium — ESC key must also work |
| Back navigation | Top-left arrow | High — matches browser + OS convention |

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Custom scroll behavior | Standard browser scroll | Violates muscle memory |
| Right-click context menu for primary actions | Standard left-click | Unintuitive, undiscoverable |
| Non-standard keyboard shortcuts | Platform-standard shortcuts | Users carry expectations from other apps |

**Related:** Consistency and Standards (heuristic #4), Mental Models (IA), Affordances & Signifiers (IA).

---

### Tesler's Law (Law of Conservation of Complexity)

> **Every system has an irreducible amount of complexity that cannot be eliminated — only moved.**

**The complexity budget:**

```
Total Complexity = User-Facing Complexity + System Complexity + Design Complexity
```

A well-designed product minimizes User-Facing Complexity by shifting it into System/Design Complexity.

| Layer | Example (E-commerce Checkout) |
|-------|------------------------------|
| **User-facing (bad)** | User must calculate tax, select shipping method manually, format address |
| **System complexity (good)** | Tax auto-calculated, address auto-completed, shipping pre-selected |
| **Design complexity** | Multi-step wizard with smart defaults hides backend complexity |

**Practical application:**

- **Auto-fill:** System handles address formatting, not the user.
- **Smart defaults:** Pre-select the most common option, let users override.
- **Input masking:** Phone numbers formatted automatically (555-1234, not raw digits).
- **Validation:** Validate in real-time as user types, not on submit.

**Related:** Postel's Law (be liberal in what you accept), Progressive Disclosure (layer complexity).

---

### Doherty Threshold

> **Productivity soars when a computer and its users interact at a pace (<400ms) that ensures neither has to wait.**

**Practical application:**

- **Skeleton screens:** Show layout immediately, fill with data.
- **Optimistic UI:** Update the interface before the server confirms.
- **Debounced search:** Show results as user types, not after "Search" click.
- **Instant transitions:** Page changes, tab switches, expand/collapse.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Full page reload for every action | SPA with client-side routing | Each reload breaks the Doherty threshold |
| "Save" button → loading spinner → confirmation | Auto-save with subtle indicator | Synchronous save kills perceived speed |
| Blocking form validation | Inline real-time validation | User waits for feedback |

**Related:** Response Time Thresholds (section 11), Fitts's Law (speed of interaction).

---

### Weber's Law

> **The just-noticeable difference between two stimuli is proportional to the magnitude of the stimuli.**

**Formula:**

```
ΔI / I = k
```

Where `ΔI` = just-noticeable difference, `I` = original stimulus intensity, `k` = constant (~0.02 for visual, ~0.1 for auditory).

**Practical application:**

- **Color changes:** A 2% brightness change is noticeable on a dark background but invisible on a bright one. Use larger deltas for light-on-light.
- **Price perception:** A $5 increase on a $20 item feels huge. The same $5 increase on a $500 item is invisible.
- **Progress indicators:** Changes in progress must be proportional to total. 5% on a 10% bar is dramatic; 5% on a 95% bar is invisible.
- **Error states:** Error styling must be proportionally distinct from normal styling.

**Related:** Von Restorff Effect (distinction), Weber-Fechner Law (perceptual scaling).

---

### Parkinson's Law

> **Work expands to fill the time available for its completion.**

**Practical application:**

- **Session timeouts:** Force decisions within a reasonable window, with save-draft escape.
- **Progress bars:** Create gentle urgency — "2 more steps to finish."
- **Countdown timers:** Limited offers, pending actions, expiring quotes.
- **Form length:** If a form CAN be long, it WILL be long. Limit fields by default.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Infinite form with no progress | 3-step wizard with progress bar | No urgency, no closure |
| Open-ended "add notes" field | Structured required fields + optional notes | Scope creep in data entry |
| No session persistence | Auto-save drafts | Users lose work or rush |

**Related:** Peak-End Rule (finish strong), Zeigarnik Effect (incomplete tasks linger).

---

### Postel's Law (Robustness Principle)

> **Be liberal in what you accept, and conservative in what you send.**

Originally from TCP/IP (RFC 793), applied to UI design by Don Norman.

**Practical application:**

| Layer | Liberal (accept) | Conservative (send) |
|-------|------------------|---------------------|
| **Input** | Accept "5551234", "(555) 1234", "555.1234" | Store as normalized "+1-555-1234" |
| **Search** | Tolerate typos, partial matches | Return clean, relevant results |
| **APIs** | Accept optional fields, varied formats | Return consistent, typed responses |
| **Paste** | Accept formatted text from any source | Strip to clean data for storage |

**Related:** Tesler's Law (shift complexity to system), Error Prevention (heuristic #5).

---

### Occam's Razor

> **Among competing hypotheses, the one with the fewest assumptions should be selected.**

**In design:** The simplest solution that meets the requirement is usually best.

**Practical application:**

- **Feature prioritization:** Does this feature serve a real user need? If you can't articulate it clearly, cut it.
- **UI complexity:** Every element must earn its place. If removing it doesn't hurt, remove it.
- **Code architecture:** Simpler implementations are easier to maintain.

**Related:** Aesthetic & Minimalist Design (heuristic #8), Tesler's Law (reduce visible complexity).

---

### Pareto Principle (80/20 Rule)

> **80% of effects come from 20% of causes.**

**Practical application:**

- **Feature focus:** 80% of usage comes from 20% of features. Invest disproportionately in those.
- **Error handling:** 80% of errors come from 20% of edge cases. Fix those first.
- **Performance:** 80% of perceived slowness comes from 20% of pages. Optimize those.
- **Navigation:** 80% of clicks go to 20% of nav items. Surface those prominently.

**Related:** Hick's Law (reduce choices), Progressive Disclosure (hide the 80%).

---

### Goal-Gradient Effect

> **People accelerate toward a goal as they get closer to completing it.**

**Practical application:**

- **Progress bars:** Users complete 60% faster when progress bar shows 90% vs. 50%.
- **Loyalty programs:** "You're 80% of the way to your next reward!" increases engagement.
- **Multi-step forms:** Show step 3 of 4 (not step 3 of 8).
- **Gamification:** Streaks, badges, leveling — all leverage the approach to a milestone.

**Related:** Zeigarnik Effect (incomplete tasks drive completion), Endowment Effect (ownership increases value).

---

### Endowment Effect

> **People value things more highly once they own them.**

**Practical application:**

- **Free trials:** Let users customize and personalize before the trial ends. They'll feel ownership.
- **Cart persistence:** "Your saved items" feels like ownership, even before purchase.
- **Personalization:** Custom dashboards, saved preferences, user-generated content.
- **Trial data:** Users who input data during a trial are less likely to cancel.

**Related:** Loss Aversion (losing owned things hurts more), Sunk Cost (invested effort increases commitment).

---

### Paradox of the Active User

> **Users always start using a system immediately, without learning it first. They will never read the manual.**

**Practical application:**

- **Onboarding:** Progressive, contextual guidance — not a 20-step wizard on first visit.
- **Just-in-time help:** Tooltip when the user hovers, not a separate help page.
- **Learn from use:** Let users accomplish real tasks on the first screen, don't require training.
- **Undo over instruction:** If users make mistakes, let them undo rather than telling them not to.

**Related:** Recognition > Recall (heuristic #6), Error Prevention (heuristic #5), Progressive Disclosure (IA).

---

## 2. Gestalt Principles of Visual Perception

### Law of Proximity

> **Elements placed close together are perceived as a group.**

**The power of spacing:** A 16px gap between related items and a 32px gap between groups creates an instant visual hierarchy — no borders needed.

**Practical application:**

- **Form design:** Label 4px above its input, 16px below the previous input.
- **Cards:** Content inside a card has tight spacing (8–12px). Cards have loose spacing (16–24px).
- **Navigation:** Active nav item has tighter proximity to its indicator than to adjacent items.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Uniform 16px gap everywhere | 4px between related, 24px between groups | Spacing communicates relationship |
| Label far above its input | Label directly above its input | Proximity overrides all other grouping |

**Related:** Law of Common Region (stronger grouping), Law of Similarity (reinforces grouping).

---

### Law of Similarity

> **Elements sharing visual traits (color, shape, size, font) are perceived as related, even if spaced apart.**

**Practical application:**

- **Action buttons:** All primary actions same color/size. All destructive actions red.
- **Typography:** H1 = section headers. H2 = subsections. Body = content. Same treatment = same importance level.
- **Status indicators:** Green = success, red = error, yellow = warning — consistent across the entire UI.
- **Cards:** Same card style = same content type. Different styles = different types.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Blue "Save" and red "Submit" for same-level actions | Both same style | Different colors imply different importance |
| Inconsistent button sizes across pages | Uniform button system | Size inconsistency breaks perceived hierarchy |

**Related:** Law of Proximity (together they're the two strongest grouping principles), Consistency and Standards (heuristic #4).

---

### Law of Closure

> **The mind completes incomplete shapes to perceive whole forms.**

**Practical application:**

- **Logos:** IBM (stripes imply rectangles), NBC (color segments imply peacock), incomplete circles for loading states.
- **Progress:** A partially-filled circle feels "almost complete" without needing a full bar.
- **Navigation:** Active tab underline that doesn't span full width implies a complete tab.
- **Empty states:** A dashed outline of a card implies "this is where a card would go."

---

### Law of Common Region

> **Elements within a shared boundary are perceived as a single unit.**

**The strongest grouping principle.** Common Region overrides Proximity and Similarity.

**Practical application:**

- **Cards:** The single most common UI pattern. A border or background creates a unit.
- **Form sections:** Group related fields in a bordered container.
- **Tab panels:** The active tab + its content area form a common region.
- **Modals:** A dialog with a backdrop creates an isolated common region.

---

### Law of Prägnanz (Law of Simplicity)

> **People perceive and interpret ambiguous or complex images as the simplest form possible.**

**Practical application:**

- **Icons:** Use the simplest recognizable form. A house icon = "home," not an architectural drawing.
- **Layouts:** Grid > masonry > random placement. Grids are processed as "simple."
- **Loading states:** A simple spinner is processed as "loading." A complex animation requires interpretation.

---

### Law of Uniform Connectedness

> **Elements connected by visual markers (lines, arrows, shared color) are perceived as a unit.**

**Practical application:**

- **Breadcrumbs:** Connected by → arrows. The line creates a path the eye follows.
- **Timelines:** A vertical line connecting events implies chronological relationship.
- **Flow diagrams:** Arrows between boxes imply sequence and causality.
- **Connector lines:** In org charts, family trees, network diagrams.

---

### Figure-Ground

> **People instinctively separate a figure (focal element) from the ground (background).**

**Practical application:**

- **Modals:** Content in foreground, dimmed backdrop = ground. Clear figure-ground separation.
- **Toasts:** Elevated card over page content.
- **Hero sections:** Text (figure) over image (ground) with overlay for contrast.
- **Focus states:** Bright border on focused input, dimmed everything else.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Text over busy image without overlay | Dark overlay + white text | Can't distinguish figure from ground |
| Modal without backdrop | Dimmed backdrop behind modal | Content bleeds together |
| Borderless form on white background | Subtle border or background on fields | No figure-ground separation |

---

### Von Restorff Effect (Isolation Effect)

> **Items that visually stand out from their surroundings are more likely to be remembered.**

**The paradox:** Making something distinctive makes it memorable — but if everything is distinctive, nothing is.

**Practical application:**

- **Pricing pages:** "Most Popular" badge on one tier. Only one tier should have it.
- **Navigation:** Active item uses bold/color. Other items use regular weight.
- **CTAs:** Primary button is a distinct color. All other buttons are ghost/secondary.
- **Calls-to-action:** One distinct CTA per screen. Multiple "Buy Now" buttons dilute the effect.

**Related:** Aesthetic-Usability Effect (beauty enhances perception), Serial Position Effect (first/last remembered).

---

## 3. Memory & Perception Effects

### Serial Position Effect

> **People remember the first (primacy) and last (recency) items in a series best.**

**The curve:** Recall drops for items in the middle of a list.

| Position | Recall Rate | Design Implication |
|----------|-------------|-------------------|
| First item | ~70% | Put the most important item first |
| Middle items | ~25–50% | These are "blind spots" — put less critical info here |
| Last item | ~65% | Second-most important item last |

**Practical application:**

- **Navigation:** Most-used items at start and end of nav bar. "Settings" in the middle is fine.
- **Lists:** Sort by importance — first item gets the most attention.
- **Forms:** First field = most important. Last field = second most. Middle = supporting info.
- **Error messages:** Put the most critical info first, not last.

---

### Peak-End Rule

> **People judge an experience primarily by its peak (most intense point) and its end — not the average or total duration.**

**The formula of experience memory:**

```
Remembered Quality ≈ (Peak Intensity + End Quality) / 2
```

**Practical application:**

- **Checkout flow:** Make the confirmation/thank-you screen delightful. It's the "end."
- **Onboarding:** The first successful task completion = "peak." Make it feel great.
- **Error handling:** A beautiful error page with recovery options becomes a positive "end" of the error experience.
- **Support interactions:** The resolution moment should feel celebratory, not transactional.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Boring "Order confirmed" page | "Your order is on its way!" + illustration + next steps | End experience is the lasting memory |
| Long form with abrupt end | "All done! Here's what happens next" + progress summary | Peak+end = remembered quality |

**Related:** Zeigarnik Effect (unfinished tasks linger), Goal-Gradient Effect (accelerate toward finish).

---

### Zeigarnik Effect

> **People remember uncompleted or interrupted tasks better than completed ones.**

**Practical application:**

- **Progress indicators:** "Complete your profile — 60% done" creates psychological tension to finish.
- **Draft autosave:** Users return because their work is "still there."
- **Checklists:** Seeing incomplete items creates urgency to check them off.
- **Notifications:** "You have 3 unread messages" — the incomplete count nags.

**Ethical consideration:** Used responsibly, this drives completion. Used manipulatively (fake progress, endless loops), it's a dark pattern.

**Related:** Goal-Gradient Effect (approach motivation), Endowment Effect (ownership).

---

### Aesthetic-Usability Effect

> **Users perceive aesthetically pleasing designs as more usable, even if they aren't.**

**The research:** Kurosu & Kashimura (1995) found that users rated visually attractive interfaces as more usable — even when objective usability was identical.

**Practical application:**

- **First impressions matter:** A beautiful UI buys forgiveness for minor usability issues.
- **Trust signal:** Users trust polished interfaces more. "If they cared about the design, they probably cared about the code."
- **The danger:** Beautiful UIs can mask usability problems. Don't let aesthetics replace testing.

**Related:** Halo Effect (cognitive bias — one positive trait biases overall perception), Norman's Visceral Level (emotional design).

---

### Diderot Effect

> **Acquiring one new item creates a desire for matching items to maintain consistency.**

Named after Denis Diderot, who received a beautiful robe that made his old possessions feel shabby.

**Practical application:**

- **Theme systems:** Once a user customizes one part of their dashboard, they want the whole thing to match.
- **Bundle recommendations:** "Complete the set" — buy the matching case for your phone.
- **Brand consistency:** If your product looks premium in one place, users expect it everywhere.
- **Upselling:** A premium template makes users want premium icons, premium fonts, premium everything.

---

### Weber-Fechner Law

> **Perceived intensity is proportional to the logarithm of stimulus intensity.**

**Formula:**

```
Perceived Intensity = k × ln(Stimulus Intensity)
```

**Practical application:**

- **Audio feedback:** Volume doubling doesn't feel like "double loudness." Use logarithmic volume scales.
- **Brightness:** Going from 10→20 nit is a huge perceived jump. Going from 200→210 nit is invisible.
- **Animation speed:** Doubling animation speed doesn't feel "twice as fast" — it feels disproportionately faster.

---

## 4. Decision & Behavioral Laws

### Prospect Theory (Kahneman & Tversky)

> **People evaluate outcomes relative to a reference point, and losses loom larger than equivalent gains.**

**The four key insights:**

| Insight | Description | UX Application |
|---------|-------------|----------------|
| **Reference dependence** | Value is relative, not absolute | Show original price as reference for discounts |
| **Loss aversion** | Losses ~2× more painful than gains are pleasurable | "Don't lose your progress" > "Save your progress" |
| **Diminishing sensitivity** | $10→$20 feels bigger than $110→$120 | Progressive discounts feel more impactful |
| **Probability weighting** | Small probabilities overweighted, large underweighted | "1 in 100 chance" feels more significant than it is |

---

### Sunk Cost Fallacy

> **People continue investing because of previously invested resources, even when future costs outweigh benefits.**

**Ethical application (positive):**

- **Progress bars:** "You've already completed 6 of 10 steps" motivates completion.
- **Multi-step onboarding:** Each completed step increases commitment.
- **Data input:** Users who've entered data are more likely to complete the form.

**Unethical application (negative):**

- **Subscription traps:** "You've used this service for 6 months — don't cancel now!"
- **Gambling mechanics:** "You've invested so much — keep playing!"

**Related:** Endowment Effect, Loss Aversion.

---

### Status Quo Bias

> **People prefer the current state of affairs over change, even when change is objectively better.**

**Practical application:**

- **Defaults:** Pre-selected options are chosen 2–3× more often than opt-in.
- **Opt-out vs. opt-in:** Organ donation rates jump from 15% to 90% with opt-out systems.
- **Subscription renewals:** Auto-renewal leverages inertia (ethically questionable if not transparent).
- **Onboarding:** Keep users in familiar flows. Change one thing at a time.

**Ethical note:** Status quo bias is the backbone of many dark patterns (forced continuity, pre-checked boxes). Use defaults wisely.

---

### Social Proof

> **People look to others' behavior to determine correct action, especially under uncertainty.**

**Practical application:**

- **Reviews & ratings:** Star ratings reduce decision anxiety.
- **Activity feeds:** "12 people are viewing this now" creates urgency and validation.
- **Testimonials:** Real names + photos > anonymous quotes.
- **Counters:** "Join 10,000+ users" — scale creates trust.
- **"Most popular" labels:** Default to what others chose.

**Violation gallery:**

| ✗ Bad | ✓ Good | Why |
|-------|--------|-----|
| Fake reviews, inflated counts | Real reviews with verified purchases | Social proof only works when credible |
| "0 reviews" with no alternative | "Be the first to review" + product details | Empty social proof is worse than none |

---

### Scarcity Principle

> **Things seem more valuable when they're scarce or limited.**

**Practical application:**

- **Inventory signals:** "Only 3 left in stock" increases conversion.
- **Time limits:** "Sale ends in 2 hours" creates urgency.
- **Exclusive access:** "Invitation only" or "Limited to 100 users."
- **Waitlists:** "You're #47 on the waitlist" — scarcity + progress.

**Ethical note:** Fake scarcity (fake countdown timers, fake stock counts) erodes trust permanently.

---

### Anchoring

> **The first piece of information disproportionately influences subsequent judgments.**

**Practical application:**

- **Pricing:** Show the most expensive option first. Other options feel affordable by comparison.
- **Original vs. sale price:** "$200 ~~$350~~" — the $350 anchor makes $200 feel like a deal.
- **Negotiations:** First number set becomes the reference point.
- **Feature comparison:** Show the "Enterprise" tier first to anchor high.

---

## 5. Nielsen's 10 Usability Heuristics

*The canonical set from Jakob Nielsen (1994), updated 2020. Derived from factor analysis of 101 usability principles applied to 249 usability problems.*

### 1. Visibility of System Status

> The system should always keep users informed about what's going on through appropriate feedback within reasonable time.

| Good Implementation | Bad Implementation |
|--------------------|--------------------|
| Loading spinner with text "Saving..." | Blank screen during save |
| Progress bar for file upload | No indication upload started |
| Real-time form validation | Error only shown after submit |
| "Last saved 2 min ago" indicator | No save status visible |

**Measurement:** Can the user tell what happened after every action within 0.5s?

---

### 2. Match Between System and Real World

> The system should speak the user's language, using words, phrases, and concepts familiar to the user, not system-oriented terms.

| ✗ System-Oriented | ✓ User-Oriented |
|-------------------|-----------------|
| "ERR_FILE_NOT_FOUND" | "We couldn't find that file" |
| "Deletion Queue" | "Trash" |
| "Organization Users" | "Team Members" |
| "POST /api/v1/entities" | "Create New Item" |

---

### 3. User Control and Freedom

> Users need a clearly marked "emergency exit" to leave unwanted states without extended dialogue.

**The "undo" principle:** Every destructive action should be reversible.

| Pattern | Why It Matters |
|---------|---------------|
| Undo/Redo (Ctrl+Z / Ctrl+Y) | Enables exploration without fear |
| Cancel on dialogs | Users can back out of accidental triggers |
| Draft autosave | Mistakes aren't fatal |
| "Are you sure?" before delete | Last chance to reconsider |

---

### 4. Consistency and Standards

> Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform conventions.

**Two types:**

| Type | Description | Example |
|------|-------------|---------|
| **Internal consistency** | Same patterns within your product | All CTAs same style across pages |
| **External consistency** | Following platform/industry conventions | Shopping cart in top-right (Jakob's Law) |

---

### 5. Error Prevention

> Good design is better than good error messages. Prevent problems from occurring in the first place.

**Two types of errors:**

| Error Type | Prevention Strategy |
|------------|-------------------|
| **Slip** (unconscious mistake) | Constrain input, use defaults, confirm destructive actions |
| **Mistake** (conscious wrong decision) | Provide context, show previews, offer suggestions |

**Examples:**
- Disable unavailable actions (can't submit empty form).
- Confirmation dialog for destructive actions (delete, archive).
- Real-time validation before submission.
- Smart defaults reduce wrong choices.

---

### 6. Recognition Rather Than Recall

> Minimize the user's memory load by making objects, actions, and options visible.

| ✗ Recall (Bad) | ✓ Recognition (Good) |
|----------------|---------------------|
| "Type the username you created" | "Select your username from the list" |
| Blank search box | Recent searches + suggestions |
| Empty form | Pre-filled with saved data |
| "What was the item code?" | Item picker with search + images |

---

### 7. Flexibility and Efficiency of Use

> Accelerators — unseen by novice users — may speed up interaction for the expert user.

**The dual-audience principle:**

| User Level | Feature |
|-----------|---------|
| **Novice** | Step-by-step wizard, tooltips, guided flow |
| **Intermediate** | Keyboard shortcuts for common actions |
| **Expert** | Bulk operations, API access, custom workflows |

---

### 8. Aesthetic and Minimalist Design

> Interfaces should not contain information which is irrelevant or rarely needed. Every extra unit of information competes with the relevant units.

**The question for every element:** "If I remove this, does the user's ability to complete their primary task degrade?" If no → remove it.

---

### 9. Help Users Recognize, Diagnose, and Recover from Errors

> Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

**Error message anatomy:**

```
[What happened]    → "We couldn't save your changes"
[Why it happened]  → "Your session may have expired"
[How to fix it]    → "Please log in again and retry"
```

---

### 10. Help and Documentation

> Even though it's better if the system can be used without documentation, it may be necessary to provide help.

**The hierarchy:**

1. **No help needed** (best) — self-explanatory design.
2. **Contextual help** (good) — tooltips, inline hints.
3. **Searchable docs** (acceptable) — help center, FAQ.
4. **Contact support** (fallback) — last resort.

---

## 6. Shneiderman's 8 Golden Rules

*From Ben Shneiderman, "Designing the User Interface" (1986, updated through 6th edition).*

| # | Rule | Deep Dive |
|---|------|-----------|
| 1 | **Strive for consistency** | Consistent sequences, terminology, colors, layout, and behavior throughout the product. Same action = same result everywhere. |
| 2 | **Seek universal usability** | Support novices → experts. Accommodate diverse users (age, ability, language, culture). Offer shortcuts for experts. |
| 3 | **Offer informative feedback** | Every user action needs proportional, immediate response. Continuous feedback for long operations. |
| 4 | **Design dialogs to yield closure** | Group actions logically. Signal start, progress, and completion. "Task completed" is satisfying. |
| 5 | **Prevent errors** | Design to minimize mistakes. Confirmation for destructive actions. Constraints prevent wrong inputs. |
| 6 | **Permit easy reversal of actions** | Every action reversible. Encourage exploration. "Undo" is the most-used feature in professional tools. |
| 7 | **Keep users in control** | User-initiated actions, predictable behavior, no hijacking. Don't auto-navigate, don't steal focus. |
| 8 | **Reduce short-term memory load** | Keep information visible. Use recognition over recall. Support chunking. Limit visible items to working memory capacity. |

---

## 7. Tognazzini's First Principles

*From Bruce Tognazzini, "First Principles of Interaction Design" (revised & expanded).*

| # | Principle | Key Idea |
|---|-----------|----------|
| 1 | **Discoverability** | Users can find all available actions. Nothing important is hidden. |
| 2 | **Feedback** | Every action produces visible, immediate, proportional response. |
| 3 | **Consistency** | Same actions produce same results throughout the system. |
| 4 | **Comfort** | Physical and cognitive comfort. Ergonomic layouts. |
| 5 | **Error Prevention** | Constraints, confirmations, and smart defaults prevent mistakes. |
| 6 | **Opacity** | The system should be learnable by exploration, without training. |
| 7 | **Efficiency of Use** | Experts can work fast. Accelerators, shortcuts, customization. |
| 8 | **Simplicity** | Minimal design. Only essential elements. Complexity is hidden, not removed. |
| 9 | **Forgiveness** | Users can recover from errors easily. Undo. Graceful degradation. |
| 10 | **Aesthetics** | Beautiful interfaces are perceived as more usable (Aesthetic-Usability Effect). |
| 11 | **Anticipation** | The system anticipates user needs. Smart defaults, predictive input. |
| 12 | **Responsiveness** | The system responds within Doherty Threshold (<400ms). |
| 13 | **Localization** | Language, currency, date formats adapted to the user's locale. |
| 14 | **Color** | Color is used purposefully — not just decoratively. Accessible contrast. |
| 15 | **Accessibility** | Usable by people with diverse abilities. WCAG compliance. |

---

## 8. Norman's Design Principles

*From Don Norman, "The Design of Everyday Things" (1988, revised 2013).*

| Principle | Definition | UI Application |
|-----------|-----------|----------------|
| **Affordance** | Properties of an object suggesting how it can be used | Buttons afford pressing, sliders afford dragging, scroll bars afford scrolling |
| **Signifier** | perceivable cue that indicates where action should take place | A shadow under a button signals "lift this." An arrow signals "click to go." |
| **Mapping** | Relationship between controls and their effects | Volume slider goes right = louder. Natural mapping. |
| **Constraints** | Limiting possible actions to prevent errors | Grayed-out "Submit" when form is invalid. Read-only fields. |
| **Feedback** | Communicating results of actions immediately | Button changes color on press. Toast after save. Sound on send. |
| **Conceptual Model** | User's understanding of how the system works | If the model matches reality, the system feels "intuitive." |

**The critical distinction — Affordance vs. Signifier:**

| Term | What It Is | Example |
|------|-----------|---------|
| **Affordance** | What the object CAN do | A button can be pressed |
| **Signifier** | What the user SEES that tells them | The button looks raised/colored |

A flat gray rectangle with no visual treatment has the affordance (it's clickable in code) but no signifier (user can't tell). That's a broken affordance.

---

## 9. Emotional Design — Three Levels

*From Don Norman, "Emotional Design" (2004).*

### Level 1: Visceral — "I feel it"

> **First impressions.** The immediate, gut-level reaction to appearance, feel, and sound.

**In UI:**
- Visual polish: color harmony, typography, whitespace, imagery.
- Micro-animations: subtle transitions, hover effects, loading animations.
- Sound design: notification sounds, interaction feedback.
- Perceived quality: "This looks expensive/professional."

**Goal:** "Wow, this looks amazing." → Trust, attraction, desire to explore.

**Research:** Positive affect from visceral response broadens thinking and tolerance for minor issues (Fredrickson's Broaden-and-Build theory).

### Level 2: Behavioral — "It works well"

> **Usability during use.** Ease of use, efficiency, and interaction quality.

**In UI:**
- Clear navigation and information architecture.
- Responsive interactions (Doherty Threshold).
- Efficient workflows (minimize steps, maximize recognition).
- Satisfying feedback (haptic, visual, auditory).

**Goal:** "This is easy and pleasant to use." → Task success, competence, flow state.

### Level 3: Reflective — "It means something"

> **Meaning after use.** Brand associations, personal satisfaction, memories, and self-image.

**In UI:**
- Brand storytelling and values alignment.
- Personalization and customization.
- Achievement celebrations ("You've completed 100 tasks!").
- Status signals (badges, levels, "power user" features).
- Shareable moments (screenshots worth sharing).

**Goal:** "I'm proud to use this. It reflects who I am." → Loyalty, advocacy, identity.

### The Three Levels in Practice

```
┌─────────────────────────────────────────────────────┐
│  REFLECTIVE: "I recommend this to others"           │
│  ┌───────────────────────────────────────────────┐  │
│  │  BEHAVIORAL: "This saves me time every day"  │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  VISCERAL: "This looks beautiful"       │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

All three levels are needed. A beautiful app that's hard to use fails at behavioral. A functional app that's ugly fails at visceral. An efficient app with no personality fails at reflective.

---

## 10. Cognitive Load Theory

*From John Sweller (1988), applied to instructional design and UI.*

### Three Types of Cognitive Load

| Type | Source | Goal | Strategy |
|------|--------|------|----------|
| **Intrinsic** | Difficulty of the content itself | Reduce | Break complex tasks into steps |
| **Extraneous** | Poor design adding unnecessary work | Eliminate | Remove clutter, clear hierarchy |
| **Germane** | Effort to build understanding/schema | Maximize | Provide examples, scaffolding, feedback |

### Practical Strategies

| Strategy | Reduces | Example |
|----------|---------|---------|
| **Chunking** | Intrinsic | Group related fields, limit visible items |
| **Progressive Disclosure** | Extraneous | Show essentials first, details on demand |
| **Visual Hierarchy** | Extraneous | Size, color, spacing guide attention |
| **Consistent Patterns** | Germane | Reusable components reduce learning curve |
| **Minimalist Design** | Extraneous | Every element must earn its place |
| **Default Values** | Both | Smart defaults eliminate decisions AND reduce errors |
| **Error Prevention** | Extraneous | Preventing errors eliminates error-recovery load |

### The Capacity Constraint

```
Total Cognitive Load = Intrinsic + Extraneous + Germane
Must be ≤ Working Memory Capacity
```

If `Extraneous` is high, there's no room for `Germane` learning. If `Intrinsic` is high (complex domain), `Extraneous` must be minimized even more.

**For Tolom (auto repair domain):**
- Intrinsic load is inherently high (mechanical terminology, multi-step workflows).
- Extraneous load must be aggressively minimized (clean UI, clear labels, consistent patterns).
- Germane load should be supported (progressive onboarding, contextual help).

---

## 11. Response Time Thresholds

### Nielsen's Three Limits

| Time | Perception | Design Requirement |
|------|-----------|-------------------|
| **<0.1s** | Feels instantaneous | Direct manipulation. No feedback needed. |
| **0.1–1.0s** | Noticeable, flow maintained | Brief indicator (cursor change, subtle loader). |
| **1–10s** | Flow breaks, user waits | Progress indicator with % or spinner. |
| **>10s** | User may abandon | Progress bar + cancel + meaningful message. |

### Google RAIL Model

| Metric | Target | What It Covers |
|--------|--------|---------------|
| **Response** | ≤100ms | Click, tap, keypress → visual response |
| **Animation** | ≤16ms (60fps) | Scrolls, drag, visual transitions |
| **Idle** | Maximize | Background work between frames |
| **Load** | ≤5s (first meaningful paint) | Initial page content |

### Core Web Vitals (Google, 2024+)

| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5–4.0s | >4.0s |
| **INP** (Interaction to Next Paint) | ≤200ms | 200–500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1–0.25 | >0.25 |

---

## 12. Cognitive Biases Catalog

### Biases Users Bring to Interfaces

| Bias | Definition | Design Application |
|------|-----------|-------------------|
| **Anchoring** | First information sets the reference point | Show original price first. Default options anchor expectations. |
| **Loss Aversion** | Losses hurt ~2× more than equivalent gains | "Don't lose your progress" > "Save your progress." Free trials create endowment. |
| **Sunk Cost** | Continue because of invested effort | Progress bars leverage positively. Multi-step wizards increase commitment. |
| **Status Quo** | Prefer current state over change | Pre-selected defaults. Opt-out over opt-in (ethically). |
| **Confirmation** | Seek info confirming existing beliefs | Search results that validate goals. Filter options that support decisions. |
| **Social Proof** | Follow others' behavior | Reviews, ratings, "1,234 bought this," activity feeds. |
| **Scarcity** | Scarce items feel more valuable | "Only 2 left!" Limited-time offers. Waitlists. |
| **Halo** | One positive trait biases overall perception | Beautiful UI → perceived as more usable (Aesthetic-Usability Effect). |
| **Serial Position** | First and last items remembered best | Important items at list start/end. |
| **Zeigarnik** | Unfinished tasks linger in memory | Progress indicators, task lists, draft autosave. |
| **Peak-End** | Experience judged by peak + end | Polish the most important action and the final screen. |
| **Endowment** | Value things more once owned | Free trials, personalization, saved items. |
| **Goal-Gradient** | Accelerate toward goal as you approach | Progress bars near completion, milestone celebrations. |
| **Diderot** | One purchase triggers desire for matching items | "Complete the set" recommendations, bundle offers. |
| **Paradox of Choice** | Too many options → paralysis | Curated selections, smart defaults, "Recommended for you." |
| **Framing** | Same info, different frame → different decision | "95% success rate" > "5% failure rate." |
| **Bandwagon** | Adopt beliefs because many others hold them | "Trending now," "Most popular," member counts. |

### Biases Designers Must Guard Against

| Bias | Risk | Mitigation |
|------|------|-----------|
| **Availability** | Overweight recent/memorable issues | Use data, not anecdotes. A/B test. |
| **Confirmation** | Seek evidence supporting initial design | Actively seek disconfirming user feedback. |
| **Framing** | Positive framing skews conclusions | Reframe metrics both ways. |
| **Curse of Knowledge** | Assume users know what you know | Test with real users. Onboarding for new users. |
| **IKEA Effect** | Overvalue your own creations | Get external feedback. Don't fall in love with your code. |
| **Survivorship Bias** | Study only successful users | Also study churned/abandoned users. |

---

## 13. Persuasive Design & Ethics

### Fogg Behavior Model

> **B = MAP** — Behavior happens when **M**otivation, **A**bility, and a **P**rompt converge simultaneously.

```
Motivation
    ▲
    │        ★ Action occurs here
    │       (all three converge)
    │
    │  ·  ·  ·
    │          ·  ·  ·
    │                  ·  ·
    ├──────────────────────► Ability
    │
    └── Prompt must fire at the right moment ──►
```

**If behavior isn't happening, diagnose which element is missing:**

| Symptom | Missing Element | Fix |
|---------|----------------|-----|
| User wants to but doesn't | **Ability** | Simplify the action |
| User can but doesn't want to | **Motivation** | Increase desire or reduce friction |
| User wants to and can, but doesn't | **Prompt** | Add a trigger at the right moment |

### Hook Model (Nir Eyal)

> **Trigger → Action → Variable Reward → Investment → Repeat**

```
    ┌─────────────────────────────────────┐
    │                                     │
    │  Trigger ──► Action ──► Variable    │
    │    ▲            │       Reward      │
    │    │            │          │        │
    │    │            ▼          ▼        │
    │    │         Stored      Investment │
    │    │         Value ◄─────────┘      │
    │    │            │                   │
    └────┼────────────┘                   │
         │                                │
         └── Next Trigger ◄───────────────┘
```

| Phase | Example (Social Media) | Example (Productivity App) |
|-------|----------------------|--------------------------|
| **Trigger** | Push notification: "Sarah commented" | Email: "Your report is due tomorrow" |
| **Action** | Open app, scroll feed | Open app, view task |
| **Variable Reward** | New content, likes, surprises | Completed tasks, streaks, progress |
| **Investment** | Post content, build profile | Add tasks, set recurring items |

### Dark Patterns Taxonomy

| Pattern | Definition | Example | Counter-Pattern |
|---------|-----------|---------|----------------|
| **Roach Motel** | Easy to get in, hard to get out | Easy signup, 12-step cancellation | One-click cancel |
| **Confirm Shaming** | Guilt-tripping decline language | "No, I don't want to save money" | Neutral decline option |
| **Hidden Costs** | Fees revealed only at checkout | Service fee added at payment | All costs shown upfront |
| **Misdirection** | Visual trickery for one option | Primary CTA highlighted, secondary dimmed | Clear, equal-weight options |
| **Forced Continuity** | Auto-renew without notification | Credit card charged after trial ends | Reminder email before renewal |
| **Bait & Switch** | Promise one thing, deliver another | "Free" with hidden requirements | Clear, honest pricing |
| **Privacy Zuckering** | Confusing settings default to sharing | Pre-checked "share data" boxes | Opt-in, not opt-out |
| **Friend Spam** | Product asks for contacts | "Find your friends!" → emails everyone | Import only with explicit consent |
| **Hidden Subscription** | Recurring charge hidden in one-time purchase | "Start free trial" → monthly charge | Clear trial-to-paid transition |

### Ethical Design Framework

**The Manipulation Matrix (Nir Eyal):**

| | Designer Would Use | Designer Would NOT Use |
|---|---|---|
| **Improves User's Life** | ✓ Facilitator (ethical) | ⚠️ Entertainer (questionable) |
| **Doesn't Improve** | ⚠️ Peddler (exploitative) | ✗ Deceiver (unethical) |

**OECD Definition:** Dark patterns are "online user-interface practices within digital choice architecture that subvert or impair consumer autonomy, often deceiving, coercing, or manipulating users."

---

## 14. Information Architecture Principles

### Progressive Disclosure

> Show only what's needed now; reveal more on demand.

**Two levels, maximum:**

| Level | Content | Access |
|-------|---------|--------|
| **Primary** | Essential features, core data | Always visible |
| **Secondary** | Advanced options, edge cases | Revealed on demand (expand, modal, settings) |

**Warning:** Three or more levels of progressive disclosure usually harms usability — users lose context.

**Related:** Hick's Law (reduce visible choices), Tesler's Law (hide complexity), Miller's Law (keep primary ≤5 items).

---

### Information Scent

> Users follow the path most likely to lead to their goal, based on labels and visual cues.

**When scent is strong:** Users move quickly and confidently.
**When scent is weak:** Users hesitate, backtrack, or abandon.

**Practical application:**

- Clear, descriptive labels (not "Click Here" or "Learn More").
- Predictable link destinations.
- Breadcrumbs showing where you are.
- Search with autocomplete that matches content.

---

### Mental Models

> Users' internal representation of how a system works.

**The rule:** Your system should match user expectations, not your database schema.

**Example:**

| Database Model (Bad UI) | Mental Model (Good UI) |
|------------------------|----------------------|
| `organization_users` table | "Team Members" |
| `work_order_services` junction | "Services on this job" |
| `status = 'in_progress'` | "In the Bay" badge |

---

### Affordances & Signifiers

| Term | Definition | Example |
|------|-----------|---------|
| **Affordance** | What the object CAN do | A button can be pressed |
| **Signifier** | What the user SEES that tells them | Raised button with shadow |
| **Constraint** | What CANNOT be done | Grayed-out button = not clickable |
| **Mapping** | Relationship between control and effect | Volume up = louder |

**The broken affordance problem:**

A text link that looks like body text = no signifier that it's clickable.
A button that looks like a label = user doesn't know it's interactive.

**The rule:** If it's clickable, it MUST look clickable. If it's not clickable, it MUST NOT look clickable.

---

## 15. Color, Typography & Perception

### Von Bezold Spreading Effect

> Colors appear different depending on adjacent colors. A color "spreads" its influence to neighboring areas.

**Implication:** Test colors in context, not in isolation. A "primary blue" will look different next to a dark sidebar vs. a white background.

### Bouba/Kiki Effect

> People consistently assign "round" names to round shapes and "sharp" names to angular shapes.

**Design application:**

| Shape Language | Personality | Use For |
|---------------|------------|---------|
| **Round** (circles, rounded corners) | Friendly, approachable, soft | Consumer apps, onboarding, CTAs |
| **Angular** (sharp corners, triangles) | Professional, precise, technical | Dashboards, data tools, enterprise |

### Chevreul Illusion

> Adjacent colors of the same brightness appear different depending on their hue.

**Implication:** A flat color strip can appear to have gradients at boundaries. Test color blocks at actual size.

### Typography Legibility Research

| Parameter | Optimal | WCAG Minimum | Why |
|-----------|---------|-------------|-----|
| Body text size | 16–18px | 14px | Below 14px, reading speed drops significantly |
| Line length | 45–75 chars | — | Too short = choppy. Too long = hard to track lines. |
| Line height | 1.4–1.6× | — | Too tight = cramped. Too loose = disconnected. |
| Contrast (body) | 7:1+ | 4.5:1 (AA) | Higher = more readable, especially for low-vision users |
| Contrast (large) | 4.5:1+ | 3:1 (AA) | Large text (≥18px bold or ≥24px) tolerates lower contrast |

### Font Pairing Principles

| Principle | Guideline |
|-----------|-----------|
| **Contrast** | Pair a serif with a sans-serif, not two similar fonts |
| **Consistency** | ≤2 font families in a design. One for headings, one for body. |
| **Hierarchy** | Size, weight, and spacing do more than font choice |
| **Readability** | Test at actual rendering size, not in the font picker |

---

## 16. Interaction Cost Framework

> **Interaction Cost** = total effort (cognitive + motor + visual + wait time) needed to perform a task.

### The Five Dimensions

| Dimension | What It Measures | Reduce By |
|-----------|-----------------|-----------|
| **Cognitive** | Mental effort (thinking, deciding, remembering) | Recognition > recall, defaults, constraints |
| **Motor** | Physical effort (clicking, typing, scrolling) | Larger targets, shortcuts, gestures |
| **Visual** | Eye movement and scanning effort | Clear hierarchy, proximity, grouping |
| **Temporal** | Wait time and duration | Performance optimization, optimistic UI |
| **Emotional** | Anxiety, frustration, uncertainty | Error prevention, undo, clear feedback |

### Measurement Methods

| Method | What It Captures | When to Use |
|--------|-----------------|------------|
| **Click/tap count** | Steps to complete task | Quick audit of workflow efficiency |
| **Time on task** | Total duration | Benchmarking against competitors |
| **Error rate** | Mistakes and recovery | Identifying pain points |
| **SUS (System Usability Scale)** | Perceived usability | Comparative evaluation |
| **SMEQ (Subjective Mental Effort)** | Perceived cognitive load | Evaluating complex workflows |
| **Eye tracking** | Visual attention patterns | Understanding scanning behavior |

### Interaction Cost Audit Checklist

For any user task, ask:

1. How many clicks/taps does it take?
2. How many screens/pages does it cross?
3. How much must the user remember between steps?
4. How many decisions must the user make?
5. How long does each step take?
6. What happens if the user makes a mistake?
7. Can the user reverse the action?

---

## 17. Accessibility as UX

### WCAG 2.2 Core Principles (POUR)

| Principle | Description | Key Rules |
|-----------|-------------|-----------|
| **Perceivable** | Content must be presentable in ways all users can perceive | Alt text, captions, color contrast, text resizing |
| **Operable** | UI must be operable by all users | Keyboard navigation, no time traps, touch targets ≥24px |
| **Understandable** | Information and UI must be understandable | Clear language, consistent navigation, input assistance |
| **Robust** | Content must be interpreted reliably by assistive tech | Semantic HTML, ARIA, valid markup |

### Key Specifications

| Rule | WCAG 2.2 Requirement | Best Practice |
|------|----------------------|---------------|
| **Color contrast** | ≥4.5:1 (text), ≥3:1 (large text/UI) | ≥7:1 for critical information |
| **Touch targets** | ≥24×24 CSS px | ≥44×44 CSS px (Apple guideline) |
| **Focus indicators** | Visible focus ring | High-contrast, 2px+ outline |
| **Motion** | `prefers-reduced-motion` support | Replace animations with instant transitions |
| **Text resize** | Functional up to 200% zoom | Don't break layout at 200% |
| **Error identification** | Errors identified in text (not color alone) | Icon + text + color |
| **Labels** | Every input has a visible label | Placeholder ≠ label |

### Accessibility Is UX

Accessibility isn't a separate discipline — it IS good UX:

| Accessible Pattern | Benefits Everyone |
|-------------------|------------------|
| Clear labels | Faster form completion for all users |
| High contrast | Better readability in bright sunlight |
| Keyboard navigation | Power users work faster |
| Error prevention | Fewer mistakes for everyone |
| Semantic HTML | Better SEO, better maintainability |

---

## 18. Laws in Conflict

Design isn't about applying one law perfectly — it's about balancing competing principles.

### Common Conflicts

| Law A | Law B | Tension | Resolution |
|-------|-------|---------|-----------|
| **Fitts's Law** (big targets) | **Aesthetic/Minimalist** (less visual weight) | Big buttons = less elegant | Use size for primary CTAs only. Secondary = smaller. |
| **Hick's Law** (fewer choices) | **Flexibility/Efficiency** (expert shortcuts) | Novices need fewer options, experts need more | Progressive disclosure: simple surface, expert layer hidden |
| **Error Prevention** (confirm dialogs) | **Efficiency** (reduce clicks) | Confirmation adds a click | Only confirm for irreversible destructive actions |
| **Consistency** (same patterns) | **Jakob's Law** (platform conventions) | Your pattern ≠ platform pattern | External consistency wins. Follow platform unless your pattern is genuinely better. |
| **Visibility of Status** (more feedback) | **Minimalist Design** (less clutter) | Too much feedback = noise | Proportional feedback: subtle for routine, prominent for critical |
| **Recognition > Recall** (show everything) | **Progressive Disclosure** (hide advanced) | Showing all = overwhelming | Show primary features, hide advanced behind disclosure |
| **Social Proof** (show what others do) | **Privacy** (don't expose user data) | Activity feeds can be invasive | Aggregate counts > individual exposure |

### The Priority Hierarchy

When laws conflict, prioritize in this order:

1. **Accessibility** — everyone must be able to use it
2. **Error prevention** — mistakes are costly
3. **User control** — agency over convenience
4. **Clarity** — understanding over aesthetics
5. **Efficiency** — speed over elegance
6. **Aesthetics** — beauty as the final polish

---

## 19. Applied Patterns

### Pattern: E-commerce Checkout

**Laws at work:**

| Step | Laws Applied |
|------|-------------|
| Add to cart | Endowment Effect (it's "yours" now), Social Proof ("23 people bought today") |
| Cart review | Loss Aversion ("Items in your cart are selling fast"), Serial Position (summary first) |
| Shipping info | Postel's Law (accept varied address formats), Tesler's Law (auto-complete) |
| Payment | Error Prevention (real-time card validation), Trust signals (security badges) |
| Confirmation | Peak-End Rule (delightful confirmation), Social Proof ("Join 50,000+ customers") |

### Pattern: Dashboard Design

**Laws at work:**

| Element | Laws Applied |
|---------|-------------|
| KPI cards | Miller's Law (5–7 metrics max), Visual Hierarchy (size = importance) |
| Navigation | Hick's Law (4–6 items), Jakob's Law (sidebar convention), Serial Position (important items first/last) |
| Data tables | Gestalt Proximity (row grouping), Progressive Disclosure (expandable details) |
| Filters | Recognition > Recall (visible filter chips), Progressive Disclosure (advanced filters hidden) |
| Empty states | Affordances (clear CTA to get started), Error Prevention (guide, don't blame) |

### Pattern: Mobile App Onboarding

**Laws at work:**

| Step | Laws Applied |
|------|-------------|
| Welcome screen | Visceral Design (first impression), Aesthetic-Usability Effect |
| Feature intro | Progressive Disclosure (3 screens max), Miller's Law (one feature per screen) |
| Account creation | Tesler's Law (social sign-in), Postel's Law (accept varied inputs) |
| First action | Goal-Gradient Effect (show progress), Zeigarnik Effect ("Complete your profile: 60%") |
| Success moment | Peak-End Rule (celebrate!), Endowment Effect ("Your workspace is ready") |

---

## 20. Quick Reference Card

### The 10 Laws Every Designer Must Know

| # | Law | One-Liner | Action |
|---|-----|-----------|--------|
| 1 | **Fitts's** | Big + close = fast | Large CTAs near related content |
| 2 | **Hick's** | More choices = slower | Limit to 4–6 options at decision points |
| 3 | **Miller's** | Memory holds ~4–7 items | Chunk into groups of 3–5 |
| 4 | **Jakob's** | Users expect familiar patterns | Follow platform conventions |
| 5 | **Tesler's** | Complexity can't be eliminated, only moved | Push complexity into the system |
| 6 | **Peak-End** | Judge by peak + end moment | Polish critical interactions and final screens |
| 7 | **Von Restorff** | Distinctive items are remembered | Make one thing stand out per screen |
| 8 | **Serial Position** | First and last are remembered best | Put important items at start/end |
| 9 | **Gestalt Proximity** | Close = related | Use spacing to group, not borders |
| 10 | **Norman's Affordance** | If it's clickable, look clickable | Visual treatment must match interactivity |

### The 5 Most Violated Heuristics

| Heuristic | Common Violation | Quick Fix |
|-----------|-----------------|-----------|
| **Visibility of System Status** | Silent loading, no save confirmation | Add loading states for every async action |
| **Error Prevention** | Validation only on submit | Real-time inline validation |
| **Recognition > Recall** | Empty states with no guidance | Show examples, suggestions, recent items |
| **User Control** | No undo, auto-redirects | Add undo toasts, never auto-navigate |
| **Aesthetic & Minimalist** | Feature bloat, cluttered dashboards | Apply the "remove" test to every element |

### The Accessibility Quick-Check

| Check | Pass? |
|-------|-------|
| Can I tab through every interactive element? | ☐ |
| Is every image described (alt text)? | ☐ |
| Is color contrast ≥4.5:1? | ☐ |
| Does every form input have a visible label? | ☐ |
| Does the page work at 200% zoom? | ☐ |
| Are animations reduced when `prefers-reduced-motion` is set? | ☐ |
| Can I use the page entirely with keyboard? | ☐ |

---

## 21. Cialdini's 6 Principles of Influence

*From Robert Cialdini, "Influence: The Psychology of Persuasion" (1984, updated 2021).*

### 1. Reciprocity

> **People feel obligated to return favors.**

**In UI:** Give value before asking for anything.

| Give First | Ask Later |
|-----------|-----------|
| Free tools, calculators, templates | Premium features, subscriptions |
| Free trial with real value | Upgrade prompt after trial |
| Helpful content/guides | Newsletter signup |

### 2. Commitment & Consistency

> **People want to be consistent with what they've already said or done.**

**In UI:** Small commitments lead to larger ones.

| Small Commitment | Larger Commitment |
|-----------------|-------------------|
| Free account signup | Paid subscription |
| Complete profile 20% | Complete profile 100% |
| Save one item | Build a collection |

### 3. Social Proof

> **People look to others' behavior to determine correct action.**

*(Covered in section 12 — Cognitive Biases)*

### 4. Authority

> **People trust and follow credible experts.**

| Authority Signal | Example |
|-----------------|---------|
| Credentials | "Board-certified," "ISO certified" |
| Expert endorsements | "Recommended by Dr. Smith" |
| Trust badges | Security seals, payment icons |
| Statistics | "Used by 10,000+ businesses" |
| Professional design | Clean, polished UI signals competence |

### 5. Liking

> **People are more easily influenced by people (and brands) they like.**

| Liking Factor | Application |
|--------------|-------------|
| Similarity | "You're a small business owner? So are we." |
| Compliments | "Great choice!" "You're making progress!" |
| Cooperation | "Let's set up your workspace together." |
| Attractiveness | Beautiful UI, friendly illustrations |
| Familiarity | Personalized greeting, remembered preferences |

### 6. Scarcity

> **People want more of what they can have less of.**

*(Covered in section 12 — Cognitive Biases)*

**The ethical line:** Scarcity is ethical when the limitation is real. Dark pattern when fabricated.

---

## 22. Perception & Attention Effects

### Pre-attentive Processing

> **The brain processes certain visual attributes in less than 200ms, before conscious attention.**

| Channel | Example | UI Use |
|---------|---------|--------|
| Color | Red notification badge | Alerts, status |
| Orientation | Diagonal line among horizontal | Accent elements |
| Size | Large vs. small items | Visual hierarchy |
| Motion | Animated element among static | Loading, notifications |
| Shape | Circle among squares | CTA buttons |
| Enclosure | Box around one item | Active selection |

**Key insight:** You can process 3-4 pre-attentive attributes simultaneously. Use sparingly.

### Change Blindness

> **People often fail to notice changes in their visual field during brief interruptions.**

| Bad | Good |
|-----|------|
| Tiny color shift on save | Toast notification "Saved!" |
| Subtle border change on hover | Obvious background change |
| Small text update in corner | Large, centered status update |

### Inattentional Blindness

> **People fail to see visible objects when attention is focused elsewhere.**

**Implication:** If the user is focused on a form, they won't see alerts in a sidebar. Put errors near the form.

### Processing Fluency

> **Information that is easier to process is perceived as more true, trustworthy, and likable.**

| High Fluency | Low Fluency |
|-------------|-------------|
| Clear, simple language | Jargon, complex sentences |
| High contrast text | Low contrast text |
| Familiar layouts | Novel, confusing layouts |

**The implication:** Good typography isn't just aesthetic — it's persuasive. Easier to read = more believed.

### Mere Exposure Effect

> **People develop a preference for things simply because they are familiar with them.**

**In UI:** Repeated exposure to your logo/interface builds preference. Consistent patterns become preferred. Gentle, repeated touchpoints keep your product top-of-mind.

### Picture Superiority Effect

> **Pictures and images are remembered better than words (30% visual vs 10% text recall).**

**In UI:** Product images > text descriptions. Icons with labels > text-only. Illustrations in empty states > text-only.

---

## 23. Motivation & Behavior Theories

### Self-Determination Theory (SDT)

*From Deci & Ryan (1985). Three basic psychological needs drive intrinsic motivation.*

| Need | Definition | UI Application |
|------|-----------|----------------|
| Autonomy | Feeling in control of choices | Customizable dashboards, optional steps |
| Competence | Feeling capable and effective | Progress indicators, skill badges, clear feedback |
| Relatedness | Feeling connected to others | Team features, shared workspaces, social elements |

**When needs conflict:** Wizard = increases competence but decreases autonomy. Freedom = increases autonomy but may decrease competence. **Resolution:** Offer guided paths with escape hatches.

### Flow State (Csikszentmihalyi)

> **Optimal experience occurs when challenge matches skill level.**

```
     High |  Anxiety    |    Flow
  Challenge|             |   *
          |             |
          +-------------+-------------
          |             |
          |  Boredom    |  Relaxation
     Low  |             |
          +-------------+
               Low --- Skill --- High
```

**In UI:** Start easy, gradually increase complexity. Immediate feedback. Clear goals. No interruptions during focused work.

### Endowed Progress Effect

> **People are more motivated to complete a task if they feel they've already made progress.**

**Research:** Users with 2 of 12 stamps pre-filled completed loyalty cards faster than those with 0 of 10 stamps (fewer total steps needed).

**In UI:** "You've already completed 30%!" Pre-check easy steps. Start with bonus points.

### Curiosity Gap

> **The gap between what we know and what we want to know creates a drive to close it.**

**In UI:** "You have 3 new notifications." Teaser content. "Almost there!" Progress bars.

**Ethical note:** Curiosity gaps must deliver on their promise. Clickbait that doesn't satisfy erodes trust permanently.

### Effort Heuristic

> **Things requiring more effort are perceived as more valuable.**

**In UI:** Labor Illusion — show progress bars even for fast operations. The visible effort increases perceived value. Users who've spent time configuring something value it more (IKEA Effect overlap).

### Aha Moment

> **The point where a product "clicks" for the user — sudden realization of value.**

**In UI:** Engineer the "aha moment" as early as possible. Time-to-first-value is the most important onboarding metric.

**Examples:** Slack = first colleague responds. Dropbox = file appears on another device. Notion = first custom database.

### Hyperbolic Discounting

> **People prefer smaller immediate rewards over larger future rewards.**

**In UI:** Show results immediately. "Get 10% off today" > "Get 20% off in 3 months." Emphasize immediate subscription benefits.

### Operant Conditioning

> **Behavior shaped by consequences: reinforcement increases, punishment decreases.**

| Type | UI Example |
|------|-----------|
| Positive reinforcement | Points, badges, celebrations after task completion |
| Negative reinforcement | Dismiss notification by completing task |
| Punishment | Error messages, warning dialogs |
| Extinction | Streak breaks if you miss a day |

**Ethical use:** Positive reinforcement builds habits. Punishment should only be error prevention.

---

## 24. Social Psychology in Design

### Diffusion of Responsibility

> **Individuals are less likely to take action when others are present.**

**In UI:** Assign clear ownership. "@mention" specific people. "You're the only one who can approve this."

### Bystander Effect

> **The more people present, the less likely any one person will help.**

**In UI:** Assign specific reviewers, not "the team." Notification: "No one has responded in 2 hours."

### Conformity (Asch Effect)

> **People adjust their behavior to match the group, even when the group is wrong.**

**In UI:** Social proof leverages conformity productively. Risk: Filter bubbles, echo chambers. Design for dissent: Allow upvotes AND downvotes.

### In-group Bias

> **People favor members of their own group over outsiders.**

**In UI:** Team features create in-groups (positive for collaboration). Risk: Exclusionary language. Solution: Inclusive design — everyone belongs.

### Social Currency

> **People share things that make them look good to others.**

**In UI:** Shareable achievements, status symbols, referral programs, beautiful data visualizations.

### Spotlight Effect

> **People overestimate how much others notice their behavior.**

**In UI:** Users worry about making mistakes publicly. Design for privacy and recovery. Don't show "last active" if it creates pressure.

### Hawthorne Effect

> **People modify their behavior when they know they're being observed.**

**In UI:** Progress tracking increases effort. Leaderboards boost performance. Observation should empower, not surveil.

---

## 25. Additional Decision & Judgment Biases

### Decoy Effect (Asymmetric Dominance)

> **Adding an inferior third option makes one of the original options more attractive.**

| Option | Price | Role |
|--------|-------|------|
| Web only | $59 | Decoy |
| Print only | $125 | Target |
| Web + Print | $125 | Best value |

Without the decoy, most choose cheapest. With it, most choose $125 print.

### Center-Stage Effect

> **People tend to pick the middle option in a set.**

**In UI:** Pricing pages: target tier in the middle. Navigation: important items in the middle of a list.

### Default Bias

> **People disproportionately accept pre-selected options.**

**Research:** Organ donation rates jump from ~15% (opt-in) to ~90% (opt-out) based solely on the default.

**In UI:** Pre-selected checkboxes (ethical when default serves user). Smart defaults in forms.

### Choice Overload

> **Too many options reduce satisfaction and likelihood of choosing.**

**In UI:** Curated collections, filtering/sorting, progressive disclosure. Show popular options first.

### Decision Fatigue

> **Quality of decisions deteriorates after making many consecutive decisions.**

**In UI:** Front-load important decisions. Offer "Use defaults" for non-critical choices. Limit decisions per screen to 3-5.

### Affect Heuristic

> **People make judgments based on current emotions, not rational analysis.**

**In UI:** First impressions matter enormously. Positive emotions = more lenient evaluation. Friendly error messages = less frustration.

### Representativeness Heuristic

> **People judge probability by resemblance to a prototype, not by actual statistics.**

**In UI:** Professional design signals competence before the product is used. A padlock icon feels more secure than encryption text.

### Unit Bias

> **People tend to consume a complete "unit" of something, regardless of its actual size.**

**In UI:** Pre-portioned content (one card, one article, one task) feels "complete." Users binge whole episodes, not half.

### Planning Fallacy

> **People underestimate time, costs, and risks of future actions.**

**In UI:** "This usually takes 3 days" > "Estimated: 1 day." Accurate progress bars, not optimistic ones.

### Negativity Bias

> **Negative events have greater impact than positive events of equal magnitude.**

**In UI:** One bad review hurts more than five good reviews help. Error messages need extra friendliness. One unresolved complaint undoes months of goodwill.

### Commitment Bias

> **People stick with past decisions even when evidence suggests they should change.**

**In UI:** Migration tools should make switching easy. "You've been using X for 6 months — here's what you'd lose."

### Anchoring Adjustment

> **Even when people know an anchor is arbitrary, it still influences their judgment.**

**In UI:** Original price always visible next to sale price. First number in a comparison sets expectations.

---

## 26. Additional Design-Specific Laws

### Skeuomorphism

> **Design elements that mimic real-world objects to help users understand digital interfaces.**

| Era | Style | Example |
|-----|-------|---------|
| Early digital | Heavy skeuomorphism | Calendar looks like paper calendar |
| Flat era | No skeuomorphism | Minimalist, abstract shapes |
| Modern | Subtle skeuomorphism | Shadows, textures, depth + flat simplicity |

### Visual Hierarchy

> **Arranging elements to imply importance through size, color, contrast, alignment, and proximity.**

| Tool | Impact | Application |
|------|--------|------------|
| Size | Highest | Larger = more important |
| Color/Contrast | High | Saturated = more important |
| Position | High | Top-left (LTR) = first seen |
| Weight | Medium | Bold > regular |
| Spacing | Medium | More space = more emphasis |
| Depth | Medium | Elevated = more important |

### Feedforward

> **Showing users what will happen BEFORE they take an action.**

**In UI:** Hover states preview results. "Delete" shows confirmation before action. Form validation shows expected format before submission.

### Labor Illusion

> **Visible effort by the system increases the perceived value of the result.**

**In UI:** "We're searching 500 providers..." feels more thorough than instant results. Progress bar for report generation. The paradox: We optimize for speed, but sometimes showing effort increases perceived value. Show effort for high-value operations, be instant for routine ones.

### Edgar Dale's Cone of Experience

> **People remember 10% of what they read, 30% of what they see, 50% of what they see+hear, 90% of what they do.**

**In UI:** Interactive onboarding > video tutorials > written docs. Learning by doing is 9x more effective than reading.

### Spacing Effect

> **Learning is more durable when study sessions are spaced over time.**

**In UI:** Spaced repetition for learning apps. Don't bombard notifications daily. Introduce features over weeks, not all on day 1.

### Method of Loci (Memory Palace)

> **Memory technique using spatial locations to organize and recall information.**

**In UI:** Spatial navigation (tabs, folders, sections) aids memory. Users remember WHERE something is on a page. Consistent placement of elements aids recall.

---

## 27. Persuasion & Copywriting Principles

### Pre-suasion (Cialdini)

> **What you do BEFORE presenting your message shapes how it's received.**

**In UI:** "87% of users upgrade within the first month" then show upgrade button. Prime users with relevant imagery before asking for action. Frame the problem before presenting the solution.

### Narrative Transportation

> **People are persuaded by stories they're absorbed in, not by facts and arguments.**

**In UI:** Case studies and user stories > feature lists. "How Customer achieved Result" > "Our product has Feature." Onboarding as a story.

### Yes Ladder

> **Starting with small "yes" commitments makes larger "yes" responses more likely.**

**In UI:** Multi-step forms: each step is a "yes" leading to the final "yes." Trial > Usage > Value > Conversion.

### Loss Framing

> **Framing a message as a potential loss is more motivating than framing it as a gain.**

**In UI:** "Don't miss out on 30% savings" > "Save 30%." "Your trial expires in 2 days — you'll lose access to..." > "Upgrade for..."

### Specificity

> **Specific claims are more believable and persuasive than vague ones.**

**In UI:** "4.8 stars from 2,347 reviews" > "Highly rated." "Saves 2.3 hours per week" > "Saves time." "10,847 businesses" > "Thousands of businesses."

### Authority Signals

> **Visible credentials increase trust and compliance.**

**In UI:** Security badges increase checkout conversion. "As seen in [Trusted Publication]" increases credibility. Expert quotes, certifications, awards on landing pages.
## Sources

- [Laws of UX](https://lawsofux.com/) — Jon Yablonski
- [Nielsen Norman Group](https://www.nngroup.com/) — Jakob Nielsen
- [Interaction Design Foundation](https://ixdf.org/)
- [Figma Resource Library](https://www.figma.com/resource-library/)
- [UX/UI Principles](https://uxuiprinciples.com/en/principles) — 185+ principles database
- [Smashing Magazine](https://www.smashingmagazine.com/)
- [Nir Eyal — Nir and Far](https://www.nirandfar.com/)
- [Don Norman — Emotional Design](https://www.nngroup.com/books/emotional-design/)
- [Don Norman — Design of Everyday Things](https://jnd.org/)
- [Shneiderman — Golden Rules](https://www.cs.umd.edu/users/ben/goldenrules.html)
- [Tognazzini — First Principles](https://asktog.com/atc/principles-of-interaction-design/)
- [Kahneman & Tversky — Prospect Theory](https://www.nngroup.com/articles/prospect-theory/)
- [Cowan (2001) — The Magical Number 4](https://psycnet.apa.org/record/2001-05783-008)
- [Sweller (1988) — Cognitive Load Theory](https://doi.org/10.1207/s15516709cog1204_4)
- [Google RAIL Model](https://web.dev/articles/rail)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OECD Dark Patterns Report](https://www.oecd.org/content/dam/oecd/en/publications/reports/2022/10/dark-commercial-patterns_9f6169cd/44f5e846-en.pdf)
- [Cialdini — Influence](https://www.robertcialdini.com/)
- [Csikszentmihalyi — Flow](https://www.mihalyflow.com/)
- [Deci & Ryan — Self-Determination Theory](https://selfdeterminationtheory.org/)
- [Growth.Design — 106 Cognitive Biases](https://growth.design/psychology)
- [UXScan — 244+ Principles](https://uxscan.app/ux-psychology)
- [UX/UI Principles — 185+ Database](https://uxuiprinciples.com/en/principles)
