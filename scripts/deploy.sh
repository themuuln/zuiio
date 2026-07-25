#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Universal Vercel Deployment Script for the Zuiio Monorepo
# ──────────────────────────────────────────────────────────────────────────────
# Deploys any Next.js app in the monorepo to Vercel, handling multiple
# accounts/teams, token retrieval via pass, .vercelignore constraints,
# and both remote-build (fast) and prebuilt (CI-style) deploy modes.
#
# Uses the proven CI staging pattern: runs from the monorepo root with
# temporary .vercel/project.json + vercel.json, then deploys via Vercel CLI.
#
# Usage:
#   ./scripts/deploy.sh                        # Interactive menu
#   ./scripts/deploy.sh --list                 # List all apps with status
#   ./scripts/deploy.sh --app zer              # Deploy one app
#   ./scripts/deploy.sh --app zer,tolom        # Deploy multiple (comma-sep)
#   ./scripts/deploy.sh --all                  # Deploy all linked apps
#   ./scripts/deploy.sh --app tolom --prebuilt # Build locally first
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
LOG_DIR="/tmp"

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# APP REGISTRY — Hardcoded from .cli-profiles.json + Vercel project data
# ═══════════════════════════════════════════════════════════════════════════════
# Indexed parallel arrays for bash 3 compatibility (macOS default).

APP_IDS=(
    zer
    tolom
    onoo
    website
    agent-gateway
    zuiio-id
    zim
    zatly
    tamga-web
    sms-pay
)

# Vercel profile name (maps to pass token path and Vercel account)
APP_PROFILES=(
    zerone
    tolom
    zerone
    zerone
    zerone
    themuuln6
    zerone
    zerone
    zerone
    zerone
)

# Turbo filter for pnpm exec turbo run build --filter=<filter>
APP_FILTERS=(
    zer
    tolom
    onoo
    website
    agent-gateway
    zuiio-id
    zim
    zatly
    tamga-web
    sms-pay
)

# Author email for Vercel Hobby plan compatibility
APP_EMAILS=(
    "yesprice.mn@gmail.com"
    "themuln.official@gmail.com"
    "zerone.offical@gmail.com"
    "zerone.offical@gmail.com"
    "zerone.offical@gmail.com"
    "themuuln6@gmail.com"
    "zerone.offical@gmail.com"
    "zerone.offical@gmail.com"
    "zerone.offical@gmail.com"
    "zerone.offical@gmail.com"
)

# Vercel project IDs (empty = not linked / not yet registered)
APP_PROJECT_IDS=(
    "prj_D2vMKjhrj5nQ6Ex6oMUARbvxGr5C"
    "prj_pz6FvapyAy8WnhF3CXMtl1EqnH7c"
    ""
    "prj_gdxnvsEsr2yjkwp4azgtPIcdA0Ua"
    "prj_VYHkd4rkcpzpeCT9qTBI0w1OC45A"
    "prj_Vf4hYAx98gma0SueNyu8ho8mgdH4"
    ""
    ""
    ""
    ""
)

# Vercel org IDs (empty = unregistered)
APP_ORG_IDS=(
    "team_gpvntVuvgulKYbPElyfplj50"
    "team_lfXQ2XNXmQfT3lCmPYA0t8wA"
    ""
    "team_gpvntVuvgulKYbPElyfplj50"
    "team_gpvntVuvgulKYbPElyfplj50"
    "team_FNCiKgaJAzyWNHy6jLFM0wRR"
    ""
    ""
    ""
    ""
)

# Pass token paths per Vercel profile
TOKEN_PATH_ZERONE="personal/vercel/zerone"
TOKEN_PATH_TOLOM="personal/vercel/tolom"
TOKEN_PATH_THEMUULN6="personal/vercel/6"

# ═══════════════════════════════════════════════════════════════════════════════
# TRAP STATE — tracked globally for cleanup on EXIT
# ═══════════════════════════════════════════════════════════════════════════════
CLEANUP_VERCELIGNORE_LINE=""       # line removed from .vercelignore (to restore)
STAGING_PROJECT_JSON_CREATED=""    # non-empty = we created .vercel/project.json at root
STAGING_VERCEL_JSON_CREATED=""     # non-empty = we created a staging vercel.json at root
ORIG_GIT_EMAIL=""                  # original git user.email to restore
ORIG_GIT_NAME=""                   # original git user.name to restore

# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
err()   { echo -e "${RED}[ERR]${NC} $*" >&2; }
die()   { err "$*"; exit 1; }

# ─── App Registry Lookup ──────────────────────────────────────────────────────
app_index() {
    local name="$1"
    for i in "${!APP_IDS[@]}"; do
        if [[ "${APP_IDS[$i]}" == "$name" ]]; then
            echo "$i"
            return 0
        fi
    done
    return 1
}

# ─── Dependency Check ─────────────────────────────────────────────────────────
check_deps() {
    local missing=0

    if ! command -v vercel &>/dev/null; then
        err "Vercel CLI is not installed."
        err "  Install: npm i -g vercel"
        missing=1
    fi

    if ! command -v pass &>/dev/null; then
        err "'pass' (password-store) is not installed."
        err "  Install: brew install pass"
        err "  Initialize: pass init <your-gpg-id>"
        missing=1
    fi

    if ! command -v jq &>/dev/null; then
        err "'jq' is not installed."
        err "  Install: brew install jq"
        missing=1
    fi

    if [[ $missing -ne 0 ]]; then
        die "Missing required dependencies. Install them and try again."
    fi
}

# ─── Token Retrieval ──────────────────────────────────────────────────────────
get_vercel_token() {
    local profile="$1"
    local token_path_var
    token_path_var="TOKEN_PATH_$(echo "$profile" | tr '[:lower:]' '[:upper:]')"
    local token_path="${!token_path_var:-}"

    if [[ -z "$token_path" ]]; then
        die "No token path configured for profile '$profile'. Add TOKEN_PATH_${profile^^} to $SCRIPT_NAME"
    fi

    local token
    token="$(pass "$token_path" 2>/dev/null | head -1)" || {
        die "Token not found at pass path '$token_path'. Store: pass insert '$token_path'"
    }

    if [[ -z "$token" ]]; then
        die "Token retrieved from pass but it is empty (path: '$token_path')."
    fi

    echo "$token"
}

# ─── Linked Status ────────────────────────────────────────────────────────────
# Returns 0 if the app has a .vercel/project.json (fully linked).
# Returns 1 otherwise (repo.json only, or nothing).
is_linked() {
    local app="$1"
    [[ -f "$MONOREPO_ROOT/apps/$app/.vercel/project.json" ]]
}

has_repo_json() {
    local app="$1"
    [[ -f "$MONOREPO_ROOT/apps/$app/.vercel/repo.json" ]]
}

# ─── Vercelignore Check ───────────────────────────────────────────────────────
is_ignored() {
    local app="$1"
    [[ -f "$MONOREPO_ROOT/.vercelignore" ]] && \
        grep -qE "^apps/$app/" "$MONOREPO_ROOT/.vercelignore" 2>/dev/null
}

remove_from_vercelignore() {
    local app="$1"
    CLEANUP_VERCELIGNORE_LINE="$(grep -E "^apps/$app/" "$MONOREPO_ROOT/.vercelignore" 2>/dev/null || true)"
    if [[ -n "$CLEANUP_VERCELIGNORE_LINE" ]]; then
        sed -i.bak "/^apps\/$app\//d" "$MONOREPO_ROOT/.vercelignore" 2>/dev/null
        rm -f "$MONOREPO_ROOT/.vercelignore.bak"
        info "Removed '$CLEANUP_VERCELIGNORE_LINE' from .vercelignore (will restore after deploy)"
    fi
}

restore_vercelignore() {
    if [[ -n "$CLEANUP_VERCELIGNORE_LINE" ]]; then
        echo "$CLEANUP_VERCELIGNORE_LINE" >> "$MONOREPO_ROOT/.vercelignore"
        info "Restored '$CLEANUP_VERCELIGNORE_LINE' to .vercelignore"
        CLEANUP_VERCELIGNORE_LINE=""
    fi
}

