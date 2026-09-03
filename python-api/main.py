from datetime import datetime, timezone
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from database import (
    MAX_PAGE_LIMIT,
    create_event,
    delete_event,
    get_event_by_id,
    list_events,
    update_event,
)
from schemas import Event, EventCreate, EventListResponse, EventSummary, EventType, EventUpdate
from settings import APP_MODE

app = FastAPI(title="React Vite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
)

API_PORT = 8000


@app.get("/health")
def health_check():
    return {"status": "ok", "mode": APP_MODE}


@app.get("/time")
def get_current_time():
    return {"time": datetime.now(timezone.utc).isoformat()}


@app.get("/events", response_model=EventListResponse)
def get_events(
    limit: Annotated[int, Query(ge=1, le=MAX_PAGE_LIMIT)] = 10,
    offset: Annotated[int, Query(ge=0)] = 0,
    event_type: EventType | None = None,
):
    try:
        items, total = list_events(limit=limit, offset=offset, event_type=event_type)
    except (PyMongoError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    return EventListResponse(items=items, total=total, limit=limit, offset=offset)


@app.get("/events/{event_id}", response_model=Event)
def get_event(event_id: int):
    try:
        event = get_event_by_id(event_id)
    except (PyMongoError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return event


@app.post("/events", response_model=Event, status_code=201)
def post_event(payload: EventCreate):
    try:
        return create_event(payload)
    except (PyMongoError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error


@app.put("/events/{event_id}", response_model=Event)
def put_event(event_id: int, payload: EventUpdate):
    try:
        event = update_event(event_id, payload)
    except (PyMongoError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return event


@app.delete("/events/{event_id}", status_code=204)
def remove_event(event_id: int):
    try:
        deleted = delete_event(event_id)
    except (PyMongoError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    if not deleted:
        raise HTTPException(status_code=404, detail="Event not found")

    return Response(status_code=204)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=API_PORT, reload=True)
