import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Ticket, X, Power, Trash2 } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { getMyCoupons, createCoupon, toggleCoupon, deleteCoupon } from "@/lib/coupons.functions";

export const Route = createFileRoute("/dashboard/coupons")({
  component: CouponsPage,
});

type CouponRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_value: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

function CouponsPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const unlocked = can(plan, "coupons");

  const queryClient = useQueryClient();
  const fetchCoupons = useServerFn(getMyCoupons);
  const createCouponFn = useServerFn(createCoupon);
  const toggleCouponFn = useServerFn(toggleCoupon);
  const deleteCouponFn = useServerFn(deleteCoupon);

  const { data } = useQuery({
    queryKey: ["my-coupons"],
    queryFn: () => fetchCoupons(),
    enabled: unlocked,
  });

  const coupons: CouponRow[] =
    data && (data as { ok?: boolean }).ok ? ((data as { coupons: CouponRow[] }).coupons ?? []) : [];

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    expiresAt: "",
  });

  function resetForm() {
    setForm({
      code: "",
      title: "",
      description: "",
      discountType: "percent",
      discountValue: "",
      expiresAt: "",
    });
    setFormError(null);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createCouponFn({
        data: {
          code: form.code.trim(),
          title: form.title.trim(),
          description: form.description.trim() || null,
          discountType: form.discountValue ? form.discountType : null,
          discountValue: form.discountValue ? Number(form.discountValue) : null,
          expiresAt: form.expiresAt || null,
        },
      }),
    onSuccess: (res) => {
      if (!(res as { ok?: boolean }).ok) {
        setFormError((res as { error?: string }).error ?? "Erro ao criar cupom");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Erro ao criar cupom"),
  });

  const toggleMutation = useMutation({
    mutationFn: (couponId: string) => toggleCouponFn({ data: { couponId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-coupons"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId: string) => deleteCouponFn({ data: { couponId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-coupons"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">{t("coupons.title")}</h1>
          <p className="text-neutral-400 mt-1">{t("coupons.subtitle")}</p>
        </div>
        {unlocked && (
          <button
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            className="bg-neutral-900 hover:bg-white/5 text-[#facc15] font-bold rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> {t("coupons.new_button")}
          </button>
        )}
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-extrabold text-white mb-4">{t("coupons.active_title")}</h2>

        {unlocked ? (
          coupons.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">Nenhum cupom criado ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-3xl p-6 border ${
                    c.is_active
                      ? "bg-amber-50 border-amber-200"
                      : "bg-neutral-950 border-white/10 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Ticket
                      className={c.is_active ? "text-amber-700" : "text-neutral-500"}
                      size={20}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleMutation.mutate(c.id)}
                        disabled={toggleMutation.isPending}
                        className="text-neutral-500 hover:text-neutral-200 p-1"
                        aria-label="Toggle"
                        title={c.is_active ? "Desativar" : "Ativar"}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover cupom ${c.code}?`)) deleteMutation.mutate(c.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-neutral-500 hover:text-red-600 p-1"
                        aria-label="Delete"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p
                    className={`font-extrabold tracking-wider text-2xl mt-3 ${
                      c.is_active ? "text-amber-700" : "text-neutral-400"
                    }`}
                  >
                    {c.code}
                  </p>
                  <p className="text-sm text-neutral-200">{c.title}</p>
                  {c.description && <p className="text-xs text-neutral-400 mt-1">{c.description}</p>}
                  {c.expires_at && (
                    <p className="text-xs text-neutral-500 mt-2">
                      {t("coupons.valid_until")} {c.expires_at}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Tag size={22} />
            </div>
            <p className="mt-5 font-extrabold text-white text-base">
              {t("coupons.locked_title")}
            </p>
            <Link
              to="/dashboard/upgrade"
              className="mt-4 inline-flex items-center bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              {t("coupons.upgrade_button")}
            </Link>
          </div>
        )}
      </div>

      {formOpen && unlocked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="bg-neutral-900 rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-lg">{t("coupons.new_button")}</h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-neutral-500 hover:text-neutral-200"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormError(null);
                createMutation.mutate();
              }}
              className="mt-4 space-y-3"
            >
              <input
                required
                type="text"
                placeholder="Código (ex: TACOS10)"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm uppercase tracking-wider"
                maxLength={30}
              />
              <input
                required
                type="text"
                placeholder="Título (ex: 10% off no primeiro pedido)"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm"
                maxLength={100}
              />
              <textarea
                rows={2}
                placeholder="Descrição (opcional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm resize-none"
                maxLength={500}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discountType: e.target.value as "percent" | "fixed",
                    }))
                  }
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm bg-neutral-900"
                >
                  <option value="percent">% Percentual</option>
                  <option value="fixed">$ Fixo</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Valor"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm"
              />
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-neutral-900 hover:bg-white/5 disabled:opacity-50 text-[#facc15] font-bold rounded-2xl py-3 text-sm"
              >
                {createMutation.isPending ? "Criando..." : "Criar cupom"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
