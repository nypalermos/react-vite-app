import os

import hvac

APP_MODE = os.getenv("APP_MODE", "simple").lower()
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "react_vite_app")
MONGODB_EVENTS_COLLECTION = os.getenv("MONGODB_EVENTS_COLLECTION", "events")

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://127.0.0.1:8200")
VAULT_TOKEN = os.getenv("VAULT_TOKEN")
VAULT_MONGO_SECRET_PATH = os.getenv("VAULT_MONGO_SECRET_PATH", "secret/data/mongodb")

SIMPLE_MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

# Auth (env-configured admin for write endpoints)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

# Comma-separated browser origins allowed by CORS (Vite default for local dev).
DEFAULT_CORS_ORIGINS = "http://localhost:5173"


def get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or [DEFAULT_CORS_ORIGINS]


def get_mongodb_uri() -> str:
    """Return the MongoDB URI for the configured application mode."""
    if APP_MODE == "simple":
        return SIMPLE_MONGODB_URI

    if APP_MODE != "secure":
        raise ValueError(
            f"Unsupported APP_MODE '{APP_MODE}'. Use 'simple' or 'secure'."
        )

    if not VAULT_TOKEN:
        raise RuntimeError(
            "APP_MODE=secure requires VAULT_TOKEN to read MongoDB credentials."
        )

    client = hvac.Client(url=VAULT_ADDR, token=VAULT_TOKEN)
    if not client.is_authenticated():
        raise RuntimeError("Vault authentication failed. Check VAULT_ADDR and VAULT_TOKEN.")

    secret = client.secrets.kv.v2.read_secret_version(path="mongodb")
    data = secret["data"]["data"]
    uri = data.get("uri")
    if not uri:
        raise RuntimeError("Vault secret 'secret/mongodb' is missing a 'uri' field.")

    return uri
