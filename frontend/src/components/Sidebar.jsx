import {
  LayoutDashboard,
  Warehouse,
  Bot,
  ListTodo,
  ChartNoAxesCombined
} from "lucide-react";

const menu = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "warehouse", name: "Warehouse", icon: Warehouse },
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden lg:flex flex-col justify-between sticky top-0 h-screen shrink-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Bot className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">AMR Control</h1>
            <p className="text-[11px] text-slate-400">Warehouse Intelligence</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Meta */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-slate-200">
              Autonomous Mobile Robots
            </p>
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
              title="System Online"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Fleet Task Allocation Platform
          </p>
        </div>
      </div>
    </aside>
  );
}
