
from copy import deepcopy


def distance(x1, y1, x2, y2):
    return abs(x1 - x2) + abs(y1 - y2)


def nearest_available(robots, tasks):
    fleet = deepcopy(robots)
    assignments = []

    for task in sorted(tasks, key=lambda t: (t.arrival_time, t.id)):
        eligible = [
            robot for robot in fleet
            if robot.capacity >= task.weight
        ]

        if not eligible:
            raise ValueError(
                f"No robot can carry task {task.id}"
            )

        # Prefer robots that are available when the task arrives.
        ready = [
            robot for robot in eligible
            if robot.available_at <= task.arrival_time
        ]

        # If all robots are busy, wait for the earliest available.
        if not ready:
            earliest = min(r.available_at for r in eligible)
            ready = [
                r for r in eligible
                if r.available_at == earliest
            ]

        robot = min(
            ready,
            key=lambda r: (
                distance(r.x, r.y, task.pickup_x, task.pickup_y),
                r.id
            )
        )

        start = max(robot.available_at, task.arrival_time)

        travel_to_pickup = distance(
            robot.x, robot.y,
            task.pickup_x, task.pickup_y
        ) / robot.speed

        travel_to_delivery = distance(
            task.pickup_x, task.pickup_y,
            task.delivery_x, task.delivery_y
        ) / robot.speed

        finish = start + travel_to_pickup + travel_to_delivery

        robot.busy_time += finish - start
        robot.available_at = finish
        robot.x = task.delivery_x
        robot.y = task.delivery_y

        assignments.append({
            "task_id": task.id,
            "robot_id": robot.id,
            "start": round(start, 3),
            "finish": round(finish, 3),
            "duration": round(finish - start, 3)
        })

    return assignments, fleet
