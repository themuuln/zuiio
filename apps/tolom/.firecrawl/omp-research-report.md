# Oh My Pi (OMP) — Comprehensive Research Report

**Research Date:** 2026-07-11  
**Research Method:** 10 firecrawl_search queries + 5 page scrapes across GitHub, omp.sh, Reddit, HN, Medium, LinkedIn, explainx.ai, and more.

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **Name** | Oh My Pi (OMP) |
| **Author** | @can1357 (Can Bülük) — maintained as fork of [Mario Zechner](https://github.com/mariozechner)'s [Pi](https://github.com/badlogic/pi-mono) |
| **License** | MIT |
| **Stars** | ~17.1k (as of July 2026; was 16.4k in recent CI runs) |
| **Language** | TypeScript + Rust (100k+ LoC native engine) |
| **GitHub** | [github.com/can1357/oh-my-pi](https://github.com/can1357/oh-my-pi) |
| **Website** | [omp.sh](https://omp.sh/) |
| **Install** | `curl -fsSL https://omp.sh/install \| sh` |
| **Platforms** | macOS, Linux, Windows (native, no WSL) |
| **Dependencies** | Bun ≥ 1.3.14 |
| **Contributors** | 177+ contributors, 458+ forks |

### Tagline
> "A coding agent with the IDE wired in" — hash-anchored edits, optimized tool harness, LSP, Python, browser, subagents, and more.

---

## 2. Version Information

### Latest Version: **v16.4.3**

Evidence from search results:
- GitHub CI workflow: `chore: bump version to 16.4.3` — found in [run 28777279249](https://github.com/can1357/oh-my-pi/actions/runs/28777279249)
- GitHub releases page: `Full Changelog: v16.4.1..` visible in search snippets
- Prior version: `v16.3.9` and `v16.3.12` visible in AUR package metadata (last updated 2026-07-08)
- AUR package version: `16.3.12-1` (last updated 2026-07-08, slightly behind npm releases)

### Release Cadence
OMP has **458+ releases** as of June 2026 (per Medium article). The project ships extremely frequently — multiple releases per week based on CI evidence.

### Recent Notable Changes (v15.5 → v16.4.3 timeline)
From the official omp.sh "shipped recently" section and search snippets:

| Version Range | Key Features |
|---|---|
| **v15.5–15.11** | `/collab` session sharing, `snapcompact` compaction, `mnemopi` memory system, `/omfg` rule creation, on-device tiny models, `auto` thinking, 40+ providers |
| **v16.x** | Expanded search capabilities, scraping reliability, expanded search capabilities, serialized queued input mutations |
| **v16.4.3** (latest) | Fixed OpenAI Codex model discovery, Codex version header, client_version query parameter, serialized BigInt tool arguments for remote compaction, xAI compatibility fixes |

---

## 3. Core Features

### 3.1 Hash-Anchored Edits (Hashline)
- **What:** Each line is tagged with a 4-hex content-hash. The model references anchors instead of retyping lines.
- **Why:** Eliminates whitespace battles and string-not-found loops. If file changed since last read, hashes diverge and edit is rejected before corruption.
- **Impact:** Grok Code Fast 1 went from **6.7% → 68.3% success rate**. Grok 4 Fast spends **61% fewer output tokens**. Gemini 3 Flash gains **+5 pp**. MiniMax **doubles** pass rate.
- Benchmarked across 16 models, 180 tasks, 3 runs.

### 3.2 LSP Integration
- 14 LSP operations, 53 language servers
- Format-on-write, rename with `willRenameFiles` propagation (updates re-exports, barrel files, aliased imports)
- Diagnostics, navigation, symbols, code actions, raw requests

### 3.3 DAP Debugging
- 28 DAP operations, 14 bundled adapters (lldb-dap, dlv, debugpy, etc.)
- Attach via stdio, unix, TCP, PID
- Breakpoints, stepping, threads, stack frames, variable inspection, expression evaluation
- Gated behind `debug.enabled`

### 3.4 Time-Traveling Stream Rules (TTSR)
- Rules sit dormant until regex matches on model output mid-stream
- Aborts the stream, injects rule as system reminder, retries from same point
- Zero context tax until matched
- Injections survive compaction
- Modes: interrupt × repeat × context

### 3.5 Subagent Orchestration
- `task` fans out to isolated worktrees (APFS clones, btrfs reflinks, overlayfs, etc.)
- Each worker runs its own tool surface
- Typed, schema-validated output — no prose parsing
- IRC channel for peer-to-peer agent communication
- Default concurrency: 32 (0 = unlimited)
- 8 bundled agents

### 3.6 Advisor Model
- Pair a reviewer model to "advisor" role
- Reads every turn, injects inline notes (aside / concern / blocker)
- Runs on its own context and model
- Scopes to main + subagents (opt-in)

### 3.7 Live Session Sharing (`/collab`)
- Share live session via E2E-encrypted relay link (AES-256-GCM)
- URL fragment = key (never touches wire)
- Guests prompt, interrupt, drive host's subagents
- View-only mode for watchers
- Browser client (`collab-web`) — no install needed
- QR code generation

### 3.8 SnapCompact Compaction
- **What:** Replaces LLM summarization with deterministic on-device rendering to pixel-font PNGs
- **How:** 1568×1568 PNG carries ~40,000 characters in 6×10 pixel font (~10k tokens → ~3,279 image tokens under Anthropic's formula)
- **Benefits:** Instant (no model call), local (no data sent off-device), free (zero compaction spend)
- **Evidence:** White-box on Qwen2.5-VL-7B: cross-carrier retrieval 12/12 from layer 2; correlation r=0.94
- Published at [blog.can.ac/2026/06/10/snapcompact](https://blog.can.ac/2026/06/10/snapcompact/)
- Configurable: `compaction.strategy = snapcompact`, `snapcompact.shape` auto-tunes per model
- 4 strategies total: `context-full`, `handoff`, `shake`, `snapcompact`

### 3.9 Eval Kernel with Tool-Calling
- Persistent Python + Bun Worker kernels
- Either kernel can call back into agent tools (read, write, search, task) over loopback bridge
- Magics: `%pip`, `%time`, `%bash`, `!cmd`
- Session-scoped persistence

### 3.10 Memory System (Mnemopi)
- Local SQLite backend with vector embeddings and graph tools
- Tools: `retain`, `recall`, `reflect`, `memory_edit`
- Scoping: global, per-project, or per-project-tagged
- Delegated subagents inherit parent's memory state
- One shared tiny-model worker handles extraction (qwen3-1.7b, gemma-3-1b, etc.)

### 3.11 Native Rust Engine
- 100,000+ lines of Rust across 7 crates + vendored shell
- In-process ripgrep, glob, find, AST (ast-grep), shell (brush-shell)
- No fork/exec on hot path
- Kitty keyboard protocol with xterm fallback
- SIXEL terminal image rendering
- BPE token counting (tiktoken-rs)
- Platforms: linux-x64/arm64, darwin-x64/arm64, win32-x64

### 3.12 Web Search & Retrieval
- 14 backends (auto-chain, exa, brave, jina, anthropic, perplexity, gemini, etc.)
- Site-aware extraction: GitHub, Stack Overflow, arXiv, registries
- Security DB lookups: NVD, OSV, CISA KEV
- Markdown output with anchors preserved

### 3.13 Orchestrate
- Drop the word `orchestrate` in a prompt → multi-phase, parallel-subagent contract
- Live agent roster viewable via `Ctrl+S`
- Similar to "ultrathink" keyword pattern

### 3.14 Code Review (`/review`)
- Spawns dedicated reviewer subagents in parallel
- P0–P3 priority ranking with confidence scores
- Verdict: correct / incorrect
- Branches, single commits, or uncommitted work

### 3.15 GitHub as Filesystem
- Internal URL schemes: `pr://`, `issue://`, `agent://`, `skill://`, `rule://`, `conflict://`
- PRs are paths: `read pr://owner/repo/123`
- SQLite cache with soft + hard TTL
- Background refresh, never blocks

### 3.16 Discovery / Config Inheritance
- Reads 8 existing config formats natively: Cursor MDC, Cline, Codex AGENTS.md, Copilot applyTo, etc.
- No migration script needed

### 3.17 `omp commit`
- Reads working tree, splits unrelated changes into atomic commits
- Topological ordering, dependency-aware
- Source files score above tests/docs/configs

### 3.18 ACP (Agent Client Protocol)
- Run inside Zed editor via JSON-RPC over stdio
- Same agent, same tools, editor-gated permissions

### 3.19 Browser Automation
- Puppeteer over headless Chromium or CDP-attached apps
- Stealth mode by default
- Can drive Electron apps (Slack, etc.)

### 3.20 Obsidian Vault Integration
- `vault://<vault>/<path>` reads and edits Obsidian notes
- Gated behind `vault.enabled`

---

## 4. "Vibe Mode" Feature

**Limited information found.** The search for "vibe mode" yielded only one direct OMP reference:

- **Source:** [pi.dev/packages/pi-powerline-footer](https://pi.dev/packages/pi-powerline-footer) — a powerline footer package for Pi/OMP
- **What it does:** Shows the current mode in the footer bar. Two modes referenced:
  - `generate` mode
  - `file` mode
- **Usage:** `/vibe mode file` — switches between modes

This appears to be a **Pi extension** (not OMP-native) that controls whether the agent operates in a "generate" mode (free-form coding) or "file" mode (more constrained/file-focused). The broader "vibe coding" concept referenced in community discussions relates to the general approach of letting AI agents code freely — OMP's approach is more structured, with plan mode, TTSR rules, and advisor oversight as guardrails.

[INFERENCE] "Vibe mode" in the Pi/OMP ecosystem likely refers to a less-structured coding mode that trades control for speed, contrasted with plan mode and structured review workflows.

---

## 5. "Director Pattern" / Agent Orchestration

**Limited OMP-specific results.** The search for "OMP AI agent harness director pattern" returned generic agent harness architecture articles (Addy Osmani's "Agent Harness Engineering", LangChain's "Anatomy of an Agent Harness", etc.) rather than OMP-specific content.

However, OMP's orchestration model is well-documented through its features:

| Pattern | OMP Implementation |
|---|---|
| **Director/Orchestrator** | Main agent + `orchestrate` keyword for parallel multi-phase execution |
| **Subagent Delegation** | `task` tool with isolated worktrees, typed output, IRC coordination |
| **Advisor/Reviewer** | Second model watching every turn, injecting asides/concerns/blockers |
| **Fan-out** | Default 32 concurrent subagents, bounded pools via `parallel()` |

[INFERENCE] OMP doesn't use the "director" terminology explicitly — it uses the term "orchestrate" for its parallel agent coordination pattern.

---

## 6. User/Community Reactions

### Positive

| Source | Sentiment | Quote/Summary |
|---|---|---|
| **Reddit r/OnlyAICoding** | Very positive | "Switched OhMyPi around 2 weeks ago, and quite stunned with its stability." |
| **Hacker News** | Positive | "I began with pi, and have been using oh-my-pi the last two weeks... More of a batteries included version of pi." |
| **LinkedIn (Aaron Stanton)** | Positive | "I've really been enjoying the agentic harness, Oh-My-Pi... improves AI coding performance" |
| **LinkedIn (Anas Abdi)** | Positive | "The coding agent is called Oh-my-pi, or OMP. It's a fork of pi-mono, extended into a batteries-included coding workflow." |
| **Threads (@deepakness)** | Top-rated | Rated 9.2/10, Tier 1: "Oh My Pi — 9.2/10, Codex CLI — 9.0/10" |
| **Medium (Joe Njenga)** | Very positive | "FREE Claude Code Alternative That Just Exploded (50+ Providers)" — detailed hands-on tutorial |

### Cautious / Mixed

| Source | Sentiment | Quote/Summary |
|---|---|---|
| **Hacker News (reacharavindh)** | Mixed | Builds locally for customization, noted upstream updates can confuse models about tool usage. Recommends being "more diligent about pulling upstream changes" |
| **Reddit r/opencodeCLI** | Mixed | "Went with pi but for example an lsp is not included. Then looked at oh my pi. Way too [complex?]" |

### Key Themes in Community Discussion
1. **Claude Code alternative** — most comparisons are against Claude Code, with OMP winning on provider flexibility and cost
2. **Batteries-included vs Pi** — OMP is seen as the power-user version of Pi
3. **Edit accuracy** — hashline edits are the most-praised feature
4. **Learning curve** — some users find the feature set overwhelming compared to simpler tools
5. **Upstream sync** — custom forks can drift from upstream, causing tool confusion

---

## 7. Provider Support (40+)

### Group A: Frontier APIs
Anthropic, OpenAI, OpenAI Codex, Google Gemini, Google Antigravity, xAI, Mistral, Groq, Cerebras, Fireworks, Together, Hugging Face, NVIDIA, OpenRouter, Synthetic, Vercel AI Gateway, Cloudflare AI Gateway, Perplexity

### Group B: Coding Plans
Cursor, GitHub Copilot, GitLab Duo, Gemini CLI, Kimi Code, Moonshot, MiniMax, Alibaba, Qwen Portal, Z.AI/GLM, Xiaomi MiMo, Qianfan, NanoGPT, Venice, Kilo, ZenMux, OpenCode Go, OpenCode Zen, Wafer Pass/Serverless

### Group C: Self-hosted
Ollama, Ollama Cloud, LM Studio, llama.cpp, vLLM, LiteLLM

### Custom
Anything speaking `openai-completions`, `anthropic-messages`, `google-generative-ai`, etc. in `~/.omp/agent/models.yml`

---

## 8. Monorepo Structure

| Package | Description |
|---|---|
| `@oh-my-pi/pi-agent-ai` | Multi-provider LLM client with streaming/model/provider integration |
| `@oh-my-pi/pi-agent-core` | Agent runtime with tool calling and state management |
| `@oh-my-pi/pi-coding-agent` | Interactive coding agent CLI and SDK |
| `@oh-my-pi/pi-tui` | Terminal UI library with differential rendering |
| `@oh-my-pi/pi-natives` | N-API bindings for grep, shell, image, text, syntax highlighting |
| `@oh-my-pi/pi-utils` | Shared utilities (logging, streams, dirs/env/process helpers) |
| `@oh-my-pi/omp-stats` | Local observability dashboard for AI usage statistics |
| `@oh-my-pi/snapcompact` | Bitmap-frame context compression for vision-capable LLMs |

---

## 9. Links to Source Material

| Resource | URL |
|---|---|
| GitHub Repository | https://github.com/can1357/oh-my-pi |
| Official Website | https://omp.sh/ |
| Releases Page | https://github.com/can1357/oh-my-pi/releases |
| Documentation | https://omp.sh/docs |
| Compaction Docs | https://github.com/can1357/oh-my-pi/blob/main/docs/compaction.md |
| Snapcompact Blog Post | https://blog.can.ac/2026/06/10/snapcompact/ |
| Snapcompact X Thread | https://x.com/_can1357/article/2064802476742574459 |
| Hindsight Memory Integration | https://hindsight.vectorize.io/blog/2026/06/08/oh-my-pi-hindsight-memory |
| Explainx Field Guide | https://explainx.ai/blog/oh-my-pi-terminal-coding-agent-omp-mario-zechner-2026 |
| Medium Review (Joe Njenga) | https://medium.com/@joe.njenga/i-tried-oh-my-pi-free-claude-code-alternative-that-just-exploded-50-providers-114227324b53 |
| Knightli Setup Guide | https://knightli.com/en/2026/05/23/oh-my-pi-ai-coding-agent-terminal-ide-lsp-debugger/ |
| DeepSeek Integration Docs | https://api-docs.deepseek.com/quick_start/agent_integrations/oh_my_pi |
| AUR Package | https://aur.archlinux.org/packages/oh-my-pi |
| SourceForge Mirror | https://sourceforge.net/projects/oh-my-pi.mirror/ |
| Discord Community | https://discord.gg/oh-my-pi |
| SkillsLLM Profile | https://skillsllm.com/skill/oh-my-pi |
| Open Source Alternatives | https://www.opensourcealternatives.to/item/oh-my-pi |
| Reddit Discussion 1 | https://www.reddit.com/r/OnlyAICoding/comments/1ry7iyf/any_thoughts_about_ohmypi_coding_agent/ |
| Reddit Discussion 2 | https://www.reddit.com/r/PiCodingAgent/comments/1u07mu2/ |
| HN Discussion | https://news.ycombinator.com/item?id=47149494 |
| YouTube Overview | https://www.youtube.com/watch?v=8ukl-0tlVgM |
| YouTube Building with Pi | https://www.youtube.com/watch?v=lK9o5Wu2upU |

---

*Report compiled from 10 firecrawl_search queries and 5 page scrapes on 2026-07-11.*
