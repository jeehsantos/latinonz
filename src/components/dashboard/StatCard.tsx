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
    <div className="bg-neutral-900 border border-white/10 rounded-3xl p-5 sm:p-6 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 truncate">{label}</p>
        <div className="shrink-0 w-9 h-9 rounded-xl bg-[#df991b]/10 text-[#df991b] flex items-center justify-center">
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white mt-3 truncate">{value}</p>
      {hint && <p className="text-xs text-neutral-500 mt-1 truncate">{hint}</p>}
    </div>
  );

}
