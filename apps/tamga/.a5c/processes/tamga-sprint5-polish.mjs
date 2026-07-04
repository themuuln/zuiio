/**
 * @process tamga-sprint5-polish
 * @description Sprint 5 — UI/UX Polish, Notifications & Performance
 * @inputs { projectRoot: string }
 * @outputs { success: boolean, artifacts: string[] }
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const p1Theme = defineTask("theme-polish", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Theme & Visual Polish",
	description: `Polish the theme and visual design in /Users/themuuln/coding/personal/tamga.

## What to implement

1. **Design Tokens** (lib/src/core/theme/design_tokens.dart):
   - Centralize colors, spacing, typography
   - Mongolian earth tone palette
   - Dark mode support

2. **App Theme** (lib/src/core/theme/app_theme.dart):
   - Update ThemeData with design tokens
   - Consistent card styles, button styles, input styles
   - Proper text themes for Mongolian script

3. **Responsive Layout** (lib/src/core/layout/responsive_layout.dart):
   - Breakpoints for phone/tablet
   - Adaptive layouts for key screens

4. **Empty States** (lib/src/core/widgets/empty_state.dart):
   - Reusable empty state widget
   - Icon + title + description + action button
   - Used across all list screens

5. **Loading States** (lib/src/core/widgets/loading_state.dart):
   - Skeleton loaders for lists
   - Shimmer effect for cards
   - Consistent loading indicators

Files to create:
- lib/src/core/theme/design_tokens.dart
- lib/src/core/theme/app_theme.dart
- lib/src/core/layout/responsive_layout.dart
- lib/src/core/widgets/empty_state.dart
- lib/src/core/widgets/loading_state.dart`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-5", "theme", "polish"],
}));

const p1Verify = defineTask("p1-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Theme",
	description: `Run flutter analyze.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

const p2Notifications = defineTask("notifications", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Push Notifications (FCM)",
	description: `Implement push notifications in /Users/themuuln/coding/personal/tamga.

## What to implement

1. **NotificationService** (lib/src/core/services/notification_service.dart):
   - Initialize Firebase Messaging
   - Request permission
   - Handle token refresh
   - Store token in Supabase (user_devices table)

2. **Notification Types**:
   - Health reminders (vaccination, farrier)
   - Breeding due date alerts
   - Market listing updates
   - Subscription expiry warnings

3. **Local Notifications** (lib/src/core/services/local_notification_service.dart):
   - Schedule local notifications for reminders
   - Cancel on completion
   - Handle notification tap

4. **Update Supabase schema** (migration 008):
   - Create user_devices table (user_id, fcm_token, platform, created_at)
   - Add notification preferences to profiles

Files to create:
- lib/src/core/services/notification_service.dart
- lib/src/core/services/local_notification_service.dart
- supabase/migrations/008_notifications.sql`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-5", "notifications"],
}));

const p2Verify = defineTask("p2-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Notifications",
	description: `Run flutter analyze.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

const p3Performance = defineTask("performance", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Performance Optimization",
	description: `Optimize performance in /Users/themuuln/coding/personal/tamga.

## What to implement

1. **Image Caching**:
   - Use cached_network_image for all remote images
   - Implement proper cache size limits

2. **List Optimization**:
   - Add const constructors where possible
   - Use ListView.builder for all long lists
   - Implement lazy loading for large datasets

3. **State Management**:
   - Review provider usage
   - Avoid unnecessary rebuilds
   - Use select() for fine-grained rebuilds

4. **Database Optimization**:
   - Add indexes for frequent queries
   - Implement pagination for lists
   - Cache frequently accessed data

5. **Bundle Size**:
   - Tree shake unused code
   - Analyze bundle size
   - Remove unused dependencies

Files to modify:
- lib/src/features/horses/presentation/horses_screen.dart
- lib/src/features/market/presentation/market_screen.dart
- lib/src/features/events/presentation/events_screen.dart`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-5", "performance"],
}));

const p3Verify = defineTask("p3-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Performance",
	description: `Run flutter analyze.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

const p4Tests = defineTask("polish-tests", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "UI/UX & Notification Tests",
	description: `Write tests for theme, notifications, and performance in /Users/themuuln/coding/personal/tamga.

## Tests to create

1. **test/core/theme/design_tokens_test.dart**:
   - Test color values
   - Test spacing values
   - Test typography

2. **test/core/services/notification_service_test.dart**:
   - Test permission request
   - Test token storage
   - Test notification handling

3. **test/core/widgets/empty_state_test.dart**:
   - Test renders correctly
   - Test action button works

Run: flutter test test/core/`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-5", "tests"],
}));

const p4Verify = defineTask("p4-test", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Test verification: Polish",
	description: `Run flutter test for core features.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "tests"],
}));

export default async function process(inputs, ctx) {
	const { projectRoot } = inputs;
	const artifacts = [];

	ctx.log?.("Starting P1: Theme & Visual Polish");
	const p1Result = await ctx.task(
		p1Theme,
		{ projectRoot },
		{ label: "p1:theme" },
	);
	artifacts.push(...(p1Result.artifacts || []));
	const p1Build = await ctx.task(
		p1Verify,
		{ phase: "Theme" },
		{ label: "p1:build" },
	);
	if (!p1Build.ok) {
		const a = await ctx.breakpoint({
			question: "Build failed after theme.",
			expert: "owner",
			tags: ["build-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Build failed at P1" };
	}

	ctx.log?.("Starting P2: Notifications");
	const p2Result = await ctx.task(
		p2Notifications,
		{ projectRoot },
		{ label: "p2:notifications" },
	);
	artifacts.push(...(p2Result.artifacts || []));
	const p2Build = await ctx.task(
		p2Verify,
		{ phase: "Notifications" },
		{ label: "p2:build" },
	);
	if (!p2Build.ok) {
		const a = await ctx.breakpoint({
			question: "Build failed after notifications.",
			expert: "owner",
			tags: ["build-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Build failed at P2" };
	}

	ctx.log?.("Starting P3: Performance");
	const p3Result = await ctx.task(
		p3Performance,
		{ projectRoot },
		{ label: "p3:performance" },
	);
	artifacts.push(...(p3Result.artifacts || []));
	const p3Build = await ctx.task(
		p3Verify,
		{ phase: "Performance" },
		{ label: "p3:build" },
	);
	if (!p3Build.ok) {
		const a = await ctx.breakpoint({
			question: "Build failed after performance.",
			expert: "owner",
			tags: ["build-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Build failed at P3" };
	}

	ctx.log?.("Starting P4: Tests");
	const p4Result = await ctx.task(
		p4Tests,
		{ projectRoot },
		{ label: "p4:tests" },
	);
	artifacts.push(...(p4Result.artifacts || []));
	const p4Test = await ctx.task(p4Verify, {}, { label: "p4:test-verify" });
	if (!p4Test.ok) {
		const a = await ctx.breakpoint({
			question: "Tests failed.",
			expert: "owner",
			tags: ["test-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Tests failed at P4" };
	}

	let lastFeedback = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		const approval = await ctx.breakpoint({
			question:
				"Sprint 5 UI/UX Polish & Notifications complete. Final approval?",
			expert: "owner",
			tags: ["final-gate"],
			previousFeedback: lastFeedback || undefined,
		});
		if (approval.approved) break;
		lastFeedback =
			approval.response || approval.feedback || "Changes requested";
	}

	return {
		ok: true,
		phases: ["P1:theme", "P2:notifications", "P3:performance", "P4:tests"],
		artifacts,
		summary: "Sprint 5 complete",
	};
}
