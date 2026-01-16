#!/bin/bash
# Corrected Nomad job script section for running tests

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

# Wait for server (127.0.0.1 is safe with network_mode host)
timeout 30s bash -c 'until printf "" 2>>/dev/null >> /dev/tcp/127.0.0.1/5173; do sleep 1; done'

echo "📦 Setting up tests..."
cd /app/tests

# Install test dependencies if package.json exists
if [ -f "package.json" ]; then
  echo "Installing test dependencies..."
  npm install || true
  npx playwright install chromium || true
fi

echo "▶️ Running Playwright tests..."
mkdir -p /tmp/results

# Set CI environment and run tests from tests directory
CI=true \
FRONTEND_URL=http://127.0.0.1:5173 \
BASE_URL=http://127.0.0.1:5173 \
npx playwright test --reporter=json > /tmp/results/results.json || true

echo "📤 Reporting to backend..."
# Note: Using 127.0.0.1 because of network_mode=host
curl -X POST -H "Content-Type: application/json" \
  -d @/tmp/results/results.json \
  "http://127.0.0.1:3001/report-results?runId=${NOMAD_META_RUN_ID}&sha=${NOMAD_META_COMMIT_SHA}"

kill "$SERVER_PID" || true
echo "✅ Done"
