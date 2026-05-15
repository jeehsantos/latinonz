export function StatCard({
  label,
  value,
  trend,
  hint,
}: {
  label: string;
  value: string;
  trend?: string;
  hint?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <p className="text-sm font-semibold text-gray-500 mb-2">{label}</p>
      <p className="text-3xl font-black text-gray-900 mb-2">{value}</p>
      <div className="flex items-center gap-1 text-xs">
        {trend && <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">{trend}</span>}
        {hint && <span className="text-gray-400">{hint}</span>}
      </div>
    </div>
  );
}
