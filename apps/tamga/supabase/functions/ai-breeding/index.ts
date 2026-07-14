// ai-breeding — AI Breeding Advisor Edge Function
//
// Accepts POST with { sireId, damId }, constructs a breeding analysis
// prompt (inbreeding risk, health compatibility, color genetics),
// calls OpenCode Go API (DeepSeek V4 Flash), and returns structured JSON.
//
// Enforces per-user rate limits:
//   free    = 5 queries/month
//   pro     = 50 queries/month
//   breeder = unlimited
//
// Requires environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENCODE_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

// ── Rate Limit Configuration ─────────────────────────────────────────

const RATE_LIMITS: Record<string, number | null> = {
	free: 5,
	pro: 50,
	breeder: null, // unlimited
	stable: null, // unlimited
};

interface RateLimitInfo {
	allowed: boolean;
	remaining: number | null; // null = unlimited
	limit: number | null; // null = unlimited
}

async function checkRateLimit(
	supabase: ReturnType<typeof createClient>,
	userId: string,
	tier: string,
): Promise<RateLimitInfo> {
	const limit = RATE_LIMITS[tier] ?? null;

	// Unlimited tier — always allowed
	if (limit === null) {
		return { allowed: true, remaining: null, limit: null };
	}

	// Count queries this calendar month
	const now = new Date();
	const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const { count, error } = await supabase
		.from("ai_queries")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId)
		.gte("created_at", firstOfMonth.toISOString());

	if (error) {
		console.error("Rate limit check error:", error);
		// Fail open — allow the query if we can't count
		return { allowed: true, remaining: null, limit };
	}

	const used = count ?? 0;
	const remaining = Math.max(0, limit - used);
	const allowed = remaining > 0;

	return { allowed, remaining, limit };
}

// ── Breeding Analysis Prompt ─────────────────────────────────────────

function buildBreedingPrompt(sireId: string, damId: string): string {
	return `You are an expert equine breeding advisor for Mongolian horses. Analyze this potential breeding pair and provide a structured assessment.

## Horse Pair
- Sire ID: ${sireId}
- Dam ID: ${damId}

## Required Analysis Areas

### 1. Inbreeding Risk Assessment
Analyze the potential for inbreeding based on common ancestry patterns in Mongolian horse breeding. Consider:
- Common bloodlines in Mongolian horse populations
- Genetic diversity indicators
- Risk level classification

### 2. Health Compatibility
Evaluate health considerations for this breeding pair:
- Known hereditary conditions in Mongolian horse breeds
- General health compatibility factors
- Specific health recommendations

### 3. Color Genetics
Predict possible coat colors for offspring based on common Mongolian horse colors:
- Base colors: bay, black, chestnut, gray
- Dilution effects
- Pattern possibilities

### 4. Breed Suggestions
Provide recommendations for optimizing this breeding:
- Complementary trait matching
- Performance characteristic considerations
- Breeding best practices for Mongolian horses

Return your analysis as a JSON object with exactly these fields (no markdown, no code fences):
{
  "inbreedingRisk": "low" | "medium" | "high",
  "riskScore": <number 0-100>,
  "healthNotes": "<detailed health analysis text>",
  "colorPredictions": ["<color prediction 1>", "<color prediction 2>", ...],
  "breedSuggestions": ["<suggestion 1>", "<suggestion 2>", ...]
}`;
}

// ── Extract User ID from JWT ─────────────────────────────────────────

