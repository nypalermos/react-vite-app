# Application Runbook

This runbook covers how to run the full stack locally in **simple mode** (no MongoDB auth, no Vault) or **secure mode** (MongoDB auth + Vault secrets).

## Architecture

```text
Browser (http://localhost:5173)
  -> Vite React app (my-react-application)
  -> /api/* proxied to Python API (http://127.0.0.1:8000)
      -> MongoDB (http://localhost:27017)
      -> Vault (secure mode only, http://localhost:8200)
```


| Component           | Folder                 | Port  |
| ------------------- | ---------------------- | ----- |
| React frontend      | `my-react-application` | 5173  |
| Python API          | `python-api`           | 8000  |
| MongoDB             | Docker                 | 27017 |
| Vault (secure only) | Docker                 | 8200  |


Only one Docker mode can run at a time. Both use port `27017` for MongoDB.

---



## Prerequisites

Install these before starting:

- **Node.js** (LTS recommended)
- **Python 3.11+**
- **Docker Desktop** (running)

Verify:

```powershell
node -v
python --version
docker --version
```

---



## One-Time Setup



### 1. Install frontend dependencies

```powershell
cd C:\Projects\REACT\my-react-application
npm install
```



### 2. Install Python dependencies

```powershell
cd C:\Projects\REACT\python-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Keep the virtual environment activated whenever you run the API.

---



## Simple Mode (Regular Dev)

Use this for everyday React/API work. MongoDB has **no authentication**. Vault is **not** used.

### Step 1: Start MongoDB

```powershell
cd C:\Projects\REACT\docker
.\up.ps1
```

This starts MongoDB only, using the `mongodb-data` volume.

### Step 2: Seed sample event data (first time only)

If you have not loaded the sample event yet, run:

```powershell
docker exec -it mongodb mongosh
```

In the `mongosh` shell:

```javascript
use react_vite_app

db.events.replaceOne(
  { event_id: 1 },
  {
    event_id: 1,
    event_name: "Quarterly Security Review",
    event_description: "Review of reported activity across production systems during Q2.",
    event_type: "Both",
    incidents: [
      {
        username: "jsmith",
        comment: "Unusual login pattern detected from a new device."
      },
      {
        username: "alee",
        comment: "Confirmed as legitimate after follow-up."
      }
    ]
  },
  { upsert: true }
)
```

Type `exit` to leave `mongosh`.

### Step 3: Start the Python API

Open a **new terminal**:

```powershell
cd C:\Projects\REACT\python-api
.\.venv\Scripts\Activate.ps1
$env:APP_MODE = "simple"
python main.py
```

API runs at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

### Step 4: Start the React frontend

Open another **new terminal**:

```powershell
cd C:\Projects\REACT\my-react-application
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### Simple mode verification


