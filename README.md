# Modular Autonomous Mobile Robot Task Allocation System

An interactive simulation and decision-support platform for task allocation, obstacle-aware pathfinding, and dynamic traffic scheduling across a heterogeneous fleet of Autonomous Mobile Robots (AMRs) in warehouse environments.

Developed as a college project.

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

1. **Customizable Heterogeneous AMR Fleet Modeling:**
   - Supports robots with customizable movement speeds ($1.2 - 2.5\text{ m/s}$ default) and payload capacities ($25 - 80\text{ kg}$ default).
   - Enforces strict frontend and backend validation (rejecting zero, negative, `NaN`, and `Infinity`) plus practicality warnings outside recommended operating ranges ($0.2 - 3.0\text{ m/s}$, $5 - 200\text{ kg}$).
   - Gracefully marks tasks exceeding maximum fleet capacity as unassignable with clear explanations rather than failing.

2. **$A^*$ Obstacle-Aware Routing:**
   - Navigates around warehouse shelves on a 12×8 grid.
   - Computes deterministic shortest Manhattan paths between initial coordinates, pickup station `(0, 3)`, and delivery station `(11, 3)`.

3. **Two Allocation Algorithms Compared:**
   - **Nearest-Available (Baseline):** Greedy proximity heuristic.
   - **Workload-Aware Optimization (Proposed):** Evaluates traffic-delayed finish times and penalizes overworked robots ($\text{Score} = t_{\text{finish}} + 0.25 \cdot T_{\text{busy}}$).

4. **Adaptive Traffic-Aware Path Planning (ATAPP):**
   - Intelligent route adaptation that balances traffic delays, robot movement speeds, and alternative pathways to improve autonomous fleet coordination.
   - Separates task allocation (`nearest` / `optimized`) from traffic management (`standard` wait-based vs. `adaptive` ATAPP).
   - **Standard (Wait-Based):** Pauses robots along their fixed A* route until conflicting corridors clear (`safety_distance = 0.85` grid units).
   - **Adaptive (ATAPP):** Uses reservation-aware **Space-Time A*** and **Intelligent Adjacent-Row Overtaking** (an adaptive traffic optimization mechanism that enables faster robots to bypass slower-moving robots through available neighbouring warehouse rows when doing so improves expected task completion time) with a configurable minimum time-saving threshold (`0.5s`). If waiting is faster, the robot yields; if overtaking or rerouting yields meaningful time savings, the robot adapts its route.
   - **0 moving collisions detected** (`threshold = 0.85`) across all verified scenarios.
   - *Limitation:* Dynamic traffic scheduling prevents moving and adjacent-cell conflicts during active transit, while stationary occupancy at the shared delivery station `(11, 3)` between completed tasks remains future scope (e.g., parking-bay routing).

5. **Interactive React Visualization Dashboard (Light & Dark Themes):**
   - Enterprise Light and Dark themes persisted in `localStorage` without interrupting simulation state.
   - Smooth 60fps waypoint interpolation via `requestAnimationFrame`.
   - Distinct state badges and color indicators: **MOVING** (blue/cyan), **WAITING** (amber), **OVERTAKING** (teal), **REROUTING** (purple), **IDLE** (muted grey), and **COMPLETED** (green).
   - Interactive robot route inspector showing live coordinates, destination, conflicting robots, routing decision reason, estimated wait duration, and estimated time saved.
   - Gantt-style allocation timeline, unassignable task reporting, ATAPP traffic analytics (overtake maneuvers, reroute decisions, wait decisions, estimated time saved, total distance), and side-by-side comparative analytics.

---

## Verified Benchmark Results (Standard vs. ATAPP)

Evaluated across 5 deterministic benchmark scenarios (`backend/benchmark.py`) with `safety_distance = 0.85`:

| Scenario | Tasks | Policy | Standard Makespan | ATAPP Makespan | ATAPP Impact | ATAPP Reroutes |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **Light Workload** | 10 | Nearest-Available<br>Workload-Aware | 77.83 s<br>62.30 s | **67.70 s**<br>**50.87 s** | **+13.02% faster**<br>**+18.35% faster** | 4<br>6 |
| **Moderate Workload** | 20 | Nearest-Available<br>Workload-Aware | 140.90 s<br>110.96 s | **106.27 s**<br>**91.10 s** | **+24.58% faster**<br>**+17.90% faster** | 9<br>15 |
| **Heavy Workload** | 40 | Nearest-Available<br>Workload-Aware | 262.43 s<br>233.41 s | **196.93 s**<br>**173.87 s** | **+24.96% faster**<br>**+25.51% faster** | 24<br>35 |
| **High Heterogeneity** | 20 | Nearest-Available<br>Workload-Aware | 197.00 s<br>136.72 s | **122.00 s**<br>**111.53 s** | **+38.07% faster**<br>**+18.43% faster** | 13<br>12 |
| **Traffic Congestion** | 20 | Nearest-Available<br>Workload-Aware | 136.80 s<br>107.62 s | **91.93 s**<br>**85.50 s** | **+32.80% faster**<br>**+20.56% faster** | 13<br>14 |

*Dynamic collision count (`threshold = 0.85`): **0** across all 5 benchmark scenarios for both Standard and ATAPP.*

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
