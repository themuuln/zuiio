#!/usr/bin/env node
/**
 * Publish the `@zuiio/*` package line publicly to npmjs.
 *
 * Discovery is manifest-driven: a package is publishable when its
 * `package.json` carries `publishConfig.registry`. Repo manifests keep
 * `exports` pointing at `./src/*` for in-repo dev; this script stages a
 * throwaway copy under `.publish/<name>/` whose exports point at `dist/`.
 *
 *   node scripts/publish-packages.mjs                       # publish everything
 *   node scripts/publish-packages.mjs --dry-run             # build + stage, no network
 *   node scripts/publish-packages.mjs --filter @zuiio/oidc  # one package
 *   node scripts/publish-packages.mjs --tag next            # dist-tag
 *   node scripts/publish-packages.mjs --stage                # stage for 2FA approval
 *
 * Auth: a GitHub OIDC trusted publisher (no token), or `NPM_TOKEN`,
 * `NODE_AUTH_TOKEN` / `GITHUB_TOKEN` with publish rights.
 * Exit code is non-zero when any package fails to build, stage, or publish.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACKAGES_DIR = path.join(ROOT, "packages");
const STAGE_ROOT = path.join(ROOT, ".publish");
const DEFAULT_TAG = "latest";
const USER_AGENT = "zuiio-publish-packages";

/** Manifest keys carried into the staged (published) manifest verbatim. */
const CARRIED_KEYS = [
  "name",
  "version",
  "description",
  "keywords",
  "license",
  "author",
  "contributors",
  "homepage",
  "bugs",
  "repository",
  "type",
  "engines",
  "sideEffects",
  "os",
  "cpu",
  "libc",
  "funding",
  "dependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "optionalDependencies",
];

const log = (message) => process.stderr.write(`${message}\n`);

function parseArgs(argv) {
  const options = { dryRun: false, filters: [], tag: DEFAULT_TAG, help: false, registry: undefined, stage: false };

  const takeValue = (index, flag) => {
    const inline = argv[index].includes("=") ? argv[index].slice(argv[index].indexOf("=") + 1) : undefined;
    if (inline !== undefined) return { value: inline, next: index };
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    return { value, next: index + 1 };
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--stage") {
      options.stage = true;
    } else if (arg === "--filter" || arg.startsWith("--filter=")) {
      const { value, next } = takeValue(i, "--filter");
      i = next;
      options.filters.push(
        ...value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      );
    } else if (arg === "--tag" || arg.startsWith("--tag=")) {
      const { value, next } = takeValue(i, "--tag");
      i = next;
      options.tag = value;
    } else if (arg === "--registry" || arg.startsWith("--registry=")) {
      const { value, next } = takeValue(i, "--registry");
      i = next;
      options.registry = value.replace(/\/$/, "");
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/.test(options.tag)) {
    throw new Error(`invalid --tag "${options.tag}" (must match [a-z0-9][a-z0-9._-]*)`);
  }
  if (options.registry !== undefined) {
    let parsed;
    try {
      parsed = new URL(options.registry);
    } catch {
      throw new Error(`invalid --registry "${options.registry}" (must be an http(s) URL)`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`invalid --registry "${options.registry}" (must be an http(s) URL)`);
    }
  }

  return options;
}

