# Todo App - Playwright Tests

Comprehensive end-to-end test suite for the Todo Frontend application.

## Overview

This test suite uses Playwright to test the Todo application across various scenarios, including edge cases and complex workflows.

## Test Coverage

### Basic Functionality

- App rendering and initial state
- UI element presence and accessibility

### Adding Todos

- Form submission
- Enter key submission
- Empty input validation
- Whitespace trimming
- Multiple todos
- Long text handling
- Special characters and Unicode support

### Toggling Completion

- Checkbox functionality
- Styling for completed todos
- Independent toggling of multiple todos

### Deleting Todos

- Single todo deletion
- Correct todo deletion from multiple
- Deleting all todos

### Complex Workflows

- Add, toggle, and delete operations
- State persistence
- Rapid interactions

### Edge Cases

- Maximum todos
- Duplicate text
- Empty list interactions
- Page interactions

### UI/UX

- Accessibility
- Empty state handling
- Keyboard navigation

## Installation

```bash
npm install
npm run install:browsers
# or
npx playwright install chromium
```

**Note**: Only Chromium is installed (not Firefox or WebKit) to reduce installation size and time.

## Running Tests

### Local Development

```bash
# Run all tests (auto-starts frontend)
npm test

# Run with UI
npm run test:ui

# Run in headed mode
npm run test:headed

# Debug mode
npm run test:debug
```

### In Docker/Nomad

The tests are configured to work in Docker environments where the frontend is already running:

```bash
# Set environment variables
export CI=true
export FRONTEND_URL=http://localhost:5173
export BASE_URL=http://localhost:5173

# Run tests
npx playwright test --reporter=json > results.json
```

## Configuration

The `playwright.config.js` automatically:

- Detects if running in CI/Docker (doesn't start web server)
- Uses environment variables for URLs
- Configures appropriate reporters (JSON for CI, HTML for local)

## Environment Variables

- `FRONTEND_URL`: Frontend server URL (default: http://localhost:5173)
- `BASE_URL`: Base URL for tests (default: FRONTEND_URL)
- `CI`: Set to true in CI/Docker environments

## Test Structure

All tests are in `todo.test.js` organized by test suites:

- Basic Functionality
- Adding Todos
- Toggling Completion
- Deleting Todos
- Complex Workflows
- Edge Cases
- UI/UX

## Integration with Nomad

The tests are designed to work with the Nomad job configuration:

- Tests run from `/app/tests`
- Frontend runs on port 5173
- Results output as JSON for reporting
