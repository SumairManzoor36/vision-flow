#!/usr/bin/env bash
# =============================================================================
# Vision Audit Flow Pro — Plesk / Passenger Deployment Script
# =============================================================================
# Run this on the Plesk server, over SSH, from the Node.js Application root:
#
#     ssh user@yourdomain.com
#     cd ~/httpdocs
#     ./deploy.sh
#
# Flags:
#   --no-pull      Skip `git pull` (use when code was uploaded via SFTP)
#   --no-install   Skip `npm ci`     (faster when only env changed)
#   --no-migrate   Skip `prisma migrate deploy`
#   --no-build     Skip `next build` (rare; only for env-only changes)
#   --no-restart   Skip Passenger restart
#   --seed         Run `npm run db:seed` after migrations
#   --branch NAME  Check out and pull a specific git branch
#   --skip-health  Skip the post-deploy HTTP health check
#   -h, --help     Show this help
#
# Exit codes:
#   0   success
#   1   generic failure
#   2   missing prerequisite (node version, env var, etc.)
#   3   git step failed
#   4   npm install failed
#   5   prisma migrate failed
#   6   next build failed
#   7   restart / health check failed
# =============================================================================

set -Eeuo pipefail

# ----- Pretty output --------------------------------------------------------
if [[ -t 1 ]]; then
  C_RESET="\033[0m"; C_BOLD="\033[1m"; C_DIM="\033[2m"
  C_RED="\033[31m"; C_GRN="\033[32m"; C_YLW="\033[33m"; C_BLU="\033[34m"; C_CYA="\033[36m"
else
  C_RESET=""; C_BOLD=""; C_DIM=""; C_RED=""; C_GRN=""; C_YLW=""; C_BLU=""; C_CYA=""
fi

log()   { printf "%b\n" "${C_CYA}${C_BOLD}▸${C_RESET} $*"; }
ok()    { printf "%b\n" "${C_GRN}${C_BOLD}✓${C_RESET} $*"; }
warn()  { printf "%b\n" "${C_YLW}${C_BOLD}!${C_RESET} $*"; }
err()   { printf "%b\n" "${C_RED}${C_BOLD}✗${C_RESET} $*" >&2; }
step()  { printf "\n%b\n" "${C_BLU}${C_BOLD}== $* ==${C_RESET}"; }

trap 'err "Deployment failed at line $LINENO (last command: $BASH_COMMAND)"; exit 1' ERR

# ----- Parse args -----------------------------------------------------------
DO_PULL=1
DO_INSTALL=1
DO_MIGRATE=1
DO_BUILD=1
DO_RESTART=1
DO_SEED=0
DO_HEALTH=1
GIT_BRANCH=""

print_help() {
  sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-pull)     DO_PULL=0 ;;
    --no-install)  DO_INSTALL=0 ;;
    --no-migrate)  DO_MIGRATE=0 ;;
    --no-build)    DO_BUILD=0 ;;
    --no-restart)  DO_RESTART=0 ;;
    --seed)        DO_SEED=1 ;;
    --skip-health) DO_HEALTH=0 ;;
    --branch)      GIT_BRANCH="${2:-}"; shift ;;
    -h|--help)     print_help; exit 0 ;;
    *)             err "Unknown flag: $1"; print_help; exit 2 ;;
  esac
  shift
done

# ----- Resolve paths --------------------------------------------------------
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

START_TS=$(date +%s)
log "App root:   ${C_BOLD}$APP_ROOT${C_RESET}"
log "Started at: $(date -Iseconds)"

# ----- Load .env.production into the shell (does NOT override real env) -----
# Plesk-injected env vars always win.
if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
  ok "Loaded .env.production"
fi

# ----- Activate Plesk-managed Node 22 if available --------------------------
step "Verifying Node.js"
for candidate in /opt/plesk/node/22/enable /opt/plesk/node/20/enable; do
  if [[ -f "$candidate" ]]; then
    # shellcheck disable=SC1090
    source "$candidate"
    log "Sourced ${C_DIM}$candidate${C_RESET}"
    break
  fi
done

if ! command -v node >/dev/null 2>&1; then
  err "Node.js is not on PATH. Install Node 22 via Plesk → Tools & Settings → Updates."
  exit 2
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if (( NODE_MAJOR < 22 )); then
  err "Node ${C_BOLD}>=22${C_RESET} required (found $(node -v)). Configure it in Plesk → Domains → Node.js."
  exit 2
fi
ok "Node $(node -v), npm $(npm -v)"

# ----- Required env-vars sanity check ---------------------------------------
step "Checking required environment variables"
REQUIRED_VARS=(DATABASE_URL AUTH_SECRET GEMINI_API_KEY)
MISSING=()
for v in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    MISSING+=("$v")
  fi
