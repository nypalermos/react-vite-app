from __future__ import annotations

from copy import deepcopy
from typing import Any

import pytest
from fastapi.testclient import TestClient

import database
from main import app
from schemas import Event, EventCreate, EventType, Incident


class InMemoryEventsCollection:
    def __init__(self) -> None:
        self._documents: list[dict[str, Any]] = []

    def clear(self) -> None:
        self._documents.clear()

    def seed(self, *documents: dict[str, Any]) -> None:
        self._documents = [deepcopy(document) for document in documents]

    def find(self, query: dict[str, Any], projection: dict[str, int] | None = None):
        matched = [document for document in self._documents if _matches(document, query)]
        matched.sort(key=lambda document: document["event_id"])

        if projection:
            matched = [_project(document, projection) for document in matched]

        return _Cursor(matched)

    def find_one(
        self,
        query: dict[str, Any] | None = None,
        sort: list[tuple[str, int]] | None = None,
        projection: dict[str, int] | None = None,
    ) -> dict[str, Any] | None:
        if query is None and sort:
            if not self._documents:
                return None
            field, direction = sort[0]
            selector = max if direction < 0 else min
            document = selector(self._documents, key=lambda item: item[field])
            return _project(document, projection) if projection else deepcopy(document)

        if query is None:
            return None

        for document in self._documents:
            if _matches(document, query):
                return _project(document, projection) if projection else deepcopy(document)

        return None

    def insert_one(self, document: dict[str, Any]) -> None:
        self._documents.append(deepcopy(document))

    def replace_one(self, query: dict[str, Any], document: dict[str, Any]):
        for index, existing in enumerate(self._documents):
            if _matches(existing, query):
                self._documents[index] = deepcopy(document)
                return _ReplaceResult(matched_count=1)

        return _ReplaceResult(matched_count=0)


class _Cursor:
    def __init__(self, documents: list[dict[str, Any]]) -> None:
        self._documents = documents

    def sort(self, field: str, direction: int):
        reverse = direction < 0
        self._documents.sort(key=lambda document: document[field], reverse=reverse)
        return self

    def __iter__(self):
        return iter(self._documents)


class _ReplaceResult:
    def __init__(self, matched_count: int) -> None:
        self.matched_count = matched_count


def _matches(document: dict[str, Any], query: dict[str, Any]) -> bool:
    return all(document.get(key) == value for key, value in query.items())


def _project(document: dict[str, Any], projection: dict[str, int]) -> dict[str, Any]:
    projected = deepcopy(document)

    if projection.get("_id") == 0:
        projected.pop("_id", None)

    included_fields = [key for key, value in projection.items() if key != "_id" and value]
    if included_fields:
        return {key: projected[key] for key in included_fields if key in projected}

    return projected


@pytest.fixture
def events_collection(monkeypatch: pytest.MonkeyPatch) -> InMemoryEventsCollection:
    collection = InMemoryEventsCollection()
    monkeypatch.setattr(database, "_events_collection", collection)
    return collection


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_event() -> Event:
    return Event(
        event_id=1,
        event_name="Quarterly Security Review",
        event_description="Review of reported activity during Q2.",
        event_type=EventType.BOTH,
        incidents=[
            Incident(username="jsmith", comment="Unusual login pattern detected."),
        ],
    )


@pytest.fixture
def sample_create_payload() -> EventCreate:
    return EventCreate(
        event_name="New Event",
        event_description="A newly created event.",
        event_type=EventType.REAL,
        incidents=[],
    )
