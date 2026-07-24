# AI Breeding Advisor & GPS Herd Tracking — Research Plan

**Date:** July 2026  
**Author:** Research Agent  
**Status:** Draft — ready for implementation planning  
**Estimated effort:** 6 days total (3 days per feature, parallelizable)

---

## Table of Contents

- [Executive Summaries](#executive-summaries)
- [Feature 1: AI Breeding Advisor with Gemini](#feature-1-ai-breeding-advisor-with-gemini)
  - [1.1 Gemini Model Selection & Pricing](#11-gemini-model-selection--pricing)
  - [1.2 Architecture: Edge Function Backend](#12-architecture-edge-function-backend)
  - [1.3 Prompt Engineering Strategy](#13-prompt-engineering-strategy)
  - [1.4 Structured JSON Response Format](#14-structured-json-response-format)
  - [1.5 Cost Control & Rate Limiting](#15-cost-control--rate-limiting)
  - [1.6 Offline Considerations](#16-offline-considerations)
  - [1.7 Data Privacy & Security](#17-data-privacy--security)
  - [1.8 Existing Code Refactoring Plan](#18-existing-code-refactoring-plan)
  - [1.9 Implementation: Day-by-Day Breakdown](#19-implementation-day-by-day-breakdown)
- [Feature 2: GPS Herd Tracking](#feature-2-gps-herd-tracking)
  - [2.1 Hardware Options for Mongolia](#21-hardware-options-for-mongolia)
  - [2.2 Architecture: Real-Time Location Streaming](#22-architecture-real-time-location-streaming)
  - [2.3 Geofencing & Pasture Management](#23-geofencing--pasture-management)
  - [2.4 Offline Tracking & Sync](#24-offline-tracking--sync)
  - [2.5 Map Rendering & Performance](#25-map-rendering--performance)
  - [2.6 Storage: High-Frequency GPS Data](#26-storage-high-frequency-gps-data)
  - [2.7 Privacy & Access Control](#27-privacy--access-control)
  - [2.8 Tier-Based Limits](#28-tier-based-limits)
  - [2.9 Implementation: Day-by-Day Breakdown](#29-implementation-day-by-day-breakdown)
- [Cost Analysis](#cost-analysis)
- [Risks & Mitigation](#risks--mitigation)
- [Dependencies & Prerequisites](#dependencies--prerequisites)

---

## Executive Summaries

### AI Breeding Advisor

**What:** Replace the current stub Edge Function with a production Gemini-powered breeding analysis engine. When a user selects two horses (sire + dam), the system gathers pedigree data, health records, and breed information, sends it to Gemini via a Supabase Edge Function, and returns structured breeding compatibility advice with inbreeding risk scores, health compatibility notes, coat color predictions, and breeding window recommendations.

**Why Gemini:** Google's Gemini 2.5 Flash offers the best price-performance ratio for structured JSON generation at $0.30/M input tokens and $2.50/M output tokens. Its 1M token context window handles even deep pedigree trees. The free tier (1,500 RPM) covers development and early users. Supabase Edge Functions already support the Gemini API via `@google/generative-ai` npm package, matching the existing `supabase_ai_repository.dart` → Edge Function architecture.

**Key decision:** Route all Gemini calls through the existing Supabase Edge Function (`ai-breeding`), never from the Flutter client directly. This keeps the API key server-side and enables Row-Level Security enforcement.

### GPS Herd Tracking

**What:** Extend the existing map feature from a static "last known location" view into real-time herd tracking with background location streaming, multi-horse dashboards, movement heatmaps, and automated pasture rotation alerts.

**Why now:** The codebase already has the foundations — `LocationService` (Geolocator wrapper), `GeofenceService` (pure Dart circle containment), `OfflineTileManager` (PMTiles + tile cache), and `MapRepository` (dual Supabase/Isar offline-first pattern). Spotter (Mongolia-based company) has deployed 12,000+ Globalstar satellite collars across Mongolia, proving the hardware model works. Tamga can integrate with Spotter's API or support smartphone-based tracking for budget-conscious users.

**Key decision:** Support two tracking modes — (1) smartphone-based via background Geolocator for free/Pro users, and (2) external GPS device integration (Spotter/satellite collars) for Breeder/Stable tiers. Both feed into the same `horse_locations` table and Realtime streaming pipeline.

---

## Feature 1: AI Breeding Advisor with Gemini

### 1.1 Gemini Model Selection & Pricing

#### Model Comparison (July 2026 pricing)

| Model | Input ($/1M tokens) | Output ($/1M tokens) | Cached Input | Context Window | Best For |
|---|---|---|---|---|---|
| **Gemini 2.5 Flash** | $0.30 | $2.50 | $0.03 | 1M tokens | ✅ **Recommended** — structured output, fast, cheap |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | — | — | Too small for complex breeding prompts |
| Gemini 3.5 Flash | $1.50 | $9.00 | — | 200K+ | Premium; overkill for this use case |
| Gemini 2.5 Pro | $1.25 | $10.00 | $0.125 | 1M tokens | Complex reasoning, but 4x cost |
| Gemini 3.1 Pro | $2.00 | $12.00 | — | 200K+ | Frontier; unnecessary here |

**Recommendation: Gemini 2.5 Flash**

**Rationale:**
- Structured JSON output is Flash's sweet spot — it's fast and reliable for schema-constrained responses
- At $0.30/M input + $2.50/M output, a typical breeding query (~2K input tokens, ~800 output tokens) costs **$0.0026 per query**
- 1M context window handles deep 5-generation pedigree trees without truncation
- Free tier: 1,500 RPM (requests per minute) — sufficient for development and early production
- Paid tier rate limits: 4,000 RPM — handles any scale Tamga will reach

**Cost per user per month (estimated):**
- Free tier: 5 queries/month → $0.013/month in API costs
- Pro tier: 30 queries/month → $0.078/month
- Breeder tier: unlimited (assume 200 queries/month) → $0.52/month
- Stable tier: unlimited (assume 500 queries/month) → $1.30/month

These costs are trivially absorbed by the subscription revenue (₮9,900–₮49,900/month).

#### Free Tier Limits

| Limit | Free Tier | Paid Tier |
|---|---|---|
| Requests per minute | 1,500 | 4,000 |
| Tokens per minute | 32,000 | 128,000 |
| Requests per day | 500 | 10,000 |
| Tokens per day | 1,000,000 | 4,000,000 |

### 1.2 Architecture: Edge Function Backend

#### Current Flow (existing code)

```
Flutter App
  └─ SupabaseAiRepository.getBreedingAdvice(query)
       └─ HTTP POST → supabase/functions/v1/ai-breeding
            └─ Returns BreedingAdvice JSON
```

The existing `supabase_ai_repository.dart` already calls the `ai-breeding` Edge Function with the user's auth token. The Edge Function currently returns mock/stub data.

#### Proposed Architecture

```
Flutter App
  └─ SupabaseAiRepository.getBreedingAdvice(query)
       └─ HTTP POST → supabase/functions/v1/ai-breeding
            │
            ├─ 1. Validate auth token (Supabase JWT)
            ├─ 2. Check user quota (breeding_records query count)
            ├─ 3. Fetch horse data:
            │     ├─ horses (sire & dam records)
            │     ├─ pedigree_links (ancestors up to 5 generations)
            │     ├─ health_logs (recent health entries for both horses)
            │     └─ breeding_records (past breeding history for dam)
            ├─ 4. Build prompt with horse data + breeding knowledge base
            ├─ 5. Call Gemini 2.5 Flash (structured JSON output)
            ├─ 6. Parse & validate response against BreedingAdvice schema
            ├─ 7. Cache result in breeding_advice_cache table
            └─ 8. Return BreedingAdvice JSON
```

#### Edge Function Structure

```
supabase/functions/ai-breeding/
├── index.ts           # Entry point, auth + quota check
├── gemini.ts          # Gemini API client wrapper
├── prompts.ts         # Prompt templates (system + user)
├── schema.ts          # JSON response schema definition
├── horse-data.ts      # Fetch horse/pedigree/health data from Supabase
├── cache.ts           # Read/write advice cache
└── types.ts           # TypeScript types matching Dart models
```

#### Gemini Integration in Deno (Edge Function)

Edge Functions run Deno, not Node.js. The Gemini SDK works via REST API:

```typescript
// supabase/functions/ai-breeding/gemini.ts
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);

export async function generateBreedingAdvice(
  prompt: string,
  responseSchema: object
): Promise<Record<string, unknown>> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.3,       // Low temperature for deterministic advice
      maxOutputTokens: 2048,
    },
    systemInstruction: BREEDING_SYSTEM_PROMPT,
  });

  const result = await model.generateContent(prompt);
  return result.response.text(); // Already validated JSON
}
```

**Why this matters:** The existing Edge Function architecture in `supabase_ai_repository.dart` already does HTTP POST with auth headers. We only need to implement the Edge Function body — the Flutter side stays largely unchanged.

### 1.3 Prompt Engineering Strategy

#### System Prompt Structure

The system prompt establishes Gemini as an expert in Mongolian horse breeding, combining veterinary science with traditional knowledge:

```
You are a Mongolian horse breeding advisor (үржүүлгийн зөвлөх). You have
expertise in:

1. Mongolian horse breeds: Дорнодын хурдан (Dornodyn Khurdan), 
   Тэмээ (Temee), Монгол навтар (Mongol Navtar), Хүннү морь (Khunnu)
2. Inbreeding coefficient calculations using Wright's formula
3. Equine genetic coat color inheritance (dominant/recessive patterns)
4. Veterinary health compatibility assessment
5. Mongolian seasonal breeding calendars (spring/autumn cycles)
6. Traditional Mongolian herding knowledge combined with modern genetics

You analyze breeding compatibility between a sire and dam horse and provide:
- Inbreeding risk assessment (0-100 score, with low/medium/high classification)
- Health compatibility notes based on known conditions
- Coat color prediction for potential foal
- Optimal breeding window recommendation
- Risk factors and mitigation advice

Always respond in the language of the user query. If the query is in Mongolian,
respond in Mongolian (Cyrillic). Include both Mongolian and English terms for
breed names and technical concepts.

IMPORTANT: Your response MUST be valid JSON matching the provided schema.
Do not include markdown formatting, code blocks, or any text outside the JSON.
```

#### User Prompt Template

```
Analyze breeding compatibility between these two horses:

## Sire (Аав морь)
- Name: {sire.name}
- Breed: {sire.breed}
- Age: {sire.age} years
- Coat color: {sire.coatColor}
- Health conditions: {sire.healthConditions}
- Known offspring: {sire.offspringCount} foals
- Pedigree (5 generations): {sire.pedigreeJson}

## Dam (Ээж морь)  
- Name: {dam.name}
- Breed: {dam.breed}
- Age: {dam.age} years
- Coat color: {dam.coatColor}
- Health conditions: {dam.healthConditions}
- Previous foals: {dam.pastFoalingCount}
- Past breeding complications: {dam.pastComplications}
- Pedigree (5 generations): {dam.pedigreeJson}

## Past Breeding History
{dam.pastBreedingRecords}

## Regional Context
- Location: {userAimag}, Mongolia
- Season: {currentSeason}
- Elevation: {approximateElevation}m

Provide a comprehensive breeding analysis following the JSON schema.
```

#### Key Data Points to Fetch

| Data Source | Table | Purpose |
|---|---|---|
| Horse basic info | `horses` | Name, breed, age, coat color, sex |
| Health records | `health_logs` | Vaccinations, injuries, genetic conditions |
| Pedigree tree | `pedigree_links` | Ancestor IDs up to 5 generations for inbreeding calc |
| Past breedings | `breeding_records` | Sire/dam history, foaling outcomes, complications |
| Owner profile | `profiles` | Geographic region for seasonal context |

#### Pedigree Prompt Enrichment

For inbreeding risk, the prompt needs ancestor data. The Edge Function queries `pedigree_links` recursively:

```sql
-- Recursive CTE to get 5-generation pedigree
WITH RECURSIVE pedigree AS (
  SELECT pl.child_id, pl.parent_id, pl.generation, 1 as depth
  FROM pedigree_links pl
  WHERE pl.child_id = $horse_id
  
  UNION ALL
  
  SELECT pl.child_id, pl.parent_id, pl.generation, p.depth + 1
  FROM pedigree_links pl
  JOIN pedigree p ON pl.child_id = p.parent_id
  WHERE p.depth < 5
)
SELECT * FROM pedigree ORDER BY depth;
```

The serialized pedigree tree is included in the prompt so Gemini can calculate approximate inbreeding coefficients by identifying common ancestors.

### 1.4 Structured JSON Response Format

Using Gemini's Structured Output feature (`responseMimeType: "application/json"` + `responseSchema`), enforce a strict schema:

```json
{
  "type": "object",
  "required": ["inbreedingRisk", "compatibility", "coatPrediction", "breedingWindow", "healthNotes", "recommendations"],
  "properties": {
    "inbreedingRisk": {
      "type": "object",
      "required": ["score", "level", "commonAncestors", "explanation"],
      "properties": {
        "score": { "type": "integer", "minimum": 0, "maximum": 100 },
        "level": { "type": "string", "enum": ["low", "medium", "high"] },
        "commonAncestors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "generationsApart": { "type": "integer" }
            }
          }
        },
        "explanation": { "type": "string" }
      }
    },
    "compatibility": {
      "type": "object",
      "required": ["overallScore", "geneticDiversity", "healthComplement"],
      "properties": {
        "overallScore": { "type": "integer", "minimum": 0, "maximum": 100 },
        "geneticDiversity": { "type": "string", "enum": ["excellent", "good", "moderate", "poor"] },
        "healthComplement": { "type": "string" }
      }
    },
    "coatPrediction": {
      "type": "object",
      "required": ["probableColors", "reasoning"],
      "properties": {
        "probableColors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "color": { "type": "string" },
              "probability": { "type": "string", "enum": ["high", "medium", "low"] }
            }
          }
        },
        "reasoning": { "type": "string" }
      }
    },
    "breedingWindow": {
      "type": "object",
      "required": ["recommendedPeriod", "optimalMonth", "seasonalNote"],
      "properties": {
        "recommendedPeriod": { "type": "string" },
        "optimalMonth": { "type": "string" },
        "seasonalNote": { "type": "string" }
      }
    },
    "healthNotes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["warning", "info", "positive"] },
          "text": { "type": "string" }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

**Why structured output:** The existing `BreedingAdvice` model (`breeding_advice.dart`) already has fields for `inbreedingRisk`, `riskScore`, `healthNotes`, `colorPredictions`, `breedSuggestions`. The Gemini response schema aligns with these existing fields, so parsing is a direct `BreedingAdvice.fromJson(body)` call — the same pattern already in `supabase_ai_repository.dart:76`.

**Validation:** The Edge Function validates the parsed JSON against the schema before returning. If Gemini returns malformed JSON (rare with structured output, but possible), return a 500 with a descriptive error rather than passing garbage to the client.

### 1.5 Cost Control & Rate Limiting

#### Tier-Based Query Limits (existing pattern)

The current `ai_providers.dart` already defines `kBreedingQueryLimits`:

```dart
// Existing in ai_providers.dart
const Map<SubscriptionTier, int?> kBreedingQueryLimits = {
  SubscriptionTier.free: 5,        // 5 queries/month
  SubscriptionTier.pro: 30,        // 30 queries/month
  SubscriptionTier.breeder: null,  // unlimited
  SubscriptionTier.stable: null,   // unlimited
};
```

**Enhancement needed:** Add server-side enforcement in the Edge Function (current code only has client-side checks):

```typescript
// supabase/functions/ai-breeding/index.ts
async function checkQuota(userId: string, tier: string): Promise<{ allowed: boolean; remaining: number }> {
  const limits: Record<string, number | null> = {
    free: 5, pro: 30, breeder: null, stable: null,
  };
  const limit = limits[tier];
  if (limit === null) return { allowed: true, remaining: -1 };

  const { count } = await supabase
    .from('breeding_advice_cache')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth());

  return { allowed: (count ?? 0) < limit, remaining: limit - (count ?? 0) };
}
```

#### Caching Strategy

Cache identical queries to avoid redundant Gemini calls:

```sql
CREATE TABLE breeding_advice_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  sire_id UUID REFERENCES horses(id),
  dam_id UUID REFERENCES horses(id),
  advice_json JSONB NOT NULL,
  model_version TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(sire_id, dam_id, model_version)
);
```

**Cache lookup flow:**
1. Hash(sire_id, dam_id) → check `breeding_advice_cache`
2. If hit and not expired → return cached result (no Gemini call)
3. If miss → call Gemini, store result in cache

**Invalidation triggers:**
- Horse health record updated → invalidate cache entries involving that horse
- New pedigree link added → invalidate cache for that horse line
- Model version change → all cache entries invalidated

**Impact:** Users analyzing the same horse pair twice get instant cached results. In practice, ~30-40% of queries will be cache hits (users checking the same pair, refreshing the screen, etc.).

#### Server-Side Rate Limiting

Edge Functions can use a simple in-memory counter (resets on cold start) plus Supabase's row-level counting:

```typescript
// Simple sliding window per user (stored in DB)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per user

async function rateLimit(userId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('ai_request_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart);
  
  if ((count ?? 0) >= RATE_LIMIT_MAX) return false;
  
  await supabase.from('ai_request_log').insert({ user_id: userId });
  return true;
}
```

### 1.6 Offline Considerations

**Honest assessment:** Breeding advice requires LLM inference — it cannot run offline. However, we can maximize offline utility:

#### Offline Strategy

| Feature | Online | Offline |
|---|---|---|
| New breeding analysis | ✅ Full Gemini response | ❌ Not available |
| View last breeding advice | ✅ Fresh from cache | ✅ From Isar local cache |
| Horse comparison (manual) | ✅ With AI insights | ⚠️ Basic data display |
| Breeding calendar reminders | ✅ AI-suggested windows | ✅ From cached schedule |

**Implementation:**

1. **Cache advice locally in Isar** — when a breeding advice result arrives, store it in the local Isar database alongside the Supabase cache. The existing `LocalMapRepository` pattern (Isar-backed offline storage) can be extended to AI features.

2. **Pre-computation for common pairs** — when the app is online and idle, pre-compute advice for recently-viewed horse pairs and cache locally. This is a future enhancement, not Day 1.

3. **Graceful offline UX** — when offline, the breeding advice screen shows:
   - "Last analyzed: {date}" with cached results
   - "Connect to internet for fresh analysis" banner
   - Disabled "Analyze" button with tooltip

**New domain model extension:**

```dart
// Extend ai_repository.dart interface
abstract class AiRepository {
  Future<Result<BreedingAdvice>> getBreedingAdvice(BreedingQuery query);
  
  // New: cached/offline access
  Future<BreedingAdvice?> getCachedAdvice(BreedingQuery query);
  Future<void> cacheAdviceLocally(BreedingQuery query, BreedingAdvice advice);
}
```

### 1.7 Data Privacy & Security

#### What Data Gets Sent to Gemini

| Data | Sent to Gemini? | Rationale |
|---|---|---|
| Horse names | ✅ Yes (in prompt) | Needed for context; not PII |
| Horse breed, age, coat color | ✅ Yes | Core breeding analysis data |
| Pedigree tree (ancestor names) | ✅ Yes | Inbreeding calculation |
| Health conditions | ✅ Yes (anonymized descriptions) | Health compatibility assessment |
| Owner name | ❌ No | Not needed for breeding analysis |
| Owner location (aimag/sum) | ✅ Regional only (e.g., "Arkhangai") | Seasonal breeding context |
| GPS coordinates | ❌ No | Never sent to AI |
| Phone number / contact info | ❌ No | Never sent to AI |
| Financial / subscription data | ❌ No | Never sent to AI |

#### Security Controls

1. **API key management:** `GEMINI_API_KEY` stored as a Supabase Edge Function secret (`Deno.env.get`), never exposed to the Flutter client.

2. **Data minimization:** The Edge Function strips all PII before building the prompt. Only horse breeding-relevant data is included.

3. **No training data retention:** Google's Gemini API does not use prompts for training by default for the Developer API (as of 2026). Confirm in Google AI Studio settings.

4. **Audit logging:** Every Gemini request is logged in `ai_request_log` with user_id, horse IDs, timestamp, token count, and response status. This enables debugging and abuse detection.

5. **Error handling:** If Gemini returns an error or the response fails validation, the Edge Function returns a generic error to the client — never raw Gemini error messages or internal state.

### 1.8 Existing Code Refactoring Plan

The current AI feature code is well-structured. Changes are additive, not destructive.

#### Files to Modify

| File | Change | Effort |
|---|---|---|
| `data/ai_repository.dart` | Add `getCachedAdvice()`, `cacheAdviceLocally()` methods | Small |
| `data/supabase_ai_repository.dart` | Add cache-first logic before Edge Function call | Small |
| `application/ai_providers.dart` | Add cache provider, update quota provider to use server-side count | Medium |
| `presentation/breeding_advice_screen.dart` | Add offline banner, cache indicator, loading states | Medium |
| `domain/breeding_advice.dart` | Add `fromJson` fields if Gemini schema adds new fields | Small |

#### Files to Create

| File | Purpose | Effort |
|---|---|---|
| `supabase/functions/ai-breeding/index.ts` | Edge Function entry point (replace stub) | Large |
| `supabase/functions/ai-breeding/gemini.ts` | Gemini API client | Medium |
| `supabase/functions/ai-breeding/prompts.ts` | System + user prompt templates | Medium |
| `supabase/functions/ai-breeding/schema.ts` | Response JSON schema | Small |
| `supabase/functions/ai-breeding/horse-data.ts` | Fetch horse/pedigree/health data | Medium |
| `supabase/migrations/xxx_breeding_cache.sql` | Cache table + indexes | Small |
| `supabase/migrations/xxx_ai_request_log.sql` | Rate limiting table | Small |

#### No Changes Needed

- `domain/breeding_query.dart` — query model is already sufficient
- `presentation/breeding_result_card.dart` — UI already renders all fields from `BreedingAdvice`
- `supabase_ai_repository.dart` — HTTP call pattern is already correct; only cache logic added

### 1.9 Implementation: Day-by-Day Breakdown

#### Day 1: Edge Function + Gemini Integration

**Morning:**
- Create `supabase/functions/ai-breeding/` directory with all TypeScript files
- Implement `gemini.ts` — Gemini 2.5 Flash client with structured output config
- Implement `schema.ts` — JSON response schema
- Implement `prompts.ts` — system prompt (Mongolian breeding expert) + user prompt template

**Afternoon:**
- Implement `horse-data.ts` — fetch horse records, recursive pedigree query, health logs, past breeding records from Supabase
- Implement `index.ts` — entry point: auth check → quota check → fetch data → build prompt → call Gemini → validate → cache → respond
- Set `GEMINI_API_KEY` as Edge Function secret
- Test locally with `supabase functions serve ai-breeding`

**Deliverable:** Working Edge Function that accepts `sireId` + `damId`, returns validated `BreedingAdvice` JSON.

#### Day 2: Client-Side Integration + Caching

**Morning:**
- Add `breeding_advice_cache` table via migration
- Add `ai_request_log` table via migration
- Extend `AiRepository` interface with cache methods
- Update `SupabaseAiRepository` to check cache before Edge Function call

**Afternoon:**
- Update `ai_providers.dart` — add cached advice provider, update quota provider
- Update `breeding_advice_screen.dart` — add offline indicator, cache age display, loading states
- Add error handling for 429 (rate limit) and 500 (Gemini failure) responses
- Test full flow: query → Gemini → display → cache hit on repeat

**Deliverable:** End-to-end breeding advice flow with caching and proper error handling.

#### Day 3: Polish + Edge Cases + Testing

**Morning:**
- Implement health record change invalidation (database trigger or app-level)
- Add model version to cache key (future-proof for model upgrades)
- Add token usage logging for cost monitoring
- Implement offline fallback UI in breeding_advice_screen.dart

**Afternoon:**
- Add Mongolian language support in prompts (detect query language, respond accordingly)
- Test with edge cases: very young horses, horses with no health records, deep pedigrees
- Performance test: concurrent requests, cache hit rates
- Update Supabase RLS policies for new tables

**Deliverable:** Production-ready AI breeding advisor with caching, rate limiting, offline support, and bilingual output.

---

## Feature 2: GPS Herd Tracking

### 2.1 Hardware Options for Mongolia

Mongolia's geography presents unique challenges: 1.56 million km² of steppe, desert, and mountain terrain with sparse cellular coverage outside Ulaanbaatar and provincial capitals.

#### Option Comparison

| Solution | Coverage | Battery | Cost | Best For |
|---|---|---|---|---|
| **Smartphone-based (Geolocator)** | Cellular/WiFi areas only | 8-12h active tracking | Free (user's phone) | Free/Pro users, short-distance |
| **Globalstar SmartOne C (Spotter)** | Global satellite | 12-18 months | ~$150-200 device + $5-10/mo | Breeder/Stable, deep steppe |
| **SPOT Trace (Spotter)** | Global satellite | 1.5 months (hourly) | ~$100 device + $5/mo | Racehorse hourly tracking |
| **BLE beacons** | 50-100m range | 6-12 months | $20-50/device | Nearby detection, lost horse |
| **LoRaWAN** | 5-15km range | 1-2 years | $30-80/gateway + $20/device | Stationary base camp monitoring |

#### Recommended Hybrid Approach

**Tier 1 — Smartphone tracking (Free/Pro):**
- User's phone GPS via existing `LocationService` + Geolocator
- Background location streaming (distance filter: 100-500m for battery)
- Works where cellular coverage exists (~60% of Mongolia's populated areas)
- Limitation: depends on herder carrying phone, battery drain

**Tier 2 — Satellite collar integration (Breeder/Stable):**
- Partnership with Spotter (Mongolia-based company, 12,000+ collars deployed)
- Spotter API integration for fetching satellite-tracked locations
- Global coverage, 12+ month battery life
- Ideal for valuable breeding stock and deep-steppe herds

**Tier 3 — BLE proximity detection (all tiers):**
- Low-cost BLE beacons attached to horse halters
- Detect nearby horses within 50-100m when herder's phone is in range
- Offline-first: stores encounters in Isar, syncs when connected
- Useful for "where did my herd scatter?" scenarios

#### Spotter Integration Architecture

Spotter (Globalstar's Mongolia partner) has a mobile API. Integration would look like:

```
Spotter Satellite Collar → Globalstar Network → Spotter Cloud API
                                                        ↓
                                              Tamga Edge Function
                                              (polls Spotter API)
                                                        ↓
                                              horse_locations table
                                                        ↓
                                              Supabase Realtime → Flutter
```

**This is a Day 3+ enhancement** — the core GPS tracking feature works with smartphone-based tracking first.

### 2.2 Architecture: Real-Time Location Streaming

#### Current State

The existing codebase already has the building blocks:

| Component | File | Capability |
|---|---|---|
| GPS access | `location_service.dart` | Geolocator wrapper, position stream, permission handling |
| Local storage | `local_map_repository.dart` | Isar-backed `MapRepository` for offline |
| Remote storage | `supabase_map_repository.dart` | Supabase `horse_locations` table CRUD |
| Real-time | `map_repository.dart` | `watchNearbyHorses()` stream already defined |
| Background | `geofence_monitor.dart` | Background GPS monitoring with containment checks |

#### Proposed Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FLUTTER APP                           │
│                                                         │
│  ┌──────────────┐   ┌─────────────────────────────┐    │
│  │ LocationService│   │ HerdTrackingService (NEW)    │    │
│  │ (existing)    │   │ - Background position stream  │    │
│  │ Geolocator    │──▶│ - Adaptive interval (5-15min) │    │
│  │ GPS stream    │   │ - Offline queue (Isar)        │    │
│  └──────────────┘   │ - Battery-aware batching      │    │
│                      └──────────┬──────────────────┘    │
│                                 │                        │
│                      ┌──────────▼──────────────────┐    │
│                      │ MapRepository (existing)     │    │
│                      │ updateHorseLocation()        │    │
│                      └──────────┬──────────────────┘    │
└─────────────────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   Supabase                  │
                    │                             │
                    │  horse_locations (existing)  │
                    │     ↓                       │
                    │  Realtime Broadcast          │
                    │     ↓                       │
                    │  All subscribed clients      │
                    └─────────────────────────────┘
```

#### Background Location Strategy

**Key consideration:** Mongolia's herders are often in areas with intermittent cellular connectivity. The app must:

1. **Track location continuously** (even when app is backgrounded)
2. **Queue locations locally** when offline
3. **Batch upload** when connectivity returns
4. **Minimize battery drain** during long days on horseback

**Recommended package:** `tracelet` (Flutter package)

| Feature | tracelet | flutter_background_geolocation |
|---|---|---|
| Background tracking | ✅ | ✅ |
| Motion detection (accelerometer) | ✅ | ✅ (better) |
| Battery budget engine | ✅ (target % battery/hour) | ⚠️ (manual config) |
| Polygon geofences | ✅ | ✅ |
| Offline persistence | ✅ (SQLite) | ✅ |
| License cost | Free (open source) | Paid for release |
| Headless execution | ✅ | ✅ |

**Decision: Use `tracelet`** — it's free, has built-in battery budget engine, and supports the offline SQLite persistence pattern that aligns with Tamga's Isar-based offline strategy.

**However**, if `tracelet` proves insufficient, fall back to extending the existing `LocationService` with a background service pattern:

```dart
// Enhanced LocationService for herd tracking
class HerdTrackingService {
  // Adaptive update interval based on movement
  // Moving: 5-minute updates (horse walking speed ~10km/h = ~833m per 5min)
  // Stationary: 15-minute updates (reduce battery)
  // Battery level < 20%: 30-minute updates
  
  static const int movingIntervalSeconds = 300;   // 5 min
  static const int stationaryIntervalSeconds = 900; // 15 min
  static const int lowBatteryIntervalSeconds = 1800; // 30 min
  
  int _currentInterval = movingIntervalSeconds;
  
  void _onPositionUpdate(Position position) {
    final speed = position.speed; // m/s
    if (speed < 1.0) {
      _currentInterval = stationaryIntervalSeconds;
    } else {
      _currentInterval = movingIntervalSeconds;
    }
  }
}
```

#### Update Frequency by Scenario

| Scenario | Interval | Rationale |
|---|---|---|
| Horse actively moving (riding, herding) | 5 minutes | ~833m between updates at 10km/h |
| Horse stationary (grazing, resting) | 15 minutes | Minimal movement, save battery |
| Horse in known geofence (safe zone) | 30 minutes | No risk, maximize battery |
| Low battery (< 20%) | 30 minutes | Preserve remaining charge |
| Lost horse alert active | 2 minutes | High-priority tracking |
| Offline queue limit | 500 points max | Prevent Isar bloat |

### 2.3 Geofencing & Pasture Management

#### Current Geofence System

The existing system (`geofence_service.dart`, `geofence_monitor.dart`) supports:

- ✅ Circular geofences (`SearchArea` with center + radius)
- ✅ Enter/exit alerts (`GeofenceAlertType.entered/exited`)
- ✅ Background monitoring via GPS position stream
- ✅ Offline containment checks (pure Dart, no network)
- ✅ Alert persistence and acknowledgment

#### Extensions for Herd Tracking

**1. Pasture Rotation Zones**

Add a `PastureZone` concept on top of existing `SearchArea`:

```dart
// New domain model
class PastureZone {
  final String id;
  final String name;
  final double centerLat, centerLng;
  final double radiusKm;
  final List<String> assignedHorseIds;  // Horses that should be here
  final DateTime? lastRotationDate;
  final Duration maxOccupancyDuration;   // e.g., 14 days for rotation
  final bool isActive;
}
```

SQL schema:
```sql
CREATE TABLE pasture_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL,
  max_occupancy_days INT DEFAULT 14,
  last_rotation_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link horses to their assigned pasture
CREATE TABLE pasture_horse_assignments (
  pasture_zone_id UUID REFERENCES pasture_zones(id),
  horse_id UUID REFERENCES horses(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (pasture_zone_id, horse_id)
);
```

**2. Herd Movement Alerts**

Extend `GeofenceAlertType` with herd-specific events:

```dart
// Extend existing map_enums.dart
enum GeofenceAlertType { 
  entered, 
  exited,
  // New herd-specific types
  herdScattered,     // Horses in herd spread beyond radius threshold
  herdGathered,      // All horses returned to within threshold
  pastureOverstay,   // Horse in zone longer than max occupancy
  unexpectedMovement // Horse moved significantly outside expected range
}
```

**3. Movement Pattern Analysis**

Track how herds move over time using stored GPS data:

```sql
-- Daily herd centroid (average position of all horses in a herd)
CREATE MATERIALIZED VIEW herd_daily_centroids AS
SELECT 
  owner_id,
  date_trunc('day', recorded_at) AS day,
  AVG(lat) AS centroid_lat,
  AVG(lng) AS centroid_lng,
  STDDEV(lat) AS spread_lat,  -- How spread out the herd is
  STDDEV(lng) AS spread_lng,
  COUNT(DISTINCT horse_id) AS horse_count
FROM horse_locations
WHERE recorded_at > now() - INTERVAL '90 days'
GROUP BY owner_id, date_trunc('day', recorded_at);
```

**4. Integration with Existing Geofence Monitor**

The `GeofenceMonitor` class needs extension to support multi-horse tracking:

```dart
// Extend GeofenceMonitor for herd tracking
class HerdGeofenceMonitor extends GeofenceMonitor {
  // Override _onPositionUpdate to process multiple horses
  // Check each horse's location against assigned pasture zones
  // Fire herdScattered alerts when horses spread too far apart
  // Track herd cohesion metric (avg distance from centroid)
}
```

### 2.4 Offline Tracking & Sync

#### Offline Challenge

Deep steppe areas in Mongolia can be 50-100km from cellular coverage. A herder may be offline for hours to days.

#### Offline Queue Architecture

Leverage the existing `IsarStorage` pattern from `local_map_repository.dart`:

```
GPS Position (Geolocator stream)
    ↓
HerdTrackingService
    ↓
IsarOfflineQueue (new)
    ├── Insert: {horseId, lat, lng, timestamp, batteryLevel}
    ├── Max 500 entries (FIFO eviction)
    ├── Sync when online (batch insert to Supabase)
    └── Clear on successful sync
```

**New Isar schema:**

```dart
@collection
class IsarQueuedLocation {
  Id id = Isar.autoIncrement;
  
  late String horseId;
  late double lat;
  late double lng;
  late DateTime recordedAt;
  String? source; // 'gps', 'satellite', 'ble'
  int? batteryLevel;
  late bool synced;
  
  @Index()
  late bool isSynced;
}
```

#### Sync Strategy

When connectivity returns, batch-upload queued locations:

```dart
class LocationSyncService {
  Future<void> syncQueuedLocations() async {
    final queue = await isar.isarQueuedLocatings
        .where()
        .filter()
        .isSyncedEqualTo(false)
        .sortByRecordedAt()
        .findAll();
    
    if (queue.isEmpty) return;
    
    // Batch insert (max 100 per batch to avoid timeouts)
    for (final batch in queue.slices(100)) {
      final payload = batch.map((q) => ({
        'horse_id': q.horseId,
        'lat': q.lat,
        'lng': q.lng,
        'recorded_at': q.recordedAt.toIso8601String(),
        'source': q.source,
      })).toList();
      
      final result = await supabase
          .from('horse_locations')
          .insert(payload);
      
      if (result != null) {
        // Mark as synced
        await isar.writeTxn(() async {
          for (final q in batch) {
            q.isSynced = true;
            await isar.isarQueuedLocatings.put(q);
          }
        });
      }
    }
  }
}
```

**Conflict resolution:** GPS locations are append-only (no updates), so there are no write conflicts. The `recorded_at` timestamp ensures chronological ordering regardless of when the sync happens.

#### Connectivity Detection

Use the existing `isOfflineModeProvider` from `map_providers.dart` plus a connectivity listener:

```dart
// Listen for connectivity changes and trigger sync
final connectivityProvider = StreamProvider<bool>((ref) async* {
  await for (final result in Connectivity().onConnectivityChanged) {
    final isOnline = result != ConnectivityResult.none;
    yield isOnline;
    if (isOnline) {
      ref.read(locationSyncServiceProvider).syncQueuedLocations();
    }
  }
});
```

### 2.5 Map Rendering & Performance

#### Current Map Setup

The existing `map_screen.dart` uses `maplibre_gl` with:
- Symbol annotations for horse markers
- Circle layers for geofence boundaries
- Offline PMTiles support via `OfflineTileManager`
- OpenFreeMap fallback for online rendering

#### Scaling for Herd Tracking

**Challenge:** A user tracking 20-50 horses needs real-time marker updates without jank.

**MapLibre GL Performance Limits:**
- Annotations (markers): Good up to ~50-100, degrades beyond
- GeoJSON sources + layers: Can handle 1,000+ points via GPU rendering
- Heatmap layers: Native support, GPU-accelerated

**Recommended approach:**

1. **Use GeoJSON source + circle layer** instead of individual annotations:

```dart
// Replace individual Symbol markers with a single GeoJSON source
Future<void> _updateHerdMarkers(List<HorseLocation> horses) async {
  final geojson = {
    'type': 'FeatureCollection',
    'features': horses.map((h) => {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [h.lng, h.lat],
      },
      'properties': {
        'horseId': h.horseId,
        'horseName': h.horseName,
        'coatColor': h.coatColor,
        'lastUpdated': h.lastUpdated.toIso8601String(),
      },
    }).toList(),
  };
  
  await _controller!.addGeoJsonSource('herd-locations', geojson);
  await _controller!.addCircleLayer(
    'herd-locations',
    'herd-circles',
    const CircleLayerProperties(
      circleRadius: 10,
      circleColor: '#3B82F6',
      circleStrokeWidth: 2,
      circleStrokeColor: '#FFFFFF',
      // Data-driven: size by recency
      circleRadiusExpression: [
        'interpolate', ['linear'], ['get', 'minutesSinceUpdate'],
        0, 12,    // Just updated: larger
        30, 8,    // 30 min ago: medium
        60, 5,    // 1 hour ago: smaller (stale)
      ],
    ),
  );
}
```

2. **Marker clustering** for zoomed-out views:

```dart
// When zoomed out, cluster nearby horses
await _controller!.addSource('clustered-herd', {
  'type': 'geojson',
  'data': geojson,
  'cluster': true,
  'clusterMaxZoom': 12,
  'clusterRadius': 50,
});
```

3. **Movement trail lines** for individual horse history:

```dart
// Show last 24h movement path as a line
Future<void> _showHorseTrail(String horseId, List<HorseLocation> points) async {
  final coords = points.map((p) => [p.lng, p.lat]).toList();
  await _controller!.addGeoJsonSource('trail-$horseId', {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': coords,
    },
  });
  await _controller!.addLineLayer(
    'trail-$horseId', 'trail-line-$horseId',
    const LineLayerProperties(
      lineColor: '#F59E0B',
      lineWidth: 3,
      lineOpacity: 0.7,
    ),
  );
}
```

4. **Heatmap layer** for movement patterns over time:

```dart
// Heatmap showing where horses spend most time
await _controller!.addSource('movement-heat', {
  'type': 'geojson',
  'data': historicalLocationsGeojson,
});
await _controller!.addHeatmapLayer(
  'movement-heat', 'heatmap-layer',
  const HeatmapLayerProperties(
    heatmapRadius: 30,
    heatmapWeight: ['get', 'intensity'],
    heatmapColorExpression: [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(0,0,255,0)',
      0.5, 'rgba(0,255,0,0.5)',
      1, 'rgba(255,0,0,0.8)',
    ],
  ),
);
```

#### Performance Benchmarks (MapLibre GL Flutter)

| Scenario | Method | Performance |
|---|---|---|
| < 50 markers | GeoJSON source + circle layer | 60fps ✅ |
| 50-200 markers | GeoJSON + clustering at zoom < 12 | 60fps ✅ |
| 200-500 markers | GeoJSON + aggressive clustering | 45-60fps ⚠️ |
| 500+ markers | Heatmap layer (no individual markers) | 60fps ✅ |
| Movement trails | Line layer per horse | 60fps (max 10 trails visible) |

### 2.6 Storage: High-Frequency GPS Data

#### Data Volume Estimation

| Scenario | Horses | Update Freq | Points/Day | Points/Month | Storage/Month |
|---|---|---|---|---|---|
| Casual (1 horse, intermittent) | 1 | 30 min | 48 | 1,440 | ~200 KB |
| Active herder (10 horses, regular) | 10 | 10 min | 1,440 | 43,200 | ~6 MB |
| Breeder (30 horses, frequent) | 30 | 5 min | 8,640 | 259,200 | ~36 MB |
| Stable (50 horses, intensive) | 50 | 5 min | 14,400 | 432,000 | ~60 MB |

**Key insight:** Even at the highest tier (50 horses × 5-min updates), storage is ~60 MB/month. This is negligible for Supabase's storage but the row count matters for query performance.

#### Storage Schema (Optimized)

The existing `horse_locations` table works for low-frequency data. For high-frequency tracking, add partitioning:

```sql
-- Extend existing horse_locations with tracking metadata
ALTER TABLE horse_locations ADD COLUMN source TEXT DEFAULT 'gps';
ALTER TABLE horse_locations ADD COLUMN battery_level INT;
ALTER TABLE horse_locations ADD COLUMN speed_mps DOUBLE PRECISION;
ALTER TABLE horse_locations ADD COLUMN heading DOUBLE PRECISION;
ALTER TABLE horse_locations ADD COLUMN accuracy_m DOUBLE PRECISION;

-- Composite index for efficient queries
CREATE INDEX idx_horse_locations_tracking 
  ON horse_locations (horse_id, recorded_at DESC);

-- Index for nearby-horse queries (existing getNearbyHorses)
CREATE INDEX idx_horse_locations_spatial 
  ON horse_locations USING gist (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  );
```

#### Data Retention Policy

```sql
-- Retention policy: keep raw data for 90 days, then aggregate
-- Run monthly via pg_cron or Supabase Edge Function

-- Step 1: Create aggregated daily summary (runs daily)
CREATE TABLE horse_location_daily (
  horse_id UUID REFERENCES horses(id),
  day DATE NOT NULL,
  first_lat DOUBLE PRECISION,
  first_lng DOUBLE PRECISION,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION,  -- furthest point from centroid
  total_distance_km DOUBLE PRECISION, -- estimated daily travel
  point_count INT,
  PRIMARY KEY (horse_id, day)
);

-- Step 2: Auto-aggregate old data (Edge Function or pg_cron)
-- For data > 90 days old, aggregate into daily summaries
-- Delete raw records after aggregation

-- Step 3: Partition horse_locations by month (if using Supabase Pro)
-- This is optional — at Tamga's expected scale, table partitioning
-- is not needed for the first 2 years
```

#### Continuous Aggregate for Movement Analytics

```sql
-- Pre-computed weekly movement stats per horse
CREATE MATERIALIZED VIEW horse_movement_weekly AS
SELECT 
  horse_id,
  date_trunc('week', recorded_at) AS week,
  AVG(speed_mps) AS avg_speed,
  MAX(speed_mps) AS max_speed,
  COUNT(*) AS total_points,
  -- Approximate daily distance (from consecutive point distances)
  SUM(distance_between_points) AS weekly_distance_km
FROM horse_locations
LEFT JOIN LATERAL (
  SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    ST_SetSRID(ST_MakePoint(
      LAG(lng) OVER (ORDER BY recorded_at),
      LAG(lat) OVER (ORDER BY recorded_at)
    ), 4326)
  ) / 1000.0 AS distance_between_points
) d ON true
WHERE recorded_at > now() - INTERVAL '1 year'
GROUP BY horse_id, date_trunc('week', recorded_at);
```

### 2.7 Privacy & Access Control

#### Access Model

| Who | Sees | Scope |
|---|---|---|
| **Owner** | All their horses' locations | Full history, real-time, all horses |
| **Co-owner** (shared access) | Shared horses only | Real-time + recent history |
| **Herder** (delegated) | Assigned horses only | Real-time, no history |
| **Nearby owner** | Horses within radius | Latest position only (for lost horse detection) |
| **Public** | Lost horse reports only | Reported horses in active status |

#### RLS Policies

```sql
-- Horse locations: owner sees all their horses
CREATE POLICY horse_locations_owner_select ON horse_locations
  FOR SELECT USING (
    horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );

-- Co-owner access
CREATE POLICY horse_locations_coowner_select ON horse_locations
  FOR SELECT USING (
    horse_id IN (
      SELECT horse_id FROM horse_co_owners 
      WHERE user_id = auth.uid()
    )
  );

-- Public: only visible horses (for lost horse detection)
CREATE POLICY horse_locations_public_nearby ON horse_locations
  FOR SELECT USING (
    is_visible = true 
    AND horse_id IN (
      SELECT horse_id FROM horse_visibility_settings 
      WHERE visible_to = 'public'
    )
    -- Only show last 24 hours publicly
    AND recorded_at > now() - INTERVAL '24 hours'
  );

-- Insert: only the horse owner or their device can insert
CREATE POLICY horse_locations_insert ON horse_locations
  FOR INSERT WITH CHECK (
    horse_id IN (
      SELECT id FROM horses WHERE owner_id = auth.uid()
    )
  );
```

#### Visibility Tiers

```dart
enum LocationVisibility {
  private,      // Only owner
  coOwners,     // Owner + co-owners
  herders,      // Owner + co-owners + assigned herders
  community,    // Visible to nearby users (for lost horse recovery)
  public,       // Visible in public lost horse search
}
```

### 2.8 Tier-Based Limits

| Limit | Free | Pro (₮9,900) | Breeder (₮24,900) | Stable (₮49,900) |
|---|---|---|---|---|
| Horses tracked | 1 | 5 | 25 | Unlimited |
| Update frequency | 30 min | 10 min | 5 min | 2 min |
| History retention | 7 days | 30 days | 90 days | 1 year |
| Offline queue size | 100 points | 500 points | 2,000 points | 5,000 points |
| Geofence zones | 1 | 5 | 20 | Unlimited |
| Movement history view | ❌ | Last 24h | Last 7 days | Full history |
| Heatmap overlay | ❌ | ❌ | ✅ | ✅ |
| Pasture rotation | ❌ | ❌ | ✅ | ✅ |
| External GPS device | ❌ | ❌ | ✅ (Spotter) | ✅ (any) |
| Export GPS data | ❌ | ❌ | CSV | CSV + API |

#### Enforcement

```dart
// New constants for tracking limits
const Map<SubscriptionTier, int> kTrackingHorseLimits = {
  SubscriptionTier.free: 1,
  SubscriptionTier.pro: 5,
  SubscriptionTier.breeder: 25,
  SubscriptionTier.stable: 9999,
};

const Map<SubscriptionTier, int> kTrackingUpdateIntervals = {
  SubscriptionTier.free: 1800,    // 30 min
  SubscriptionTier.pro: 600,      // 10 min
  SubscriptionTier.breeder: 300,  // 5 min
  SubscriptionTier.stable: 120,   // 2 min
};
```

### 2.9 Implementation: Day-by-Day Breakdown

#### Day 1: Background Tracking + Offline Queue

**Morning:**
- Create `herd_tracking_service.dart` — background location tracking with adaptive intervals
- Create `IsarQueuedLocation` schema for offline GPS queue
- Create `location_sync_service.dart` — batch upload on connectivity restoration
- Wire connectivity listener to trigger sync

**Afternoon:**
- Extend `MapRepository` interface with `trackHorseLocation()` method
- Implement in `SupabaseMapRepository` — batch insert to `horse_locations`
- Implement in `LocalMapRepository` — queue to Isar when offline
- Add `herdTrackingProvider` (Riverpod) — manages tracking state per horse
- Add tracking start/stop controls to horse detail screen

**Deliverable:** Background location tracking that queues offline and syncs online. One horse tracked via smartphone.

#### Day 2: Real-Time Map + Multi-Horse Dashboard

**Morning:**
- Extend `MapRepository` interface with `watchTrackedHorses()` stream
- Implement Supabase Realtime subscription on `horse_locations` changes
- Create `herd_map_screen.dart` — map view showing all tracked horses with GeoJSON source
- Implement marker clustering for zoomed-out views
- Add horse selection tap → show detail panel

**Afternoon:**
- Add movement trail lines (last 24h path per selected horse)
- Add herd summary panel — list of horses with status (moving/stationary/stale)
- Add proximity alerts — "Horse X is 2km away from herd centroid"
- Extend `GeofenceMonitor` with herd cohesion checks
- Test with 2-3 simulated horses at different update frequencies

**Deliverable:** Real-time herd map with multi-horse tracking, movement trails, and herd cohesion alerts.

#### Day 3: Pasture Management + Polish

**Morning:**
- Create `pasture_zones` table and domain model
- Create pasture zone CRUD (create/edit/delete on map)
- Implement pasture occupancy tracking — which horses are in which zone
- Add pasture overstay alerts — "Horse has been in zone X for 14 days, consider rotation"
- Add movement heatmap overlay (toggle on/off)

**Afternoon:**
- Add tier-based tracking limits enforcement (horse count, update frequency)
- Add location visibility settings per horse
- Implement RLS policies for location access control
- Add GPS data export (CSV) for Breeder/Stable tiers
- Final testing: offline → online sync, multi-horse tracking, geofence alerts

**Deliverable:** Complete herd tracking feature with pasture management, privacy controls, tier enforcement, and data export.

---

## Cost Analysis

### Gemini API Costs (Monthly)

Assuming 1,000 active users:

| Tier | Users | Queries/User/Month | Total Queries | Cost/Query | Monthly Cost |
|---|---|---|---|---|---|
| Free | 700 | 5 | 3,500 | $0.0026 | $9.10 |
| Pro | 200 | 30 | 6,000 | $0.0026 | $15.60 |
| Breeder | 80 | 200 | 16,000 | $0.0026 | $41.60 |
| Stable | 20 | 500 | 10,000 | $0.0026 | $26.00 |
| **Total** | **1,000** | — | **35,500** | — | **$92.30/month** |

**Revenue offset:** 1,000 users × blended ₮15,000/month = ₮15,000,000 (~$4,300 USD). Gemini cost is **2.1% of revenue**. Highly sustainable.

### GPS Tracking Storage Costs (Monthly)

| Tier | Users/Horses | Points/Month | Supabase Rows | Storage |
|---|---|---|---|---|
| Free | 700 × 1 | 1M | 1M | ~140 MB |
| Pro | 200 × 5 | 4.3M | 4.3M | ~600 MB |
| Breeder | 80 × 25 | 20.7M | 20.7M | ~2.9 GB |
| Stable | 20 × 50 | 8.6M | 8.6M | ~1.2 GB |
| **Total** | — | **34.6M** | **34.6M** | **~4.8 GB/month** |

**Supabase storage:** On Pro plan ($25/month), includes 8 GB database storage. At 4.8 GB/month growth, need to implement the 90-day retention policy by month 2. With aggregation + deletion of raw data, effective storage stabilizes at ~15 GB.

**Additional costs:** Supabase Pro plan ($25/month) + Realtime connections (included in Pro). Total backend: ~$25/month + Gemini ~$92 = ~$117/month for 1,000 users.

### GPS Hardware Costs (Spotter Partnership)

| Item | Cost (USD) | Cost (MNT ~₮3,500/$) |
|---|---|---|
| SmartOne C collar | $150-200 | ₮525,000-700,000 |
| Monthly satellite service | $5-10/month | ₮17,500-35,000/month |
| SPOT Trace (racehorse) | $100 | ₮350,000 |
| SPOT monthly service | $5/month | ₮17,500/month |

**Market context:** A competitive Mongolian horse (хурдан морь) is worth $5,000-50,000+. A $200 collar + $10/month service is <1% of the horse's value annually. For racehorse owners, this is a trivial investment.

---

## Risks & Mitigation

### Feature 1: AI Breeding Advisor

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini structured output returns invalid JSON | Low | High | Validate against schema; fallback to retry with simpler prompt |
| Edge Function timeout (60s limit) | Medium | Medium | Keep prompts concise; cache aggressively; optimize pedigree query |
| Gemini API rate limit hit | Low | Low | Free tier: 1,500 RPM; implement server-side rate limiting |
| AI gives wrong breeding advice | Medium | High | Disclaimer text: "AI analysis is informational, not a substitute for veterinary advice"; always include confidence scores |
| Prompt injection via horse names | Low | Medium | Sanitize all horse names before inserting into prompt |
| Gemini API key compromised | Low | High | Stored as Edge Function secret; rotate quarterly; monitor usage spikes |
| Cost escalation with viral growth | Low | Medium | Hard quota limits per tier; cache reduces repeat calls; Flash-Lite fallback |

### Feature 2: GPS Herd Tracking

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Battery drain from background tracking | High | High | Adaptive intervals; battery budget engine; low-battery mode |
| Offline data loss | Medium | High | Isar offline queue with FIFO; max queue size; sync-on-reconnect |
| Supabase Realtime connection limits | Medium | Medium | Use broadcast channels; limit to visible horses only; paginate |
| Map performance with many markers | Medium | Medium | GeoJSON layers over annotations; clustering; heatmap fallback |
| GPS accuracy in remote areas | High | Low | Show accuracy radius; use accuracy_m from device; filter low-accuracy points |
| Storage growth exceeding Supabase limits | Medium | Medium | 90-day retention + daily aggregation; compression for old data |
| Spotter API unavailability | Low | Medium | Graceful degradation — show last known position with "stale" indicator |
| Privacy breach of horse locations | Low | High | RLS policies; visibility tiers; audit logging; encryption at rest |
| Herder resistance to smartphone tracking | Medium | Medium | Offer satellite collar option; keep smartphone mode optional; simple UX |

---

## Dependencies & Prerequisites

### Before Starting Feature 1 (AI Breeding Advisor)

1. **Google AI Studio account** — create project, generate API key, enable Gemini 2.5 Flash
2. **Supabase Edge Function environment** — confirm `supabase functions` CLI is set up, test deployment
3. **Pedigree data quality** — verify `pedigree_links` table has sufficient data for meaningful analysis (at least 3 generations for top 20 horses)
4. **Health records** — confirm `health_logs` table is populated for breeding candidates

### Before Starting Feature 2 (GPS Herd Tracking)

1. **Supabase PostGIS extension** — enable for spatial queries (`CREATE EXTENSION IF NOT EXISTS postgis`)
2. **Background location permissions** — Android `ACCESS_BACKGROUND_LOCATION` + iOS "Always" location permission (requires App Store review)
3. **Spotter partnership outreach** — contact Spotter (Mongolia) for API access and integration documentation
4. **MapLibre clustering** — verify current `maplibre_gl` version supports GeoJSON clustering (v0.20+)
5. **Testing devices** — Android phone with good GPS + iOS phone for cross-platform background location testing

### Parallel Execution

These two features have **zero code overlap** and can be developed in parallel by two developers:

| Day | AI Breeding (Dev A) | GPS Tracking (Dev B) |
|---|---|---|
| 1 | Edge Function + Gemini | Background tracking + offline queue |
| 2 | Client integration + caching | Real-time map + multi-horse |
| 3 | Polish + testing | Pasture management + polish |

The only shared resource is the Supabase project — coordinate migration timing to avoid conflicts.

---

*Document generated by research agent. Ready for implementation planning.*
