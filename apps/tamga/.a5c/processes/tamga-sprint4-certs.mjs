/**
 * @process tamga-sprint4-certs
 * @description Sprint 4 — Digital Certificates & Breeding Tools
 * @inputs { projectRoot: string }
 * @outputs { success: boolean, artifacts: string[] }
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const p1Certs = defineTask("digital-certs", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Digital Ownership Certificates",
	description: `Build digital ownership certificate system in /Users/themuuln/coding/personal/tamga.

## What to implement

1. **OwnershipCertificate model** (lib/src/features/certificates/domain/ownership_certificate.dart):
   - Fields: id, horseId, ownerId, ownerName, issueDate, expiryDate, status (active/transferred/revoked), qrCode
   - Serialization to/from Supabase JSON

2. **CertificateRepository** (lib/src/features/certificates/data/certificate_repository.dart):
   - createCertificate(horseId, ownerId) → Result<OwnershipCertificate>
   - verifyCertificate(certificateId) → Result<CertificateVerification>
   - transferCertificate(certificateId, newOwnerId) → Result<OwnershipCertificate>
   - getCertificateByHorse(horseId) → Result<OwnershipCertificate>

3. **SupabaseCertificateRepository** (lib/src/features/certificates/data/supabase_certificate_repository.dart):
   - Implement using Supabase
   - Table: digital_certificates (already exists in schema)

4. **CertificateScreen** (lib/src/features/certificates/presentation/certificate_screen.dart):
   - Display certificate with horse info, owner info, dates
   - QR code generation for verification
   - Share certificate as image/PDF
   - Transfer certificate button

5. **VerifyCertificateScreen** (lib/src/features/certificates/presentation/verify_certificate_screen.dart):
   - Scan QR code or enter certificate ID
   - Show verification result (valid/expired/revoked)
   - Show horse and owner details

6. **Migration 006** (supabase/migrations/006_certificates.sql):
   - Ensure digital_certificates table has all needed columns
   - Add QR code data column
   - Add transfer history tracking

Files to create:
- lib/src/features/certificates/domain/ownership_certificate.dart
- lib/src/features/certificates/data/certificate_repository.dart
- lib/src/features/certificates/data/supabase_certificate_repository.dart
- lib/src/features/certificates/presentation/certificate_screen.dart
- lib/src/features/certificates/presentation/verify_certificate_screen.dart
- supabase/migrations/006_certificates.sql`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-4", "certificates"],
}));

const p1Verify = defineTask("p1-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Certificates",
	description: `Run flutter analyze.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

const p2Breeding = defineTask("breeding-tools", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Breeding Tools & Gestation Tracker",
	description: `Build breeding management tools in /Users/themuuln/coding/personal/tamga.

## What to implement

1. **BreedingRecord model update** (lib/src/features/breeding/domain/breeding_record.dart):
   - Add gestation tracking fields: breedingDate, expectedDueDate, actualFoalingDate, status (pending/foaled/aborted)
   - Add foal information: foalName, foalGender, foalColor

2. **GestationCalculator** (lib/src/features/breeding/data/gestation_calculator.dart):
   - Horse gestation: ~340 days (11 months)
   - Calculate expected due date from breeding date
   - Calculate days remaining
   - Send reminders at 30, 14, 7 days before due

3. **BreedingScreen** (lib/src/features/breeding/presentation/breeding_screen.dart):
   - List of breeding records with status
   - Add new breeding record
   - Gestation progress bar
   - Foal registration form

4. **GestationTrackerWidget** (lib/src/features/breeding/presentation/widgets/gestation_tracker.dart):
   - Visual progress bar showing days elapsed/remaining
   - Color coded: green (healthy), yellow (approaching), red (overdue)
   - Milestone markers (30 days, 90 days, 180 days, 300 days)

5. **Update Supabase schema** (migration 007):
   - Add gestation tracking columns to breeding_records
   - Add foal information columns

Files to create/modify:
- lib/src/features/breeding/domain/breeding_record.dart
- lib/src/features/breeding/data/gestation_calculator.dart
- lib/src/features/breeding/presentation/breeding_screen.dart
- lib/src/features/breeding/presentation/widgets/gestation_tracker.dart
- supabase/migrations/007_breeding_gestation.sql`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-4", "breeding"],
}));

const p2Verify = defineTask("p2-build", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Breeding",
	description: `Run flutter analyze.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

const p3Tests = defineTask("certs-breeding-tests", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Certificates & Breeding Tests",
	description: `Write tests for certificates and breeding features in /Users/themuuln/coding/personal/tamga.

## Tests to create

1. **test/features/certificates/ownership_certificate_test.dart**:
   - Test model serialization
   - Test certificate creation
   - Test transfer logic

2. **test/features/breeding/gestation_calculator_test.dart**:
   - Test due date calculation (340 days)
   - Test days remaining calculation
   - Test milestone detection

3. **test/features/breeding/breeding_record_test.dart**:
   - Test model serialization
   - Test status transitions

Run: flutter test test/features/certificates/ test/features/breeding/`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-4", "tests"],
}));

const p3Verify = defineTask("p3-test", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Test verification: Certs & Breeding",
	description: `Run flutter test for certificates and breeding.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "tests"],
}));

export default async function process(inputs, ctx) {
	const { projectRoot } = inputs;
	const artifacts = [];

	ctx.log?.("Starting P1: Digital Certificates");
	const p1Result = await ctx.task(
		p1Certs,
		{ projectRoot },
		{ label: "p1:certs" },
	);
	artifacts.push(...(p1Result.artifacts || []));
	const p1Build = await ctx.task(
		p1Verify,
		{ phase: "Certificates" },
		{ label: "p1:build" },
	);
	if (!p1Build.ok) {
		const a = await ctx.breakpoint({
			question: "Build failed after certs.",
			expert: "owner",
			tags: ["build-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Build failed at P1" };
	}

	ctx.log?.("Starting P2: Breeding Tools");
	const p2Result = await ctx.task(
		p2Breeding,
		{ projectRoot },
		{ label: "p2:breeding" },
	);
	artifacts.push(...(p2Result.artifacts || []));
	const p2Build = await ctx.task(
		p2Verify,
		{ phase: "Breeding" },
		{ label: "p2:build" },
	);
	if (!p2Build.ok) {
		const a = await ctx.breakpoint({
			question: "Build failed after breeding.",
			expert: "owner",
			tags: ["build-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Build failed at P2" };
	}

	ctx.log?.("Starting P3: Tests");
	const p3Result = await ctx.task(
		p3Tests,
		{ projectRoot },
		{ label: "p3:tests" },
	);
	artifacts.push(...(p3Result.artifacts || []));
	const p3Test = await ctx.task(p3Verify, {}, { label: "p3:test-verify" });
	if (!p3Test.ok) {
		const a = await ctx.breakpoint({
			question: "Tests failed.",
			expert: "owner",
			tags: ["test-failure"],
		});
		if (!a.approved) return { ok: false, reason: "Tests failed at P3" };
	}

	let lastFeedback = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		const approval = await ctx.breakpoint({
			question: "Sprint 4 Certificates & Breeding complete. Final approval?",
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
		phases: ["P1:certs", "P2:breeding", "P3:tests"],
		artifacts,
		summary: "Sprint 4 complete",
	};
}
