import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "About — Latino Connect" },
      {
        name: "description",
        content: "Learn about Latino Connect Hub's mission: connecting the Latin community in NZ.",
      },
      { property: "og:title", content: "About Latino Connect" },
      {
        property: "og:description",
        content:
          "Mission, vision and values of the platform connecting the Latin community in New Zealand.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/sobre" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/sobre" }],
  }),
  component: SobrePage,
});

function SobrePage() {
  const { t } = useI18n();
  usePageMetadata("metadata.sobre.title", "metadata.sobre.description");
  return (
    <SiteShell>
      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-wider text-[#facc15]">
          {t("about.badge")}
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-white">{t("about.title")}</h1>
        <p className="mt-6 text-lg text-neutral-300 leading-relaxed">{t("about.body")}</p>
        <div className="mt-10 grid sm:grid-cols-2 gap-6">
          <div className="bg-neutral-950 border border-white/10 rounded-3xl p-6">
            <p className="font-extrabold text-white">{t("about.mission_title")}</p>
            <p className="mt-2 text-sm text-neutral-300">{t("about.mission_body")}</p>
          </div>
          <div className="bg-neutral-950 border border-white/10 rounded-3xl p-6">
            <p className="font-extrabold text-white">{t("about.vision_title")}</p>
            <p className="mt-2 text-sm text-neutral-300">{t("about.vision_body")}</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
