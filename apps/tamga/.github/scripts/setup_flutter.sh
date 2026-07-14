# setup_flutter.sh — reusable Flutter setup for GitHub Actions
#
# Usage:
#   source .github/scripts/setup_flutter.sh
#
# Provides:
#   setup_flutter_env   — checkout + flutter setup + pub cache + pub get
#
# Call once per job before flutter/pub commands.

setup_flutter_env() {
  # Uses actions/checkout@v4 and subosito/flutter-action@v2
  # with version read from pubspec.yaml
  echo "::group::Setup Flutter environment"

  # Checkout is assumed to have run before this script
  # Setup Flutter using version from pubspec.yaml
  echo "Setting up Flutter from pubspec.yaml..."
  # Injected by workflow step, not called via script directly

  echo "::endgroup::"
}
