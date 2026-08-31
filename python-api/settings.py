import os

import hvac

APP_MODE = os.getenv("APP_MODE", "simple").lower()
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "react_vite_app")
MONGODB_EVENTS_COLLECTION = os.getenv("MONGODB_EVENTS_COLLECTION", "events")

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://127.0.0.1:8200")
VAULT_TOKEN = os.getenv("VAULT_TOKEN")
VAULT_MONGO_SECRET_PATH = os.getenv("VAULT_MONGO_SECRET_PATH", "secret/data/mongodb")

SIMPLE_MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")


def get_mongodb_uri() -> str:
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
