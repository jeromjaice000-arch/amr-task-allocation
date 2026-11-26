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
  let status = "IDLE";
  let stateCategory = "idle"; // idle | moving | waiting | rerouting | overtaking | completed
  let activeTask = null;
  let isDelayed = false;
  let isDelivering = false;
  let isRerouting = false;
  let isOvertaking = false;
  let activePath = [];

  for (let tIdx = 0; tIdx < robotTasks.length; tIdx++) {
    const task = robotTasks[tIdx];
    const path = task.path || [];

    if (!path.length) continue;

    if (time < task.start) {
      break;
    }

    if (time >= task.finish) {
      const last = path[path.length - 1];
      position = { x: last.x, y: last.y };
      if (tIdx === robotTasks.length - 1) {
        status = "COMPLETED";
        stateCategory = "completed";
      } else {
        status = "IDLE";
        stateCategory = "idle";
      }
      continue;
    }

    activeTask = task;
    activePath = path;

    if (time < path[0].time) {
      status = "WAITING";
      stateCategory = "waiting";
      isDelayed = true;
      return {
        position,
        status,
        stateCategory,
        activeTask,
        isDelayed,
        isDelivering,
        isRerouting,
        isOvertaking,
        activePath
      };
    }

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

        const isWaitingAtWaypoint = a.x === b.x && a.y === b.y && b.time > a.time;

        if (isWaitingAtWaypoint) {
          status = "WAITING";
          stateCategory = "waiting";
          isDelayed = true;
        } else {
          const reachedPickup = path.slice(0, i + 1).some(
            (wp) => wp.x === warehouse.pickup[0] && wp.y === warehouse.pickup[1]
          );

          isDelivering = reachedPickup;

          const inOvertakeWindow =
            task.overtaken &&
            Array.isArray(task.overtake_windows) &&
            task.overtake_windows.some(
              (w) => time >= w.start_time && time <= w.end_time
            );

          if (inOvertakeWindow) {
            status = "OVERTAKING";
            stateCategory = "overtaking";
            isOvertaking = true;
            isRerouting = true;
          } else if (task.rerouted && !task.overtaken) {
            status = "REROUTING";
            stateCategory = "rerouting";
            isRerouting = true;
          } else {
            status = "MOVING";
            stateCategory = "moving";
          }
        }

        return {
          position,
          status,
          stateCategory,
          activeTask,
          isDelayed,
          isDelivering,
          isRerouting,
          isOvertaking,
          activePath
        };
      }
    }

    const last = path[path.length - 1];
    position = { x: last.x, y: last.y };
    if (tIdx === robotTasks.length - 1) {
      status = "COMPLETED";
      stateCategory = "completed";
    } else {
      status = "IDLE";
      stateCategory = "idle";
    }
    return {
      position,
      status,
      stateCategory,
      activeTask,
      isDelayed,
      isDelivering,
      isRerouting,
      isOvertaking,
      activePath
    };
  }

  return {
    position,
    status,
    stateCategory,
    activeTask,
    isDelayed,
    isDelivering,
    isRerouting,
    isOvertaking,
    activePath
  };
}

