from fastapi import HTTPException
from models import SimulationRequest
from simulation import run_simulation
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AMR Task Allocation API",
    description="Backend for warehouse robot task allocation simulation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def home():
    return {
        "message": "AMR Task Allocation API",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AMR Simulation Backend"
    }


@app.post("/api/simulate")
def simulate(
    request: SimulationRequest,
    algorithm: str = "nearest"
):
    try:
        return run_simulation(request, algorithm)
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        ) from error
