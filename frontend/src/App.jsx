import { useState, useEffect } from "react";
import {
  Bot,
  ListTodo,
  Timer,
  Activity,
  Zap,
  TrendingDown,
  Shield,
  Clock,
  GitBranch,
  Route,
  Sun,
  Moon,
  FastForward
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import WarehouseMap from "./components/WarehouseMap";
import RobotPanel from "./components/RobotPanel";
import SimulationControls from "./components/SimulationControls";
import AllocationTimeline from "./components/AllocationTimeline";
import AlgorithmComparison from "./components/AlgorithmComparison";
import AnimatedWarehouse from "./components/AnimatedWarehouse";

import { initialRobots, warehouse } from "./data/mockData";
import { runSimulation } from "./services/api";

function generateTasks(count, maxWeight = 25) {
  const tasks = [];
  const [pickupX, pickupY] = warehouse.pickup;
  const [deliveryX, deliveryY] = warehouse.delivery;
  const step = Math.max(5, Math.round((maxWeight - 10) / 3));

  for (let i = 0; i < count; i++) {
    const rawWeight = 10 + (i % 4) * step;
    tasks.push({
      id: i + 1,
      pickup_x: pickupX,
      pickup_y: pickupY,
      delivery_x: deliveryX,
      delivery_y: deliveryY,
      weight: Math.min(rawWeight, maxWeight),
      arrival_time: i * 3
    });
  }
  return tasks;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("amr-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const [fleetConfig, setFleetConfig] = useState(() =>
    initialRobots.map((r) => ({ ...r }))
  );
  const [robotCount, setRobotCount] = useState(5);
  const [taskCount, setTaskCount] = useState(20);
  const [maxTaskWeight, setMaxTaskWeight] = useState(25);
  const [algorithm, setAlgorithm] = useState("nearest");
  const [trafficStrategy, setTrafficStrategy] = useState("adaptive");
  const [activeSection, setActiveSection] = useState("dashboard");

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [isOutdated, setIsOutdated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const robots = fleetConfig.slice(0, robotCount);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    try {
      localStorage.setItem("amr-theme", theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  // Scroll-spy: sync sidebar highlight with scroll position
  useEffect(() => {
    const sectionIds = ["dashboard", "robots", "tasks", "live-warehouse", "analytics"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function markFleetOutdated() {
    if (result || comparison) {
      setResult(null);
      setComparison(null);
      setIsOutdated(true);
    }
  }

  function handleUpdateRobot(robotId, newSpeed, newCapacity) {
    setFleetConfig((prev) =>
      prev.map((r) =>
        r.id === robotId ? { ...r, speed: newSpeed, capacity: newCapacity } : r
      )
    );
    markFleetOutdated();
  }

  function handleResetRobot(robotId) {
    const def = initialRobots.find((r) => r.id === robotId);
    if (!def) return;
    setFleetConfig((prev) =>
      prev.map((r) =>
        r.id === robotId ? { ...r, speed: def.speed, capacity: def.capacity } : r
      )
    );
    markFleetOutdated();
  }

  function handleResetAllRobots() {
    setFleetConfig(initialRobots.map((r) => ({ ...r })));
    markFleetOutdated();
  }

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    setComparison(null);
    setIsOutdated(false);

    try {
      const tasks = generateTasks(taskCount, maxTaskWeight);
      const [nearestResult, optimizedResult] = await Promise.all([
        runSimulation(robots, tasks, "nearest", trafficStrategy),
        runSimulation(robots, tasks, "optimized", trafficStrategy)
      ]);

      setComparison({ nearest: nearestResult, optimized: optimizedResult });
      setResult(algorithm === "optimized" ? optimizedResult : nearestResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen theme-main flex relative">
      <Sidebar activeSection={activeSection} onSelectSection={setActiveSection} />

      <main className="flex-1 min-w-0 p-6 lg:p-8 relative z-10 max-w-[1600px] mx-auto">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header id="dashboard" className="mb-7 scroll-mt-6">
          {/* Top row: Badge + Theme Toggle */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 animate-pulse" />
              AUTONOMOUS FLEET INTELLIGENCE
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            AMR Control Dashboard
          </h1>

          {/* Tagline (~22px, weight 500, 12px below heading) */}
          <p className="mt-3 text-[22px] font-medium text-slate-900 dark:text-slate-100 leading-snug">
            Every robot. Every route. In sync.
          </p>

          {/* Supporting description (14px, weight 400, 4px below tagline) */}
          <p className="mt-1 text-[14px] font-normal text-slate-500 dark:text-slate-400">
            Intelligent fleet orchestration for autonomous warehouse operations.
          </p>
        </header>

        {/* ── STAT CARDS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Active Fleet"
            value={robotCount}
            subtitle="Heterogeneous AMRs deployed"
            icon={Bot}
            gradient="from-cyan-500 to-blue-600"
          />
          <StatCard
            title="Workload Tasks"
            value={taskCount}
            subtitle={
              result
                ? `${result.metrics.completed_tasks ?? result.assignments.length} completed · ${result.metrics.unassignable_tasks ?? 0} unassignable`
                : "Generated transport jobs"
            }
            icon={ListTodo}
            gradient="from-violet-500 to-purple-600"
          />
          <StatCard
            title="Makespan"
            value={result ? `${result.metrics.makespan}s` : "—"}
            subtitle="Total simulation time"
            icon={Timer}
            gradient="from-emerald-500 to-teal-600"
            badge={
              result &&
              comparison?.optimized?.metrics?.makespan <
                comparison?.nearest?.metrics?.makespan
                ? "Optimised"
                : null
            }
          />
          <StatCard
            title="Tasks / Hour"
            value={result ? result.metrics.tasks_per_hour : "—"}
            subtitle="Fleet throughput rate"
            icon={Activity}
            gradient="from-amber-500 to-orange-500"
          />
        </div>

        {/* ── WAREHOUSE MAP + ROBOT PANEL ─────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <WarehouseMap robots={robots} />
          </div>
          <div id="robots" className="scroll-mt-6">
            <RobotPanel
              robots={robots}
              metrics={result?.metrics}
              assignments={result?.assignments || []}
              onUpdateRobot={handleUpdateRobot}
              onResetRobot={handleResetRobot}
              onResetAllRobots={handleResetAllRobots}
              isSimulating={loading || isPlaying}
            />
          </div>

          {/* Simulation Controls */}
          <div className="xl:col-span-3">
            <SimulationControls
              robotCount={robotCount}
              setRobotCount={(val) => {
                setRobotCount(val);
                markFleetOutdated();
              }}
              taskCount={taskCount}
              setTaskCount={(val) => {
                setTaskCount(val);
                markFleetOutdated();
              }}
              maxTaskWeight={maxTaskWeight}
              setMaxTaskWeight={(val) => {
                setMaxTaskWeight(val);
                markFleetOutdated();
              }}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              trafficStrategy={trafficStrategy}
              setTrafficStrategy={setTrafficStrategy}
              onRun={handleRun}
              loading={loading}
              isOutdated={isOutdated}
            />
          </div>
        </div>

        {/* ── ERROR BANNER ─────────────────────────────────────────── */}
        {error && (
          <div className="mt-6 flex items-start gap-3 bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-red-700 dark:text-red-300">
            <Shield size={18} className="mt-0.5 shrink-0 text-red-500 dark:text-red-400" />
            <div>
              <p className="font-semibold text-sm text-red-800 dark:text-red-200 mb-0.5">
                Simulation Error
              </p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ── ANIMATED WAREHOUSE ───────────────────────────────────── */}
        <div id="live-warehouse" className="mt-6 scroll-mt-6">
          <AnimatedWarehouse
            key={`${algorithm}-${trafficStrategy}-${robotCount}-${taskCount}-${maxTaskWeight}`}
            robots={robots}
            assignments={result?.assignments || []}
            makespan={result?.metrics?.makespan || 0}
            onPlayingChange={setIsPlaying}
          />
        </div>

        {/* ── ALLOCATION TIMELINE ──────────────────────────────────── */}
        <div id="tasks" className="mt-6 scroll-mt-6">
          <AllocationTimeline
            assignments={result?.assignments || []}
            unassignableTasks={result?.unassignable_tasks || []}
            robots={robots}
            makespan={result?.metrics?.makespan || 0}
          />
        </div>

        {/* ── ALGORITHM COMPARISON ─────────────────────────────────── */}
        <div id="analytics" className="mt-6 scroll-mt-6">
          <AlgorithmComparison comparison={comparison} />
        </div>

        {/* ── SIMULATION RESULTS DETAIL ────────────────────────────── */}
        {result && (
          <section className="mt-6 scroll-mt-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                <Zap size={16} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Simulation Results
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Algorithm:{" "}
                  <span className="text-cyan-700 dark:text-cyan-400 font-medium capitalize">
                    {result.algorithm?.replace("_", " ")}
                  </span>
                  {" · "}
                  Traffic Strategy:{" "}
                  <span className="text-purple-700 dark:text-purple-400 font-medium uppercase">
                    {result.traffic_strategy === "adaptive" ? "ATAPP (Adaptive)" : "Standard (Wait)"}
                  </span>
                </p>
              </div>
            </div>

            {/* Primary metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard
                title="Makespan"
                value={`${result.metrics.makespan}s`}
                subtitle="Completion time"
                icon={Timer}
                gradient="from-cyan-500 to-blue-600"
              />
              <StatCard
                title="Util. Spread"
                value={`${result.metrics.utilization_spread}%`}
                subtitle="Max − min utilisation"
                icon={TrendingDown}
                gradient="from-violet-500 to-purple-600"
              />
              <StatCard
                title="Tasks / Hour"
                value={result.metrics.tasks_per_hour}
                subtitle={`${result.metrics.completed_tasks ?? result.assignments.length} completed`}
                icon={Activity}
                gradient="from-emerald-500 to-teal-600"
              />
              <StatCard
                title="Traffic Delay"
                value={`${result.metrics.total_waiting_time ?? 0}s`}
                subtitle={`Avg/robot: ${result.metrics.average_waiting_time_per_robot ?? 0}s · Conflicts: ${result.metrics.traffic_conflicts ?? 0}`}
                icon={Clock}
                gradient="from-amber-500 to-orange-500"
              />
            </div>

            {/* ATAPP Traffic Analytics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <StatCard
                title="Overtake Maneuvers"
                value={result.metrics.overtake_count ?? 0}
                subtitle="Adjacent-row passes"
                icon={FastForward}
                gradient="from-teal-500 to-emerald-600"
              />
              <StatCard
                title="Reroute Decisions"
                value={result.metrics.reroute_count ?? 0}
                subtitle="Space-Time A* detours"
                icon={GitBranch}
                gradient="from-purple-500 to-fuchsia-600"
              />
              <StatCard
                title="Wait Decisions"
                value={result.metrics.wait_count ?? 0}
                subtitle="Yields chosen over detour"
                icon={Clock}
                gradient="from-amber-500 to-yellow-600"
              />
              <StatCard
                title="Est. Time Saved"
                value={`${result.metrics.estimated_time_saved ?? 0}s`}
                subtitle="Estimated via ATAPP"
                icon={Zap}
                gradient="from-emerald-500 to-cyan-600"
              />
              <StatCard
                title="Total Distance"
                value={`${result.metrics.total_distance ?? 0}`}
                subtitle="Grid cells traversed"
                icon={Route}
                gradient="from-blue-500 to-indigo-600"
              />
            </div>

            {/* Task assignment table */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">
                  Task Assignments
                </h3>
                <span className="text-xs text-slate-500">
                  {result.assignments.length} assigned
                  {result.unassignable_tasks?.length
                    ? ` · ${result.unassignable_tasks.length} unassignable`
                    : ""}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="px-5 py-3">Task</th>
                      <th className="px-5 py-3">Robot</th>
                      <th className="px-5 py-3">Start (s)</th>
                      <th className="px-5 py-3">Finish (s)</th>
                      <th className="px-5 py-3">Duration (s)</th>
                      <th className="px-5 py-3">Traffic Delay</th>
                      <th className="px-5 py-3">Routing Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.assignments.map((a, idx) => (
                      <tr
                        key={a.task_id}
                        className={`border-b border-slate-200/70 dark:border-slate-800/60 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/40 ${
                          idx % 2 === 0 ? "" : "bg-slate-50/70 dark:bg-slate-900/30"
                        }`}
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-cyan-700 dark:text-cyan-400 font-medium">
                            #{a.task_id}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            AMR-{String(a.robot_id).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{a.start}</td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{a.finish}</td>
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{a.duration}</td>
                        <td
                          className={`px-5 py-3 font-medium ${
                            (a.total_waiting_time ?? 0) > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {(a.total_waiting_time ?? 0) > 0 ? `+${a.total_waiting_time}s` : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              a.decision === "overtake"
                                ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30"
                                : a.decision === "reroute"
                                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                  : a.decision === "wait"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                            title={a.decision_reason || ""}
                          >
                            {a.decision === "overtake"
                              ? "Overtaken"
                              : a.decision === "reroute"
                                ? "Rerouted"
                                : a.decision === "wait"
                                  ? "Waited"
                                  : "Direct"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer className="mt-10 pb-6 text-center text-xs text-slate-500 dark:text-slate-600">
          AMR Control · Autonomous Fleet Intelligence · FastAPI, React &amp; Tailwind CSS
        </footer>
      </main>
    </div>
  );
}
