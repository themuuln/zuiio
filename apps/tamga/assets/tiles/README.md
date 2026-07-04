# Offline Map Tiles — Mongolia

This directory contains offline map tile bundles for the Tamga app.

## Current Status

The app currently uses OpenFreeMap online tiles as a fallback. To enable full offline map support, you need to download and place a Protomaps MBTiles file here.

## Downloading Mongolia Tiles

### Option 1: Protomaps (Recommended)

1. Visit https://protomaps.com/downloads
2. Select **Mongolia** as the country
3. Choose zoom levels **0-12** (covers all of Mongolia, ~150MB)
4. Select **PMTiles** format (preferred by the app)
5. Download the file
6. Rename to `mongolia.pmtiles` and place in this directory

> **Note:** The app also supports MBTiles format. If using MBTiles, name it `mongolia.mbtiles`.

### Option 2: MapTiler / OpenMapTiles

1. Visit https://www.maptiler.com/data/
2. Download the Mongolia extract in MBTiles format
3. Ensure the tiles use the standard layer names: `earth`, `water`, `waterway`, `roads`, `buildings`, `landuse`
4. Rename to `mongolia.mbtiles` and place in this directory

## File Requirements

- **Format**: PMTiles (preferred) or MBTiles (SQLite-based vector tile container)
- **Naming**: `mongolia.pmtiles` (preferred) or `mongolia.mbtiles`
- **Size**: ~150MB (zoom 0-12) to ~500MB (zoom 0-14)
- **Layers**: Should include at minimum: `earth`, `water`, `waterway`, `roads`

## How It Works

1. On first launch, the `OfflineTileManager` copies `mongolia.pmtiles` (or `.mbtiles`) from `assets/tiles/` to the app's documents directory
2. The MapLibre GL map loads tiles from the local file using the `pmtiles://` (or `mbtiles://`) protocol
3. If no tile file is found, the app falls back to OpenFreeMap online tiles

## Testing Offline Mode

After placing the MBTiles file:

1. Run `flutter build ios --debug` or `flutter build apk --debug`
2. Launch the app with airplane mode enabled
3. The map should render using local tiles

## Troubleshooting

- **Map shows blank**: The tile file may not have the expected layer names. Check with [PMTiles CLI](https://github.com/protomaps/pmtiles) or [MBTiles viewer](https://github.com/mapbox/mbtiles-spec)
- **App crashes on launch**: The tile file may be corrupted. Re-download from a trusted source
- **Tiles are outdated**: Tiles are point-in-time snapshots. For live data, the app uses OpenFreeMap when online

## Adding Your Own Tiles

If you need custom tiles (e.g., with specific POI data):

1. Use [tilemaker](https://github.com/systemed/tilemaker) to generate MBTiles from OpenStreetMap data
2. Ensure the output uses the standard layer names expected by `OfflineTileManager`
3. Place the resulting `mongolia.mbtiles` in this directory
