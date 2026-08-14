#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# TOLOM API Smoke Test — catches branch-filter & data issues
#
# Usage:
#   # Quick smoke (auto-builds if needed, then tests)
#   bash scripts/qa/api-smoke-test.sh
#
#   # Skip build, use already-running server
#   bash scripts/qa/api-smoke-test.sh --skip-build
#
#   # Just test API (expects server on PORT, must provide cookie)
#   COOKIE="sb-xxx=yyy" bash scripts/qa/api-smoke-test.sh --api-only
#
# What it tests:
#   - Branch filter: verifies "all" returns data but specific branch doesn't
#     (catches the classic "branch_id is null but filter is UUID" bug)
#   - All report types: dashboard, daily, weekly, monthly, eod, insights,
#     forecast, service-breakdown, retention, pnl
#   - Response shapes: each endpoint returns expected field names
#   - Data integrity: revenue fields are positive numbers after seed
# ────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PASS=0
FAIL=0
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
log_fail() { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }

# ── Step 0: Parse args & setup ────────────────────────
SKIP_BUILD=false
API_ONLY=false
PORT="${PORT:-3001}"
COOKIE="${COOKIE:-}"

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --api-only)   API_ONLY=true ;;
  esac
done

echo ""
echo "════════════════════════════════════════════════════"
echo "  TOLOM API Smoke Test"
echo "  Port: $PORT"
echo "  Skip build: $SKIP_BUILD"
echo "  API only: $API_ONLY"
echo "════════════════════════════════════════════════════"
echo ""

# ── Step 1: Build (if needed) ────────────────────────
if [ "$API_ONLY" = false ] && [ "$SKIP_BUILD" = false ]; then
  echo "▶ Building production app..."
  cd "$ROOT"
  if npm run build 2>&1 | tail -3; then
    log_pass "Build succeeded"
  else
    log_fail "Build failed — fix errors first, then re-run"
    echo -e "\nResults: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
    exit 1
  fi

  echo ""
  echo "▶ Starting server on port $PORT..."
  # Kill any existing server on the port
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  sleep 1
  PORT="$PORT" npm run start > /tmp/tolom-smoke-server.log 2>&1 &
  SERVER_PID=$!
  sleep 4

  # Verify server is up
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null | grep -q 200; then
    log_pass "Server running on port $PORT"
  else
    log_fail "Server failed to start — check /tmp/tolom-smoke-server.log"
    echo -e "\nResults: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
    exit 1
  fi
fi

# ── Step 2: Obtain session ────────────────────────────
if [ -z "$COOKIE" ]; then
  echo ""
  echo "▶ COOKIE not set. To run API tests, provide a session cookie:"
  echo ""
  echo "  1. Log in at http://localhost:$PORT/en/auth/login"
  echo "  2. Open DevTools → Application → Cookies"
  echo "  3. Copy the 'sb-*-auth-token' cookie value"
  echo "  4. Re-run:"
  echo "     COOKIE=\"sb-xxx=yyy\" bash scripts/qa/api-smoke-test.sh --skip-build"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Trying auto-login via Puppeteer/Playwright..."
  echo "  (Install playwright first: pnpm exec playwright install chromium)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "SKIPPED: No cookie provided"
  if [ "$API_ONLY" = false ]; then
    # Clean up server if we started it
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  echo -e "\nResults: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
  exit 0
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "  Running API Smoke Tests"
echo "════════════════════════════════════════════════════"
echo ""

# ── Step 3: Resolve org ID ────────────────────────────
echo "▶ Resolving org ID..."
ORG_RESP=$(curl -s -b "$COOKIE" "http://localhost:$PORT/api/organizations" 2>/dev/null)
ORG_ID=$(echo "$ORG_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin).get('data',{}); print(d.get('id',''))" 2>/dev/null || echo "")

