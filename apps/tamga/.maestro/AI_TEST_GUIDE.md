# AI-Driven Test Generation Guide for Tamga

## Quick Start

### 1. Using Maestro MCP (Recommended)

The project's `.mcp.json` already includes Maestro MCP. In Cursor, Claude Desktop, or any MCP-compatible IDE:

```
You: "Write a Maestro test for the lost horse reporting flow"
AI: [inspects screen, generates YAML, runs it, self-corrects]
```

**MCP Tools Available:**
- `inspect_screen` — get current screen's view hierarchy
- `take_screenshot` — visual debugging
- `run` — execute Maestro flows
- `run_code` — ad-hoc inline flow execution
- `cheat_sheet` — Maestro command reference

### 2. Codebase-Aware Prompting (Best Results)

Load existing tests into context before generating new ones:

```
Write a Maestro test for [FEATURE]. Here are 2 existing tests for reference:

[01-app-launch.yaml content]
[03-horses-tab.yaml content]

Follow the same patterns: appId, clearState, dismiss-open-dialog subflow, 
extendedWaitUntil with timeouts, takeScreenshot at the end.
```

**Why this works:** Raw LLM output "looks correct but fails at runtime" 
(Grindr's experience). Loading existing tests teaches the LLM your:
- Element IDs and accessibility labels
- Timeout conventions
- Subflow patterns
- Screenshot naming conventions

### 3. Manual Test Writing

Follow the pattern in existing flows:

```yaml
appId: mn.tamga.app
name: Feature Name

onFlowStart:
  - clearState

---
- launchApp

- runFlow:
    when:
      visible: "Open"
    file: ../subflows/dismiss-open-dialog.yaml

# Navigate to feature
- tapOn: "Tab Name, tab, N of 8"
- extendedWaitUntil:
    visible: "Expected Text"
    timeout: 30000

# Interact with feature
- tapOn: "Button Text"
- extendedWaitUntil:
    visible: "Result Text"
    timeout: 10000

# Assert and screenshot
- assertVisible: "Expected Text"
- takeScreenshot: feature_name
```

## Running Tests

```bash
# Run all tests
maestro test .maestro/

# Run single test
maestro test .maestro/flows/01-app-launch.yaml

# Run tests with specific tag
maestro test .maestro/ --include-tags=smoke

# Open Maestro Studio (visual test builder)
maestro studio
```

## Test Structure

```
.maestro/
├── config.yaml              # Global config (appId, platform settings)
├── AI_TEST_GUIDE.md         # This file
├── flows/                   # Test flows (numbered for ordering)
│   ├── 01-app-launch.yaml
│   ├── 02-tab-navigation.yaml
│   ├── ...
│   └── 91-screenshot-horse.yaml
└── subflows/                # Reusable subflows
    ├── connect-dev-server.yaml
    ├── dismiss-alert.yaml
    └── dismiss-open-dialog.yaml
```

## Naming Conventions

- **Flows:** `XX-feature-name.yaml` (numbered for execution order)
- **Screenshots:** `feature_name` (snake_case, matches flow name)
- **Subflows:** `action-description.yaml` (reusable across flows)

## Best Practices

1. **Always use `extendedWaitUntil`** with timeout (not `waitForAnimationToEnd`)
2. **Always dismiss alerts** at flow start using the subflow
3. **Always take screenshots** at the end for visual verification
4. **Use accessibility labels** (Mongolian text) for selectors
5. **Keep flows focused** — one feature per flow
6. **Use subflows** for repeated actions (dismiss dialogs, connect to dev server)

## Debugging

```bash
# Record a test session
maestro record

# Inspect current screen hierarchy
maestro inspect

# Test with Maestro Studio (visual)
maestro studio
```

## AI Prompt Templates

### Generate a new test
```
Write a Maestro E2E test for [FEATURE DESCRIPTION].

Context:
- App ID: mn.tamga.app
- Use clearState on flow start
- Include dismiss-open-dialog subflow
- Use extendedWaitUntil with 10000ms timeout
- Take screenshot at end

Reference existing tests:
[ paste 2-3 existing flows ]
```

### Debug a failing test
```
This Maestro test is failing at [STEP]. Here's the error:
[ paste error ]

Current flow:
[ paste flow YAML ]

Please diagnose and fix.
```

### Generate test from user story
```
As a [USER], I want to [ACTION] so that [BENEFIT].

Write a Maestro E2E test for this user story.
Use the patterns from existing tests in .maestro/flows/.
```
