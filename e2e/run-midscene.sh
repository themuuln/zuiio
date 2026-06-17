#!/bin/bash
# Run Midscene AI tests using your Factory settings MiMo V2.5 model
set -euo pipefail

cd "$(dirname "$0")/.."

# Read model config from Factory settings
eval "$(node -e "
const s = require(process.env.HOME + '/.factory/settings.json');
const m = s.customModels.find(m => m.model === 'mimo-v2.5');
if (!m) { console.error('mimo-v2.5 model not found in settings'); process.exit(1); }
console.log('export MIDSCENE_MODEL_BASE_URL=' + m.baseUrl);
console.log('export MIDSCENE_MODEL_API_KEY=' + m.apiKey);
console.log('export MIDSCENE_MODEL_NAME=' + m.model);
console.log('export MIDSCENE_MODEL_FAMILY=openai');
")"

pnpm exec playwright test "$@"
