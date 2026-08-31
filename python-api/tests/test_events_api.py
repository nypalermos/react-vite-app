from schemas import EventType


def test_get_events_returns_empty_list(client, events_collection):
    response = client.get("/events")

    assert response.status_code == 200
    assert response.json() == []


def test_get_events_returns_summaries(client, events_collection, sample_event):
    events_collection.seed(sample_event.model_dump())

    response = client.get("/events")

    assert response.status_code == 200
    assert response.json() == [
        {
            "event_id": 1,
            "event_name": "Quarterly Security Review",
            "event_type": EventType.BOTH.value,
        }
    ]


def test_get_event_returns_full_event(client, events_collection, sample_event):
    events_collection.seed(sample_event.model_dump())

    response = client.get("/events/1")

    assert response.status_code == 200
    assert response.json()["event_id"] == 1
    assert response.json()["event_name"] == "Quarterly Security Review"
    assert len(response.json()["incidents"]) == 1


def test_get_event_returns_404_when_missing(client, events_collection):
    response = client.get("/events/404")

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"


def test_post_event_creates_event(client, events_collection):
    payload = {
        "event_name": "Created via API",
        "event_description": "Created from a test.",
        "event_type": "Real",
        "incidents": [
            {"username": "tester", "comment": "Created in pytest."},
        ],
    }

    response = client.post("/events", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["event_id"] == 1
    assert body["event_name"] == "Created via API"
    assert body["incidents"][0]["username"] == "tester"


def test_post_event_rejects_invalid_payload(client, events_collection):
    response = client.post(
        "/events",
        json={
            "event_name": "Missing fields",
        },
    )

    assert response.status_code == 422


def test_put_event_updates_existing_event(client, events_collection, sample_event):
    events_collection.seed(sample_event.model_dump())
    payload = {
        "event_name": "Updated via API",
        "event_description": "Updated from a test.",
        "event_type": "Fake",
        "incidents": [],
    }

    response = client.put("/events/1", json=payload)

    assert response.status_code == 200
    assert response.json()["event_name"] == "Updated via API"
    assert response.json()["event_type"] == "Fake"


def test_put_event_returns_404_when_missing(client, events_collection):
    payload = {
        "event_name": "Ghost Event",
        "event_description": "Should not exist.",
        "event_type": "Both",
        "incidents": [],
    }

    response = client.put("/events/99", json=payload)

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"
