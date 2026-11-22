
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import WarehouseMap from "./components/WarehouseMap";
import RobotPanel from "./components/RobotPanel";
import SimulationControls from "./components/SimulationControls";

import { initialRobots } from "./data/mockData";

export default function App() {
  const [robotCount, setRobotCount] = useState(5);
  const [taskCount, setTaskCount] = useState(20);
  const [algorithm, setAlgorithm] = useState("nearest");

  const robots = initialRobots.slice(0, robotCount);

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
            subtitle="Available fleet"
          />
          <StatCard
            title="Active Robots"
            value={0}
            subtitle="No simulation running"
          />
          <StatCard
            title="Total Tasks"
            value={taskCount}
            subtitle="Configured tasks"
          />
          <StatCard
            title="Completed Tasks"
            value={0}
            subtitle="Awaiting simulation"
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}
