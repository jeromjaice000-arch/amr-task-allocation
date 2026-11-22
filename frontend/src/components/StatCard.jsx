
export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
      <p className="text-slate-500 text-xs mt-2">{subtitle}</p>
    </div>
  );
}
