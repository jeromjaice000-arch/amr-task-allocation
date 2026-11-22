
export default function SimulationControls({
  robotCount,
  setRobotCount,
  taskCount,
  setTaskCount,
  algorithm,
  setAlgorithm
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="font-semibold text-lg mb-5">
        Simulation Configuration
      </h2>

      <div className="space-y-5">
        <div>
          <label className="text-sm text-slate-400">
            Robots: {robotCount}
          </label>
          <input
            type="range"
            min="2"
            max="5"
            value={robotCount}
            onChange={(e) => setRobotCount(Number(e.target.value))}
            className="w-full mt-2 accent-cyan-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            Tasks: {taskCount}
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={taskCount}
            onChange={(e) => setTaskCount(Number(e.target.value))}
            className="w-full mt-2 accent-cyan-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Allocation Algorithm
          </label>

          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700
              rounded-lg p-3 text-sm"
          >
            <option value="nearest">Nearest Available Robot</option>
            <option value="optimized">Workload-Aware Allocation</option>
          </select>
        </div>

        <button
          disabled
          className="w-full bg-cyan-600 text-white rounded-lg py-3
            font-semibold opacity-60 cursor-not-allowed"
        >
          Run Simulation — Coming Soon
        </button>
      </div>
    </div>
  );
}
