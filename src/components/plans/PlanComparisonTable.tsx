import { PLAN_LABELS } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";

type Row = {
  feature: string;
  starter: string;
  premium: string;
  ultra: string;
  highlight?: boolean;
};

export function PlanComparisonTable() {
  const { t, raw } = useI18n();
  const rows = raw<Row[]>("plans.comparison_rows") ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">{t("plans.table_feature")}</th>
              <th className="p-4 font-bold text-center">{PLAN_LABELS.starter}</th>
              <th className="p-4 font-bold text-center">{PLAN_LABELS.premium}</th>
              <th className="p-4 font-bold text-center text-[#000000]">{PLAN_LABELS.ultra}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.feature} className={row.highlight ? "bg-amber-50/30" : ""}>
                <td className="p-4 font-semibold text-gray-800">{row.feature}</td>
                <td className="p-4 text-center text-gray-600">{row.starter}</td>
                <td className="p-4 text-center text-gray-600">{row.premium}</td>
                <td className="p-4 text-center text-[#000000] font-bold">{row.ultra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
