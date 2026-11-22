
export default function RobotPanel({ robots }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-lg font-semibold mb-5">
        Robot Fleet
      </h2>

      <div className="space-y-3">
        {robots.map((robot) => (
          <div
            key={robot.id}
            className="bg-slate-800/70 rounded-lg p-3"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">
                {robot.name}
              </span>
              <span className="text-emerald-400 text-xs">
                {robot.status}
              </span>
            </div>

            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span>Speed: {robot.speed} m/s</span>
              <span>Capacity: {robot.capacity} kg</span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Position: ({robot.x}, {robot.y})
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
