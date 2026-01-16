# Test Setup Guide

## Structure

```
tests/
├── package.json          # Dependencies and scripts
├── playwright.config.js  # Playwright configuration
├── todo.test.js         # All test cases
├── .gitignore          # Git ignore rules
├── README.md           # Documentation
└── SETUP.md            # This file
```

## Local Development

1. Install dependencies:
```bash
cd tests
npm install
npm run install:browsers
# or
npx playwright install chromium
```

**Note**: Only Chromium browser is installed (not Firefox or WebKit).

2. Run tests:
```bash
npm test
```

The config automatically starts the frontend server at `../frontend`.

## Docker/Nomad Setup

The tests are configured to work with the Nomad job:

1. **Environment Detection**: When `CI=true`, the web server is NOT started (assumes frontend is already running)

2. **URL Configuration**: 
   - Uses `FRONTEND_URL` env var (default: http://localhost:5173)
   - Can be overridden with `BASE_URL`

3. **Reporter**: 
   - Local: HTML reporter
   - CI/Docker: JSON reporter (for Nomad integration)

4. **Test Execution**:
```bash
export CI=true
export FRONTEND_URL=http://localhost:5173
npx playwright test --reporter=json > results.json
```

## Test Coverage

The test suite includes:

- ✅ Basic functionality (rendering, empty state)
- ✅ Adding todos (form, Enter key, validation)
- ✅ Toggling completion (checkbox, styling)
- ✅ Deleting todos (single, multiple, all)
- ✅ Complex workflows (add/toggle/delete combinations)
- ✅ Edge cases (long text, special chars, Unicode, duplicates, max todos)
- ✅ UI/UX (accessibility, keyboard navigation, empty states)

## Integration with Nomad Job

The Nomad job configuration expects:
- Tests in `/app/tests`
- Frontend running on port 5173
- JSON output for results

The Playwright config automatically:
- Detects CI environment
- Uses correct URLs
- Outputs JSON format for reporting

## Troubleshooting

### Tests fail to connect
- Check `FRONTEND_URL` is correct
- Verify frontend is running on port 5173
- In Docker, ensure network_mode=host or proper port mapping

### Web server not starting locally
- Ensure `../frontend` exists
- Check frontend has `npm run dev` script
- Verify frontend dependencies are installed

### JSON reporter not working
- Set `CI=true` environment variable
- Or use `--reporter=json` flag directly
