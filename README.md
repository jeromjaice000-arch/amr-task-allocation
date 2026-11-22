# Modular Autonomous Mobile Robot Task Allocation System

An interactive simulation and decision-support platform for task allocation, obstacle-aware pathfinding, and dynamic traffic scheduling across a heterogeneous fleet of Autonomous Mobile Robots (AMRs) in warehouse environments.

Developed as a college CA-1 evaluation project.

---

## Architecture Overview

```text
                  USER DASHBOARD
                        |
                        v
               REACT WEB FRONTEND
       (Animated Warehouse, Gantt Timeline,
        Algorithm Comparison, Controls)
                        |
            REST API (JSON over HTTP)
                        v
                 FASTAPI BACKEND
                        |
                        v
                SIMULATION ENGINE
             +----------+----------+
             |                     |
             v                     v
      NEAREST-AVAILABLE      WORKLOAD-AWARE
      POLICY (Baseline)     POLICY (Proposed)
             |                     |
             +----------+----------+
                        |
                        v
                 A* PATHFINDER
           (Manhattan Heuristic)
                        |
                        v
                TRAFFIC SCHEDULER
         (Continuous Relative Velocity)
                        |
                        v
               METRICS & TIMELINES
```

---

## Key Features

1. **Heterogeneous AMR Fleet Modeling:**
   - Supports robots with different speeds ($1.2 - 2.5\text{ m/s}$) and payload capacities ($25 - 80\text{ kg}$).
   - Enforces strict capacity validation ($C_r \ge w_{\text{task}}$).

2. **$A^*$ Obstacle-Aware Routing:**
   - Navigates around warehouse shelves on a 12×8 grid.
   - Computes deterministic shortest Manhattan paths between initial coordinates, pickup station `(0, 3)`, and delivery station `(11, 3)`.

3. **Two Allocation Algorithms Compared:**
   - **Nearest-Available (Baseline):** Greedy proximity heuristic.
   - **Workload-Aware Optimization (Proposed):** Evaluates traffic-delayed finish times and penalizes overworked robots ($\text{Score} = t_{\text{finish}} + 0.25 \cdot T_{\text{busy}}$).

4. **Continuous Dynamic Traffic Scheduling:**
   - Relative velocity vector collision detection eliminates moving conflicts in transit corridors.
   - Automatically introduces route delays when corridors conflict.
   - **0 moving collisions detected** across all verified scenarios.

5. **Interactive React Visualization Dashboard:**
   - Smooth 60fps waypoint interpolation via `requestAnimationFrame`.
   - Amber pulse halo indicator for traffic-delayed robots.
   - Interactive robot route inspector highlighting planned trajectories.
   - Gantt-style allocation timeline with individual task modals.
   - Side-by-side comparative analytics for Makespan, Utilization Spread, and Throughput.

---

## Verified Benchmark Results

Evaluated across 5 deterministic benchmark scenarios (`backend/benchmark.py`):

| Scenario | Tasks | Metric | Nearest-Available | Workload-Aware | Performance Delta |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Light Workload** | 10 | Makespan<br>Throughput<br>Traffic Delay | 77.53 s<br>464.32 /hr<br>76.50 s | **56.90 s**<br>**632.69 /hr**<br>**16.30 s** | **+26.61% faster**<br>+36.26% throughput<br>**-60.20 s delay** |
| **Moderate Workload** | 20 | Makespan<br>Spread<br>Throughput | 143.90 s<br>39.47%<br>500.35 /hr | **128.60 s**<br>**21.90%**<br>**559.88 /hr** | **+10.63% faster**<br>**+17.57% better spread**<br>+11.90% throughput |
| **Heavy Workload** | 40 | Makespan<br>Spread<br>Throughput | 276.43 s<br>41.87%<br>520.93 /hr | **258.20 s**<br>**21.88%**<br>**557.71 /hr** | **+6.60% faster**<br>**+19.99% better spread**<br>+7.06% throughput |
| **High Heterogeneity** | 20 | Makespan<br>Spread<br>Traffic Delay | 216.57 s<br>78.34%<br>427.20 s | **144.42 s**<br>**52.04%**<br>**199.20 s** | **+33.31% faster**<br>**+26.30% better spread**<br>**-228.00 s delay** |
| **Traffic Congestion** | 20 | Makespan<br>Spread<br>Throughput | 139.90 s<br>40.60%<br>514.66 /hr | **125.00 s**<br>**22.53%**<br>**576.00 /hr** | **+10.65% faster**<br>**+18.07% better spread**<br>+11.92% throughput |

