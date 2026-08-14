#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# TOLOM Pre-commit Validation — fast checks before pushing
#
# Run:   bash scripts/qa/pre-commit.sh
# Skips: full build (types + lint only), unit tests, no API smoke
#
# Exit codes: 0 = clean, 1 = warnings, 2 = errors
# ────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ERRORS=0
WARNINGS=0

echo ""
echo "════════════════════════════════════════════════════"
echo "  TOLOM Pre-commit Validation"
echo "  $(date -Iseconds)"
echo "════════════════════════════════════════════════════"
echo ""

# ── 1. TypeScript check ──────────────────────────────
echo "▶ TypeScript check..."
if npm run validate:types 2>&1 | tail -3; then
	echo -e "  ${GREEN}✓${NC} TypeScript clean"
else
	echo -e "  ${RED}✗${NC} TypeScript errors"
	((ERRORS++))
fi
echo ""

# ── 2. Lint ──────────────────────────────────────────
echo "▶ Lint check..."
if npm run validate:lint 2>&1 | tail -3; then
	echo -e "  ${GREEN}✓${NC} Lint clean"
else
	echo -e "  ${RED}✗${NC} Lint errors"
	((ERRORS++))
fi
echo ""

# ── 3. Unit tests (failures tolerated with warning) ──
echo "▶ Unit tests..."
TEST_OUTPUT=$(npm run test 2>&1 || true)
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+ passed' | head -1 | grep -oP '\d+' || echo "0")
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oP '\d+ failed' | head -1 | grep -oP '\d+' || echo "0")

if [ "$FAIL_COUNT" -gt 0 ] 2>/dev/null; then
	echo -e "  ${YELLOW}⚠${NC} $PASS_COUNT passed, $FAIL_COUNT failed"

	# Check which files failed
	FAILED_FILES=$(echo "$TEST_OUTPUT" | grep "FAIL " | head -5)
	echo "  Failing files:"
	echo "$FAILED_FILES" | while IFS= read -r line; do
		echo "    • $line"
	done

	# Check if failures are pre-existing (SearchInput, etc.)
	if echo "$FAILED_FILES" | grep -q "search-input"; then
		echo -e "  ${YELLOW}ℹ${NC} SearchInput failures are pre-existing (missing next-intl provider in test env)"
		((WARNINGS++))
	else
		echo -e "  ${RED}ℹ${NC} Some test failures may be new — investigate before pushing"
		((ERRORS++))
	fi
else
	echo -e "  ${GREEN}✓${NC} All tests passed"
fi
echo ""

# ── 4. Changed files scan (common oversights) ────────
echo "▶ Changed file scan..."
STAGED=$(git diff --cached --name-only 2>/dev/null || echo "")
CHANGED=$(git diff --name-only 2>/dev/null || echo "")
ALL_CHANGES=$(echo -e "$STAGED\n$CHANGED" | sort -u | grep -v '^$' || true)

if [ -n "$ALL_CHANGES" ]; then
	# Check for i18n changes without both locale files
	MN_CHANGES=$(echo "$ALL_CHANGES" | grep "messages/mn.json" || true)
	EN_CHANGES=$(echo "$ALL_CHANGES" | grep "messages/en.json" || true)
	if [ -n "$MN_CHANGES" ] && [ -z "$EN_CHANGES" ]; then
		echo -e "  ${YELLOW}⚠${NC} mn.json changed but en.json did not — update both locale files"
		((WARNINGS++))
	fi
	if [ -z "$MN_CHANGES" ] && [ -n "$EN_CHANGES" ]; then
		echo -e "  ${YELLOW}⚠${NC} en.json changed but mn.json did not — update both locale files"
		((WARNINGS++))
	fi

	# Check for changes to translation key usage
	if echo "$ALL_CHANGES" | grep -q "\.tsx\|\.ts"; then
		NEW_I18N_KEYS=$(git diff --unified=0 -- "*.tsx" "*.ts" 2>/dev/null | grep 't("' | grep -v 't("common\.\|t("reports\.\|t("workOrders\.\|t("dashboard\.\|t("customers\.\|t("vehicles\.' | head -5 || true)
		if [ -n "$NEW_I18N_KEYS" ]; then
			echo -e "  ${YELLOW}ℹ${NC} New translation keys detected — verify they exist in both locale files"
			((WARNINGS++))
		fi
	fi

	# Validate translation file parity and content
	if echo "$ALL_CHANGES" | grep -q "messages/.*\.json"; then
		echo "▶ i18n: checking translation files..."
		if node scripts/i18n/check-messages.mjs 2>&1 | tail -1 | grep -q "❌"; then
			echo -e "  ${RED}✗${NC} Translation file validation failed"
			((ERRORS++))
		else
			echo -e "  ${GREEN}✓${NC} Translation files OK"
		fi
	fi

	# Check for new hardcoded strings in TSX files
	TSX_CHANGES=$(echo "$ALL_CHANGES" | grep "\.tsx$" || true)
	if [ -n "$TSX_CHANGES" ]; then
		echo "▶ i18n: checking for new hardcoded strings..."
		if node scripts/i18n/check-hardcoded-strings.mjs --check 2>&1 | tail -1 | grep -q "❌"; then
			echo -e "  ${RED}✗${NC} New hardcoded strings found — migrate to useTranslations()"
			((ERRORS++))
		else
			echo -e "  ${GREEN}✓${NC} No new hardcoded strings"
		fi
	fi

	# Check for useFuzzySearch changes (Fuse.js v7 compat)
	if echo "$ALL_CHANGES" | grep -q "use-fuzzy-search"; then
		if git diff -- "src/lib/hooks/use-fuzzy-search.ts" 2>/dev/null | grep -q "tokenize\|matchAllTokens"; then
			echo -e "  ${RED}✗${NC} use-fuzzy-search uses deprecated Fuse.js v7 APIs (tokenize/matchAllTokens)"
			((ERRORS++))
		fi
	fi
else
	echo "  No changes detected (check git status)"
fi
echo ""

# ── Summary ──────────────────────────────────────────
echo "════════════════════════════════════════════════════"
if [ "$ERRORS" -gt 0 ]; then
	echo -e "  ${RED}$ERRORS error(s), $WARNINGS warning(s) — fix errors before pushing${NC}"
	echo "════════════════════════════════════════════════════"
	exit 2
elif [ "$WARNINGS" -gt 0 ]; then
	echo -e "  ${YELLOW}$WARNINGS warning(s) — review before pushing${NC}"
	echo "════════════════════════════════════════════════════"
	exit 1
else
	echo -e "  ${GREEN}Clean — ready to push${NC}"
	echo "════════════════════════════════════════════════════"
	exit 0
fi