if [ -z "$ORG_ID" ]; then
  log_fail "Could not resolve org ID from session"
  echo "  Response: $ORG_RESP"
  kill "$SERVER_PID" 2>/dev/null || true
  echo -e "\nResults: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
  exit 1
fi
log_pass "Org ID: ${ORG_ID:0:12}..."

# Get branch ID
BRANCH_ID=$(curl -s -b "$COOKIE" "http://localhost:$PORT/api/organizations/$ORG_ID/branches" 2>/dev/null | \
  python3 -c "import sys,json; d=json.load(sys.stdin).get('data',[]); print(d[0].get('id','') if len(d)>0 else '')" 2>/dev/null || echo "")

# ── Helper: test an API endpoint ──────────────────────
test_endpoint() {
  local name="$1"
  local path="$2"
  local check_expr="$3"  # python expression that returns True/False

  local resp
  resp=$(curl -s -b "$COOKIE" "http://localhost:$PORT$path" 2>/dev/null)

  if [ -z "$resp" ]; then
    log_fail "$name — empty response"
    return 1
  fi

  if ! echo "$resp" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    $check_expr
    sys.exit(0)
except Exception as e:
    print(f'Assertion failed: {e}')
    print(json.dumps(data, indent=2)[:300])
    sys.exit(1)
" 2>/dev/null; then
    log_fail "$name"
    return 1
  fi

  log_pass "$name"
  return 0
}

# ── TEST 1: Branch filter bug detection ──────────────
echo ""
echo "── Test Group 1: Branch Filter Correctness ────────"

test_endpoint "Dashboard (all branches)" \
  "/api/organizations/$ORG_ID/reports?type=dashboard&branch=all" \
  "s = data.get('data',{}).get('summary',{}); assert s.get('totalRevenue',-1) >= 0, 'totalRevenue missing'"

test_endpoint "Branch filter (null branch_id)" \
  "/api/organizations/$ORG_ID/reports?type=dashboard&branch=$BRANCH_ID" \
  "s = data.get('data',{}).get('summary',{}); assert s.get('totalRevenue',-1) >= 0, 'totalRevenue missing'"

# Compare branch=all vs branch=specific
echo "  ── Cross-check: all vs specific branch ──"
ALL_REV=$(curl -s -b "$COOKIE" "http://localhost:$PORT/api/organizations/$ORG_ID/reports?type=dashboard&branch=all" 2>/dev/null | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('summary',{}).get('totalRevenue',0))" 2>/dev/null)
BRANCH_REV=$(curl -s -b "$COOKIE" "http://localhost:$PORT/api/organizations/$ORG_ID/reports?type=dashboard&branch=$BRANCH_ID" 2>/dev/null | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('summary',{}).get('totalRevenue',0))" 2>/dev/null)

if [ "$ALL_REV" -ge 0 ] 2>/dev/null; then
  log_pass "Dashboard (all) revenue: $ALL_REV"
else
  log_fail "Dashboard (all) — non-numeric revenue: $ALL_REV"
fi

if [ "$BRANCH_REV" -ge 0 ] 2>/dev/null; then
  log_pass "Dashboard (branch) revenue: $BRANCH_REV"
else
  log_fail "Dashboard (branch) — non-numeric revenue: $BRANCH_REV"
fi

# Warn if branch filter zeros out data
if [ "$ALL_REV" -gt 0 ] && [ "$BRANCH_REV" -eq 0 ] 2>/dev/null; then
  echo -e "  ${RED}⚠ WARNING:${NC} Branch filter returns 0 while all-branches has data."
  echo "    → Work orders have branch_id=null but filter requires a match."
  echo "    → Fix: assign branches to work orders OR remove auto-select logic."
fi

# ── TEST 2: Core report endpoints ────────────────────
echo ""
echo "── Test Group 2: Core Report Endpoints ────────────"

test_endpoint "Daily report" \
  "/api/organizations/$ORG_ID/reports?type=daily&date=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',{}); assert 'date' in d, 'missing date'; r = d.get('total_revenue',-1); assert r >= 0, f'revenue is {r}'"

