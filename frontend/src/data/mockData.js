
export const initialRobots = [
  { id: 1, name: "AMR-01", x: 1, y: 1, speed: 1.5, capacity: 50, status: "Idle" },
  { id: 2, name: "AMR-02", x: 5, y: 2, speed: 2.0, capacity: 30, status: "Idle" },
  { id: 3, name: "AMR-03", x: 9, y: 5, speed: 1.2, capacity: 80, status: "Idle" },
  { id: 4, name: "AMR-04", x: 1, y: 6, speed: 1.8, capacity: 40, status: "Idle" },
  { id: 5, name: "AMR-05", x: 10, y: 1, speed: 2.5, capacity: 25, status: "Idle" },
];

export const warehouse = {
  width: 12,
  height: 8,
  shelves: [
    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5],
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5]
  ],
  pickup: [0, 3],
  delivery: [11, 3]
};
