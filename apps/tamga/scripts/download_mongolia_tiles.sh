#!/bin/bash
# Download Mongolia offline map tiles for Tamga
#
# This script downloads Protomaps basemap tiles for Mongolia
# and places them in the app's assets directory.
#
# Prerequisites:
#   - pmtiles CLI (install from: https://github.com/protomaps/go-pmtiles/releases)
#   - Internet connection
#
# Usage:
#   ./scripts/download_mongolia_tiles.sh [--maxzoom N]
#
# Options:
#   --maxzoom N    Maximum zoom level (default: 12)
#                  Higher zoom = larger file size
#                  Recommended: 10-12 for offline use

set -e

# Default values
MAXZOOM=12
ASSETS_DIR="assets/tiles"
OUTPUT_FILE="mongolia.pmtiles"
TEMP_DIR="/tmp/tamga_tiles"

# Mongolia bounding box (approximate)
# Format: MIN_LON,MIN_LAT,MAX_LON,MAX_LAT
BBOX="87,41,120,52"

# Protomaps basemap URL (primary + fallbacks)
BASEMAP_URLS=(
	"https://r2-public.protomaps.com/protomaps-basemaps/protomaps-basemap-v4-0-0.pmtiles"
	"https://r2-public.protomaps.com/protomaps-basemaps/protomaps-basemap-v3-1-0.pmtiles"
	"https://protomaps.github.io/basemaps/protomaps-basemap-v4-0-0.pmtiles"
)

# Find working URL
BASEMAP_URL=""
for url in "${BASEMAP_URLS[@]}"; do
	status=$(curl -s -o /dev/null -w "%{http_code}" -r 0-1024 "$url" 2>/dev/null)
	if [ "$status" = "200" ] || [ "$status" = "206" ]; then
		BASEMAP_URL="$url"
		echo "Using: $url"
		break
	fi
done

if [ -z "$BASEMAP_URL" ]; then
	echo "⚠️  Protomaps CDN not available. Using online-only mode."
	echo "   The app will use OpenFreeMap tiles when online."
	echo "   For offline support, download tiles manually:"
	echo "   https://github.com/protomaps/go-pmtiles/releases"
	exit 0
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
	case $1 in
	--maxzoom)
		MAXZOOM="$2"
		shift 2
		;;
	*)
		echo "Unknown option: $1"
		exit 1
		;;
	esac
done

echo "🐴 Tamga Map Tiles Downloader"
echo "=============================="
echo ""
echo "Configuration:"
echo "  Max zoom: $MAXZOOM"
echo "  Bounding box: $BBOX"
echo "  Output: $ASSETS_DIR/$OUTPUT_FILE"
echo ""

# Check if pmtiles CLI is installed
PMTILES_BIN=""
if command -v pmtiles &>/dev/null; then
	PMTILES_BIN=pmtiles
elif [ -x "/tmp/pmtiles" ]; then
	PMTILES_BIN=/tmp/pmtiles
elif [ -x "$HOME/.local/bin/pmtiles" ]; then
	PMTILES_BIN="$HOME/.local/bin/pmtiles"
elif [ -x "$HOME/pmtiles" ]; then
	PMTILES_BIN="$HOME/pmtiles"
fi

if [ -z "$PMTILES_BIN" ]; then
	echo "❌ pmtiles CLI not found!"
	echo ""
	echo "Install it from: https://github.com/protomaps/go-pmtiles/releases"
	echo "Or run:"
	echo "  brew install pmtiles"
	echo ""
	exit 1
fi

# Create directories
mkdir -p "$ASSETS_DIR"
mkdir -p "$TEMP_DIR"

echo "📦 Downloading Mongolia tiles..."
echo "   This may take a few minutes depending on your internet speed."
echo ""

# Download and extract Mongolia region
"$PMTILES_BIN" extract "$BASEMAP_URL" "$TEMP_DIR/$OUTPUT_FILE" \
	--bbox="$BBOX" \
	--maxzoom="$MAXZOOM" \
	--download-threads=4 \
	--overfetch=0.1

# Check if download succeeded
if [ ! -f "$TEMP_DIR/$OUTPUT_FILE" ]; then
	echo "❌ Download failed!"
	exit 1
fi

# Get file size
FILESIZE=$(du -h "$TEMP_DIR/$OUTPUT_FILE" | cut -f1)
echo ""
echo "✅ Download complete!"
echo "   File size: $FILESIZE"

# Copy to assets
cp "$TEMP_DIR/$OUTPUT_FILE" "$ASSETS_DIR/$OUTPUT_FILE"

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Installed to $ASSETS_DIR/$OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Run: flutter pub get"
echo "  2. Run: flutter run"
echo "  3. The map will automatically use offline tiles when available"
echo ""
echo "Note: The tiles file will be bundled with your app."
echo "      For a smaller file, use --maxzoom=10 (~150MB)"
echo "      For better detail, use --maxzoom=14 (~2GB)"
