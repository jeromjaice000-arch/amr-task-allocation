from algorithms.optimized import workload_aware
from algorithms.nearest import nearest_available
from traffic import detect_collisions


def calculate_metrics(assignments, robots, tasks):
    if not assignments:
        return {
            "makespan": 0,
            "utilization_spread": 0,
            "tasks_per_hour": 0,
            "total_waiting_time": 0,
            "traffic_conflicts": 0,
            "robot_utilizations": []
        }

    start_time = min(
        [task.arrival_time for task in tasks]
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

    # Simulation time is measured in seconds.
    throughput = (
        len(assignments) / (makespan / 3600)
        if makespan > 0 else 0
    )

    total_waiting_time = sum(
        assignment.get("total_waiting_time", 0.0)
        for assignment in assignments
    )

    collisions = detect_collisions(assignments)

    return {
        "makespan": round(makespan, 3),
        "utilization_spread": round(spread, 2),
        "tasks_per_hour": round(throughput, 2),
        "total_waiting_time": round(total_waiting_time, 2),
        "traffic_conflicts": len(collisions),
        "robot_utilizations": [
            {
                "robot_id": robot.id,
                "utilization": round(utilization, 2)
            }
            for robot, utilization in zip(robots, utilizations)
        ]
    }



def run_simulation(request, algorithm="nearest"):
    if algorithm == "nearest":
        assignments, robots = nearest_available(
            request.robots, request.tasks
        )
        algorithm_name = "nearest_available"

    elif algorithm == "optimized":
        assignments, robots = workload_aware(
            request.robots, request.tasks
        )
        algorithm_name = "workload_aware"

    else:
        raise ValueError("Unknown allocation algorithm")

    return {
        "algorithm": algorithm_name,
        "assignments": assignments,
        "metrics": calculate_metrics(
            assignments, robots, request.tasks
        )
    }
