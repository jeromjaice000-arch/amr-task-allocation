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


# 4. Dynamic collision detection (zero moving collisions)
@pytest.mark.parametrize("algo", ["nearest", "optimized"])
def test_zero_dynamic_collisions(standard_fleet, standard_tasks, algo):
    req = SimulationRequest(robots=standard_fleet, tasks=standard_tasks)
    res = run_simulation(req, algo)
    collisions = detect_collisions(res["assignments"], step=0.1, threshold=0.4)
    assert len(collisions) == 0


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
    with pytest.raises(ValueError, match="No robot can carry task"):
        run_simulation(req, algo)


# 10. Invalid robot speed validation
def test_invalid_robot_speed():
    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=-1.5, capacity=50)

    with pytest.raises(Exception):
        Robot(id=1, name="Faulty-AMR", x=1, y=1, speed=0.0, capacity=50)


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
