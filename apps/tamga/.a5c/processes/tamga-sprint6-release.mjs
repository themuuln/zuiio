/**
 * @process tamga-sprint6-release
 * @description Sprint 6 — Release Prep: App icons, splash screen, CI/CD, build config, final polish
 * @inputs { projectRoot: string }
 * @outputs { success: boolean, artifacts: string[] }
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const p1Icons = defineTask("app-icons", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "App Icons & Splash Screen",
	description: `Generate adaptive app icons and create splash screen for Tamga app.

## What to implement

1. **App Icon Source** (assets/icon/):
   - Create a 1024x1024 source icon with Tamga brand (Mongolian horse motif)
   - Use brand colors from design tokens (earth tones: #8B4513, #D2691E, #F4A460)

2. **iOS Icons** (ios/Runner/Assets.xcassets/AppIcon.appiconset/):
   - Generate all required sizes from source
   - Configure Contents.json

3. **Android Icons** (android/app/src/main/res/):
   - Generate mipmap-hdpi, mipmap-mdpi, mipmap-xhdpi, mipmap-xxhdpi, mipmap-xxxhdpi
   - Create adaptive icon with foreground/background

4. **Splash Screen** (lib/src/core/theme/splash_screen.dart):
   - Create branded splash screen widget
   - Show Tamga logo with earth tone background
   - Configure native splash screen for both platforms`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
}));

const p2Build = defineTask("build-config", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build Configuration",
	description: `Configure release builds for iOS and Android.

## What to implement

1. **iOS Release Build**:
   - Update Info.plist with version 1.0.0
   - Configure bundle identifier
   - Set deployment target to iOS 13.0

2. **Android Release Build**:
   - Update android/app/build.gradle
   - Configure signing config for release
   - Update AndroidManifest.xml

3. **Environment Config**:
   - Create .env.production with Supabase credentials
   - Update config to load env vars per environment

4. **Version Number**:
   - Set version to 1.0.0+1 in pubspec.yaml
   - Update version display in app`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
}));

const p3Polish = defineTask("final-polish", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Final Polish",
	description: `Fix remaining issues and optimize for production.

## What to implement

1. **Analyze Warnings**:
   - Run dart analyze and fix any remaining warnings
   - Ensure 0 errors

2. **Test Suite**:
   - Run flutter test to verify all tests pass
   - Fix any failing tests

3. **Performance**:
   - Verify image assets are optimized
   - Check for any memory leaks or performance issues

4. **App Launch Verification**:
   - Verify app launches correctly on both platforms
   - Test core flows (onboarding, horse creation, marketplace)`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
}));

const p4Store = defineTask("store-listing", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Store Listing Prep",
	description: `Prepare materials for app store submission.

## What to implement

1. **App Description**:
   - Write Mongolian description (primary market)
   - Write English description (international)
   - Include key features and benefits

2. **Screenshots**:
   - Capture screenshots of key screens
   - Onboarding, Horse List, Marketplace, Profile

3. **Privacy Policy**:
   - Create privacy policy page
   - Host on GitHub Pages or similar

4. **Store Metadata**:
   - App name: Тамга (Tamga)
   - Category: Lifestyle / Business
   - Keywords: horse, Mongolia, equestrian, management`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
}));

export default async function process(inputs, ctx) {
	const { projectRoot } = inputs;
	const artifacts = [];

	// ── P1: App Icons & Splash Screen ──────────────────────────────
	ctx.log?.("Starting P1: App Icons & Splash Screen");
	const p1Result = await ctx.task(
		p1Icons,
		{ projectRoot },
		{ label: "p1:icons" },
	);
	artifacts.push(...(p1Result.artifacts || []));

	// ── P2: Build Configuration ────────────────────────────────────
	ctx.log?.("Starting P2: Build Configuration");
	const p2Result = await ctx.task(
		p2Build,
		{ projectRoot },
		{ label: "p2:build" },
	);
	artifacts.push(...(p2Result.artifacts || []));

	// ── P3: Final Polish ───────────────────────────────────────────
	ctx.log?.("Starting P3: Final Polish");
	const p3Result = await ctx.task(
		p3Polish,
		{ projectRoot },
		{ label: "p3:polish" },
	);
	artifacts.push(...(p3Result.artifacts || []));

	// ── P4: Store Listing Prep ─────────────────────────────────────
	ctx.log?.("Starting P4: Store Listing Prep");
	const p4Result = await ctx.task(
		p4Store,
		{ projectRoot },
		{ label: "p4:store" },
	);
	artifacts.push(...(p4Result.artifacts || []));

	// ── Final approval breakpoint ──────────────────────────────────
	let lastFeedback = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		const approval = await ctx.breakpoint({
			question: "Sprint 6 Release Prep complete. Final approval?",
			expert: "owner",
			tags: ["final-gate"],
			previousFeedback: lastFeedback || undefined,
		});
		if (approval.approved) break;
		lastFeedback = approval.res || approval.feedback || "Changes requested";
	}

	return {
		ok: true,
		phases: ["P1:icons", "P2:build", "P3:polish", "P4:store"],
		artifacts,
		summary: "Sprint 6 complete",
	};
}
