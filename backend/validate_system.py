import sys
import math
from models import Robot, Task, SimulationRequest
from simulation import run_simulation
from warehouse import SHELVES, WIDTH, HEIGHT
from traffic import detect_collisions


def test_suite():
    print("=" * 65)
    print("STAGE 9: END-TO-END SYSTEM VALIDATION (TASK A)")
    print("=" * 65)

    robots = [
        Robot(id=1, name="AMR-01", x=1, y=1, speed=1.5, capacity=50),
        Robot(id=2, name="AMR-02", x=5, y=2, speed=2.0, capacity=30),
        Robot(id=3, name="AMR-03", x=9, y=5, speed=1.2, capacity=80),
        Robot(id=4, name="AMR-04", x=1, y=6, speed=1.8, capacity=40),
        Robot(id=5, name="AMR-05", x=10, y=1, speed=2.5, capacity=25),
    ]

    tasks = [
        Task(
            id=i + 1,
            pickup_x=0,
            pickup_y=3,
            delivery_x=11,
            delivery_y=3,
            weight=10 + (i % 4) * 5,
            arrival_time=i * 3,
        )
        for i in range(20)
    ]

    req = SimulationRequest(robots=robots, tasks=tasks)
    robot_map = {r.id: r for r in robots}
    task_map = {t.id: t for t in tasks}

    all_passed = True

    for algo in ["nearest", "optimized"]:
        print(f"\n--- Testing Algorithm: {algo.upper()} ---")
        res = run_simulation(req, algo)
        assignments = res["assignments"]
        metrics = res["metrics"]

        # Check 1: Capacity compliance
        for a in assignments:
            r = robot_map[a["robot_id"]]
            t = task_map[a["task_id"]]
            assert r.capacity >= t.weight, f"Capacity violated on Robot {r.id} for Task {t.id}"
        print("  [PASS] 1. Robot capacity constraints satisfied")

        # Check 2: No overlapping assignments
        by_robot = {}
        for a in assignments:
            by_robot.setdefault(a["robot_id"], []).append(a)
        for rid, r_tasks in by_robot.items():
            sorted_t = sorted(r_tasks, key=lambda x: x["start"])
            for i in range(len(sorted_t) - 1):
                assert sorted_t[i]["finish"] <= sorted_t[i + 1]["start"] + 1e-4, (
                    f"Overlap on robot {rid}: finish {sorted_t[i]['finish']} > start {sorted_t[i+1]['start']}"
                )
        print("  [PASS] 2. Disjoint assignment intervals (no overlaps)")

        # Check 3: Shelf obstacle avoidance
        for a in assignments:
            for wp in a["path"]:
                assert (wp["x"], wp["y"]) not in SHELVES, f"Obstacle collision at {(wp['x'], wp['y'])}"
                assert 0 <= wp["x"] < WIDTH and 0 <= wp["y"] < HEIGHT, "Grid bounds exceeded"
        print("  [PASS] 3. Obstacle avoidance (100% shelf-free routes)")

        # Check 4: Dynamic collision detection
        collisions = detect_collisions(assignments, step=0.1, threshold=0.4)
        assert len(collisions) == 0, f"Detected {len(collisions)} dynamic collisions!"
        print("  [PASS] 4. Zero dynamic collisions detected by TrafficScheduler")

        # Check 5: Start and finish time consistency
        for a in assignments:
            expected_finish = round(a["start"] + a["duration"], 3)
            assert abs(a["finish"] - expected_finish) <= 0.001, (
                f"Time mismatch: finish {a['finish']} != start {a['start']} + duration {a['duration']}"
            )
        print("  [PASS] 5. Time consistency: finish == start + duration")

        # Check 6: Robot availability tracking
        for rid, r_tasks in by_robot.items():
            last_task = max(r_tasks, key=lambda x: x["finish"])
            # verify each robot's next task starts at or after previous task finish
            sorted_t = sorted(r_tasks, key=lambda x: x["start"])
            for i in range(1, len(sorted_t)):
                assert sorted_t[i]["start"] >= sorted_t[i - 1]["finish"]
        print("  [PASS] 6. Robot availability monotonic and accurate")

        # Check 7: Waiting time consistency
        for a in assignments:
            assert a["total_waiting_time"] == round(a["waiting_time"] + a["internal_waiting_time"], 3)
        print("  [PASS] 7. Waiting time calculation consistency")

        # Check 8: Makespan correctness
        earliest_arrival = min(t.arrival_time for t in tasks)
        latest_finish = max(a["finish"] for a in assignments)
        expected_makespan = round(latest_finish - earliest_arrival, 3)
        assert abs(metrics["makespan"] - expected_makespan) <= 0.001
        print(f"  [PASS] 8. Makespan mathematically exact ({metrics['makespan']}s)")

        # Check 9: Utilization calculation correctness
        robot_util_map = {u["robot_id"]: u["utilization"] for u in metrics["robot_utilizations"]}
        for r in robots:
            r_tasks = by_robot.get(r.id, [])
            busy = sum(a["duration"] for a in r_tasks)
            expected_util = round((busy / metrics["makespan"]) * 100, 2)
            assert abs(robot_util_map[r.id] - expected_util) <= 0.05
        spread = max(robot_util_map.values()) - min(robot_util_map.values())
        assert abs(metrics["utilization_spread"] - round(spread, 2)) <= 0.05
        print(f"  [PASS] 9. Utilization and spread validated (Spread: {metrics['utilization_spread']}%)")

        # Check 10: Throughput calculation
        expected_tph = round(len(assignments) / (metrics["makespan"] / 3600), 2)
        assert abs(metrics["tasks_per_hour"] - expected_tph) <= 0.05
        print(f"  [PASS] 10. Throughput calculation validated ({metrics['tasks_per_hour']} tasks/hr)")

    print("\n" + "=" * 65)
    print("ALL 10 BACKEND VALIDATION CRITERIA PASSED FOR BOTH ALGORITHMS!")
    print("=" * 65)


if __name__ == "__main__":
    test_suite()
