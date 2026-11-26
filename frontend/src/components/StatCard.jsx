export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  gradient = "from-cyan-500 to-blue-600"
}) {
  return (
    <div className="relative overflow-hidden rounded-xl glass-card p-5 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-wide uppercase">
          {title}
        </p>

        {Icon && (
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}
          >
            <Icon size={18} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </h2>

        {badge && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2.5 flex items-center gap-1.5 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
}
