#!/bin/bash
# Download Mongolia offline map tiles from Protomaps
# Usage: ./scripts/download-tiles.sh
#
# This script opens the Protomaps downloads page where you can
# select Mongolia and download the PMTiles file.
#
# Alternatively, download manually:
# 1. Visit https://protomaps.com/downloads
# 2. Select Mongolia, zoom 0-12, PMTiles format
# 3. Save as assets/tiles/mongolia.pmtiles

set -euo pipefail

TILES_DIR="$(dirname "$0")/../assets/tiles"
PMTILES_FILE="$TILES_DIR/mongolia.pmtiles"
MBTILES_FILE="$TILES_DIR/mongolia.mbtiles"

if [ -f "$PMTILES_FILE" ] || [ -f "$MBTILES_FILE" ]; then
	if [ -f "$PMTILES_FILE" ]; then
		echo "✅ mongolia.pmtiles already exists ($(du -h "$PMTILES_FILE" | cut -f1))"
	fi
	if [ -f "$MBTILES_FILE" ]; then
		echo "✅ mongolia.mbtiles already exists ($(du -h "$MBTILES_FILE" | cut -f1))"
	fi
	echo "   Delete the file first if you want to re-download."
	exit 0
fi

echo "📥 Mongolia offline map tiles not found."
echo ""
echo "To download:"
echo "  1. Visit https://protomaps.com/downloads"
echo "  2. Select Mongolia as the country"
echo "  3. Choose zoom levels 0-12 (~150MB)"
echo "  4. Select PMTiles format"
echo "  5. Save as: $PMTILES_FILE"
echo ""
echo "After downloading, run 'flutter build' to bundle with the app."
echo ""

# Try to open the downloads page
if command -v open &>/dev/null; then
	open "https://protomaps.com/downloads"
elif command -v xdg-open &>/dev/null; then
	xdg-open "https://protomaps.com/downloads"
else
	echo "Please open https://protomaps.com/downloads in your browser."
fi
