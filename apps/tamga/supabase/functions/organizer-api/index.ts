// organizer-api — Unified Edge Function for organizer REST API
//
// Provides a programmatic REST API for external race organizers.
// Uses API key authentication (bcrypt-hashed keys stored in api_keys table).
// Path-based routing dispatches to the appropriate handler.
//
// Requires environment variables (provided automatically by Supabase CLI):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs";

// ── Types ────────────────────────────────────────────────────────────

// Runtime type alias for Supabase client — no generated DB types needed
type DBClient = SupabaseClient<any, "public", any>;

// ── CORS Headers ─────────────────────────────────────────────────────

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// ── Auth Context ─────────────────────────────────────────────────────

interface AuthContext {
	keyId: string;
	organizerId: string;
	scopes: string[];
}

const SCOPE_MAP: Record<string, string> = {
	"GET:/races": "races:read",
	"POST:/races": "races:write",
	"GET:/races/:id/entries": "races:read",
	"POST:/races/:id/entries": "races:write",
	"POST:/races/:id/results": "races:write",
	"POST:/api-keys": "admin",
	"GET:/api-keys": "admin",
	"PATCH:/api-keys/:id": "admin",
	"POST:/webhooks": "webhooks:write",
	"GET:/webhooks": "webhooks:read",
	// v1/events routes
	"GET:/v1/events": "events:read",
	"POST:/v1/events": "events:write",
	"GET:/v1/events/:id": "events:read",
	"PUT:/v1/events/:id": "events:write",
	"DELETE:/v1/events/:id": "events:write",
	"GET:/v1/events/:id/registrations": "registrations:read",
	"POST:/v1/events/:id/registrations": "registrations:write",
	"DELETE:/v1/events/:id/registrations/:rid": "registrations:write",
	"POST:/v1/events/:id/results": "events:write",
	"GET:/v1/usage": "admin",
};

function getRequiredScope(method: string, pathname: string): string | undefined {
	const normalizedPath = pathname.replace(/\/$/, "");

	// Try exact match first
	const exactKey = `${method}:${normalizedPath}`;
	if (SCOPE_MAP[exactKey]) return SCOPE_MAP[exactKey];

	// Try pattern match with path params (e.g., /races/:id/entries)
	const segments = normalizedPath.split("/").filter(Boolean);
	for (const [pattern, scope] of Object.entries(SCOPE_MAP)) {
		const [pMethod, ...pSegments] = pattern.split(":");
		const pPath = pSegments.join(":");
		if (pMethod !== method) continue;

		const patternSegments = pPath.split("/").filter(Boolean);
		if (segments.length !== patternSegments.length) continue;

		let match = true;
		for (let i = 0; i < segments.length; i++) {
			if (patternSegments[i].startsWith(":")) continue; // param matches anything
			if (segments[i] !== patternSegments[i]) {
				match = false;
				break;
			}
		}
		if (match) return scope;
	}

	return undefined;
}

// ── Auth Middleware ───────────────────────────────────────────────────

async function authenticateRequest(
	req: Request,
	supabase: DBClient,
	requiredScope?: string,
): Promise<{ auth: AuthContext; response: null } | { auth: null; response: Response }> {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return {
			auth: null,
			response: new Response(
				JSON.stringify({ error: "Unauthorized — API key required" }),
				{ status: 401, headers: jsonHeaders },
			),
		};
	}

	const rawKey = authHeader.substring(7).trim();
	if (!rawKey) {
		return {
			auth: null,
			response: new Response(
				JSON.stringify({ error: "Unauthorized — API key required" }),
				{ status: 401, headers: jsonHeaders },
			),
		};
	}

	// Fetch all active, non-expired keys
	const now = new Date().toISOString();
	const { data: keys, error } = await supabase
		.from("api_keys")
		.select("id, key_hash, organizer_id, scopes, expires_at")
		.eq("is_active", true);

	if (error || !keys || keys.length === 0) {
		console.error("API key lookup error:", error);
		return {
			auth: null,
			response: new Response(
				JSON.stringify({ error: "Unauthorized — invalid API key" }),
				{ status: 401, headers: jsonHeaders },
			),
		};
	}

	// Compare the raw key against each stored bcrypt hash
	let matchedKey: (typeof keys)[number] | null = null;
	for (const key of keys) {
		// Skip expired keys
		if (key.expires_at && key.expires_at < now) continue;

		const isValid = bcrypt.compareSync(rawKey, key.key_hash);
		if (isValid) {
			matchedKey = key;
			break;
		}
	}

	if (!matchedKey) {
		return {
			auth: null,
			response: new Response(
				JSON.stringify({ error: "Unauthorized — invalid API key" }),
				{ status: 401, headers: jsonHeaders },
			),
		};
	}

	// Update last_used_at (non-blocking)
	void supabase
		.from("api_keys")
		.update({ last_used_at: new Date().toISOString() })
		.eq("id", matchedKey.id);

	// Check scope
	if (requiredScope && !matchedKey.scopes.includes(requiredScope) && !matchedKey.scopes.includes("*")) {
		return {
			auth: null,
			response: new Response(
				JSON.stringify({
					error: "Forbidden — insufficient scope",
					required: requiredScope,
					has: matchedKey.scopes,
				}),
				{ status: 403, headers: jsonHeaders },
			),
		};
	}

	return {
		auth: {
			keyId: matchedKey.id,
			organizerId: matchedKey.organizer_id,
			scopes: matchedKey.scopes,
		},
		response: null,
	};
}

