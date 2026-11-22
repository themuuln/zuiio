# Publishing `@zuiio/*`

The `@zuiio` line is published **publicly to npmjs** (`access: public`), same
registry and scope as the existing `@zuiio/hr`, `@zuiio/auth` packages. No paid
npm plan, no scope rename, no consumer token.

Decision record: an audit of the published contents found no secrets — no API
keys, private keys, credentials, customer data, or internal-only endpoints.
Endpoints that appear in source (`id.zuiio.app`, `id.zuiiotech.com`) are the
public OIDC issuer URLs, and all configuration is read from `process.env` names.
What public hosting does disclose is the implementation itself (Mongolian
payroll/tax formulas, the JWT claim layout, API client conventions). GitHub
Packages was rejected as an alternative: it requires the npm scope to equal a
GitHub owner, and `github.com/zuiio` is an unrelated user account, so it would
force a rename across ~617 import sites.

Package source stays in this monorepo, manifests keep `exports` → `./src/*` for
in-repo dev, and the publish script stages `dist/`-based manifests in `.publish/`.

## Consuming a package

Public packages on npmjs — no credentials, no scope routing:

```bash
pnpm add @zuiio/oidc @zuiio/supabase @zuiio/m2m
```

## Publishing

Releases run in CI through a **trusted publisher**: GitHub mints an OIDC
identity for the job, npm exchanges it for a short-lived credential, and the
package is published with provenance. No long-lived token, no 2FA prompt, nothing
to rotate.

```bash
# what CI does
node scripts/publish-packages.mjs --tag latest

# local rehearsal — builds, stages, prints the manifest, touches no registry
node scripts/publish-packages.mjs --dry-run --filter @zuiio/oidc

# local publish: needs an interactive 2FA session or `--stage`
NPM_TOKEN=… node scripts/publish-packages.mjs --stage
npm stage approve <stage-id>            # 2FA prompt — the human step
```

### One-time setup per package

The package must already exist on npm, and each package carries exactly one trust
relationship (repo + workflow file):

```bash
npm login --auth-type=web                     # web session; bypass-2FA tokens are refused
npm trust github @zuiio/m2m      --file publish-packages.yml --repo themuuln/zuiio --allow-publish --yes
npm trust github @zuiio/oidc     --file publish-packages.yml --repo themuuln/zuiio --allow-publish --yes
npm trust github @zuiio/supabase --file publish-packages.yml --repo themuuln/zuiio --allow-publish --yes
npm trust list @zuiio/m2m                     # verify
```

The first call prompts for 2FA; the npm site then offers a 5-minute skip window,
which covers the remaining packages. Replacing a relationship needs
`npm trust list` → `npm trust revoke --id <id>` → create again. Requires
npm ≥ 11.15.0; the workflow needs npm ≥ 11.5.1 (the job upgrades npm itself).

A new trust relationship must complete its first successful publish within
**2 days**, or it expires and has to be recreated — configure trust and release
in the same sitting.

`themuuln/zuiio` is a **public repository**, which is a hard requirement for
provenance: npm refuses to attest a package whose source repository is private.
Each manifest therefore carries `publishConfig.provenance: true`, the publish
script stages that flag and passes `--provenance` to `npm publish`, and the
registry records a SLSA provenance attestation alongside the tarball. A manifest
that sets `provenance: false` opts its package out again — doing that while the
repository is private is not needed, but publishing from a private fork/deploy
of this repository will not produce attestations.

The workflow must keep `permissions: id-token: write` and publish from the
workflow file named above — npm matches both, and a renamed file breaks
publishing with `E404`/`E403`.

### npm staged publishing

Where no trusted publisher applies (a maintainer's laptop, another CI), npm
requires **proof-of-presence** (2FA) to publish, and a granular/automation token
cannot supply it. Such a token gets the release into the *staged* state instead:
the tarball is uploaded and validated, but it is invisible to consumers and not
on any dist-tag until a maintainer approves it:

```bash
npm stage list --json                 # stage id, package, version
npm stage approve <stage-id>          # prompts for 2FA — the human step
npm stage reject <stage-id>           # discard
npm stage download <stage-id>         # inspect the tarball first
```

A staged version still occupies its semver slot: `npm publish` of the same
version fails with `409 Cannot publish over previously staged version`. Bump the
patch version if a stage must be redone.

CI runs the same script (`.github/workflows/publish-packages.yml`) on either:

- a `packages-v*` tag push — publishes everything, or
- manual dispatch (`filter`, `dry_run` inputs).

The workflow passes no token: it relies on `id-token: write` and the trusted
publisher. The script exposes `hasOidcTrust()` so a tokenless run is valid inside
Actions and rejected elsewhere. A package is publishable when its
`package.json` has `publishConfig.registry`; today that is `@zuiio/m2m`,
`@zuiio/oidc` and `@zuiio/supabase`. The script builds it, stages
`.publish/<name>/` with `dist/`, `README.md` and a manifest whose
`exports`/`types`/`main` point at `dist/`, rewrites extensionless ESM specifiers
to `.js`, resolves `catalog:`/`workspace:` dependency specs, skips the version if
it already exists, and prints a JSON summary. Exit code is non-zero if anything
fails.

## Versioning

- Independent semver per package: bump only the package you changed.
- **Never republish an existing version.** npm rejects the upload, the script
  skips it, and consumers may have cached the old tarball. Bump
  `version` (patch for fixes, minor for additions, major for breaks).
- Current source versions: `@zuiio/m2m@0.1.2`, `@zuiio/oidc@0.2.2`,
  `@zuiio/supabase@0.2.2`. Their public predecessors (`0.1.0`, `0.2.0`, `0.2.0`)
  shipped broken ESM specifiers and are deprecated on npm. Never reuse a
  version number that already exists on npm.
- One `packages-v*` tag can carry several package versions; tags are release
  markers, not version sources.

## Follow-up: retire the old public packages (manual)

`@zuiio/hr`, `@zuiio/auth` and `@zuiio/supabase@0.1.0` were superseded by
`@zuiio/m2m`, `@zuiio/oidc` and `@zuiio/supabase@0.2.0`. Once consumers are
migrated, run by hand (not automated, not done yet):

```bash
npm deprecate @zuiio/hr@0.1.x "Superseded — payroll/tax logic now in @zuiio/m2m and product code"
npm deprecate @zuiio/auth@0.1.x "Superseded — use @zuiio/oidc"
npm deprecate @zuiio/supabase@0.1.0 "Superseded — use @zuiio/supabase@0.2.0"
```

Deprecate rather than unpublish: existing lockfiles keep resolving, and npm
already refuses to unpublish versions older than 72 hours.

## Rollback

`npm unpublish` is **not** the rollback — npm only allows it within 72 hours of
publish, and yanking a version breaks every lockfile that pinned it.

- Ship a patch (`0.2.1`) that reverts the change.
- For a bad prerelease, move the dist-tag back:
  `npm dist-tag add @zuiio/oidc@0.2.0 latest` (with the same token).
- Never delete a tag or version; the registry is append-only by design.