done
if (( ${#MISSING[@]} > 0 )); then
  err "Missing required env var(s): ${MISSING[*]}"
  err "Set them in Plesk → Node.js → Custom environment variables, or in $APP_ROOT/.env.production"
  exit 2
fi
ok "All required env vars are set"

# ----- Git pull -------------------------------------------------------------
if (( DO_PULL )); then
  step "Pulling latest source"
  if [[ ! -d .git ]]; then
    warn "Not a git repository — skipping pull. Use --no-pull to silence this."
  else
    if [[ -n "$GIT_BRANCH" ]]; then
      log "Checking out branch: $GIT_BRANCH"
      git fetch --all --prune
      git checkout "$GIT_BRANCH"
    fi
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log "On branch: ${C_BOLD}$CURRENT_BRANCH${C_RESET}"
    BEFORE_SHA=$(git rev-parse --short HEAD)
    if ! git pull --ff-only; then
      err "git pull failed (working tree dirty? non-FF?). Resolve manually."
      exit 3
    fi
    AFTER_SHA=$(git rev-parse --short HEAD)
    if [[ "$BEFORE_SHA" == "$AFTER_SHA" ]]; then
      ok "Already up to date ($AFTER_SHA)"
    else
      ok "Updated: $BEFORE_SHA → $AFTER_SHA"
    fi
  fi
else
  warn "Skipping git pull (--no-pull)"
fi

# ----- npm ci ---------------------------------------------------------------
if (( DO_INSTALL )); then
  step "Installing dependencies (npm ci)"
  if [[ ! -f package-lock.json ]]; then
    warn "No package-lock.json found — falling back to 'npm install' (less reproducible)"
    npm install --no-audit --no-fund || { err "npm install failed"; exit 4; }
  else
    npm ci --no-audit --no-fund || { err "npm ci failed"; exit 4; }
  fi
  ok "Dependencies installed"
else
  warn "Skipping npm install (--no-install)"
fi

# ----- Prisma migrate -------------------------------------------------------
if (( DO_MIGRATE )); then
  step "Applying Prisma migrations"
  # Always regenerate the client first; postinstall does this too but be safe.
  npx --yes prisma generate >/dev/null
  if [[ -d prisma/migrations ]] && compgen -G "prisma/migrations/*/migration.sql" >/dev/null; then
    npx --yes prisma migrate deploy || { err "prisma migrate deploy failed"; exit 5; }
    ok "Migrations applied"
  else
    warn "No migration files found — running 'prisma db push' (one-shot schema sync)"
    npx --yes prisma db push --skip-generate || { err "prisma db push failed"; exit 5; }
    ok "Schema synced via db push"
  fi
else
  warn "Skipping migrations (--no-migrate)"
fi

# ----- Optional seed --------------------------------------------------------
if (( DO_SEED )); then
  step "Seeding database"
  npm run db:seed || { err "Seed failed"; exit 5; }
  ok "Database seeded"
fi

# ----- Next build -----------------------------------------------------------
if (( DO_BUILD )); then
  step "Building Next.js"
  # Cap RAM on small VPSes; harmless on big ones.
  : "${NODE_OPTIONS:=--max-old-space-size=2048}"
  export NODE_OPTIONS
  log "NODE_OPTIONS=$NODE_OPTIONS"
  npm run build || { err "next build failed"; exit 6; }
  ok "Build complete"
else
  warn "Skipping next build (--no-build)"
fi

# ----- Ensure persistent dirs exist -----------------------------------------
step "Ensuring persistent directories"
mkdir -p public/uploads tmp logs
chmod 750 public/uploads
ok "public/uploads, tmp, logs ready"

# ----- Passenger graceful restart -------------------------------------------
if (( DO_RESTART )); then
  step "Triggering Passenger restart"
  touch tmp/restart.txt
  ok "tmp/restart.txt touched — Passenger will pick this up on next request"
else
  warn "Skipping restart (--no-restart)"
fi

# ----- Health check ---------------------------------------------------------
if (( DO_HEALTH )) && (( DO_RESTART )); then
  step "Health check"
  HEALTH_URL="${NEXT_PUBLIC_APP_URL:-}"
  if [[ -z "$HEALTH_URL" ]]; then
    warn "NEXT_PUBLIC_APP_URL not set — skipping health check"
  elif ! command -v curl >/dev/null 2>&1; then
    warn "curl not installed — skipping health check"
  else
    log "Probing $HEALTH_URL ..."
    # First request wakes Passenger; allow up to ~30s for cold start.
    HTTP_CODE=""
    for attempt in 1 2 3 4 5 6; do
      sleep 3
      HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -m 10 "$HEALTH_URL" || echo "000")
      log "  attempt $attempt → HTTP $HTTP_CODE"
      if [[ "$HTTP_CODE" =~ ^(200|301|302|307|308)$ ]]; then
        ok "Site responded with HTTP $HTTP_CODE"
        break
      fi
    done
    if ! [[ "$HTTP_CODE" =~ ^(200|301|302|307|308)$ ]]; then
      err "Health check failed (last code: $HTTP_CODE). Inspect ~/logs/error_log"
      exit 7
    fi
  fi
fi

# ----- Done -----------------------------------------------------------------
END_TS=$(date +%s)
ELAPSED=$(( END_TS - START_TS ))
printf "\n%b\n" "${C_GRN}${C_BOLD}🚀 Deployment complete in ${ELAPSED}s${C_RESET}"
[[ -n "${NEXT_PUBLIC_APP_URL:-}" ]] && log "Live at: ${C_BOLD}${NEXT_PUBLIC_APP_URL}${C_RESET}"
exit 0
