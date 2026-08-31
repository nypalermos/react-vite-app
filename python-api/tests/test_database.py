from schemas import Event, EventCreate, EventType, Incident
from database import (
    create_event,
    get_event_by_id,
    list_events,
    update_event,
)


def test_list_events_returns_sorted_summaries(events_collection, sample_event):
    events_collection.seed(sample_event.model_dump(), {
        "event_id": 2,
        "event_name": "Second Event",
        "event_type": "Fake",
    })

    summaries = list_events()

    assert len(summaries) == 2
    assert summaries[0].event_id == 1
    assert summaries[0].event_name == "Quarterly Security Review"
    assert summaries[1].event_id == 2


def test_get_event_by_id_returns_none_when_missing(events_collection):
    assert get_event_by_id(99) is None


def test_get_event_by_id_returns_event(events_collection, sample_event):
    events_collection.seed(sample_event.model_dump())

    event = get_event_by_id(1)

    assert event == sample_event


def test_create_event_assigns_incrementing_id(events_collection, sample_create_payload):
    events_collection.seed({
        "event_id": 3,
        "event_name": "Existing",
        "event_description": "Already there",
        "event_type": "Fake",
        "incidents": [],
    })

    created = create_event(sample_create_payload)

    assert created.event_id == 4
    assert created.event_name == "New Event"
    assert get_event_by_id(4) == created


def test_create_event_starts_at_one_when_collection_empty(
    events_collection,
    sample_create_payload,
):
    created = create_event(sample_create_payload)

    assert created.event_id == 1


def test_update_event_replaces_document(events_collection, sample_event):
    events_collection.seed(sample_event.model_dump())
    payload = EventCreate(
        event_name="Updated Name",
        event_description="Updated description.",
        event_type=EventType.FAKE,
        incidents=[Incident(username="alee", comment="Follow-up complete.")],
    )

    updated = update_event(1, payload)

    assert updated is not None
    assert updated.event_name == "Updated Name"
    assert updated.event_type == EventType.FAKE
    assert get_event_by_id(1) == updated


def test_update_event_returns_none_when_missing(events_collection, sample_create_payload):
    assert update_event(42, sample_create_payload) is None
