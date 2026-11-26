import { BarChart3, TrendingDown } from "lucide-react";

const metrics = [
  {
    key: "makespan",
    label: "Makespan",
    unit: "s",
    lowerBetter: true
  },
  {
    key: "utilization_spread",
    label: "Utilisation Spread",
    unit: "%",
    lowerBetter: true
  },
  {
    key: "tasks_per_hour",
    label: "Tasks Completed / Hour",
    unit: "",
    lowerBetter: false
  },
  {
    key: "total_waiting_time",
    label: "Traffic Delay",
    unit: "s",
    lowerBetter: true
  }
];

export default function AlgorithmComparison({ comparison }) {
  if (!comparison) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <BarChart3 className="text-cyan-600 dark:text-cyan-400" />
          Algorithm Comparison
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
          Run a simulation to compare both allocation algorithms under identical fleet &amp; traffic rules.
        </p>
      </div>
    );
  }

  const nearest = comparison.nearest.metrics;
  const optimized = comparison.optimized.metrics;
  const strategyLabel =
    comparison.nearest.traffic_strategy === "adaptive"
      ? "ATAPP (Adaptive)"
      : "Standard (Wait-Based)";

  const improvement = nearest.makespan > 0
    ? ((nearest.makespan - optimized.makespan) / nearest.makespan) * 100
    : 0;

  return (
    <section className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <BarChart3 className="text-cyan-600 dark:text-cyan-400" />
          Algorithm Comparison
        </h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          Traffic Strategy: {strategyLabel}
        </span>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6">
        Both policies evaluated using identical customized robots, tasks, and traffic rules.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => {
          const baseline = nearest[metric.key] ?? 0;
          const proposed = optimized[metric.key] ?? 0;

          const better = metric.lowerBetter
            ? proposed < baseline
            : proposed > baseline;

          const equal = proposed === baseline;

          return (
            <div
              key={metric.key}
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4"
            >
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                {metric.label}
              </h3>

              <div className="flex justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nearest
                  </p>
                  <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {baseline}{metric.unit}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Workload Aware
                  </p>
                  <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {proposed}{metric.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Nearest", value: baseline, color: "bg-cyan-500" },
                  { label: "Optimized", value: proposed, color: "bg-violet-500" }
                ].map((item) => {
                  const maxValue = Math.max(baseline, proposed, 0.001);
                  const width = Math.max(0, (item.value / maxValue) * 100);

                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>{item.label}</span>
                      </div>
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className={`text-xs mt-4 font-medium ${
                equal
                  ? "text-slate-500 dark:text-slate-400"
                  : better
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
              }`}>
                {equal
                  ? "Both algorithms performed equally"
                  : better
                    ? "Workload-aware performed better"
                    : "Nearest-available performed better"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="text-cyan-600 dark:text-cyan-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Makespan Improvement
          </h3>
        </div>

        <p className={`text-3xl font-bold ${
          improvement > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : improvement < 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-600 dark:text-slate-300"
        }`}>
          {improvement > 0 ? "+" : ""}
          {improvement.toFixed(2)}%
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {improvement > 0
            ? "Workload-aware allocation reduced total completion time."
            : improvement < 0
              ? "Workload-aware allocation increased total completion time."
              : "Both algorithms achieved the same makespan."}
        </p>
      </div>
    </section>
  );
}
