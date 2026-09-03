from schemas import EventCreate, EventType, Incident
from database import (
    create_event,
    delete_event,
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

    items, total = list_events()

    assert total == 2
    assert len(items) == 2
    assert items[0].event_id == 1
    assert items[0].event_name == "Quarterly Security Review"
    assert items[1].event_id == 2


def test_list_events_supports_pagination(events_collection, sample_event):
    events_collection.seed(
        sample_event.model_dump(),
        {
            "event_id": 2,
            "event_name": "Second Event",
            "event_type": "Fake",
            "event_description": "Second",
            "incidents": [],
        },
        {
            "event_id": 3,
            "event_name": "Third Event",
            "event_type": "Real",
            "event_description": "Third",
            "incidents": [],
        },
    )

    items, total = list_events(limit=1, offset=1)

    assert total == 3
    assert len(items) == 1
    assert items[0].event_id == 2


def test_list_events_filters_by_event_type(events_collection, sample_event):
    events_collection.seed(
        sample_event.model_dump(),
        {
            "event_id": 2,
            "event_name": "Second Event",
            "event_type": "Fake",
            "event_description": "Second",
            "incidents": [],
        },
    )

    items, total = list_events(event_type=EventType.BOTH)

    assert total == 1
    assert len(items) == 1
    assert items[0].event_id == 1


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


def test_delete_event_removes_document(events_collection, sample_event):
    events_collection.seed(sample_event.model_dump())

    assert delete_event(1) is True
    assert get_event_by_id(1) is None


def test_delete_event_returns_false_when_missing(events_collection):
    assert delete_event(99) is False
