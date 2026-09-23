from fastapi.testclient import TestClient

from main import app
from settings import DEFAULT_CORS_ORIGINS, get_cors_origins


def test_get_cors_origins_default(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert get_cors_origins() == [DEFAULT_CORS_ORIGINS]


def test_get_cors_origins_parses_comma_separated(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS",
        " https://localhost , https://app.example.com , ",
    )
    assert get_cors_origins() == [
        "https://localhost",
        "https://app.example.com",
    ]


def test_get_cors_origins_blank_falls_back(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "  ,  ")
    assert get_cors_origins() == [DEFAULT_CORS_ORIGINS]


def test_allowed_origin_receives_cors_header():
    client = TestClient(app)
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_disallowed_origin_has_no_cors_header():
    client = TestClient(app)
    response = client.get(
        "/health",
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_preflight_allows_configured_origin():
    client = TestClient(app)
    response = client.options(
        "/events",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
