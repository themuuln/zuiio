# Zatly — Messenger Bot Builder

A visual automation builder for Facebook Messenger with AI-powered replies, analytics, rules engine, and A/B testing.

## Stack

- Next.js 16 (App Router, Turbopack)
- Supabase (Auth, Postgres, Edge Functions)
- React Flow (node canvas)
- Tailwind CSS v4 + shadcn/ui
- Zustand (state management)
- OpenCode Go API (DeepSeek V4 Flash for AI replies)

## Features

- **10 Node Types** — Start, Send Message, Ask Question, Condition, Set Field, Delay, Action, Card Carousel, AI Reply, A/B Test
- **Template Library** — Save flows as reusable templates, browse 5 pre-built templates (Welcome Greeting, FAQ/Support, Lead Capture, Order Confirmation, Feedback Collection), and apply templates to create new automations. Category-based template browser with built-in and user-created templates. API: GET/POST `/api/templates`, PATCH/DELETE `/api/templates/:id`, POST `/api/templates/:id/apply`.
- **AI Reply Node** — AI-powered responses via OpenCode Go API with configurable system prompt, model, temperature, and conversation context
- **Analytics Dashboard** — Real message performance metrics (sent/delivered/opened/clicked) per automation with summary cards and period filtering
- **Rules Engine** — Event-driven rules (message_received, tag_added, etc.) with condition evaluation and action execution
- **A/B Test Node** — Weighted random branching for message variant testing with configurable split ratios
- **Email Notifications** — Gmail SMTP integration for admin alerts via the notify action type
- **Facebook Integration** — Full OAuth page connection, persistent menu management, webhook handling
- **Contact Management** — Search, filter, tag, and manage Messenger subscribers
- **Automation Sharing** — Share automations with other users by email
- **Folder Management** — Create and organize automations into folders

## Getting Started

```bash
# Prerequisites: Node.js 22.x, pnpm
pnpm install

# Copy and fill environment variables
cp .env.example .env.local

# Run Supabase migrations (via Supabase MCP or dashboard)
supabase db push

# Start dev server
pnpm dev
# Visit http://localhost:3001

# Required env vars:
# - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (Supabase)
# - OPENCODE_GO_API_KEY + FB_AI_MODEL (AI Reply - default: deepseek-v4-flash)
# - SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS (Email notifications)
# - FB_APP_ID, FB_APP_SECRET, FB_PAGE_ACCESS_TOKEN (Messenger integration)
```

## Project Structure

```
src/
  app/          # Next.js App Router pages + API routes
  components/   # React components (UI + workspace)
  lib/          # Utilities, API clients, validations
  store/        # Zustand state (flowStore, uiStore)
  types/        # TypeScript type definitions
supabase/
  functions/    # Edge Functions (webhook, scheduled processor)
  migrations/   # Database migrations (6 migration files)
  config.toml   # Local Supabase config
```

## Testing

```bash
# Run all tests
pnpm test

# Type check
npx tsc --noEmit

# Lint
npx eslint .
```

## Deploy

See `deploy.sh` for the full deployment workflow.

