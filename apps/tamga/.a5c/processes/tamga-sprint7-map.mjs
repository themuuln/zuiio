/**
 * @process tamga-sprint7-map
 * @description Sprint 7 — Offline Map & Lost Horse Finder with geofence circles
 * @inputs { projectRoot: string }
 * @outputs { success: boolean, artifacts: string[] }
 *
 * Map stack: maplibre_gl + latlong2 + geolocator + mbtiles
 * Offline: vector tiles (PMTiles/MBTiles) bundled in assets
 * Features: lost horse reporting, geofence search areas, nearby horse discovery
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const ROOT = "/Users/themuuln/coding/personal/tamga";

// ── Phase P1: Domain Models ─────────────────────────────────────────

const p1Models = defineTask("map-domain-models", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Map Domain Models",
	description: `Create domain models for the map feature in ${ROOT}.

## Create these files:

### 1. lib/src/features/map/domain/map_enums.dart
Enums:
- HorseMarkerType: normal, lost, located
- GeofenceType: searchArea, customBoundary, alertZone
- MapLayer: standard, terrain
- AlertPriority: low, medium, urgent
- LostHorseStatus: active, found, cancelled

### 2. lib/src/features/map/domain/lost_horse_report.dart
Model: LostHorseReport
Fields: id, horseId, ownerId, horseName, description, lastSeenLat, lastSeenLng, lastSeenAt, searchRadiusKm (double, default 5.0), status (LostHorseStatus), photoUrl, createdAt, updatedAt
Methods: copyWith, toJson, fromJson, distanceTo(lat, lng) using latlong2

### 3. lib/src/features/map/domain/search_area.dart
Model: SearchArea
Fields: id, name, centerLat, centerLng, radiusKm (double), color (int), isActive, createdBy, createdAt
Methods: copyWith, toJson, fromJson, containsPoint(lat, lng) using latlong2 Distance

### 4. lib/src/features/map/domain/horse_location.dart
Model: HorseLocation
Fields: horseId, horseName, ownerId, ownerName, lat, lng, lastUpdated, isVisible (bool), coatColor (String?)
Methods: copyWith, toJson, fromJson

### 5. lib/src/features/map/domain/geofence_alert.dart
Model: GeofenceAlert
Fields: id, horseId, horseName, geofenceId, geofenceName, alertType (entered/exited), triggeredAt, horseLat, horseLng, acknowledged (bool)
Methods: copyWith, toJson, fromJson

## Rules:
- Pure Dart models, NO Flutter/Supabase/Riverpod imports
- Use latlong2 for distance calculations
- Include doc comments on all public classes
- Follow existing pattern from lib/src/features/market/domain/market_listing.dart`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "domain"],
}));

const p1Verify = defineTask("p1-analyze", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: dart analyze lib/src/features/map/domain/",
	description: `Run: cd ${ROOT} && dart analyze lib/src/features/map/domain/
Fix any errors found. Report results.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "analyze"],
}));

// ── Phase P2: Location & Geofence Services ──────────────────────────

const p2Services = defineTask("map-services", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Location Service & Geofence Service",
	description: `Create location and geofencing services in ${ROOT}.

### 1. lib/src/features/map/data/location_service.dart
Wrapper around geolocator package:
- getCurrentPosition() → Future<Position>
- getPositionStream() → Stream<Position>
- permission handling (request, check)
- distanceBetween(lat1, lng1, lat2, lng2) → double (meters)
- Uses Geolocator.distanceBetween() for offline distance calc

### 2. lib/src/features/map/data/geofence_service.dart
Pure Dart geofencing (NO network dependency):
- isInsideCircle(pointLat, pointLng, centerLat, centerLng, radiusKm) → bool
- distanceToEdge(pointLat, pointLng, centerLat, centerLng, radiusKm) → double (meters)
- findIntersections(areas: List<SearchArea>, point) → List<SearchArea>
- Uses latlong2 Distance class

### 3. lib/src/features/map/data/offline_tile_manager.dart
Manages bundled offline tiles:
- copyBundledTilesIfNeeded() → Future<void> (copies MBTiles from assets to documents dir)
- getTileDbPath() → String
- getStorageUsage() → Future<int> (bytes)
- isOfflineReady() → Future<bool>
- Note: MBTiles cannot be opened from assets directly, must copy to writable directory

## Rules:
- Import packages: geolocator, latlong2, path_provider, mbtiles
- LocationService uses Riverpod (AsyncNotifier pattern from existing providers)
- GeofenceService is pure Dart (no Riverpod dependency for testability)
- Include doc comments`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "services"],
}));

const p2Verify = defineTask("p2-analyze", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: dart analyze lib/src/features/map/data/",
	description: `Run: cd ${ROOT} && dart analyze lib/src/features/map/data/
Fix any errors. Report results.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "analyze"],
}));

// ── Phase P3: Supabase Schema & Repository ──────────────────────────

const p3Schema = defineTask("map-supabase", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Supabase Schema & Map Repository",
	description: `Create Supabase migration and repository layer in ${ROOT}.

### 1. supabase/migrations/010_map_features.sql
Tables:
- lost_horse_reports: id uuid PK, horse_id uuid FK, owner_id uuid FK, horse_name text, description text, last_seen_lat double, last_seen_lng double, last_seen_at timestamptz, search_radius_km double default 5, status text default 'active', photo_url text, created_at timestamptz, updated_at timestamptz
- search_areas: id uuid PK, name text, center_lat double, center_lng double, radius_km double, color int, is_active bool default true, created_by uuid FK, created_at timestamptz
- horse_locations: horse_id uuid PK FK, owner_id uuid FK, horse_name text, owner_name text, lat double, lng double, last_updated timestamptz, is_visible bool default false, coat_color text
- geofence_alerts: id uuid PK, horse_id uuid FK, horse_name text, geofence_id uuid, geofence_name text, alert_type text, triggered_at timestamptz, horse_lat double, horse_lng double, acknowledged bool default false

RLS policies:
- lost_horse_reports: owner can CRUD own, public can read active
- search_areas: owner can CRUD own
- horse_locations: owner can update own, public can read visible
- geofence_alerts: owner can read own alerts

### 2. lib/src/features/map/data/map_repository.dart
Abstract class with methods:
- reportLostHorse(report) → Future<Result<LostHorseReport>>
- updateLostHorseStatus(id, status) → Future<Result<void>>
- getActiveLostHorses() → Future<Result<List<LostHorseReport>>>
- getMyLostReports(ownerId) → Future<Result<List<LostHorseReport>>>
- saveSearchArea(area) → Future<Result<SearchArea>>
- getSearchAreas(userId) → Future<Result<List<SearchArea>>>
- updateHorseLocation(loc) → Future<Result<void>>
- getNearbyHorses(lat, lng, radiusKm) → Future<Result<List<HorseLocation>>>
- getGeofenceAlerts(userId) → Future<Result<List<GeofenceAlert>>>

### 3. lib/src/features/map/data/supabase_map_repository.dart
Implements MapRepository using Supabase client.
- Uses postgrest queries
- Spatial queries with simple lat/lng distance filtering (not PostGIS for MVP)
- Sorts by distance in Dart after fetching

### 4. lib/src/features/map/data/local_map_repository.dart
Isar-backed offline storage for reports, areas, locations.
- Implements same interface as MapRepository
- Queues writes to SyncQueue when offline
- Returns cached data when offline

## Rules:
- Use existing Result type from lib/src/core/error/result.dart
- Use existing AppException pattern
- Follow pattern from lib/src/features/market/data/`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "supabase"],
}));

const p3Verify = defineTask("p3-analyze", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: dart analyze + migration SQL",
	description: `Run: cd ${ROOT} && dart analyze lib/src/features/map/data/
Also validate migration SQL syntax.
Fix any errors. Report results.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "analyze"],
}));

// ── Phase P4: Riverpod Providers ────────────────────────────────────

const p4Providers = defineTask("map-providers", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Map Riverpod Providers",
	description: `Create Riverpod providers for map feature in ${ROOT}.

### 1. lib/src/features/map/application/map_providers.dart
Providers:
- currentPositionProvider (AsyncNotifier → Position)
- mapLayerProvider (StateProvider<MapLayer>)
- selectedMarkerProvider (StateProvider<String?>)
- isOfflineModeProvider (StateProvider<bool>)

### 2. lib/src/features/map/application/lost_horse_providers.dart
Providers:
- activeLostHorsesProvider (StreamProvider → List<LostHorseReport>)
- myLostReportsProvider (FutureProvider → List<LostHorseReport>)
- reportLostHorseProvider (FutureProvider.family → LostHorseReport)
- updateLostHorseStatusProvider (FutureProvider → void)

### 3. lib/src/features/map/application/nearby_horses_provider.dart
Providers:
- nearbyHorsesProvider(radiusKm) (FutureProvider.family → List<HorseLocation>)
- horseVisibilityProvider (StateProvider<bool>)
- updateVisibilityProvider (FutureProvider → void)

### 4. lib/src/features/map/application/geofence_providers.dart
Providers:
- activeGeofencesProvider (FutureProvider → List<SearchArea>)
- geofenceAlertsProvider (FutureProvider → List<GeofenceAlert>)
- createSearchAreaProvider (FutureProvider → SearchArea)
- checkGeofenceCrossing(lat, lng) (checks all active geofences, creates alerts)

## Rules:
- Follow existing provider patterns from lib/src/features/market/application/market_providers.dart
- Use AsyncNotifier/FutureNotifier where state needs mutation
- Invalidate related providers after mutations`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "providers"],
}));

const p4Verify = defineTask("p4-analyze", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: dart analyze lib/src/features/map/application/",
	description: `Run: cd ${ROOT} && dart analyze lib/src/features/map/application/
Fix any errors. Report results.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "analyze"],
}));

// ── Phase P5: Map UI ────────────────────────────────────────────────

const p5MapUi = defineTask("map-ui", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Map UI — Core Map Screen",
	description: `Build map screen and widgets in ${ROOT}.

### 1. lib/src/features/map/presentation/map_screen.dart
Full-screen MaplibreMap:
- Offline tile layer from bundled MBTiles
- Current location marker (blue dot)
- Floating controls: zoom +/-, my-location, layer toggle
- Bottom sheet for selected horse details
- Offline indicator banner when no connectivity
- Floating action button: "Хаяж морь оруулах" (Report lost horse)

### 2. lib/src/features/map/presentation/widgets/map_controls.dart
MapControls widget:
- Zoom in/out buttons
- My location button
- Layer switcher (standard/terrain)
- Offline status indicator

### 3. lib/src/features/map/presentation/widgets/horse_marker.dart
HorseMarker widget:
- Custom marker with horse icon
- Color-coded: green=normal, red=lost, blue=located
- Pulsing animation for lost horses
- Tap shows horse info bottom sheet

### 4. lib/src/features/map/presentation/widgets/offline_indicator.dart
OfflineIndicator:
- Shows "Оффлайн" banner when disconnected
- Shows cached tile status
- Dismissible

## Design tokens:
- Use TamgaColors, TamgaTypography, TamgaSpacing from lib/src/core/theme/design_tokens.dart
- No raw hex colors
- iOS-style flat surfaces, no elevation
- Mongolian UI text

## Packages:
- maplibre_gl for MaplibreMap
- latlong2 for coordinates
- geolocator for current position
- connectivity_plus for offline detection`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "ui"],
}));

const p5Verify = defineTask("p5-analyze", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: dart analyze lib/src/features/map/presentation/",
	description: `Run: cd ${ROOT} && dart analyze lib/src/features/map/presentation/
Fix any errors. Report results.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "analyze"],
}));

// ── Phase P6: Lost Horse Report Flow ────────────────────────────────

const p6LostHorse = defineTask("lost-horse-flow", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Lost Horse Report & Browse Flow",
	description: `Build lost horse reporting and browsing UI in ${ROOT}.

### 1. lib/src/features/map/presentation/report_lost_horse_screen.dart
Form screen:
- Horse selector (dropdown from user's horses)
- Last seen location: tap map OR use current GPS
- Description text field (min 10 chars)
- Search radius slider: 1-50 km (default 5km)
- Photo upload (optional, max 1)
- Preview: shows search circle on mini map
- Submit button → creates report + search area
- Works offline (queues for sync)

### 2. lib/src/features/map/presentation/lost_horse_detail_screen.dart
Detail screen:
- Horse name, photo, description
- Last seen time + relative display ("3 цагийн өмнө")
- Search radius circle on map
- "Холбогдох" (Contact owner) button
- Status buttons: "Олсон" (Found), "Цуцалсан" (Cancel)
- Share report button

### 3. lib/src/features/map/presentation/active_reports_screen.dart
List of active lost horse reports:
- Sorted by distance from user
- Each card: horse name, photo thumbnail, last seen, distance
- Pull to refresh
- Empty state: "Хаяж морь байхгүй байна"

### 4. lib/src/features/map/presentation/widgets/lost_horse_card.dart
LostHorseCard widget:
- Horse name (headline)
- Photo thumbnail (40dp)
- Last seen time (caption1)
- Distance from user (caption1, mutedForeground)
- Urgency indicator (red dot if <24h)

## Rules:
- Use existing widgets from lib/src/core/widgets/ (TamgaCard, TamgaBadge, etc.)
- All text in Mongolian
- Follow design.md component patterns
- Use design tokens for colors/spacing`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "lost-horse"],
}));

// ── Phase P7: Geofence & Nearby Horses ──────────────────────────────

const p7Geofence = defineTask("geofence-nearby", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Geofence Setup & Nearby Horses",
	description: `Build geofence and nearby horses UI in ${ROOT}.

### 1. lib/src/features/map/presentation/geofence_setup_screen.dart
Create custom geofence:
- Tap map to set center point
- Radius slider: 1-50km
- Name input (required)
- Alert type: entered / exited / both
- Color picker (preset colors)
- Preview circle on map
- Save → creates SearchArea

### 2. lib/src/features/map/presentation/nearby_horses_screen.dart
Nearby horses discovery:
- Radius selector: 5/10/25/50km
- Grid view of horses with:
  - Horse name
  - Owner name
  - Distance
  - Coat color indicator
- Requires other owners to have visibility enabled
- Empty state: "Ойрхон морь байхгүй байна"

### 3. lib/src/features/map/presentation/geofence_alerts_screen.dart
Alert history:
- List of past alerts
- Each: horse name, geofence name, entered/exited icon, timestamp
- Swipe to acknowledge
- Filter: all / unacknowledged
- Badge count for unacknowledged

### 4. lib/src/features/map/presentation/widgets/geofence_alert_banner.dart
Persistent banner:
- Shows when geofence crossing detected
- Horse name + alert type
- "Үзэх" (View) action
- Auto-dismiss after 10s or manual dismiss
- Stacks if multiple alerts

## Rules:
- Use existing widgets from lib/src/core/widgets/
- All text in Mongolian
- Follow design.md patterns
- Use design tokens`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "geofence"],
}));

// ── Phase P8: Navigation Integration ────────────────────────────────

const p8Nav = defineTask("map-navigation", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Navigation & Shell Integration",
	description: `Integrate map feature into app navigation in ${ROOT}.

### 1. Update lib/src/features/shell/presentation/app_shell.dart
- Add Map tab to bottom navigation (between Health and Market)
- Icon: Icons.map_outlined / Icons.map
- Badge: red dot when active lost horse reports exist
- Tab index: adjust existing tabs

### 2. Update router (find the GoRouter config file)
Add routes:
- /map → MapScreen
- /map/report-lost → ReportLostHorseScreen
- /map/lost/:id → LostHorseDetailScreen
- /map/active-reports → ActiveReportsScreen
- /map/geofence-setup → GeofenceSetupScreen
- /map/nearby → NearbyHorsesScreen
- /map/alerts → GeofenceAlertsScreen

### 3. Update lib/src/features/shell/presentation/quick_actions.dart
Add quick action:
- "Хаяж морь" (Lost horse) with urgent styling
- "Ойрхон морь" (Nearby horses)

## Rules:
- Preserve all existing routes and tabs
- Map tab icon should match design.md iconography
- Follow existing router pattern`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "navigation"],
}));

// ── Phase P9: Tests ─────────────────────────────────────────────────

const p9Tests = defineTask("map-tests", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Map Feature Tests",
	description: `Write tests for map feature in ${ROOT}.

### 1. test/features/map/domain/map_models_test.dart
Tests for all domain models:
- LostHorseReport: toJson/fromJson roundtrip, copyWith, distanceTo
- SearchArea: toJson/fromJson roundtrip, containsPoint (inside, edge, outside)
- HorseLocation: toJson/fromJson roundtrip
- GeofenceAlert: toJson/fromJson roundtrip
- All enum values covered

### 2. test/features/map/data/geofence_service_test.dart
Tests for geofence calculations:
- isInsideCircle: center point, edge point, outside point, far outside
- distanceToEdge: known distances
- findIntersections: overlapping geofences
- Large radius (50km) accuracy
- Zero radius edge case
- Negative coordinates (southern hemisphere test)

### 3. test/features/map/data/location_service_test.dart
Tests for location service:
- Permission denied handling
- Position stream mock
- distanceBetween accuracy

## Rules:
- Use test framework from existing test files
- Mock external dependencies
- Aim for 90%+ coverage on domain and geofence service`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-7", "map", "tests"],
}));

const p9Verify = defineTask("p9-test-run", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Run Tests: flutter test test/features/map/",
	description: `Run: cd ${ROOT} && flutter test test/features/map/
Fix any failing tests. Report results.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "tests"],
}));

// ── Process Export ───────────────────────────────────────────────────

export async function process(inputs, ctx) {
	const artifacts = [];

	// ── P1: Domain Models ────────────────────────────────────────
	console.log("▸ P1: Domain Models");
	const p1 = await ctx.task(p1Models, {}, { label: "p1:models" });
	if (!p1.ok) return { ok: false, reason: "P1 models failed", phase: "models" };
	artifacts.push("map/domain models");

	const p1v = await ctx.task(p1Verify, {}, { label: "p1:verify" });
	if (!p1v.ok) {
		const fix = await ctx.task(
			defineTask("p1-fix", () => ({
				kind: "orchestrator_task",
				title: "Fix P1 errors",
				description: `Fix dart analyze errors in lib/src/features/map/domain/. Run dart analyze again until clean.`,
				io: {
					inputJsonPath: `tasks/${ctx.effectId}/input.json`,
					outputJsonPath: `tasks/${ctx.effectId}/result.json`,
				},
			})),
			{},
			{ label: "p1:fix" },
		);
		if (!fix.ok)
			return { ok: false, reason: "P1 verify failed", phase: "models" };
	}

	// ── P2: Services ─────────────────────────────────────────────
	console.log("▸ P2: Location & Geofence Services");
	const p2 = await ctx.task(p2Services, {}, { label: "p2:services" });
	if (!p2.ok)
		return { ok: false, reason: "P2 services failed", phase: "services" };
	artifacts.push("map/services");

	const p2v = await ctx.task(p2Verify, {}, { label: "p2:verify" });
	if (!p2v.ok) {
		const fix = await ctx.task(
			defineTask("p2-fix", () => ({
				kind: "orchestrator_task",
				title: "Fix P2 errors",
				description: `Fix dart analyze errors in lib/src/features/map/data/. Run dart analyze again until clean.`,
				io: {
					inputJsonPath: `tasks/${ctx.effectId}/input.json`,
					outputJsonPath: `tasks/${ctx.effectId}/result.json`,
				},
			})),
			{},
			{ label: "p2:fix" },
		);
		if (!fix.ok)
			return { ok: false, reason: "P2 verify failed", phase: "services" };
	}

	// ── P3: Supabase Schema & Repository ─────────────────────────
	console.log("▸ P3: Supabase Schema & Repository");
	const p3 = await ctx.task(p3Schema, {}, { label: "p3:supabase" });
	if (!p3.ok)
		return { ok: false, reason: "P3 schema failed", phase: "supabase" };
	artifacts.push("map/supabase schema + repository");

	const p3v = await ctx.task(p3Verify, {}, { label: "p3:verify" });
	if (!p3v.ok) {
		const fix = await ctx.task(
			defineTask("p3-fix", () => ({
				kind: "orchestrator_task",
				title: "Fix P3 errors",
				description: `Fix dart analyze errors in lib/src/features/map/data/. Run dart analyze again until clean.`,
				io: {
					inputJsonPath: `tasks/${ctx.effectId}/input.json`,
					outputJsonPath: `tasks/${ctx.effectId}/result.json`,
				},
			})),
			{},
			{ label: "p3:fix" },
		);
		if (!fix.ok)
			return { ok: false, reason: "P3 verify failed", phase: "supabase" };
	}

	// ── P4: Providers ────────────────────────────────────────────
	console.log("▸ P4: Riverpod Providers");
	const p4 = await ctx.task(p4Providers, {}, { label: "p4:providers" });
	if (!p4.ok)
		return { ok: false, reason: "P4 providers failed", phase: "providers" };
	artifacts.push("map/providers");

	const p4v = await ctx.task(p4Verify, {}, { label: "p4:verify" });
	if (!p4v.ok) {
		const fix = await ctx.task(
			defineTask("p4-fix", () => ({
				kind: "orchestrator_task",
				title: "Fix P4 errors",
				description: `Fix dart analyze errors in lib/src/features/map/application/. Run dart analyze again until clean.`,
				io: {
					inputJsonPath: `tasks/${ctx.effectId}/input.json`,
					outputJsonPath: `tasks/${ctx.effectId}/result.json`,
				},
			})),
			{},
			{ label: "p4:fix" },
		);
		if (!fix.ok)
			return { ok: false, reason: "P4 verify failed", phase: "providers" };
	}

	// ── P5: Map UI ───────────────────────────────────────────────
	console.log("▸ P5: Map UI — Core Screen");
	const p5 = await ctx.task(p5MapUi, {}, { label: "p5:map-ui" });
	if (!p5.ok) return { ok: false, reason: "P5 map UI failed", phase: "map-ui" };
	artifacts.push("map/core UI");

	const p5v = await ctx.task(p5Verify, {}, { label: "p5:verify" });
	if (!p5v.ok) {
		const fix = await ctx.task(
			defineTask("p5-fix", () => ({
				kind: "orchestrator_task",
				title: "Fix P5 errors",
				description: `Fix dart analyze errors in lib/src/features/map/presentation/. Run dart analyze again until clean.`,
				io: {
					inputJsonPath: `tasks/${ctx.effectId}/input.json`,
					outputJsonPath: `tasks/${ctx.effectId}/result.json`,
				},
			})),
			{},
			{ label: "p5:fix" },
		);
		if (!fix.ok)
			return { ok: false, reason: "P5 verify failed", phase: "map-ui" };
	}

	// ── P6: Lost Horse Flow ──────────────────────────────────────
	console.log("▸ P6: Lost Horse Report & Browse");
	const p6 = await ctx.task(p6LostHorse, {}, { label: "p6:lost-horse" });
	if (!p6.ok)
		return { ok: false, reason: "P6 lost horse failed", phase: "lost-horse" };
	artifacts.push("map/lost horse flow");

	// ── P7: Geofence & Nearby ────────────────────────────────────
	console.log("▸ P7: Geofence & Nearby Horses");
	const p7 = await ctx.task(p7Geofence, {}, { label: "p7:geofence" });
	if (!p7.ok)
		return { ok: false, reason: "P7 geofence failed", phase: "geofence" };
	artifacts.push("map/geofence + nearby");

	// ── P8: Navigation ───────────────────────────────────────────
	console.log("▸ P8: Navigation Integration");
	const p8 = await ctx.task(p8Nav, {}, { label: "p8:nav" });
	if (!p8.ok)
		return { ok: false, reason: "P8 navigation failed", phase: "navigation" };
	artifacts.push("map/navigation");

	// ── P9: Tests ────────────────────────────────────────────────
	console.log("▸ P9: Tests");
	const p9 = await ctx.task(p9Tests, {}, { label: "p9:tests" });
	if (!p9.ok) return { ok: false, reason: "P9 tests failed", phase: "tests" };
	artifacts.push("map/tests");

	const p9v = await ctx.task(p9Verify, {}, { label: "p9:verify" });
	if (!p9v.ok) {
		const fix = await ctx.task(
			defineTask("p9-fix", () => ({
				kind: "orchestrator_task",
				title: "Fix P9 test failures",
				description: `Fix failing tests in test/features/map/. Run flutter test again until all pass.`,
				io: {
					inputJsonPath: `tasks/${ctx.effectId}/input.json`,
					outputJsonPath: `tasks/${ctx.effectId}/result.json`,
				},
			})),
			{},
			{ label: "p9:fix" },
		);
		if (!fix.ok)
			return { ok: false, reason: "P9 tests failed", phase: "tests" };
	}

	// ── Final Build Verification ─────────────────────────────────
	console.log("▸ Final: flutter analyze");
	const finalCheck = await ctx.task(
		defineTask("final-analyze", () => ({
			kind: "orchestrator_task",
			title: "Final flutter analyze",
			description: `Run: cd ${ROOT} && flutter analyze --no-pub
Report: total errors (should be 0 new), total warnings (pre-existing Isar warnings OK).`,
			io: {
				inputJsonPath: `tasks/${ctx.effectId}/input.json`,
				outputJsonPath: `tasks/${ctx.effectId}/result.json`,
			},
		})),
		{},
		{ label: "final:analyze" },
	);

	// ── Final Approval ──────────────────────────────────────────
	const approval = await ctx.breakpoint({
		question: `Sprint 7 Map & Lost Horse Finder complete. All 9 phases done: domain models, services, supabase, providers, map UI, lost horse flow, geofence/nearby, navigation, tests. Final approval?`,
		expert: "owner",
		tags: ["final-gate"],
	});
	if (!approval.approved) {
		return {
			ok: false,
			reason: "Final approval rejected",
			phase: "final",
			feedback: approval.response,
		};
	}

	return {
		ok: true,
		phases: [
			"P1:domain-models",
			"P2:services",
			"P3:supabase",
			"P4:providers",
			"P5:map-ui",
			"P6:lost-horse",
			"P7:geofence-nearby",
			"P8:navigation",
			"P9:tests",
		],
		artifacts,
		summary:
			"Tamga Sprint 7 Map & Lost Horse Finder complete — offline map with geofence circles, lost horse reporting, nearby horse discovery",
	};
}
