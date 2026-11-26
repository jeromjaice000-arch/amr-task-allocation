from algorithms.optimized import workload_aware
from algorithms.nearest import nearest_available
from traffic import detect_collisions


def calculate_metrics(
    assignments,
    robots,
    tasks,
    traffic_strategy="standard",
    unassignable_tasks=None,
):
    unassignable_tasks = unassignable_tasks or []

    if not assignments:
        return {
            "traffic_strategy": traffic_strategy,
            "makespan": 0,
            "utilization_spread": 0,
            "tasks_per_hour": 0,
            "total_waiting_time": 0,
            "average_waiting_time_per_robot": 0,
            "traffic_conflicts": 0,
            "reroute_count": 0,
            "overtake_count": 0,
            "wait_count": 0,
            "estimated_time_saved": 0,
            "total_distance": 0,
            "completed_tasks": 0,
            "unassignable_tasks": len(unassignable_tasks),
            "robot_utilizations": [
                {"robot_id": robot.id, "utilization": 0}
                for robot in robots
            ],
        }

    assigned_task_ids = {a["task_id"] for a in assignments}
    assigned_tasks = [t for t in tasks if t.id in assigned_task_ids]
    start_time = min(
        [task.arrival_time for task in assigned_tasks]
        if assigned_tasks
        else [0.0]
    )

    end_time = max(
        assignment["finish"] for assignment in assignments
    )

    makespan = max(end_time - start_time, 0)

    utilizations = [
        (robot.busy_time / makespan * 100)
        if makespan > 0 else 0
        for robot in robots
    ]

    spread = max(utilizations) - min(utilizations)

    throughput = (
        len(assignments) / (makespan / 3600)
        if makespan > 0 else 0
    )

    total_waiting_time = sum(
        assignment.get("total_waiting_time", 0.0)
        for assignment in assignments
    )

    avg_waiting_per_robot = (
        total_waiting_time / len(robots)
        if robots else 0.0
    )

    reroute_count = sum(
        1 for assignment in assignments
        if assignment.get("decision") == "reroute"
    )

    overtake_count = sum(
        1 for assignment in assignments
        if assignment.get("decision") == "overtake"
    )

    wait_count = sum(
        1 for assignment in assignments
        if assignment.get("decision") == "wait"
    )

    estimated_time_saved = sum(
        assignment.get("estimated_time_saved", 0.0)
        for assignment in assignments
    )

    total_distance = sum(
        assignment.get("distance", 0.0)
        for assignment in assignments
    )

    collisions = detect_collisions(assignments)

    return {
        "traffic_strategy": traffic_strategy,
        "makespan": round(makespan, 3),
        "utilization_spread": round(spread, 2),
        "tasks_per_hour": round(throughput, 2),
        "total_waiting_time": round(total_waiting_time, 2),
        "average_waiting_time_per_robot": round(avg_waiting_per_robot, 2),
        "traffic_conflicts": len(collisions),
        "reroute_count": reroute_count,
        "overtake_count": overtake_count,
        "wait_count": wait_count,
        "estimated_time_saved": round(estimated_time_saved, 2),
        "total_distance": round(total_distance, 2),
        "completed_tasks": len(assignments),
        "unassignable_tasks": len(unassignable_tasks),
        "robot_utilizations": [
            {
                "robot_id": robot.id,
                "utilization": round(utilization, 2)
            }
            for robot, utilization in zip(robots, utilizations)
        ]
    }


def run_simulation(request, algorithm="nearest", traffic_strategy="standard"):
    if traffic_strategy not in ("standard", "adaptive"):
        raise ValueError("Unknown traffic strategy")

    if algorithm == "nearest":
        assignments, robots, unassignable_tasks = nearest_available(
            request.robots,
            request.tasks,
            traffic_strategy=traffic_strategy,
        )
        algorithm_name = "nearest_available"

    elif algorithm == "optimized":
        assignments, robots, unassignable_tasks = workload_aware(
            request.robots,
            request.tasks,
            traffic_strategy=traffic_strategy,
        )
        algorithm_name = "workload_aware"

    else:
        raise ValueError("Unknown allocation algorithm")

    return {
        "algorithm": algorithm_name,
        "traffic_strategy": traffic_strategy,
        "assignments": assignments,
        "unassignable_tasks": unassignable_tasks,
        "metrics": calculate_metrics(
            assignments,
            robots,
            request.tasks,
            traffic_strategy=traffic_strategy,
            unassignable_tasks=unassignable_tasks,
        )
    }
