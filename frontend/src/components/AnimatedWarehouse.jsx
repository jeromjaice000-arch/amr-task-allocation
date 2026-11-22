import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  ShieldCheck,
  Package,
  Bot
} from "lucide-react";
import { warehouse, robotColors } from "../data/mockData";

const COLS = warehouse.width;
const ROWS = warehouse.height;

/**
 * Computes robot state and interpolated position at simulation time `time`.
 */
function getRobotStateAtTime(robot, robotTasks, time) {
  let position = { x: robot.x, y: robot.y };
  let status = "Idle";
  let activeTask = null;
  let isDelayed = false;
  let isDelivering = false;
  let activePath = [];

  for (let tIdx = 0; tIdx < robotTasks.length; tIdx++) {
    const task = robotTasks[tIdx];
    const path = task.path || [];

    if (!path.length) continue;

    // Has not reached this task yet
    if (time < task.start) {
      break;
    }

    // Past this task - update position to task delivery end
    if (time >= task.finish) {
      const last = path[path.length - 1];
      position = { x: last.x, y: last.y };
      status = tIdx === robotTasks.length - 1 ? "Completed" : "Idle";
      continue;
    }

    // Currently within this task's assigned window [task.start, task.finish]
    activeTask = task;
    activePath = path;

    // Traffic delay check: task requested start was earlier than actual departure
    if (time < path[0].time) {
      status = "Waiting (Traffic Delay)";
      isDelayed = true;
      return { position, status, activeTask, isDelayed, isDelivering, activePath };
    }

    // Robot is moving along the timed waypoints
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];

      if (time <= b.time) {
        const elapsed = b.time - a.time;
        const progress =
          elapsed <= 0
            ? 1
            : Math.max(0, Math.min(1, (time - a.time) / elapsed));

        position = {
          x: a.x + (b.x - a.x) * progress,
          y: a.y + (b.y - a.y) * progress
        };

        // Pickup point is (warehouse.pickup[0], warehouse.pickup[1])
        // If current waypoint index has reached pickup point, robot is delivering
        const reachedPickup = path.slice(0, i + 1).some(
          (wp) => wp.x === warehouse.pickup[0] && wp.y === warehouse.pickup[1]
        );

        if (reachedPickup) {
          status = "Delivering";
          isDelivering = true;
        } else {
          status = "Moving to Pickup";
        }

        return { position, status, activeTask, isDelayed, isDelivering, activePath };
      }
    }

    const last = path[path.length - 1];
    position = { x: last.x, y: last.y };
    status = tIdx === robotTasks.length - 1 ? "Completed" : "Idle";
    return { position, status, activeTask, isDelayed, isDelivering, activePath };
  }

  return { position, status, activeTask, isDelayed, isDelivering, activePath };
}

