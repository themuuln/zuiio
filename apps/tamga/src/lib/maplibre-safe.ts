import { isRunningInExpoGo } from "expo";

// ── Safe MapLibre wrapper ─────────────────────────────────
// MapLibre requires native camera/location modules unavailable in Expo Go.
// Use require() + try/catch so the crash is contained here instead of
// propagating to every screen that imports map components.

const isExpoGo = isRunningInExpoGo();

interface SafeMapLibre {
  Map: React.ComponentType<Record<string, unknown>> | null;
  Camera: React.ComponentType<Record<string, unknown>> | null;
  Marker: React.ComponentType<Record<string, unknown>> | null;
  UserLocation: React.ComponentType<Record<string, unknown>> | null;
}

let maplibre: SafeMapLibre = {
  Map: null,
  Camera: null,
  Marker: null,
  UserLocation: null,
};

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@maplibre/maplibre-react-native");
    maplibre = {
      Map: mod.Map ?? null,
      Camera: mod.Camera ?? null,
      Marker: mod.Marker ?? null,
      UserLocation: mod.UserLocation ?? null,
    };
  } catch {
    console.warn("MapLibre native modules unavailable — map features disabled.");
  }
}

// Fallback: no-op component that renders nothing (never used — guarded by isMapAvailable)
const _noop: React.ComponentType<Record<string, unknown>> = () => null;

export const Map = maplibre.Map ?? _noop;
export const Camera = maplibre.Camera ?? _noop;
export const Marker = maplibre.Marker ?? _noop;
export const UserLocation = maplibre.UserLocation ?? _noop;

/** True when MapLibre native modules are available. */
export const isMapAvailable = !isExpoGo && maplibre.Map !== null;
