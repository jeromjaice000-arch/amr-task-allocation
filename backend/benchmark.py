import time
from models import Robot, Task, SimulationRequest
from simulation import run_simulation
from traffic import detect_collisions


def get_heterogeneous_fleet():
    return [
        Robot(id=1, name="AMR-01", x=1, y=1, speed=1.5, capacity=50),
        Robot(id=2, name="AMR-02", x=5, y=2, speed=2.0, capacity=30),
        Robot(id=3, name="AMR-03", x=9, y=5, speed=1.2, capacity=80),
        Robot(id=4, name="AMR-04", x=1, y=6, speed=1.8, capacity=40),
        Robot(id=5, name="AMR-05", x=10, y=1, speed=2.5, capacity=25),
    ]


def get_tasks(count, interval=3.0):
    return [
        Task(
            id=i + 1,
            pickup_x=0,
            pickup_y=3,
            delivery_x=11,
            delivery_y=3,
            weight=10 + (i % 4) * 5,
            arrival_time=round(i * interval, 2),
        )
        for i in range(count)
    ]


def run_benchmark():
    scenarios = [
        {
            "name": "Scenario 1: Light Workload (10 Tasks)",
            "fleet": get_heterogeneous_fleet(),
            "tasks": get_tasks(10, interval=3.0),
        },
        {
            "name": "Scenario 2: Moderate Workload (20 Tasks)",
            "fleet": get_heterogeneous_fleet(),
            "tasks": get_tasks(20, interval=3.0),
        },
        {
            "name": "Scenario 3: Heavy Workload (40 Tasks)",
            "fleet": get_heterogeneous_fleet(),
            "tasks": get_tasks(40, interval=3.0),
        },
        {
            "name": "Scenario 4: High Fleet Heterogeneity (20 Tasks)",
            "fleet": [
                Robot(id=1, name="AMR-SlowHeavy", x=1, y=1, speed=1.0, capacity=100),
                Robot(id=2, name="AMR-FastLight", x=5, y=2, speed=3.0, capacity=20),
                Robot(id=3, name="AMR-MidSpeed", x=9, y=5, speed=1.8, capacity=50),
                Robot(id=4, name="AMR-Agile", x=1, y=6, speed=2.4, capacity=35),
                Robot(id=5, name="AMR-HeavyFast", x=10, y=1, speed=2.2, capacity=75),
            ],
            "tasks": [
                Task(
                    id=i + 1,
                    pickup_x=0,
                    pickup_y=3,
                    delivery_x=11,
                    delivery_y=3,
                    # weights range from 15kg to 90kg to test capacity filtering
                    weight=15 + (i % 5) * 15,
                    arrival_time=round(i * 3.0, 2),
                )
                for i in range(20)
            ],
        },
        {
            "name": "Scenario 5: High Traffic Congestion (Dense Arrivals, 20 Tasks)",
            "fleet": get_heterogeneous_fleet(),
            # Tasks arrive every 1.0s instead of 3.0s, causing intense corridor competition
            "tasks": get_tasks(20, interval=1.0),
        },
    ]

    results = []

    print("=" * 80)
    print("STAGE 9: COMPREHENSIVE PERFORMANCE BENCHMARK (TASK C)")
    print("=" * 80)

    for sc in scenarios:
        name = sc["name"]
        fleet = sc["fleet"]
        tasks = sc["tasks"]

        req = SimulationRequest(robots=fleet, tasks=tasks)

        # Baseline: Nearest
        t0 = time.time()
        res_near = run_simulation(req, "nearest")
        t_near = time.time() - t0
        m_near = res_near["metrics"]

        # Proposed: Workload-Aware
        t0 = time.time()
        res_opt = run_simulation(req, "optimized")
        t_opt = time.time() - t0
        m_opt = res_opt["metrics"]

        makespan_imp = (
            ((m_near["makespan"] - m_opt["makespan"]) / m_near["makespan"]) * 100
            if m_near["makespan"] > 0
            else 0.0
        )
        spread_diff = m_near["utilization_spread"] - m_opt["utilization_spread"]
        delay_diff = m_near["total_waiting_time"] - m_opt["total_waiting_time"]

        results.append({
            "scenario": name,
            "tasks": len(tasks),
            "nearest": m_near,
            "optimized": m_opt,
            "makespan_imp": round(makespan_imp, 2),
            "spread_diff": round(spread_diff, 2),
            "delay_diff": round(delay_diff, 2),
        })

        print(f"\n### {name}")
        print(f"- **Nearest-Available**: Makespan = {m_near['makespan']}s | Spread = {m_near['utilization_spread']}% | TPH = {m_near['tasks_per_hour']} | Delay = {m_near['total_waiting_time']}s | Conflicts = {m_near['traffic_conflicts']}")
        print(f"- **Workload-Aware**  : Makespan = {m_opt['makespan']}s | Spread = {m_opt['utilization_spread']}% | TPH = {m_opt['tasks_per_hour']} | Delay = {m_opt['total_waiting_time']}s | Conflicts = {m_opt['traffic_conflicts']}")
        print(f"- **Impact**: Makespan {makespan_imp:+.2f}% | Spread Reduction: {spread_diff:+.2f}% | Delay Saved: {delay_diff:+.2f}s")

    return results


if __name__ == "__main__":
    run_benchmark()
