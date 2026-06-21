# Dependencies

Active contributors: themuuln

Key external packages used in the Zer codebase.

## Core framework

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.6 | React framework with App Router |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | React DOM renderer |
| `typescript` | ^5.9.3 | TypeScript compiler |

## Database and auth

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | 2.108.2 | Supabase JavaScript client |
| `@supabase/ssr` | 0.10.3 | Supabase SSR helpers for Next.js |
| `server-only` | 0.0.1 | Ensure server-only code isn't imported client-side |

## UI and styling

| Package | Version | Purpose |
|---------|---------|---------|
| `@base-ui/react` | ^1.6.0 | Unstyled headless UI primitives (Drawer, Select, Combobox, Menu) |
| `radix-ui` | ^1.6.0 | Radix UI component library |
| `tailwindcss` | ^4.3.1 | Utility-first CSS framework |
| `@tailwindcss/postcss` | ^4.3.1 | Tailwind CSS PostCSS plugin for v4 |
| `tw-animate-css` | ^1.4.0 | Tailwind animation utilities |
| `class-variance-authority` | ^0.7.1 | Component variant management |
| `clsx` | ^2.1.1 | Conditional class name utility |
| `tailwind-merge` | ^3.6.0 | Merge Tailwind classes without conflicts |
| `lucide-react` | ^1.21.0 | Icon library |
| `@phosphor-icons/react` | ^2.1.10 | Phosphor icon set (used for UI icons) |
| `cmdk` | ^1.1.1 | Command menu component |
| `input-otp` | ^1.4.2 | OTP input component |
| `sonner` | ^2.0.7 | Toast notifications |
| `next-themes` | ^0.4.6 | Theme (dark/light) management |
| `embla-carousel-react` | ^8.6.0 | Carousel component |
| `react-day-picker` | ^10.0.1 | Date picker component |
| `react-resizable-panels` | ^4.11.2 | Resizable split panels |

## State management and data fetching

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.101.0 | Server state management |
| `@tanstack/react-query-devtools` | ^5.101.0 | React Query devtools |
| `@tanstack/react-table` | ^8.21.3 | Table/grid component |

## Form handling

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.79.0 | Form state management |
| `@hookform/resolvers` | ^5.4.0 | Validation resolvers (zod) |
| `zod` | ^4.4.3 | Schema validation |

## Charts and data visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | ^3.8.1 | Charting library |

## Export and PDF generation

| Package | Version | Purpose |
|---------|---------|---------|
| `jspdf` | ^4.2.1 | PDF generation |
| `jspdf-autotable` | ^5.0.8 | PDF table plugin |
| `pdf-lib` | ^1.17.1 | PDF manipulation |
| `@pdf-lib/fontkit` | ^1.1.1 | PDF font embedding |
| `docx` | ^9.7.1 | DOCX document generation |
| `exceljs` | ^4.4.0 | Excel file generation |
| `nodemailer` | ^9.0.1 | Email sending |

## Date handling

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^4.4.0 | Date utility library |

## Barcode scanning

| Package | Version | Purpose |
|---------|---------|---------|
| `@yudiel/react-qr-scanner` | ^2.6.0 | QR and barcode scanner |

## Development and tooling

| Package | Version | Purpose |
|---------|---------|---------|
| `@biomejs/biome` | 2.2.0 | Linter and formatter |
| `husky` | ^9.1.7 | Git hooks |
| `lint-staged` | ^15.5.2 | Staged file linting |
| `vitest` | ^3.2.6 | Unit test runner |
| `@playwright/test` | ^1.61.0 | E2E test framework |
| `@axe-core/playwright` | ^4.11.3 | Accessibility testing |
| `@midscene/web` | ^1.9.7 | AI-assisted Playwright selectors |
| `codeceptjs` | ^4.0.8 | AI-assisted E2E testing |
| `@testing-library/react` | ^16.3.2 | React component testing |
| `@testing-library/jest-dom` | ^6.9.1 | Custom DOM matchers |
| `@testing-library/user-event` | ^14.6.1 | User event simulation |
| `jsdom` | ^29.1.1 | DOM environment for tests |
| `tsx` | ^4.22.4 | TypeScript execution for Node.js |
| `vite` | ^5.4.21 | Build tool for tests |
| `vite-tsconfig-paths` | ^5.1.4 | TypeScript path resolution for Vite |
| `@vitejs/plugin-react` | ^4.7.0 | React plugin for Vite |
| `babel-plugin-react-compiler` | 1.0.0 | React compiler plugin |
| `dotenv` | ^17.4.2 | Environment variable loading |
| `mermaid` | ^11.15.0 | Diagram generation |
| `react-grab` | ^0.1.47 | UI element grabbing |
| `wait-on` | ^9.0.10 | Wait for resources |
| `vitepress` | ^1.6.4 | Documentation site builder |
| `vitepress-mermaid-viewer` | ^0.4.0 | Mermaid diagram viewer for VitePress |
| `shadcn` | ^4.11.0 | shadcn/ui CLI tool |

## Platform

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | ^20.19.43 | Node.js type definitions |
