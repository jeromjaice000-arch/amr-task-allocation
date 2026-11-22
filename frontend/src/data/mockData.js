
export const initialRobots = [
  { id: 1, name: "AMR-01", x: 1, y: 1, speed: 1.5, capacity: 50, status: "Idle" },
  { id: 2, name: "AMR-02", x: 5, y: 2, speed: 2.0, capacity: 30, status: "Idle" },
  { id: 3, name: "AMR-03", x: 9, y: 5, speed: 1.2, capacity: 80, status: "Idle" },
  { id: 4, name: "AMR-04", x: 1, y: 6, speed: 1.8, capacity: 40, status: "Idle" },
  { id: 5, name: "AMR-05", x: 10, y: 1, speed: 2.5, capacity: 25, status: "Idle" },
];

export const robotColors = [
  { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-400", hex: "#06b6d4" },
  { bg: "bg-violet-500", text: "text-violet-400", border: "border-violet-400", hex: "#8b5cf6" },
  { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-400", hex: "#10b981" },
  { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-400", hex: "#f59e0b" },
  { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-400", hex: "#ec4899" }
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
