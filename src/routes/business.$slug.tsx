import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, Star, Phone, Mail, Globe, MessageCircle, Clock, Ticket, Image as ImageIcon } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PlanBadge } from "@/components/PlanBadge";
import { getBusinessBySlug, REVIEWS_BY_BUSINESS, COUPONS_BY_BUSINESS } from "@/lib/mock/businesses";
import { can, getLimit } from "@/lib/plans";

export const Route = createFileRoute("/business/$slug")({
  loader: ({ params }) => {
    const business = getBusinessBySlug(params.slug);
    if (!business) throw notFound();
    return { business };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.business.name ?? "Negócio"} — Latino Connect` },
      { name: "description", content: loaderData?.business.description ?? "" },
      { property: "og:title", content: loaderData?.business.name ?? "" },
      { property: "og:description", content: loaderData?.business.description ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-black text-gray-900">Negócio não encontrado</h1>
        <Link to="/directory" className="inline-flex mt-6 bg-[#1A5336] text-white font-bold px-5 py-2.5 rounded-xl">
          Voltar ao diretório
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-red-600">{error.message}</p>
      </div>
    </SiteShell>
  ),
  component: BusinessPage,
});

function BusinessPage() {
  const { business } = Route.useLoaderData() as { business: NonNullable<ReturnType<typeof getBusinessBySlug>> };
  const reviews = REVIEWS_BY_BUSINESS[business.slug] ?? [];
  const coupons = can(business.plan, "coupons") ? COUPONS_BY_BUSINESS[business.slug] ?? [] : [];
  const photoLimit = getLimit(business.plan, "photoLimit");
  const photoCount = Number.isFinite(photoLimit) ? Math.min(photoLimit, 6) : 6;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F3D24] via-[#1A5336] to-[#0F3D24] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link to="/directory" className="text-sm text-white/60 hover:text-white">← Voltar ao diretório</Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase bg-white/15 px-2 py-0.5 rounded-full">{business.type}</span>
                <PlanBadge plan={business.plan} />
                {business.fastResponder && (
                  <span className="text-[10px] font-bold uppercase bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                    Resposta rápida
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-4xl md:text-5xl font-black">{business.name}</h1>
              <p className="mt-2 text-white/70 max-w-2xl">{business.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-white/80"><MapPin size={14} /> {business.location}</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Star size={14} className="fill-amber-400 text-amber-400" /> {business.rating.toFixed(1)}
                  <span className="text-white/50">({business.reviewCount} avaliações)</span>
                </span>
                <span className="text-white/60">{business.subcategory}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8">
            <h2 className="font-extrabold text-gray-900">Sobre</h2>
            <p className="mt-3 text-gray-600">{business.description}</p>
            {business.tags && (
              <div className="mt-5 flex flex-wrap gap-2">
                {business.tags.map((t) => (
                  <span key={t} className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900 flex items-center gap-2"><ImageIcon size={18} /> Galeria</h2>
              <p className="text-xs text-gray-400">
                {Number.isFinite(photoLimit) ? `Até ${photoLimit} fotos (${PLAN_NAME(business.plan)})` : "Galeria completa"}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: photoCount }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 via-amber-100 to-emerald-50"
                />
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8">
            <h2 className="font-extrabold text-gray-900">Avaliações</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Nenhuma avaliação ainda.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">{r.name}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            size={14}
                            className={j < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {/* Contact card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sticky top-24">
            <h3 className="font-extrabold text-gray-900">Contato</h3>
            <div className="mt-4 space-y-3 text-sm">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-[#1A5336]">
                  <Phone size={16} /> {business.phone}
                </a>
              )}
              {can(business.plan, "leadWhatsapp") && business.phone && (
                <a href="#" className="flex items-center gap-3 text-gray-700 hover:text-[#1A5336]">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-3 text-gray-700 hover:text-[#1A5336]">
                  <Mail size={16} /> {business.email}
                </a>
              )}
              {business.website && (
                <a href={business.website} className="flex items-center gap-3 text-gray-700 hover:text-[#1A5336]">
                  <Globe size={16} /> Site
                </a>
              )}
            </div>
            <button className="mt-6 w-full bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-2xl py-3 text-sm">
              Enviar mensagem
            </button>
            {business.responseTime && (
              <p className="text-xs text-gray-400 text-center mt-3">{business.responseTime}</p>
            )}
          </div>

          {/* Hours */}
          {business.hours && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><Clock size={16} /> Horário</h3>
              <div className="mt-3 space-y-2 text-sm">
                {business.hours.map((h) => (
                  <div key={h.label} className="flex justify-between">
                    <span className="text-gray-500">{h.label}</span>
                    <span className="font-semibold text-gray-800">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupons */}
          {coupons.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <h3 className="font-extrabold text-amber-900 flex items-center gap-2"><Ticket size={16} /> Cupons</h3>
              <div className="mt-3 space-y-3">
                {coupons.map((c) => (
                  <div key={c.code} className="bg-white rounded-2xl p-4 border border-amber-200">
                    <p className="font-extrabold text-amber-700 text-lg tracking-wider">{c.code}</p>
                    <p className="text-sm text-gray-700">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Válido até {c.expiresAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </SiteShell>
  );
}

function PLAN_NAME(p: string) {
  return p === "starter" ? "Plano Starter" : p === "premium" ? "Premium" : "Ultra";
}
