# Final Nomad Job Configuration

## Directory Structure in Docker

```
/app/student/          # Frontend code (cloned from student repo)
  ├── package.json
  ├── src/
  └── ...

/app/tests/           # Test code (cloned from test repo)
  ├── package.json    # Has @playwright/test dependency
  ├── playwright.config.js
  └── todo.test.js
```

## Do You Need `npm install` in `/app/tests`?

**YES, you need it** because:

1. **Playwright dependency**: The `/app/tests/package.json` has `@playwright/test` as a dependency
2. **Config file**: `playwright.config.js` uses ES modules and imports from `@playwright/test`
3. **Browser installation**: Chromium browser needs to be installed via `npx playwright install chromium`

## Two Options

### Option 1: Install dependencies in tests (RECOMMENDED)

```bash
cd /app/tests
npm install || true
npx playwright install chromium || true
CI=true FRONTEND_URL=http://127.0.0.1:5173 npx playwright test --reporter=json > /tmp/results/results.json || true
```

**Pros:**
- Ensures all dependencies are available
- Works even if Docker image doesn't have Playwright globally
- More reliable

### Option 2: Run from /app/student (if Playwright is global)

If the Docker image (`bahadhur/grader-image`) has Playwright installed globally, you can:

```bash
cd /app/student
CI=true FRONTEND_URL=http://127.0.0.1:5173 npx playwright test /app/tests --config=/app/tests/playwright.config.js --reporter=json > /tmp/results/results.json || true
```

**But you still need:**
- Browser installed: `npx playwright install chromium` (can be done from anywhere)
- Config file path specified: `--config=/app/tests/playwright.config.js`

## Recommended Final Script

```bash
set -eu

echo "📁 Listing workspace..."
ls -la /app/student

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

echo "📦 Setting up tests..."
cd /app/tests

# Install test dependencies (REQUIRED)
if [ -f "package.json" ]; then
  echo "Installing test dependencies..."
  npm install || true
  echo "Installing Chromium browser..."
  npx playwright install chromium || true
fi

echo "▶️ Running Playwright tests..."
mkdir -p /tmp/results

# Run tests with CI mode and correct frontend URL
CI=true \
FRONTEND_URL=http://127.0.0.1:5173 \
BASE_URL=http://127.0.0.1:5173 \
npx playwright test --reporter=json > /tmp/results/results.json || true

echo "📤 Reporting to backend..."
curl -X POST -H "Content-Type: application/json" \
  -d @/tmp/results/results.json \
  "http://127.0.0.1:3001/report-results?runId=${NOMAD_META_RUN_ID}&sha=${NOMAD_META_COMMIT_SHA}"

kill "$SERVER_PID" || true
echo "✅ Done"
```

## Why Install in /app/tests?

1. **Dependencies**: `@playwright/test` package needs to be installed
2. **Config imports**: The config file imports from `@playwright/test`
3. **Browser**: Chromium browser needs to be downloaded (can be 100+ MB)
4. **Reliability**: Works regardless of what's in the Docker image

## Minimal Version (if you're sure Playwright is global)

If you're 100% sure the Docker image has Playwright globally installed:

```bash
cd /app/student
npx playwright install chromium || true  # Still need browser
CI=true FRONTEND_URL=http://127.0.0.1:5173 npx playwright test /app/tests --config=/app/tests/playwright.config.js --reporter=json > /tmp/results/results.json || true
```

But this is **less reliable** and may fail if:
- Playwright version doesn't match
- Config file can't resolve imports
- Browser isn't installed

## Recommendation

**Always install dependencies in `/app/tests`** - it's safer and more reliable.