// ── JSON Response Helpers ────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: jsonHeaders,
	});
}

function errorResponse(message: string, status: number): Response {
	return json({ error: message }, status);
}

// ── Route Parsing ────────────────────────────────────────────────────

interface RouteMatch {
	handler: string;
	params: Record<string, string>;
}

function matchRoute(
	method: string,
	pathname: string,
): RouteMatch | null {
	const normalizedPath = pathname.replace(/\/$/, "") || "/";
	const segments = normalizedPath.split("/").filter(Boolean);

	// Define routes: [method, pattern, handlerName]
	const routes: Array<[string, string[], string]> = [
		["GET", ["api-keys"], "listApiKeys"],
		["POST", ["api-keys"], "createApiKey"],
		["PATCH", ["api-keys", ":id"], "deactivateApiKey"],
		["POST", ["webhooks"], "createWebhook"],
		["GET", ["webhooks"], "listWebhooks"],
		["GET", ["races"], "listRaces"],
		["POST", ["races"], "createRace"],
		["GET", ["races", ":id", "entries"], "listEntries"],
		["POST", ["races", ":id", "entries"], "registerEntry"],
		["POST", ["races", ":id", "results"], "submitResults"],
		["GET", ["horses", ":id"], "getHorse"],
		// v1/events routes
		["GET", ["v1", "events"], "listEvents"],
		["POST", ["v1", "events"], "createEvent"],
		["GET", ["v1", "events", ":id"], "getEvent"],
		["PUT", ["v1", "events", ":id"], "updateEvent"],
		["DELETE", ["v1", "events", ":id"], "deleteEvent"],
		["GET", ["v1", "events", ":id", "registrations"], "listRegistrations"],
		["POST", ["v1", "events", ":id", "registrations"], "createRegistration"],
		["DELETE", ["v1", "events", ":id", "registrations", ":rid"], "cancelRegistration"],
		["POST", ["v1", "events", ":id", "results"], "submitEventResults"],
		["GET", ["v1", "usage"], "getUsageStats"],
	];

	for (const [routeMethod, pattern, handler] of routes) {
		if (routeMethod !== method) continue;

		if (segments.length !== pattern.length) continue;

		const params: Record<string, string> = {};
		let match = true;

		for (let i = 0; i < segments.length; i++) {
			if (pattern[i].startsWith(":")) {
				params[pattern[i].substring(1)] = segments[i];
			} else if (segments[i] !== pattern[i]) {
				match = false;
				break;
			}
		}

		if (match) {
			return { handler, params };
		}
	}

	return null;
}

// ── API Key Helpers ──────────────────────────────────────────────────

function generateApiKeyString(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `tamga_${hex}`;
}

// ── Handlers ─────────────────────────────────────────────────────────

