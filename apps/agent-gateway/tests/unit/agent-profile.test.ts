import { describe, expect, it } from "vitest";
import type { AgentProfile } from "@/gateway/types";
import { formatProfileContext, loadAgentProfile } from "@/state/agent-profile";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

const AUDIENCE = "customer";

function makeProfile(overrides?: Partial<AgentProfile>): AgentProfile {
	return {
		organizationId: TEST_ORG_ID,
		audience: AUDIENCE,
		assistantName: null,
		businessSummary: null,
		responseLanguage: null,
		tone: null,
		contactDetails: null,
		businessHours: null,
		responseRules: null,
		handoffMessage: null,
		isActive: true,
		updatedBy: null,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	};
}

describe("loadAgentProfile", () => {
	it("returns null when no profile exists (PGRST116)", async () => {
		const supabase = createMockSupabase({
			data: null,
			error: { code: "PGRST116", message: "Row not found" },
		});

		const result = await loadAgentProfile(supabase, TEST_ORG_ID, AUDIENCE);
		expect(result).toBeNull();
	});

	it("returns mapped profile on success", async () => {
		const row = {
			id: "prof-1",
			organization_id: TEST_ORG_ID,
			audience: AUDIENCE,
			assistant_name: "Tolom Bot",
			business_summary: "Монголын хамгийн том онлайн худалдааны платформ.",
			response_language: "mn",
			tone: "friendly",
			contact_details: "support@tolom.mn",
			business_hours: { mon: "09:00-18:00" },
			response_rules: "Always respond in Mongolian.",
			handoff_message: "Танд туслах ажилтан руу шилжүүлж байна.",
			is_active: true,
			updated_by: "user-1",
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-06-01T00:00:00Z",
		};

		const supabase = createMockSupabase({ data: row, error: null });

		const result = await loadAgentProfile(supabase, TEST_ORG_ID, AUDIENCE);

		expect(result).not.toBeNull();
		expect(result?.id).toBe("prof-1");
		expect(result?.organizationId).toBe(TEST_ORG_ID);
		expect(result?.audience).toBe(AUDIENCE);
		expect(result?.assistantName).toBe("Tolom Bot");
		expect(result?.businessSummary).toBe(
			"Монголын хамгийн том онлайн худалдааны платформ.",
		);
		expect(result?.responseLanguage).toBe("mn");
		expect(result?.tone).toBe("friendly");
		expect(result?.contactDetails).toBe("support@tolom.mn");
		expect(result?.businessHours).toEqual({ mon: "09:00-18:00" });
		expect(result?.responseRules).toBe("Always respond in Mongolian.");
		expect(result?.handoffMessage).toBe(
			"Танд туслах ажилтан руу шилжүүлж байна.",
		);
		expect(result?.isActive).toBe(true);
		expect(result?.updatedBy).toBe("user-1");
	});

	it("returns null on unexpected error (safe fallback)", async () => {
		const supabase = createMockSupabase({
			data: null,
			error: { code: "42P01", message: "relation does not exist" },
		});

		const result = await loadAgentProfile(supabase, TEST_ORG_ID, AUDIENCE);
		expect(result).toBeNull();
	});
});

describe("formatProfileContext", () => {
	it("includes ## ORGANIZATION CONTEXT header", () => {
		const profile = makeProfile({ assistantName: "Test Bot" });
		const result = formatProfileContext(profile);
		expect(result).toContain("## ORGANIZATION CONTEXT");
	});

	it("formats all non-null fields in order", () => {
		const profile = makeProfile({
			assistantName: "Tolom Bot",
			businessSummary: "Online marketplace",
			responseLanguage: "mn",
			tone: "friendly",
			contactDetails: "support@tolom.mn",
			businessHours: { mon: "09:00-18:00" },
			responseRules: "Always be helpful.",
			handoffMessage: "Transferring to agent.",
		});

		const result = formatProfileContext(profile);

		expect(result).toBe(
			`## ORGANIZATION CONTEXT\n` +
				`Assistant name: Tolom Bot\n` +
				`Business summary: Online marketplace\n` +
				`Response language: mn\n` +
				`Tone: friendly\n` +
				`Contact details: support@tolom.mn\n` +
				`Business hours: ${JSON.stringify({ mon: "09:00-18:00" }, null, 2)}\n` +
				`Response rules: Always be helpful.\n` +
				`Handoff message: Transferring to agent.`,
		);
	});

	it("returns empty string for null-only profile", () => {
		const profile = makeProfile();
		const result = formatProfileContext(profile);
		expect(result).toBe("");
	});
});
