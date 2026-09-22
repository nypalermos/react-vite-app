def test_login_returns_access_token(client):
    response = client.post(
        "/auth/login",
        json={"username": "admin", "password": "admin"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str)
    assert len(body["access_token"]) > 0


def test_login_rejects_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={"username": "admin", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_write_endpoints_reject_invalid_token(client, events_collection):
    headers = {"Authorization": "Bearer not-a-real-token"}

    response = client.post(
        "/events",
        headers=headers,
        json={
            "event_name": "Nope",
            "event_description": "Nope",
            "event_type": "Real",
            "incidents": [],
        },
    )

    assert response.status_code == 401
