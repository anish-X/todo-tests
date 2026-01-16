# Nomad Job Configuration Guide

## Issue: "No tests found" Error

The error occurs because Playwright needs to:

1. Find the test files
2. Find the config file
3. Have dependencies installed

## Solution: Update Nomad Job Script

Update the Nomad job to run tests correctly:

```bash
# In the Nomad job script, change the test execution part:

# OLD (doesn't work):
cd /app/student
npx playwright test /app/tests --reporter=json > /tmp/results/results.json || true

# NEW (correct):
cd /app/tests
npm install || true  # Install test dependencies if not already installed
npx playwright install chromium || true  # Install browser if needed
CI=true npx playwright test --reporter=json > /tmp/results/results.json || true
```

## Complete Nomad Job Script

Here's the corrected section for the Nomad job:

```bash
set -eu

echo "📁 Listing workspace..."
ls -la /app/student

# Detect frontend directory correctly
if [ -d "/app/student/frontend" ]; then
  FRONTEND_DIR="/app/student/frontend"
elif [ -f "/app/student/package.json" ]; then
  FRONTEND_DIR="/app/student"
else
  echo "❌ Frontend not found"
  exit 1
fi

echo "✅ Frontend at: $FRONTEND_DIR"
cd "$FRONTEND_DIR"

echo "📦 Installing frontend dependencies..."
npm install --prefix-offline || npm install

echo "🚀 Starting Vite..."
npx vite --host 0.0.0.0 --port 5173 &
SERVER_PID=$!

# Wait for server
timeout 30s bash -c 'until printf "" 2>>/dev/null >> /dev/tcp/127.0.0.1/5173; do sleep 1; done'

echo "📦 Installing test dependencies..."
cd /app/tests
npm install || true
npx playwright install chromium || true

echo "▶️ Running Playwright tests..."
mkdir -p /tmp/results
CI=true FRONTEND_URL=http://127.0.0.1:5173 npx playwright test --reporter=json > /tmp/results/results.json || true

echo "📤 Reporting to backend..."
curl -X POST -H "Content-Type: application/json" \
  -d @/tmp/results/results.json \
  "http://127.0.0.1:3001/report-results?runId=${NOMAD_META_RUN_ID}&sha=${NOMAD_META_COMMIT_SHA}"

kill "$SERVER_PID" || true
echo "✅ Done"
```

## Key Changes

1. **Run from tests directory**: `cd /app/tests` before running tests
2. **Install test dependencies**: `npm install` in tests directory
3. **Install browser**: `npx playwright install chromium`
4. **Set CI environment**: `CI=true` to disable web server auto-start
5. **Set FRONTEND_URL**: `FRONTEND_URL=http://127.0.0.1:5173` for Docker networking

## Alternative: If tests must run from /app/student

If you need to run from `/app/student`, use:

```bash
cd /app/student
CI=true FRONTEND_URL=http://127.0.0.1:5173 npx playwright test /app/tests --config=/app/tests/playwright.config.js --reporter=json
```

This explicitly:

- Points to test directory: `/app/tests`
- Points to config file: `--config=/app/tests/playwright.config.js`
- Sets CI mode: `CI=true`
- Sets frontend URL: `FRONTEND_URL=http://127.0.0.1:5173`