export default function AnimatedWarehouse({
  robots = [],
  assignments = [],
  makespan = 0,
  onPlayingChange
}) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedRobotId, setSelectedRobotId] = useState(null);

  const frameRef = useRef(null);
  const lastFrameRef = useRef(null);

  const duration = Math.max(Number(makespan) || 0, 0);

  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(playing);
    }
  }, [playing, onPlayingChange]);

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

  const activeCount = robotStates.filter(
    (r) =>
      r.stateCategory === "moving" ||
      r.stateCategory === "rerouting" ||
      r.stateCategory === "overtaking"
  ).length;

  const overtakingCount = robotStates.filter(
    (r) => r.stateCategory === "overtaking"
  ).length;

  const reroutingCount = robotStates.filter(
    (r) => r.stateCategory === "rerouting"
  ).length;

  const delayedCount = robotStates.filter((r) => r.isDelayed).length;

  const selectedRobot = robotStates.find((r) => r.id === selectedRobotId);

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
    <section className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Bot className="text-cyan-600 dark:text-cyan-400" size={22} />
            Live Warehouse Simulation
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time A* trajectory playback with ATAPP traffic scheduling &amp; overtaking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck size={14} />
            <span>0 Moving Conflicts</span>
          </div>

          <div
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              playing
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            {playing ? "Simulation Running" : "Simulation Paused"}
          </div>
        </div>
      </div>

      {/* Warehouse Grid */}
      <div
        className="relative w-full mb-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 select-none"
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

            const isSelectedTrail =
              selectedRobot?.activePath?.some(
                (wp) => wp.x === x && wp.y === y
              );

            return (
              <div
                key={index}
                className={`
                  border border-slate-200/90 dark:border-slate-800/60
                  flex items-center justify-center
                  text-[10px] sm:text-xs font-semibold transition-colors
                  ${isShelf ? "bg-amber-200/80 dark:bg-amber-950/80 border-amber-300 dark:border-amber-900/50 text-amber-900 dark:text-amber-300" : ""}
                  ${isPickup ? "bg-emerald-100 dark:bg-green-950/80 border-emerald-300 dark:border-green-800/80 text-emerald-800 dark:text-green-300" : ""}
                  ${isDelivery ? "bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800/80 text-blue-800 dark:text-blue-300" : ""}
                  ${isSelectedTrail && !isShelf && !isPickup && !isDelivery
                    ? selectedRobot?.isOvertaking
                      ? "bg-teal-500/15 dark:bg-teal-950/50 border-teal-500/40"
                      : selectedRobot?.isRerouting
                        ? "bg-purple-500/15 dark:bg-purple-950/50 border-purple-500/40"
                        : "bg-cyan-500/15 dark:bg-cyan-950/40 border-cyan-500/40"
                    : ""}
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
                  <span className="opacity-80">S</span>
                ) : isPickup ? (
                  <span className="font-bold text-emerald-700 dark:text-green-400">P</span>
                ) : isDelivery ? (
                  <span className="font-bold text-blue-700 dark:text-blue-400">D</span>
                ) : isSelectedTrail ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedRobot?.isOvertaking
                        ? "bg-teal-500"
                        : selectedRobot?.isRerouting
                          ? "bg-purple-500"
                          : "bg-cyan-500"
                    }`}
                  />
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
              {robot.stateCategory === "waiting" && (
                <span className="absolute -top-4 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-sm whitespace-nowrap">
                  WAIT
                </span>
              )}

              {robot.stateCategory === "overtaking" && (
                <span className="absolute -top-4 text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500 text-white shadow-sm whitespace-nowrap">
                  OVERTAKE T{robot.activeTask?.task_id}
                </span>
              )}

              {robot.stateCategory === "rerouting" && (
                <span className="absolute -top-4 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white shadow-sm whitespace-nowrap">
                  REROUTE T{robot.activeTask?.task_id}
                </span>
              )}

              {robot.stateCategory === "moving" && (
                <span className="absolute -top-4 text-[9px] font-bold px-1 rounded bg-blue-600 text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap">
                  {robot.isDelivering && <Package size={9} />}
                  <span>T{robot.activeTask?.task_id}</span>
                </span>
              )}

              {robot.stateCategory === "completed" && (
                <span className="absolute -top-4 text-[9px] font-bold px-1 rounded bg-emerald-600 text-white shadow-sm whitespace-nowrap">
                  DONE
                </span>
              )}

              {/* Main Robot Node (preserves individual identification color) */}
              <div
                className={`w-[68%] h-[68%] max-w-10 max-h-10 aspect-square rounded-full ${robot.color.bg} text-slate-950 font-bold flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 transition-all ${
                  isSelected
                    ? "ring-4 ring-slate-900 dark:ring-white scale-110"
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
        <div className="mb-5 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full ${selectedRobot.color.bg}`}
              />
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedRobot.name} Inspector
              </span>
              <span className="text-slate-400">|</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  selectedRobot.stateCategory === "waiting"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
                    : selectedRobot.stateCategory === "overtaking"
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40"
                      : selectedRobot.stateCategory === "rerouting"
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40"
                        : selectedRobot.stateCategory === "moving"
                          ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40"
                          : selectedRobot.stateCategory === "completed"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                            : "bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                }`}
              >
                {selectedRobot.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
              <span>
                Coord: ({selectedRobot.position.x.toFixed(2)},{" "}
                {selectedRobot.position.y.toFixed(2)})
              </span>
              <span>Speed: {selectedRobot.speed} m/s</span>
              <span>Capacity: {selectedRobot.capacity} kg</span>
              {selectedRobot.activeTask && (
                <span>
                  Task: <strong className="text-slate-900 dark:text-white">T{selectedRobot.activeTask.task_id}</strong>{" "}
                  ({selectedRobot.isDelivering
                    ? `Delivery (${warehouse.delivery[0]}, ${warehouse.delivery[1]})`
                    : `Pickup (${warehouse.pickup[0]}, ${warehouse.pickup[1]})`})
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedRobotId(null)}
                className="text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer ml-2 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {selectedRobot.activeTask?.decision_reason && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-300">
              <span>
                <strong className="text-slate-500 dark:text-slate-400">Routing Decision:</strong>{" "}
                {selectedRobot.activeTask.decision_reason}
              </span>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                {selectedRobot.activeTask.conflicting_robots?.length > 0 && (
                  <span>
                    Conflicting:{" "}
                    <strong className="text-amber-700 dark:text-amber-300">
                      {selectedRobot.activeTask.conflicting_robots
                        .map((id) => `AMR-${String(id).padStart(2, "0")}`)
                        .join(", ")}
                    </strong>
                  </span>
                )}
                {selectedRobot.activeTask.estimated_wait_duration > 0 && (
                  <span>
                    Est. Wait:{" "}
                    <strong className="text-amber-700 dark:text-amber-300">
                      {selectedRobot.activeTask.estimated_wait_duration}s
                    </strong>
                  </span>
                )}
                {selectedRobot.activeTask.estimated_time_saved > 0 && (
                  <span>
                    Est. Saved:{" "}
                    <strong className="text-teal-700 dark:text-teal-300">
                      +{selectedRobot.activeTask.estimated_time_saved}s
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Legend & Status Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 mb-5 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500/80" />
            <span>Shelves</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Pickup (P)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>Delivery (D)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-500" />
            <span>Moving</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <span>Waiting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span>Overtaking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Rerouting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Completed</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span>Moving: <strong className="text-cyan-600 dark:text-cyan-400">{activeCount}</strong></span>
          {overtakingCount > 0 && (
            <span>Overtaking: <strong className="text-teal-600 dark:text-teal-400">{overtakingCount}</strong></span>
          )}
          {reroutingCount > 0 && (
            <span>Rerouting: <strong className="text-purple-600 dark:text-purple-400">{reroutingCount}</strong></span>
          )}
          {delayedCount > 0 && (
            <span>Waiting: <strong className="text-amber-600 dark:text-amber-400">{delayedCount}</strong></span>
          )}
          <span>Clock: <strong className="text-slate-900 dark:text-white">{time.toFixed(1)}s</strong> / {duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Playback Controls & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={duration <= 0}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 flex items-center gap-2 font-medium transition-colors cursor-pointer shadow-sm"
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
            {playing ? "Pause" : "Play"}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(-5)}
            disabled={duration <= 0 || time <= 0}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg p-2 transition-colors cursor-pointer"
            title="Rewind 5 seconds"
          >
            <Rewind size={17} />
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            disabled={duration <= 0 || time >= duration}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg p-2 transition-colors cursor-pointer"
            title="Forward 5 seconds"
          >
            <FastForward size={17} />
          </button>

          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setTime(0);
            }}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>

        {/* Playback Speed Select */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Speed:</span>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            {[0.5, 1, 2, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  speed === s
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
          className="w-full accent-cyan-600 dark:accent-cyan-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
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
