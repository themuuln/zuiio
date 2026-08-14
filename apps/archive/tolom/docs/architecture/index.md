---
title: Architecture Overview
desc: High-level architecture of tolom
---

# Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer"]
        UI["UI / Components"]
        State["State Management"]
        Router["Routing / Navigation"]
    end

    subgraph API["API Layer"]
        Routes["Route Handlers"]
        Middleware["Middleware"]
        Validation["Input Validation"]
    end

    subgraph Data["Data Layer"]
        Models["Data Models"]
        Repos["Repositories"]
        Cache["Caching"]
    end

    subgraph External["External"]
        DB[("Database")]
        Services["Third-party Services"]
        Storage["File Storage"]
    end

    UI --> State
    UI --> Router
    Router --> Routes
    Routes --> Middleware
    Middleware --> Validation
    Validation --> Repos
    Repos --> Models
    Repos --> Cache
    Repos --> DB
    Repos --> Services
    Repos --> Storage

    style Frontend fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
    style API fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
    style Data fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
    style External fill:var(--doc-theme-bg-subtle, #e8e8e8),stroke:var(--doc-theme-color, #333)
```

