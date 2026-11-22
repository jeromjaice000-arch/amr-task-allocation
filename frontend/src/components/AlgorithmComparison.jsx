
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
  }
];

export default function AlgorithmComparison({ comparison }) {
  if (!comparison) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="text-cyan-400" />
          Algorithm Comparison
        </h2>
        <p className="text-slate-400 mt-4">
          Run a simulation to compare both allocation algorithms.
        </p>
      </div>
    );
  }

  const nearest = comparison.nearest.metrics;
  const optimized = comparison.optimized.metrics;

  const improvement = nearest.makespan > 0
    ? ((nearest.makespan - optimized.makespan) /
        nearest.makespan) * 100
    : 0;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="text-cyan-400" />
        Algorithm Comparison
      </h2>

      <p className="text-slate-400 text-sm mt-2 mb-6">
        Both policies evaluated using identical robots and tasks.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric) => {
          const baseline = nearest[metric.key];
          const proposed = optimized[metric.key];

          const better = metric.lowerBetter
            ? proposed < baseline
            : proposed > baseline;

          const equal = proposed === baseline;

          return (
            <div
              key={metric.key}
              className="bg-slate-800 rounded-xl p-4"
            >
              <h3 className="text-sm text-slate-400 mb-4">
                {metric.label}
              </h3>

              <div className="flex justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-slate-400">
                    Nearest
                  </p>
                  <p className="font-bold text-lg">
                    {baseline}{metric.unit}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    Workload Aware
                  </p>
                  <p className="font-bold text-lg">
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
                  const width = Math.max(
                    0,
                    (item.value / maxValue) * 100
                  );

                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{item.label}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className={`text-xs mt-4 ${
                equal
                  ? "text-slate-400"
                  : better
                    ? "text-emerald-400"
                    : "text-amber-400"
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

      <div className="border border-slate-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="text-cyan-400" />
          <h3 className="font-semibold">
            Makespan Improvement
          </h3>
        </div>

        <p className={`text-3xl font-bold ${
          improvement > 0
            ? "text-emerald-400"
            : improvement < 0
              ? "text-amber-400"
              : "text-slate-300"
        }`}>
          {improvement > 0 ? "+" : ""}
          {improvement.toFixed(2)}%
        </p>

        <p className="text-sm text-slate-400 mt-2">
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
