# CA-1 Presentation Plan & Viva Preparation Guide
## Modular Autonomous Mobile Robot Task Allocation System

---

## Part 1: Presentation Slide Outline (12 Slides)

### Slide 1: Title & Overview
- **Project Title:** Modular Autonomous Mobile Robot Task Allocation System
- **Context:** College CA-1 Evaluation
- **Tech Stack:** Python, FastAPI, React, Vite, Tailwind CSS, A* Search, Discrete Traffic Scheduler
- **Key Highlight:** Intelligent workload-aware dispatching with real-time collision-free visualization.

### Slide 2: Problem Statement & Motivation
- **Context:** Automated Warehouses (e.g. Amazon Kiva / fulfillment centers).
- **The Challenge:** Heterogeneous AMRs (varying speeds and payload capacities) competing for shared corridors.
- **The Pitfall of Proximity:** Greedy "Nearest Robot" allocation causes bottlenecks (overworking slow robots and starving fast ones).
- **The Goal:** A unified allocation, pathfinding, and traffic deconfliction platform.

### Slide 3: System Architecture
- **Layer 1: Frontend Dashboard** (Interactive simulation, A* waypoint interpolation, Gantt timeline, comparative analytics).
- **Layer 2: REST API (FastAPI)** (Lightweight, typed Pydantic models).
- **Layer 3: Allocation Engine** (Nearest-Available vs. Workload-Aware scoring).
- **Layer 4: A* Pathfinding** (Shelf obstacle avoidance on a 12×8 grid).
- **Layer 5: TrafficScheduler** (Relative velocity vector conflict detection).

### Slide 4: Warehouse Environment & Fleet Modeling
- **Grid Dimensions:** 12 columns × 8 rows (96 cells).
- **Obstacles:** Two 5-cell shelf blocks at $x=3$ and $x=7$ ($y=1..5$).
- **Staging Areas:** Pickup Station at $(0, 3)$, Delivery Station at $(11, 3)$.
- **Heterogeneous Fleet:**
  - AMR-01: $1.5\text{ m/s}, 50\text{ kg}$
  - AMR-02: $2.0\text{ m/s}, 30\text{ kg}$
  - AMR-03: $1.2\text{ m/s}, 80\text{ kg}$ (Heavy lifter, slower)
  - AMR-04: $1.8\text{ m/s}, 40\text{ kg}$
  - AMR-05: $2.5\text{ m/s}, 25\text{ kg}$ (Fast sprinter, light payload)

### Slide 5: Allocation Policy 1 — Nearest-Available (Baseline)
- Filters fleet for capacity: $C_r \ge w_{\text{task}}$.
- Finds robots with earliest availability.
- Greedy criterion: Pick robot minimizing Manhattan $A^*$ distance to pickup:
  $$r^* = \arg\min_r \operatorname{dist}_{A^*}(\text{Robot}, \text{Pickup})$$
- **Weakness:** Ignores robot speed and cumulative workload, causing slow robots to become major bottleneck points.

### Slide 6: Allocation Policy 2 — Workload-Aware (Proposed)
- Evaluates candidate finish times accounting for true traffic delay:
  $$\text{Score}(r) = t_{\text{finish}, r}^{\text{traffic}} + 0.25 \cdot T_{\text{busy}, r}$$
- Decoupled two-phase scheduling:
  1. `find_conflict_free_path()` previews candidate routes without committing.
  2. The candidate with minimal score is chosen and committed to the scheduler.
- **Strength:** Dynamically shifts tasks away from congested corridors and balances fleet utilization.

### Slide 7: A* Pathfinding & Corridor Navigation
- Uses Manhattan distance heuristic:
  $$h(n) = |x_n - x_{\text{target}}| + |y_n - y_{\text{target}}|$$
- Avoids shelf obstacles and ensures valid 4-way Manhattan cell transitions.
- Yields smooth waypoint sequences connected across consecutive tasks.

### Slide 8: Continuous Dynamic Traffic Deconfliction
- Traditional grid reservations miss sub-second collisions during movement.
- Our solution: Continuous relative velocity vectors:
  $$\vec{r}(t) = \vec{r}_0 + t \vec{v}, \quad t^* = \operatorname{clip}\left(-\frac{\vec{r}_0 \cdot \vec{v}}{\|\vec{v}\|^2}, 0, 1\right)$$
- If separation at $t^*$ drops below $0.4\text{ units}$, departure is delayed by $\Delta t = 0.1\text{s}$.
- Result: **0 moving collisions** across all benchmark runs.

### Slide 9: Live Dashboard Demonstration Script
1. **Show Initial State:** 12×8 grid, robot fleet panel, simulation controls.
2. **Execute Simulation:** Click **Run Simulation** (runs both policies concurrently).
3. **Show Animation:** Press **Play**, adjust speed to $2\times$, show robots navigating shelves smoothly.
4. **Highlight Traffic Delay:** Show amber pulse halo when an AMR waits for traffic clearance.
5. **Inspect Robot Trajectory:** Click on an AMR to highlight its full path on the grid.
6. **Timeline Analysis:** Click task bars on the Gantt timeline to inspect individual start/finish and delay times.

### Slide 10: Quantitative Experimental Results
- **Makespan Improvement:** Up to **+33.31% faster** in heterogeneous fleets.
- **Utilization Spread:** Reduced from **39.47%** to **21.90%** (more balanced wear).
- **Traffic Delays Saved:** Up to **228 seconds** saved in heterogeneous conditions.
- **Safety:** Zero dynamic collisions detected across all tests.

