# @zuiio/config — Shared TypeScript Configs

Centralized `tsconfig.json` and `tsconfig.base.json` for the zuiio monorepo. Extend these from any package or app to stay consistent.

## Files

| File | Purpose | Target | Module Resolution |
|---|---|---|---|
| `tsconfig.json` | **Monorepo root** — includes `paths` aliases for all `@zuiio/*` packages, declaration emit, source maps | ES2022 | `bundler` |
| `tsconfig.base.json` | **App/package base** — lean, no `paths`, no emit. Extend this from individual packages | ES2017 | `bundler` |

## Usage

### From a package

Extend the base config and add your own source files:

```jsonc
{
  "extends": "@zuiio/config/tsconfig",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### From an app (e.g. Next.js)

Extend the base config for client/server code without path aliases:

```jsonc
{
  "extends": "@zuiio/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "noEmit": true
  },
  "include": ["src", "next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

> Apps that use the root `tsconfig.json` already get the `@zuiio/*` path aliases for IDE resolution.

## Key Settings

### `tsconfig.json` (root)

| Setting | Value | Why |
|---|---|---|
| `target` | `ES2022` | Modern runtime — top-level await, native `Array.at()` |
| `declaration` / `declarationMap` | `true` | Emit `.d.ts` + maps for package consumers |
| `sourceMap` | `true` | Debuggable compiled output |
| `incremental` | `true` | Faster rebuilds via `.tsbuildinfo` |
| `paths` | 11 `@zuiio/*` aliases | IDE go-to-definition across packages |

### `tsconfig.base.json`

| Setting | Value | Why |
|---|---|---|
| `target` | `ES2017` | Broader compat for environments without ES2022 support |
| `noEmit` | `true` | Type-checking only — bundler (Turbopack/Next.js) handles emit |
| `isolatedModules` | `true` | Required by esbuild/swc transpilers |
| `incremental` | `false` | No `.tsbuildinfo` — type-check only, no build output |

Both configs share: `strict`, `esModuleInterop`, `skipLibCheck`, `resolveJsonModule`, `module: "ESNext"`, `moduleResolution: "bundler"`.
