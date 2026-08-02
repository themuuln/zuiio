# Agent Simulation Test Plan

> **Status:** ✅ Implemented — `tests/e2e/agent-simulation.test.ts` (and `tests/e2e/manual-agent.test.ts`) exist.

## Context
Create E2E test that simulates org-owner interactions, verifying tool selection, Mongolian output, no `<hr>`, and conciseness.

## Research Findings

### Prompt strings that ACTUALLY exist (Tolom mn)
- `"ЗӨВХӨН Монгол хэлээр хариулна"` ✅ (line 72)
- `"Markdown ашиглахгүй"` ✅ (line 73)
- `"би мэдээлэлгүй" гэж хэзээ ч хэлэхгүй` ✅ (line 75)
- `"бүх өгөгдлийг хэрэгслээр асууна"` ✅ (line 75)
- `"Бизнесийн асуулт бүрт хэрэгсэл ашиглах"` ✅ (line 76)

### Prompt strings that DO NOT exist (from proposed test — must fix)
- `"<hr>, <div>, <span>, <table>, <p> ашиглахгүй"` ❌ → Use `"Markdown ашиглахгүй"` instead
- `"Нэг асуултад ЗӨВХӨН НЭГ багаж ашигла"` ❌ → Not in prompt
- `"өгөгдөлд цэс ашигла"` ❌ → Not in prompt
- `"Бүх бизнес өгөгдөлд хандах боломжтой"` ❌ → Not in prompt

### Tool counts
- Tolom: 24 tools (from tool-coverage.test.ts)
- Zer: ≥5 tools (from tool-coverage.test.ts)

### Mock patterns
- `systemPromptFor` is async, needs Redis + Supabase service client mocks (same as system-prompt.test.ts)
- `getProductTools` is synchronous, needs only a ToolContext with supabase
- Existing fixture: `createMockSupabase` in `tests/fixtures/supabase-mock.ts`

## Files to Change
| File | Action | What changes |
|------|--------|-------------|
| `tests/e2e/agent-simulation.test.ts` | Create | Comprehensive simulation test |
| `tests/e2e/manual-agent-test.ts` | Create | Manual CLI test script |

## Implementation Order
1. Create `agent-simulation.test.ts` with corrected prompt assertions
2. Create `manual-agent-test.ts`  
3. Run `npx vitest run tests/e2e/agent-simulation.test.ts`

## Edge Cases
- `systemPromptFor` async needs Redis/Supabase mocks or it throws
- Mock Supabase for tool execution must chain `.from().select().eq()...` properly
- Tool cache may carry state between tests — clear it or use fresh contexts

## Verification
1. `npx vitest run tests/e2e/agent-simulation.test.ts` — all pass
2. Check that prompt assertions match actual prompt content (not invented strings)
