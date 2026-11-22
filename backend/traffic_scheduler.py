
import math


class TrafficScheduler:
    def __init__(self, time_step=0.1, safety_distance=0.4):
        if time_step <= 0:
            raise ValueError("time_step must be positive")

        if safety_distance <= 0:
            raise ValueError("safety_distance must be positive")

        self.time_step = time_step
        self.safety_distance = safety_distance
        self.scheduled_paths = []

    def position_at(self, path, time):
        if time <= path[0]["time"]:
            return path[0]["x"], path[0]["y"]

        for a, b in zip(path, path[1:]):
            if a["time"] <= time <= b["time"]:
                duration = b["time"] - a["time"]

                if duration <= 0:
                    return b["x"], b["y"]

                ratio = (time - a["time"]) / duration

                return (
                    a["x"] + (b["x"] - a["x"]) * ratio,
                    a["y"] + (b["y"] - a["y"]) * ratio
                )

        return path[-1]["x"], path[-1]["y"]

    def has_conflict(self, robot_id, candidate):
        for other_id, other_path in self.scheduled_paths:
            if other_id == robot_id:
                continue

            start = max(
                candidate[0]["time"],
                other_path[0]["time"]
            )

            end = min(
                candidate[-1]["time"],
                other_path[-1]["time"]
            )

            if start > end:
                continue

            times = {start, end}

            for path in (candidate, other_path):
                for point in path:
                    if start <= point["time"] <= end:
                        times.add(point["time"])

            ordered = sorted(times)

            for left, right in zip(ordered, ordered[1:]):
                p1 = self.position_at(candidate, left)
                p2 = self.position_at(other_path, left)

                q1 = self.position_at(candidate, right)
                q2 = self.position_at(other_path, right)

                relative_start = (
                    p1[0] - p2[0],
                    p1[1] - p2[1]
                )

                relative_end = (
                    q1[0] - q2[0],
                    q1[1] - q2[1]
                )

                velocity = (
                    relative_end[0] - relative_start[0],
                    relative_end[1] - relative_start[1]
                )

                denominator = (
                    velocity[0] ** 2 + velocity[1] ** 2
                )

                if denominator == 0:
                    closest = relative_start
                else:
                    fraction = -(
                        relative_start[0] * velocity[0]
                        + relative_start[1] * velocity[1]
                    ) / denominator

                    fraction = max(
                        0.0,
                        min(1.0, fraction)
                    )

                    closest = (
                        relative_start[0]
                        + fraction * velocity[0],
                        relative_start[1]
                        + fraction * velocity[1]
                    )

                if math.hypot(*closest) < self.safety_distance:
                    return True

            for time in ordered:
                p1 = self.position_at(candidate, time)
                p2 = self.position_at(other_path, time)

                if math.dist(p1, p2) < self.safety_distance:
                    return True

        return False

    def find_conflict_free_path(
        self, robot_id, route, start_time, speed, max_attempts=1000
    ):
        if speed <= 0:
            raise ValueError("Robot speed must be positive")

        if not route:
            raise ValueError("Route cannot be empty")

        for attempt in range(max_attempts):
            delay = attempt * self.time_step
            current_time = start_time + delay
            candidate = []

            for index, (x, y) in enumerate(route):
                if index > 0:
                    previous = route[index - 1]

                    distance = math.dist(
                        previous,
                        (x, y)
                    )

                    current_time += distance / speed

                candidate.append({
                    "x": x,
                    "y": y,
                    "time": round(current_time, 6)
                })

            if not self.has_conflict(robot_id, candidate):
                return candidate

        raise ValueError(
            f"No valid traffic schedule for robot {robot_id}"
        )

    def add_scheduled_path(self, robot_id, path):
        self.scheduled_paths.append((robot_id, path))

    def schedule_path(self, robot_id, route, start_time, speed):
        candidate = self.find_conflict_free_path(
            robot_id, route, start_time, speed
        )
        self.add_scheduled_path(robot_id, candidate)
        return candidate
