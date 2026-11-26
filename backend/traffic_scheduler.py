import heapq
import math
from warehouse import WIDTH, HEIGHT, SHELVES


class TrafficScheduler:
    def __init__(
        self,
        time_step=0.1,
        safety_distance=0.85,
        min_time_saving=0.5,
    ):
        if time_step <= 0:
            raise ValueError("time_step must be positive")

        if safety_distance <= 0:
            raise ValueError("safety_distance must be positive")

        self.time_step = time_step
        self.safety_distance = safety_distance
        self.min_time_saving = min_time_saving
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
                    a["y"] + (b["y"] - a["y"]) * ratio,
                )

        return path[-1]["x"], path[-1]["y"]

    def _segment_conflicts_with_path(self, seg_start, seg_end, other_path):
        t_start = seg_start["time"]
        t_end = seg_end["time"]

        start = max(t_start, other_path[0]["time"])
        end = min(t_end, other_path[-1]["time"])

        if start > end + 0.002:
            return False
        if start > end:
            start = end

        times = [start]
        for point in other_path:
            pt = point["time"]
            if start < pt < end:
                times.append(pt)
        if end > start:
            times.append(end)

        seg_duration = t_end - t_start

        def seg_pos(t):
            if seg_duration <= 0 or t <= t_start:
                return seg_start["x"], seg_start["y"]
            if t >= t_end:
                return seg_end["x"], seg_end["y"]
            ratio = (t - t_start) / seg_duration
            return (
                seg_start["x"] + (seg_end["x"] - seg_start["x"]) * ratio,
                seg_start["y"] + (seg_end["y"] - seg_start["y"]) * ratio,
            )

        if len(times) == 1:
            p1 = seg_pos(times[0])
            p2 = self.position_at(other_path, times[0])
            return math.dist(p1, p2) < self.safety_distance

        for left, right in zip(times, times[1:]):
            p1 = seg_pos(left)
            p2 = self.position_at(other_path, left)

            q1 = seg_pos(right)
            q2 = self.position_at(other_path, right)

            relative_start = (p1[0] - p2[0], p1[1] - p2[1])
            relative_end = (q1[0] - q2[0], q1[1] - q2[1])

            velocity = (
                relative_end[0] - relative_start[0],
                relative_end[1] - relative_start[1],
            )

            denominator = velocity[0] ** 2 + velocity[1] ** 2

            if denominator == 0:
                closest = relative_start
            else:
                fraction = -(
                    relative_start[0] * velocity[0]
                    + relative_start[1] * velocity[1]
                ) / denominator
                fraction = max(0.0, min(1.0, fraction))
                closest = (
                    relative_start[0] + fraction * velocity[0],
                    relative_start[1] + fraction * velocity[1],
                )

            if math.hypot(*closest) < self.safety_distance:
                return True

        return False

    def has_segment_conflict(self, robot_id, seg_start, seg_end):
        for other_id, other_path in self.scheduled_paths:
            if other_id == robot_id or not other_path:
                continue
            if self._segment_conflicts_with_path(seg_start, seg_end, other_path):
                return True
        return False

    def find_conflicting_robots(self, robot_id, candidate):
        conflicts = []
        seen = set()
        for other_id, other_path in self.scheduled_paths:
            if other_id == robot_id or other_id in seen or not other_path:
                continue
            if len(candidate) == 1:
                if self._segment_conflicts_with_path(candidate[0], candidate[0], other_path):
                    seen.add(other_id)
                    conflicts.append(other_id)
            else:
                for a, b in zip(candidate, candidate[1:]):
                    if self._segment_conflicts_with_path(a, b, other_path):
                        seen.add(other_id)
                        conflicts.append(other_id)
                        break
        return conflicts

    def has_conflict(self, robot_id, candidate):
        for a, b in zip(candidate, candidate[1:]):
            if self.has_segment_conflict(robot_id, a, b):
                return True
        if len(candidate) == 1:
            return self.has_segment_conflict(robot_id, candidate[0], candidate[0])
        return False

    def _build_unscheduled_path(self, route, start_time, speed):
        current_time = round(start_time, 6)
        path = [{"x": route[0][0], "y": route[0][1], "time": current_time}]
        for prev, nxt in zip(route, route[1:]):
            current_time = round(current_time + math.dist(prev, nxt) / speed, 6)
            path.append({"x": nxt[0], "y": nxt[1], "time": current_time})
        return path

    def find_conflict_free_path(
        self,
        robot_id,
        route,
        start_time,
        speed,
        max_attempts=1000,
        max_step_wait=150,
    ):
        if speed <= 0:
            raise ValueError("Robot speed must be positive")

        if not route:
            raise ValueError("Route cannot be empty")

        for attempt in range(max_attempts):
            delay = attempt * self.time_step
            current_time = round(start_time + delay, 6)

            start_wp = {"x": route[0][0], "y": route[0][1], "time": current_time}
            if self.has_segment_conflict(robot_id, start_wp, start_wp):
                continue

            candidate = [start_wp]
            failed = False

            for index in range(1, len(route)):
                prev = route[index - 1]
                nxt = route[index]
                step_duration = math.dist(prev, nxt) / speed

                placed = False
                for wait_steps in range(max_step_wait + 1):
                    depart_time = round(current_time + wait_steps * self.time_step, 6)
                    arrive_time = round(depart_time + step_duration, 6)

                    if wait_steps > 0:
                        hold_start = {"x": prev[0], "y": prev[1], "time": current_time}
                        hold_end = {"x": prev[0], "y": prev[1], "time": depart_time}
                        if self.has_segment_conflict(robot_id, hold_start, hold_end):
                            break

                    seg_start = {"x": prev[0], "y": prev[1], "time": depart_time}
                    seg_end = {"x": nxt[0], "y": nxt[1], "time": arrive_time}

                    if not self.has_segment_conflict(robot_id, seg_start, seg_end):
                        if wait_steps > 0:
                            candidate.append(seg_start)
                        candidate.append(seg_end)
                        current_time = arrive_time
                        placed = True
                        break

                if not placed:
                    failed = True
                    break

            if not failed:
                return candidate

        raise ValueError(
            f"No valid traffic schedule for robot {robot_id}"
        )

    def _is_walkable(self, x, y, obstacles=SHELVES, width=WIDTH, height=HEIGHT):
        return 0 <= x < width and 0 <= y < height and (x, y) not in obstacles

    def _find_adjacent_row_overtake(
        self,
        robot_id,
        baseline_route,
        ideal_path,
        start_time,
        speed,
        max_finish_allowed,
    ):
        """
        Evaluate Intelligent Adjacent-Row Overtaking:
        When a robot encounters a conflict along a corridor, check neighbouring
        traversable rows (preferring lower row +1, then upper row -1) to bypass
        the slower/blocking robot and merge back when clear.
        """
        if len(baseline_route) < 3:
            return None

        # Locate the first conflict index along ideal_path
        conflict_idx = None
        for idx in range(len(ideal_path) - 1):
            if self.has_segment_conflict(robot_id, ideal_path[idx], ideal_path[idx + 1]):
                conflict_idx = idx
                break

        if conflict_idx is None:
            return None

        best_candidate = None

        # Try entry points near or just before the conflict
        entry_candidates = sorted(
            {
                max(0, conflict_idx - d)
                for d in (0, 1, 2, 3)
            },
            reverse=True,
        )

        for entry_idx in entry_candidates:
            if entry_idx + 2 >= len(baseline_route):
                continue

            ax, ay = baseline_route[entry_idx]
            bx, by = baseline_route[entry_idx + 1]
            dx = bx - ax
            dy = by - ay

            # Determine lateral offsets: prefer lower row (+1) then upper row (-1)
            if dx != 0 and dy == 0:
                lateral_offsets = [(0, 1), (0, -1)]
            elif dy != 0 and dx == 0:
                lateral_offsets = [(1, 0), (-1, 0)]
            else:
                continue

            for ox, oy in lateral_offsets:
                side_start = (ax + ox, ay + oy)
                if not self._is_walkable(*side_start):
                    continue

                # Walk along the adjacent row/col and test merge-back points
                for merge_idx in range(entry_idx + 2, len(baseline_route)):
                    mx, my = baseline_route[merge_idx]
                    # Check that the lateral parallel segment from entry_idx..merge_idx is walkable
                    bypass = []
                    valid_bypass = True
                    for k in range(entry_idx, merge_idx + 1):
                        px, py = baseline_route[k]
                        sx, sy = px + ox, py + oy
                        if not self._is_walkable(sx, sy):
                            valid_bypass = False
                            break
                        if bypass and math.dist(bypass[-1], (sx, sy)) != 1.0:
                            valid_bypass = False
                            break
                        bypass.append((sx, sy))

                    if not valid_bypass or len(bypass) < 2:
                        continue

                    candidate_route = (
                        list(baseline_route[: entry_idx + 1])
                        + bypass
                        + list(baseline_route[merge_idx:])
                    )

                    # Quick lower-bound check before running conflict-free scheduler
                    if start_time + (len(candidate_route) - 1) / speed >= max_finish_allowed:
                        continue

                    try:
                        scheduled = self.find_conflict_free_path(
                            robot_id,
                            candidate_route,
                            start_time,
                            speed,
                            max_attempts=30,
                            max_step_wait=30,
                        )
                    except ValueError:
                        continue

                    finish_t = scheduled[-1]["time"]
                    if finish_t >= max_finish_allowed:
                        continue

                    # Identify exact overtake maneuver window [depart_into_adjacent, merge_back_to_original]
                    entry_pt = baseline_route[entry_idx]
                    merge_pt = baseline_route[merge_idx]
                    entry_time = None
                    merge_time = None
                    for wp in scheduled:
                        if (wp["x"], wp["y"]) == side_start and entry_time is None:
                            entry_time = wp["time"]
                        if entry_time is not None and (wp["x"], wp["y"]) == merge_pt:
                            merge_time = wp["time"]
                            break

                    windows = []
                    if entry_time is not None and merge_time is not None:
                        windows.append({
                            "start_time": round(entry_time - 1.0 / speed, 3),
                            "end_time": round(merge_time, 3),
                        })

                    if best_candidate is None or finish_t < best_candidate["finish"]:
                        direction_label = (
                            "lower row" if oy > 0
                            else "upper row" if oy < 0
                            else "right lane" if ox > 0
                            else "left lane"
                        )
                        best_candidate = {
                            "path": scheduled,
                            "finish": finish_t,
                            "overtake_windows": windows,
                            "direction_label": direction_label,
                        }

        return best_candidate

    def _space_time_astar_leg(
        self,
        robot_id,
        start,
        goal,
        start_time,
        speed,
        max_finish_time,
        obstacles=SHELVES,
        width=WIDTH,
        height=HEIGHT,
        max_expansions=1500,
    ):
        """Reservation-aware Space-Time A* for a single leg (start -> goal)."""
        start = tuple(start)
        goal = tuple(goal)
        obstacles = set(obstacles)

        def valid_cell(cell):
            x, y = cell
            return 0 <= x < width and 0 <= y < height and cell not in obstacles

        if not valid_cell(start) or not valid_cell(goal):
            return None

        start_wp = {"x": start[0], "y": start[1], "time": round(start_time, 6)}
        if self.has_segment_conflict(robot_id, start_wp, start_wp):
            return None

        step_dt = 1.0 / speed
        wait_dt = max(0.3, round(self.time_step * 3, 2))
        bucket_size = 0.25

        def h(cell):
            return (abs(cell[0] - goal[0]) + abs(cell[1] - goal[1])) / speed

        counter = 0
        open_set = [(start_time + h(start), start_time, counter, start, [start_wp])]
        best_state = {}
        expansions = 0

        while open_set and expansions < max_expansions:
            f_time, g_time, _, current, path = heapq.heappop(open_set)
            expansions += 1

            if f_time > max_finish_time:
                continue

            if current == goal:
                return path

            state_key = (current[0], current[1], round(g_time / bucket_size))
            if state_key in best_state and best_state[state_key] <= g_time + 1e-6:
                continue
            best_state[state_key] = g_time

            cx, cy = current
            neighbors = [
                (cx + 1, cy),
                (cx - 1, cy),
                (cx, cy + 1),
                (cx, cy - 1),
            ]

            for nx, ny in neighbors:
                if not valid_cell((nx, ny)):
                    continue
                next_time = round(g_time + step_dt, 6)
                if next_time + h((nx, ny)) > max_finish_time:
                    continue

                seg_start = {"x": cx, "y": cy, "time": round(g_time, 6)}
                seg_end = {"x": nx, "y": ny, "time": next_time}
                if self.has_segment_conflict(robot_id, seg_start, seg_end):
                    continue

                counter += 1
                new_path = path + [seg_end]
                heapq.heappush(
                    open_set,
                    (next_time + h((nx, ny)), next_time, counter, (nx, ny), new_path),
                )

            wait_time = round(g_time + wait_dt, 6)
            if wait_time + h(current) <= max_finish_time:
                hold_start = {"x": cx, "y": cy, "time": round(g_time, 6)}
                hold_end = {"x": cx, "y": cy, "time": wait_time}
                if not self.has_segment_conflict(robot_id, hold_start, hold_end):
                    counter += 1
                    new_path = path + [hold_end]
                    heapq.heappush(
                        open_set,
                        (wait_time + h(current), wait_time, counter, current, new_path),
                    )

        return None

    def find_adaptive_path(
        self,
        robot_id,
        start_pos,
        pickup_pos,
        delivery_pos,
        baseline_route,
        start_time,
        speed,
    ):
        """
        ATAPP hybrid Wait-or-Reroute & Adjacent-Row Overtaking planner:
        1. Compute baseline wait-based schedule & ideal (uncontested) finish time.
        2. If no conflict exists, return direct shortest path.
        3. Evaluate adjacent-row overtaking and Space-Time A* alternative routes.
        4. Select the fastest option if savings >= min_time_saving; else wait.
        """
        ideal_path = self._build_unscheduled_path(baseline_route, start_time, speed)
        ideal_finish = ideal_path[-1]["time"]
        conflicting_robots = self.find_conflicting_robots(robot_id, ideal_path)

        wait_path = self.find_conflict_free_path(
            robot_id, baseline_route, start_time, speed
        )
        wait_finish = wait_path[-1]["time"]
        wait_delay = round(max(0.0, wait_finish - ideal_finish), 3)

        if wait_delay <= 0.05 or not conflicting_robots:
            return {
                "path": wait_path,
                "decision": "direct",
                "decision_reason": "Clear shortest path",
                "conflicting_robots": [],
                "estimated_wait_duration": 0.0,
                "estimated_time_saved": 0.0,
                "rerouted": False,
                "overtaken": False,
                "overtake_windows": [],
            }

        max_finish_allowed = wait_finish - self.min_time_saving
        conflict_label = ", ".join(f"AMR-{rid:02d}" for rid in conflicting_robots)

        # Evaluate 1: Intelligent Adjacent-Row Overtaking
        overtake_candidate = self._find_adjacent_row_overtake(
            robot_id=robot_id,
            baseline_route=baseline_route,
            ideal_path=ideal_path,
            start_time=start_time,
            speed=speed,
            max_finish_allowed=max_finish_allowed,
        )

        # Evaluate 2: Broader Space-Time A* Reroute
        reroute_path = None
        for init_delay in (0.0, 0.2, 0.4, 0.6):
            leg1_start = round(start_time + init_delay, 6)
            if leg1_start >= max_finish_allowed:
                break

            leg1 = self._space_time_astar_leg(
                robot_id=robot_id,
                start=start_pos,
                goal=pickup_pos,
                start_time=leg1_start,
                speed=speed,
                max_finish_time=max_finish_allowed,
            )
            if not leg1:
                continue

            leg2 = self._space_time_astar_leg(
                robot_id=robot_id,
                start=pickup_pos,
                goal=delivery_pos,
                start_time=leg1[-1]["time"],
                speed=speed,
                max_finish_time=max_finish_allowed,
            )
            if leg2:
                candidate = leg1 + leg2[1:]
                if not self.has_conflict(robot_id, candidate):
                    reroute_path = candidate
                    break

        reroute_finish = reroute_path[-1]["time"] if reroute_path else float("inf")

        # Compare overtake vs broader Space-Time A* reroute
        if overtake_candidate is not None and overtake_candidate["finish"] <= reroute_finish + 0.25:
            time_saved = round(wait_finish - overtake_candidate["finish"], 3)
            if time_saved >= self.min_time_saving:
                return {
                    "path": overtake_candidate["path"],
                    "decision": "overtake",
                    "decision_reason": (
                        f"Overtook {conflict_label} via {overtake_candidate['direction_label']} "
                        f"(saved {time_saved:.2f}s)"
                    ),
                    "conflicting_robots": conflicting_robots,
                    "estimated_wait_duration": wait_delay,
                    "estimated_time_saved": time_saved,
                    "rerouted": True,
                    "overtaken": True,
                    "overtake_windows": overtake_candidate["overtake_windows"],
                }

        if reroute_path is not None:
            time_saved = round(wait_finish - reroute_finish, 3)
            spatial_baseline = [(x, y) for x, y in baseline_route]
            spatial_reroute = []
            for wp in reroute_path:
                pt = (wp["x"], wp["y"])
                if not spatial_reroute or spatial_reroute[-1] != pt:
                    spatial_reroute.append(pt)

            if time_saved >= self.min_time_saving and spatial_reroute != spatial_baseline:
                return {
                    "path": reroute_path,
                    "decision": "reroute",
                    "decision_reason": (
                        f"Rerouted around {conflict_label} congestion (saved {time_saved:.2f}s)"
                    ),
                    "conflicting_robots": conflicting_robots,
                    "estimated_wait_duration": wait_delay,
                    "estimated_time_saved": time_saved,
                    "rerouted": True,
                    "overtaken": False,
                    "overtake_windows": [],
                }

        return {
            "path": wait_path,
            "decision": "wait",
            "decision_reason": (
                f"Waiting {wait_delay:.2f}s for {conflict_label} is faster than detouring"
            ),
            "conflicting_robots": conflicting_robots,
            "estimated_wait_duration": wait_delay,
            "estimated_time_saved": 0.0,
            "rerouted": False,
            "overtaken": False,
            "overtake_windows": [],
        }

    def add_scheduled_path(self, robot_id, path):
        self.scheduled_paths.append((robot_id, path))

    def schedule_path(self, robot_id, route, start_time, speed):
        candidate = self.find_conflict_free_path(
            robot_id, route, start_time, speed
        )
        self.add_scheduled_path(robot_id, candidate)
        return candidate