// POST /api-keys — Generate a new API key (requires admin scope)
async function handleCreateApiKey(
	req: Request,
	supabase: DBClient,
): Promise<Response> {
	try {
		const body = await req.json();
		const { name, scopes, organizer_id, expires_at } = body;

		if (!name || !organizer_id) {
			return errorResponse("name and organizer_id are required", 400);
		}

		// Generate raw key and hash it
		const rawKey = generateApiKeyString();
		const salt = bcrypt.genSaltSync(10);
		const keyHash = bcrypt.hashSync(rawKey, salt);

		const keyScopes = Array.isArray(scopes) ? scopes : ["races:read"];

		const { data, error } = await supabase
			.from("api_keys")
			.insert({
				name,
				key_hash: keyHash,
				scopes: keyScopes,
				organizer_id,
				is_active: true,
				expires_at: expires_at || null,
			})
			.select("id, name, scopes, organizer_id, is_active, created_at, expires_at")
			.single();

		if (error) {
			console.error("Error creating API key:", error);
			return errorResponse("Failed to create API key", 500);
		}

		// Return the raw key ONLY on creation
		return json(
			{
				...data,
				raw_key: rawKey, // Only returned once
				warning: "Save this key securely. It will not be shown again.",
			},
			201,
		);
	} catch (err) {
		console.error("handleCreateApiKey error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// GET /api-keys — List API keys (requires admin scope)
async function handleListApiKeys(
	_req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	const { data, error } = await supabase
		.from("api_keys")
		.select("id, name, scopes, organizer_id, is_active, last_used_at, created_at, expires_at")
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error listing API keys:", error);
		return errorResponse("Failed to list API keys", 500);
	}

	// Never return key_hash
	return json(data || []);
}

// PATCH /api-keys/:id — Deactivate an API key (requires admin scope)
async function handleDeactivateApiKey(
	req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id } = params;

	let body: Record<string, unknown> = {};
	try {
		body = await req.json();
	} catch {
		// ignore empty body
	}

	const updates: Record<string, unknown> = {};
	if (body.is_active === false || body.is_active === true) {
		updates.is_active = body.is_active;
	}

	if (Object.keys(updates).length === 0) {
		return errorResponse("No valid fields to update (e.g., is_active)", 400);
	}

	const { data, error } = await supabase
		.from("api_keys")
		.update(updates)
		.eq("id", id)
		.select("id, name, scopes, organizer_id, is_active, last_used_at, created_at, expires_at")
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return errorResponse("API key not found", 404);
		}
		console.error("Error updating API key:", error);
		return errorResponse("Failed to update API key", 500);
	}

	return json(data);
}

