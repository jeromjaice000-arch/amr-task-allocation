import { useState } from "react";
import { Settings, RotateCcw, AlertTriangle, AlertCircle } from "lucide-react";
import { initialRobots, robotColors } from "../data/mockData";

const RECOMMENDED_SPEED_MIN = 0.2;
const RECOMMENDED_SPEED_MAX = 3.0;
const RECOMMENDED_CAP_MIN = 5;
const RECOMMENDED_CAP_MAX = 200;

function parsePositiveFinite(rawValue, fallback) {
  const trimmed = String(rawValue ?? "").trim();
  if (trimmed === "") {
    return { valid: true, value: fallback };
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || Number.isNaN(num) || num <= 0) {
    return { valid: false, value: null };
  }
  return { valid: true, value: num };
}

export default function RobotPanel({
  robots = [],
  metrics = null,
  assignments = [],
  onUpdateRobot,
  onResetRobot,
  onResetAllRobots,
  isSimulating = false
}) {
  const [editingId, setEditingId] = useState(null);
  const [speedInput, setSpeedInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [impracticalWarnings, setImpracticalWarnings] = useState([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const utilizationsByRobot = new Map();
  if (metrics?.robot_utilizations) {
    for (const u of metrics.robot_utilizations) {
      utilizationsByRobot.set(u.robot_id, u.utilization);
    }
  }

  const tasksCountByRobot = new Map();
  for (const a of assignments) {
    tasksCountByRobot.set(a.robot_id, (tasksCountByRobot.get(a.robot_id) || 0) + 1);
  }

  function getDefaultRobot(robotId) {
    return initialRobots.find((r) => r.id === robotId);
  }

  function openEditor(robot) {
    if (isSimulating) return;
    if (editingId === robot.id) {
      closeEditor();
      return;
    }
    setEditingId(robot.id);
    setSpeedInput(String(robot.speed));
    setCapacityInput(String(robot.capacity));
    setValidationError("");
    setImpracticalWarnings([]);
    setAwaitingConfirmation(false);
  }

  function closeEditor() {
    setEditingId(null);
    setValidationError("");
    setImpracticalWarnings([]);
    setAwaitingConfirmation(false);
  }

  function handleApply(robot, confirmed = false) {
    if (isSimulating) return;
    const def = getDefaultRobot(robot.id);

    const parsedSpeed = parsePositiveFinite(speedInput, def.speed);
    if (!parsedSpeed.valid) {
      setValidationError("Movement speed must be a finite positive number (> 0).");
      setImpracticalWarnings([]);
      setAwaitingConfirmation(false);
      return;
    }

    const parsedCap = parsePositiveFinite(capacityInput, def.capacity);
    if (!parsedCap.valid) {
      setValidationError("Payload capacity must be a finite positive number (> 0).");
      setImpracticalWarnings([]);
      setAwaitingConfirmation(false);
      return;
    }

    setValidationError("");

    const warnings = [];
    if (parsedSpeed.value < RECOMMENDED_SPEED_MIN || parsedSpeed.value > RECOMMENDED_SPEED_MAX) {
      warnings.push(
        `Movement speed of ${parsedSpeed.value} m/s is outside the recommended operating range of ${RECOMMENDED_SPEED_MIN}–${RECOMMENDED_SPEED_MAX} m/s.`
      );
    }
    if (parsedCap.value < RECOMMENDED_CAP_MIN || parsedCap.value > RECOMMENDED_CAP_MAX) {
      warnings.push(
        `Payload capacity of ${parsedCap.value} kg is outside the recommended operating range of ${RECOMMENDED_CAP_MIN}–${RECOMMENDED_CAP_MAX} kg.`
      );
    }

    if (warnings.length > 0 && !confirmed) {
      setImpracticalWarnings(warnings);
      setAwaitingConfirmation(true);
      return;
    }

    if (onUpdateRobot) {
      onUpdateRobot(robot.id, parsedSpeed.value, parsedCap.value);
    }
    closeEditor();
  }

  const hasCustomizations = robots.some((r) => {
    const def = getDefaultRobot(r.id);
    return def && (r.speed !== def.speed || r.capacity !== def.capacity);
  });

  const minSpeed = robots.length ? Math.min(...robots.map((r) => r.speed)) : 0;
  const maxSpeed = robots.length ? Math.max(...robots.map((r) => r.speed)) : 0;
  const minCap = robots.length ? Math.min(...robots.map((r) => r.capacity)) : 0;
  const maxCap = robots.length ? Math.max(...robots.map((r) => r.capacity)) : 0;

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Robot Fleet Status
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {robots.length} Heterogeneous AMRs
            </span>
          </div>

          {onResetAllRobots && (
            <button
              type="button"
              onClick={() => {
                closeEditor();
                onResetAllRobots();
              }}
              disabled={!hasCustomizations || isSimulating}
              title={
                isSimulating
                  ? "Stop or pause simulation before resetting fleet"
                  : "Reset all robots to default speed and capacity"
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <RotateCcw size={13} />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {isSimulating && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300">
            Pause or reset playback before modifying robot specifications.
          </div>
        )}

        <div className="space-y-3">
          {robots.map((robot) => {
            const color = robotColors[(robot.id - 1) % robotColors.length];
            const utilization = utilizationsByRobot.get(robot.id);
            const assignedTasks = tasksCountByRobot.get(robot.id) || 0;
            const def = getDefaultRobot(robot.id);
            const isCustomized =
              def && (robot.speed !== def.speed || robot.capacity !== def.capacity);
            const isEditing = editingId === robot.id;

            return (
              <div
                key={robot.id}
                className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3 transition-colors"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full ${color.bg} text-slate-950 font-bold inline-flex items-center justify-center text-xs shadow-sm`}
                    >
                      {robot.id}
                    </span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {robot.name}
                    </span>
                    {isCustomized && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                      {assignedTasks > 0 ? `${assignedTasks} Tasks` : robot.status}
                    </span>

                    {onUpdateRobot && (
                      <button
                        type="button"
                        onClick={() => openEditor(robot)}
                        disabled={isSimulating}
                        title={
                          isSimulating
                            ? "Stop simulation to configure robot"
                            : `Configure ${robot.name} speed and capacity`
                        }
                        aria-label={`Configure ${robot.name}`}
                        className={`p-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isEditing
                            ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
                            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Settings size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Speed: <strong className="text-slate-900 dark:text-slate-200">{robot.speed}</strong> m/s
                  </span>
                  <span>
                    Cap: <strong className="text-slate-900 dark:text-slate-200">{robot.capacity}</strong> kg
                  </span>
                  <span>Spawn: ({robot.x}, {robot.y})</span>
                </div>

                {/* Inline Configuration Panel */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Speed (m/s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={speedInput}
                          onChange={(e) => {
                            setSpeedInput(e.target.value);
                            setAwaitingConfirmation(false);
                            setImpracticalWarnings([]);
                            setValidationError("");
                          }}
                          placeholder={`Default: ${def?.speed}`}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Capacity (kg)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={capacityInput}
                          onChange={(e) => {
                            setCapacityInput(e.target.value);
                            setAwaitingConfirmation(false);
                            setImpracticalWarnings([]);
                            setValidationError("");
                          }}
                          placeholder={`Default: ${def?.capacity}`}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    {validationError && (
                      <div className="flex items-start gap-1.5 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] text-red-600 dark:text-red-300">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {impracticalWarnings.length > 0 && (
                      <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/35 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle size={13} className="shrink-0" />
                          Potentially impractical configuration for the modeled warehouse environment.
                        </p>
                        {impracticalWarnings.map((w, idx) => (
                          <p key={idx} className="pl-4">{w}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onResetRobot) onResetRobot(robot.id);
                          closeEditor();
                        }}
                        className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                      >
                        Reset to Default
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={closeEditor}
                          className="px-2.5 py-1 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>

                        {awaitingConfirmation ? (
                          <button
                            type="button"
                            onClick={() => handleApply(robot, true)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer transition-colors"
                          >
                            Confirm &amp; Apply
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApply(robot, false)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors"
                          >
                            Apply Configuration
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {utilization !== undefined && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Simulated Utilization</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color.bg}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
        <span>Speeds: {minSpeed} – {maxSpeed} m/s</span>
        <span>Capacities: {minCap} – {maxCap} kg</span>
      </div>
    </div>
  );
}
