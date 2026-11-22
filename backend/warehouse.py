
WIDTH = 12
HEIGHT = 8

SHELVES = {
    (3, 1), (3, 2), (3, 3), (3, 4), (3, 5),
    (7, 1), (7, 2), (7, 3), (7, 4), (7, 5)
}


def is_valid_cell(x, y):
    return (
        0 <= x < WIDTH
        and 0 <= y < HEIGHT
        and (x, y) not in SHELVES
    )
