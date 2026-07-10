/**
 * @process full-project-audit
 * @description Comprehensive project setup audit for a Next.js 16 + Supabase + Tailwind v4 + Biome project.
 *   Covers dependency hygiene, configuration correctness, security, performance, and cleanup execution.
 * @skill frontend-design specializations/web-development/skills/nextjs/SKILL.md
 * @skill typescript specializations/web-development/skills/typescript/SKILL.md
 * @skill vitest specializations/web-development/skills/vitest/SKILL.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectDir = process.cwd(), outputDir = 'full-project-audit' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Full Project Audit for ${projectDir}`);

  // ── PHASE 1: Dependency Audit ──────────────────────────────────────────────
  ctx.log('info', 'Phase 1: Dependency audit — unused packages, missing types, lockfile');
  const depAudit = await ctx.task(dependencyAuditTask, { projectDir, outputDir });
  artifacts.push(...depAudit.artifacts);

  // ── PHASE 2: Configuration Review ──────────────────────────────────────────
  ctx.log('info', 'Phase 2: Configuration review — tsconfig, biome, next.config, postcss');
  const configReview = await ctx.task(configurationReviewTask, { projectDir, outputDir });
  artifacts.push(...configReview.artifacts);

  // ── PHASE 3: Security & Best Practices ─────────────────────────────────────
  ctx.log('info', 'Phase 3: Security & best practices — headers, env, RLS, secrets');
  const securityReview = await ctx.task(securityReviewTask, { projectDir, outputDir });
  artifacts.push(...securityReview.artifacts);

  // ── PHASE 4: Breakpoint — review findings ──────────────────────────────────
  const approval = await ctx.breakpoint({
    question: `Audit complete. Found ${depAudit.findings.length + configReview.findings.length + securityReview.findings.length} total findings across 3 phases. Review the report and approve cleanup execution?`,
    title: 'Audit Review',
    context: {
      runId: ctx.runId,
      dependencyFindings: depAudit.findings,
      configFindings: configReview.findings,
      securityFindings: securityReview.findings,
    },
    expert: 'owner',
    tags: ['approval-gate'],
  });

  if (!approval.approved) {
    ctx.log('info', 'Cleanup not approved. Audit report saved.');
    return {
      success: true,
      phase: 'audit-complete',
      findings: [...depAudit.findings, ...configReview.findings, ...securityReview.findings],
      artifacts,
      duration: ctx.now() - startTime,
    };
  }

  // ── PHASE 5: Execute Cleanup ───────────────────────────────────────────────
  ctx.log('info', 'Phase 5: Executing cleanup — removing unused deps, adding lockfile, gitignore');
  const cleanup = await ctx.task(cleanupExecutionTask, {
    projectDir,
    outputDir,
    unusedPackages: depAudit.unusedPackages,
    findings: [...depAudit.findings, ...configReview.findings, ...securityReview.findings],
  });
  artifacts.push(...cleanup.artifacts);

  // ── PHASE 6: Verification ──────────────────────────────────────────────────
  ctx.log('info', 'Phase 6: Verification — type-check, lint, build');
  const verification = await ctx.task(verificationTask, { projectDir, outputDir });
  artifacts.push(...verification.artifacts);

  return {
    success: verification.passed,
    findings: [...depAudit.findings, ...configReview.findings, ...securityReview.findings],
    cleanup: cleanup.summary,
    verification: verification.summary,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'full-project-audit', timestamp: startTime },
  };
}

// ── Phase 1: Dependency Audit ────────────────────────────────────────────────

const dependencyAuditTask = defineTask('dependency-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dependency Audit',
  agent: {
    name: 'dependency-auditor',
    prompt: {
      role: 'Dependency Auditor',
      task: 'Audit project dependencies for unused packages, missing types, and lockfile status',
      context: args,
      instructions: [
        '1. Read package.json and list all dependencies + devDependencies',
        '2. For each package, search src/ for actual imports (rg "from [\'"]<pkg>")',
        '3. Classify each package: USED, UNUSED, or INDIRECT (peer dep only)',
        '4. Check @types/* coverage — find packages with missing type definitions',
        '5. Check if pnpm-lock.yaml exists — flag if missing',
        '6. Check if package.json has a "packageManager" field — flag if missing',
        '7. Check for .env.example — flag if missing',
        '8. Check scratch/ directory — flag if tracked in git but not in .gitignore',
        '9. Compile findings with severity: critical (missing lockfile), warning (unused pkg), info (missing .env.example)',
        '10. Return structured JSON: { findings: [], unusedPackages: [], missingTypes: [] }',
      ],
      outputFormat: 'JSON with findings, unusedPackages, missingTypes',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'unusedPackages', 'artifacts'],
      properties: {
        findings: { type: 'array' },
        unusedPackages: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['audit', 'dependencies'],
}));

// ── Phase 2: Configuration Review ────────────────────────────────────────────

const configurationReviewTask = defineTask('configuration-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configuration Review',
  agent: {
    name: 'config-reviewer',
    prompt: {
      role: 'Configuration Reviewer',
      task: 'Review all project configuration files for correctness and best practices',
      context: args,
      instructions: [
        '1. Read tsconfig.json — check strict mode, paths, module resolution, target',
        '2. Read biome.json — check linter rules, formatter, domains config',
        '3. Read next.config.ts — check security headers, image config, experimental flags',
        '4. Read postcss.config.mjs — verify Tailwind v4 setup',
        '5. Read vitest.config.mts — check test setup, coverage thresholds, aliases',
        '6. Read components.json — verify shadcn config',
        '7. Read .gitignore — check for missing entries (scratch/, .env*, etc.)',
        '8. Check for stale config files (.eslintrc, .prettierrc, jest.config)',
        '9. Compile findings: misconfigurations, missing configs, stale files',
        '10. Return structured JSON: { findings: [], recommendations: [] }',
      ],
      outputFormat: 'JSON with findings and recommendations',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['audit', 'configuration'],
}));

// ── Phase 3: Security Review ─────────────────────────────────────────────────

const securityReviewTask = defineTask('security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security & Best Practices Review',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'Security Reviewer',
      task: 'Review project security posture — headers, env vars, secrets, RLS',
      context: args,
      instructions: [
        '1. Check next.config.ts security headers (HSTS, X-Frame-Options, CSP)',
        '2. Check .gitignore for .env files — ensure no secrets are tracked',
        '3. Check for hardcoded secrets in src/ (API keys, passwords, tokens)',
        '4. Check if sentry.config files exist and are properly configured',
        '5. Check RLS policies in supabase/migrations/ — verify all tables have RLS',
        '6. Check for console.log statements in production code',
        '7. Check for TODO/FIXME/HACK comments that indicate security debt',
        '8. Compile findings with severity: critical, warning, info',
        '9. Return structured JSON: { findings: [], recommendations: [] }',
      ],
      outputFormat: 'JSON with findings',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['audit', 'security'],
}));

// ── Phase 5: Cleanup Execution ───────────────────────────────────────────────

const cleanupExecutionTask = defineTask('cleanup-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Cleanup',
  agent: {
    name: 'cleanup-executor',
    prompt: {
      role: 'Cleanup Executor',
      task: 'Execute the approved cleanup actions',
      context: args,
      instructions: [
        '1. Remove unused packages: pnpm remove <pkg> for each unused package',
        '2. Generate pnpm-lock.yaml: run pnpm install',
        '3. Add "packageManager" field to package.json with current pnpm version',
        '4. Add scratch/ to .gitignore if not present',
        '5. Create .env.example with placeholder env vars',
        '6. Run git rm -r --cached scratch/ to untrack scratch files',
        '7. Verify each action succeeded',
        '8. Return structured JSON: { summary: string, actions: [] }',
      ],
      outputFormat: 'JSON with summary and actions',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['audit', 'cleanup'],
}));

// ── Phase 6: Verification ────────────────────────────────────────────────────

const verificationTask = defineTask('verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Post-Cleanup Verification',
  agent: {
    name: 'verification-runner',
    prompt: {
      role: 'Verification Runner',
      task: 'Run type-check, lint, and build to verify cleanup did not break anything',
      context: args,
      instructions: [
        '1. Run: pnpm validate:types (tsc --noEmit --incremental)',
        '2. Run: pnpm validate:lint (biome check src/)',
        '3. Run: pnpm test (vitest run)',
        '4. If all pass, run: pnpm build (production build)',
        '5. Report pass/fail for each step',
        '6. If any step fails, identify the cause and suggest fix',
        '7. Return structured JSON: { passed: boolean, summary: string, steps: [] }',
      ],
      outputFormat: 'JSON with pass/fail status',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'summary', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        summary: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['audit', 'verification'],
}));