function printHelp() {
  log(`Usage: node scripts/publish-packages.mjs [options]

  --dry-run           Build and stage only; no registry lookups, no publish
  --filter <pkg>      Publish only this package (repeatable, comma-separated;
                      "@zuiio/oidc" and "oidc" both match)
  --tag <dist-tag>    npm dist-tag to publish under (default: ${DEFAULT_TAG})
  --registry <url>    Publish to this registry instead of each package's
                      publishConfig.registry (npmjs private, GitHub Packages, local)
  --stage             Use npm stage publish: upload without 2FA and print the
                      stage id; a maintainer approves later with npm stage approve
  -h, --help          Show this message

Auth: NPM_TOKEN, NODE_AUTH_TOKEN or GITHUB_TOKEN with publish rights on the scope.
      NPM_TOKEN wins — use it when both npmjs and GitHub tokens are set.`);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function discoverPackages(filters, registryOverride) {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(PACKAGES_DIR, entry.name);
    const manifestPath = path.join(dir, "package.json");
    if (!existsSync(manifestPath)) continue;

    const manifest = await readJson(manifestPath);
    const declaredRegistry = manifest.publishConfig?.registry;
    if (!manifest.name || !declaredRegistry) continue;
    const registry = registryOverride ?? declaredRegistry;

    packages.push({
      name: manifest.name,
      version: manifest.version,
      registry,
      access: manifest.publishConfig.access ?? "restricted",
      dir,
      dirName: entry.name,
      manifest,
    });
  }

  packages.sort((a, b) => a.name.localeCompare(b.name));

  if (filters.length === 0) return packages;

  const wanted = new Set(filters.map((entry) => entry.replace(/^@[^/]+\//, "")));
  const selected = packages.filter(
    (pkg) => filters.includes(pkg.name) || wanted.has(pkg.name.replace(/^@[^/]+\//, "")),
  );
  const missing = filters.filter(
    (filter) =>
      !packages.some(
        (pkg) => pkg.name === filter || pkg.name.replace(/^@[^/]+\//, "") === filter.replace(/^@[^/]+\//, ""),
      ),
  );
  if (missing.length > 0) {
    throw new Error(
      `--filter matched no publishable package: ${missing.join(", ")}. Publishable packages carry publishConfig.registry: ${packages.map((pkg) => pkg.name).join(", ") || "(none)"}`,
    );
  }
  return selected;
}

function binary(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  return result.stdout ?? "";
}

function run(command, args) {
  // Child output goes to stderr so stdout stays a single JSON summary.
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: ["inherit", 2, 2],
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  }
}

/**
 * `verify-deps-before-run` makes pnpm re-run an install check before every
 * script; CI has already installed with --frozen-lockfile, so the check only
 * turns unrelated workspace drift into a publish failure.
 */
function buildPackage(pkg) {
  log(`→ build  ${pkg.name}@${pkg.version}`);
  run(binary("pnpm"), ["--config.verify-deps-before-run=false", "--filter", pkg.name, "build"]);
}

function distTargets(spec, packageName) {
  if (spec === "./package.json") return { default: spec };
  if (!spec.startsWith("./src/")) {
    throw new Error(`${packageName}: exports target "${spec}" is not under ./src/ — cannot rewrite it for dist/`);
  }
  const relative = spec.slice("./src/".length);
  const stem = relative.replace(/\.(ts|tsx|mts|cts)$/, "");
  if (stem === relative) {
    throw new Error(`${packageName}: exports target "${spec}" is not a TypeScript source file`);
  }
  return { types: `./dist/${stem}.d.ts`, default: `./dist/${stem}.js` };
}

function rewriteSubpath(target, packageName) {
  if (typeof target === "string") return distTargets(target, packageName);
  if (Array.isArray(target)) return target.map((entry) => rewriteSubpath(entry, packageName));
  if (target && typeof target === "object") {
    const rewritten = {};
    for (const [condition, value] of Object.entries(target)) {
      if (typeof value === "string") {
        const mapped = distTargets(value, packageName);
        rewritten[condition] = condition === "types" ? mapped.types : mapped.default;
      } else {
        rewritten[condition] = rewriteSubpath(value, packageName);
      }
    }
    return rewritten;
  }
  return target;
}

/** `{ ".": "./src/index.ts" }` → `{ ".": { types, default } }`, never `src/`. */
function rewriteExports(exportsField, packageName) {
  if (typeof exportsField === "string") {
    return { ".": distTargets(exportsField, packageName) };
  }
  const rewritten = {};
  for (const [subpath, target] of Object.entries(exportsField)) {
    rewritten[subpath] =
      subpath === "./package.json" ? "./package.json" : rewriteSubpath(target, packageName);
  }
  return rewritten;
}

function resolveRepository(dirName) {
  const fromCi = process.env.GITHUB_REPOSITORY;
  if (fromCi) {
    const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
    return { type: "git", url: `git+${server}/${fromCi}.git`, directory: `packages/${dirName}` };
  }

  const remote = spawnSync("git", ["-C", ROOT, "remote", "get-url", "origin"], { encoding: "utf8" });
  const url = (remote.stdout ?? "").trim();
  if (remote.status !== 0 || !url) return undefined;

  const scpLike = /^git@([^:]+):(.+?)(?:\.git)?$/.exec(url);
  const normalized = scpLike
    ? `git+https://${scpLike[1]}/${scpLike[2]}.git`
    : `git+${url.replace(/^git\+/, "")}`;
  return { type: "git", url: normalized, directory: `packages/${dirName}` };
}

let catalogCache;
function catalogVersions() {
  if (catalogCache) return catalogCache;
  catalogCache = new Map();
  const file = path.join(ROOT, "pnpm-workspace.yaml");
  if (!existsSync(file)) return catalogCache;
  let inCatalog = false;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (!inCatalog) continue;
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+"?([^"\s:]+)"?:\s*(.+?)\s*$/);
    if (match) catalogCache.set(match[1], match[2]);
  }
  return catalogCache;
}

function resolveDependencySpec(name, spec) {
  if (spec === "catalog:") {
    const version = catalogVersions().get(name);
    if (!version) throw new Error(`catalog has no entry for ${name} — cannot publish a resolvable manifest`);
    return version;
  }
  if (spec.startsWith("catalog:")) {
    throw new Error(`${name}: named catalog specifiers are not supported (${spec})`);
  }
  if (spec.startsWith("workspace:")) {
    const range = spec.slice("workspace:".length);
    const dirName = name.replace(/^@[^/]+\//, "");
    const file = path.join(PACKAGES_DIR, dirName, "package.json");
    if (!existsSync(file)) throw new Error(`${name}: ${spec} is not a packages/* workspace dependency`);
    const { version } = JSON.parse(readFileSync(file, "utf8"));
    return range === "" || range === "*" || range === "^" ? `^${version}` : version;
  }
  return spec;
}

function buildStagedManifest(pkg, stagedExports, repository) {
  const manifest = {};
  for (const key of CARRIED_KEYS) {
    if (pkg.manifest[key] !== undefined) manifest[key] = pkg.manifest[key];
  }

  // pnpm protocols (`catalog:`, `workspace:`) do not exist for npm consumers.
  for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    if (!manifest[field]) continue;
    const resolved = {};
    for (const [name, spec] of Object.entries(manifest[field])) {
      resolved[name] = resolveDependencySpec(name, spec);
    }
    manifest[field] = resolved;
  }

  if (!manifest.repository && repository) manifest.repository = repository;

  const root = stagedExports?.["."];
  const rootTypes = root && typeof root === "object" ? root.types : undefined;
  const rootDefault = root && typeof root === "object" ? root.default : undefined;

  manifest.files = ["dist"];
  if (stagedExports) manifest.exports = stagedExports;
  if (rootTypes) manifest.types = rootTypes;
  if (rootDefault) manifest.main = rootDefault;
  if (rootDefault) manifest.module = rootDefault;

  manifest.publishConfig = { registry: pkg.registry, access: pkg.access };
  // npm auto-adds provenance for trusted publishing; it cannot be generated
  // from a private source repository, so the flag must reach the manifest.
  if (pkg.manifest.publishConfig?.provenance === false) manifest.publishConfig.provenance = false;
  return manifest;
}

function collectTargets(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const entry of value) collectTargets(entry, out);
  else if (value && typeof value === "object") for (const entry of Object.values(value)) collectTargets(entry, out);
  return out;
}

function fallbackReadme(pkg) {
  const description = pkg.manifest.description ?? `${pkg.name} — part of the Zuiio package line.`;
  return `# ${pkg.name}

${description}

## Install

This package is published privately on npmjs.

\`\`\`bash
# once per machine — token needs read access to the @zuiio scope
npm login
\`\`\`

\`\`\`ini
# .npmrc
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
\`\`\`

\`\`\`bash
pnpm add ${pkg.name}
\`\`\`
`;
}

async function addEsmExtensions(distDir) {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts")) files.push(target);
    }
  };
  await walk(distDir);

  let rewritten = 0;
  for (const file of files) {
    const original = await readFile(file, "utf8");
    const updated = original.replace(
      /(\bfrom\s+|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g,
      (match, prefix, quote, specifier) => {
        if (/\.(js|mjs|cjs|json|node)$/.test(specifier)) return match;
        const target = path.join(path.dirname(file), specifier);
        const suffix = existsSync(`${target}.js`)
          ? ".js"
          : existsSync(`${target}.d.ts`)
            ? ".js"
            : existsSync(path.join(target, "index.js"))
              ? "/index.js"
              : null;
        return suffix === null ? match : `${prefix}${quote}${specifier}${suffix}${quote}`;
      },
    );
    if (updated !== original) {
      await writeFile(file, updated);
      rewritten += 1;
    }
  }
  return rewritten;
}

