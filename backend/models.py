
from pydantic import BaseModel, Field


class Robot(BaseModel):
    id: int
    name: str
    x: int
    y: int
    speed: float = Field(gt=0)
    capacity: float = Field(gt=0)
    available_at: float = 0.0
    busy_time: float = 0.0


class Task(BaseModel):
    id: int
    pickup_x: int
    pickup_y: int
    delivery_x: int
    delivery_y: int
    weight: float = Field(gt=0)
    arrival_time: float = 0.0


class SimulationRequest(BaseModel):
    robots: list[Robot]
    tasks: list[Task]
