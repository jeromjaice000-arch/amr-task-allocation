
export default function SimulationControls({
  robotCount,
  setRobotCount,
  taskCount,
  setTaskCount,
  algorithm,
  setAlgorithm,
  onRun,
  loading
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
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
          >
            <option value="nearest">
              Nearest Available Robot
            </option>
            <option value="optimized">
              Workload-Aware Allocation
            </option>
          </select>
        </div>

        <button
          onClick={onRun}
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500
            disabled:opacity-50 text-white rounded-lg
            py-3 font-semibold transition-colors"
        >
          {loading ? "Running..." : "Run Simulation"}
        </button>
      </div>
    </div>
  );
}
