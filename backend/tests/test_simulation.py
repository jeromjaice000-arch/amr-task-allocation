import pytest
from models import Robot, Task, SimulationRequest
from simulation import run_simulation, calculate_metrics
from warehouse import SHELVES, WIDTH, HEIGHT
from traffic import detect_collisions
from routing import find_route, build_task_path, build_traffic_aware_path
from traffic_scheduler import TrafficScheduler


@pytest.fixture
def standard_fleet():
    return [
        Robot(id=1, name="AMR-01", x=1, y=1, speed=1.5, capacity=50),
        Robot(id=2, name="AMR-02", x=5, y=2, speed=2.0, capacity=30),
        Robot(id=3, name="AMR-03", x=9, y=5, speed=1.2, capacity=80),
        Robot(id=4, name="AMR-04", x=1, y=6, speed=1.8, capacity=40),
        Robot(id=5, name="AMR-05", x=10, y=1, speed=2.5, capacity=25),
    ]


@pytest.fixture
def standard_tasks():
    return [
        Task(
            id=i + 1,
            pickup_x=0,
            pickup_y=3,
            delivery_x=11,
            delivery_y=3,
            weight=10 + (i % 4) * 5,
            arrival_time=i * 3,
        )
        for i in range(15)
    ]


# 1. Capacity compliance
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_capacity_compliance(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)
    robot_map = {r.id: r for r in standard_fleet}
    task_map = {t.id: t for t in standard_tasks}

    for a in res["assignments"]:
        robot = robot_map[a["robot_id"]]
        task = task_map[a["task_id"]]
        assert robot.capacity >= task.weight


# 2. Assignment interval disjointness (no temporal overlap on the same robot)
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_interval_disjointness(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)

    by_robot = {}
    for a in res["assignments"]:
        by_robot.setdefault(a["robot_id"], []).append(a)

    for rid, r_tasks in by_robot.items():
        sorted_tasks = sorted(r_tasks, key=lambda x: x["start"])
        for i in range(len(sorted_tasks) - 1):
            assert sorted_tasks[i]["finish"] <= sorted_tasks[i + 1]["start"] + 1e-4


# 3. A* path validity and shelf avoidance
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_path_validity_and_shelf_avoidance(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)

    for a in res["assignments"]:
        path = a["path"]
        assert len(path) >= 2
        for wp in path:
            assert (wp["x"], wp["y"]) not in SHELVES
            assert 0 <= wp["x"] < WIDTH
            assert 0 <= wp["y"] < HEIGHT


# 4. Dynamic collision detection (zero moving collisions / non-overlapping grid cells)
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_zero_dynamic_collisions(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)
    collisions = detect_collisions(res["assignments"], step=0.1, threshold=0.85)
    assert len(collisions) == 0


def test_mid_route_pause_when_crossing():
    scheduler = TrafficScheduler(time_step=0.1, safety_distance=0.85)
    # Robot 1 crosses (2, 2) from left to right
    p1 = scheduler.schedule_path(
        robot_id=1,
        route=[(0, 2), (1, 2), (2, 2), (3, 2), (4, 2)],
        start_time=0.0,
        speed=1.0,
    )
    # Robot 2 approaches (2, 2) from top to bottom and should pause before entering (2, 2)
    p2 = scheduler.schedule_path(
        robot_id=2,
        route=[(2, 0), (2, 1), (2, 2), (2, 3)],
        start_time=0.0,
        speed=1.0,
    )
    assert not scheduler.has_conflict(2, p2)
    # Robot 2 should start at t=0.0 and pause mid-route before crossing (2, 2)
    assert p2[0]["time"] == 0.0
    assert any(
        a["x"] == b["x"] and a["y"] == b["y"] and b["time"] > a["time"]
        for a, b in zip(p2, p2[1:])
    )


# 5. Robot availability and position tracking
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_robot_position_continuity(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)

    by_robot = {}
    for a in res["assignments"]:
        by_robot.setdefault(a["robot_id"], []).append(a)

    for rid, r_tasks in by_robot.items():
        sorted_tasks = sorted(r_tasks, key=lambda x: x["start"])
        for i in range(len(sorted_tasks) - 1):
            curr_last_wp = sorted_tasks[i]["path"][-1]
            next_first_wp = sorted_tasks[i + 1]["path"][0]
            # Next task begins exactly where the previous task completed
            assert (curr_last_wp["x"], curr_last_wp["y"]) == (next_first_wp["x"], next_first_wp["y"])


# 6. Time consistency: finish == start + duration
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_time_consistency(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)

    for a in res["assignments"]:
        assert abs(a["finish"] - round(a["start"] + a["duration"], 3)) <= 0.001
        assert a["total_waiting_time"] == round(a["waiting_time"] + a["internal_waiting_time"], 3)


