---
title: Getting Started
desc: How to set up and run zer
---

# Getting Started

## Prerequisites

- Node.js 20+
- pnpm
- Supabase project (local or hosted)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd zer

# Install dependencies
pnpm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable                        | Description                       |
| ------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (admin) |
| `SMTP_HOST` / `SMTP_PORT`       | Email server config               |
| `SMTP_USER` / `SMTP_PASS`       | Email credentials                 |
| `TELEGRAM_BOT_TOKEN`            | Telegram notification bot         |
| `TELEGRAM_CHAT_ID`              | Telegram notification target      |

## Development

```bash
# Start the dev server
pnpm dev
```

## Build

```bash
# Build for production
pnpm build
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# AI-assisted E2E tests
pnpm test:e2e:ai
```

## Other Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```
