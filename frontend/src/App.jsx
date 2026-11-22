
import { useState, useEffect } from "react";
import { Bot, ListTodo, Timer, Activity, Zap, TrendingDown, Shield, Clock } from "lucide-react";

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

function generateTasks(count) {
  const tasks = [];
  const [pickupX, pickupY] = warehouse.pickup;
  const [deliveryX, deliveryY] = warehouse.delivery;

  for (let i = 0; i < count; i++) {
    tasks.push({
      id: i + 1,
      pickup_x: pickupX,
      pickup_y: pickupY,
      delivery_x: deliveryX,
      delivery_y: deliveryY,
      weight: 10 + (i % 4) * 5,
      arrival_time: i * 3
    });
  }
  return tasks;
}

export default function App() {
  const [robotCount, setRobotCount] = useState(5);
  const [taskCount, setTaskCount] = useState(20);
  const [algorithm, setAlgorithm] = useState("nearest");
  const [activeSection, setActiveSection] = useState("dashboard");

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const robots = initialRobots.slice(0, robotCount);

  // Scroll-spy: sync sidebar highlight with scroll position
  useEffect(() => {
    const sectionIds = ["dashboard", "warehouse", "robots", "tasks", "analytics"];
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

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    setComparison(null);

    try {
      const tasks = generateTasks(taskCount);
      const [nearestResult, optimizedResult] = await Promise.all([
        runSimulation(robots, tasks, "nearest"),
        runSimulation(robots, tasks, "optimized")
      ]);

      setComparison({ nearest: nearestResult, optimized: optimizedResult });
      setResult(algorithm === "optimized" ? optimizedResult : nearestResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex relative">

      {/* Ambient radial glow background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[100px]" />
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />
      </div>

      <Sidebar activeSection={activeSection} onSelectSection={setActiveSection} />

      <main className="flex-1 min-w-0 p-6 lg:p-8 relative z-10">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header id="dashboard" className="mb-8 scroll-mt-6">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CA-1 Evaluation Project
            </span>
            <span className="text-xs text-slate-500 hidden sm:block">
              Autonomous Mobile Robots · Fleet Dispatch &amp; Traffic Scheduling
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-tight">
            AMR Control Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-sm lg:text-base max-w-2xl">
            Modular Autonomous Mobile Robot Task Allocation System — real-time A* pathfinding, 
            traffic-aware scheduling and workload-balanced fleet dispatch.
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
            subtitle="Generated transport jobs"
            icon={ListTodo}
            gradient="from-violet-500 to-purple-600"
          />
          <StatCard
            title="Makespan"
            value={result ? `${result.metrics.makespan}s` : "—"}
            subtitle="Total simulation time"
            icon={Timer}
            gradient="from-emerald-500 to-teal-600"
            badge={result ? (comparison?.optimized?.metrics?.makespan < comparison?.nearest?.metrics?.makespan ? "Optimised" : null) : null}
            badgeColor="emerald"
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
          <div id="warehouse" className="xl:col-span-2 scroll-mt-6">
            <WarehouseMap robots={robots} />
          </div>
          <div id="robots" className="scroll-mt-6">
            <RobotPanel
              robots={robots}
              metrics={result?.metrics}
              assignments={result?.assignments || []}
            />
          </div>

          {/* Simulation Controls */}
          <div id="tasks" className="xl:col-span-3 scroll-mt-6">
            <SimulationControls
              robotCount={robotCount}
              setRobotCount={setRobotCount}
              taskCount={taskCount}
              setTaskCount={setTaskCount}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              onRun={handleRun}
              loading={loading}
            />
          </div>
        </div>

        {/* ── ERROR BANNER ─────────────────────────────────────────── */}
        {error && (
          <div className="mt-6 flex items-start gap-3 bg-red-950/60 border border-red-700/60 rounded-xl p-4 text-red-300 backdrop-blur-sm">
            <Shield size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-sm text-red-200 mb-0.5">Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ── ANIMATED WAREHOUSE ───────────────────────────────────── */}
        <div className="mt-6 scroll-mt-6">
          <AnimatedWarehouse
            key={`${algorithm}-${robotCount}-${taskCount}`}
            robots={robots}
            assignments={result?.assignments || []}
            makespan={result?.metrics?.makespan || 0}
          />
        </div>

        {/* ── ALLOCATION TIMELINE ──────────────────────────────────── */}
        <div className="mt-6 scroll-mt-6">
          <AllocationTimeline
            assignments={result?.assignments || []}
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

            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                <Zap size={16} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Simulation Results</h2>
                <p className="text-xs text-slate-400">
                  Algorithm: <span className="text-cyan-400 font-medium capitalize">{result.algorithm?.replace("_", " ")}</span>
                </p>
              </div>
            </div>

            {/* Result metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                subtitle="Throughput"
                icon={Activity}
                gradient="from-emerald-500 to-teal-600"
              />
              <StatCard
                title="Traffic Delay"
                value={`${result.metrics.total_waiting_time ?? 0}s`}
                subtitle={`Conflicts: ${result.metrics.traffic_conflicts ?? 0}`}
                icon={Clock}
                gradient="from-amber-500 to-orange-500"
              />
            </div>

            {/* Task assignment table */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <h3 className="font-semibold text-sm text-slate-200">Task Assignments</h3>
                <span className="text-xs text-slate-500">{result.assignments.length} tasks dispatched</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="px-5 py-3">Task</th>
                      <th className="px-5 py-3">Robot</th>
                      <th className="px-5 py-3">Start (s)</th>
                      <th className="px-5 py-3">Finish (s)</th>
                      <th className="px-5 py-3">Duration (s)</th>
                      <th className="px-5 py-3">Traffic Delay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.assignments.map((a, idx) => (
                      <tr
                        key={a.task_id}
                        className={`border-b border-slate-800/60 transition-colors hover:bg-slate-800/40 ${idx % 2 === 0 ? "" : "bg-slate-900/30"}`}
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-cyan-400 font-medium">#{a.task_id}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-slate-200">AMR-{String(a.robot_id).padStart(2, "0")}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-300">{a.start}</td>
                        <td className="px-5 py-3 text-slate-300">{a.finish}</td>
                        <td className="px-5 py-3 text-slate-300">{a.duration}</td>
                        <td className={`px-5 py-3 font-medium ${(a.total_waiting_time ?? 0) > 0 ? "text-amber-400" : "text-slate-500"}`}>
                          {(a.total_waiting_time ?? 0) > 0 ? `+${a.total_waiting_time}s` : "—"}
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
        <footer className="mt-10 pb-6 text-center text-xs text-slate-600">
          Modular AMR Task Allocation System · CA-1 Project · Built with FastAPI, React &amp; Tailwind CSS
        </footer>

      </main>
    </div>
  );
}
