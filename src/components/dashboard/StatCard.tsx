import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-[#facc15]/10 text-[#facc15] flex items-center justify-center">
          <Icon size={16} />
        </div>
      </div>
      <p className="text-3xl font-black text-white mt-3">{value}</p>
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}