async function stagePackage(pkg) {
  const stageDir = path.join(STAGE_ROOT, ...pkg.name.split("/"));
  await rm(stageDir, { recursive: true, force: true });
  await mkdir(stageDir, { recursive: true });

  const distDir = path.join(pkg.dir, "dist");
  if (!existsSync(distDir)) {
    throw new Error(`${pkg.name}: build produced no dist/ — does the package have a build script?`);
  }
  await cp(distDir, path.join(stageDir, "dist"), { recursive: true });
  await addEsmExtensions(path.join(stageDir, "dist"));

  const readmePath = path.join(pkg.dir, "README.md");
  if (existsSync(readmePath)) {
    await cp(readmePath, path.join(stageDir, "README.md"));
  } else {
    await writeFile(path.join(stageDir, "README.md"), fallbackReadme(pkg));
  }

  const stagedExports = pkg.manifest.exports
    ? rewriteExports(pkg.manifest.exports, pkg.name)
    : undefined;

  const manifest = buildStagedManifest(pkg, stagedExports, pkg.manifest.repository ? undefined : resolveRepository(pkg.dirName));

  const missing = collectTargets(stagedExports ?? {})
    .filter((target) => target !== "./package.json")
    .filter((target) => !existsSync(path.join(stageDir, target)));
  if (missing.length > 0) {
    throw new Error(`${pkg.name}: staged manifest points at missing files: ${missing.join(", ")}`);
  }

  const manifestPath = path.join(stageDir, "package.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { stageDir, manifestPath, manifest };
}

function registryAuthToken() {
  const raw = process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN || process.env.GITHUB_TOKEN || "";
  // Credentials pasted from a shell capture or a secret store often carry a
  // trailing newline, which makes an invalid Authorization header.
  return raw.trim();
}

/** GitHub Actions exposes these when the job has `id-token: write`. */
function hasOidcTrust() {
  return Boolean(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
}

async function versionExists(pkg, token) {
  const base = pkg.registry.replace(/\/$/, "");
  const candidates = [`${base}/${pkg.name.replace("/", "%2f")}`, `${base}/${pkg.name}`];

  let lastError;
  for (const url of candidates) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          accept: "application/vnd.npm.install-v1+json, application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "user-agent": USER_AGENT,
        },
      });
    } catch (cause) {
      throw new Error(
        `could not reach ${url}: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }

    if (response.status === 404) return false;
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `registry auth failed (${response.status}) for ${url} — the token needs publish rights on the @zuiio scope`,
      );
    }
    if (!response.ok) {
      lastError = new Error(`registry lookup failed (${response.status} ${response.statusText}) for ${url}`);
      continue;
    }

    const packument = await response.json();
    return Boolean(packument?.versions?.[pkg.version]);
  }

  throw lastError ?? new Error(`could not read ${pkg.name} from ${base}`);
}

async function publishPackage(pkg, stageDir, token, tag, stage) {
  const configDir = await mkdtemp(path.join(os.tmpdir(), "zuiio-publish-"));
  const userconfig = path.join(configDir, ".npmrc");
  // No token means a trusted publisher (GitHub OIDC) is in play: npm mints a
  // short-lived credential itself, so no userconfig is written at all.
  const authArgs = token ? ["--userconfig", userconfig] : [];

  try {
    if (token) {
      await writeFile(
        userconfig,
        [
          `registry=${pkg.registry}`,
          `//${new URL(pkg.registry).host}/:_authToken=${token}`,
          "",
        ].join("\n"),
        { mode: 0o600 },
      );
    }

    log(`→ ${stage ? "stage  " : "publish"} ${pkg.name}@${pkg.version} → ${pkg.registry} (${tag})`);
    run(binary("npm"), [
      ...(stage ? ["stage", "publish"] : ["publish"]),
      stageDir,
      "--registry",
      pkg.registry,
      "--tag",
      tag,
      "--access",
      pkg.access,
      ...authArgs,
      "--no-audit",
      "--no-fund",
    ]);

    if (!stage) return undefined;
    const listed = runCapture(binary("npm"), [
      "stage",
      "list",
      pkg.name,
      "--json",
      "--registry",
      pkg.registry,
      ...authArgs,
    ]);
    const entry = JSON.parse(listed || "[]").find(
      (item) => item.packageName === pkg.name && item.version === pkg.version,
    );
    return entry?.id;
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
}

