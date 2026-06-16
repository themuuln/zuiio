#!/bin/bash
# Enforce project-specific coding rules

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')
content=$(echo "$input" | jq -r '.tool_input.content // ""')

# Skip if no file path
if [ -z "$file_path" ]; then
  exit 0
fi

# If content is empty or "null", read the file directly
if [ "$content" = "null" ] || [ -z "$content" ]; then
  if [ -f "$file_path" ]; then
    content=$(cat "$file_path")
  else
    exit 0
  fi
fi

# Rule 1: API routes must use api-handler.ts wrapper (not raw NextResponse)
if echo "$file_path" | grep -qE '^src/app/api/'; then
  if echo "$content" | grep -qE 'NextResponse\.(json|redirect|error)'; then
    echo "❌ API routes must use the api-handler.ts wrapper, not raw NextResponse" >&2
    echo "Import and use the apiHandler from @/lib/api-handler instead." >&2
    exit 2
  fi
fi

# Rule 2: Service functions must accept db as first param
if echo "$file_path" | grep -qE '^src/lib/services/[^_].*\.ts$'; then
  if echo "$content" | grep -qE 'export (async )?function' && \
     ! echo "$content" | head -30 | grep -qE '^export (async )?function \w+\(db'; then
    echo "⚠️ Service functions should accept 'db: SupabaseClient' as first parameter" >&2
    echo "Pattern: export async function myFunc(db: SupabaseClient, ...) { ... }" >&2
    # Warning only, don't block
  fi
fi

# Rule 3: Every database query must have organization_id filter
if echo "$file_path" | grep -qE '^src/lib/services/.*\.ts$'; then
  if echo "$content" | grep -qE "\.(from|table)\(" && \
     ! echo "$content" | grep -qE "\.eq\('organization_id'"; then
    echo "⚠️ Service query may be missing organization_id RLS scope" >&2
    echo "Every query should include: .eq('organization_id', orgId)" >&2
  fi
fi

# Rule 4: No direct imports from @/lib/database.types
if echo "$content" | grep -qE "from ['\"]@/lib/database\.types['\"]"; then
  echo "❌ Import from @/lib/types instead of @/lib/database.types" >&2
  echo "database.types.ts is auto-generated and may not export the type." >&2
  exit 2
fi

# Rule 5: No select('*') in production code
if echo "$file_path" | grep -qE '^src/lib/services/.*\.ts$'; then
  if echo "$content" | grep -qE "\.select\('\*'\)"; then
    echo "⚠️ Avoid select('*') in service code — be explicit about columns" >&2
    echo "Use: .select('id, name, organization_id, ...')" >&2
  fi
fi

exit 0
