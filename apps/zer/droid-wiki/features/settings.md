# Settings

Active contributors: themuuln

The Settings page (`src/app/(dashboard)/settings/page.tsx`) is a server component that renders a `SettingsShell` with multiple card sections. It provides organization-wide configuration and user profile management.

## Sections

### Organization info

- **OrgInfoForm** — Edits organization name, slug, and company type.
- **OrgLogoUploader** — Uploads organization logo to the `brand_assets` storage bucket. Shows current logo if one exists.

### Brand presets (gated)

When the organization has `has_brands = true` and there are product presets in the database, a "Брэнд, бүтээгдэхүүний сан" (Brand and product library) card appears. It links to `/settings/presets` for importing pre-built brand and product templates.

### Profile form

- **ProfileForm** — Edits the current user's display name (`full_name`).
- Uses the shared `SettingsContext` save system with change tracking.

### Roles and permissions (gated by `roles.manage` permission)

- **RolesDrawer** — Opens a slide-in drawer for managing organization roles and their permissions.
- Shows all roles with their hierarchy level and system role indicator.
- Role permissions are loaded and displayed in the drawer.
- Only visible to users with the `roles.manage` permission.

### Notifications (superadmin only)

- **NotificationSettings** — Configure Telegram notification settings.
- Only rendered for the superadmin user (hardcoded as `zerone.offical@gmail.com`).

### SMTP config (superadmin + `has_email_reports`)

- **SmtpSettings** — Configure SMTP server for sending emails.
- Only shown when `has_email_reports = true` on the organization.
- Requires superadmin access.

### Report email settings (gated by `emails.manage` + `has_smtpConfig`)

- **ReportEmailSettings** — Configure who receives automated report emails.
- Shown when the organization has `has_email_reports = true`, the user has `emails.manage` permission, and an SMTP config exists.

### Branding

- **BrandingDrawer** — Slide-in drawer containing the `BrandingForm`.
- Allows configuring:
  - **7 themes**: Стандарт (neutral), Цэнхэр (blue), Ногоон (green), Ягаан (purple), Улбар шар (orange), Сарнай (rose), Гокийн спорт заал (goku-gym)
  - **10 fonts**: Inter, Onest, Manrope, Nunito, Montserrat, Noto Sans, Open Sans, Roboto, Plus Jakarta Sans, DM Sans
  - **Custom colors**: Override primary, secondary, and accent colors with hex values
  - Border radius
  - Logo URL
- The branding form generates CSS variables that override the global theme.
- Panel width: `42rem` for the branding drawer.

### Theme toggle

- **ThemeToggle** from `src/components/erp/theme-toggle.tsx`.
- Switches between light and dark mode.
- Uses `next-themes` for theme management.

### Danger zone

- **LeaveOrganizationDialog** — Confirmation dialog for leaving the organization.
- Rendered inside a card with `border-destructive/50` styling and warning icon.
- Shows organization name in the confirmation.
- Leaving is irreversible; user loses access to the organization's data.

## Feature gating

| Feature | Gate | Visibility |
|---------|------|------------|
| Brand presets | `has_brands` column on organizations + presets exist in DB | Conditional card |
| SMTP settings | Superadmin + `has_email_reports` | Conditional card |
| Report email | `has_email_reports` + `emails.manage` permission + SMTP configured | Conditional card |
| Roles management | `roles.manage` permission | Conditional card |
| Notifications | Superadmin only | Conditional card |

## Data flow

1. Server component calls `requireAppContext()` to get authenticated context.
2. Queries are run in parallel with `Promise.all`:
   - Organization details (name, slug, company_type, currency, feature flags)
   - User profile (full_name)
   - Brand config (JSONB)
   - Product presets count
   - SMTP config count
   - Roles and permissions (if user can manage roles)
3. Data is passed to client components as props (initial values).
4. Client components use the `SettingsContext` save system for change tracking and batch saving.
