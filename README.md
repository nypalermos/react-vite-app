# React Vite Full-Stack Application

React + Vite frontend, FastAPI backend, MongoDB, and optional Vault for local secure mode.

![CI](https://github.com/nypalermos/react-vite-app/actions/workflows/ci.yml/badge.svg)

## Project structure

| Folder | Description |
|---|---|
| `my-react-application/` | React frontend (Vite) |
| `python-api/` | FastAPI backend |
| `docker/` | MongoDB, Vault, and production compose |
| `RUNBOOK.md` | Local development runbook |

## Local development

See [RUNBOOK.md](RUNBOOK.md) for full setup in simple and secure modes.

## CI/CD

### Branching

| Branch | Purpose |
|---|---|
| `develop` | Integration branch for feature PRs; **CI only** |
| `main` | Release branch; **CI**, then **Deploy** to GHCR |

Typical flow: `feature/*` → PR into `develop` → later PR `develop` → `main`.

### Continuous integration

On every push and pull request to `develop` or `main`, GitHub Actions runs:

- **Python API** — `pytest` (in-memory MongoDB mock; no Docker required)
- **React frontend** — ESLint, Vitest, and production build

### Continuous deployment

After CI passes on a **push** to `main` (for example merging `develop` into `main`), images are built and pushed to GitHub Container Registry:

- `ghcr.io/<owner>/react-api:latest`
- `ghcr.io/<owner>/react-web:latest`

### Run checks locally before pushing

```powershell
cd python-api
.\.venv\Scripts\Activate.ps1
python -m pytest

cd ..\my-react-application
npm run lint
npm test
npm run build
```

### Deploy from GHCR

1. Copy `docker/.env.example` to `docker/.env` and set your GitHub username and image names.
2. Ensure you can pull from GHCR (packages may be private by default).
3. Start the stack:

```powershell
cd docker
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

Open http://localhost:8080

### Recommended GitHub settings

- Protect `develop` and `main`; require the **CI** workflow to pass before merge.
- Prefer PRs into `develop` for day-to-day work; merge `develop` → `main` when you want a release/deploy.
- Dependabot is configured in `.github/dependabot.yml` for weekly npm and pip updates.
