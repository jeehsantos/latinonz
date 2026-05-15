import { PLAN_COMPARISON, PLAN_LABELS } from "@/lib/plans";

export function PlanComparisonTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">Recurso</th>
              <th className="p-4 font-bold text-center">{PLAN_LABELS.starter}</th>
              <th className="p-4 font-bold text-center">{PLAN_LABELS.premium}</th>
              <th className="p-4 font-bold text-center text-[#1A5336]">{PLAN_LABELS.ultra}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {PLAN_COMPARISON.map((row) => (
              <tr key={row.feature} className={row.highlight ? "bg-amber-50/30" : ""}>
                <td className="p-4 font-semibold text-gray-800">{row.feature}</td>
                <td className="p-4 text-center text-gray-600">{row.starter}</td>
                <td className="p-4 text-center text-gray-600">{row.premium}</td>
                <td className="p-4 text-center text-[#1A5336] font-bold">{row.ultra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