| Check          | Command / URL                                                    | Expected                          |
| -------------- | ---------------------------------------------------------------- | --------------------------------- |
| API health     | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)     | `{"status":"ok","mode":"simple"}` |
| API time       | [http://127.0.0.1:8000/time](http://127.0.0.1:8000/time)         | JSON with UTC timestamp           |
| Event data     | [http://127.0.0.1:8000/events/1](http://127.0.0.1:8000/events/1) | Sample event JSON                 |
| Event list     | [http://127.0.0.1:8000/events](http://127.0.0.1:8000/events)     | JSON array of event summaries     |
| Frontend proxy | [http://localhost:5173](http://localhost:5173)                   | Home page loads                   |
| Events page    | [http://localhost:5173/events](http://localhost:5173/events)     | Event list with Edit links        |


---



## Secure Mode (Auth + Vault)

Use this to practice the production-like flow: MongoDB requires credentials, and the API reads them from Vault.

### Step 1: Start MongoDB + Vault

```powershell
cd C:\Projects\REACT\docker
.\up-secure.ps1
```

This script:

1. Stops simple mode if it is running
2. Starts MongoDB (with auth) and Vault
3. Initializes Vault (first run)
4. Stores MongoDB credentials in Vault at `secret/mongodb`
5. Seeds the sample event into MongoDB automatically

Secure mode uses separate volumes:

- `mongodb-secure-data`
- `vault-data`



### Secure dev credentials


| Item                | Value                                          |
| ------------------- | ---------------------------------------------- |
| Mongo root user     | `devroot`                                      |
| Mongo root password | `devrootpassword`                              |
| Mongo app user      | `app_user`                                     |
| Mongo app password  | `app_password`                                 |
| Vault UI            | [http://localhost:8200](http://localhost:8200) |
| Vault root token    | stored in `docker/vault-keys.json`             |


These are for **local development only**.

### Step 2: Start the Python API

Open a **new terminal**:

```powershell
cd C:\Projects\REACT\docker
$env:APP_MODE = "secure"
$env:VAULT_TOKEN = (Get-Content .\vault-keys.json | ConvertFrom-Json).root_token

cd ..\python-api
.\.venv\Scripts\Activate.ps1
python main.py
```

The API authenticates to Vault, reads the MongoDB URI from `secret/mongodb`, then connects to MongoDB.

### Step 3: Start the React frontend

Open another **new terminal**:

```powershell
cd C:\Projects\REACT\my-react-application
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

### Secure mode verification


| Check        | Command / URL                                                                                              | Expected                          |
| ------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------- |
| API health   | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)                                               | `{"status":"ok","mode":"secure"}` |
| Vault status | `docker exec -e VAULT_ADDR=http://127.0.0.1:8201 vault vault status`                                       | Initialized, not sealed           |
| Vault secret | `docker exec -e VAULT_ADDR=http://127.0.0.1:8201 -e VAULT_TOKEN=<token> vault vault kv get secret/mongodb` | Mongo URI stored                  |
| Events page  | [http://localhost:5173/events](http://localhost:5173/events)                                               | Event list loads from DB          |


---



## Stopping Everything

```powershell
cd C:\Projects\REACT\docker
.\down.ps1
```

Stop the Python API and React dev server with `Ctrl+C` in their terminals.

---



## Switching Between Modes

You cannot run both modes at the same time.

```powershell
cd C:\Projects\REACT\docker
.\down.ps1
```

Then start the mode you want:

- Simple: `.\up.ps1`
- Secure: `.\up-secure.ps1`

Restart the Python API with the matching `APP_MODE`.


| Mode   | `APP_MODE` | Mongo volume          | Vault    |
| ------ | ---------- | --------------------- | -------- |
| Simple | `simple`   | `mongodb-data`        | Not used |
| Secure | `secure`   | `mongodb-secure-data` | Required |


---



## API Endpoints


| Endpoint              | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `GET /health`         | Health check (includes `mode`)                                         |
| `GET /time`           | Current UTC time                                                       |
| `GET /events`         | Paginated event list (`limit`, `offset`, optional `event_type` filter) |
| `GET /events/{id}`    | Full event by ID from MongoDB                                          |
| `POST /events`        | Create a new event (returns full event, status 201)                    |
| `PUT /events/{id}`    | Replace an existing event (404 if missing)                             |
| `DELETE /events/{id}` | Delete an event (204 on success, 404 if missing)                       |


From the React app, these are called via `/api/...` (Vite proxies to port 8000).

---



## Frontend Routes


| URL                 | Page                                                |
| ------------------- | --------------------------------------------------- |
| `/`                 | Home (time button)                                  |
| `/events`           | Event list with filter, pagination, Add/Edit/Delete |
| `/events/new`       | Create a new event                                  |
| `/events/{id}/edit` | Edit an existing event                              |
| `/about`            | About page                                          |




### Manage events (UI check)

1. Open [http://localhost:5173/events](http://localhost:5173/events) — the seeded event appears in the list.
2. Click **Edit** on event 1 — change the description, add an incident row, save.
3. Confirm the list reflects your changes after save.
4. Click **Add event** — create a new event; it appears with the next auto-assigned ID.

---



## Environment Variables (Python API)


| Variable                    | Simple            | Secure       | Default                     |
| --------------------------- | ----------------- | ------------ | --------------------------- |
| `APP_MODE`                  | `simple`          | `secure`     | `simple`                    |
| `MONGODB_URI`               | Optional override | Not used     | `mongodb://localhost:27017` |
| `MONGODB_DATABASE`          | Optional          | Optional     | `react_vite_app`            |
| `MONGODB_EVENTS_COLLECTION` | Optional          | Optional     | `events`                    |
| `VAULT_ADDR`                | Not used          | Optional     | `http://127.0.0.1:8200`     |
| `VAULT_TOKEN`               | Not used          | **Required** | none                        |


---



## Troubleshooting



### Port already in use

- **5173** — another Vite dev server is running
- **8000** — another Python API instance is running
- **27017** — MongoDB container or another Mongo instance is running
- **8200** — Vault container is running

Stop the conflicting process or run `.\down.ps1`.

### Events page returns 404

The sample event is missing from MongoDB. Re-seed using the `mongosh` commands in simple mode, or restart secure mode with a fresh `mongodb-secure-data` volume.

### Secure mode: API cannot connect to Vault

1. Confirm Vault is running: `docker compose -f docker-compose.secure.yml ps`
2. Confirm `VAULT_TOKEN` is set from `vault-keys.json`
3. Re-run `.\init-vault.ps1` and `.\seed-vault.ps1` if needed



### Vault init fails or `vault-keys.json` is missing

Reset Vault and start over:

```powershell
cd C:\Projects\REACT\docker
.\reset-vault.ps1
.\init-vault.ps1
.\seed-vault.ps1
```



### Wrong mode after switching Docker stacks

Restart the Python API with the correct `APP_MODE`. Check [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) to confirm.

---



## Quick Reference



### Simple mode (3 terminals)

```powershell
# Terminal 1 - Docker
cd C:\Projects\REACT\docker
.\up.ps1

# Terminal 2 - API
cd C:\Projects\REACT\python-api
.\.venv\Scripts\Activate.ps1
$env:APP_MODE = "simple"
python main.py

# Terminal 3 - Frontend
cd C:\Projects\REACT\my-react-application
npm run dev
```



### Secure mode (3 terminals)

```powershell
# Terminal 1 - Docker
cd C:\Projects\REACT\docker
.\up-secure.ps1

# Terminal 2 - API
cd C:\Projects\REACT\docker
$env:APP_MODE = "secure"
$env:VAULT_TOKEN = (Get-Content .\vault-keys.json | ConvertFrom-Json).root_token
cd ..\python-api
.\.venv\Scripts\Activate.ps1
python main.py

# Terminal 3 - Frontend
cd C:\Projects\REACT\my-react-application
npm run dev
```

---



## CI/CD

GitHub Actions runs on every push and pull request to `main`. See [README.md](README.md) for repository setup and deployment overview.

### What runs in CI


| Job            | Command                                     | Notes                       |
| -------------- | ------------------------------------------- | --------------------------- |
| Python API     | `pytest` in `python-api/`                   | Uses in-memory MongoDB mock |
| React frontend | `npm run lint`, `npm test`, `npm run build` | No running API required     |




### Pre-push checks (run locally)

```powershell
cd C:\Projects\REACT\python-api
.\.venv\Scripts\Activate.ps1
python -m pytest

cd C:\Projects\REACT\my-react-application
npm run lint
npm test
npm run build
```



### Deployment (after merge to main)

When CI passes on `main`, GitHub Actions builds and pushes Docker images to GHCR:

- `ghcr.io/<your-github-username>/react-api:latest`
- `ghcr.io/<your-github-username>/react-web:latest`

To run the production stack locally or on a host:

1. Copy `docker/.env.example` to `docker/.env` and set `API_IMAGE` and `WEB_IMAGE`.
2. Run:

```powershell
cd C:\Projects\REACT\docker
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

1. Open [http://localhost:8080](http://localhost:8080)



### GitHub repo settings

- Protect `main` and require the **CI** workflow to pass before merge.
- Dependabot opens monthly PRs for npm and pip dependency updates.

