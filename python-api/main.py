from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from database import create_event, get_event_by_id, list_events, update_event
from schemas import Event, EventCreate, EventSummary, EventUpdate
from settings import APP_MODE

app = FastAPI(title="React Vite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT"],
)

API_PORT = 8000


@app.get("/health")
def health_check():
    return {"status": "ok", "mode": APP_MODE}


@app.get("/time")
def get_current_time():
    return {"time": datetime.now(timezone.utc).isoformat()}


@app.get("/events", response_model=list[EventSummary])
def get_events():
    try:
        return list_events()
    except (PyMongoError, RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=API_PORT, reload=True)
