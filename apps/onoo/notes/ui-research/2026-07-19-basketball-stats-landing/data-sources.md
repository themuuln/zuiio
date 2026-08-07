# Data Sources & Methodology

## Research Date
2026-07-19

## Sites Analyzed
- NBA.com (homepage, stats/leaders)
- Basketball-Reference.com (homepage, leaders)

## Collection Methods
- **NBA.com**: Content scraped via `read` tool (Jina reader) — direct browser access blocked by anti-bot (Access Denied)
- **Basketball-Reference.com**: Browser automation via `agent-browser` — screenshots captured, accessibility tree snapshots collected

## Artifacts
- `bbref-home.png` — Basketball-Reference homepage screenshot (1280x577, 310KB)
- `bbref-leaders.png` — Basketball-Reference leaders page screenshot (1280x577, 131KB)

## Limitations
- NBA.com visual analysis is inferred from DOM structure, not direct screenshots (anti-bot blocked browser)
- No mobile/responsive testing performed
- No authenticated/logged-in views analyzed
- Basketball-Reference leaders page snapshot was image-only (accessibility tree rendered as PNG in context)
