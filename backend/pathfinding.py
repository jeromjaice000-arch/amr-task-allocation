
import heapq


def heuristic(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def astar(start, goal, obstacles=None, width=12, height=8):
    obstacles = set(obstacles or [])

    start = tuple(start)
    goal = tuple(goal)

    def valid(cell):
        x, y = cell
        return (
            0 <= x < width
            and 0 <= y < height
            and cell not in obstacles
        )

    if not valid(start) or not valid(goal):
        return None

    open_set = [(heuristic(start, goal), 0, start)]
    came_from = {}
    g_score = {start: 0}
    counter = 0

    while open_set:
        _, _, current = heapq.heappop(open_set)

        if current == goal:
            path = [current]

            while current in came_from:
                current = came_from[current]
                path.append(current)

            return path[::-1]

        x, y = current

        neighbors = [
            (x + 1, y),
            (x - 1, y),
            (x, y + 1),
            (x, y - 1)
        ]

        for neighbor in neighbors:
            if not valid(neighbor):
                continue

            tentative_g = g_score[current] + 1

            if tentative_g < g_score.get(
                neighbor, float("inf")
            ):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g

                counter += 1

                f_score = (
                    tentative_g
                    + heuristic(neighbor, goal)
                )

                heapq.heappush(
                    open_set,
                    (f_score, counter, neighbor)
                )

    return None
