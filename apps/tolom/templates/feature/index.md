---
title: {{FEATURE_NAME}}
desc: {{FEATURE_DESCRIPTION}}
---

# {{FEATURE_NAME}}

{{ONE_PARAGRAPH_SUMMARY}}

## Overview

{{WHAT_IT_DOES_AND_WHY}}

## Architecture

```mermaid
flowchart TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
```

## Key Components

| File | Purpose |
|------|---------|
| `src/{{feature}}/controller.ts` | Business logic |
| `src/{{feature}}/page.tsx` | UI layer |
| `src/{{feature}}/model.ts` | Data models |

::: info
Adjust paths to match your project structure:
- **Flutter**: `lib/{{feature}}/controller.dart`, `lib/{{feature}}/screen.dart`
- **Next.js**: `src/{{feature}}/page.tsx`, `src/{{feature}}/actions.ts`
- **React**: `src/components/{{feature}}/index.tsx`
- **Go**: `internal/{{feature}}/handler.go`
- **Rust**: `src/{{feature}}/mod.rs`
:::

## How It Works

### {{STEP_1_NAME}}

{{DESCRIPTION}}

```typescript
// Example from actual code
{{CODE_EXAMPLE}}
```

## State Management

```mermaid
sequenceDiagram
    participant User
    participant Screen
    participant Controller
    participant API

    User->>Screen: Action
    Screen->>Controller: Handle
    Controller->>API: Request
    API-->>Controller: Response
    Controller-->>Screen: Update state
    Screen-->>User: Render
```

## Edge Cases

- **Offline behavior**: {{OFFLINE_DESCRIPTION}}
- **Error handling**: {{ERROR_DESCRIPTION}}
- **Loading states**: {{LOADING_DESCRIPTION}}

## Related

- [Architecture](/architecture.html)
- [API Reference](/api/index.html)