### Slide 11: Limitations & Future Scope
- **Known Limitation:** Stationary occupancy at the single shared delivery station $(11, 3)$.
- **Future Scope:**
  1. Designated parking/charging bay vacating logic.
  2. Multi-Agent Path Finding via Conflict-Based Search (CBS).
  3. Dynamic battery state-of-charge tracking and charging schedules.

### Slide 12: Conclusion & Summary
- Successfully delivered a full-stack, modular, mathematically rigorous AMR allocation system.
- Proved that Workload-Aware dispatching significantly outperforms naive proximity heuristics in throughput, balance, and traffic efficiency.

---

## Part 2: Viva Preparation — Top 10 Technical Questions & Answers

#### Q1: Why did you choose Manhattan distance over Euclidean distance for the $A^*$ heuristic?
**Answer:** The warehouse floor is modeled as a discrete rectilinear grid with 4-way orthogonal movement (North, South, East, West). In grid environments without diagonal transit, Manhattan distance ($|x_1 - x_2| + |y_1 - y_2|$) is an admissible and monotonic heuristic that guarantees the optimal shortest path without overestimating travel distance.

#### Q2: What is "utilization spread" and why is a lower value desirable?
**Answer:** Utilization spread is the difference between the most utilized robot and the least utilized robot:
$$S = \max(U_r) - \min(U_r)$$
A high spread means one robot is severely overworked while others sit idle. A low spread indicates balanced workload distribution, which extends overall fleet battery life, prevents localized thermal strain, and lowers vehicle maintenance costs.

#### Q3: How does your traffic scheduler detect moving collisions continuously between discrete waypoints?
**Answer:** Rather than merely checking discrete integer grid cells, the `TrafficScheduler` treats movement between consecutive waypoints as linear motion with constant velocity. It calculates the relative position $\vec{r}(t) = \vec{r}_0 + t\vec{v}$ and finds the exact continuous time $t^*$ of closest approach. If the minimum distance drops below $0.4\text{ units}$, departure is delayed.

#### Q4: Why does Workload-Aware allocation show such a large improvement (over 33%) under the heterogeneous fleet scenario?
**Answer:** The Nearest-Available baseline naively picks whichever robot is physically closest to the pickup point, even if that robot is slow ($1.0\text{ m/s}$). In contrast, the Workload-Aware scoring policy evaluates the projected finish time ($t_{\text{finish}} = t_{\text{start}} + \frac{\text{distance}}{\text{speed}}$). It recognizes when a faster robot slightly further away will finish the delivery much earlier, thereby eliminating fleet bottlenecks.

#### Q5: What is the limitation regarding stationary robots at the delivery point?
**Answer:** All tasks in the current warehouse model deliver to the single drop station $(11, 3)$. When a robot completes a delivery, it remains parked at $(11, 3)$ until its next task. Our dynamic scheduler resolves collisions between *moving* trajectories, but stationary cell occupancy at shared endpoints is not yet resolved. In industrial warehouses, this is solved by adding post-delivery dispatch routes to dedicated parking/buffer bays.

#### Q6: Why did you decouple candidate path evaluation from scheduling in `optimized.py`?
**Answer:** The Workload-Aware policy needs to evaluate multiple candidate robots before choosing the best one. If candidate evaluation immediately appended trajectories to `TrafficScheduler.scheduled_paths`, the scheduler would become corrupted with "phantom" paths from unselected robots. Decoupling into `find_conflict_free_path()` (read-only evaluation) and `add_scheduled_path()` (commit winning robot) prevents phantom path pollution.

#### Q7: How does your React frontend animate robots between waypoints smoothly?
**Answer:** It uses `requestAnimationFrame` with a continuous simulation clock. At each frame, `getRobotStateAtTime` locates the current waypoint segment $[a, b]$ where $a.\text{time} \le t \le b.\text{time}$ and computes a linear interpolation factor:
$$\text{progress} = \frac{t - a.\text{time}}{b.\text{time} - a.\text{time}}$$
This produces 60fps continuous visual movement along the $A^*$ corridors.

#### Q8: What does the penalty parameter $\alpha = 0.25$ in the scoring function represent?
**Answer:** The score formula is:
$$\text{Score} = \text{Finish Time} + 0.25 \times \text{Busy Time}$$
The parameter $\alpha = 0.25$ acts as a regularization weight. It prioritizes completing the task as early as possible while applying a 25% bias against robots that have already accumulated heavy operating hours, naturally balancing fleet wear.

#### Q9: What happens if a task arrives with a payload weight exceeding all robot capacities?
**Answer:** The system enforces strict capacity validation:
$$\mathcal{R}_{\text{eligible}} = \{r \in \mathcal{R} \mid C_r \ge w_{\text{task}}\}$$
If $\mathcal{R}_{\text{eligible}}$ is empty, the algorithm raises a `ValueError("No robot can carry task X")` which is caught by FastAPI and returned as an `HTTP 400 Bad Request` with a clear diagnostic message, verified by automated unit tests.

#### Q10: How were metrics verified for mathematical accuracy?
**Answer:** We wrote an automated test suite (`backend/tests/test_simulation.py`) and a system validation harness (`backend/validate_system.py`). They assert that makespan equals latest finish minus earliest arrival, finish time equals start time plus duration, throughput matches $\frac{N}{M / 3600}$, and dynamic collision detection returns zero conflicts. All 20 pytest test cases passed.
