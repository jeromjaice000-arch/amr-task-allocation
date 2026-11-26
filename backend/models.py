import math
from pydantic import BaseModel, Field, field_validator


class Robot(BaseModel):
    id: int
    name: str
    x: int
    y: int
    speed: float = Field(gt=0)
    capacity: float = Field(gt=0)
    available_at: float = 0.0
    busy_time: float = 0.0

    @field_validator("speed", "capacity")
    @classmethod
    def check_finite_positive(cls, v: float) -> float:
        if not math.isfinite(v) or v <= 0:
            raise ValueError("Value must be a finite positive number")
        return v


class Task(BaseModel):
    id: int
    pickup_x: int
    pickup_y: int
    delivery_x: int
    delivery_y: int
    weight: float = Field(gt=0)
    arrival_time: float = 0.0

    @field_validator("weight")
    @classmethod
    def check_finite_weight(cls, v: float) -> float:
        if not math.isfinite(v) or v <= 0:
            raise ValueError("Task weight must be a finite positive number")
        return v


class SimulationRequest(BaseModel):
    robots: list[Robot]
    tasks: list[Task]
