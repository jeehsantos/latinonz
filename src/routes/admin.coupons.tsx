import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ExternalLink, Ticket, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAdminCouponPromos } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({
    meta: [
      { title: "Promo coupons — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminCouponsPage,
});

type PromoCoupon = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_value: number | null;
  expires_at: string | null;
  promo_image_url: string | null;
  created_at: string;
  business: { id: string; name: string; slug: string; logo_url: string | null } | null;
};

function discountLabel(c: PromoCoupon) {
  if (!c.discount_value) return null;
  return c.discount_type === "percent"
    ? `${c.discount_value}% OFF`
    : `$${c.discount_value} OFF`;
}

function AdminCouponsPage() {
  const fetchPromos = useServerFn(getAdminCouponPromos);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupon-promos"],
    queryFn: () => fetchPromos(),
  });
  const coupons: PromoCoupon[] = (data?.coupons ?? []) as PromoCoupon[];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function buildCaption(c: PromoCoupon) {
    const lines = [
      `🎉 ${c.business?.name ?? ""} — ${c.title}`,
      c.description ?? "",
      discountLabel(c) ? `💸 ${discountLabel(c)}` : "",
      `🏷️ Código: ${c.code}`,
      c.expires_at ? `📅 Válido até ${c.expires_at}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  }

  async function copyCaption(c: PromoCoupon) {
    try {
      await navigator.clipboard.writeText(buildCaption(c));
      setCopiedId(c.id);
      toast.success("Legenda copiada");
      setTimeout(() => setCopiedId((id) => (id === c.id ? null : id)), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Ticket className="text-[#df991b]" /> Cupons promocionais
        </h1>
        <p className="text-neutral-400 mt-1">
          Imagens enviadas pelos negócios para divulgação na nossa comunidade.
        </p>
      </div>

      {isLoading ? (
        <p className="text-neutral-400 text-sm">Carregando…</p>
      ) : coupons.length === 0 ? (
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-10 text-center">
          <Ticket className="mx-auto text-neutral-600 mb-3" size={32} />
          <p className="text-neutral-400">
            Nenhum negócio enviou imagem promocional ainda.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col"
            >
              {c.promo_image_url && (
                <div className="aspect-video bg-neutral-950 overflow-hidden">
                  <img
                    src={c.promo_image_url}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {c.business?.logo_url ? (
                    <img
                      src={c.business.logo_url}
                      alt={c.business.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-neutral-800 text-[#df991b] flex items-center justify-center font-bold">
                      {(c.business?.name ?? "?").charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{c.business?.name ?? "—"}</p>
                    {c.business?.slug && (
                      <a
                        href={`/business/${c.business.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-neutral-400 hover:text-[#df991b] inline-flex items-center gap-1"
                      >
                        ver perfil <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-extrabold text-white text-lg leading-snug">{c.title}</p>
                  {c.description && (
                    <p className="text-sm text-neutral-400 mt-1">{c.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold tracking-wider bg-[#df991b] text-neutral-900 rounded-full px-3 py-1">
                    {c.code}
                  </span>
                  {discountLabel(c) && (
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1">
                      {discountLabel(c)}
                    </span>
                  )}
                  {c.expires_at && (
                    <span className="text-xs text-neutral-400 rounded-full px-2 py-1 border border-white/10">
                      até {c.expires_at}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex gap-2 pt-2">
                  <a
                    href={c.promo_image_url ?? "#"}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#df991b] hover:bg-[#c4861a] text-neutral-900 font-bold rounded-xl px-3 py-2 text-sm flex items-center justify-center gap-2"
                  >
                    <Download size={14} /> Baixar imagem
                  </a>
                  <button
                    onClick={() => copyCaption(c)}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl px-3 py-2 text-sm flex items-center gap-2"
                  >
                    {copiedId === c.id ? <Check size={14} /> : <Copy size={14} />}
                    Legenda
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
