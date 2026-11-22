
import { warehouse, robotColors } from "../data/mockData";

export default function WarehouseMap({ robots }) {
  const cells = [];

  for (let y = 0; y < warehouse.height; y++) {
    for (let x = 0; x < warehouse.width; x++) {
      const shelf = warehouse.shelves.some(
        ([sx, sy]) => sx === x && sy === y
      );

      const robot = robots.find(
        (r) => r.x === x && r.y === y
      );

      const pickup =
        warehouse.pickup[0] === x &&
        warehouse.pickup[1] === y;

      const delivery =
        warehouse.delivery[0] === x &&
        warehouse.delivery[1] === y;

      let color = "bg-slate-800/60";

      if (shelf) color = "bg-slate-600";
      if (pickup) color = "bg-green-800/80";
      if (delivery) color = "bg-blue-800/80";

      const rColor = robot
        ? robotColors[(robot.id - 1) % robotColors.length].bg
        : "bg-cyan-500";

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`aspect-square rounded-md border border-slate-700/40
            flex items-center justify-center relative ${color}`}
          title={
            robot
              ? `AMR-${String(robot.id).padStart(2, "0")} at (${x}, ${y})`
              : shelf
                ? `Shelf at (${x}, ${y})`
                : pickup
                  ? `Pickup Point (0, 3)`
                  : delivery
                    ? `Delivery Point (11, 3)`
                    : `Cell (${x}, ${y})`
          }
        >
          {robot ? (
            <div
              className={`w-8 h-8 max-w-full max-h-full rounded-full ${rColor}
              border-2 border-white/80 flex items-center justify-center
              text-xs font-bold text-slate-950 shadow-lg`}
            >
              {robot.id}
            </div>
          ) : shelf ? (
            <span className="text-xs text-slate-400 font-semibold">S</span>
          ) : pickup ? (
            <span className="text-xs font-bold text-green-300">P</span>
          ) : delivery ? (
            <span className="text-xs font-bold text-blue-300">D</span>
          ) : null}
        </div>
      );
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-semibold text-lg">Warehouse Floor Layout</h2>
          <p className="text-xs text-slate-400 mt-1">12 × 8 Grid with Fixed Shelves & Staging Areas</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          Initial AMR Coordinates
        </span>
      </div>

      <div className="grid grid-cols-12 gap-1">
        {cells}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 text-xs text-slate-400 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-700 inline-block" /> Pickup (0, 3)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-700 inline-block" /> Delivery (11, 3)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600 inline-block" /> Shelves (Obstacles)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>AMR Fleet:</span>
          {robots.map((r) => (
            <span
              key={r.id}
              className={`w-5 h-5 rounded-full ${robotColors[(r.id - 1) % robotColors.length].bg} text-slate-950 font-bold inline-flex items-center justify-center text-[10px]`}
            >
              {r.id}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
