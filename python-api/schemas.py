from enum import Enum

from pydantic import BaseModel, Field


class EventType(str, Enum):
    REAL = "Real"
    FAKE = "Fake"
    BOTH = "Both"


class Incident(BaseModel):
    username: str
    comment: str


class EventBase(BaseModel):
    event_name: str = Field(..., description="Name of the event")
    event_description: str = Field(..., description="Description of the event")
    event_type: EventType
    incidents: list[Incident]


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class Event(EventBase):
    event_id: int = Field(..., description="Unique event identifier")


class EventSummary(BaseModel):
    event_id: int
    event_name: str
    event_type: EventType


class EventListResponse(BaseModel):
    items: list[EventSummary]
    total: int
    limit: int
    offset: int
