import AllocationTimeline from "./components/AllocationTimeline";
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import WarehouseMap from "./components/WarehouseMap";
import RobotPanel from "./components/RobotPanel";
import SimulationControls from "./components/SimulationControls";

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

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const robots = initialRobots.slice(0, robotCount);

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const tasks = generateTasks(taskCount);
      const data = await runSimulation(
        robots,
        tasks,
        algorithm
      );
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            Warehouse Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Autonomous Mobile Robot Task Allocation System
          </p>
        </header>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Robots"
            value={robotCount}
            subtitle="Configured fleet"
          />
          <StatCard
            title="Total Tasks"
            value={taskCount}
            subtitle="Generated workload"
          />
          <StatCard
            title="Makespan"
            value={result ? `${result.metrics.makespan}s` : "—"}
            subtitle="Total completion time"
          />
          <StatCard
            title="Tasks / Hour"
            value={result ? result.metrics.tasks_per_hour : "—"}
            subtitle="Simulation throughput"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <WarehouseMap robots={robots} />
          </div>

          <div>
            <RobotPanel robots={robots} />
          </div>

          <div className="xl:col-span-3">
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

        {error && (
          <div className="mt-6 bg-red-950 border border-red-700 rounded-xl p-4 text-red-300">
            {error}
          </div>
        )}
    <div className="mt-6">
  <AllocationTimeline
    assignments={result?.assignments || []}
    robots={robots}
    makespan={result?.metrics?.makespan || 0}
  />
</div>
  
        {result && (
          <section className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Simulation Results
            </h2>

            <p className="text-slate-400 mb-4">
              Algorithm: {result.algorithm}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Makespan"
                value={`${result.metrics.makespan}s`}
                subtitle="Simulation completion time"
              />
              <StatCard
                title="Utilisation Spread"
                value={`${result.metrics.utilization_spread}%`}
                subtitle="Difference between highest and lowest"
              />
              <StatCard
                title="Tasks / Hour"
                value={result.metrics.tasks_per_hour}
                subtitle="Completed tasks per simulated hour"
              />
            </div>

            <h3 className="font-semibold mt-6 mb-3">
              Task Assignments
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3">Task</th>
                    <th>Robot</th>
                    <th>Start (s)</th>
                    <th>Finish (s)</th>
                    <th>Duration (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.assignments.map((a) => (
                    <tr
                      key={a.task_id}
                      className="border-b border-slate-800"
                    >
                      <td className="py-3">{a.task_id}</td>
                      <td>AMR-{String(a.robot_id).padStart(2, "0")}</td>
                      <td>{a.start}</td>
                      <td>{a.finish}</td>
                      <td>{a.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
