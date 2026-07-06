# @zuiio — Project Instructions (for AI agents)

> **⚠️ Required reading for AI agents:** Before writing any code, load these files for full context:
>
> 1. `docs/design.md` — design tokens (OKLch colors, typography, spacing, motion, component conventions)
> 2. `docs/vision.md` — product vision and how we build
> 3. `docs/stack-web.md` — Next.js 16 stack (when working on web apps)
> 4. `docs/stack-mobile.md` — React Native + Expo stack (when working on mobile apps)
> 5. `.claude/instructions.md` — design essentials and common patterns (quick reference)
>
> You MUST read these before starting any significant task. This file (`AGENTS.md`) covers project structure, package map, and conventions.

**Private monorepo** (`/Users/themuuln/coding/personal/zuiio/`) serving two Mongolian business apps: **Zer** (SMB ERP) and **Tolom** (auto repair shop management), plus the **Zuiio company website**.

## Directory Structure

```
zuiio/
├── packages/        ← 10 shared @zuiio/* packages
├── apps/
│   ├── website/     ← Company website (Next.js 16, Tailwind v4)
│   ├── zer/         ← SMB ERP app (464 src files)
│   │   └── packages/branding/  ← @zer/branding
│   └── tolom/       ← Auto repair app (1086 src files)
│       └── packages/{config,supabase}  ← @tolom/*
├── docs/            ← Design system, stacks, vision
├── templates/       ← Project boilerplate
├── .claude/         ← AI agent instructions
├── README.md
└── AGENTS.md        ← Project instructions (this file)
```

## Apps

| App | Stack | Description | dev command |
|-----|-------|-------------|-------------|
| `website` | Next.js 16, Tailwind v4 | Company site | `cd apps/website && pnpm dev` |
| `zer` | Next.js 16 + Supabase | SMB ERP | `cd apps/zer && pnpm dev` |
| `tolom` | Next.js 16 + Supabase | Auto repair management | `cd apps/tolom && pnpm dev` |

Each app has its own `AGENTS.md` with app-specific rules. Read them when working in that app.

## Packages

| Package | Layer | Description | Dependencies |
|---------|-------|-------------|--------------|
| `branding` | Framework-agnostic | OKLch design tokens, globals.css source of truth | — |
| `config` | Build | Shared tsconfig extended by all packages | — |
| `core` | Framework-agnostic | Formatting, validation, errors, timezone, domain rules, UUID, form validation, **lookup utilities: `createLookup()` `createAggregatedLookup()`** (O(1) Map builders replacing array.find) | date-fns |
| `hooks` | React | `useDebounce` `useDisclosure` `useCopyToClipboard` `useFuzzySearch` `useOnlineStatus` `useLocalStorage` `useIntersectionObserver`, **`useLookup()` `useAggregatedLookup()`** (memoized Map hooks) | react |
| `query` | React/Next | React Query provider + optimistic CRUD hooks (FormData + JSON) | @tanstack/react-query, react |
| `realtime` | React/Next | Supabase Realtime hooks: useRealtime, useRealtimeMulti | @supabase/supabase-js, @tanstack/react-query, react |
| `ui` | React | HighlightText, toastRetry, form input props, Mongolian phone/plate formatting | react, sonner |
| `offline` | Framework-agnostic | Mutation queue engine, IndexedDB persister, useOfflineMutation | idb, react |
| `hr` | Framework-agnostic | Mongolian payroll: income tax, social insurance, overtime, salary | — |
| `export` | Framework-agnostic | CSV, XLSX (ExcelJS), DOCX (docx), PDF (pdf-lib) generation + serveEntityExport | exceljs, docx, pdf-lib, @pdf-lib/fontkit |

## Consumer Projects

All apps consume `@zuiio/*` packages via `workspace:*` protocol inside this monorepo:

```json
"@zuiio/core": "workspace:*"
```

## Development Workflow

### Runtime verification

