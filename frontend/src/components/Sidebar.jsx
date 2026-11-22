
import {
  LayoutDashboard,
  Warehouse,
  Bot,
  ListTodo,
  ChartNoAxesCombined
} from "lucide-react";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Warehouse", icon: Warehouse },
  { name: "Robots", icon: Bot },
  { name: "Tasks", icon: ListTodo },
  { name: "Analytics", icon: ChartNoAxesCombined }
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden lg:block">
      <div className="flex items-center gap-3 mb-12">
        <Bot className="text-cyan-400" size={30} />
        <div>
          <h1 className="font-bold text-lg">AMR Control</h1>
          <p className="text-xs text-slate-400">Warehouse Intelligence</p>
        </div>
      </div>

      <nav className="space-y-2">
        {menu.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                index === 0
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-slate-400"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
