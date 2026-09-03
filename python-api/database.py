from pymongo import MongoClient
from pymongo.collection import Collection

from schemas import Event, EventCreate, EventSummary, EventType, EventUpdate
from settings import (
    MONGODB_DATABASE,
    MONGODB_EVENTS_COLLECTION,
    get_mongodb_uri,
)

_client = MongoClient(get_mongodb_uri())
_events_collection: Collection = _client[MONGODB_DATABASE][MONGODB_EVENTS_COLLECTION]

DEFAULT_PAGE_LIMIT = 10
MAX_PAGE_LIMIT = 100


def _build_list_query(event_type: EventType | None) -> dict:
    if event_type is None:
        return {}
    return {"event_type": event_type.value}


def list_events(
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0,
    event_type: EventType | None = None,
) -> tuple[list[EventSummary], int]:
    query = _build_list_query(event_type)
    projection = {"event_id": 1, "event_name": 1, "event_type": 1, "_id": 0}

    total = _events_collection.count_documents(query)
    documents = (
        _events_collection.find(query, projection)
        .sort("event_id", 1)
        .skip(offset)
        .limit(limit)
    )
    items = [EventSummary.model_validate(document) for document in documents]
    return items, total


def get_event_by_id(event_id: int) -> Event | None:
    document = _events_collection.find_one({"event_id": event_id})
    if document is None:
        return None

    return Event.model_validate(document)


def create_event(payload: EventCreate) -> Event:
    latest = _events_collection.find_one(sort=[("event_id", -1)])
    next_event_id = 1 if latest is None else latest["event_id"] + 1

    document = {"event_id": next_event_id, **payload.model_dump()}
    _events_collection.insert_one(document)
    return Event.model_validate(document)


def update_event(event_id: int, payload: EventUpdate) -> Event | None:
    document = {"event_id": event_id, **payload.model_dump()}
    result = _events_collection.replace_one({"event_id": event_id}, document)
    if result.matched_count == 0:
        return None

    return Event.model_validate(document)


def delete_event(event_id: int) -> bool:
    result = _events_collection.delete_one({"event_id": event_id})
    return result.deleted_count > 0
