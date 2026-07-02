---
description: Sync project documentation with code changes using Documentizer
argument-hint:
---

Use the sync-docs skill to sync documentation with the latest code changes.

1. Run `./scripts/documentize.sh sync` to check what changed
2. Read the diff since last sync commit
3. Update the relevant docs in `docs/`
4. Run `pnpm run docs:build` to verify
5. Run `./scripts/documentize.sh sync --commit` to stamp the sync
6. Commit the doc changes

Do this before any PR/MR so docs stay current.
