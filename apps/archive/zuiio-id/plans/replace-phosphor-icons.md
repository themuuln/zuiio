# Replace @phosphor-icons/react with Inline SVGs

## Context
`@phosphor-icons/react` is 57MB on disk for only 3 icons used across the app. Replacing with inline SVGs eliminates the dependency entirely.

## Icons to Replace
| Icon | Used in | SVG source |
|------|---------|------------|
| `EyeIcon` | login-form, signup-form, reset-password-form, change-password-form | Standard eye icon |
| `EyeSlashIcon` | login-form, signup-form, reset-password-form, change-password-form | Standard eye-slash icon |
| `FingerprintSimpleIcon` | login-form, passkey-manager | Standard fingerprint icon |

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `src/app/(auth)/login/login-form.tsx` | Modify | Replace phosphor imports with inline SVG components |
| `src/app/(auth)/signup/signup-form.tsx` | Modify | Replace EyeIcon/EyeSlashIcon |
| `src/app/(auth)/reset-password/reset-password-form.tsx` | Modify | Replace EyeIcon/EyeSlashIcon |
| `src/app/(auth)/account/change-password/change-password-form.tsx` | Modify | Replace EyeIcon/EyeSlashIcon |
| `src/app/(auth)/account/passkey-manager.tsx` | Modify | Replace FingerprintSimpleIcon |
| `src/components/icons.tsx` | Create | Shared inline SVG icon components |
| `package.json` | Modify | Remove @phosphor-icons/react |

## Approach
1. Create `src/components/icons.tsx` with 3 SVG components (Eye, EyeSlash, Fingerprint)
2. Update all 5 consuming files to import from `@/components/icons`
3. Remove `@phosphor-icons/react` from package.json
4. Remove from `optimizePackageImports` in next.config.ts

## Verification
1. `pnpm typecheck` — no errors
2. `pnpm lint` — passes
3. Visual check: icons render correctly on login, signup, reset-password, change-password, passkey pages
