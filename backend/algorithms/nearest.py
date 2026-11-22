
from copy import deepcopy

from routing import (
    find_route,
    route_distance,
    build_traffic_aware_path
)
from traffic_scheduler import TrafficScheduler


def distance(x1, y1, x2, y2):
    return abs(x1 - x2) + abs(y1 - y2)


def nearest_available(robots, tasks):
    fleet = deepcopy(robots)
    assignments = []

    scheduler = TrafficScheduler(
        time_step=0.1,
        safety_distance=0.4
    )

    for task in sorted(
        tasks,
        key=lambda t: (t.arrival_time, t.id)
    ):
        eligible = [
            robot for robot in fleet
            if robot.capacity >= task.weight
        ]

        if not eligible:
            raise ValueError(
                f"No robot can carry task {task.id}"
            )

        ready = [
            robot for robot in eligible
            if robot.available_at <= task.arrival_time
        ]

        if not ready:
            earliest = min(
                robot.available_at for robot in eligible
            )

            ready = [
                robot for robot in eligible
                if robot.available_at == earliest
            ]

        robot = min(
            ready,
            key=lambda r: (
                route_distance(
                    find_route(
                        (r.x, r.y),
                        (task.pickup_x, task.pickup_y)
                    )
                ),
                r.id
            )
        )

        requested_start = max(
            robot.available_at,
            task.arrival_time
        )

        movement = build_traffic_aware_path(
            robot,
            task,
            requested_start,
            scheduler
        )

        start = movement["start"]
        finish = movement["finish"]
        duration = movement["duration"]

        assignments.append({
            "task_id": task.id,
            "robot_id": robot.id,
            "start": start,
            "finish": finish,
            "duration": duration,
            "waiting_time": movement["waiting_time"],
            "internal_waiting_time": movement[
                "internal_waiting_time"
            ],
            "total_waiting_time": movement[
                "total_waiting_time"
            ],
            "path": movement["path"]
        })

        robot.busy_time += duration
        robot.available_at = finish

        robot.x = task.delivery_x
        robot.y = task.delivery_y

    return assignments, fleet
