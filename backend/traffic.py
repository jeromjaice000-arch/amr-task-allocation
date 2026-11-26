
def position_at(path, time):
    if not path:
        return None

    if time <= path[0]["time"]:
        return path[0]["x"], path[0]["y"]

    for i in range(len(path) - 1):
        a = path[i]
        b = path[i + 1]

        if a["time"] <= time <= b["time"]:
            duration = b["time"] - a["time"]

            if duration <= 0:
                return b["x"], b["y"]

            progress = (time - a["time"]) / duration

            x = a["x"] + (b["x"] - a["x"]) * progress
            y = a["y"] + (b["y"] - a["y"]) * progress

            return x, y

    return path[-1]["x"], path[-1]["y"]


def detect_collisions(assignments, step=0.1, threshold=0.85):
    if step <= 0:
        raise ValueError("Step must be positive")

    if threshold <= 0:
        raise ValueError("Threshold must be positive")

    if not assignments:
        return []

    makespan = max(a["finish"] for a in assignments)
    collisions = []

    paths = [
        (a["robot_id"], a["start"], a["finish"], a.get("path", []))
        for a in assignments
    ]

    total_steps = int(makespan / step) + 1

    for tick in range(total_steps + 1):
        time = min(tick * step, makespan)
        positions = []

        for robot_id, start, finish, path in paths:
            if start <= time <= finish and path:
                position = position_at(path, time)

                if position is not None:
                    positions.append((robot_id, position))

        for i in range(len(positions)):
            for j in range(i + 1, len(positions)):
                id1, p1 = positions[i]
                id2, p2 = positions[j]

                if id1 == id2:
                    continue

                distance = (
                    (p1[0] - p2[0]) ** 2
                    + (p1[1] - p2[1]) ** 2
                ) ** 0.5

                if distance < threshold:
                    collisions.append({
                        "time": round(time, 2),
                        "robot_1": id1,
                        "robot_2": id2,
                        "distance": round(distance, 3)
                    })

    return collisions