# ─── CI Staging ───────────────────────────────────────────────────────────────
# Creates .vercel/project.json and matching vercel.json at the monorepo root.
stage_project_config() {
    local app="$1" project_id="$2" org_id="$3" filter="$4"

    # Back up any existing root vercel.json
    if [[ -f "$MONOREPO_ROOT/vercel.json" ]]; then
        cp "$MONOREPO_ROOT/vercel.json" "$MONOREPO_ROOT/vercel.json.bak"
    fi

    mkdir -p "$MONOREPO_ROOT/.vercel"

    # Write project.json — tells Vercel CLI which project to deploy
    jq -n \
        --arg pid "$project_id" \
        --arg oid "$org_id" \
        '{projectId: $pid, orgId: $oid}' > "$MONOREPO_ROOT/.vercel/project.json"
    STAGING_PROJECT_JSON_CREATED="yes"

    # Write staging vercel.json — matches the proven CI workflow pattern.
    # IMPORTANT: Do NOT set "framework": "nextjs" here. In a pnpm monorepo
    # where next is a catalog dep in apps/*/package.json, Vercel's framework
    # detection runs before the build command and fails to find Next.js at
    # the monorepo root. Omit framework and let the build command handle it.
    jq -n \
        --arg schema "https://openapi.vercel.sh/vercel.json" \
        --arg filter "$filter" \
        --arg outDir "apps/$app/.next" \
        '{
            "$schema": $schema,
            "outputDirectory": $outDir,
            "installCommand": "pnpm install --frozen-lockfile",
            "buildCommand": ("pnpm exec turbo run build --filter=" + $filter)
        }' > "$MONOREPO_ROOT/vercel.json"
    STAGING_VERCEL_JSON_CREATED="yes"
}

cleanup_staging() {
    if [[ -n "$STAGING_VERCEL_JSON_CREATED" ]]; then
        if [[ -f "$MONOREPO_ROOT/vercel.json.bak" ]]; then
            mv "$MONOREPO_ROOT/vercel.json.bak" "$MONOREPO_ROOT/vercel.json"
        else
            rm -f "$MONOREPO_ROOT/vercel.json"
        fi
        STAGING_VERCEL_JSON_CREATED=""
    fi

    if [[ -n "$STAGING_PROJECT_JSON_CREATED" ]]; then
        rm -f "$MONOREPO_ROOT/.vercel/project.json"
        STAGING_PROJECT_JSON_CREATED=""
    fi
}

# ─── Git Author Save / Restore ────────────────────────────────────────────────
save_git_author() {
    ORIG_GIT_EMAIL="$(git config user.email || true)"
    ORIG_GIT_NAME="$(git config user.name || true)"
}

restore_git_author() {
    if [[ -n "$ORIG_GIT_EMAIL" ]]; then
        git config user.email "$ORIG_GIT_EMAIL"
    fi
    if [[ -n "$ORIG_GIT_NAME" ]]; then
        git config user.name "$ORIG_GIT_NAME"
    fi
    ORIG_GIT_EMAIL=""
    ORIG_GIT_NAME=""
}

set_deploy_git_author() {
    local email="$1"
    git config user.email "$email"
    git config user.name "Vercel Deploy Bot"
}

