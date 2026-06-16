#!/bin/bash
# Run Biome lint on changed files and block on errors

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Skip if no file path or file doesn't exist
if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Only check relevant file types
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

cd "$FACTORY_PROJECT_DIR"

# Run Biome check and use its exit code directly
if ! npx biome check "$file_path" 2>&1; then
  echo "❌ Biome lint found issues in $file_path" >&2
  echo "Please fix the linting errors above before proceeding." >&2
  exit 2
fi

exit 0
