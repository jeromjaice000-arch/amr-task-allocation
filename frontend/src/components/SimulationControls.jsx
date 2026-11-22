import {
  Sparkles,
  Compass,
  Play,
  SlidersHorizontal,
  Loader2,
  CheckCircle2
} from "lucide-react";

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
    <div className="rounded-2xl glass-card p-6 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">
              Simulation Dispatch Controller
            </h2>
            <p className="text-xs text-slate-400">
              Configure fleet workload and choose allocation policy
            </p>
          </div>
        </div>

        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
          FastAPI Backend Ready
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Count Slider */}
        <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-300 font-medium">Active Fleet Size</label>
            <span className="font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {robotCount} AMRs
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="5"
            value={robotCount}
            onChange={(e) => setRobotCount(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>2 Robots</span>
            <span>3 Robots</span>
            <span>4 Robots</span>
            <span>5 Robots</span>
          </div>
        </div>

        {/* Task Volume Slider */}
        <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-300 font-medium">Workload Volume</label>
            <span className="font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30">
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
            className="w-full accent-violet-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5 Tasks (Light)</span>
            <span>20 (Standard)</span>
            <span>100 (Max)</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={onRun}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin text-white" />
                <span>Simulating Fleet Trajectories...</span>
              </>
            ) : (
              <>
                <Play size={20} className="fill-white" />
                <span>Execute Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Algorithm Selection Cards */}
      <div className="mt-5 pt-5 border-t border-slate-800">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
          Select Primary Evaluation Algorithm
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nearest Available Card */}
          <div
            onClick={() => setAlgorithm("nearest")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              algorithm === "nearest"
                ? "bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-cyan-400" />
                <span className="font-bold text-sm text-white">
                  Nearest Available Robot
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Baseline Heuristic
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Greedily assigns tasks to whichever capacity-eligible robot is closest to the pickup point using Manhattan A* distance.
            </p>
          </div>

          {/* Workload Aware Card */}
          <div
            onClick={() => setAlgorithm("optimized")}
            className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
              algorithm === "optimized"
                ? "bg-violet-950/30 border-violet-500/60 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/40"
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" />
                <span className="font-bold text-sm text-white">
                  Workload-Aware Optimization
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>Recommended</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Minimizes true traffic finish time penalized by cumulative busy time (+0.25 × T_busy), balancing fleet wear evenly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