# ═══════════════════════════════════════════════════════════════════════════════
# GLOBAL CLEANUP — runs on EXIT via trap
# ═══════════════════════════════════════════════════════════════════════════════
global_cleanup() {
    restore_vercelignore
    cleanup_staging
    if [[ -n "$ORIG_GIT_EMAIL" || -n "$ORIG_GIT_NAME" ]]; then
        restore_git_author
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY SINGLE APP
# ═══════════════════════════════════════════════════════════════════════════════
# Returns 0 on success, 1 on failure.
#
# Strategy (both paths deploy from monorepo root with staging config):
#
#   Remote build (--prebuilt not set, app must be linked or have ID):
#     1. Stage .vercel/project.json + vercel.json
#     2. vercel deploy --prod    (uploads current dir, builds on Vercel)
#
#   Prebuilt (--prebuilt set, or unlinked app):
#     1. Stage .vercel/project.json + vercel.json
#     2. vercel pull --yes --environment=production
#     3. vercel build --prod
#     4. vercel deploy --prebuilt --prod --archive=tgz
#
deploy_app() {
    local app="$1"
    local prebuilt="$2"

    local idx
    idx="$(app_index "$app")" || {
        warn "Unknown app '$app'. Valid apps: ${APP_IDS[*]}"
        return 1
    }

    local profile="${APP_PROFILES[$idx]}"
    local filter="${APP_FILTERS[$idx]}"
    local email="${APP_EMAILS[$idx]}"
    local project_id="${APP_PROJECT_IDS[$idx]}"
    local org_id="${APP_ORG_IDS[$idx]}"

    local linked=false
    is_linked "$app" && linked=true

    local has_project_id=false
    [[ -n "$project_id" ]] && has_project_id=true

    local log_file
    log_file="$LOG_DIR/deploy-${app}-$(date +%Y%m%d-%H%M%S).log"
    local start_time
    local end_time
    local deploy_url=""
    local success=false

    start_time="$(date +%s)"

    echo ""
    info "━━━ Deploying: ${BOLD}$app${NC} ━━━"
    info "Profile: $profile  |  Filter: $filter  |  Linked: $linked  |  Prebuilt: $prebuilt"
    info "Log: $log_file"

    # ─── Step 1: Get Vercel token ──────────────────────────────────────────
    local token
    token="$(get_vercel_token "$profile")" || return 1

    # ─── Step 2: Verify project info exists ────────────────────────────────
    if ! $has_project_id; then
        err "App '$app' has no project/org IDs in the registry."
        err "Add them to APP_PROJECT_IDS and APP_ORG_IDS in $SCRIPT_NAME"
        return 1
    fi

    # ─── Step 3: Check .vercelignore (root-level deploys need this) ────────
    if is_ignored "$app"; then
        local ignore_line
        ignore_line="$(grep -E "^apps/$app/" "$MONOREPO_ROOT/.vercelignore" 2>/dev/null || true)"
        warn "App '$app' is excluded by root .vercelignore: '$ignore_line'"

        if [[ -n "${ALL_MODE:-}" ]]; then
            warn "Skipping $app (blocked by .vercelignore)."
            warn "To deploy, remove '$ignore_line' from .vercelignore and re-run."
            return 1
        fi

        echo -n -e "${YELLOW}Auto-remove from .vercelignore and continue? [y/N] ${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy] ]]; then
            remove_from_vercelignore "$app"
        else
            warn "Skipping $app. Remove '$ignore_line' from .vercelignore and try again."
            return 1
        fi
    fi

    # ─── Step 4: Stage config files at monorepo root ───────────────────────
    info "Staging Vercel project config at monorepo root..."
    stage_project_config "$app" "$project_id" "$org_id" "$filter"

    # Set git author for Hobby plan compatibility
    save_git_author
    set_deploy_git_author "$email"

    cd "$MONOREPO_ROOT"

    if $prebuilt || ! $linked; then
        # ══════════════════════════════════════════════════════════════════
        # PREBUILT PATH: Pull → Build → Deploy (CI-style)
        # ══════════════════════════════════════════════════════════════════

        # ── vercel pull ──
        info "Pulling Vercel environment variables..."
        set +e
        VERCEL_TOKEN="$token" vercel pull --yes --environment=production 2>&1 | tee -a "$log_file"
        local pull_exit=${PIPESTATUS[0]}
        set -e

        if [[ $pull_exit -ne 0 ]]; then
            err "vercel pull failed (exit $pull_exit). See log: $log_file"
            restore_git_author
            cleanup_staging
            return 1
        fi

        # ── vercel build ──
        info "Building locally..."
        set +e
        VERCEL_TOKEN="$token" vercel build --prod 2>&1 | tee -a "$log_file"
        local build_exit=${PIPESTATUS[0]}
        set -e

        if [[ $build_exit -ne 0 ]]; then
            err "vercel build failed (exit $build_exit). See log: $log_file"
            restore_git_author
            cleanup_staging
            return 1
        fi

        # ── vercel deploy --prebuilt ──
        info "Deploying prebuilt output to production..."
        set +e
        deploy_url="$(VERCEL_TOKEN="$token" vercel deploy --prebuilt --prod --archive=tgz 2>&1 | tee -a "$log_file" | tail -1)"
        local deploy_exit=${PIPESTATUS[0]}
        set -e

        if [[ $deploy_exit -eq 0 && -n "$deploy_url" ]]; then
            success=true
        fi

    else
        # ══════════════════════════════════════════════════════════════════
        # REMOTE BUILD PATH: Deploy without local build (fast)
        # Only available for linked apps with project IDs.
        # ══════════════════════════════════════════════════════════════════

        info "Remote build (fast path)..."
        set +e
        deploy_url="$(VERCEL_TOKEN="$token" vercel deploy --prod 2>&1 | tee -a "$log_file" | tail -1)"
        local deploy_exit=${PIPESTATUS[0]}
        set -e

        if [[ $deploy_exit -eq 0 && -n "$deploy_url" ]]; then
            success=true
        fi
    fi

    # ─── Step 5: Restore and clean up ─────────────────────────────────────
    restore_git_author
    cleanup_staging

    # ─── Result ───────────────────────────────────────────────────────────
    end_time="$(date +%s)"
    local duration=$((end_time - start_time))
    local duration_str
    if ((duration >= 60)); then
        duration_str="$((duration / 60))m $((duration % 60))s"
    else
        duration_str="${duration}s"
    fi

    if $success; then
        ok "${BOLD}$app${NC} -> ${GREEN}${BOLD}$deploy_url${NC}  (${duration_str})"
        return 0
    else
        err "${BOLD}$app${NC} deployment FAILED (${duration_str})"
        err "Full log: $log_file"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# LIST APPS
# ═══════════════════════════════════════════════════════════════════════════════
list_apps() {
    echo ""
    echo -e "${BOLD}Zuiio Vercel Deployment Targets${NC}"
    echo ""

    printf "  %-14s %-11s %-22s %-6s %-7s  %s\n" \
        "App" "Profile" "Turbo Filter" "Link" "Ignore" "Project ID"
    printf "  %s\n" "$(printf '%.0s─' {1..75})"

    for i in "${!APP_IDS[@]}"; do
        local app="${APP_IDS[$i]}"
        local profile="${APP_PROFILES[$i]}"
        local filter="${APP_FILTERS[$i]}"
        local project_id="${APP_PROJECT_IDS[$i]}"

        local linked_status
        if is_linked "$app"; then
            linked_status="${GREEN}yes${NC}"
        elif has_repo_json "$app"; then
            linked_status="${YELLOW}repo${NC}"
        else
            linked_status="${DIM}no${NC}"
        fi

        local ignore_status
        if is_ignored "$app"; then
            ignore_status="${RED}B${NC}"
        else
            ignore_status="${GREEN}--${NC}"
        fi

        local pid_display="${DIM}${project_id:0:18}...${NC}"
        [[ -z "$project_id" ]] && pid_display="${DIM}(unset)${NC}"

        printf "  %-14s %-11s %-22s %b   %b   %b\n" \
            "$app" "$profile" "$filter" \
            "$linked_status" "$ignore_status" "$pid_display"
    done

    echo ""
    info "${GREEN}yes${NC} = has .vercel/project.json (fast remote deploy + prebuilt)"
    info "${YELLOW}repo${NC} = has .vercel/repo.json only (use --prebuilt or CI staging)"
    info "${DIM}no${NC}  = not linked locally (uses CI staging)"
    info "${RED}B${NC}   = blocked by root .vercelignore"
}

# ═══════════════════════════════════════════════════════════════════════════════
# HELP
# ═══════════════════════════════════════════════════════════════════════════════

show_help() {
    cat <<EOF
${BOLD}NAME${NC}
    $SCRIPT_NAME — Deploy Zuiio monorepo apps to Vercel

${BOLD}USAGE${NC}
    $SCRIPT_NAME [OPTIONS]

${BOLD}OPTIONS${NC}
    --app <app>[,<app>...]   Deploy one or more apps (comma-separated).
    --all                    Deploy every linked app sequentially.
    --list                   List all registered apps with their status.
    --prebuilt               Build locally before deploying (CI-style).
                             Catches build errors before they reach Vercel.
    --help                   Show this help message.

${BOLD}EXAMPLES${NC}
    $SCRIPT_NAME                          Interactive menu
    $SCRIPT_NAME --list                   List all apps with status
    $SCRIPT_NAME --app zer                Deploy zer (remote build)
    $SCRIPT_NAME --app zer,tolom          Deploy zer and tolom
    $SCRIPT_NAME --all                    Deploy all linked apps
    $SCRIPT_NAME --app tolom --prebuilt   Deploy tolom with local build

${BOLD}STRATEGIES${NC}
    All deploys run from the monorepo root with temporary staging config
    (.vercel/project.json + vercel.json), matching the proven CI workflow.

    ${BOLD}Remote build${NC} (default for linked apps):
      vercel deploy --prod                         Builds on Vercel's infra

    ${BOLD}Prebuilt${NC} (--prebuilt or required for unlinked):
      vercel pull + vercel build + vercel deploy --prebuilt  CI-style

${BOLD}TOKENS${NC}
    Tokens are retrieved from the 'pass' password-store:
      zerone    → pass ${TOKEN_PATH_ZERONE}
      tolom     → pass ${TOKEN_PATH_TOLOM}
      themuuln6 → pass ${TOKEN_PATH_THEMUULN6}

    Store a token: pass insert <path>
EOF
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    local mode="interactive"
    local prebuilt=false
    local apps_to_deploy=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --list|-l)
                mode="list"
                shift
                ;;
            --app|-a)
                if [[ -z "${2:-}" ]]; then
                    die "--app requires a comma-separated app name argument"
                fi
                mode="deploy"
                IFS=',' read -ra apps_to_deploy <<< "$2"
                shift 2
                ;;
            --all|-A)
                mode="all"
                shift
                ;;
            --prebuilt|-p)
                prebuilt=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                die "Unknown argument: $1. Use --help for usage."
                ;;
        esac
    done

    check_deps

    # Register global cleanup on any exit
    trap global_cleanup EXIT

    case "$mode" in
        list)
            list_apps
            ;;

        all)
            ALL_MODE=true
            local deployed=0 failed=0 skipped=0
            for i in "${!APP_IDS[@]}"; do
                local app="${APP_IDS[$i]}"
                local pid="${APP_PROJECT_IDS[$i]}"

                if [[ -z "$pid" ]]; then
                    warn "Skipping $app (no project ID in registry)"
                    ((skipped++)) || true
                    continue
                fi

                if deploy_app "$app" "$prebuilt"; then
                    ((deployed++)) || true
                else
                    ((failed++)) || true
                fi
            done

            echo ""
            echo "═══════════════════════════════════════"
            echo "  Deployed: $deployed  |  Failed: $failed  |  Skipped: $skipped"
            echo "═══════════════════════════════════════"
            [[ $failed -eq 0 ]] || return 1
            ;;

        deploy)
            local failed=0 deployed=0
            for app_raw in "${apps_to_deploy[@]}"; do
                local app
                app="$(echo "$app_raw" | xargs)"
                if [[ -z "$app" ]]; then
                    continue
                fi
                if deploy_app "$app" "$prebuilt"; then
                    ((deployed++)) || true
                else
                    ((failed++)) || true
                fi
            done

            [[ $failed -eq 0 ]] || die "$failed app(s) failed to deploy"
            ;;

        interactive)
            list_apps
            echo ""
            echo -n "Enter app name to deploy (or comma-separated list): "
            read -r input
            if [[ -z "$input" ]]; then
                die "No app selected."
            fi
            IFS=',' read -ra apps_to_deploy <<< "$input"
            for app_raw in "${apps_to_deploy[@]}"; do
                local app
                app="$(echo "$app_raw" | xargs)"
                if [[ -z "$app" ]]; then continue; fi
                deploy_app "$app" "$prebuilt" || true
            done
            ;;
    esac
}

main "$@"