# 7. Metrics correctness and mathematical definitions
def test_metrics_correctness(standard_fleet, standard_tasks):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, "nearest")
    m = res["metrics"]
    assignments = res["assignments"]

    earliest_arrival = min(t.arrival_time for t in standard_tasks)
    latest_finish = max(a["finish"] for a in assignments)
    expected_makespan = round(latest_finish - earliest_arrival, 3)
    assert abs(m["makespan"] - expected_makespan) <= 0.001

    expected_tph = round(len(assignments) / (m["makespan"] / 3600), 2)
    assert abs(m["tasks_per_hour"] - expected_tph) <= 0.05


# 8. Empty task list handling
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_empty_tasks(standard_fleet, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=[])
    res = run_simulation(req, algo)
    assert res["assignments"] == []
    assert res["metrics"]["makespan"] == 0
    assert res["metrics"]["tasks_per_hour"] == 0
    assert res["metrics"]["total_waiting_time"] == 0


# 9. Unassignable tasks (weight > all robot capacities)
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_unassignable_heavy_task(standard_fleet, algo):
    heavy_task = Task(id=99, pickup_x=0, pickup_y=3, delivery_x=11, delivery_y=3, weight=999.0, arrival_time=0)
    req = SimulationRequest(robots=standard_fleet, tasks=[heavy_task])
    res = run_simulation(req, algo)
    assert res["assignments"] == []
    assert len(res["unassignable_tasks"]) == 1
    assert res["unassignable_tasks"][0]["task_id"] == 99
    assert "exceeds maximum fleet capacity" in res["unassignable_tasks"][0]["reason"]
    assert res["metrics"]["completed_tasks"] == 0
    assert res["metrics"]["unassignable_tasks"] == 1


# 10. Invalid robot speed / capacity validation (including NaN and Inf)
def test_invalid_robot_speed():
    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=-1.5, capacity=50)

    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=0.0, capacity=50)

    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=float("inf"), capacity=50)

    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=float("nan"), capacity=50)

    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=1.5, capacity=0.0)


# 11. Unknown algorithm parameter validation
def test_unknown_algorithm(standard_fleet, standard_tasks):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    with pytest.raises(ValueError, match="Unknown allocation algorithm"):
        run_simulation(req, "non_existent_algorithm")


# 12. A* unreachable goal validation
def test_unreachable_astar_goal():
    # Attempting to route directly onto a shelf obstacle
    with pytest.raises(ValueError, match="No valid route"):
        find_route((0, 0), (3, 1))


# 13. ATAPP end-to-end validation across both allocation algorithms
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_atapp_end_to_end(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo, traffic_strategy="adaptive")

    assert res["traffic_strategy"] == "adaptive"
    assert len(res["assignments"]) == len(standard_tasks)

    collisions = detect_collisions(res["assignments"], step=0.1, threshold=0.85)
    assert len(collisions) == 0

    for a in res["assignments"]:
        assert a["decision"] in ("direct", "wait", "reroute", "overtake")
        assert a["distance"] > 0
        for wp in a["path"]:
            assert (wp["x"], wp["y"]) not in SHELVES
            assert 0 <= wp["x"] < WIDTH
            assert 0 <= wp["y"] < HEIGHT

    m = res["metrics"]
    assert m["traffic_conflicts"] == 0
    assert m["total_distance"] > 0
    assert m["reroute_count"] + m["overtake_count"] + m["wait_count"] <= len(standard_tasks)


# 14. ATAPP faster robot reroutes around slower robot when beneficial
def test_atapp_faster_robot_reroutes_around_slower():
    scheduler = TrafficScheduler(time_step=0.1, safety_distance=0.85, min_time_saving=0.5)
    # Slow robot moves down the middle corridor y=3 from x=0 to x=11 at 0.8 m/s
    slow_route = [(x, 3) for x in range(12)]
    scheduler.schedule_path(robot_id=1, route=slow_route, start_time=0.0, speed=0.8)

    # Fast robot (3.0 m/s) starts at (0, 3) -> pickup (0, 3) -> delivery (11, 3) at t=0.5s
    baseline_route = [(x, 3) for x in range(12)]
    result = scheduler.find_adaptive_path(
        robot_id=2,
        start_pos=(0, 3),
        pickup_pos=(0, 3),
        delivery_pos=(11, 3),
        baseline_route=baseline_route,
        start_time=0.5,
        speed=3.0,
    )
    assert not scheduler.has_conflict(2, result["path"])
    assert result["decision"] == "reroute"
    assert result["rerouted"] is True
    assert result["estimated_time_saved"] >= 0.5
    assert 1 in result["conflicting_robots"]