function extractUserId(req: Request): string | null {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	try {
		// Decode the JWT payload (base64url) without verification
		// The Edge Function runtime verifies the JWT before we get here
		const token = authHeader.substring(7);
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const payload = parts[1];
		const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
		const claims = JSON.parse(decoded);
		return claims.sub ?? null;
	} catch {
		return null;
	}
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// ── 1. Validate method ──────────────────────────────────────
		if (req.method !== "POST") {
			return new Response(JSON.stringify({ error: "Method not allowed" }), {
				status: 405,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			});
		}

		// ── 2. Authenticate user ────────────────────────────────────
		const userId = extractUserId(req);
		if (!userId) {
			return new Response(
				JSON.stringify({ error: "Unauthorized — valid JWT required" }),
				{
					status: 401,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		// ── 3. Parse request body ──────────────────────────────────
		const { sireId, damId } = await req.json();

		if (
			!sireId ||
			!damId ||
			typeof sireId !== "string" ||
			typeof damId !== "string"
		) {
			return new Response(
				JSON.stringify({ error: "sireId and damId (strings) are required" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		// ── 4. Initialize Supabase client (service role) ───────────
		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error(
				"SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured",
			);
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// ── 5. Look up user's subscription tier ─────────────────────
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("subscription_tier")
			.eq("id", userId)
			.single();

		const tier = profile?.subscription_tier ?? "free";

		if (profileError && profileError.code !== "PGRST116") {
			console.error("Profile lookup error:", profileError);
		}

		// ── 6. Check rate limit ─────────────────────────────────────
		const rateLimit = await checkRateLimit(supabase, userId, tier);

		if (!rateLimit.allowed) {
			return new Response(
				JSON.stringify({
					error: "Rate limit exceeded",
					message:
						`Таны ${tier === "free" ? "үнэгүй" : tier} багцын сарын хязгаар дууссан. ` +
						`Pro эсвэл Breeder багц руу шинэчилнэ үү.`,
					tier,
					limit: rateLimit.limit,
					remaining: 0,
				}),
				{
					status: 429,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		// ── 7. Call OpenCode Go API (DeepSeek V4 Flash) ────────────
		const apiKey = Deno.env.get("OPENCODE_API_KEY");
		if (!apiKey) {
			throw new Error("OPENCODE_API_KEY not configured");
		}

		const prompt = buildBreedingPrompt(sireId, damId);

		const apiResponse = await fetch(
			"https://opencode.ai/zen/go/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: "deepseek-v4-flash",
					messages: [
						{
							role: "system",
							content:
								"You are an expert equine breeding advisor. Always respond with valid JSON only, no markdown.",
						},
						{
							role: "user",
							content: prompt,
						},
					],
					max_tokens: 2048,
					temperature: 0.3,
				}),
			},
		);

		if (!apiResponse.ok) {
			const errorText = await apiResponse.text();
			console.error("OpenCode Go API error:", apiResponse.status, errorText);
			throw new Error(`AI API error: ${apiResponse.status}`);
		}

		const apiData = await apiResponse.json();
		const content = apiData?.choices?.[0]?.message?.content;

		if (!content) {
			throw new Error("No response content from AI model");
		}

		// ── 8. Parse structured JSON from AI response ───────────────
		let parsed;
		try {
			// Try direct JSON parse first
			parsed = JSON.parse(content);
		} catch {
			// Try extracting from markdown code fence
			const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
			if (jsonMatch) {
				parsed = JSON.parse(jsonMatch[1].trim());
			} else {
				throw new Error("Failed to parse AI response as JSON");
			}
		}

		// Validate required fields
		const validRisks = ["low", "medium", "high"];
		const result = {
			inbreedingRisk: validRisks.includes(parsed.inbreedingRisk)
				? parsed.inbreedingRisk
				: "medium",
			riskScore:
				typeof parsed.riskScore === "number" &&
				parsed.riskScore >= 0 &&
				parsed.riskScore <= 100
					? parsed.riskScore
					: 50,
			healthNotes:
				typeof parsed.healthNotes === "string" ? parsed.healthNotes : "",
			colorPredictions: Array.isArray(parsed.colorPredictions)
				? parsed.colorPredictions
				: [],
			breedSuggestions: Array.isArray(parsed.breedSuggestions)
				? parsed.breedSuggestions
				: [],
		};

		// ── 9. Log query to ai_queries table ────────────────────────
		const promptTokens = apiData?.usage?.prompt_tokens ?? null;
		const completionTokens = apiData?.usage?.completion_tokens ?? null;

		try {
			await supabase.from("ai_queries").insert({
				user_id: userId,
				function_name: "ai-breeding",
				model: "deepseek-v4-flash",
				prompt_tokens: promptTokens,
				completion_tokens: completionTokens,
			});
		} catch (logError) {
			// Non-fatal — query succeeded even if logging fails
			console.error("Failed to log AI query (non-fatal):", logError);
		}

		// ── 10. Return success ─────────────────────────────────────
		return new Response(
			JSON.stringify({
				...result,
				quota: {
					tier,
					limit: rateLimit.limit,
					remaining: rateLimit.remaining,
				},
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	} catch (err) {
		console.error("AI breeding error:", err);
		const errorMessage =
			err instanceof Error ? err.message : "Internal AI breeding error";
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});
