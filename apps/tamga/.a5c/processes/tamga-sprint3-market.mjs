/**
 * @process tamga-sprint3-market
 * @description Sprint 3 — Marketplace & Payments with Khan Bank integration
 * @inputs { projectRoot: string }
 * @outputs { success: boolean, artifacts: string[] }
 *
 * Khan Bank payment:
 *   Bank: Khan Bank (Хаан Банк)
 *   Account: MN110005005431666225
 *   Name: Temuulen Undrakhbayar
 *   Input: Custom code or phone number for verification
 *   Admin manually checks Khan Bank history
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ── Phase P1: Marketplace Core ───────────────────────────────────────

const p1Marketplace = defineTask("marketplace-crud", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Marketplace Core (Listing CRUD)",
	description: `Build marketplace listing CRUD in ${"/Users/themuuln/coding/personal/tamga"}.

## What to implement

1. **MarketListingScreen** — Browse listings with filters:
   - Filter by: type (sale/lease/stud), location, price range, breed
   - Search by horse name
   - Grid/list view toggle
   - Pull to refresh
   - Empty state with "Эхний зарыг оруулна уу"

2. **MarketListingDetailScreen** — View listing details:
   - Horse photos carousel
   - Price, location, description
   - Seller info with contact button
   - Share listing button
   - Report listing button

3. **CreateListingScreen** — Create new listing:
   - Select horse from user's horses
   - Listing type (sale/lease/stud)
   - Price input (Mongolian Tugrik ₮)
   - Description (required, min 20 chars)
   - Location (aimag + sum)
   - Photo upload (up to 5 photos)
   - Preview before publishing
   - Submit creates listing with status "pending_verification"

4. **MyListingsScreen** — Manage user's listings:
   - Tabs: Active / Pending / Sold / Expired
   - Edit/delete listing
   - Mark as sold
   - Renew expired listings

5. **Update Supabase schema** (migration 004):
   - Add status enum to market_listings: active, pending_verification, sold, expired, rejected
   - Add views_count column
   - Add is_featured column

Files to create/modify:
- lib/src/features/market/presentation/market_listing_screen.dart
- lib/src/features/market/presentation/market_listing_detail_screen.dart
- lib/src/features/market/presentation/create_listing_screen.dart
- lib/src/features/market/presentation/my_listings_screen.dart
- lib/src/features/market/presentation/widgets/listing_card.dart
- lib/src/features/market/presentation/widgets/listing_filter.dart
- lib/src/features/market/presentation/widgets/photo_carousel.dart`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-3", "marketplace", "crud"],
}));

const p1Verify = defineTask("p1-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Marketplace",
	description: `Run flutter analyze to verify marketplace changes.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P2: Khan Bank Payment ──────────────────────────────────────

const p2Payment = defineTask("khan-bank-payment", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Khan Bank Payment Integration",
	description: `Implement Khan Bank manual payment verification in ${"/Users/themuuln/coding/personal/tamga"}.

## Khan Bank Details
- Bank: Khan Bank (Хаан Банк)
- Account: MN110005005431666225
- Account Name: Temuulen Undrakhbayar
- Payment method: Manual bank transfer
- Verification: Admin checks Khan Bank history

## What to implement

1. **PaymentService** (lib/src/features/payments/data/payment_service.dart):
   - Define payment tiers with prices (Free/Pro/Breeder/Stable)
   - Generate unique payment code (8 chars, e.g., "TG-AB3F-7K2X")
   - Store payment request in Supabase
   - Payment status: pending / verified / rejected / expired
   - Expiry: 72 hours from creation

2. **PaymentRepository** (lib/src/features/payments/data/payment_repository.dart):
   - Interface for payment operations
   - createPaymentRequest(userId, tier, code) → Result<PaymentRequest>
   - getPaymentStatus(requestId) → Result<PaymentStatus>
   - listUserPayments(userId) → Result<List<PaymentRequest>>

3. **SupabasePaymentRepository** (lib/src/features/payments/data/supabase_payment_repository.dart):
   - Implement PaymentRepository using Supabase
   - Table: payment_requests (id, user_id, tier, code, amount, status, created_at, verified_at, admin_notes)

4. **PaymentScreen** (lib/src/features/payments/presentation/payment_screen.dart):
   - Show subscription tiers with prices
   - User selects tier
     - Display payment instructions:
     Дансны дугаар: MN110005005431666225
     Хүлээн авагч: Temuulen Undrakhbayar
     Таны код: TG-AB3F-7K2X
     Дүн: ₮9,900
   - Important: "Тухайн кодыг заавал шилжүүлгийн тэмдэглэлд бичнэ үү"
   - "Баталгаажуулсан" button (checks status)
   - Copy code to clipboard
   - Share payment details

5. **PaymentStatusWidget** (lib/src/features/payments/presentation/widgets/payment_status.dart):
   - Shows current subscription status
   - Time remaining for pending payment
   - Retry if rejected

6. **Admin verification helper** (lib/src/features/payments/data/admin_verification.dart):
   - NOT a full admin panel — just Supabase RPC function
   - Admin manually checks Khan Bank history
   - Calls verifyPayment(paymentId, adminNotes) RPC
   - Updates payment_requests.status = 'verified'
   - Updates profiles.subscription_tier = tier
   - Updates profiles.subscription_expires_at = now + 30 days

7. **Update Supabase schema** (migration 005):
   - Create payment_requests table
   - Create verify_payment() RPC function
   - Add subscription_tier and subscription_expires_at to profiles

Files to create:
- lib/src/features/payments/data/payment_service.dart
- lib/src/features/payments/data/payment_repository.dart
- lib/src/features/payments/data/supabase_payment_repository.dart
- lib/src/features/payments/presentation/payment_screen.dart
- lib/src/features/payments/presentation/widgets/payment_status.dart
- lib/src/features/payments/data/admin_verification.dart
- supabase/migrations/005_payment_system.sql`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-3", "payment", "khan-bank"],
}));

const p2Verify = defineTask("p2-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Payment",
	description: `Run flutter analyze to verify payment changes.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P3: Subscription Gate ──────────────────────────────────────

const p3Gate = defineTask("subscription-gate", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Subscription Gate & Feature Limits",
	description: `Implement subscription-based feature gating in ${"/Users/themuuln/coding/personal/tamga"}.

## What to implement

1. **FeatureGate** (lib/src/core/features/feature_gate.dart):
   - Define feature limits per tier:
     - Free: 1 horse, 50MB storage, 3 gen pedigree
     - Pro: unlimited horses, 5GB, 5 gen pedigree
     - Breeder: + inbreeding calc, breeding tools
     - Stable: + multi-user (10), client portal
   - Check if user can perform action
   - Show paywall when limit reached

2. **PaywallWidget** (lib/src/features/payments/presentation/widgets/paywall_widget.dart):
   - Show when user hits tier limit
   - Explain what they'll get with upgrade
   - "Шинэчлэх" (Upgrade) button → PaymentScreen
   - "Дараа" (Later) button to dismiss
   - Loss-aversion framing

3. **Update HorseRepository**:
   - Before creating horse: check tier limit
   - If free tier and has 1 horse: show paywall
   - Allow Pro+ to create unlimited

4. **Update DocumentVault** (if exists):
   - Check storage limit before upload
   - Free: 50MB, Pro: 5GB, Breeder: 20GB, Stable: 50GB

5. **Update PedigreeView**:
   - Free: 3 generations only
   - Pro: 5 generations
   - Breeder+: inbreeding coefficient calculator

Files to create:
- lib/src/core/features/feature_gate.dart
- lib/src/features/payments/presentation/widgets/paywall_widget.dart

Files to modify:
- lib/src/features/horses/data/local_horses_repository.dart
- lib/src/features/shared/data/isar_storage.dart (storage limit check)`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-3", "subscription", "gate"],
}));

const p3Verify = defineTask("p3-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Subscription Gate",
	description: `Run flutter analyze to verify subscription gate changes.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P4: Marketplace Tests ──────────────────────────────────────

const p4Tests = defineTask("market-tests", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Marketplace & Payment Tests",
	description: `Write comprehensive tests for marketplace and payment features in ${"/Users/themuuln/coding/personal/tamga"}.

## Tests to create

1. **test/features/market/market_listing_test.dart**:
   - Test MarketListing model serialization
   - Test listing creation with all fields
   - Test price formatting

2. **test/features/market/market_repository_test.dart**:
   - Test CRUD operations
   - Test filtering by type, location, price

3. **test/features/payments/payment_service_test.dart**:
   - Test code generation (unique, format)
   - Test payment request creation
   - Test status checks

4. **test/features/payments/feature_gate_test.dart**:
   - Test tier limits enforcement
   - Test paywall trigger conditions
   - Test upgrade flow

5. **test/features/market/presentation/market_listing_screen_test.dart**:
   - Test renders listings
   - Test filter chips work
   - Test search functionality

6. **test/features/payments/presentation/payment_screen_test.dart**:
   - Test displays Khan Bank details
   - Test shows payment code
   - Test copy to clipboard

Run: flutter test test/features/market/ test/features/payments/`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-3", "tests"],
}));

const p4Verify = defineTask("p4-test", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Test verification: Marketplace",
	description: `Run flutter test for marketplace and payments.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "tests"],
}));

// ── Main Process ─────────────────────────────────────────────────────

export default async function process(inputs, ctx) {
	const { projectRoot } = inputs;
	const artifacts = [];

	// ── P1: Marketplace Core ──────────────────────────────────
	ctx.log?.("Starting P1: Marketplace Core");
	const p1Result = await ctx.task(
		p1Marketplace,
		{ projectRoot },
		{ label: "p1:marketplace" },
	);
	artifacts.push(...(p1Result.artifacts || []));

	const p1Build = await ctx.task(
		p1Verify,
		{ phase: "Marketplace" },
		{ label: "p1:build" },
	);
	if (!p1Build.ok) {
		const approval = await ctx.breakpoint({
			question: "Build failed after marketplace. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p1Build.error,
		});
		if (!approval.approved)
			return {
				ok: false,
				reason: "Build failed at P1",
				phase: "marketplace",
				feedback: approval.response,
			};
	}

	// ── P2: Khan Bank Payment ──────────────────────────────────
	ctx.log?.("Starting P2: Khan Bank Payment");
	const p2Result = await ctx.task(
		p2Payment,
		{ projectRoot },
		{ label: "p2:payment" },
	);
	artifacts.push(...(p2Result.artifacts || []));

	const p2Build = await ctx.task(
		p2Verify,
		{ phase: "Payment" },
		{ label: "p2:build" },
	);
	if (!p2Build.ok) {
		const approval = await ctx.breakpoint({
			question: "Build failed after payment. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p2Build.error,
		});
		if (!approval.approved)
			return {
				ok: false,
				reason: "Build failed at P2",
				phase: "payment",
				feedback: approval.response,
			};
	}

	// ── P3: Subscription Gate ──────────────────────────────────
	ctx.log?.("Starting P3: Subscription Gate");
	const p3Result = await ctx.task(
		p3Gate,
		{ projectRoot },
		{ label: "p3:gate" },
	);
	artifacts.push(...(p3Result.artifacts || []));

	const p3Build = await ctx.task(
		p3Verify,
		{ phase: "Subscription Gate" },
		{ label: "p3:build" },
	);
	if (!p3Build.ok) {
		const approval = await ctx.breakpoint({
			question: "Build failed after subscription gate. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p3Build.error,
		});
		if (!approval.approved)
			return {
				ok: false,
				reason: "Build failed at P3",
				phase: "gate",
				feedback: approval.response,
			};
	}

	// ── P4: Tests ──────────────────────────────────────────────
	ctx.log?.("Starting P4: Marketplace Tests");
	const p4Result = await ctx.task(
		p4Tests,
		{ projectRoot },
		{ label: "p4:tests" },
	);
	artifacts.push(...(p4Result.artifacts || []));

	const p4Test = await ctx.task(p4Verify, {}, { label: "p4:test-verify" });
	if (!p4Test.ok) {
		const approval = await ctx.breakpoint({
			question: "Tests failed. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "test-failure"],
			previousFeedback: p4Test.error,
		});
		if (!approval.approved)
			return {
				ok: false,
				reason: "Tests failed at P4",
				phase: "tests",
				feedback: approval.response,
			};
	}

	// ── Final Approval ──────────────────────────────────────────
	let lastFeedback = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		const approval = await ctx.breakpoint({
			question: `Sprint 3 Marketplace & Payments complete. Khan Bank integration done. Final approval?`,
			expert: "owner",
			tags: ["final-gate"],
			previousFeedback: lastFeedback || undefined,
			attempt: attempt > 0 ? attempt + 1 : undefined,
		});
		if (approval.approved) break;
		lastFeedback =
			approval.response || approval.feedback || "Changes requested";
	}

	return {
		ok: true,
		phases: ["P1:marketplace", "P2:payment", "P3:gate", "P4:tests"],
		artifacts,
		summary:
			"Tamga Sprint 3 Marketplace & Payments complete (Khan Bank integration)",
	};
}
