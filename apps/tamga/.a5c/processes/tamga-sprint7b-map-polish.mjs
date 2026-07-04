/**
 * @process tamga-sprint7b-map-polish
 * @description Sprint 7b — Map polish: real-time subscriptions, offline tiles, nearby markers
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const PROJECT_ROOT = "/Users/themuuln/coding/personal/tamga";

// ── Phase P1: Real-time Subscriptions ──────────────────────────────

const p1Realtime = defineTask("realtime-subscriptions", (_args, _ctx) => ({
	kind: "orchestrator_task",
	title: "Real-time Supabase Subscriptions",
	description:
		"Add Supabase realtime subscriptions for live map marker updates in " +
		PROJECT_ROOT +
		".\n\n## What to implement\n\n1. Add stream methods to MapRepository (lib/src/features/map/data/map_repository.dart):\n   - Stream<List<LostHorseReport>> watchActiveLostHorses()\n   - Stream<List<HorseLocation>> watchNearbyHorses(double lat, double lng, double radiusKm)\n\n2. Implement in SupabaseMapRepository (lib/src/features/map/data/supabase_map_repository.dart):\n   - Use Supabase channel subscriptions: .channel('lost_horses').onPostgresChanges(...).subscribe()\n   - Add BehaviorSubject controllers for stream state\n   - Initial fetch alongside subscription to avoid empty first load\n   - Filter: PostgresChangeFilter on status='active' for lost_horse_reports\n   - Same pattern for horse_locations table\n\n3. Update providers (lib/src/features/map/application/lost_horse_providers.dart):\n   - Add activeLostHorsesStreamProvider = StreamProvider<List<LostHorseReport>>\n   - Keep FutureProvider for one-shot reads\n\n4. Update providers (lib/src/features/map/application/nearby_horses_provider.dart):\n   - Add nearbyHorsesStreamProvider = StreamProvider<List<HorseLocation>>\n\n5. Update MapScreen (lib/src/features/map/presentation/map_screen.dart):\n   - Switch from activeLostHorsesProvider to activeLostHorsesStreamProvider\n   - Switch from nearbyHorsesProvider to nearbyHorsesStreamProvider\n   - Use ref.listen() for live updates\n\n6. Dispose subscriptions: Add autoDispose or explicit channel unsubscribe in repository.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
	labels: ["sprint-7b", "map", "realtime"],
}));

const p1Verify = defineTask("p1-verify", (_args, _ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: Real-time subscriptions",
	description: "Run dart analyze to verify realtime subscription changes.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
}));

// ── Phase P2: Offline MBTiles ──────────────────────────────────────

const p2Offline = defineTask("offline-mbtiles", (_args, _ctx) => ({
	kind: "orchestrator_task",
	title: "Bundle Offline MBTiles",
	description:
		"Set up offline MBTiles for rural Mongolia in " +
		PROJECT_ROOT +
		".\n\n## What to implement\n\n1. Search for Protomaps Mongolia MBTiles on the web.\n2. Create assets/tiles/ directory and add placeholder note.\n3. Update OfflineTileManager (lib/src/features/map/data/offline_tile_manager.dart):\n   - Add Future<String> getStyleJson() method that returns MapLibre-compatible style JSON\n   - Style should use mbtiles:// protocol for local vector tiles\n   - Include background, earth, water, roads, buildings layers\n   - Fallback: if MBTiles not found, return OpenFreeMap style URL\n4. Update MapScreen (lib/src/features/map/presentation/map_screen.dart):\n   - Add offlineStyleProvider = FutureProvider<String> that resolves style from OfflineTileManager\n   - Use the resolved style string instead of hardcoded OpenFreeMap URL\n   - Show loading indicator while resolving\n5. Update pubspec.yaml: add assets/tiles/ to flutter assets section.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
	labels: ["sprint-7b", "map", "offline"],
}));

const p2Verify = defineTask("p2-verify", (_args, _ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: Offline MBTiles",
	description: "Run dart analyze to verify offline tile changes.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
}));

// ── Phase P3: Nearby Horses on Map ─────────────────────────────────

const p3Nearby = defineTask("nearby-markers", (_args, _ctx) => ({
	kind: "orchestrator_task",
	title: "Nearby Horses as Map Markers",
	description:
		"Show nearby horses as green markers on the map in " +
		PROJECT_ROOT +
		".\n\n## What to implement\n\n1. Add nearby horses to MapScreen (lib/src/features/map/presentation/map_screen.dart):\n   - Watch nearbyHorsesStreamProvider (or nearbyHorsesProvider)\n   - Add ref.listen() to trigger _updateNearbyMarkers() on data change\n\n2. Add _updateNearbyMarkers method:\n   - Add green circle markers (circleColor: '#2E8B57', circleRadius: 8)\n   - Each marker at horse.lastSeenLat, horse.lastSeenLng\n   - Pass horse data via addCircles(data:) parameter\n\n3. Add onCircleTapped handler to MapLibreMap:\n   - Check circle.data for type='nearby'\n   - Show SnackBar with horse name\n\n4. Fix clearCircles conflict:\n   - Currently _updateGeofenceCircles clears ALL circles\n   - Create _renderAllCircles() that collects lost horse + geofence + nearby circles\n   - Render all together in one addCircles call\n\n5. Update _refreshMarkers to include nearby horses\n\n6. Add nearby horses screen link from MapScreen.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
	labels: ["sprint-7b", "map", "nearby"],
}));

const p3Verify = defineTask("p3-verify", (_args, _ctx) => ({
	kind: "orchestrator_task",
	title: "Verify: All map markers",
	description:
		"Run dart analyze and flutter test to verify all map changes compile and tests pass.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
}));

// ── Final Approval ─────────────────────────────────────────────────

const finalApproval = defineTask("final-approval", (_args, _ctx) => ({
	kind: "approval",
	title: "Approve Sprint 7b: Map Polish",
	description: "All 3 phases complete. Approve to finish sprint 7b.",
	io: {
		inputJsonPath: "tasks/" + _ctx.effectId + "/input.json",
		outputJsonPath: "tasks/" + _ctx.effectId + "/result.json",
	},
}));

// ── Export ─────────────────────────────────────────────────────────

export default async function process(_inputs, ctx) {
	const artifacts = [];

	const allPhases = [
		{ phase: "P1", tasks: [p1Realtime, p1Verify] },
		{ phase: "P2", tasks: [p2Offline, p2Verify] },
		{ phase: "P3", tasks: [p3Nearby, p3Verify] },
		{ phase: "final", tasks: [finalApproval] },
	];

	for (const { phase, tasks } of allPhases) {
		for (const task of tasks) {
			const result = await ctx.task(
				task,
				{},
				{ label: phase + ":" + task.title },
			);
			artifacts.push({ phase, task: task.title, result });
		}

		if (phase !== "final") {
			const phaseResult = await ctx.breakpoint({
				question: `Phase ${phase} complete. Continue?`,
				expert: "owner",
				tags: [phase.toLowerCase()],
			});
			if (!phaseResult.approved) {
				return {
					ok: false,
					reason: `Phase ${phase} rejected`,
					phase,
					feedback: phaseResult.response,
				};
			}
		}
	}

	return {
		ok: true,
		phases: ["P1:realtime", "P2:offline-tiles", "P3:nearby-markers"],
		artifacts,
		summary:
			"Tamga Sprint 7b Map Polish complete (real-time subscriptions, offline tiles, nearby markers)",
	};
}
