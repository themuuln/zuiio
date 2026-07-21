@AGENTS.md

## ZRAf — Project-Specific Instructions

- **Goal**: Ship to 1-person tester on Vercel quickly
- **Workflow**: Trunk-based, feature branches for bigger changes
- **Autonomy**: Autonomous — no breakpoints for routine work
- **Deploy target**: Vercel (Hobby plan, 100MB limit)
- **Data**: Static JSON + images in `public/data/` — watch total size
- **No CI/CD** for now
- **No tests** — add when ready for production
- **Linter/formatter**: Biome (`biome check`, `biome format --write`)
