// ai-breeding — AI Breeding Advisor Edge Function
//
// Accepts POST with { sireId, damId }, checks cache, fetches horse data,
// calls Gemini 2.0 Flash, caches result, and returns structured JSON.
//
// Enforces per-user rate limits:
//   free    = 5 queries/month
//   pro     = 50 queries/month
//   breeder = unlimited
//   stable  = unlimited
//
// Requires environment variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   GEMINI_API_KEY

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

// ── Extract User ID from JWT ─────────────────────────────────────────

function extractUserId(req: Request): string | null {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	try {
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

// ── Build Breeding Prompt ────────────────────────────────────────────

function buildBreedingPrompt(
	sire: Record<string, unknown>,
	dam: Record<string, unknown>,
): string {
	return `Та Монгол морь үржлийн мэргэжилтэн. Эдгээр хоёр морийн нийцлийг шинжилж, бүтэцтэй JSON хариу өгнө үү.

Азарга (Сүр): ${sire.name}, Өнгө: ${sire.coat || "Тодорхойгүй"}, Хүйс: ${sire.gender}, Төрсөн он: ${sire.birth_year || "Тодорхойгүй"}

Эмгэн (Дам): ${dam.name}, Өнгө: ${dam.coat || "Тодорхойгүй"}, Хүйс: ${dam.gender}, Төрсөн он: ${dam.birth_year || "Тодорхойгүй"}

Дараах талбаруудтай JSON хариу өгнө үү:
- compatibility_score (0-100)
- risk_level (low/medium/high)
- inbreeding_risk (тодорхойлолт)
- strengths (Монгол хэл дээрх STRING массив)
- weaknesses (Монгол хэл дээрх STRING массив)
- recommendation (Монгол хэл дээрх STRING)
- disclaimer (always: 'Энэ нь зөвлөх мэдээлэл бөгөөд малын эмчийн зөвлөгөө биш')

Хариуг Монгол хэлээр бичнэ үү. Зөвхөн JSON буцаана уу — markdown кодын блок оруулж болохгүй.`;
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

		// ── 7. Check cache ──────────────────────────────────────────
		const { data: cached } = await supabase
			.from("ai_breeding_cache")
			.select("result")
			.eq("sire_id", sireId)
			.eq("dam_id", damId)
			.gt("expires_at", new Date().toISOString())
			.single();

		if (cached) {
			return new Response(
				JSON.stringify({
					...cached.result,
					quota: {
						tier,
						limit: rateLimit.limit,
						remaining: rateLimit.remaining,
					},
				}),
				{
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		// ── 8. Fetch horse data ─────────────────────────────────────
		const { data: sire } = await supabase
			.from("horses")
			.select("*")
			.eq("id", sireId)
			.single();

		const { data: dam } = await supabase
			.from("horses")
			.select("*")
			.eq("id", damId)
			.single();

		if (!sire || !dam) {
			return new Response(
				JSON.stringify({ error: "Horse not found" }),
				{
					status: 404,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		// ── 9. Call Gemini 2.0 Flash ────────────────────────────────
		const geminiKey = Deno.env.get("GEMINI_API_KEY");
		if (!geminiKey) {
			throw new Error("GEMINI_API_KEY not configured");
		}

		const prompt = buildBreedingPrompt(sire, dam);

		const geminiRes = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
				}),
			},
		);

		if (!geminiRes.ok) {
			const errorText = await geminiRes.text();
			console.error("Gemini API error:", geminiRes.status, errorText);
			throw new Error(`AI API error: ${geminiRes.status}`);
		}

		const geminiData = await geminiRes.json();
		const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!text) {
			throw new Error("No response content from AI model");
		}

		// ── 10. Parse structured JSON from AI response ──────────────
		let parsed;
		try {
			parsed = JSON.parse(text);
		} catch {
			const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
			if (jsonMatch) {
				parsed = JSON.parse(jsonMatch[1].trim());
			} else {
				throw new Error("Failed to parse AI response as JSON");
			}
		}

		// Validate and sanitize fields
		const validRiskLevels = ["low", "medium", "high"];
		const result = {
			compatibility_score:
				typeof parsed.compatibility_score === "number"
					? Math.min(100, Math.max(0, parsed.compatibility_score))
					: 50,
			risk_level: validRiskLevels.includes(parsed.risk_level)
				? parsed.risk_level
				: "medium",
			inbreeding_risk:
				typeof parsed.inbreeding_risk === "string"
					? parsed.inbreeding_risk
					: "Тодорхойгүй",
			strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
			weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
			recommendation:
				typeof parsed.recommendation === "string"
					? parsed.recommendation
					: "",
			disclaimer:
				"Энэ нь зөвлөх мэдээлэл бөгөөд малын эмчийн зөвлөгөө биш",
		};

		// ── 11. Cache result ────────────────────────────────────────
		try {
			await supabase.from("ai_breeding_cache").insert({
				sire_id: sireId,
				dam_id: damId,
				result,
				model_version: "gemini-2.0-flash",
			});
		} catch (cacheError) {
			// Non-fatal — result succeeded even if caching fails
			console.error("Failed to cache breeding result (non-fatal):", cacheError);
		}

		// ── 12. Log query to ai_queries table ───────────────────────
		try {
			await supabase.from("ai_queries").insert({
				user_id: userId,
				function_name: "ai-breeding",
				model: "gemini-2.0-flash",
			});
		} catch (logError) {
			console.error("Failed to log AI query (non-fatal):", logError);
		}

		// ── 13. Return success ──────────────────────────────────────
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
