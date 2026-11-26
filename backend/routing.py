import math
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


def path_distance(path):
    if len(path) < 2:
        return 0.0
    return sum(
        math.dist((a["x"], a["y"]), (b["x"], b["y"]))
        for a, b in zip(path, path[1:])
    )


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

    path = pickup_path + delivery_path[1:]

    return {
        "path": path,
        "duration": pickup_duration + delivery_duration
    }


def build_traffic_aware_path(
    robot,
    task,
    start_time,
    scheduler,
    commit=True,
    traffic_strategy="standard"
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

    if traffic_strategy == "adaptive":
        adaptive_result = scheduler.find_adaptive_path(
            robot_id=robot.id,
            start_pos=(robot.x, robot.y),
            pickup_pos=(task.pickup_x, task.pickup_y),
            delivery_pos=(task.delivery_x, task.delivery_y),
            baseline_route=combined_route,
            start_time=start_time,
            speed=robot.speed,
        )
        path = adaptive_result["path"]
        if commit:
            scheduler.add_scheduled_path(robot.id, path)

        decision = adaptive_result["decision"]
        decision_reason = adaptive_result["decision_reason"]
        conflicting_robots = adaptive_result["conflicting_robots"]
        estimated_wait_duration = adaptive_result["estimated_wait_duration"]
        estimated_time_saved = adaptive_result["estimated_time_saved"]
        rerouted = adaptive_result["rerouted"]
        overtaken = adaptive_result.get("overtaken", False)
        overtake_windows = adaptive_result.get("overtake_windows", [])
    elif traffic_strategy == "standard":
        ideal_path = scheduler._build_unscheduled_path(
            combined_route, start_time, robot.speed
        )
        conflicting_robots = scheduler.find_conflicting_robots(
            robot.id, ideal_path
        )

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

        wait_delay = round(
            max(0.0, path[-1]["time"] - ideal_path[-1]["time"]), 3
        )
        if wait_delay > 0.05 and conflicting_robots:
            conflict_label = ", ".join(
                f"AMR-{rid:02d}" for rid in conflicting_robots
            )
            decision = "wait"
            decision_reason = f"Waiting {wait_delay:.2f}s for {conflict_label}"
        else:
            decision = "direct"
            decision_reason = "Clear shortest path"
            conflicting_robots = []

        estimated_wait_duration = wait_delay
        estimated_time_saved = 0.0
        rerouted = False
        overtaken = False
        overtake_windows = []
    else:
        raise ValueError("Unknown traffic strategy")

    actual_start = round(path[0]["time"], 3)
    actual_finish = round(path[-1]["time"], 3)
    dist = round(path_distance(path), 3)

    movement_duration = round(dist / robot.speed, 3)
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
        "total_waiting_time": total_waiting_time,
        "distance": dist,
        "decision": decision,
        "decision_reason": decision_reason,
        "conflicting_robots": conflicting_robots,
        "estimated_wait_duration": estimated_wait_duration,
        "estimated_time_saved": estimated_time_saved,
        "rerouted": rerouted,
        "overtaken": overtaken,
        "overtake_windows": overtake_windows,
    }
