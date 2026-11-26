import {
  LayoutDashboard,
  Warehouse,
  Bot,
  ListTodo,
  ChartNoAxesCombined
} from "lucide-react";

const menu = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "live-warehouse", name: "Live Warehouse", icon: Warehouse },
  { id: "robots", name: "Robots", icon: Bot },
  { id: "tasks", name: "Tasks", icon: ListTodo },
  { id: "analytics", name: "Analytics", icon: ChartNoAxesCombined }
];

export default function Sidebar({ activeSection = "dashboard", onSelectSection }) {
  function handleClick(id) {
    if (onSelectSection) {
      onSelectSection(id);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <aside className="w-64 theme-sidebar border-r p-6 hidden lg:flex flex-col justify-between sticky top-0 h-screen shrink-0 z-30 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Bot className="text-cyan-600 dark:text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-slate-900 dark:text-slate-100">
              AMR Control
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Warehouse Intelligence
            </p>
          </div>
        </div>

        {/* Workspace Section Heading */}
        <p className="px-3.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          WORKSPACE
        </p>

        {/* Navigation Items */}
        <nav aria-label="Workspace navigation" className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  isActive
                    ? "bg-cyan-500/12 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Meta */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Autonomous Mobile Robots
            </p>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
              title="System Online"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Fleet Task Allocation Platform
          </p>
        </div>
      </div>
    </aside>
  );
}
