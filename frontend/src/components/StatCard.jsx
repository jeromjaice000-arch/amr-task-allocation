export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  gradient = "from-cyan-500 to-blue-600"
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-slate-700/80 group">
      {/* Ambient background light on hover */}
      <div
        className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">
          {title}
        </p>

        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10 flex items-center justify-center text-white shadow-sm p-2`}
          >
            <Icon size={18} className="text-white drop-shadow" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
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
        <p className="text-slate-400 text-xs mt-2.5 flex items-center gap-1.5 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
          {subtitle}
        </p>
      )}
    </div>
  );
}
