
from copy import deepcopy
from algorithms.nearest import distance


def workload_aware(robots, tasks):
    fleet = deepcopy(robots)
    assignments = []

    for task in sorted(tasks, key=lambda t: (t.arrival_time, t.id)):
        candidates = []

        for robot in fleet:
            if robot.capacity < task.weight:
                continue

            start = max(robot.available_at, task.arrival_time)

            pickup_distance = distance(
                robot.x, robot.y,
                task.pickup_x, task.pickup_y
            )

            delivery_distance = distance(
                task.pickup_x, task.pickup_y,
                task.delivery_x, task.delivery_y
            )

            duration = (
                pickup_distance + delivery_distance
            ) / robot.speed

            finish = start + duration

            # Lower score is preferred.
            # All terms are measured in seconds.
            score = (
                finish
                + 0.25 * robot.busy_time
            )

            candidates.append((
                score, finish, robot.id,
                robot, start, duration
            ))

        if not candidates:
            raise ValueError(
                f"No robot can carry task {task.id}"
            )

        _, finish, _, robot, start, duration = min(
            candidates,
            key=lambda item: item[:3]
        )

        robot.busy_time += duration
        robot.available_at = finish
        robot.x = task.delivery_x
        robot.y = task.delivery_y

        assignments.append({
            "task_id": task.id,
            "robot_id": robot.id,
            "start": round(start, 3),
            "finish": round(finish, 3),
            "duration": round(duration, 3)
        })

    return assignments, fleet
