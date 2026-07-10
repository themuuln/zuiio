# Next.js 16.3 — AI Improvements

> Source: <https://nextjs.org/blog/next-16-3-ai-improvements> (2026-06-26)
> Authors: Aurora Scharff, Jude Gao

---

## Overview

Next.js 16.3 extends the agent-driven development story started in 16 (DevTools MCP) and 16.2 (bundled docs, `next-browser`). The focus: keep agents reading version-matched docs, give them first-party workflow Skills, and make errors actionable.

---

## 1. Bundled Docs via AGENTS.md

`next dev` automatically writes/updates this block into `AGENTS.md`:

```
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure
may all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
```

- Only written when an AI agent is detected and markers aren't already present.
- Anything outside the markers is preserved.
- Opt out with `agentRules: false` in `next.config.ts`.
- For projects on 16.1 or earlier, run the codemod: `npx @next/codemod@canary agents-md`

---

## 2. First-Party Skills

Three new workflow Skills (retiring the earlier knowledge Skills):

### next-dev-loop

Full dev feedback loop — drives the browser, reads console, follows network requests, inspects the React tree.

- Combines `/_next/mcp` (framework view) + `agent-browser` (browser view).
- Requires `agent-browser` v0.27+.
- Install: `npx skills add vercel/next.js --skill next-dev-loop`
- Usage: "After every edit, verify the page still works at runtime using the next-dev-loop skill."

### next-cache-components-adoption

Turns Cache Components on and adopts routes one feature at a time.

- **Incremental mode:** opts every route out of validation first, then adopts in follow-up PRs.
- **Direct mode:** adopts every route in place on one branch.
- Per-feature loop: reads actionable error → fetches per-error docs → applies fix → drives browser via `next-dev-loop`.
- Install: `npx skills add vercel/next.js --skill next-cache-components-adoption`

### next-cache-components-optimizer

Optimizes a Cache Components route for instant navigation by growing the static shell.

- **Page-render mode:** pushes I/O deeper or caches with `'use cache'`.
- **Nav mode:** ensures navigations between pages are instant.
- Screenshots before/after each change; identical screenshots = rollback.
- Install: `npx skills add vercel/next.js --skill next-cache-components-optimizer`

---

## 3. Agent Browser with React Introspection

`next-browser` from 16.2 merged into the general-purpose `agent-browser` CLI (works beyond Next.js).

**v0.27 adds React DevTools introspection:**

- `react tree` — list component tree
- `react inspect <fiberId>` — inspect a single component
- `react renders start/stop` — profile re-renders
- `react suspense --only-dynamic --json` — see what's holding a render

Requires `--enable react-devtools` at launch. The `next-dev-loop` Skill launches with this enabled automatically.

Install/upgrade: `npm install -g agent-browser@^0.27`

---

## 4. Actionable Errors (Instant Insights)

With Cache Components, `await` on the server is a choice. Instant Insights present three labeled fixes:

| Fix | What it does |
|-----|-------------|
| **Stream** | Wrap data access in `<Suspense fallback={...}>` |
| **Cache** | Cache with `"use cache"` (doesn't apply to `connection()`) |
| **Block** | Set `export const instant = false` to allow blocking route |

### Copy as prompt

Each fix has a "Copy as prompt" button that packages the fix into a paste-ready prompt for coding agents. The prompt walks through: identifying code → reading error docs → applying pattern → verifying at runtime.

### Structured console output

Same fix menu appears in terminal during `next dev` and `next build`. Agents reading CI logs get labeled fixes with links to error docs.

### Error docs pages

Every error gets its own page on `nextjs.org/docs/messages` with: canonical **Patterns**, **Trade-offs**, and **Gotchas**. Example: `blocking-prerender-dynamic` for uncached `fetch()`.

Full index: `/docs/llms.txt` and `/docs/llms-full.txt` (all docs in one file, follows `llms.txt` convention).

---

## 5. Leaner MCP Server

Knowledge-base tools removed from the DevTools MCP server (bundled docs now serve that purpose).

**New tools in 16.3:**

- `get_compilation_issues` — project-wide compilation check
- `compile_route` — single route compilation check

Both answer "does this compile?" from the running dev server, much faster than `next build`.

Skills like `next-dev-loop` call `/_next/mcp` directly — no extra MCP setup needed.

---

## 6. Docs as Markdown

- Append `.md` to any `nextjs.org/docs` URL for plain Markdown.
- Clients sending `Accept: text/markdown` get Markdown automatically.
- Full index: `https://nextjs.org/docs/llms.txt`

---

## Relevance to TOLOM

| Feature | TOLOM Impact |
|---------|-------------|
| Bundled docs via AGENTS.md | Already in place (16.2+). Agents read version-matched docs. |
| `next-dev-loop` Skill | Useful for verifying UI changes at runtime after edits. |
| Actionable errors | Helps agents fix Cache Component blockers without manual intervention. |
| Leaner MCP | Faster compilation checks without full `next build`. |
| Docs as Markdown | Agents can fetch any Next.js docs page as clean markdown. |