# 15. ATAPP chooses waiting when waiting is faster than rerouting
def test_atapp_chooses_wait_when_faster():
    scheduler = TrafficScheduler(time_step=0.1, safety_distance=0.85, min_time_saving=0.5)
    # Robot 1 briefly occupies (1, 3) at t=0.0 and clears it quickly
    scheduler.schedule_path(robot_id=1, route=[(1, 3), (1, 2), (1, 1)], start_time=0.0, speed=2.0)

    baseline_route = [(0, 3), (1, 3), (2, 3), (3, 3)]
    result = scheduler.find_adaptive_path(
        robot_id=2,
        start_pos=(0, 3),
        pickup_pos=(0, 3),
        delivery_pos=(3, 3),
        baseline_route=baseline_route,
        start_time=0.0,
        speed=2.0,
    )
    assert not scheduler.has_conflict(2, result["path"])
    assert result["decision"] == "wait"
    assert result["rerouted"] is False


# 16. Unknown traffic strategy validation
def test_unknown_traffic_strategy(standard_fleet, standard_tasks):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    with pytest.raises(ValueError, match="Unknown traffic strategy"):
        run_simulation(req, "nearest", traffic_strategy="invalid_strategy")


# 17. Adjacent-row overtaking: faster robot overtakes slower robot in clear corridor
def test_adjacent_row_overtaking_clear_row():
    scheduler = TrafficScheduler(time_step=0.1, safety_distance=0.85, min_time_saving=0.5)
    # Slow robot moves along y=0 from x=0 to x=11 at 0.8 m/s
    slow_route = [(x, 0) for x in range(12)]
    scheduler.schedule_path(robot_id=1, route=slow_route, start_time=0.0, speed=0.8)

    # Fast robot (3.0 m/s) follows along y=0; lower row y=1 is clear for x=0..2 and x=4..6 etc.
    # Use y=6 (row 6 has no shelves!) so y=7 (lower row) is completely clear across x=0..11
    scheduler2 = TrafficScheduler(time_step=0.1, safety_distance=0.85, min_time_saving=0.5)
    slow_row6 = [(x, 6) for x in range(12)]
    scheduler2.schedule_path(robot_id=1, route=slow_row6, start_time=0.0, speed=0.8)

    result = scheduler2.find_adaptive_path(
        robot_id=2,
        start_pos=(0, 6),
        pickup_pos=(0, 6),
        delivery_pos=(11, 6),
        baseline_route=slow_row6,
        start_time=0.5,
        speed=3.0,
    )
    assert not scheduler2.has_conflict(2, result["path"])
    assert result["decision"] == "overtake"
    assert result["overtaken"] is True
    assert len(result["overtake_windows"]) == 1
    assert result["estimated_time_saved"] >= 0.5


# 18. Adjacent-row overtaking: lower row blocked, uses upper row
def test_adjacent_row_overtaking_uses_upper_row_when_lower_blocked():
    scheduler = TrafficScheduler(time_step=0.1, safety_distance=0.85, min_time_saving=0.5)
    # Robot 1 moves slowly along y=7 (bottom boundary, so lower row y=8 is out of bounds)
    slow_row7 = [(x, 7) for x in range(12)]
    scheduler.schedule_path(robot_id=1, route=slow_row7, start_time=0.0, speed=0.8)

    result = scheduler.find_adaptive_path(
        robot_id=2,
        start_pos=(0, 7),
        pickup_pos=(0, 7),
        delivery_pos=(11, 7),
        baseline_route=slow_row7,
        start_time=0.5,
        speed=3.0,
    )
    assert not scheduler.has_conflict(2, result["path"])
    assert result["decision"] == "overtake"
    assert "upper row" in result["decision_reason"]
    assert result["overtaken"] is True


# 19. Custom robot speed & capacity affect actual simulation results
def test_custom_speed_and_capacity_affect_simulation():
    t = [Task(id=1, pickup_x=0, pickup_y=3, delivery_x=11, delivery_y=3, weight=45, arrival_time=0)]
    slow_fleet = [Robot(id=1, name="AMR-01", x=0, y=3, speed=1.0, capacity=50)]
    fast_fleet = [Robot(id=1, name="AMR-01", x=0, y=3, speed=2.0, capacity=50)]

    res_slow = run_simulation(SimulationRequest(robots=slow_fleet, tasks=t), "nearest")
    res_fast = run_simulation(SimulationRequest(robots=fast_fleet, tasks=t), "nearest")
    assert res_fast["metrics"]["makespan"] < res_slow["metrics"]["makespan"]

    # Reducing capacity below 45 kg makes the task unassignable
    low_cap_fleet = [Robot(id=1, name="AMR-01", x=0, y=3, speed=2.0, capacity=30)]
    res_low = run_simulation(SimulationRequest(robots=low_cap_fleet, tasks=t), "nearest")
    assert res_low["assignments"] == []
    assert len(res_low["unassignable_tasks"]) == 1