*Dynamic collision count: **0** across all 5 benchmark scenarios.*

---

## Project Structure

```text
amr-task-allocation/
│
├── backend/
│   ├── algorithms/
│   │   ├── nearest.py              # Baseline: Nearest-available heuristic
│   │   └── optimized.py            # Proposed: Workload-aware optimization
│   ├── tests/
│   │   └── test_simulation.py      # Automated pytest suite (20 tests)
│   ├── main.py                     # FastAPI server & route handlers
│   ├── models.py                   # Pydantic schemas (Robot, Task, SimulationRequest)
│   ├── pathfinding.py              # A* search algorithm with Manhattan heuristic
│   ├── routing.py                  # Timed waypoints & traffic-aware path builder
│   ├── simulation.py               # Simulation runner & metrics calculation
│   ├── traffic.py                  # Continuous collision detection validator
│   ├── traffic_scheduler.py        # Relative-velocity conflict avoidance scheduler
│   ├── warehouse.py                # Grid configuration (12x8) and shelf obstacles
│   ├── validate_system.py          # 10-point system validation harness
│   ├── benchmark.py                # 5-scenario performance benchmark suite
│   ├── requirements.txt            # Python dependencies
│   └── venv/                       # Virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx             # Navigation sidebar
│   │   │   ├── RobotPanel.jsx          # Live fleet status & utilization bars
│   │   │   ├── SimulationControls.jsx   # Interactive fleet & task sliders
│   │   │   ├── StatCard.jsx            # Metric cards
│   │   │   ├── WarehouseMap.jsx        # Static grid floor plan
│   │   │   ├── AllocationTimeline.jsx  # Interactive Gantt allocation timeline
│   │   │   ├── AlgorithmComparison.jsx # Side-by-side comparative analytics
│   │   │   └── AnimatedWarehouse.jsx   # 60fps A* trajectory playback & inspector
│   │   ├── services/
│   │   │   └── api.js                  # REST API communication client
│   │   ├── data/
│   │   │   └── mockData.js             # Initial warehouse & fleet constants
│   │   └── App.jsx                     # Root React application
│   └── package.json
│
├── PROJECT_REPORT.md               # Complete academic technical report (20 sections)
├── PRESENTATION_AND_VIVA.md        # 12-slide presentation plan & Top 10 viva Q&A
├── .gitignore                      # Git ignore file
└── README.md                       # Main documentation
```

---

## Installation & Setup

### Prerequisites
- macOS (tested on Apple Silicon M1), Linux, or Windows.
- Python 3.10+ (tested on Python 3.13).
- Node.js 18+ and npm.

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

---

## How to Run

### 1. Start the Backend API Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Dashboard
In a new terminal window:
```bash
cd frontend
npm run dev
```
- Open your browser at: `http://localhost:5173`

---

## Running Verification & Automated Tests

### Run the 10-Point End-to-End System Validation
```bash
cd backend
source venv/bin/activate
python validate_system.py
```

### Run the Pytest Unit Test Suite
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```
*(All 20 unit tests pass).*

### Run the Performance Benchmark Suite
```bash
cd backend
source venv/bin/activate
python benchmark.py
```

---

## Academic Notes & Limitations

> [!NOTE]
> **Dynamic Trajectory Deconfliction vs. Stationary Occupancy:**
> The `TrafficScheduler` uses relative velocity vector checks to resolve **moving-path collisions** across continuous time intervals, ensuring zero collisions in shared transit corridors.
> 
> Because all jobs in the current warehouse model deliver to the single drop station $(11, 3)$, robots that finish tasks remain idle at $(11, 3)$ until reassigned. In real-world automated logistics, this is handled by post-delivery dispatch to designated parking/charging bays.
