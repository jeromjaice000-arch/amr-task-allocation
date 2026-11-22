
import { useState } from "react";
import { Clock3, ChartGantt, CheckCircle2 } from "lucide-react";
import { robotColors } from "../data/mockData";

export default function AllocationTimeline({
  assignments = [],
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

  if (!assignments.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ChartGantt className="text-cyan-400" />
          Task Allocation Timeline
        </h2>
        <p className="text-slate-400 mt-4">
          Run a simulation to view the allocation timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ChartGantt className="text-cyan-400" />
            Task Allocation Timeline
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Robot assignments over simulation time
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock3 size={16} />
          {endTime.toFixed(2)} seconds
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[650px]">
          {robots.map((robot, index) => {
            const robotTasks = assignments.filter(
              (task) => task.robot_id === robot.id
            );

            return (
              <div
                key={robot.id}
                className="flex items-center gap-4 mb-4"
              >
                <div className="w-24 shrink-0 flex items-center gap-2 text-sm text-slate-300">
                  <span
                    className={`w-3 h-3 rounded-full ${robotColors[(robot.id - 1) % robotColors.length].bg}`}
                  />
                  <span>{robot.name}</span>
                </div>

                <div className="relative flex-1 h-11 rounded-lg bg-slate-800 overflow-hidden">
                  {ticks.map((tick, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-slate-600/40"
                      style={{
                        left: `${(tick / endTime) * 100}%`
                      }}
                    />
                  ))}

                  {robotTasks.map((task) => {
                    const left =
                      (task.start / endTime) * 100;

                    const width =
                      ((task.finish - task.start) / endTime) * 100;

                    return (
                      <button
                        key={task.task_id}
                        type="button"
                        title={`Task ${task.task_id}: ${task.start}s - ${task.finish}s`}
                        onClick={() => setSelectedTask(task)}
                        className={`absolute top-1 bottom-1 rounded-md
                          ${robotColors[(robot.id - 1) % robotColors.length].bg}
                          text-slate-950 text-xs font-bold
                          hover:brightness-125 transition-all
                          flex items-center justify-center
                          overflow-hidden shadow-sm`}
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

            <div className="flex-1 flex justify-between text-xs text-slate-400">
              {ticks.map((tick, i) => (
                <span key={i}>{tick.toFixed(1)}s</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="mt-6 p-4 rounded-lg bg-slate-800 border border-slate-700">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-cyan-400">
              Task {selectedTask.task_id}
            </h3>

            <button
              onClick={() => setSelectedTask(null)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
            <div>
              <p className="text-slate-400">Assigned Robot</p>
              <p>AMR-{String(selectedTask.robot_id).padStart(2, "0")}</p>
            </div>

            <div>
              <p className="text-slate-400">Start Time</p>
              <p>{selectedTask.start}s</p>
            </div>

            <div>
              <p className="text-slate-400">Finish Time</p>
              <p>{selectedTask.finish}s</p>
            </div>

            <div>
              <p className="text-slate-400">Duration</p>
              <p>{selectedTask.duration}s</p>
            </div>

            <div>
              <p className="text-slate-400">Traffic Delay</p>
              <p className={selectedTask.total_waiting_time > 0 ? "text-amber-400 font-semibold" : ""}>
                {selectedTask.total_waiting_time ?? 0}s
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-slate-500">
        Each bar represents a scheduled task. Empty space indicates
        that no task is assigned to that robot during the interval.
      </p>
    </div>
  );
}
