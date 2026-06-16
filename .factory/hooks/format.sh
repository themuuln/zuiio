#!/bin/bash
# Auto-format code after edits using Biome

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

# Skip if no file path or file doesn't exist yet
if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Only format relevant file types
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md|*.mdx)
    echo "Formatting: $file_path"
    cd "$FACTORY_PROJECT_DIR"
    npm run format -- "$file_path" 2>&1 && echo "✓ Formatted $file_path"
    ;;
esac

exit 0
