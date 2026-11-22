
import { warehouse } from "../data/mockData";

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
      if (pickup) color = "bg-blue-600";
      if (delivery) color = "bg-emerald-600";

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`aspect-square rounded-md border border-slate-700/40
            flex items-center justify-center relative ${color}`}
          title={`Position (${x}, ${y})`}
        >
          {robot ? (
            <div className="w-8 h-8 max-w-full max-h-full rounded-full bg-cyan-500
              border-2 border-cyan-200 flex items-center justify-center
              text-xs font-bold text-slate-950 shadow-lg">
              {robot.id}
            </div>
          ) : shelf ? (
            <span className="text-xs text-slate-300">S</span>
          ) : pickup ? (
            <span className="text-xs font-bold">P</span>
          ) : delivery ? (
            <span className="text-xs font-bold">D</span>
          ) : null}
        </div>
      );
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-lg">Warehouse Floor</h2>
        <span className="text-xs text-slate-400">
          12 × 8 Grid
        </span>
      </div>

      <div className="grid grid-cols-12 gap-1">
        {cells}
      </div>

      <div className="flex flex-wrap gap-4 mt-5 text-xs text-slate-400">
        <span>🔵 Pickup</span>
        <span>🟢 Delivery</span>
        <span>⬜ Shelves</span>
        <span>🤖 Robots</span>
      </div>
    </div>
  );
}