// POST /webhooks — Register a webhook subscription
async function handleCreateWebhook(
	req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	try {
		const body = await req.json();
		const { url, events } = body;

		if (!url || !events || !Array.isArray(events) || events.length === 0) {
			return errorResponse("url and events (non-empty array) are required", 400);
		}

		// Basic URL validation
		try {
			const parsed = new URL(url);
			if (!parsed.protocol.startsWith("http")) {
				return errorResponse("url must start with http:// or https://", 400);
			}
		} catch {
			return errorResponse("Invalid URL format", 400);
		}

		// Validate event types
		const validEvents = ["race.entry.created", "race.result.posted"];
		const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
		if (invalidEvents.length > 0) {
			return errorResponse(
				`Invalid event types: ${invalidEvents.join(", ")}. Valid: ${validEvents.join(", ")}`,
				400,
			);
		}

		const { data, error } = await supabase
			.from("webhook_subscriptions")
			.insert({
				api_key_id: auth.keyId,
				url,
				events,
				is_active: true,
			})
			.select()
			.single();

		if (error) {
			console.error("Error creating webhook:", error);
			return errorResponse("Failed to create webhook subscription", 500);
		}

		return json(data, 201);
	} catch (err) {
		console.error("handleCreateWebhook error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// GET /webhooks — List webhook subscriptions
async function handleListWebhooks(
	_req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	const { data, error } = await supabase
		.from("webhook_subscriptions")
		.select("*")
		.eq("api_key_id", auth.keyId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error listing webhooks:", error);
		return errorResponse("Failed to list webhook subscriptions", 500);
	}

	return json(data || []);
}

// GET /races — List races (with optional filters)
async function handleListRaces(
	req: Request,
	supabase: DBClient,
): Promise<Response> {
	const url = new URL(req.url);
	const status = url.searchParams.get("status");
	const type = url.searchParams.get("type");
	const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
	const offset = Number(url.searchParams.get("offset")) || 0;

	let query = supabase
		.from("races")
		.select("*", { count: "exact" })
		.order("date", { ascending: false })
		.range(offset, offset + limit - 1);

	if (status) query = query.eq("status", status);
	if (type) query = query.eq("type", type);

	const { data, error, count } = await query;

	if (error) {
		console.error("Error listing races:", error);
		return errorResponse("Failed to list races", 500);
	}

	return json({ data: data || [], count: count ?? 0, limit, offset });
}

// POST /races — Create a race
async function handleCreateRace(
	req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	try {
		const body = await req.json();
		const { name, location, date, type, description } = body;

		if (!name || !location || !date || !type) {
			return errorResponse("name, location, date, and type are required", 400);
		}

		const raceId = crypto.randomUUID();

		const { data, error } = await supabase
			.from("races")
			.insert({
				id: raceId,
				name,
				location,
				date,
				type,
				description: description || null,
				organizer_id: auth.organizerId,
				status: "upcoming",
			})
			.select()
			.single();

		if (error) {
			console.error("Error creating race:", error);
			return errorResponse("Failed to create race", 500);
		}

		return json(data, 201);
	} catch (err) {
		console.error("handleCreateRace error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// GET /races/:id/entries — List entries for a race
async function handleListEntries(
	_req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id: raceId } = params;

	// Verify race exists
	const { data: race, error: raceError } = await supabase
		.from("races")
		.select("id")
		.eq("id", raceId)
		.single();

	if (raceError || !race) {
		return errorResponse("Race not found", 404);
	}

	// Fetch entries (no FK from race_entries.horse_id to horses.id, so manual join)
	const { data: entries, error } = await supabase
		.from("race_entries")
		.select("*")
		.eq("race_id", raceId)
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error listing entries:", error);
		return errorResponse("Failed to list entries", 500);
	}

	if (!entries || entries.length === 0) {
		return json([]);
	}

	// Look up horse names in a batch query
	const horseIds = [...new Set(entries.map((e: Record<string, unknown>) => e.horse_id as string))];
	const { data: horses } = await supabase
		.from("horses")
		.select("id, name, gender, coat, birth_year")
		.in("id", horseIds);

	const horseMap = new Map<string, Record<string, unknown>>();
	if (horses) {
		for (const h of horses) {
			horseMap.set(h.id, h);
		}
	}

	// Merge horse data into entries
	const enriched = entries.map((e: Record<string, unknown>) => ({
		...e,
		horse: horseMap.get(e.horse_id as string) || null,
	}));

	return json(enriched);
}

// POST /races/:id/entries — Register a horse in a race
async function handleRegisterEntry(
	req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id: raceId } = params;

	try {
		const body = await req.json();
		const { horse_id, jockey_name } = body;

		if (!horse_id) {
			return errorResponse("horse_id is required", 400);
		}

		// Verify race exists and check capacity
		const { data: race, error: raceError } = await supabase
			.from("races")
			.select("id, max_entries")
			.eq("id", raceId)
			.single();

		if (raceError || !race) {
			return errorResponse("Race not found", 404);
		}

		// Check if race is full
		if (race.max_entries) {
			const { count, error: countError } = await supabase
				.from("race_entries")
				.select("id", { count: "exact", head: true })
				.eq("race_id", raceId);

			if (!countError && count !== null && count >= race.max_entries) {
				return errorResponse("Race is full — max entries reached", 409);
			}
		}

		// Check for duplicate entry
		const { data: existing } = await supabase
			.from("race_entries")
			.select("id")
			.eq("race_id", raceId)
			.eq("horse_id", horse_id)
			.maybeSingle();

		if (existing) {
			return errorResponse("Horse already registered in this race", 409);
		}

		const entryId = crypto.randomUUID();

		const { data, error } = await supabase
			.from("race_entries")
			.insert({
				id: entryId,
				race_id: raceId,
				horse_id,
				jockey_name: jockey_name || null,
				status: "registered",
			})
			.select()
			.single();

		if (error) {
			console.error("Error registering entry:", error);
			return errorResponse("Failed to register entry", 500);
		}

		// Fire webhook event (non-blocking)
		void deliverWebhookEvent(
			"race.entry.created",
			{ entry: data, race_id: raceId },
			supabase,
		);

		return json(data, 201);
	} catch (err) {
		console.error("handleRegisterEntry error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// POST /races/:id/results — Submit race results
async function handleSubmitResults(
	req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id: raceId } = params;

	try {
		const body = await req.json();
		const results = Array.isArray(body) ? body : body.results;

		if (!Array.isArray(results) || results.length === 0) {
			return errorResponse("results array is required with {placement, horse_id, prize}", 400);
		}

		// Verify race exists
		const { data: race, error: raceError } = await supabase
			.from("races")
			.select("id, status")
			.eq("id", raceId)
			.single();

		if (raceError || !race) {
			return errorResponse("Race not found", 404);
		}

		// Prevent duplicate submissions for already-completed races
		if (race.status === "completed") {
			return errorResponse("Race has already been completed", 409);
		}

		// Update each entry with placement and prize
		const updatedEntries = [];
		for (const result of results) {
			const { placement, horse_id, prize } = result;

			if (!placement || !horse_id) {
				return errorResponse(
					"Each result must have placement and horse_id",
					400,
				);
			}

			const { data: entry, error: updateError } = await supabase
				.from("race_entries")
				.update({
					placement,
					prize: prize || null,
					status: "completed",
				})
				.eq("race_id", raceId)
				.eq("horse_id", horse_id)
				.select()
				.single();

			if (updateError) {
				console.error(`Error updating entry for horse ${horse_id}:`, updateError);
				return errorResponse(
					`Failed to update entry for horse ${horse_id}. Ensure the horse is registered.`,
					400,
				);
			}

			updatedEntries.push(entry);
		}

		// Update race status to completed
		void supabase
			.from("races")
			.update({ status: "completed" })
			.eq("id", raceId);

		// Fire webhook event (non-blocking)
		void deliverWebhookEvent(
			"race.result.posted",
			{ race_id: raceId, entries: updatedEntries },
			supabase,
		);

		return json({ race_id: raceId, entries: updatedEntries }, 201);
	} catch (err) {
		console.error("handleSubmitResults error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// GET /horses/:id — Public horse profile (no auth required)
async function handleGetHorse(
	_req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id } = params;

	const { data, error } = await supabase
		.from("horses")
		.select("id, name, gender, coat, birth_year, registration_no, photo_urls")
		.eq("id", id)
		.single();

	if (error || !data) {
		return errorResponse("Horse not found", 404);
	}

	return json(data);
}

// ── v1/events Handlers ─────────────────────────────────────────────

// GET /v1/events — List organizer's events
async function handleListEvents(
	_req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	const url = new URL(_req.url);
	const status = url.searchParams.get("status");
	const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
	const offset = Number(url.searchParams.get("offset")) || 0;

	let query = supabase
		.from("organizer_events")
		.select("*", { count: "exact" })
		.eq("organizer_id", auth.organizerId)
		.order("start_date", { ascending: false })
		.range(offset, offset + limit - 1);

	if (status) query = query.eq("status", status);

	const { data, error, count } = await query;

	if (error) {
		console.error("Error listing events:", error);
		return errorResponse("Failed to list events", 500);
	}

	return json({ data: data || [], count: count ?? 0, limit, offset });
}

// POST /v1/events — Create a new event
async function handleCreateEvent(
	req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	try {
		const body = await req.json();
		const { title, event_type, location, start_date } = body;

		if (!title || !event_type || !location || !start_date) {
			return errorResponse(
				"title, event_type, location, and start_date are required",
				400,
			);
		}

		const validTypes = ["race", "competition", "expo", "training", "festival"];
		if (!validTypes.includes(event_type)) {
			return errorResponse(
				`event_type must be one of: ${validTypes.join(", ")}`,
				400,
			);
		}

		const { data, error } = await supabase
			.from("organizer_events")
			.insert({
				organizer_id: auth.organizerId,
				title,
				event_type,
				description: body.description || "",
				location,
				location_lat: body.location_lat || null,
				location_lng: body.location_lng || null,
				start_date,
				end_date: body.end_date || null,
				registration_deadline: body.registration_deadline || null,
				max_participants: body.max_participants || null,
				entry_fee_mnt: body.entry_fee_mnt || 0,
				prize_pool_mnt: body.prize_pool_mnt || 0,
				rules: body.rules || "",
				status: "draft",
				is_public: body.is_public || false,
				banner_url: body.banner_url || null,
			})
			.select()
			.single();

		if (error) {
			console.error("Error creating event:", error);
			return errorResponse("Failed to create event", 500);
		}

		return json(data, 201);
	} catch (err) {
		console.error("handleCreateEvent error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// GET /v1/events/:id — Get event details
async function handleGetEvent(
	_req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id } = params;

	const { data, error } = await supabase
		.from("organizer_events")
		.select("*")
		.eq("id", id)
		.single();

	if (error || !data) {
		return errorResponse("Event not found", 404);
	}

	return json(data);
}

// PUT /v1/events/:id — Update event
async function handleUpdateEvent(
	req: Request,
	supabase: DBClient,
	params: Record<string, string>,
	auth: AuthContext,
): Promise<Response> {
	const { id } = params;

	try {
		const body = await req.json();

		// Verify ownership
		const { data: existing, error: fetchErr } = await supabase
			.from("organizer_events")
			.select("organizer_id")
			.eq("id", id)
			.single();

		if (fetchErr || !existing) {
			return errorResponse("Event not found", 404);
		}

		if (existing.organizer_id !== auth.organizerId) {
			return errorResponse("Forbidden — not your event", 403);
		}

		const updates: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};

		const allowed = [
			"title", "description", "location", "location_lat", "location_lng",
			"start_date", "end_date", "registration_deadline", "max_participants",
			"entry_fee_mnt", "prize_pool_mnt", "rules", "status", "is_public",
			"banner_url",
		];

		for (const key of allowed) {
			if (key in body) updates[key] = body[key];
		}

		const { data, error } = await supabase
			.from("organizer_events")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("Error updating event:", error);
			return errorResponse("Failed to update event", 500);
		}

		return json(data);
	} catch (err) {
		console.error("handleUpdateEvent error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// DELETE /v1/events/:id — Delete event
async function handleDeleteEvent(
	_req: Request,
	supabase: DBClient,
	params: Record<string, string>,
	auth: AuthContext,
): Promise<Response> {
	const { id } = params;

	// Verify ownership
	const { data: existing, error: fetchErr } = await supabase
		.from("organizer_events")
		.select("organizer_id")
		.eq("id", id)
		.single();

	if (fetchErr || !existing) {
		return errorResponse("Event not found", 404);
	}

	if (existing.organizer_id !== auth.organizerId) {
		return errorResponse("Forbidden — not your event", 403);
	}

	const { error } = await supabase
		.from("organizer_events")
		.delete()
		.eq("id", id);

	if (error) {
		console.error("Error deleting event:", error);
		return errorResponse("Failed to delete event", 500);
	}

	return new Response(null, { status: 204, headers: corsHeaders });
}

// GET /v1/events/:id/registrations — List registrations
async function handleListRegistrations(
	_req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id: eventId } = params;

	const { data, error } = await supabase
		.from("organizer_registrations")
		.select("*")
		.eq("event_id", eventId)
		.order("registered_at", { ascending: true });

	if (error) {
		console.error("Error listing registrations:", error);
		return errorResponse("Failed to list registrations", 500);
	}

	return json(data || []);
}

// POST /v1/events/:id/registrations — Register a horse
async function handleCreateRegistration(
	req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { id: eventId } = params;

	try {
		const body = await req.json();
		const { horse_id, owner_user_id, horse_name } = body;

		if (!horse_id || !owner_user_id || !horse_name) {
			return errorResponse(
				"horse_id, owner_user_id, and horse_name are required",
				400,
			);
		}

		// Check for duplicate
		const { data: existing } = await supabase
			.from("organizer_registrations")
			.select("id")
			.eq("event_id", eventId)
			.eq("horse_id", horse_id)
			.maybeSingle();

		if (existing) {
			return errorResponse("Horse is already registered for this event", 409);
		}

		const { data, error } = await supabase
			.from("organizer_registrations")
			.insert({
				event_id: eventId,
				horse_id,
				owner_user_id,
				horse_name,
				owner_name: body.owner_name || "",
				phone: body.phone || "",
				status: "registered",
				notes: body.notes || "",
			})
			.select()
			.single();

		if (error) {
			console.error("Error creating registration:", error);
			return errorResponse("Failed to create registration", 500);
		}

		return json(data, 201);
	} catch (err) {
		console.error("handleCreateRegistration error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// DELETE /v1/events/:id/registrations/:rid — Cancel registration
async function handleCancelRegistration(
	_req: Request,
	supabase: DBClient,
	params: Record<string, string>,
): Promise<Response> {
	const { rid } = params;

	const { error } = await supabase
		.from("organizer_registrations")
		.update({ status: "withdrawn" })
		.eq("id", rid);

	if (error) {
		console.error("Error cancelling registration:", error);
		return errorResponse("Failed to cancel registration", 500);
	}

	return new Response(null, { status: 204, headers: corsHeaders });
}

// POST /v1/events/:id/results — Submit event results
async function handleSubmitEventResults(
	req: Request,
	supabase: DBClient,
	params: Record<string, string>,
	auth: AuthContext,
): Promise<Response> {
	const { id: eventId } = params;

	try {
		const body = await req.json();
		const results = body.results;

		if (!Array.isArray(results) || results.length === 0) {
			return errorResponse("results array is required", 400);
		}

		// Verify event ownership
		const { data: existing, error: fetchErr } = await supabase
			.from("organizer_events")
			.select("organizer_id")
			.eq("id", eventId)
			.single();

		if (fetchErr || !existing) {
			return errorResponse("Event not found", 404);
		}

		if (existing.organizer_id !== auth.organizerId) {
			return errorResponse("Forbidden — not your event", 403);
		}

		const rows = results.map(
			(r: Record<string, unknown>) => ({
				event_id: eventId,
				registration_id: r.registration_id,
				horse_id: r.horse_id,
				placement: r.placement,
				time_seconds: r.time_seconds || null,
				score: r.score || null,
				prize_mnt: r.prize_mnt || 0,
				notes: r.notes || "",
			}),
		);

		const { data, error } = await supabase
			.from("organizer_results")
			.upsert(rows, { onConflict: "event_id,registration_id" })
			.select();

		if (error) {
			console.error("Error submitting results:", error);
			return errorResponse("Failed to submit results", 500);
		}

		return json({ data: data || [] }, 201);
	} catch (err) {
		console.error("handleSubmitEventResults error:", err);
		return errorResponse("Invalid request body", 400);
	}
}

// GET /v1/usage — API usage stats for the current key
async function handleGetUsageStats(
	_req: Request,
	supabase: DBClient,
	auth: AuthContext,
): Promise<Response> {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const oneMinAgo = new Date(Date.now() - 60000);

	// Total requests for this key
	const { count: total } = await supabase
		.from("api_usage_log")
		.select("id", { count: "exact", head: true })
		.eq("api_key_id", auth.keyId);

	// Requests today
	const { count: today } = await supabase
		.from("api_usage_log")
		.select("id", { count: "exact", head: true })
		.eq("api_key_id", auth.keyId)
		.gte("created_at", todayStart.toISOString());

	// Requests in last minute
	const { count: recent } = await supabase
		.from("api_usage_log")
		.select("id", { count: "exact", head: true })
		.eq("api_key_id", auth.keyId)
		.gte("created_at", oneMinAgo.toISOString());

	// Get rate limit from the key
	const { data: keyData } = await supabase
		.from("api_keys")
		.select("scopes")
		.eq("id", auth.keyId)
		.single();

	return json({
		total_requests: total ?? 0,
		requests_today: today ?? 0,
		requests_this_minute: recent ?? 0,
		rate_limit: 60,
	});
}

// ── Usage Logging ───────────────────────────────────────────────────

/**
 * Log API usage for the given key. Non-blocking — failures are logged
 * but never propagated to the caller.
 */
async function logApiUsage(
	keyId: string,
	endpoint: string,
	method: string,
	statusCode: number,
	responseTimeMs: number,
	supabase: DBClient,
): Promise<void> {
	try {
		await supabase.from("api_usage_log").insert({
			api_key_id: keyId,
			endpoint,
			method,
			status_code: statusCode,
			response_time_ms: responseTimeMs,
		});
	} catch (err) {
		console.error("Failed to log API usage:", err);
	}
}

// ── Rate Limiting ───────────────────────────────────────────────────

/**
 * In-memory sliding window rate limiter per API key.
 * Sufficient for a single Edge Function instance.
 */
const rateLimitBuckets = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(keyId: string, limit: number): {
	ok: boolean;
	retryAfterSeconds: number;
} {
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_MS;

	let timestamps = rateLimitBuckets.get(keyId) || [];
	// Prune old entries
	timestamps = timestamps.filter((t) => t > windowStart);

	if (timestamps.length >= limit) {
		const oldest = timestamps[0];
		const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
		return { ok: false, retryAfterSeconds: Math.max(retryAfter, 1) };
	}

	timestamps.push(now);
	rateLimitBuckets.set(keyId, timestamps);

	return { ok: true, retryAfterSeconds: 0 };
}
// ── Webhook Delivery ──────────────────────────────────────────────────

/**
 * Deliver a webhook event to all active subscribers for the given event type.
 * Runs non-blockingly — failures are logged but never propagated to the caller.
 */
async function deliverWebhookEvent(
	eventType: string,
	payload: Record<string, unknown>,
	supabase: DBClient,
): Promise<void> {
	try {
		const { data: subscriptions, error } = await supabase
			.from("webhook_subscriptions")
			.select("id, url")
			.eq("is_active", true)
			.contains("events", [eventType]);

		if (error || !subscriptions || subscriptions.length === 0) {
			return;
		}

		const deliveryPromises = subscriptions.map((sub) =>
			deliverToUrl(sub.id, sub.url, eventType, payload),
		);

		await Promise.allSettled(deliveryPromises);
	} catch (err) {
		console.error(`Error delivering webhook event ${eventType}:`, err);
	}
}

/**
 * POST event data to a single webhook URL with retry logic.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
 */
async function deliverToUrl(
	subscriptionId: string,
	url: string,
	eventType: string,
	payload: Record<string, unknown>,
): Promise<void> {
	const maxRetries = 3;
	const baseDelayMs = 1000;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Tamga-Webhook/1.0",
				},
				body: JSON.stringify({
					event: eventType,
					created_at: new Date().toISOString(),
					data: payload,
				}),
				signal: AbortSignal.timeout(10000),
			});

			if (response.ok) {
				return;
			}

			console.error(
				`Webhook delivery failed (attempt ${attempt}/${maxRetries}): ` +
				`subscription ${subscriptionId}, url ${url}, status ${response.status}`,
			);
		} catch (err) {
			console.error(
				`Webhook delivery error (attempt ${attempt}/${maxRetries}): ` +
				`subscription ${subscriptionId}, url ${url}: ${err}`,
			);
		}

		if (attempt < maxRetries) {
			await new Promise((resolve) =>
				setTimeout(resolve, baseDelayMs * attempt)
			);
		}
	}
}

// ── Main Handler ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	const startTime = Date.now();
	let handlerName = "unknown";
	let keyId = "";

	try {
		const url = new URL(req.url);
		const pathname = url.pathname.replace(/^\/functions\/v1\/organizer-api/, "") || "/";

		// Match route
		const route = matchRoute(req.method, pathname);

		if (!route) {
			return errorResponse(
				`Not found: ${req.method} ${pathname}`,
				404,
			);
		}

		handlerName = route.handler;

		// Initialize Supabase client (service role)
		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
		}

		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Public routes (no auth required)
		if (route.handler === "getHorse") {
			return await handleGetHorse(req, supabase, route.params);
		}

		// Determine required scope for this route
		const requiredScope = getRequiredScope(req.method, pathname);

		// Authenticate request
		const authResult = await authenticateRequest(req, supabase, requiredScope);
		if (authResult.response) {
			return authResult.response;
		}

		keyId = authResult.auth.keyId;

		// Rate limiting (in-memory sliding window)
		const rateLimit = checkRateLimit(keyId, 60);
		if (!rateLimit.ok) {
			return new Response(
				JSON.stringify({
					error: "Rate limit exceeded",
					retry_after_seconds: rateLimit.retryAfterSeconds,
				}),
				{
					status: 429,
					headers: {
						...jsonHeaders,
						"Retry-After": String(rateLimit.retryAfterSeconds),
					},
				},
			);
		}

		// Dispatch to handler
		let response: Response;
		switch (route.handler) {
			case "createApiKey":
				response = await handleCreateApiKey(req, supabase);
				break;
			case "listApiKeys":
				response = await handleListApiKeys(req, supabase, authResult.auth);
				break;
			case "deactivateApiKey":
				response = await handleDeactivateApiKey(req, supabase, route.params);
				break;
			case "createWebhook":
				response = await handleCreateWebhook(req, supabase, authResult.auth);
				break;
			case "listWebhooks":
				response = await handleListWebhooks(req, supabase, authResult.auth);
				break;
			case "listRaces":
				response = await handleListRaces(req, supabase);
				break;
			case "createRace":
				response = await handleCreateRace(req, supabase, authResult.auth);
				break;
			case "listEntries":
				response = await handleListEntries(req, supabase, route.params);
				break;
			case "registerEntry":
				response = await handleRegisterEntry(req, supabase, route.params);
				break;
			case "submitResults":
				response = await handleSubmitResults(req, supabase, route.params);
				break;
			// v1/events handlers
			case "listEvents":
				response = await handleListEvents(req, supabase, authResult.auth);
				break;
			case "createEvent":
				response = await handleCreateEvent(req, supabase, authResult.auth);
				break;
			case "getEvent":
				response = await handleGetEvent(req, supabase, route.params);
				break;
			case "updateEvent":
				response = await handleUpdateEvent(req, supabase, route.params, authResult.auth);
				break;
			case "deleteEvent":
				response = await handleDeleteEvent(req, supabase, route.params, authResult.auth);
				break;
			case "listRegistrations":
				response = await handleListRegistrations(req, supabase, route.params);
				break;
			case "createRegistration":
				response = await handleCreateRegistration(req, supabase, route.params);
				break;
			case "cancelRegistration":
				response = await handleCancelRegistration(req, supabase, route.params);
				break;
			case "submitEventResults":
				response = await handleSubmitEventResults(req, supabase, route.params, authResult.auth);
				break;
			case "getUsageStats":
				response = await handleGetUsageStats(req, supabase, authResult.auth);
				break;
			default:
				response = errorResponse("Not found", 404);
				break;
		}

		// Log usage (non-blocking)
		const responseTimeMs = Date.now() - startTime;
		void logApiUsage(
			keyId,
			pathname,
			req.method,
			response.status,
			responseTimeMs,
			supabase,
		);

		return response;
	} catch (err) {
		console.error("Organizer API error:", err);
		const errorMessage =
			err instanceof Error ? err.message : "Internal server error";
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: jsonHeaders,
		});
	}
});
