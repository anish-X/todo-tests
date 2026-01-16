# Docker/Nomad Configuration

## How Tests Work in Docker/Nomad

The tests are designed to work in the Nomad job environment where:

1. **Frontend** is cloned to `/app/student/frontend`
2. **Tests** are cloned to `/app/tests`
3. Frontend server is started manually before tests run
4. Tests run from `/app/student` directory

## Nomad Job Execution Flow

```bash
# 1. Frontend is started (from Nomad job script)
cd /app/student/frontend
npm install
npx vite --host 0.0.0.0 --port 5173 &

# 2. Tests are run (from Nomad job script)
cd /app/student
npx playwright test /app/tests --reporter=json
```

## Configuration

The Playwright config automatically detects Docker/CI environment:
- Sets `isCI = true` when `CI=true`, `NOMAD_JOB_NAME`, or `DOCKER_ENV` is set
- Does NOT start web server (assumes it's already running)
- Uses JSON reporter for results
- Points to `http://localhost:5173` or `http://127.0.0.1:5173`

## Environment Variables

You can override these in the Nomad job if needed:

```bash
export CI=true                    # Enable CI mode
export FRONTEND_URL=http://127.0.0.1:5173  # Frontend URL
export BASE_URL=http://127.0.0.1:5173       # Base URL for tests
```

## Troubleshooting

### Tests not found
- Ensure tests are cloned to `/app/tests`
- Check that `npx playwright test /app/tests` uses absolute path

### Frontend not accessible
- Verify frontend is running on port 5173
- Check `FRONTEND_URL` environment variable
- Ensure `network_mode=host` in Docker config

### Web server starting when it shouldn't
- Set `CI=true` or `NOMAD_JOB_NAME` environment variable
- The config checks for these to disable web server
