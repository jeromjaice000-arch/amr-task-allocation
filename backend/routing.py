
from pathfinding import astar
from warehouse import WIDTH, HEIGHT, SHELVES


def find_route(start, goal):
    route = astar(
        start,
        goal,
        obstacles=SHELVES,
        width=WIDTH,
        height=HEIGHT
    )

    if route is None:
        raise ValueError(
            f"No valid route from {start} to {goal}"
        )

    return route


def route_distance(route):
    return len(route) - 1


def build_timed_path(route, speed, start_time):
    if speed <= 0:
        raise ValueError("Robot speed must be positive")

    return [
        {
            "x": x,
            "y": y,
            "time": round(start_time + i / speed, 3)
        }
        for i, (x, y) in enumerate(route)
    ]


def build_task_path(robot, task, start_time):
    if robot.speed <= 0:
        raise ValueError("Robot speed must be positive")

    pickup_route = find_route(
        (robot.x, robot.y),
        (task.pickup_x, task.pickup_y)
    )

    delivery_route = find_route(
        (task.pickup_x, task.pickup_y),
        (task.delivery_x, task.delivery_y)
    )

    pickup_distance = route_distance(pickup_route)
    delivery_distance = route_distance(delivery_route)

    pickup_duration = pickup_distance / robot.speed
    delivery_duration = delivery_distance / robot.speed

    pickup_path = build_timed_path(
        pickup_route, robot.speed, start_time
    )

    delivery_path = build_timed_path(
        delivery_route,
        robot.speed,
        start_time + pickup_duration
    )

    # Avoid duplicating the pickup waypoint.
    path = pickup_path + delivery_path[1:]

    return {
        "path": path,
        "duration": pickup_duration + delivery_duration
    }

def build_traffic_aware_path(
    robot, task, start_time, scheduler, commit=True
):
    pickup_route = find_route(
        (robot.x, robot.y),
        (task.pickup_x, task.pickup_y)
    )

    delivery_route = find_route(
        (task.pickup_x, task.pickup_y),
        (task.delivery_x, task.delivery_y)
    )

    combined_route = pickup_route + delivery_route[1:]

    if commit:
        path = scheduler.schedule_path(
            robot_id=robot.id,
            route=combined_route,
            start_time=start_time,
            speed=robot.speed
        )
    else:
        path = scheduler.find_conflict_free_path(
            robot_id=robot.id,
            route=combined_route,
            start_time=start_time,
            speed=robot.speed
        )

    actual_start = round(path[0]["time"], 3)
    actual_finish = round(path[-1]["time"], 3)

    movement_duration = round(
        route_distance(combined_route) / robot.speed, 3
    )
    scheduled_duration = round(actual_finish - actual_start, 3)

    waiting_time = round(max(0.0, actual_start - start_time), 3)
    internal_waiting_time = round(
        max(0.0, scheduled_duration - movement_duration), 3
    )
    total_waiting_time = round(
        waiting_time + internal_waiting_time, 3
    )

    return {
        "path": path,
        "start": actual_start,
        "finish": actual_finish,
        "duration": scheduled_duration,
        "waiting_time": waiting_time,
        "internal_waiting_time": internal_waiting_time,
        "total_waiting_time": total_waiting_time
    }
