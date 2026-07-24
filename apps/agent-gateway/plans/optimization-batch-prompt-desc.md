# Optimization: Batch Queries, Prompt Reduction, Tool Description Shortening

## Context
The agent-gateway has optimization opportunities in 3 areas (Task 4 — Redis Pipelines — was researched and found to have no actionable opportunities since Redis ops are single GET/SET calls, not batchable sequences). This plan addresses Tasks 1-3.

## Files to Change

| File | Action | What Changes |
|------|--------|--------------|
| `src/gateway/webhook-helpers.ts` | Modify | (1) Parallelize `partsLookup` queries, (2) compress system prompts, (3) shorten tool descriptions |

**Only 1 file changes.** All 3 tasks target the same file.

## Implementation Order

### Step 1: Batch `partsLookup` queries (Task 1)

**Current**: Two sequential `supabase.from()` calls:
```typescript
const { data: internalParts } = await supabase.from("parts_catalog").select(...);
const { data: historicalParts } = await supabase.from("work_order_parts").select(...);
```

**Change**: Wrap in `Promise.all()`:
```typescript
const [internalParts, historicalParts] = await Promise.all([
  supabase.from("parts_catalog").select(...),
  supabase.from("work_order_parts").select(...),
]);
```

### Step 2: Compress system prompts (Task 2)

Strategy — extract shared sections into constants at the top of `systemPromptFor`:
- `COMMON_BEHAVIOR` — shared rules (never say "I don't have data", always use tools, be proactive)
- `COMMON_FORMAT` — HTML format rules, response length
- `COMMON_TOOLS_LIST` — condensed tool reference list

Reduce each prompt variant by:
- Removing duplicate rules (same rule in BEHAVIOR + TOOL USAGE)
- Condensing Mongolian instructions (shorter sentences, same meaning)
- Removing redundant "require confirmation" text from every write tool description in prompt (it's already in the tool description)

Target: ~30% token reduction per prompt (~600-900 tokens saved per request).

### Step 3: Shorten tool descriptions (Task 3)

Shorten all ~40 tool `description` fields by 30-50%. Keep essential info (what it returns, key params). Remove verbose explanations.

Example pattern:
- Before: `"Нийлүүлэгчдийн жагсаалт: нэр, холбоо барих"` (36 chars) — already short, keep
- Before: `"Бүх төрлийн бизнес өгөгдлийг уян хатан хугацааны хязгаартайгаар асуух..."` — compress to core

## Edge Cases
- All Mongolian text preserved — no translations
- Behavior unchanged — same tools return same data
- Write tool descriptions keep "БАТАЛГААЖУУЛАЛТЫН" marker
- No new abstractions (just constants extracted)

## Verification
1. `pnpm validate:types` — zero errors
2. `pnpm test` — all pass
3. Read modified file to confirm correctness
