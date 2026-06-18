# AI E2E Testing Stack

Reusable Playwright AI E2E testing templates for Factory Droid.

## Contents

| File | Purpose |
|------|---------|
| `helpers.ts` | Auth helpers with dev auto-login (DEV_EMAIL/DEV_PIN), locale-agnostic selectors |
| `seed.spec.ts` | Seed file for the Playwright test MCP planner |
| `test-template.spec.ts` | Template for AI-generated or hand-written E2E tests |
| `playwright-ai-config.ts` | AI config snippet (timeouts, Percy reporter, retries) |

## How to Use

Run `/setup-e2e` in any web project to auto-deploy this stack.
