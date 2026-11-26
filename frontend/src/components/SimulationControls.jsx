import {
  Sparkles,
  Compass,
  Play,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  GitBranch,
  Clock
} from "lucide-react";

export default function SimulationControls({
  robotCount,
  setRobotCount,
  taskCount,
  setTaskCount,
  maxTaskWeight = 25,
  setMaxTaskWeight,
  algorithm,
  setAlgorithm,
  trafficStrategy = "adaptive",
  setTrafficStrategy,
  onRun,
  loading,
  isOutdated = false
}) {
  return (
    <div className="rounded-xl glass-card p-6 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Simulation Dispatch Controller
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure fleet workload, allocation policy and traffic strategy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOutdated && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Fleet Updated — Re-run Simulation
            </span>
          )}
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            FastAPI Backend Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Fleet Count Slider */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-700 dark:text-slate-300 font-medium">
              Active Fleet Size
            </label>
            <span className="font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
              {robotCount} AMRs
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="5"
            value={robotCount}
            onChange={(e) => setRobotCount(Number(e.target.value))}
            className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>

        {/* Task Volume Slider */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-700 dark:text-slate-300 font-medium">
              Workload Volume
            </label>
            <span className="font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
              {taskCount} Tasks
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={taskCount}
            onChange={(e) => setTaskCount(Number(e.target.value))}
            className="w-full accent-violet-600 dark:accent-violet-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5</span>
            <span>20</span>
            <span>100</span>
          </div>
        </div>

        {/* Peak Task Weight Slider */}
        {setMaxTaskWeight && (
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-700 dark:text-slate-300 font-medium">
                Peak Task Weight
              </label>
              <span className="font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                10–{maxTaskWeight} kg
              </span>
            </div>
            <input
              type="range"
              min="25"
              max="120"
              step="5"
              value={maxTaskWeight}
              onChange={(e) => setMaxTaskWeight(Number(e.target.value))}
              className="w-full accent-amber-600 dark:accent-amber-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>25 kg</span>
              <span>60 kg</span>
              <span>120 kg</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={onRun}
            disabled={loading}
            className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin text-white" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play size={18} className="fill-white" />
                <span>Execute Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Algorithm Selection Cards */}
      <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
          1. Task Allocation Policy
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setAlgorithm("nearest")}
            className={`text-left p-4 rounded-xl border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              algorithm === "nearest"
                ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/40"
                : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-cyan-600 dark:text-cyan-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Nearest Available Robot
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                Baseline Heuristic
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Greedily assigns tasks to whichever capacity-eligible robot is closest to the pickup point using Manhattan A* distance.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAlgorithm("optimized")}
            className={`text-left p-4 rounded-xl border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              algorithm === "optimized"
                ? "bg-violet-50 dark:bg-violet-950/30 border-violet-500/60 ring-1 ring-violet-500/40"
                : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-violet-600 dark:text-violet-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Workload-Aware Optimization
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>Recommended</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Minimizes true traffic finish time penalized by cumulative busy time (+0.25 × T_busy), balancing fleet wear evenly.
            </p>
          </button>
        </div>
      </div>

      {/* Compact Traffic Strategy Selector */}
      {setTrafficStrategy && (
        <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Traffic Management Strategy
            </label>
            <span className="text-[11px] text-slate-500">
              Wait-based scheduling vs. ATAPP (Wait, Reroute &amp; Adjacent-Row Overtaking)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTrafficStrategy("standard")}
              className={`text-left p-3.5 rounded-xl border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                trafficStrategy === "standard"
                  ? "bg-slate-100 dark:bg-slate-800/80 border-cyan-500/60 ring-1 ring-cyan-500/40"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={15} className="text-amber-600 dark:text-amber-400" />
                  Standard (Wait-Based)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Fixed A* + Yield
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pauses robots along their shortest path until conflicting corridors clear.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTrafficStrategy("adaptive")}
              className={`text-left p-3.5 rounded-xl border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                trafficStrategy === "adaptive"
                  ? "bg-purple-50 dark:bg-purple-950/30 border-purple-500/60 ring-1 ring-purple-500/40"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <GitBranch size={15} className="text-purple-600 dark:text-purple-400" />
                  Adaptive (ATAPP)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  Space-Time A* + Overtaking
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adaptive Traffic-Aware Path Planning: waits, reroutes, or overtakes via adjacent rows.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
