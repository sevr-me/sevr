#!/bin/bash
set -e

# --- .env validation ---

missing_env=0

if [ ! -f .env ]; then
  cp .env.example .env
  echo "ERROR: .env was missing — copied from .env.example"
  echo "       Edit .env and fill in your values, then re-run."
  missing_env=1
fi

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "ERROR: server/.env was missing — copied from server/.env.example"
  echo "       Edit server/.env and fill in your values, then re-run."
  missing_env=1
fi

if [ "$missing_env" -eq 1 ]; then
  exit 1
fi

# Check required vars are set and not still placeholder values
errors=""

check_var() {
  local file="$1" var="$2" placeholder="$3"
  local val
  val=$(grep -E "^${var}=" "$file" 2>/dev/null | head -1 | cut -d= -f2-)
  if [ -z "$val" ]; then
    errors="${errors}\n  ${file}: ${var} is missing or empty"
  elif [ -n "$placeholder" ] && [ "$val" = "$placeholder" ]; then
    errors="${errors}\n  ${file}: ${var} still has the example placeholder value"
  fi
}

# Root .env
check_var .env VITE_GOOGLE_CLIENT_ID "your-google-client-id.apps.googleusercontent.com"
check_var .env VITE_MICROSOFT_CLIENT_ID "your-microsoft-client-id"

# server/.env
check_var server/.env JWT_SECRET ""
check_var server/.env ALLOWED_ORIGINS "https://yourdomain.com"
check_var server/.env RESEND_API_KEY "re_your_api_key_here"
check_var server/.env EMAIL_FROM "onboarding@resend.dev"

if [ -n "$errors" ]; then
  echo "ERROR: Some required env vars need updating:"
  echo -e "$errors"
  echo ""
  echo "Fix the values above and re-run."
  exit 1
fi

# Warn (non-fatal) if JWT_SECRET is the example placeholder
jwt_val=$(grep -E "^JWT_SECRET=" server/.env | head -1 | cut -d= -f2-)
if [ "$jwt_val" = "your-secret-key-change-in-production" ]; then
  echo "WARNING: JWT_SECRET is still the example placeholder — change it for production!"
fi

echo "Installing frontend dependencies..."
npm ci

echo "Installing server dependencies..."
cd server && npm ci && cd ..

echo "Building frontend..."
npm run build

echo "Restarting server..."
pm2 restart sevr

echo "Done."
pm2 status sevr
