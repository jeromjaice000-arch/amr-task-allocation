
import { robotColors } from "../data/mockData";

export default function RobotPanel({ robots = [], metrics = null, assignments = [] }) {
  const utilizationsByRobot = new Map();
  if (metrics?.robot_utilizations) {
    for (const u of metrics.robot_utilizations) {
      utilizationsByRobot.set(u.robot_id, u.utilization);
    }
  }

  const tasksCountByRobot = new Map();
  for (const a of assignments) {
    tasksCountByRobot.set(a.robot_id, (tasksCountByRobot.get(a.robot_id) || 0) + 1);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">
            Robot Fleet Status
          </h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            {robots.length} Heterogeneous AMRs
          </span>
        </div>

        <div className="space-y-3">
          {robots.map((robot) => {
            const color = robotColors[(robot.id - 1) % robotColors.length];
            const utilization = utilizationsByRobot.get(robot.id);
            const assignedTasks = tasksCountByRobot.get(robot.id) || 0;

            return (
              <div
                key={robot.id}
                className="bg-slate-800/70 border border-slate-700/40 rounded-lg p-3 hover:border-slate-600 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full ${color.bg} text-slate-950 font-bold inline-flex items-center justify-center text-xs shadow-sm`}
                    >
                      {robot.id}
                    </span>
                    <span className="font-semibold text-sm">
                      {robot.name}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-300 border border-slate-700/60">
                    {assignedTasks > 0 ? `${assignedTasks} Tasks` : robot.status}
                  </span>
                </div>

                <div className="flex justify-between mt-2.5 text-xs text-slate-400">
                  <span>Speed: <strong className="text-slate-200">{robot.speed}</strong> m/s</span>
                  <span>Cap: <strong className="text-slate-200">{robot.capacity}</strong> kg</span>
                  <span>Spawn: ({robot.x}, {robot.y})</span>
                </div>

                {utilization !== undefined && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Simulated Utilization</span>
                      <span className="font-semibold text-white">{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color.bg}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
        <span>Speeds: 1.2 – 2.5 m/s</span>
        <span>Capacities: 25 – 80 kg</span>
      </div>
    </div>
  );
}
