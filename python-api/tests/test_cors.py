import pytest


@pytest.mark.parametrize(
    "origin",
    ["http://localhost:5173", "http://localhost:8080"],
)
def test_cors_allows_trusted_application_origins(client, origin):
    response = client.options(
        "/events",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_rejects_untrusted_origins(client):
    response = client.options(
        "/events",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