export default function AnimatedWarehouse({
  robots = [],
  assignments = [],
  makespan = 0
}) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedRobotId, setSelectedRobotId] = useState(null);

  const frameRef = useRef(null);
  const lastFrameRef = useRef(null);

  const duration = Math.max(Number(makespan) || 0, 0);

  // Group assignments per robot
  const tasksByRobot = useMemo(() => {
    const grouped = new Map();

    for (const task of assignments) {
      const existing = grouped.get(task.robot_id) || [];
      existing.push(task);
      grouped.set(task.robot_id, existing);
    }

    for (const tasks of grouped.values()) {
      tasks.sort((a, b) => a.start - b.start);
    }

    return grouped;
  }, [assignments]);

  // Compute live positions and states for all robots at current simulation clock `time`
  const robotStates = useMemo(() => {
    return robots.map((robot) => {
      const robotTasks = tasksByRobot.get(robot.id) || [];
      const state = getRobotStateAtTime(robot, robotTasks, time);
      const color = robotColors[(robot.id - 1) % robotColors.length];

      return {
        ...robot,
        ...state,
        color
      };
    });
  }, [robots, tasksByRobot, time]);

  // Count active moving robots
  const activeCount = robotStates.filter(
    (r) => r.status === "Moving to Pickup" || r.status === "Delivering"
  ).length;

  const delayedCount = robotStates.filter((r) => r.isDelayed).length;

  // Selected robot details
  const selectedRobot = robotStates.find((r) => r.id === selectedRobotId);

  // Animation frame loop
  useEffect(() => {
    if (!playing || duration <= 0) {
      lastFrameRef.current = null;
      return;
    }

    const animate = (timestamp) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;

      setTime((previous) => {
        const nextTime = previous + deltaSeconds * speed;
        if (nextTime >= duration) {
          setPlaying(false);
          return duration;
        }
        return nextTime;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      lastFrameRef.current = null;
    };
  }, [playing, speed, duration]);

  // Reset when assignments change
  useEffect(() => {
    setPlaying(false);
    setTime(0);
    setSelectedRobotId(null);
  }, [assignments]);

  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      return;
    }

    if (time >= duration) {
      setTime(0);
    }

    setPlaying(true);
  }

  function handleSkip(seconds) {
    setTime((prev) => Math.max(0, Math.min(prev + seconds, duration)));
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="text-cyan-400" size={22} />
            Live Warehouse Simulation
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time A* trajectory playback with dynamic traffic scheduling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/70 border border-emerald-700/60 text-emerald-400">
            <ShieldCheck size={14} />
            <span>0 Moving Conflicts</span>
          </div>

          <div
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              playing
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            {playing ? "Simulation Running" : "Simulation Paused"}
          </div>
        </div>
      </div>

      {/* Warehouse Grid */}
      <div
        className="relative w-full mb-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-inner select-none"
        style={{
          aspectRatio: `${COLS} / ${ROWS}`
        }}
      >
        {/* Grid Cells */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: COLS * ROWS }, (_, index) => {
            const x = index % COLS;
            const y = Math.floor(index / COLS);

            const isShelf = warehouse.shelves.some(
              ([sx, sy]) => sx === x && sy === y
            );

            const isPickup =
              warehouse.pickup[0] === x && warehouse.pickup[1] === y;

            const isDelivery =
              warehouse.delivery[0] === x && warehouse.delivery[1] === y;

            // Highlight trail if robot is selected
            const isSelectedTrail =
              selectedRobot?.activePath?.some(
                (wp) => wp.x === x && wp.y === y
              );

            return (
              <div
                key={index}
                className={`
                  border border-slate-800/60
                  flex items-center justify-center
                  text-[10px] sm:text-xs font-semibold transition-colors
                  ${isShelf ? "bg-amber-950/80 border-amber-900/50 text-amber-300" : ""}
                  ${isPickup ? "bg-green-950/80 border-green-800/80 text-green-300" : ""}
                  ${isDelivery ? "bg-blue-950/80 border-blue-800/80 text-blue-300" : ""}
                  ${isSelectedTrail && !isShelf && !isPickup && !isDelivery ? "bg-cyan-950/40 border-cyan-800/40" : ""}
                `}
                title={
                  isShelf
                    ? `Shelf / Obstacle (${x}, ${y})`
                    : isPickup
                      ? `Pickup Point (${x}, ${y})`
                      : isDelivery
                        ? `Delivery Point (${x}, ${y})`
                        : `Cell (${x}, ${y})`
                }
              >
                {isShelf ? (
                  <span className="opacity-70">S</span>
                ) : isPickup ? (
                  <span className="font-bold text-green-400">P</span>
                ) : isDelivery ? (
                  <span className="font-bold text-blue-400">D</span>
                ) : isSelectedTrail ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Animated Robot Positions */}
        {robotStates.map((robot) => {
          const { x, y } = robot.position;
          const isSelected = selectedRobotId === robot.id;

          return (
            <div
              key={robot.id}
              onClick={() =>
                setSelectedRobotId(isSelected ? null : robot.id)
              }
              className="absolute flex flex-col items-center justify-center cursor-pointer transition-transform duration-75 z-20"
              style={{
                left: `${((x + 0.5) / COLS) * 100}%`,
                top: `${((y + 0.5) / ROWS) * 100}%`,
                width: `${100 / COLS}%`,
                height: `${100 / ROWS}%`,
                transform: "translate(-50%, -50%)"
              }}
              title={`${robot.name}: ${robot.status} at (${x.toFixed(2)}, ${y.toFixed(2)})`}
            >
              {/* Traffic Delay Pulse Halo */}
              {robot.isDelayed && (
                <span className="absolute w-[80%] h-[80%] max-w-12 max-h-12 rounded-full ring-4 ring-amber-400/80 animate-ping pointer-events-none" />
              )}

              {/* Status Badge Above Robot */}
              {robot.isDelayed && (
                <span className="absolute -top-4 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-md whitespace-nowrap">
                  Wait
                </span>
              )}

              {robot.isDelivering && (
                <span className="absolute -top-4 text-[9px] font-bold px-1 rounded bg-blue-500 text-white shadow-md flex items-center gap-0.5">
                  <Package size={9} />
                  <span>T{robot.activeTask?.task_id}</span>
                </span>
              )}

              {/* Main Robot Node */}
              <div
                className={`w-[68%] h-[68%] max-w-10 max-h-10 aspect-square rounded-full ${robot.color.bg} text-slate-950 font-bold flex items-center justify-center shadow-lg transition-all ${
                  isSelected
                    ? "ring-4 ring-white scale-110 shadow-cyan-500/50"
                    : "hover:scale-105"
                } text-xs sm:text-sm`}
              >
                {robot.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Robot Live Inspector */}
      {selectedRobot && (
        <div className="mb-5 p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-4 h-4 rounded-full ${selectedRobot.color.bg}`}
            />
            <span className="font-semibold text-white">
              {selectedRobot.name} Inspector
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">
              Status:{" "}
              <strong
                className={
                  selectedRobot.isDelayed
                    ? "text-amber-400"
                    : selectedRobot.isDelivering
                      ? "text-blue-400"
                      : "text-emerald-400"
                }
              >
                {selectedRobot.status}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Coord: ({selectedRobot.position.x.toFixed(2)},{" "}
              {selectedRobot.position.y.toFixed(2)})
            </span>
            <span>Speed: {selectedRobot.speed} m/s</span>
            <span>Capacity: {selectedRobot.capacity} kg</span>
            {selectedRobot.activeTask && (
              <span>
                Active Task: <strong>T{selectedRobot.activeTask.task_id}</strong>
              </span>
            )}
            <button
              onClick={() => setSelectedRobotId(null)}
              className="text-cyan-400 hover:text-cyan-300 underline ml-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Grid Legend & Status Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 mb-5 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-800" />
            <span>Shelves</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-700" />
            <span>Pickup (P)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-700" />
            <span>Delivery (D)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <span>Traffic Delay</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span>Active Moving: <strong className="text-cyan-400">{activeCount}</strong></span>
          {delayedCount > 0 && (
            <span>Delayed: <strong className="text-amber-400">{delayedCount}</strong></span>
          )}
          <span>Clock: <strong className="text-white">{time.toFixed(1)}s</strong> / {duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Playback Controls & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayback}
            disabled={duration <= 0}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
            {playing ? "Pause" : "Play"}
          </button>

          <button
            onClick={() => handleSkip(-5)}
            disabled={duration <= 0 || time <= 0}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg p-2 transition-colors"
            title="Rewind 5 seconds"
          >
            <Rewind size={17} />
          </button>

          <button
            onClick={() => handleSkip(5)}
            disabled={duration <= 0 || time >= duration}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg p-2 transition-colors"
            title="Forward 5 seconds"
          >
            <FastForward size={17} />
          </button>

          <button
            onClick={() => {
              setPlaying(false);
              setTime(0);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>

        {/* Playback Speed Select */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Speed:</span>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  speed === s
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.05"
          value={Math.min(time, duration)}
          onChange={(e) => {
            setPlaying(false);
            setTime(Number(e.target.value));
          }}
          className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
        />

        <div className="flex justify-between text-xs text-slate-500 font-mono">
          <span>0.0s</span>
          <span>{(duration * 0.25).toFixed(1)}s</span>
          <span>{(duration * 0.5).toFixed(1)}s</span>
          <span>{(duration * 0.75).toFixed(1)}s</span>
          <span>{duration.toFixed(1)}s</span>
        </div>
      </div>
    </section>
  );
}