async function main() {
  const startedAt = Date.now();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return { exitCode: 0 };
  }

  const packages = await discoverPackages(options.filters, options.registry);
  if (packages.length === 0) throw new Error("no package carries publishConfig.registry — nothing to publish");

  const token = registryAuthToken();
  if (!options.dryRun && !token && !hasOidcTrust()) {
    throw new Error(
      "no credentials: set NPM_TOKEN (or NODE_AUTH_TOKEN) for a token publish, or run inside GitHub Actions with `id-token: write` for a trusted publisher",
    );
  }

  log(
    `${options.dryRun ? "DRY RUN — " : ""}${packages.length} package(s): ${packages.map((pkg) => `${pkg.name}@${pkg.version}`).join(", ")}`,
  );

  const results = [];
  for (const pkg of packages) {
    const result = { name: pkg.name, version: pkg.version, registry: pkg.registry, status: "pending" };
    results.push(result);

    try {
      if (pkg.manifest.private === true) {
        result.status = "skipped";
        result.reason = "manifest is private:true";
        log(`⤼ skip   ${pkg.name} — ${result.reason}`);
        continue;
      }

      if (!options.dryRun && (await versionExists(pkg, token))) {
        result.status = "skipped";
        result.reason = `${pkg.version} already exists in ${pkg.registry}`;
        log(`⤼ skip   ${pkg.name}@${pkg.version} — ${result.reason}`);
        continue;
      }

      buildPackage(pkg);

      const staged = await stagePackage(pkg);
      result.stageDir = path.relative(ROOT, staged.stageDir);

      if (options.dryRun) {
        result.status = "dry-run";
        log(`⤼ stage  ${pkg.name} → ${result.stageDir}/package.json`);
        log(JSON.stringify(staged.manifest, null, 2));
        continue;
      }

      const stageId = await publishPackage(pkg, staged.stageDir, token, options.tag, options.stage);
      if (options.stage) {
        result.status = "staged";
        if (stageId) result.stageId = stageId;
        log(`✓ staged   ${pkg.name}@${pkg.version}${stageId ? ` (stage ${stageId})` : ""}`);
      } else {
        result.status = "published";
        log(`✓ published ${pkg.name}@${pkg.version}`);
      }
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : String(error);
      log(`✗ failed  ${pkg.name}: ${result.error}`);
    }
  }

  const summary = {
    dryRun: options.dryRun,
    tag: options.tag,
    ok: results.every((result) => result.status !== "failed"),
    packages: results,
    durationMs: Date.now() - startedAt,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return { exitCode: summary.ok ? 0 : 1 };
}

try {
  const { exitCode } = await main();
  process.exit(exitCode);
} catch (error) {
  log(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.stdout.write(
    `${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error), packages: [] }, null, 2)}\n`,
  );
  process.exit(1);
}