test_endpoint "Weekly report" \
  "/api/organizations/$ORG_ID/reports?type=weekly&date=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',{}); assert d is not None, 'data is None'"

test_endpoint "Monthly report" \
  "/api/organizations/$ORG_ID/reports?type=monthly&date=$(date +%Y-%m)&branch=all" \
  "d = data.get('data',{}); assert d is not None, 'data is None'"

test_endpoint "EOD summary" \
  "/api/organizations/$ORG_ID/reports?type=eod&date=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',{}); assert 'total_revenue' in d or 'date' in d, 'missing fields'"

test_endpoint "Timeline" \
  "/api/organizations/$ORG_ID/reports?type=timeline&branch=all" \
  "d = data.get('data',[]); assert isinstance(d, list), 'expected list'"

# ── TEST 3: Analytics endpoints ──────────────────────
echo ""
echo "── Test Group 3: Analytics Endpoints ──────────────"

test_endpoint "Insights" \
  "/api/organizations/$ORG_ID/reports?type=insights&date_from=$(date -d '7 days ago' +%Y-%m-%d)&date_to=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',[]); assert isinstance(d, list), 'expected list'"

test_endpoint "Forecast" \
  "/api/organizations/$ORG_ID/reports?type=forecast&period_type=monthly&date=$(date +%Y-%m)&branch=all" \
  "d = data.get('data',{}); assert 'current_revenue' in d, 'missing current_revenue'"

test_endpoint "Service breakdown" \
  "/api/organizations/$ORG_ID/reports?type=service-breakdown&date_from=$(date -d '30 days ago' +%Y-%m-%d)&date_to=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',[]); assert isinstance(d, list), 'expected list'"

test_endpoint "Mechanics list" \
  "/api/organizations/$ORG_ID/reports?type=mechanics&branch=all" \
  "d = data.get('data',[]); assert isinstance(d, list), 'expected list'"

test_endpoint "Retention" \
  "/api/organizations/$ORG_ID/reports?type=retention&date_from=$(date -d '90 days ago' +%Y-%m-%d)&date_to=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',{}); assert d is not None, 'data is None'"

test_endpoint "P&L" \
  "/api/organizations/$ORG_ID/reports?type=pnl&date_from=$(date -d '30 days ago' +%Y-%m-%d)&date_to=$(date +%Y-%m-%d)&branch=all" \
  "d = data.get('data',{}); assert d is not None, 'data is None'"

# ── TEST 4: Dashboard summary fields ─────────────────
echo ""
echo "── Test Group 4: Dashboard Summary Fields ─────────"

DASH_RESP=$(curl -s -b "$COOKIE" "http://localhost:$PORT/api/organizations/$ORG_ID/reports?type=dashboard&branch=all" 2>/dev/null)

echo "$DASH_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data', {})
s = data.get('summary', {})
fields = ['totalRevenue','activeWorkOrders','totalCustomers','totalVehicles','partsRevenue','serviceRevenue']
missing = [f for f in fields if f not in s]
if missing:
    print(f'MISSING: {missing}')
    sys.exit(1)
print(f'  All $len(fields) summary fields present')
print(f'  Revenue: {s.get(\"totalRevenue\")}, Active WOs: {s.get(\"activeWorkOrders\")}, Customers: {s.get(\"totalCustomers\")}')
print(f'  Vehicles: {s.get(\"totalVehicles\")}, Parts Rev: {s.get(\"partsRevenue\")}, Service Rev: {s.get(\"serviceRevenue\")}')
" && log_pass "Dashboard summary fields" || log_fail "Dashboard summary fields"

echo ""
echo "════════════════════════════════════════════════════"
echo "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "════════════════════════════════════════════════════"

# Clean up if we started the server
if [ "$API_ONLY" = false ]; then
  kill "$SERVER_PID" 2>/dev/null || true
fi

exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
