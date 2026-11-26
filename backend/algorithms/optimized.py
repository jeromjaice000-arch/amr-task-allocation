from copy import deepcopy
from routing import build_traffic_aware_path
from traffic_scheduler import TrafficScheduler


def workload_aware(robots, tasks, traffic_strategy="standard"):
    fleet = deepcopy(robots)
    assignments = []
    unassignable_tasks = []

    scheduler = TrafficScheduler(
        time_step=0.1,
        safety_distance=0.85
    )

    max_fleet_capacity = max((r.capacity for r in fleet), default=0.0)

    for task in sorted(tasks, key=lambda t: (t.arrival_time, t.id)):
        candidates = []

        for robot in fleet:
            if robot.capacity < task.weight:
                continue

            requested_start = max(
                robot.available_at,
                task.arrival_time
            )

            movement = build_traffic_aware_path(
                robot,
                task,
                requested_start,
                scheduler,
                commit=False,
                traffic_strategy=traffic_strategy
            )

            finish = movement["finish"]

            # Workload-aware scoring policy:
            # finish accounts for both travel duration and traffic waiting delay.
            score = finish + 0.25 * robot.busy_time

            candidates.append((
                score,
                finish,
                robot.id,
                robot,
                movement
            ))

        if not candidates:
            unassignable_tasks.append({
                "task_id": task.id,
                "weight": task.weight,
                "max_fleet_capacity": max_fleet_capacity,
                "arrival_time": task.arrival_time,
                "reason": (
                    f"Task weight ({task.weight} kg) exceeds maximum fleet capacity "
                    f"({max_fleet_capacity} kg)."
                ),
            })
            continue

        (
            _, _, _, robot, winning_movement
        ) = min(
            candidates,
            key=lambda item: item[:3]
        )

        # Commit winning candidate's path into the traffic scheduler.
        scheduler.add_scheduled_path(
            robot.id, winning_movement["path"]
        )

        assignments.append({
            "task_id": task.id,
            "robot_id": robot.id,
            "start": winning_movement["start"],
            "finish": winning_movement["finish"],
            "duration": winning_movement["duration"],
            "waiting_time": winning_movement["waiting_time"],
            "internal_waiting_time": winning_movement[
                "internal_waiting_time"
            ],
            "total_waiting_time": winning_movement[
                "total_waiting_time"
            ],
            "distance": winning_movement["distance"],
            "decision": winning_movement["decision"],
            "decision_reason": winning_movement["decision_reason"],
            "conflicting_robots": winning_movement["conflicting_robots"],
            "estimated_wait_duration": winning_movement["estimated_wait_duration"],
            "estimated_time_saved": winning_movement["estimated_time_saved"],
            "rerouted": winning_movement["rerouted"],
            "overtaken": winning_movement["overtaken"],
            "overtake_windows": winning_movement["overtake_windows"],
            "path": winning_movement["path"]
        })

        robot.busy_time += winning_movement["duration"]
        robot.available_at = winning_movement["finish"]
        robot.x = task.delivery_x
        robot.y = task.delivery_y

    return assignments, fleet, unassignable_tasks