- **After every edit that changes UI or behavior**, verify the page still works at runtime — not just that it compiles.
- Use the `next-dev-loop` skill (installed in each app's `.agents/skills/`): it cross-checks `/_next/mcp` (Next.js framework view) against `agent-browser` (real Chrome view).
- Check four things: compiles, runs without errors, behaves as intended, no regressions in React tree.
- Requires: `next dev` running with Turbopack, and `agent-browser >= 0.31.1` (`npm i -g agent-browser@latest`).

## Conventions


### Adding a new function/utility

1. **Framework-agnostic, no React** → `@zuiio/core` or a new package
2. **React hook** → `@zuiio/hooks` (generic) or `@zuiio/query` (TanStack Query)
3. **Mongolian business logic** → `@zuiio/core/src/domain-rules.ts` (validation) or `@zuiio/hr` (payroll)
4. **UI component** → Not here. UI lives in each project's `src/components/`. Only pure utilities go in `@zuiio/ui`
5. **⚠️ After adding any new export:** Update the Packages table above — add the new function/hook name to its package's Description column so agents discover it without reading every source file. Also add or update a `README.md` in the package root.

### Package structure

Every package follows:

```
packages/<name>/
├── package.json      # name: "@zuiio/<name>", main: "./src/index.ts"
├── tsconfig.json     # extends "@zuiio/config/tsconfig"
└── src/
    ├── index.ts      # Public barrel — only export what consumers need
    └── *.ts          # Implementation files
```

### TypeScript

- Strict mode (via `@zuiio/config/tsconfig`)
- `noUncheckedIndexedAccess: true`
- All packages checked together: `pnpm exec tsc --noEmit`

### Dependencies

- **Runtime deps** go in `dependencies` (not `peerDependencies`) — this is a private monorepo
- **React packages**: `react` + `@types/react` in `devDependencies` (consumers provide React 19)
- **No circular deps** between packages

## Commands

```bash
pnpm install                # Install all deps
pnpm exec tsc --noEmit      # Type-check all packages
pnpm test                   # Run tests (in packages with vitest)
```

## What NOT to put here

| Leaves in project | Why |
|-------------------|-----|
| Domain-specific DB adapters (hr-supabase) | Schema-dependent |
| UI components (Buttons, Drawers, Tables) | Each project has its own design system |
| Supabase client config | Project-specific auth + keys |
| i18n translation files | Project-specific copy |
| Branding/theming | Project-specific visual identity |
| 30+ IDB store names (Tolom's idb-store.ts) | Domain-specific schema |

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-fetching-data.mdx,07-mutating-data.mdx,08-caching.mdx,09-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{adopting-partial-prefetching.mdx,ai-agents.mdx,analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching-without-cache-components.mdx,cdn-caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,deploying-to-platforms.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,how-revalidation-works.mdx,incremental-static-regeneration-cache-components.mdx,incremental-static-regeneration.mdx,instant-navigation.mdx,instrumentation.mdx,interactive-apps.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,migrating-to-cache-components.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,ppr-platform-guide.mdx,prefetching.mdx,preserving-ui-state.mdx,preventing-flash-before-hydration.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,rendering-philosophy.mdx,runtime-prefetching.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,server-actions.mdx,single-page-applications.mdx,static-exports.mdx,streaming.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx,view-transitions.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.mdx,instant.mdx,maxDuration.mdx,preferredRegion.mdx,prefetch.mdx,runtime.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,middleware.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,catchError.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,io.mdx,next-request.mdx,next-response.mdx,next-root-params.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,instrumentationClientInject.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,outputHashSalt.mdx,pageExtensions.mdx,partialPrefetching.mdx,poweredByHeader.mdx,prefetchInlining.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,turbopackIgnoreIssue.mdx,turbopackLocalPostcssConfig.mdx,turbopackMemoryEviction.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|01-app/03-api-reference/07-adapters:{01-configuration.mdx,02-creating-an-adapter.mdx,03-api-reference.mdx,04-testing-adapters.mdx,05-routing-with-next-routing.mdx,06-implementing-ppr-in-an-adapter.mdx,07-runtime-integration.mdx,08-invoking-entrypoints.mdx,09-output-types.mdx,10-routing-information.mdx,11-use-cases.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,logging.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|02-pages/04-api-reference/06-adapters:{01-configuration.mdx,02-creating-an-adapter.mdx,03-api-reference.mdx,04-testing-adapters.mdx,05-routing-with-next-routing.mdx,06-implementing-ppr-in-an-adapter.mdx,07-runtime-integration.mdx,08-invoking-entrypoints.mdx,09-output-types.mdx,10-routing-information.mdx,11-use-cases.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
