import { useState } from "react";
import { Clock3, ChartGantt, AlertTriangle } from "lucide-react";
import { robotColors } from "../data/mockData";

export default function AllocationTimeline({
  assignments = [],
  unassignableTasks = [],
  robots = [],
  makespan = 0
}) {
  const [selectedTask, setSelectedTask] = useState(null);

  const endTime = Math.max(
    Number(makespan) || 0,
    ...assignments.map((a) => a.finish),
    1
  );

  const ticks = Array.from(
    { length: 6 },
    (_, i) => (endTime * i) / 5
  );

  if (!assignments.length && !unassignableTasks.length) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <ChartGantt className="text-cyan-600 dark:text-cyan-400" />
          Task Allocation Timeline
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
          Run a simulation to view the allocation timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ChartGantt className="text-cyan-600 dark:text-cyan-400" />
            Task Allocation Timeline
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Robot assignments over simulation time
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock3 size={16} />
          {endTime.toFixed(2)} seconds
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[650px]">
            {robots.map((robot) => {
              const robotTasks = assignments.filter(
                (task) => task.robot_id === robot.id
              );

              return (
                <div
                  key={robot.id}
                  className="flex items-center gap-4 mb-4"
                >
                  <div className="w-24 shrink-0 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span
                      className={`w-3 h-3 rounded-full ${robotColors[(robot.id - 1) % robotColors.length].bg}`}
                    />
                    <span>{robot.name}</span>
                  </div>

                  <div className="relative flex-1 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                    {ticks.map((tick, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-slate-300/70 dark:border-slate-600/40"
                        style={{
                          left: `${(tick / endTime) * 100}%`
                        }}
                      />
                    ))}

                    {robotTasks.map((task) => {
                      const left = (task.start / endTime) * 100;
                      const width = ((task.finish - task.start) / endTime) * 100;

                      return (
                        <button
                          key={task.task_id}
                          type="button"
                          title={`Task ${task.task_id}: ${task.start}s - ${task.finish}s (${task.decision || "direct"})`}
                          onClick={() => setSelectedTask(task)}
                          className={`absolute top-1 bottom-1 rounded-md cursor-pointer
                            ${robotColors[(robot.id - 1) % robotColors.length].bg}
                            text-slate-950 text-xs font-bold
                            hover:brightness-110 transition-all
                            flex items-center justify-center
                            overflow-hidden shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`
                          }}
                        >
                          T{task.task_id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-4 mt-5">
              <div className="w-20 shrink-0" />

              <div className="flex-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                {ticks.map((tick, i) => (
                  <span key={i}>{tick.toFixed(1)}s</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-cyan-700 dark:text-cyan-400">
              Task {selectedTask.task_id}
            </h3>

            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer text-xs font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 text-sm text-slate-900 dark:text-slate-100">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Assigned Robot</p>
              <p className="font-medium">AMR-{String(selectedTask.robot_id).padStart(2, "0")}</p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Start Time</p>
              <p>{selectedTask.start}s</p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Finish Time</p>
              <p>{selectedTask.finish}s</p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Duration</p>
              <p>{selectedTask.duration}s</p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Traffic Delay</p>
              <p className={selectedTask.total_waiting_time > 0 ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                {selectedTask.total_waiting_time ?? 0}s
              </p>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Routing Decision</p>
              <p className="capitalize font-medium">{selectedTask.decision || "direct"}</p>
            </div>
          </div>

          {selectedTask.decision_reason && (
            <p className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              {selectedTask.decision_reason}
            </p>
          )}
        </div>
      )}

      {/* Unassignable Tasks Warning List */}
      {unassignableTasks.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/35">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm mb-2">
            <AlertTriangle size={16} />
            <span>Unassignable Tasks ({unassignableTasks.length})</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300/90 mb-3">
            The following tasks could not be assigned because no configured robot has sufficient payload capacity:
          </p>
          <div className="space-y-1.5">
            {unassignableTasks.map((t) => (
              <div
                key={t.task_id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs px-3 py-2 rounded-md bg-white/70 dark:bg-slate-900/60 border border-amber-500/25 text-slate-800 dark:text-slate-200"
              >
                <span className="font-mono font-semibold">Task #{t.task_id} ({t.weight} kg)</span>
                <span className="text-amber-800 dark:text-amber-300">{t.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
        Each bar represents a scheduled task. Empty space indicates
        that no task is assigned to that robot during the interval.
      </p>
    </div>
  );
}
