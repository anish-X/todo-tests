# Nomad Configuration for Playwright Docker Image

## Docker Image
You're using: `mcr.microsoft.com/playwright:v1.49.0-jammy`

This image already has:
- ✅ Playwright installed globally
- ✅ Chromium browser installed
- ✅ Node.js and npm

**You DON'T need:**
- ❌ `npm install` in tests (unless you want to use a specific version)
- ❌ `npx playwright install chromium` (already installed)

## The Problem: "No tests found"

This happens when:
1. Tests aren't in the expected location
2. Config file isn't found
3. Test files don't match the pattern

## Solution: Correct Nomad Script

Since Playwright is global, you can run from anywhere, but you need to specify the config:

```bash
set -eu

echo "📁 Listing workspace..."
ls -la /app/student
ls -la /app/tests

# Detect frontend directory
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

echo "▶️ Running Playwright tests..."
mkdir -p /tmp/results

# IMPORTANT: Run from tests directory OR specify config explicitly
cd /app/tests

# Verify files exist
echo "Checking test files..."
ls -la *.test.js || echo "No .test.js files found!"
ls -la playwright.config.js || echo "Config file not found!"

# Run tests with explicit config and CI mode
CI=true \
FRONTEND_URL=http://127.0.0.1:5173 \
BASE_URL=http://127.0.0.1:5173 \
playwright test --config=playwright.config.js --reporter=json > /tmp/results/results.json || true

# Check if results file was created
if [ -f "/tmp/results/results.json" ]; then
  echo "✅ Test results file created"
  cat /tmp/results/results.json | head -20
else
  echo "❌ No results file created!"
  echo "Creating empty results file..."
  echo '{"suites":[],"errors":[],"stats":{"startTime":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'","duration":0,"expected":0,"skipped":0,"unexpected":0,"flaky":0}}' > /tmp/results/results.json
fi

echo "📤 Reporting to backend..."
curl -X POST -H "Content-Type: application/json" \
  -d @/tmp/results/results.json \
  "http://127.0.0.1:3001/report-results?runId=${NOMAD_META_RUN_ID}&sha=${NOMAD_META_COMMIT_SHA}"

kill "$SERVER_PID" || true
echo "✅ Done"
```

## Alternative: Run from /app/student

If you prefer to run from `/app/student`:

```bash
cd /app/student

CI=true \
FRONTEND_URL=http://127.0.0.1:5173 \
BASE_URL=http://127.0.0.1:5173 \
playwright test /app/tests --config=/app/tests/playwright.config.js --reporter=json > /tmp/results/results.json || true
```

## Debugging Steps

Add these debug lines to see what's happening:

```bash
echo "=== Debug Info ==="
echo "Current directory: $(pwd)"
echo "Test directory contents:"
ls -la /app/tests/
echo "Looking for test files:"
find /app/tests -name "*.test.js" -o -name "*.test.ts"
echo "Config file:"
cat /app/tests/playwright.config.js | head -20
echo "=================="
```

## Common Issues

### Issue 1: Config file not found
**Solution**: Use `--config=/app/tests/playwright.config.js` explicitly

### Issue 2: Tests not found
**Solution**: 
- Make sure you're in `/app/tests` OR
- Use `playwright test /app/tests` with full path

### Issue 3: Import errors in config
**Solution**: The Playwright image has Playwright globally, but the config still needs to resolve imports. Try:
```bash
cd /app/tests
# Optionally install to ensure same version
npm install --no-save @playwright/test || true
playwright test --config=playwright.config.js
```

## Minimal Working Command

The absolute minimum that should work:

```bash
cd /app/tests
CI=true FRONTEND_URL=http://127.0.0.1:5173 playwright test --config=playwright.config.js --reporter=json
```

## Verify Test Files Exist

Before running, verify:
```bash
ls -la /app/tests/todo.test.js      # Should exist
ls -la /app/tests/playwright.config.js  # Should exist
```

If these don't exist, the artifact cloning failed!
